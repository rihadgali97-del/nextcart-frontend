import React, { useEffect, useState } from 'react';
import { getVendorWallet, withdrawVendorFunds } from '../../services/api';
import {
  DollarSign, TrendingUp, ArrowDownCircle, ArrowUpCircle,
  Clock, CheckCircle, AlertCircle, Wallet, CreditCard, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

// Global Platform Design Tokens
const C = { dark: '#0f2a29', gold: '#c4a456', light: '#f8fafb', border: '#e8ede9', muted: '#7a8c7e' };

const StatCard = ({ label, value, sub, icon: Icon, accent }) => (
  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 relative overflow-hidden group hover:shadow-md transition-all">
    <div className="absolute -bottom-5 -right-5 w-20 h-20 rounded-full opacity-5 group-hover:opacity-10 transition-all" style={{ background: accent }}/>
    <div className="p-2.5 rounded-xl w-fit mb-3" style={{ background: `${accent}18` }}>
      <Icon size={20} style={{ color: accent }}/>
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-2xl font-black" style={{ color: C.dark }}>{value}</p>
    {sub && <p className="text-xs text-slate-400 font-medium mt-1">{sub}</p>}
    <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: accent, opacity: 0.35 }}/>
  </div>
);

const TxRow = ({ tx }) => {
  const isCredit = tx.type === 'credit' || tx.amount > 0;
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all">
      <div className={`p-2.5 rounded-xl ${isCredit ? 'bg-emerald-50' : 'bg-red-50'}`}>
        {isCredit
          ? <ArrowDownCircle size={18} className="text-emerald-500"/>
          : <ArrowUpCircle size={18} className="text-red-400"/>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm" style={{ color: C.dark }}>
          {tx.description || (isCredit ? 'Order Payment' : 'Withdrawal Request')}
        </p>
        <p className="text-xs text-slate-400 font-medium">
          {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-US', { 
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
          }) : '—'}
        </p>
      </div>
      <div className="text-right">
        <p className={`font-black text-sm ${isCredit ? 'text-emerald-600' : 'text-red-500'}`}>
          {isCredit ? '+' : '-'}{Math.abs(tx.amount || 0).toLocaleString()} ETB
        </p>
        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full mt-1 inline-block
          ${tx.status === 'completed' ? 'bg-emerald-50 text-emerald-600'
          : tx.status === 'pending' ? 'bg-amber-50 text-amber-600'
          : 'bg-rose-50 text-rose-600'}`}>
          {tx.status || 'completed'}
        </span>
      </div>
    </div>
  );
};

export default function VendorWallet() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('telebirr');
  const [msg, setMsg] = useState(null);

  useEffect(() => { load(); }, []);

 const load = async () => {
  setLoading(true);
  try {
    const response = await getVendorWallet();
    const data = response.data; // This extracts the Axios payload
    
    // Set the specific data chunks we sent from the backend
    setWallet(data.wallet || {}); 
    setTransactions(data.transactions || []);
  } catch (err) {
    console.error("Wallet API Error:", err);
    setMsg({ type: 'error', text: 'Failed to load wallet data' }); 
  } finally {
    setLoading(false);
  }
};

  const handleWithdraw = async () => {
    const withdrawAmount = Number(amount);
    
    // Client-Side Security Validations
    if (!amount || withdrawAmount <= 0) { 
      setMsg({ type: 'error', text: 'Please enter a valid amount to withdraw.' }); 
      return; 
    }
    if (withdrawAmount > (wallet?.balance || 0)) { 
      setMsg({ type: 'error', text: 'Insufficient balance available for this transaction.' }); 
      return; 
    }

    setWithdrawing(true);
    setMsg(null);

    try {
      // Direct integration with production API endpoint
      const response = await withdrawVendorFunds({ amount: withdrawAmount, method });
      
      setMsg({ 
        type: 'success', 
        text: response?.data?.message || `Withdrawal of ${withdrawAmount.toLocaleString()} ETB processed successfully!` 
      });
      setAmount('');
      
      // Automatic cache revalidation delay for state synchronicity
      setTimeout(() => { 
        setMsg(null); 
        load(); 
      }, 3000);
    } catch (err) {
      setMsg({ 
        type: 'error', 
        text: err.response?.data?.message || 'Transaction could not be completed. Please contact support.' 
      });
    } finally { 
      setWithdrawing(false); 
    }
  };

  // Build Monthly Financial Metrics
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthlyMap = {};
  
  transactions.filter(t => (t.type === 'credit' || t.amount > 0) && t.status === 'completed').forEach(t => {
    const dateObj = t.createdAt ? new Date(t.createdAt) : null;
    if (dateObj && !isNaN(dateObj)) {
      const m = months[dateObj.getMonth()];
      monthlyMap[m] = (monthlyMap[m] || 0) + (t.amount || 0);
    }
  });

  const chartData = months.slice(0, new Date().getMonth() + 1)
    .map(m => ({ month: m, earnings: monthlyMap[m] || 0 }));

  // Financial Ledger Calculators
  const totalEarned = transactions
    .filter(t => (t.type === 'credit' || t.amount > 0) && t.status === 'completed')
    .reduce((a, t) => a + (t.amount || 0), 0);

  const totalWithdrawn = transactions
    .filter(t => (t.type === 'withdrawal' || t.amount < 0) && t.status === 'completed')
    .reduce((a, t) => a + Math.abs(t.amount || 0), 0);

  const pendingAmount = transactions
    .filter(t => t.status === 'pending')
    .reduce((a, t) => a + Math.abs(t.amount || 0), 0);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: C.light }}>
      <div className="w-10 h-10 border-4 border-[#c4a456] border-t-transparent rounded-full animate-spin mb-4"/>
      <p className="font-black text-sm" style={{ color: C.muted }}>Securing connection ledger…</p>
    </div>
  );

  return (
    <div className="p-6 md:p-8 space-y-8 min-h-screen" style={{ background: C.light }}>

      {/* Dynamic Toast System */}
      {msg && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right duration-300
          ${msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
          {msg.type === 'success' ? <CheckCircle size={18}/> : <AlertCircle size={18}/>}
          <span className="font-bold text-sm">{msg.text}</span>
        </div>
      )}

      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: C.dark }}>Wallet & Earnings</h1>
          <p className="text-slate-500 font-medium mt-1">Manage your payouts, balances, and direct digital transactions</p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm text-xs font-black text-slate-500 hover:border-[#c4a456] transition-all">
          <RefreshCw size={14}/> Refresh Balance
        </button>
      </div>

      {/* Account Master Balance Card */}
      <div className="relative overflow-hidden rounded-[2.5rem] p-8 text-white"
        style={{ background: 'linear-gradient(135deg, #0f2a29 0%, #1a3d30 60%, #0a1f1a 100%)' }}>
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-10" style={{ background: C.gold }}/>
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${C.gold}, transparent)` }}/>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={16} className="opacity-60"/>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Settled Account Balance</span>
          </div>
          <div className="text-5xl font-black mb-1" style={{ color: C.gold }}>
            {(wallet?.balance || 0).toLocaleString()}
            <span className="text-2xl ml-2 opacity-70">ETB</span>
          </div>
          <p className="text-sm opacity-50 font-medium">
            Last Vault Sync: {wallet?.updatedAt ? new Date(wallet.updatedAt).toLocaleString() : 'Synchronized Just now'}
          </p>
        </div>
      </div>

      {/* Financial Matrix Grids */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Gross Volume" value={`${totalEarned.toLocaleString()} ETB`}
          sub="All-time gross verified sales" icon={TrendingUp} accent="#10b981"/>
        <StatCard label="Withdrawn" value={`${totalWithdrawn.toLocaleString()} ETB`}
          sub="Transferred to verified systems" icon={ArrowUpCircle} accent="#6366f1"/>
        <StatCard label="Escrow / Pending" value={`${pendingAmount.toLocaleString()} ETB`}
          sub="Awaiting institutional clearance" icon={Clock} accent="#f59e0b"/>
      </div>

      {/* Analytical Sub-Layer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recharts Graphical Engine */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={18} style={{ color: C.gold }}/>
            <h3 className="font-black uppercase text-[10px] tracking-widest" style={{ color: C.dark }}>
              Revenue Performance Trajectory
            </h3>
          </div>
          {chartData.some(d => d.earnings > 0) ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="walletGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.gold} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={C.gold} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700 }}/>
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }}
                    tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}/>
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.08)' }}/>
                  <Area type="monotone" dataKey="earnings" stroke={C.gold} strokeWidth={3}
                    fill="url(#walletGrad)" dot={{ r: 4, fill: C.gold }}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-slate-300 font-bold text-sm">
              No historical processing records available for this cycle
            </div>
          )}
        </div>

        {/* Withdrawal Execution Core Panel */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <CreditCard size={18} style={{ color: C.gold }}/>
            <h3 className="font-black uppercase text-[10px] tracking-widest" style={{ color: C.dark }}>
              Initiate Asset Extraction
            </h3>
          </div>

          <div className="flex-1 space-y-4">
            <div className="bg-slate-50 rounded-2xl p-4 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Max Retrievable</p>
              <p className="text-2xl font-black" style={{ color: C.dark }}>
                {(wallet?.balance || 0).toLocaleString()} ETB
              </p>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1 mb-1.5 block">
                Amount (ETB)
              </label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="Enter amount in ETB…" min="1" max={wallet?.balance || 0}
                className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-transparent focus:border-[#c4a456] focus:bg-white outline-none text-sm font-bold transition-all"/>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1 mb-1.5 block">
                Disbursement Gateway
              </label>
              <select value={method} onChange={e => setMethod(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-transparent focus:border-[#c4a456] outline-none text-sm font-bold cursor-pointer">
                <option value="telebirr">Telebirr Portal</option>
                <option value="cbe">CBE Birr</option>
                <option value="bank">Commercial Bank Wire Transfer</option>
              </select>
            </div>

            <button onClick={handleWithdraw} disabled={withdrawing || !amount}
              className="w-full py-3.5 rounded-2xl font-black text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: C.dark, color: C.gold }}>
              {withdrawing ? 'Transacting Engine Operating…' : `Withdraw ${amount ? Number(amount).toLocaleString() : '0'} ETB`}
            </button>

            <p className="text-[10px] text-slate-400 text-center font-medium">
              National gateway clearing parameters typically execute within 1–3 enterprise banking days.
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History Sub-System */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ background: `${C.gold}18` }}>
              <DollarSign size={18} style={{ color: C.gold }}/>
            </div>
            <h3 className="font-black" style={{ color: C.dark }}>Auditable Transaction History</h3>
          </div>
          <span className="text-[10px] font-black bg-slate-100 px-3 py-1 rounded-full text-slate-500 uppercase">
            {transactions.length} Records Documented
          </span>
        </div>
        <div className="divide-y divide-slate-50">
          {transactions.length === 0 ? (
            <div className="p-16 text-center">
              <Wallet size={40} className="mx-auto mb-4 text-slate-200"/>
              <p className="font-bold text-slate-300">No transactions recorded on this register</p>
            </div>
          ) : (
            transactions.slice(0, 30).map((tx, i) => <TxRow key={tx._id || i} tx={tx}/>)
          )}
        </div>
      </div>
    </div>
  );
}