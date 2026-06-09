import React from 'react';
import SectionHeader from '../components/ui/SectionHeader';
import { Shield, Award, Users, Terminal } from 'lucide-react';

const About = () => {
  const corporatePillars = [
    { icon: <Shield size={24} />, title: "Secure Escrow & Verification", description: "Vetting mechanisms ensure no ghost vendors operate profiles, establishing end-to-end user transparency." },
    { icon: <Award size={24} />, title: "Dynamic Reputation Scoring", description: "Automated ranking matrices keep tracks of store parameters like cancellation rates and review parameters." },
    { icon: <Users size={24} />, title: "TriNova Technology Brand", description: "Architected natively by our co-founding core team to redefine commercial web applications scale." },
  ];

  return (
    <div className="bg-white min-h-screen pt-28">
      <section className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <SectionHeader 
            tag="Who We Are" 
            title="Building Next-Gen Architectures For E-Commerce Scaling" 
            subtitle="NextCart is an enterprise-level multi-vendor marketplace designed to remove intermediate operational frictions between independent merchants and direct consumers." 
          />
          <p className="text-slate-500 text-sm leading-relaxed mb-6 font-medium">
            Built using Node.js, React, and MongoDB, this platform empowers vendors with an automated interface to list, manage orders, and check security metrics while providing customers with a fluid, high-speed buying workflow.
          </p>
        </div>
        <div className="bg-slate-50 rounded-[3.5rem] p-12 border border-slate-100 relative">
          <Terminal size={40} className="text-[#0f2a29] mb-6" />
          <h4 className="text-xl font-bold text-slate-800 mb-2">Engineered with Precision</h4>
          <p className="text-sm text-slate-500 leading-relaxed font-medium">
            From modern password encryption handshakes via bcrypt to dynamic global states, the underlying source architecture emphasizes maintainable structure.
          </p>
        </div>
      </section>

      {/* Grid Features Structure Layout */}
      <section className="bg-[#f8fafc] py-24 px-6 rounded-t-[5rem]">
        <div className="max-w-7xl mx-auto">
          <SectionHeader tag="Core Infrastructure" title="The Pillars of NextCart" alignment="center" />
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