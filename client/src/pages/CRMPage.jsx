import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { Search, Users, Phone, Calendar, ShoppingBag, Eye } from 'lucide-react';

export default function CRMPage() {
  const { addToast } = useApp();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/leads');
        setLeads(res.data);
      } catch (err) {
        console.error('CRM load error:', err);
        addToast('Failed to load CRM database.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, [addToast]);

  const filteredLeads = leads.filter((lead) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      lead.name.toLowerCase().includes(query) ||
      lead.phone.toLowerCase().includes(query) ||
      (lead.email && lead.email.toLowerCase().includes(query));
    
    const matchesFilter = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status) => {
    const styles = {
      new: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      contacted: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      negotiation: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      sold: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      lost: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${styles[status] || styles.new}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-8 text-left">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight font-display">Customer CRM</h1>
        <p className="text-gray-400 text-sm mt-1">
          Monitor your customer history, search contact details, and review their purchase conversion statuses.
        </p>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search by customer name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs transition"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full sm:w-auto px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition cursor-pointer"
          >
            <option value="all" className="bg-gray-950">All Statuses</option>
            <option value="new" className="bg-gray-950">New</option>
            <option value="contacted" className="bg-gray-950">Contacted</option>
            <option value="negotiation" className="bg-gray-950">Negotiation</option>
            <option value="sold" className="bg-gray-950">Sold</option>
            <option value="lost" className="bg-gray-950">Lost</option>
          </select>
        </div>
      </div>

      {/* CRM Grid / List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-900 rounded-xl"></div>
          ))}
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="glass-panel p-16 rounded-2xl text-center border-gray-900 bg-slate-950/20">
          <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Contacts Found</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            No customer profiles match your search criteria. Customers appear here once they leave details via AIVA chat.
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border-gray-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-900 text-xs">
              <thead className="bg-slate-950/40">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-400 uppercase tracking-wider">Customer Name</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-400 uppercase tracking-wider">Contact Info</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-400 uppercase tracking-wider">Interested Product</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-400 uppercase tracking-wider">Created Date</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-400 uppercase tracking-wider">Deal Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-900/50 bg-transparent">
                {filteredLeads.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-900/10 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-white">{customer.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-300 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-gray-500" />
                        {customer.phone}
                      </div>
                      {customer.email && (
                        <div className="text-[10px] text-gray-500 mt-0.5">{customer.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.interestedProduct ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px]">
                          <ShoppingBag className="h-3 w-3" />
                          {customer.interestedProduct}
                        </span>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-gray-500" />
                        {new Date(customer.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(customer.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
