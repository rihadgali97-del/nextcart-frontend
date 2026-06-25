import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Store,
  Truck,
  Twitter,
  Globe, // ◄ Imported for Sematha web representation icon
} from 'lucide-react';
import Logo from '../components/common/Logo';

const Footer = () => {
  const year = new Date().getFullYear();

  const linkGroups = [
    {
      title: 'Marketplace',
      links: [
        { name: 'Home', path: '/home' },
        { name: 'Find Products', path: '/search' },
        { name: 'Nearby Stores', path: '/proximity-search' },
        { name: 'Become a Vendor', path: '/register' },
      ],
    },
    {
      title: 'Company',
      links: [
        { name: 'About NextCart', path: '/about' },
        { name: 'Services', path: '/services' },
        { name: 'Customer Account', path: '/login' },
        { name: 'Vendor Access', path: '/login' },
      ],
    },
  ];

  const trustSignals = [
    { icon: ShieldCheck, label: 'Verified vendors' },
    { icon: Store, label: 'Multi-store commerce' },
    { icon: Truck, label: 'Order-ready logistics' },
  ];

  const socialLinks = [
    { icon: Facebook, label: 'Facebook', href: 'https://facebook.com' },
    { icon: Instagram, label: 'Instagram', href: 'https://instagram.com' },
    { icon: Twitter, label: 'Twitter', href: 'https://twitter.com' },
    { icon: Linkedin, label: 'LinkedIn', href: 'https://linkedin.com/in/rihad-gali-06b973376' },
    { icon: Globe, label: 'Sematha', href: 'https://www.sematha.com/' }, // ◄ Added inline here
  ];

  return (
    <footer className="relative overflow-hidden bg-[#0b1f1e] text-white">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c4a456]/70 to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(196,164,86,0.12),transparent_34%,rgba(255,255,255,0.04))] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
          <div className="space-y-6">
            <Logo lightText />
            <p className="max-w-md text-sm leading-6 text-white/62 font-medium">
              NextCart connects buyers with verified vendors, reputation-aware discovery, and a commerce experience built for modern marketplace operations.
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              {trustSignals.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 border border-white/10 bg-white/[0.04] px-3 py-3">
                  <Icon size={17} className="text-[#c4a456] shrink-0" />
                  <span className="text-xs font-bold text-white/78">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {linkGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-black uppercase tracking-[0.18em] text-[#c4a456]">{group.title}</h3>
              <ul className="mt-5 space-y-3">
                {group.links.map((link) => (
                  <li key={`${group.title}-${link.name}`}>
                    <Link to={link.path} className="group inline-flex items-center gap-2 text-sm font-semibold text-white/62 transition-colors hover:text-white">
                      <ArrowRight size={14} className="text-white/30 transition-colors group-hover:text-[#c4a456]" />
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.18em] text-[#c4a456]">Contact</h3>
            <div className="mt-5 space-y-4 text-sm text-white/64">
              <a href="mailto:support@nextcart.com" className="flex items-center gap-3 transition-colors hover:text-white">
                <Mail size={17} className="text-[#c4a456]" />
                support@nextcart.com
              </a>
              <a href="tel:+251911000000" className="flex items-center gap-3 transition-colors hover:text-white">
                <Phone size={17} className="text-[#c4a456]" />
                +251 976 670 667
              </a>
              <div className="flex items-start gap-3">
                <MapPin size={17} className="text-[#c4a456] mt-0.5 shrink-0" />
                <span>Addis Ababa, Ethiopia</span>
              </div>
            </div>

            <div className="mt-7 flex items-center gap-3">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 w-10 items-center justify-center border border-white/10 bg-white/[0.04] text-white/70 transition hover:border-[#c4a456]/70 hover:text-[#c4a456]"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-white/45 md:flex-row md:items-center md:justify-between">
          <p>Copyright {year} NextCart Marketplace. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/services" className="hover:text-white transition-colors">Platform Terms</Link>
            <Link to="/about" className="hover:text-white transition-colors">Trust & Safety</Link>
            <Link to="/login" className="hover:text-white transition-colors">Account Security</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;