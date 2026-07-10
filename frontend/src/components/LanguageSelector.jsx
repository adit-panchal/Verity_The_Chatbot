import React, { useState } from "react";
import { X, Globe, Check } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import "../styles/LanguageSelector.css";

const LANGUAGES = [
  { code: "en", name: "English", native: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", native: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", native: "Français", flag: "🇫🇷" },
  { code: "de", name: "German", native: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italian", native: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", native: "Português", flag: "🇵🇹" },
  { code: "ja", name: "Japanese", native: "日本語", flag: "🇯🇵" },
  { code: "zh", name: "Chinese", native: "中文", flag: "🇨🇳" },
  { code: "ru", name: "Russian", native: "Русский", flag: "🇷🇺" },
  { code: "ar", name: "Arabic", native: "العربية", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
  { code: "ko", name: "Korean", native: "한국어", flag: "🇰🇷" },
];

const LanguageSelector = ({
  isOpen,
  onClose,
  currentLanguage = "en",
  onSelectLanguage,
}) => {
  const [selected, setSelected] = useState(currentLanguage);
  const { t } = useLanguage();

  if (!isOpen) return null;

  const handleSelect = (code) => {
    setSelected(code);
  };

  const handleApply = () => {
    onSelectLanguage(selected);
    onClose();
  };

  return (
    <div className="language-modal-overlay" onClick={onClose}>
      <div className="language-modal" onClick={(e) => e.stopPropagation()}>
        <div className="language-modal-header">
          <h2 className="language-modal-title">
            <Globe size={24} className="text-emerald-500" />
            {t("selectLanguage")}
          </h2>
          <button className="language-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="language-grid">
          {LANGUAGES.map((lang) => (
            <div
              key={lang.code}
              className={`language-option ${selected === lang.code ? "active" : ""}`}
              onClick={() => handleSelect(lang.code)}
            >
              <span className="language-flag">{lang.flag}</span>
              <span className="language-name">{lang.name}</span>
              <span className="language-native">{lang.native}</span>
              {selected === lang.code && (
                <div className="absolute top-2 right-2 text-emerald-500">
                  <Check size={16} />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="language-footer">
          <button className="lang-cancel-btn" onClick={onClose}>
            {t("cancel")}
          </button>
          <button className="lang-apply-btn" onClick={handleApply}>
            {t("applyChanges")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelector;
