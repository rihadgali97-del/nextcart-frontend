import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSelector = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-all">
      <Globe size={13} className="text-[#c4a456]" />
      <select 
        onChange={changeLanguage} 
        value={i18n.language}
        className="bg-transparent text-[11px] font-bold uppercase tracking-wider text-white/90 outline-none cursor-pointer pr-1"
        style={{ colorScheme: 'dark' }} // Ensures dropdown options match dark theme natively
      >
        <option value="en" className="bg-[#0f2a29] text-white">EN</option>
        <option value="am" className="bg-[#0f2a29] text-white">አማ</option>
        <option value="om" className="bg-[#0f2a29] text-white">ORM</option>
      </select>
    </div>
  );
};

export default LanguageSelector;