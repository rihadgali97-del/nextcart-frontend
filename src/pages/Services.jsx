import React from 'react';
import SectionHeader from '../components/ui/SectionHeader';
import { Layers, Truck, LineChart, Lock } from 'lucide-react';

const Services = () => {
  const platformServices = [
    { icon: <Layers size={26} />, title: "Multi-Vendor Store Hosting", body: "Vendors get dedicated control panels to manipulate items, track stock quantities, and brand store templates independently." },
    { icon: <LineChart size={26} />, title: "Reputation Metrics Tracker", body: "Automatic user profile status parsing categorizes active sellers into ranks like Starter, Trusted, or Elite." },
    { icon: <Lock size={26} />, title: "JWT Tokenized Authorization", description: "Role-protected routes prevent unauthorized request updates, locking admin interfaces behind verified crypto tokens." },
    { icon: <Truck size={26} />, title: "Smart Order Dispatch", body: "Seamless transactional pipelines route pending consumer shopping carts into automated notification alerts for dispatch." }
  ];

  return (
    <div className="bg-[#f8fafc] min-h-screen pt-28">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <SectionHeader 
          tag="Platform Ecosystem" 
          title="What NextCart Provides" 
          subtitle="Explore the systemic modules fully integrated into NextCart's full-stack codebase structure."
          alignment="center"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
          {platformServices.map((service, i) => (
            <div key={i} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-6 items-start hover:shadow-2xl hover:shadow-slate-100 transition-all duration-300">
              <div className="w-14 h-14 bg-[#0f2a29] text-[#c4a456] rounded-2xl flex items-center justify-center shrink-0 shadow-md">
                {service.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-2.5">{service.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed font-medium">{service.body || service.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Services;