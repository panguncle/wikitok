import { useState, useCallback, useEffect } from "react";
import { useLocalization } from "./useLocalization";
import { useGeolocation } from "./useGeolocation";
import type { WikiArticle } from "../types/WikiArticle";

const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve();
    img.onerror = reject;
  });
};

const fetchRelatedArticles = async (pageId: number, language: string): Promise<WikiArticle[]> => {
  try {
    // 获取出链（links）和入链（linkshere）
    const linksParams = new URLSearchParams({
      action: "query",
      format: "json",
      prop: "links|linkshere",
      plnamespace: "0",
      pllimit: "20",
      lhnamespace: "0",
      lhlimit: "20",
      pageids: pageId.toString(),
      origin: "*",
    });

    const linksResponse = await fetch(`https://${language}.wikipedia.org/w/api.php?${linksParams}`);
    const linksData = await linksResponse.json();
    
    if (!linksData.query?.pages?.[pageId]) {
      console.log('No links data found for page:', pageId);
      return [];
    }

    const page = linksData.query.pages[pageId];
    const outgoingLinks = page.links || [];
    const incomingLinks = page.linkshere || [];
    
    // 合并入链和出链，去重
    const allLinks = [...outgoingLinks, ...incomingLinks];
    const uniqueTitles = Array.from(new Set(allLinks.map((link: any) => link.title)));
    const linkedTitles = uniqueTitles.slice(0, 10).join('|'); // 限制相关文章数量

    console.log(`Found ${uniqueTitles.length} unique links for article ${pageId}`);

    // 获取链接文章的详细信息
    const detailsParams = new URLSearchParams({
      action: "query",
      format: "json",
      prop: "extracts|info|pageimages",
      inprop: "url|varianttitles",
      exintro: "1",
      exlimit: "max",
      exsentences: "3",
      explaintext: "1",
      piprop: "thumbnail",
      pithumbsize: "800",
      titles: linkedTitles,
      origin: "*",
    });

    const detailsResponse = await fetch(`https://${language}.wikipedia.org/w/api.php?${detailsParams}`);
    const detailsData = await detailsResponse.json();

    if (!detailsData.query?.pages) {
      console.log('No details found for linked articles');
      return [];
    }

    const relatedArticles = Object.values(detailsData.query.pages)
      .map((page: any): WikiArticle => ({
        title: page.title,
        displaytitle: page.title,
        extract: page.extract || "",
        pageid: page.pageid,
        thumbnail: page.thumbnail,
        url: page.canonicalurl || `https://${language}.wikipedia.org/?curid=${page.pageid}`,
      }))
      .filter(article => 
        article.title && 
        article.pageid && 
        article.extract && 
        article.thumbnail?.source // 只保留有缩略图的文章
      )
      .slice(0, 5);

    console.log(`Returning ${relatedArticles.length} related articles for ${pageId}`);
    return relatedArticles;
  } catch (error) {
    console.error("Error fetching related articles:", error);
    return [];
  }
};

const getLocationBasedQuery = (country: string): string => {
  // 根据国家生成相关的搜索词
  const countryTerms = {
    China: "中国|北京|上海|广州|深圳",
    Japan: "日本|東京|大阪|京都",
    Korea: "한국|서울|부산",
    Germany: "Deutschland|Berlin|München",
    France: "France|Paris|Lyon",
    Italy: "Italia|Roma|Milano",
    Spain: "España|Madrid|Barcelona",
    Russia: "Россия|Москва|Санкт-Петербург",
    // 可以添加更多国家和相关搜索词
  };

  return countryTerms[country as keyof typeof countryTerms] || "";
};

