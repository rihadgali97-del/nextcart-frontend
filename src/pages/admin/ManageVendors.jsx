import React, { useEffect, useState } from 'react';
import { 
  Store, Trash2, Mail, ExternalLink, ShieldCheck, 
  Search, Filter, Table, FileText,
  MoreVertical, UserX, UserCheck, RefreshCcw, AlertCircle
} from 'lucide-react';
import { getVendors, updateVendorStatus, deleteVendor } from '../../services/api';
import { downloadVendorAudit } from '../../services/reportService'; // New Service
import { saveAs } from 'file-saver';

const ManageVendors = () => {
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showDropdown, setShowDropdown] = useState(null);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const { data } = await getVendors();
      const vendorList = data.data || [];
      setVendors(vendorList);
      setFilteredVendors(vendorList);
    } catch (err) {
      console.error("Critical Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVendors(); }, []);

  useEffect(() => {
    let result = vendors;
    if (activeTab !== 'all') result = result.filter(v => v.status === activeTab);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(v => 
        v.businessName?.toLowerCase().includes(term) ||
        v.user?.name?.toLowerCase().includes(term) ||
        v._id?.toLowerCase().includes(term)
      );
    }
    setFilteredVendors(result);
  }, [searchTerm, activeTab, vendors]);

  const exportCSV = () => {
    if (filteredVendors.length === 0) return alert("No data to export");
    const headers = "ID,Business Name,Owner,Email,Status\n";
    const rows = filteredVendors.map(v => 
      `${v._id},"${v.businessName}","${v.user?.name || 'N/A'}","${v.user?.email || 'N/A'}",${v.status}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `NextCart_Vendors_${new Date().toISOString().split('T')[0]}.csv`);
  };

  // --- NEW PROFESSIONAL BACKEND PDF CALL ---
  const handlePdfAudit = async () => {
    try {
      // Feedback for the admin
      console.log("Requesting Secure PDF Audit via Trust Infrastructure Layer...");
      await downloadVendorAudit();
    } catch (error) {
      console.error("PDF Generation Error:", error);
      alert("Unauthorized or Server Error. Ensure you are logged in as Admin.");
    }
  };

  const toggleVerification = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'pending' : 'active';
    try {
      await updateVendorStatus(id, newStatus);
      setVendors(prev => prev.map(v => v._id === id ? { ...v, status: newStatus } : v));
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("CRITICAL ACTION: Revoke all business permissions?")) {
      try {
        await deleteVendor(id);
        fetchVendors();
      } catch (err) {
        alert("Deletion failed.");
      }
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <RefreshCcw className="animate-spin text-[#c4a456]" size={40} />
        <p className="font-black text-[#0f2a29] tracking-widest uppercase text-xs">Syncing Ecosystem...</p>
      </div>
    </div>
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans selection:bg-[#c4a456]/30">
      <header className="mb-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-black text-[#0f2a29] tracking-tight">Vendor Management</h1>
            <span className="bg-[#c4a456]/10 text-[#c4a456] text-[10px] px-2 py-1 rounded-md font-black uppercase">Admin v2.0</span>
          </div>
          <p className="text-slate-500 font-medium">Audit partner identities and shop permissions.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <button onClick={exportCSV} className="flex items-center gap-2 px-5 py-2.5 text-[#0f2a29] font-bold text-xs hover:bg-slate-50 transition-colors border-r border-slate-100">
              <Table size={16} className="text-emerald-600" /> CSV
            </button>
            {/* The PDF Button now triggers the backend service */}
            <button onClick={handlePdfAudit} className="flex items-center gap-2 px-5 py-2.5 text-[#0f2a29] font-bold text-xs hover:bg-slate-50 transition-colors">
              <FileText size={16} className="text-red-500" /> PDF Audit
            </button>
          </div>

          <div className="bg-[#0f2a29] px-5 py-2.5 rounded-2xl border border-[#c4a456]/20 flex items-center gap-3 shadow-lg shadow-[#0f2a29]/10">
            <ShieldCheck className="text-[#c4a456]" size={20} />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Trust Layer Active</span>
          </div>
        </div>
      </header>

      {/* ... Filters and Table remain the same ... */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit">
          {['all', 'active', 'pending'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab 
                ? 'bg-[#0f2a29] text-[#c4a456] shadow-md' 
                : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search by Business, Owner, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#c4a456]/20 outline-none transition-all font-medium text-slate-700 shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/80 backdrop-blur-md text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black border-b border-slate-100">
            <tr>
              <th className="px-8 py-6">Business Identity</th>
              <th className="px-8 py-6">Administrative Contact</th>
              <th className="px-8 py-6 text-center">Verification</th>
              <th className="px-8 py-6 text-right">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredVendors.map((vendor) => (
              <tr key={vendor._id} className="hover:bg-slate-50/50 transition-colors group relative">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-[#0f2a29] border border-slate-200 group-hover:border-[#c4a456]/50 transition-colors">
                      <Store size={22} />
                    </div>
                    <div>
                      <p className="font-bold text-[#0f2a29]">{vendor.businessName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">UID: {vendor._id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-700">{vendor.user?.name || 'N/A'}</span>
                    <span className="text-xs text-slate-400 flex items-center gap-1"><Mail size={12}/> {vendor.user?.email}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col items-center gap-2">
                    <button 
                      onClick={() => toggleVerification(vendor._id, vendor.status)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 ${
                        vendor.status === 'active' ? 'bg-[#c4a456]' : 'bg-slate-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-300 ${
                        vendor.status === 'active' ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${
                      vendor.status === 'active' ? 'text-[#c4a456]' : 'text-slate-400'
                    }`}>
                      {vendor.status === 'active' ? 'Authorized' : 'Pending'}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-6 text-right relative">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => window.open(`/shop/${vendor._id}`)} className="p-2.5 text-slate-400 hover:text-[#0f2a29] hover:bg-slate-100 rounded-xl transition-all">
                      <ExternalLink size={18} />
                    </button>
                    <button onClick={() => handleDelete(vendor._id)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                      <Trash2 size={18} />
                    </button>
                    <button 
                      onClick={() => setShowDropdown(showDropdown === vendor._id ? null : vendor._id)}
                      className="p-2.5 text-slate-400 hover:text-[#0f2a29] hover:bg-slate-100 rounded-xl transition-all"
                    >
                      <MoreVertical size={18} />
                    </button>
                  </div>
                  {showDropdown === vendor._id && (
                    <div className="absolute right-8 top-16 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 p-2">
                      <button className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                        <UserCheck size={14} className="text-[#c4a456]" /> Update Plan
                      </button>
                      <button className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                        <UserX size={14} /> Suspend User
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="mt-8 flex justify-between items-center text-slate-400">
        <p className="text-xs font-bold uppercase tracking-widest">Total Partners: {vendors.length}</p>
        <div className="flex items-center gap-2 text-xs">
          <AlertCircle size={14} />
          <span>Session encrypted via NextCart Pro Security Layer</span>
        </div>
      </footer>
    </div>
  );
};

export default ManageVendors;