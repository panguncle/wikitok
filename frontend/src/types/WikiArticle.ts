export interface WikiArticle {
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