import React, { useEffect, useState } from 'react';
import { getVendorStats, getVendorProfile } from '../../services/api';
import { ShoppingBag, DollarSign, ShieldCheck, Star, Activity } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis } from 'recharts';

const VendorDashboard = () => {
  const [stats, setStats] = useState({ totalRevenue: 0, activeOrders: 0 });
  const [reputation, setReputation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const [statsRes, profileRes] = await Promise.all([
          getVendorStats(),
          getVendorProfile()
        ]);

        // 1. STATS SYNC
        const sData = statsRes.data?.stats || statsRes.data?.data || statsRes.data || {};
        setStats({
          totalRevenue: sData.totalRevenue || 0,
          activeOrders: sData.totalOrders || sData.activeOrders || 0,
        });

        // 2. REPUTATION SYNC (THE FIX)
        // We look in every possible location the API might return the user object
        const userData = profileRes.data?.user || profileRes.data?.data?.user || profileRes.data || {};
        const repData = userData.reputation;

        console.log("CRITICAL DEBUG: This is what the API sent:", repData);

        if (repData) {
          setReputation(repData);
        } else {
          // Fallback to local storage if API fails for some reason
          const localUser = JSON.parse(localStorage.getItem('user'));
          if (localUser?.reputation) {
             console.log("Using local storage fallback");
             setReputation(localUser.reputation);
          }
        }
      } catch (err) {
        console.error("Dashboard Sync Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  if (loading) return (
    <div className="p-8 flex flex-col items-center justify-center min-h-screen text-amber-600 font-bold">
      <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      Establishing Secure Connection to NextCart DB...
    </div>
  );

  // Pillar Mapping for the Radar Chart
  const radarData = [
    { subject: 'Reliability', A: Math.min((reputation?.metrics?.successfulOrders || 0) * 5, 100), fullMark: 100 },
    { subject: 'Speed', A: Math.max(0, 100 - (reputation?.metrics?.averageDeliveryHours || 0)), fullMark: 100 },
    { subject: 'Sentiment', A: (reputation?.metrics?.positiveFeedbackRatio || 0) * 100, fullMark: 100 },
    { subject: 'Verification', A: reputation?.score > 20 ? 100 : 20, fullMark: 100 },
  ];

  const trustMeterData = [{ name: 'Score', value: reputation?.score || 0, fill: '#f59e0b' }];

  return (
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Business Intelligence</h1>
          <p className="text-slate-500 font-medium">
            Ranked as: <span className="text-indigo-600 font-bold uppercase">{reputation?.rank || "Starter"}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-green-600 font-bold text-xs bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm shadow-green-100">
          <Activity size={14} className="animate-pulse" />
          NextCart DB Live
        </div>
      </div>

      {/* Dynamic Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Revenue', val: `${stats.totalRevenue.toLocaleString()} ETB`, icon: DollarSign, color: 'text-emerald-500' },
          { label: 'Orders', val: stats.activeOrders, icon: ShoppingBag, color: 'text-orange-500' },
          { label: 'Rank', val: reputation?.rank || "Starter", icon: ShieldCheck, color: 'text-indigo-500' },
          { label: 'Trust Score', val: `${reputation?.score || 0}/100`, icon: Star, color: 'text-amber-500' },
        ].map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <card.icon className={`${card.color} mb-2`} size={24} />
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{card.label}</p>
            <p className="text-2xl font-black text-slate-800">{card.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gauge Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h2 className="font-bold text-slate-800 text-xl">Trust Integrity</h2>
          <p className="text-slate-400 text-sm mb-6">Real-time reputation gauge</p>
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" data={trustMeterData} startAngle={180} endAngle={0}>
                <RadialBar background dataKey="value" cornerRadius={10} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-10">
              <span className="text-4xl font-black text-slate-800">{reputation?.score || 0}</span>
              <span className="text-slate-400 text-xs font-bold uppercase">Points</span>
            </div>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h2 className="font-bold text-slate-800 text-xl">Capability Radar</h2>
          <p className="text-slate-400 text-sm mb-6">Performance across 4 pillars</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
                <Radar name="Vendor" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;