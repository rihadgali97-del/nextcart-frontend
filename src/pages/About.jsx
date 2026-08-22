import React from 'react';
import SectionHeader from '../components/ui/SectionHeader';
import { Shield, Award, Users, Terminal } from 'lucide-react';

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
    <div className="bg-white min-h-screen pt-28">
      <section className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <SectionHeader 
            tag="Platform Overview" 
            title="Next-Generation Architecture for Scalable Digital Commerce" 
            subtitle="GebeyaPlus is a high-performance, multi-vendor marketplace designed to streamline transactions and remove operational inefficiencies between independent brands and customers." 
          />
          <p className="text-slate-500 text-sm leading-relaxed mb-6 font-medium">
            The platform delivers robust, role-based management interfaces tailored specifically for administrators, vendors, and buyers. Merchants enjoy automated toolkits to handle inventories, track order processing, and analyze store metrics, while consumers experience fluid, secure workflows from localized catalog indexing to final checkout.
          </p>
        </div>
        <div className="bg-slate-50 rounded-[3.5rem] p-12 border border-slate-100 relative">
          <Terminal size={40} className="text-[#0f2a29] mb-6" />
          <h4 className="text-xl font-bold text-slate-800 mb-2">Enterprise-Grade Security</h4>
          <p className="text-sm text-slate-500 leading-relaxed font-medium">
            From advanced multi-layer encryption handshakes and tokenized session protections to state-driven user interfaces, the underlying architecture emphasizes system modularity, total resource optimization, and a highly resilient digital infrastructure.
          </p>
        </div>
      </section>

      {/* Grid Features Structure Layout */}
      <section className="bg-[#f8fafc] py-24 px-6 rounded-t-[5rem]">
        <div className="max-w-7xl mx-auto">
          <SectionHeader tag="Core Infrastructure" title="The Structural Pillars of NextCart" alignment="center" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-4">
            {corporatePillars.map((pillar, i) => (
              <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 bg-[#0f2a29] text-[#c4a456] rounded-2xl flex items-center justify-center mb-6 shadow-md shadow-[#0f2a29]/10">
                  {pillar.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{pillar.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed font-medium">{pillar.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;