import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import '../../styles/common/language-selector.css';

const LanguageSelector = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className="language-selector">
      <Globe size={13} className="language-selector__icon" />
      <select 
        onChange={changeLanguage} 
        value={i18n.language}
        className="language-selector__select"
      >
        <option value="en" className="bg-[#0f2a29] text-white">EN</option>
        <option value="am" className="bg-[#0f2a29] text-white">አማ</option>
        <option value="om" className="bg-[#0f2a29] text-white">ORM</option>
      </select>
    </div>
  );
};

export default LanguageSelector;
