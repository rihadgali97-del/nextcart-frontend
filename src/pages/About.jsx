import React from 'react';
import SectionHeader from '../components/ui/SectionHeader';
import { Shield, Award, Users, Terminal } from 'lucide-react';
import '../styles/pages/about.css';

const About = () => {
  const corporatePillars = [
    { 
      icon: <Shield size={24} />, 
      title: "Secure Multi-Vendor Ecosystem", 
      description: "Rigorous vendor onboarding and verification protocols eliminate fraudulent listings, ensuring marketplace integrity, catalog transparency, and consumer trust." 
    },
    { 
      icon: <Award size={24} />, 
      title: "Performance & Reputation Matrix", 
      description: "Data-driven merchant grading engines evaluate fulfillment efficiency, return behavior, and review metrics to surface top-tier vendors automatically." 
    },
    { 
      icon: <Users size={24} />, 
      title: "Democratic B2C Commerce", 
      description: "Eliminating intermediate supply chain operational friction to connect independent merchants directly with customers through optimal transactional pipelines." 
    },
  ];

  return (
    <div className="about-page">
      <section className="about-intro">
        <div>
          <SectionHeader 
            tag="Platform Overview" 
            title="Next-Generation Architecture for Scalable Digital Commerce" 
            subtitle="GebeyaPlus is a high-performance, multi-vendor marketplace designed to streamline transactions and remove operational inefficiencies between independent brands and customers." 
          />
          <p className="about-copy">
            The platform delivers robust, role-based management interfaces tailored specifically for administrators, vendors, and buyers. Merchants enjoy automated toolkits to handle inventories, track order processing, and analyze store metrics, while consumers experience fluid, secure workflows from localized catalog indexing to final checkout.
          </p>
        </div>
        <div className="about-feature">
          <Terminal size={40} className="about-feature-icon" />
          <h4 className="about-feature-title">Enterprise-Grade Security</h4>
          <p className="about-feature-copy">
            From advanced multi-layer encryption handshakes and tokenized session protections to state-driven user interfaces, the underlying architecture emphasizes system modularity, total resource optimization, and a highly resilient digital infrastructure.
          </p>
        </div>
      </section>

      {/* Grid Features Structure Layout */}
      <section className="about-pillars">
        <div className="about-pillars__inner">
          <SectionHeader tag="Core Infrastructure" title="The Structural Pillars of NextCart" alignment="center" />
          <div className="about-pillar-grid">
            {corporatePillars.map((pillar, i) => (
              <div key={i} className="about-pillar">
                <div className="about-pillar-icon">
                  {pillar.icon}
                </div>
                <h3 className="about-pillar-title">{pillar.title}</h3>
                <p className="about-pillar-copy">{pillar.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
