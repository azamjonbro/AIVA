import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { Plus, Search, UserCheck, Shield, Trash2, Edit, X, Lock, Mail } from 'lucide-react';

export default function EmployeesPage() {
  const { addToast, user: currentUser } = useApp();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'operator'
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error('Fetch employees failed:', err);
      addToast('Failed to load team roster.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || (!isEditMode && !formData.password)) {
      addToast('All required fields must be completed.', 'error');
      return;
    }
    
    try {
      if (isEditMode) {
        await axios.put(`/api/employees/${selectedId}`, {
          name: formData.name,
          email: formData.email,
          role: formData.role
        });
        addToast('Employee updated successfully', 'success');
      } else {
        await axios.post('/api/employees', formData);
        addToast('Employee added to roster', 'success');
      }
      setIsModalOpen(false);
      fetchEmployees();
    } catch (err) {
      console.error('Save employee error:', err);
      const msg = err.response?.data?.message || 'Failed to save employee profile.';
      addToast(msg, 'error');
    }
  };

  const handleDelete = async (emp) => {
    if (emp.id === currentUser?.id) {
      addToast('Cannot delete your own profile account!', 'error');
      return;
    }
    if (emp.role === 'owner') {
      addToast('Workspace owner cannot be deleted.', 'error');
      return;
    }
    if (!window.confirm(`Delete ${emp.name} from the roster?`)) return;
    
    try {
      await axios.delete(`/api/employees/${emp.id}`);
      addToast('Employee profile deleted.', 'info');
      fetchEmployees();
    } catch (err) {
      console.error('Delete employee error:', err);
      addToast('Failed to delete employee.', 'error');
    }
  };

  const handleEditClick = (emp) => {
    setIsEditMode(true);
    setSelectedId(emp.id);
    setFormData({
      name: emp.name,
      email: emp.email,
      password: '', // Password not required on edit
      role: emp.role
    });
    setIsModalOpen(true);
  };

  const handleCreateClick = () => {
    setIsEditMode(false);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'operator'
    });
    setIsModalOpen(true);
  };

  const getRoleBadge = (role) => {
    const badges = {
      owner: 'bg-red-500/10 text-red-400 border-red-500/20',
      admin: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      manager: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      operator: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    };
    return (
      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${badges[role] || badges.operator}`}>
        {role}
      </span>
    );
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 text-left relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-display">Workspace Team Roster</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage employee access, assign roles, and audit permissions for dashboard operation.
          </p>
        </div>
        
        {currentUser?.role === 'owner' || currentUser?.role === 'admin' ? (
          <button
            onClick={handleCreateClick}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white transition shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" /> Add Employee Account
          </button>
        ) : null}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs transition"
          />
        </div>
        <div className="text-xs text-gray-400">
          Active seats logged: <span className="font-bold text-white">{filteredEmployees.length}</span>
        </div>
      </div>

      {/* Table grid */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-900 rounded-xl"></div>
          ))}
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="glass-panel p-16 rounded-2xl text-center border-gray-900 bg-slate-950/20">
          <UserCheck className="h-12 w-12 text-gray-650 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Profiles Listed</h3>
          <p className="text-sm text-gray-550 max-w-sm mx-auto">
            No employee profiles matched the criteria. Create seats to allow operators to log in and chat.
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border-gray-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-900 text-xs">
              <thead className="bg-slate-950/40">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-400 uppercase tracking-wider">Employee Name</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-400 uppercase tracking-wider">Email Address</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-400 uppercase tracking-wider">Role Permission</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-400 uppercase tracking-wider">Created Date</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-900/50">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-900/10 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-white flex items-center gap-2">
                        {emp.name}
                        {emp.id === currentUser?.id && (
                          <span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 text-[8px]">YOU</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-gray-500" />
                        {emp.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(emp.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-450">
                      {new Date(emp.createdAt || Date.now()).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {currentUser?.role === 'owner' || (currentUser?.role === 'admin' && emp.role !== 'owner') ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditClick(emp)}
                            className="text-indigo-400 hover:text-indigo-300 transition font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Edit className="h-3.5 w-3.5" /> Edit
                          </button>
                          {emp.role !== 'owner' && emp.id !== currentUser?.id && (
                            <button
                              onClick={() => handleDelete(emp)}
                              className="text-red-400 hover:text-red-300 transition font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 relative border-gray-850 shadow-2xl">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-1 text-gray-400 hover:text-white rounded-xl hover:bg-gray-900 transition cursor-pointer">
              <X className="h-5 w-5" />
            </button>
            <h3 className="font-bold text-lg text-white mb-6">
              {isEditMode ? 'Update Team Member' : 'Register Team Member'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Jasur Aliev"
                  className="block w-full px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-100 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jasur@aiva.com"
                  className="block w-full px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-100 text-xs focus:outline-none"
                />
              </div>

              {!isEditMode && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 flex items-center gap-1">
                    <Lock className="h-3.5 w-3.5 text-gray-500" /> Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="block w-full px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-100 text-xs focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5 text-gray-500" /> Team Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-300 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="operator">Operator (Chat access only)</option>
                  <option value="manager">Manager (Product & CRM CRUD)</option>
                  <option value="admin">Administrator (Settings CRUD)</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-800 rounded-xl text-xs font-semibold text-gray-300">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white text-xs transition">
                  {isEditMode ? 'Save Changes' : 'Create Seat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
