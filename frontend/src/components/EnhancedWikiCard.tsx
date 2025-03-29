import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useLikedArticles } from '../contexts/LikedArticlesContext';

interface WikiArticle {
  title: string;
  displaytitle: string;
  extract: string;
  pageid: number;
  url: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  language?: string;
  categories?: string[];
  related?: WikiArticle[];
}

interface EnhancedWikiCardProps {
  article: WikiArticle;
  onRelatedArticlesRequest?: () => void;
  onArticleInView?: (article: WikiArticle) => void;
}

export function EnhancedWikiCard({ article, onRelatedArticlesRequest, onArticleInView }: EnhancedWikiCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const { toggleLike, isLiked } = useLikedArticles();
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onArticleInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          onArticleInView(article);
        }
      },
      {
        threshold: 0.5, // When 50% of the card is visible
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [article, onArticleInView]);

  const handleToggleLike = () => {
    if (article && article.pageid) {
      toggleLike(article as any);
    }
  };

  const isArticleLiked = article && article.pageid ? isLiked(article.pageid) : false;

  return (
    <motion.div
      ref={cardRef}
      className="h-screen w-full flex items-center justify-center snap-start relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="h-full w-full relative flex flex-col">
        {article.thumbnail ? (
          <div className="absolute inset-0 z-0">
            <motion.img
              loading="lazy"
              src={article.thumbnail.source}
              alt={article.displaytitle}
              className="w-full h-full object-cover"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: imageLoaded ? 1 : 0, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              onLoad={() => setImageLoaded(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/80" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 z-0">
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
          </div>
        )}

        {/* 书签按钮已移至App.tsx中的侧边栏 */}

        <div className="flex-grow" />

        <motion.div
          className="relative z-10 px-8 pb-16 pt-8 bg-gradient-to-t from-black via-black/80 to-transparent"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <motion.h2
            className="text-4xl font-bold mb-4 text-white drop-shadow-lg"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {article.displaytitle}
          </motion.h2>

          <motion.div
            className="relative max-w-3xl"
            initial={{ height: 'auto' }}
            animate={{ height: 'auto' }}
          >
            <p
              className={`text-lg text-white/95 mb-4 leading-relaxed drop-shadow-md ${
                !showFullContent ? 'line-clamp-3' : ''
              }`}
            >
              {article.extract}
            </p>
            
            <motion.button
              className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors"
              onClick={() => setShowFullContent(!showFullContent)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {showFullContent ? (
                <>
                  Show less <ChevronUp className="w-5 h-5" />
                </>
              ) : (
                <>
                  Read more <ChevronDown className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </motion.div>

          <div className="flex flex-wrap gap-4 mt-8">
            <motion.a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 bg-white/90 text-black font-medium rounded-xl hover:bg-white transition-all duration-300 shadow-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              View on Wikipedia
            </motion.a>
            
            {onRelatedArticlesRequest && (
              <motion.button
                onClick={onRelatedArticlesRequest}
                className="px-8 py-3 bg-black/80 text-white font-medium rounded-xl hover:bg-black/90 transition-all duration-300 shadow-lg border border-white/20"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Show Related Articles
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}