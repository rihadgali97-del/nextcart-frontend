// import React from 'react';
// import { 
//   LayoutDashboard, Package, ShoppingCart, Wallet, 
//   Settings, LogOut, Star, ShieldCheck, MessageSquare,
//   ChevronLeft, ChevronRight 
// } from 'lucide-react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import nextCartLogo from '../../assets/nextcart-logo.png';

// const VendorSidebar = ({ isCollapsed, setIsCollapsed }) => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const user = JSON.parse(localStorage.getItem('user') || '{}');

//   const menuItems = [
//     { id: 1, icon: LayoutDashboard, label: 'Overview',       path: '/vendor' },
//     { id: 2, icon: Package,         label: 'My Products',    path: '/vendor/products' },
//     { id: 3, icon: ShoppingCart,    label: 'Orders',         path: '/vendor/orders' },
//     { id: 4, icon: Wallet,          label: 'Wallet',         path: '/vendor/wallet' },
//     { id: 5, icon: MessageSquare,   label: 'Messages',       path: '/vendor/messages' },
//     { id: 6, icon: Star,            label: 'Reviews',        path: '/vendor/reviews' },
//     { id: 7, icon: Settings,        label: 'Settings',       path: '/settings' },
//   ];

//   const handleLogout = () => {
//     localStorage.clear();
//     navigate('/login');
//   };

//   return (
//     <aside className={`bg-[#0f2a29] min-h-screen flex flex-col p-4 text-white border-r border-white/5 sticky top-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-[88px]' : 'w-72'}`}>

//       {/* Logo + Toggle */}
//       <div className="flex items-center justify-between mb-8 px-2 min-h-[52px]">
//         <div className="flex items-center gap-3 overflow-hidden">
//           {/* Real NextCart logo — same treatment as AdminSidebar */}
//           <div className="w-10 h-10 rounded-full overflow-hidden bg-white flex items-start justify-center min-w-[40px] shadow-lg shadow-black/20">
//             <img
//               src={nextCartLogo}
//               alt="NextCart"
//               className="w-14 max-w-none scale-[1.5] -translate-y-0.5 object-contain"
//             />
//           </div>
//           {!isCollapsed && (
//             <div className="animate-in fade-in slide-in-from-left-2 duration-300 overflow-hidden">
//               <h1 className="text-xl font-black tracking-tight whitespace-nowrap">
//                 Next<span className="text-[#c4a456]">Cart</span>
//               </h1>
//               <span className="text-[#c4a456] text-[9px] uppercase font-black tracking-[0.2em]">
//                 Vendor Pro
//               </span>
//             </div>
//           )}
//         </div>
//         <button
//           onClick={() => setIsCollapsed(!isCollapsed)}
//           className="p-1.5 rounded-lg bg-white/5 hover:bg-[#c4a456] hover:text-[#0f2a29] transition-all z-10 ml-1 flex-shrink-0"
//         >
//           {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
//         </button>
//       </div>

//       {/* Section label */}
//       {!isCollapsed && (
//         <p className="text-[9px] uppercase tracking-[0.2em] text-[#c4a456] font-black px-3 mb-3 opacity-80">
//           Vendor Panel
//         </p>
//       )}

//       {/* Nav */}
//       <nav className="flex-1 space-y-1">
//         {menuItems.map((item) => {
//           const Icon = item.icon;
//           const isActive = location.pathname === item.path;
//           return (
//             <button
//               key={item.id}
//               onClick={() => navigate(item.path)}
//               className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-200 group relative
//                 ${isCollapsed ? 'justify-center' : ''}
//                 ${isActive
//                   ? 'bg-[#c4a456] text-[#0f2a29] shadow-lg shadow-[#c4a456]/20'
//                   : 'hover:bg-white/6 text-white/60 hover:text-white'}`}
//             >
//               <Icon size={19} className="min-w-[19px] flex-shrink-0" />
//               {!isCollapsed && (
//                 <span className="font-bold text-sm whitespace-nowrap">{item.label}</span>
//               )}
//               {/* Tooltip */}
//               {isCollapsed && (
//                 <div className="absolute left-[68px] bg-[#c4a456] text-[#0f2a29] px-3 py-1.5 rounded-xl text-[10px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl whitespace-nowrap">
//                   {item.label}
//                 </div>
//               )}
//             </button>
//           );
//         })}
//       </nav>

//       {/* Bottom: reputation card + logout */}
//       <div className="mt-auto pt-4 space-y-3">
//         {/* Reputation chip */}
//         <div className={`bg-white/5 rounded-2xl border border-white/10 transition-all ${isCollapsed ? 'p-2 flex justify-center' : 'p-4'}`}>
//           <div className="flex items-center gap-3">
//             <div className="min-w-[32px] p-1.5 bg-[#c4a456]/20 rounded-xl flex items-center justify-center flex-shrink-0">
//               <ShieldCheck size={17} className="text-[#c4a456]" />
//             </div>
//             {!isCollapsed && (
//               <div className="overflow-hidden">
//                 <p className="text-[9px] text-white/40 font-black uppercase tracking-wider">Rank</p>
//                 <p className="text-xs font-black text-[#c4a456] uppercase tracking-widest truncate">
//                   {user?.reputation?.rank || 'Starter'}
//                 </p>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Profile row */}
//         {!isCollapsed && (
//           <div className="flex items-center gap-3 px-2 py-2">
//             <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#c4a456] to-[#e5c77e] flex items-center justify-center text-[#0f2a29] font-black text-base flex-shrink-0">
//               {user?.name?.[0]?.toUpperCase() || 'V'}
//             </div>
//             <div className="overflow-hidden">
//               <p className="text-sm font-bold text-white truncate">{user?.name || 'Vendor'}</p>
//               <p className="text-[9px] text-white/40 uppercase tracking-wider">{user?.email?.slice(0, 20) || 'vendor'}</p>
//             </div>
//           </div>
//         )}

//         {/* Logout */}
//         <button
//           onClick={handleLogout}
//           title={isCollapsed ? 'Log Out' : ''}
//           className={`w-full flex items-center justify-center gap-2 py-3 bg-[#c4a456]/10 text-[#c4a456] text-[10px] font-black rounded-2xl hover:bg-red-500 hover:text-white transition-all uppercase tracking-wider`}
//         >
//           <LogOut size={16} />
//           {!isCollapsed && 'Log Out'}
//         </button>

//         {!isCollapsed && (
//           <p className="text-[9px] text-center text-white/10 mt-2 uppercase tracking-[0.3em]">
//             NextCart · BiT 2026
//           </p>
//         )}
//       </div>
//     </aside>
//   );
// };

// export default VendorSidebar;