export function useWikiArticles() {
  const [articles, setArticles] = useState<WikiArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [buffer, setBuffer] = useState<WikiArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { currentLanguage } = useLocalization();
  const { country, language, loading: geoLoading } = useGeolocation();

  const searchArticles = useCallback(async (query: string) => {
    if (!query.trim()) {
      setArticles([]);
      fetchArticles();
      return;
    }
    setLoading(true);
    try {
      await fetchArticles(false, query);
    } catch (error) {
      console.error("Error searching articles:", error);
    } finally {
      setLoading(false);
    }
  }, [currentLanguage]);

  const fetchArticles = async (forBuffer = false, query?: string) => {
    if (loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        action: "query",
        format: "json",
        prop: "extracts|info|pageimages",
        inprop: "url|varianttitles",
        exintro: "1",
        exlimit: "max",
        exsentences: "5",
        explaintext: "1",
        piprop: "thumbnail",
        pithumbsize: "800",
        origin: "*",
        variant: currentLanguage.id,
      });

      if (query) {
        params.append("list", "search");
        params.append("srsearch", query);
        params.append("srlimit", "20");
      } else {
        // 如果没有搜索查询，并且是首次加载，添加地区相关的搜索词
        if (articles.length === 0 && !forBuffer && country) {
          const locationQuery = getLocationBasedQuery(country);
          if (locationQuery) {
            params.append("list", "search");
            params.append("srsearch", locationQuery);
            params.append("srlimit", "10");
          } else {
            params.append("generator", "random");
            params.append("grnnamespace", "0");
            params.append("grnlimit", "20");
          }
        } else {
          params.append("generator", "random");
          params.append("grnnamespace", "0");
          params.append("grnlimit", "20");
        }
      }

      const response = await fetch(currentLanguage.api + params);
      const data = await response.json();

      let newArticles: WikiArticle[];
      if (query || (articles.length === 0 && !forBuffer && country)) {
        const pageIds = data.query.search.map((page: any) => page.pageid).join('|');
        
        const detailsParams = new URLSearchParams({
          action: "query",
          format: "json",
          pageids: pageIds,
          prop: "extracts|info|pageimages",
          inprop: "url|varianttitles",
          exintro: "1",
          exlimit: "max",
          exsentences: "5",
          explaintext: "1",
          piprop: "thumbnail",
          pithumbsize: "800",
          origin: "*",
          variant: currentLanguage.id,
        });

        const detailsResponse = await fetch(currentLanguage.api + detailsParams);
        const detailsData = await detailsResponse.json();

        newArticles = Object.values(detailsData.query.pages)
          .map((page: any): WikiArticle => ({
            title: page.title,
            displaytitle: page.title,
            extract: page.extract || data.query.search.find((s: any) => s.pageid === page.pageid)?.snippet.replace(/<\/?[^>]+(>|$)/g, ""),
            pageid: page.pageid,
            thumbnail: page.thumbnail,
            url: page.canonicalurl,
          }))
          .filter(
            (article) =>
              article.thumbnail &&
              article.thumbnail.source &&
              article.url &&
              article.extract
          );
      } else {
        newArticles = Object.values(data.query.pages)
          .map(
            (page: any): WikiArticle => ({
              title: page.title,
              displaytitle: page.varianttitles[currentLanguage.id],
              extract: page.extract,
              pageid: page.pageid,
              thumbnail: page.thumbnail,
              url: page.canonicalurl,
            })
          )
          .filter(
            (article) =>
              article.thumbnail &&
              article.thumbnail.source &&
              article.url &&
              article.extract
          );
      }

      // 获取相关文章
      const articlesWithRelated = await Promise.all(
        newArticles.map(async (article) => {
          const related = await fetchRelatedArticles(article.pageid, currentLanguage.id);
          return {
            ...article,
            related,
          };
        })
      );

      await Promise.allSettled(
        articlesWithRelated
          .filter((article) => article.thumbnail)
          .map((article) => preloadImage(article.thumbnail!.source))
      );

      if (forBuffer) {
        setBuffer(articlesWithRelated);
      } else {
        setArticles((prev) => [...prev, ...articlesWithRelated]);
        if (!query) {
          fetchArticles(true);
        }
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
    }
    setLoading(false);
  };

  const getMoreArticles = useCallback(() => {
    if (buffer.length > 0) {
      setArticles((prev) => [...prev, ...buffer]);
      setBuffer([]);
      fetchArticles(true, searchQuery);
    } else {
      fetchArticles(false, searchQuery);
    }
  }, [buffer, searchQuery]);

  // 当地理位置信息加载完成时，自动获取地区相关的文章
  useEffect(() => {
    if (!geoLoading && country && articles.length === 0) {
      fetchArticles(false);
    }
  }, [geoLoading, country]);

  return {
    articles,
    loading,
    fetchArticles,
    searchArticles,
    setArticles,
    userCountry: country,
    userLanguage: language,
  };
}
