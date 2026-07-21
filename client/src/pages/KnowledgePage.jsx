import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { Plus, Search, Trash2, Edit, BookOpen, AlertCircle, X, HelpCircle, FileText, Settings } from 'lucide-react';

export default function KnowledgePage() {
  const { addToast } = useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('faq');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'faq'
  });

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/knowledge?type=${activeTab}`);
      setItems(res.data);
    } catch (err) {
      console.error('Fetch knowledge items failed:', err);
      addToast('Failed to load knowledge base items.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      addToast('Title and content are required', 'error');
      return;
    }
    
    try {
      if (isEditMode) {
        await axios.put(`/api/knowledge/${selectedId}`, formData);
        addToast('Knowledge item updated successfully', 'success');
      } else {
        await axios.post('/api/knowledge', formData);
        addToast('Knowledge item added to database', 'success');
      }
      setIsModalOpen(false);
      fetchItems();
    } catch (err) {
      console.error('Save knowledge item error:', err);
      addToast('Failed to save knowledge item.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item from the AI knowledge base?')) return;
    try {
      await axios.delete(`/api/knowledge/${id}`);
      addToast('Item removed.', 'info');
      fetchItems();
    } catch (err) {
      console.error('Delete knowledge item error:', err);
      addToast('Failed to delete item.', 'error');
    }
  };

  const handleEditClick = (item) => {
    setIsEditMode(true);
    setSelectedId(item.id);
    setFormData({
      title: item.title,
      content: item.content,
      type: item.type
    });
    setIsModalOpen(true);
  };

  const handleCreateClick = () => {
    setIsEditMode(false);
    setFormData({
      title: '',
      content: '',
      type: activeTab
    });
    setIsModalOpen(true);
  };

  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { value: 'faq', label: 'FAQs & Answers', icon: HelpCircle },
    { value: 'document', label: 'Company Info Docs', icon: FileText },
    { value: 'policy', label: 'Returns & Policies', icon: Settings }
  ];

  return (
    <div className="space-y-8 text-left relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-display">Product Knowledge Base</h1>
          <p className="text-gray-400 text-sm mt-1">
            Maintain documents and questions. AIVA references these facts when answering customers.
          </p>
        </div>
        <button
          onClick={handleCreateClick}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white transition shadow-lg shadow-indigo-600/20 cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" /> Add Knowledge Item
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-900 overflow-x-auto gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => {
                setActiveTab(tab.value);
                setSearchQuery('');
              }}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition cursor-pointer shrink-0 ${
                isActive
                  ? 'border-indigo-500 text-white font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder={`Search ${activeTab} content...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs transition"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-900 rounded-xl"></div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="glass-panel p-16 rounded-2xl text-center border-gray-900 bg-slate-950/20">
          <BookOpen className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Knowledge Base Empty</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            You haven't uploaded any {activeTab} files to the library. Add items so your digital representative can answer detailed specifications.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="glass-panel p-5 rounded-2xl border-gray-900/80 bg-slate-950/30 flex flex-col justify-between hover:border-indigo-500/20 transition group">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-sm text-white leading-snug">{item.title}</h4>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition shrink-0 ml-2">
                    <button
                      onClick={() => handleEditClick(item)}
                      className="p-1 rounded bg-gray-900 border border-gray-800 text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 rounded bg-gray-900 border border-gray-800 text-red-400 hover:text-red-300 transition cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-line truncate-3-lines">
                  {item.content}
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-gray-900/50 flex justify-between items-center text-[10px] text-gray-500">
                <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
                <span className="uppercase text-indigo-400 font-semibold">{item.type}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 relative border-gray-850 shadow-2xl">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-1 text-gray-400 hover:text-white rounded-xl hover:bg-gray-900 transition cursor-pointer">
              <X className="h-5 w-5" />
            </button>
            <h3 className="font-bold text-lg text-white mb-6">
              {isEditMode ? 'Update Knowledge Item' : 'Create Knowledge Item'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Knowledge Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Delivery Price to regions"
                  className="block w-full px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-100 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Content / Response Details *</label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows="6"
                  placeholder="Explain details thoroughly. Specify exact pricing, parameters, or policies so the AI can quote this text directly."
                  className="block w-full px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-100 text-xs focus:outline-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Library Section</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-300 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="faq">FAQ List</option>
                  <option value="document">Corporate Documents</option>
                  <option value="policy">Shipping & Return Policies</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-800 rounded-xl text-xs font-semibold text-gray-300">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white text-xs transition">
                  {isEditMode ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
