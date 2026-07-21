import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { Plus, Edit2, Trash2, Search, X, Package, Shield, Loader2 } from 'lucide-react';

export default function ProductsPage() {
  const { addToast } = useApp();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    image: '',
    stock: '',
    features: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/products');
      setProducts(res.data);
    } catch (err) {
      console.error('Fetch products error:', err);
      addToast('Failed to load products database.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      price: '',
      description: '',
      category: '',
      image: '',
      stock: '',
      features: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      description: product.description || '',
      category: product.category || '',
      image: product.image || '',
      stock: product.stock.toString(),
      features: Array.isArray(product.features) ? product.features.join(', ') : (product.features || '')
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await axios.delete(`/api/products/${id}`);
      addToast('Product deleted successfully', 'success');
      fetchProducts();
    } catch (err) {
      console.error('Delete product error:', err);
      addToast('Failed to delete product', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      addToast('Name and price are required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock || '0'),
        features: formData.features
      };

      if (editingProduct) {
        await axios.put(`/api/products/${editingProduct.id}`, payload);
        addToast('Product updated successfully', 'success');
      } else {
        await axios.post('/api/products', payload);
        addToast('Product added successfully', 'success');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error('Submit product error:', err);
      addToast('Failed to save product details.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 text-left relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-display">Product Knowledge Base</h1>
          <p className="text-gray-400 text-sm mt-1">
            Build and edit the catalog of products that your AI Sales Agent uses to communicate.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white transition shadow-lg shadow-indigo-600/20 cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" /> Add New Product
        </button>
      </div>

      {/* Search & Statistics */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search products by name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs transition"
          />
        </div>
        <div className="text-xs text-gray-400">
          Showing <span className="font-semibold text-white">{filteredProducts.length}</span> of {products.length} products
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-80 bg-gray-900 rounded-2xl"></div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="glass-panel p-16 rounded-2xl text-center border-gray-900 bg-slate-950/20">
          <Package className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Products Configured</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
            Your catalog is currently empty. Add products so the AI Agent can read specs and start answering sales queries.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold text-white text-xs transition cursor-pointer"
          >
            Add First Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="glass-panel rounded-2xl overflow-hidden flex flex-col justify-between border-gray-900 relative group"
            >
              {/* Product Info */}
              <div>
                <div className="h-44 w-full bg-slate-900 relative overflow-hidden">
                  <img
                    src={product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60'}
                    alt={product.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-gray-950/80 backdrop-blur border border-gray-800 text-[10px] font-bold text-white">
                    Stock: {product.stock}
                  </div>
                </div>
                <div className="p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{product.category || 'Product'}</span>
                    <span className="text-sm font-extrabold text-emerald-400">${product.price}</span>
                  </div>
                  <h3 className="font-bold text-base text-white truncate">{product.name}</h3>
                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{product.description}</p>

                  {/* Features badges */}
                  {product.features && product.features.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {product.features.slice(0, 3).map((feat, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-full bg-slate-900 border border-gray-850 text-[9px] text-gray-500">
                          {feat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons overlay */}
              <div className="p-4 border-t border-gray-900/50 bg-slate-950/20 flex gap-2">
                <button
                  onClick={() => handleOpenEdit(product)}
                  className="flex-1 py-1.5 rounded-lg border border-gray-850 hover:border-gray-700 bg-gray-900/40 text-xs font-semibold text-gray-300 hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="h-3 w-3" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="py-1.5 px-3 rounded-lg border border-red-500/20 hover:border-red-500 bg-red-500/5 hover:bg-red-500/10 text-xs font-semibold text-red-400 transition flex items-center justify-center cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CRUD Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 relative border-gray-850 shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white hover:bg-gray-900 rounded-xl transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="font-bold text-lg text-white mb-6">
              {editingProduct ? 'Edit Product Details' : 'Add New Product to Base'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="iPhone 15 Pro"
                    className="block w-full px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="999.00"
                    className="block w-full px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="E-commerce / Phones"
                    className="block w-full px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Stock Units</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="10"
                    className="block w-full px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Image URL</label>
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="block w-full px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Summarize product specifications for the AI. Mention capacity, size, processor type, etc."
                  rows="3"
                  className="block w-full px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Key Features (comma-separated)</label>
                <input
                  type="text"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder="Titanium build, A17 Pro Chip, 48MP Camera"
                  className="block w-full px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-800 rounded-xl hover:bg-gray-900 text-xs font-semibold text-gray-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white text-xs transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/10 cursor-pointer"
                >
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
