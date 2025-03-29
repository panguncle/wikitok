import { useState, useCallback } from "react";
import { useLocalization } from "./useLocalization";

interface WikiArticle {
  pageid: number;
  title: string;
  displaytitle: string;
  extract: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  url: string;
  related?: WikiArticle[];
}

export function useWikiArticles() {
  const [articles, setArticles] = useState<WikiArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentLanguage } = useLocalization();

  const fetchArticles = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    try {
      const params = new URLSearchParams({
        action: "query",
        format: "json",
        generator: "random",
        grnnamespace: "0",
        grnlimit: "10",
        prop: "extracts|pageimages|info",
        exintro: "true",
        explaintext: "true",
        inprop: "url",
        piprop: "thumbnail",
        pithumbsize: "640",
        origin: "*",
      });

      const response = await fetch(`${currentLanguage.api}${params}`);
      const data = await response.json();

      if (data.query && data.query.pages) {
        const newArticles = Object.values(data.query.pages) as WikiArticle[];
        setArticles((prev) => [...prev, ...newArticles]);
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setLoading(false);
    }
  }, [currentLanguage.api, loading]);

  const searchArticles = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);

    try {
      const params = new URLSearchParams({
        action: "query",
        format: "json",
        list: "search",
        srsearch: query,
        srlimit: "10",
        prop: "extracts|pageimages|info",
        exintro: "true",
        explaintext: "true",
        inprop: "url",
        piprop: "thumbnail",
        pithumbsize: "640",
        origin: "*",
      });

      const response = await fetch(`${currentLanguage.api}${params}`);
      const data = await response.json();

      if (data.query && data.query.search) {
        const searchResults = data.query.search;
        const articleIds = searchResults.map((result: any) => result.pageid).join("|");

        // Fetch full article details
        const detailsParams = new URLSearchParams({
          action: "query",
          format: "json",
          pageids: articleIds,
          prop: "extracts|pageimages|info",
          exintro: "true",
          explaintext: "true",
          inprop: "url",
          piprop: "thumbnail",
          pithumbsize: "640",
          origin: "*",
        });

        const detailsResponse = await fetch(`${currentLanguage.api}${detailsParams}`);
        const detailsData = await detailsResponse.json();

        if (detailsData.query && detailsData.query.pages) {
          const articles = Object.values(detailsData.query.pages) as WikiArticle[];
          setArticles(articles);
        }
      }
    } catch (error) {
      console.error("Error searching articles:", error);
    } finally {
      setLoading(false);
    }
  }, [currentLanguage.api]);

  return {
    articles,
    loading,
    fetchArticles,
    searchArticles,
    setArticles,
  };
}
