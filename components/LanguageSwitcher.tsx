
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSwitcher: React.FC = () => {
    const { language, setLanguage } = useLanguage();

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'am' : 'en');
    };

    return (
        <button
            onClick={toggleLanguage}
            className="px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors bg-gray-700/80 text-gray-300 hover:bg-gray-700"
            aria-label={`Switch to ${language === 'en' ? 'Amharic' : 'English'}`}
        >
            {language === 'en' ? 'አማርኛ' : 'English'}
        </button>
    );
};

export default LanguageSwitcher;
