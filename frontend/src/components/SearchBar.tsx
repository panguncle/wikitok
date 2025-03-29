import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function SearchBar({ onSearch, onClose, isOpen }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { isDark } = useTheme();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed top-4 left-4 right-4 z-50"
        >
          <form onSubmit={handleSubmit} className="relative">
            <div className={`relative flex items-center ${
              isDark ? 'bg-black/80' : 'bg-white/80'
            } backdrop-blur-sm rounded-lg shadow-lg`}>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Wikipedia articles..."
                className={`w-full px-4 py-3 pl-12 pr-12 ${
                  isDark ? 'bg-transparent text-white' : 'bg-transparent text-black'
                } placeholder-gray-500 focus:outline-none`}
              />
              <Search className={`absolute left-4 w-5 h-5 ${
                isDark ? 'text-white/50' : 'text-black/50'
              }`} />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className={`absolute right-4 p-1 rounded-full hover:bg-white/10 transition-colors`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 