import React from 'react';
import SectionHeader from '../components/ui/SectionHeader';
import { Layers, Truck, LineChart, Lock } from 'lucide-react';
import '../styles/pages/services.css';

const Services = () => {
  const platformServices = [
    { icon: <Layers size={26} />, title: "Multi-Vendor Store Hosting", body: "Vendors get dedicated control panels to manipulate items, track stock quantities, and brand store templates independently." },
    { icon: <LineChart size={26} />, title: "Reputation Metrics Tracker", body: "Automatic user profile status parsing categorizes active sellers into ranks like Starter, Trusted, or Elite." },
    { icon: <Lock size={26} />, title: "JWT Tokenized Authorization", description: "Role-protected routes prevent unauthorized request updates, locking admin interfaces behind verified crypto tokens." },
    { icon: <Truck size={26} />, title: "Smart Order Dispatch", body: "Seamless transactional pipelines route pending consumer shopping carts into automated notification alerts for dispatch." }
  ];

  return (
    <div className="services-page">
      <div className="services-page__inner">
        <SectionHeader 
          tag="Platform Ecosystem" 
          title="What GebeyaPlus Provides" 
          subtitle="Explore the systemic modules fully integrated into GebeyaPlus's full-stack codebase structure."
          alignment="center"
        />

        <div className="services-grid">
          {platformServices.map((service, i) => (
            <div key={i} className="services-card">
              <div className="services-card__icon">
                {service.icon}
              </div>
              <div>
                <h3 className="services-card__title">{service.title}</h3>
                <p className="services-card__copy">{service.body || service.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Services;
