import React, { useEffect, useState } from 'react';
import { getVendorStats, getVendorProfile, getVendorWallet } from '../../services/api';
import { 
  ShoppingBag, DollarSign, ShieldCheck, Star, 
  Activity, TrendingUp, Package, Clock, CheckCircle,
  ArrowUpRight, ArrowDownRight, Zap
} from 'lucide-react';
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = { dark:'#0f2a29', gold:'#c4a456', light:'#f8fafb', border:'#e8ede9', muted:'#7a8c7e' };

const StatCard = ({ label, value, sub, icon: Icon, accent, trend }) => (
  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 relative overflow-hidden group hover:shadow-md transition-all">
    <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-5 group-hover:opacity-10 transition-all" style={{ background: accent }} />
    <Icon size={22} className="mb-3" style={{ color: accent }} />
    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-2xl font-black" style={{ color: C.dark }}>{value}</p>
    {sub && <p className="text-xs text-slate-400 font-medium mt-1">{sub}</p>}
    {trend !== undefined && (
      <div className={`flex items-center gap-1 text-xs font-bold mt-2 ${trend >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
        {trend >= 0 ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
        {Math.abs(trend)}% vs last month
      </div>
    )}
    <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: accent, opacity: 0.4 }} />
  </div>
);

const SectionTitle = ({ title, sub }) => (
  <div className="mb-6">
    <h2 className="text-xl font-black" style={{ color: C.dark }}>{title}</h2>
    {sub && <p className="text-sm text-slate-400 font-medium">{sub}</p>}
  </div>
);

export default function VendorDashboard() {
  const [stats,      setStats]      = useState({ totalRevenue:0, activeOrders:0, totalOrders:0 });
  const [reputation, setReputation] = useState(null);
  const [wallet,     setWallet]     = useState(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [sRes, pRes] = await Promise.all([getVendorStats(), getVendorProfile()]);
        const s = sRes.data?.stats || sRes.data?.data || sRes.data || {};
        setStats({
          totalRevenue:  s.totalRevenue  || 0,
          activeOrders:  s.totalOrders   || s.activeOrders || 0,
          totalOrders:   s.totalOrders   || 0,
          completedOrders: s.completedOrders || 0,
          cancelledOrders: s.cancelledOrders || 0,
        });
        const u = pRes.data?.user || pRes.data?.data?.user || pRes.data || {};
        setReputation(u.reputation || JSON.parse(localStorage.getItem('user'))?.reputation);
        // Try wallet
        try {
          const wRes = await getVendorWallet();
          setWallet(wRes.data?.data || wRes.data);
        } catch {}
      } catch (err) {
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: C.light }}>
      <div className="w-10 h-10 border-4 border-[#c4a456] border-t-transparent rounded-full animate-spin mb-4" />
      <p className="font-black text-sm" style={{ color: C.muted }}>Loading your dashboard…</p>
    </div>
  );

  // Radar chart data
  const radarData = [
    { subject: 'Reliability', A: Math.min((reputation?.metrics?.successfulOrders || 0) * 5, 100), fullMark: 100 },
    { subject: 'Speed',       A: Math.max(0, 100 - (reputation?.metrics?.averageDeliveryHours || 0)), fullMark: 100 },
    { subject: 'Sentiment',   A: (reputation?.metrics?.positiveFeedbackRatio || 0) * 100, fullMark: 100 },
    { subject: 'Verified',    A: reputation?.score > 20 ? 80 : 20, fullMark: 100 },
    { subject: 'Reviews',     A: Math.min((reputation?.metrics?.totalReviews || 0) * 2, 100), fullMark: 100 },
  ];

  const trustMeterData = [{ name: 'Score', value: reputation?.score || 0, fill: '#c4a456' }];

  // Simulated monthly revenue data (replace with real endpoint when available)
  const monthlyData = ['Jan','Feb','Mar','Apr','May','Jun'].map((m,i) => ({
    month: m,
    revenue: Math.round((stats.totalRevenue || 0) * [.48,.62,.55,.78,.88,1][i]),
  }));

  const orderStats = [
    { label: 'Completed', value: stats.completedOrders || stats.totalOrders || 0, color: '#10b981' },
    { label: 'Active',    value: stats.activeOrders   || 0, color: '#c4a456' },
    { label: 'Cancelled', value: stats.cancelledOrders || 0, color: '#ef4444' },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 min-h-screen" style={{ background: C.light }}>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: C.dark }}>
            Business Intelligence
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Ranked as:{' '}
            <span className="font-black uppercase" style={{ color: C.gold }}>
              {reputation?.rank || 'Starter'}
            </span>
            {' · '}Trust Score:{' '}
            <span className="font-black" style={{ color: C.dark }}>{reputation?.score || 0}/100</span>
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm">
          <Activity size={14} className="text-[#c4a456]" />
          <span className="text-xs font-black text-slate-500 uppercase tracking-wider">NextCart DB · Live</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue"  value={`${stats.totalRevenue.toLocaleString()} ETB`}
          sub="All delivered orders" icon={DollarSign} accent="#10b981" trend={12} />
        <StatCard label="Total Orders"   value={stats.totalOrders}
          sub="Since launch" icon={ShoppingBag} accent="#c4a456" trend={5} />
        <StatCard label="Trust Score"    value={`${reputation?.score || 0}/100`}
          sub={reputation?.rank || 'Starter'} icon={ShieldCheck} accent="#6366f1" />
        <StatCard label="Wallet Balance" value={`${(wallet?.balance || 0).toLocaleString()} ETB`}
          sub="Available to withdraw" icon={DollarSign} accent="#0f2a29" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Revenue trend */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6">
          <SectionTitle title="Revenue Trend" sub="Monthly performance overview" />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#c4a456" stopOpacity={0.18}/>
                    <stop offset="95%" stopColor="#c4a456" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize:11, fontWeight:700 }}/>
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize:11 }}
                  tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}/>
                <Tooltip contentStyle={{ borderRadius:12, border:'none', boxShadow:'0 4px 20px rgba(0,0,0,.08)' }}/>
                <Area type="monotone" dataKey="revenue" stroke="#c4a456" strokeWidth={3}
                  fill="url(#revGrad)" dot={{ r:4, fill:'#c4a456' }}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order status donut */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6">
          <SectionTitle title="Order Status" sub="Current breakdown" />
          <div className="space-y-3 mt-4">
            {orderStats.map(s => (
              <div key={s.label}>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span style={{ color: C.muted }}>{s.label}</span>
                  <span style={{ color: C.dark }}>{s.value}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${stats.totalOrders ? (s.value/stats.totalOrders)*100 : 0}%`, background: s.color }}/>
                </div>
              </div>
            ))}
          </div>

          {/* Quick metrics */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-2xl p-3 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Successful</p>
              <p className="text-xl font-black" style={{ color: C.dark }}>
                {reputation?.metrics?.successfulOrders || 0}
              </p>
            </div>
            <div className="bg-red-50 rounded-2xl p-3 text-center">
              <p className="text-[10px] font-black text-red-400 uppercase tracking-wider">Cancelled</p>
              <p className="text-xl font-black text-red-600">
                {reputation?.metrics?.cancelledOrders || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Trust engine row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Trust gauge */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
          <SectionTitle title="Trust Integrity" sub="Real-time reputation gauge" />
          <div className="h-56 relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="60%" innerRadius="70%" outerRadius="100%"
                data={trustMeterData} startAngle={180} endAngle={0}>
                <RadialBar background dataKey="value" cornerRadius={10}/>
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-12">
              <span className="text-4xl font-black" style={{ color: C.dark }}>{reputation?.score || 0}</span>
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">/ 100 Points</span>
              <span className="mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                style={{ background: `${C.gold}20`, color: C.gold }}>
                {reputation?.rank || 'Starter'}
              </span>
            </div>
          </div>
          {/* Trust progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-medium">Progress to next rank</span>
              <span className="font-black" style={{ color: C.dark }}>{reputation?.score || 0}%</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width:`${reputation?.score || 0}%`,
                  background:'linear-gradient(90deg, #0f2a29, #c4a456)' }}/>
            </div>
            <div className="flex justify-between text-[9px] text-slate-300 font-bold uppercase tracking-wider mt-1">
              {['Unverified','Starter','Trusted','Elite','Legendary'].map(r=><span key={r}>{r}</span>)}
            </div>
          </div>
        </div>

        {/* Radar chart */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
          <SectionTitle title="Capability Radar" sub="Performance across 5 pillars" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0"/>
                <PolarAngleAxis dataKey="subject"
                  tick={{ fill:'#64748b', fontSize:11, fontWeight:700 }}/>
                <Radar name="Vendor" dataKey="A" stroke="#c4a456" fill="#c4a456" fillOpacity={0.25}/>
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Metrics detail row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Avg Delivery',  value: `${(reputation?.metrics?.averageDeliveryHours || 0).toFixed(1)}h`, icon: Clock,        color:'#6366f1' },
          { label:'Total Reviews', value: reputation?.metrics?.totalReviews || 0,                            icon: Star,         color:'#c4a456' },
          { label:'Success Rate',  value: stats.totalOrders
              ? `${Math.round(((reputation?.metrics?.successfulOrders||0)/stats.totalOrders)*100)}%`
              : '0%',                                                                                        icon: CheckCircle,  color:'#10b981' },
          { label:'Last Order',    value: reputation?.metrics?.lastOrderDate
              ? new Date(reputation.metrics.lastOrderDate).toLocaleDateString('en-US',{month:'short',day:'numeric'})
              : 'Never',                                                                                     icon: Zap,          color:'#0f2a29' },
        ].map((m,i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
            <div className="p-2.5 rounded-xl" style={{ background:`${m.color}15` }}>
              <m.icon size={18} style={{ color: m.color }}/>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{m.label}</p>
              <p className="text-lg font-black" style={{ color: C.dark }}>{m.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}