import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { Plus, Award, Check, X, Search, DollarSign, Loader2, ArrowRight } from 'lucide-react';

export default function LeadsPage() {
  const { addToast, addNotification } = useApp();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create manual lead states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    interestedProduct: '',
    status: 'new',
    revenue: '0'
  });
  const [submitting, setSubmitting] = useState(false);

  // Revenue capture modal for sold status
  const [revenueModal, setRevenueModal] = useState({ open: false, leadId: null, productName: '', amount: '500' });

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/leads');
      setLeads(res.data);
    } catch (err) {
      console.error('Fetch leads error:', err);
      addToast('Failed to load leads list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleStatusChange = async (leadId, newStatus) => {
    // If status updated to 'sold', open a dialog to confirm the sale amount
    if (newStatus === 'sold') {
      const lead = leads.find(l => l.id === leadId);
      let defaultPrice = '500';
      
      // Try to find matching product price
      if (lead && lead.interestedProduct) {
        try {
          const prodRes = await axios.get('/api/products');
          const product = prodRes.data.find(p => p.name === lead.interestedProduct);
          if (product) defaultPrice = product.price.toString();
        } catch (e) {
          // Fallback to 500
        }
      }
      setRevenueModal({ open: true, leadId, productName: lead?.interestedProduct || 'Product', amount: defaultPrice });
      return;
    }

    try {
      await axios.put(`/api/leads/${leadId}`, { status: newStatus });
      addToast(`Lead status updated to ${newStatus}`, 'success');
      fetchLeads();
    } catch (err) {
      console.error('Update status error:', err);
      addToast('Failed to update lead status.', 'error');
    }
  };

  const handleRevenueSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/leads/${revenueModal.leadId}`, {
        status: 'sold',
        revenue: parseFloat(revenueModal.amount)
      });
      addToast(`Sale logged successfully! Revenue: $${revenueModal.amount}`, 'success');
      addNotification('Sale Completed', `Recorded $${revenueModal.amount} in revenue from completed lead sale.`, 'success');
      setRevenueModal({ open: false, leadId: null, productName: '', amount: '0' });
      fetchLeads();
    } catch (err) {
      console.error('Save sale error:', err);
      addToast('Failed to record sale revenue.', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      addToast('Name and phone are required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post('/api/leads', formData);
      addToast('Lead recorded successfully', 'success');
      setIsModalOpen(false);
      fetchLeads();
    } catch (err) {
      console.error('Create lead error:', err);
      addToast('Failed to record manual lead.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lead pipeline entry?')) return;
    try {
      await axios.delete(`/api/leads/${id}`);
      addToast('Lead deleted.', 'info');
      fetchLeads();
    } catch (err) {
      console.error('Delete lead error:', err);
      addToast('Failed to delete lead.', 'error');
    }
  };

  const filteredLeads = leads.filter((l) =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.interestedProduct && l.interestedProduct.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8 text-left relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-display">Lead Management</h1>
          <p className="text-gray-400 text-sm mt-1">
            Track business interest leads captured by AIVA. Update statuses to reflect sales progress.
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: '', phone: '', email: '', interestedProduct: '', status: 'new', revenue: '0' });
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white transition shadow-lg shadow-indigo-600/20 cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" /> Create Lead Manually
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search by customer, phone, product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs transition"
          />
        </div>
        <div className="text-xs text-gray-400">
          Total Captured: <span className="font-bold text-white">{filteredLeads.length}</span>
        </div>
      </div>

      {/* Leads Table */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-900 rounded-xl"></div>
          ))}
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="glass-panel p-16 rounded-2xl text-center border-gray-900 bg-slate-950/20">
          <Award className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Active Leads</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Your pipeline is empty. Try talking to the AI Agent in the sandbox to simulate client requests and generate leads.
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border-gray-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-900 text-xs">
              <thead className="bg-slate-950/40">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-400 uppercase tracking-wider">Interested Product</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-400 uppercase tracking-wider">Sales Stage Status</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-400 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-900/50">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-900/10 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-white">{lead.name}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{lead.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-medium">
                        {lead.interestedProduct || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        className={`px-2 py-1 rounded border text-[10px] font-bold focus:outline-none bg-slate-950 cursor-pointer ${
                          lead.status === 'sold' ? 'text-emerald-400 border-emerald-500/35' :
                          lead.status === 'lost' ? 'text-red-400 border-red-500/35' :
                          lead.status === 'negotiation' ? 'text-amber-400 border-amber-500/35' :
                          'text-indigo-400 border-indigo-500/35'
                        }`}
                      >
                        <option value="new">NEW</option>
                        <option value="contacted">CONTACTED</option>
                        <option value="negotiation">NEGOTIATION</option>
                        <option value="sold">SOLD</option>
                        <option value="lost">LOST</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-300">
                      {lead.status === 'sold' ? (
                        <span className="text-emerald-400 font-bold">${lead.revenue || 0}</span>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDelete(lead.id)}
                        className="text-red-400 hover:text-red-300 transition font-semibold"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Lead Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 relative border-gray-850 shadow-2xl">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-1 text-gray-400 hover:text-white rounded-xl hover:bg-gray-900 transition">
              <X className="h-5 w-5" />
            </button>
            <h3 className="font-bold text-lg text-white mb-6">Create Customer Lead</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Davron Karimov"
                  className="block w-full px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-100 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+998901234567"
                  className="block w-full px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-100 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="davron@mail.ru"
                  className="block w-full px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-100 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Interested Product Name</label>
                <input
                  type="text"
                  value={formData.interestedProduct}
                  onChange={(e) => setFormData({ ...formData, interestedProduct: e.target.value })}
                  placeholder="iPhone 15 Pro"
                  className="block w-full px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-100 text-xs focus:outline-none"
                />
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-800 rounded-xl text-xs font-semibold text-gray-300">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white text-xs transition">
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Log Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sale Revenue Capture Modal */}
      {revenueModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-sm rounded-2xl p-6 relative border-gray-850 shadow-2xl">
            <h3 className="font-bold text-lg text-emerald-400 mb-2 flex items-center gap-1.5">
              <DollarSign className="h-5 w-5" /> Record Sale Details
            </h3>
            <p className="text-gray-400 text-xs mb-4">
              Enter the actual revenue gained from completing the order of <strong>{revenueModal.productName}</strong>.
            </p>

            <form onSubmit={handleRevenueSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Sale Price ($)</label>
                <input
                  type="number"
                  required
                  value={revenueModal.amount}
                  onChange={(e) => setRevenueModal({ ...revenueModal, amount: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-100 text-xs focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setRevenueModal({ open: false, leadId: null, productName: '', amount: '0' })}
                  className="px-4 py-2 border border-gray-800 rounded-xl text-xs font-semibold text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-xs transition flex items-center gap-1 cursor-pointer"
                >
                  Confirm Sale <Check className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
