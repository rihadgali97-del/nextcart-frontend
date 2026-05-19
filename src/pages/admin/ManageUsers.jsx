import React, { useEffect, useState } from 'react';
import { Trash2, Edit, Search, UserPlus, Mail, Shield } from 'lucide-react';
import { getUsers, deleteUser } from '../../services/api'; // Ensure these are exported in your api.js

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const { data } = await getUsers();
      setUsers(data.data); // data.data matches your UserController structure
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteUser(id);
        fetchUsers(); // Refresh list
      } catch (err) {
        alert("Failed to delete user");
      }
    }
  };

  if (loading) return <div className="p-10 text-center font-bold text-ncTeal animate-pulse">Loading NextCart Database...</div>;

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900">User Management</h1>
          <p className="text-slate-500">View and manage all registered accounts.</p>
        </div>
        <button className="flex items-center gap-2 bg-ncTeal text-white px-6 py-3 rounded-2xl font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-ncTeal/10">
          <UserPlus size={20} /> Add New User
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Search by name or email..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-ncGold/20 outline-none" />
          </div>
        </div>

        <table className="w-full text-left">
          <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-[0.15em] font-black">
            <tr>
              <th className="px-8 py-4">User Details</th>
              <th className="px-8 py-4">Role</th>
              <th className="px-8 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-ncGold/10 flex items-center justify-center text-ncGold font-bold">
                      {user.name?.[0] || 'U'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 leading-none mb-1">{user.name}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1"><Mail size={12}/> {user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 w-fit ${
                    user.role === 'admin' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <Shield size={10} /> {user.role}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <div className="flex gap-2">
                    <button className="p-2.5 text-slate-400 hover:text-ncTeal hover:bg-ncTeal/5 rounded-xl transition-all"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(user._id)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageUsers;