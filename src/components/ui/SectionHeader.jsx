import React from 'react';

const SectionHeader = ({ tag, title, subtitle, alignment = 'left' }) => {
  const isCenter = alignment === 'center';
  return (
    <div className={`max-w-3xl mb-14 ${isCenter ? 'mx-auto text-center' : ''}`}>
      {tag && (
        <span className="text-xs font-bold tracking-widest text-[#c4a456] uppercase bg-[#c4a456]/10 px-4 py-2 rounded-xl inline-block mb-4">
          {tag}
        </span>
      )}
      <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4 leading-tight">
        {title}
      </h2>
      {subtitle && <p className="text-slate-500 text-sm md:text-base leading-relaxed font-medium">{subtitle}</p>}
    </div>
  );
};

export default SectionHeader;