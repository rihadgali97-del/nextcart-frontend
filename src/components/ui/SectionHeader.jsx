import React from 'react';
import '../../styles/components/section-header.css';

const SectionHeader = ({ tag, title, subtitle, alignment = 'left' }) => {
  const isCenter = alignment === 'center';
  return (
    <div className={`section-header ${isCenter ? 'section-header--center' : ''}`}>
      {tag && (
        <span className="section-header__tag">
          {tag}
        </span>
      )}
      <h2 className="section-header__title">
        {title}
      </h2>
      {subtitle && <p className="section-header__subtitle">{subtitle}</p>}
    </div>
  );
};

export default SectionHeader;
