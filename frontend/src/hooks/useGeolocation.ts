import { useState, useEffect } from 'react';

interface GeolocationState {
  country: string;
  language: string;
  loading: boolean;
  error: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    country: '',
    language: 'en',
    loading: true,
    error: null,
  });

  useEffect(() => {
    const detectLocation = async () => {
      try {
        // 首先尝试使用 navigator.language 获取浏览器语言设置
        const browserLang = navigator.language.split('-')[0];
        
        // 使用 ipapi.co 获取用户的地理位置信息
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        // 根据国家代码确定合适的维基百科语言
        const languageMap: { [key: string]: string } = {
          CN: 'zh',
          TW: 'zh',
          HK: 'zh',
          JP: 'ja',
          KR: 'ko',
          US: 'en',
          GB: 'en',
          DE: 'de',
          FR: 'fr',
          ES: 'es',
          IT: 'it',
          RU: 'ru',
          // 可以添加更多国家和语言的映射
        };

        const detectedLanguage = languageMap[data.country_code] || browserLang || 'en';

        setState({
          country: data.country_name,
          language: detectedLanguage,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error detecting location:', error);
        // 如果发生错误，使用浏览器语言设置作为后备
        setState({
          country: '',
          language: navigator.language.split('-')[0] || 'en',
          loading: false,
          error: 'Failed to detect location',
        });
      }
    };

    detectLocation();
  }, []);

  return state;
} 