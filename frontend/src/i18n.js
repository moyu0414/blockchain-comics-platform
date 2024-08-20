import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zh from './locales/zh-TW/translation.json';
import en from './locales/en/translation.json';
import ja from './locales/ja/translation.json';
import ko from './locales/ko/translation.json';

// 初始化 i18next
i18n
  .use(initReactI18next)
  .init({
    resources: {
      zh: { translation: zh },
      en: { translation: en },
      ja: { translation: ja },
      ko: { translation: ko },
    },
    lng: localStorage.getItem('language') || 'zh', // 默認語言
    fallbackLng: 'zh',
    interpolation: { escapeValue: false },
  });

export default i18n;
