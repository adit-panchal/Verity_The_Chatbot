import React, { createContext, useContext, useState, useEffect } from "react";
import { translations } from "../utils/translations";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  // Get language from localStorage or default to 'en'
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("app_language") || "en";
  });

  // Save to localStorage whenever language changes
  useEffect(() => {
    localStorage.setItem("app_language", language);
  }, [language]);

  const changeLanguage = (langCode) => {
    if (translations[langCode]) {
      setLanguage(langCode);
    } else {
      console.warn(`Language '${langCode}' not supported`);
    }
  };

  // Translation function
  const t = (key) => {
    const translation = translations[language]?.[key];
    if (!translation) {
      // Fallback to English if translation missing
      return translations["en"]?.[key] || key;
    }
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
