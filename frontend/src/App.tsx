import { useEffect, useRef, useCallback, useState } from "react";
import { Loader2, Search, X, Download, Heart } from "lucide-react";
import { Analytics } from "@vercel/analytics/react";
import { LanguageSelector } from "./components/LanguageSelector";
import { useLikedArticles } from "./contexts/LikedArticlesContext";
import { useWikiArticles } from "./hooks/useWikiArticles";
import { EnhancedWikiCard } from "./components/EnhancedWikiCard";
import { SearchBar } from "./components/SearchBar";
import { useTheme } from "./contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from 'react-i18next';

function App() {
  const [showLikes, setShowLikes] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showRelated, setShowRelated] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const { articles, loading, fetchArticles, searchArticles, setArticles } = useWikiArticles();
  const { likedArticles, toggleLike, isLiked } = useLikedArticles();
  const { isDark } = useTheme();
  const observerTarget = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useTranslation();

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && !loading) {
        fetchArticles();
      }
    },
    [loading, fetchArticles]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      rootMargin: "100px",
    });

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [handleObserver]);

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleSearch = useCallback((query: string) => {
    setArticles([]);  // Clear current articles
    searchArticles(query);
  }, [searchArticles]);

  const filteredLikedArticles = likedArticles.filter(
    (article) =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.extract.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExport = () => {
    const simplifiedArticles = likedArticles.map((article) => ({
      title: article.title,
      url: article.url,
      extract: article.extract,
      thumbnail: article.thumbnail?.source || null,
    }));

    const dataStr = JSON.stringify(simplifiedArticles, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `wikitok-favorites-${new Date().toISOString().split("T")[0]
      }.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className={`h-screen w-full ${isDark ? 'bg-black' : 'bg-white'} text-${isDark ? 'white' : 'black'} overflow-y-scroll snap-y snap-mandatory hide-scroll`}>
      <div className="fixed top-4 left-4 z-50 flex items-center gap-4">
        <button
          onClick={() => window.location.reload()}
          className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'} drop-shadow-lg hover:opacity-80 transition-opacity`}
        >
          {t('app.title')}
        </button>
        <button
          onClick={() => setShowSearch(true)}
          className={`px-3 py-1 rounded-full ${
            isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'
          } text-sm transition-colors flex items-center gap-2`}
        >
          <Search className="w-4 h-4" />
          {t('app.search.button')}
        </button>
      </div>

      <SearchBar
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onSearch={handleSearch}
      />

      {/* 右侧边栏 - 垂直布局，按钮合并在一起 */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center">
        <div className={`w-12 h-12 rounded-t-full ${
          isDark ? 'bg-black/70' : 'bg-white/90'
        } backdrop-blur-md shadow-lg flex items-center justify-center transition-all hover:scale-110`}>
          <LanguageSelector buttonContent={<span className="text-xs font-medium">Lang</span>} />
        </div>

        <button
          onClick={() => selectedArticle && toggleLike(selectedArticle)}
          className={`w-12 h-12 ${
            isDark ? 'bg-black/70' : 'bg-white/90'
          } backdrop-blur-md shadow-lg flex items-center justify-center transition-all hover:scale-110`}
          aria-label={t('app.actions.like')}
          title={selectedArticle && isLiked(selectedArticle.pageid) ? t('app.actions.unlike') : t('app.actions.like')}
        >
          <Heart 
            className={`w-5 h-5 ${selectedArticle && isLiked(selectedArticle.pageid) ? 'fill-current' : ''}`}
          />
        </button>

        <button
          onClick={() => setShowLikes(true)}
          className={`w-12 h-12 rounded-b-full ${
            isDark ? 'bg-black/70' : 'bg-white/90'
          } backdrop-blur-md shadow-lg flex items-center justify-center transition-all hover:scale-110`}
          aria-label={t('app.actions.viewSaved')}
          title={t('app.actions.viewSaved')}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none"
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
          </svg>
        </button>
      </div>

      {showLikes && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div className={`${isDark ? 'bg-gray-900' : 'bg-white'} z-[41] p-6 rounded-lg w-full max-w-2xl h-[80vh] flex flex-col relative`}>
            <button
              onClick={() => setShowLikes(false)}
              className={`absolute top-2 right-2 ${isDark ? 'text-white/70 hover:text-white' : 'text-black/70 hover:text-black'}`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{t('app.likes.title')}</h2>
              {likedArticles.length > 0 && (
                <button
                  onClick={handleExport}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm ${
                    isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'
                  } rounded-lg transition-colors`}
                  title={t('app.likes.export')}
                >
                  <Download className="w-4 h-4" />
                  {t('app.likes.export')}
                </button>
              )}
            </div>

            <div className="relative mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('app.likes.searchPlaceholder')}
                className={`w-full ${
                  isDark ? 'bg-gray-800 text-white' : 'bg-gray-100 text-black'
                } px-4 py-2 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              <Search className={`w-5 h-5 ${isDark ? 'text-white/50' : 'text-black/50'} absolute left-3 top-1/2 transform -translate-y-1/2`} />
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {filteredLikedArticles.length === 0 ? (
                <p className={isDark ? 'text-white/70' : 'text-black/70'}>
                  {searchQuery ? t('app.search.noResults') : t('app.likes.empty')}
                </p>
              ) : (
                <div className="space-y-4">
                  {filteredLikedArticles.map((article) => (
                    <div
                      key={`${article.pageid}-${Date.now()}`}
                      className="flex gap-4 items-start group"
                    >
                      {article.thumbnail && (
                        <img
                          src={article.thumbnail.source}
                          alt={article.title}
                          className="w-20 h-20 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`font-bold ${isDark ? 'hover:text-gray-200' : 'hover:text-gray-800'}`}
                          >
                            {article.title}
                          </a>
                          <button
                            onClick={() => toggleLike(article)}
                            className={`${
                              isDark ? 'text-white/50 hover:text-white/90' : 'text-black/50 hover:text-black/90'
                            } p-1 rounded-full md:opacity-0 md:group-hover:opacity-100 transition-opacity`}
                            aria-label="Remove from likes"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className={`text-sm ${isDark ? 'text-white/70' : 'text-black/70'} line-clamp-2`}>
                          {article.extract}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div
            className="w-full h-full z-[40] top-1 left-1 bg-[rgb(28 25 23 / 43%)] fixed"
            onClick={() => setShowLikes(false)}
          />
        </motion.div>
      )}

      <AnimatePresence>
        {articles.map((article) => (
          <EnhancedWikiCard
            key={article.pageid}
            article={article}
            onArticleInView={(article) => setSelectedArticle(article)}
            onRelatedArticlesRequest={() => {
              setSelectedArticle(article);
              setShowRelated(true);
            }}
          />
        ))}
      </AnimatePresence>
      
      {showRelated && selectedArticle && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div className={`${isDark ? 'bg-gray-900' : 'bg-white'} z-[41] p-6 rounded-lg w-full max-w-2xl h-[80vh] flex flex-col relative`}>
            <button
              onClick={() => setShowRelated(false)}
              className={`absolute top-2 right-2 ${isDark ? 'text-white/70 hover:text-white' : 'text-black/70 hover:text-black'}`}
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold mb-4">Related to "{selectedArticle.title}"</h2>

            <div className="flex-1 overflow-y-auto min-h-0">
              {selectedArticle.related && selectedArticle.related.length > 0 ? (
                <div className="space-y-4">
                  {selectedArticle.related.map((relatedArticle: any) => (
                    <div
                      key={`${relatedArticle.pageid}`}
                      className="flex gap-4 items-start group"
                    >
                      {relatedArticle.thumbnail && (
                        <img
                          src={relatedArticle.thumbnail.source}
                          alt={relatedArticle.title}
                          className="w-20 h-20 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <a
                            href={relatedArticle.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`font-bold ${isDark ? 'hover:text-gray-200' : 'hover:text-gray-800'}`}
                          >
                            {relatedArticle.title}
                          </a>
                          <button
                            onClick={() => toggleLike(relatedArticle)}
                            className={`${
                              isDark ? 'text-white/50 hover:text-white/90' : 'text-black/50 hover:text-black/90'
                            } p-1 rounded-full transition-opacity`}
                            aria-label={isLiked(relatedArticle.pageid) ? "Remove from likes" : "Add to likes"}
                          >
                            <Heart className={`w-4 h-4 ${isLiked(relatedArticle.pageid) ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                        <p className={`text-sm ${isDark ? 'text-white/70' : 'text-black/70'} line-clamp-2`}>
                          {relatedArticle.extract}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={isDark ? 'text-white/70' : 'text-black/70'}>
                  No related articles found.
                </p>
              )}
            </div>
          </div>
          <div
            className="w-full h-full z-[40] top-1 left-1 bg-[rgb(28 25 23 / 43%)] fixed"
            onClick={() => setShowRelated(false)}
          />
        </motion.div>
      )}
      
      <div ref={observerTarget} className="h-10 -mt-1" />
      {loading && (
        <div className="h-screen w-full flex items-center justify-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading more articles...</span>
        </div>
      )}
      <Analytics />
    </div>
  );
}

export default App;
