import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import {
  MessageSquare,
  Award,
  Users,
  DollarSign,
  Zap,
  TrendingUp,
  ChevronRight,
  ArrowUpRight,
  Bot,
  Clock,
  Target
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { company } = useApp();
  const [data, setData] = useState(null);
  const [recentLeads, setRecentLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [analyticsRes, leadsRes] = await Promise.all([
          axios.get('/api/analytics'),
          axios.get('/api/leads')
        ]);
        setData(analyticsRes.data);
        setRecentLeads(leadsRes.data.slice(-5).reverse()); // get last 5 leads
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse text-left">
        <div className="h-10 w-48 bg-gray-900 rounded-lg"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 bg-gray-900 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-gray-900 rounded-2xl lg:col-span-2"></div>
          <div className="h-80 bg-gray-900 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const { summary, charts } = data || {
    summary: { 
      totalConversations: 0, 
      newLeads: 0, 
      convertedCustomers: 0, 
      revenueGenerated: 0, 
      aiResponseRate: 100,
      qualificationRate: 70,
      aov: 550,
      upsellAcceptanceRate: 40,
      avgSalesCycle: 2.1
    },
    charts: { salesGrowth: [], customerGrowth: [], conversationAnalytics: [] }
  };

  const cards = [
    { title: 'Total Conversations', value: summary.totalConversations, icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-500/5' },
    { title: 'New Leads', value: summary.newLeads, icon: Award, color: 'text-amber-400', bg: 'bg-amber-500/5' },
    { title: 'Converted Customers', value: summary.convertedCustomers, icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/5' },
    { title: 'Revenue Generated', value: `$${summary.revenueGenerated}`, icon: DollarSign, color: 'text-purple-400', bg: 'bg-purple-500/5' },
    { title: 'AI Response Rate', value: `${summary.aiResponseRate}%`, icon: Zap, color: 'text-indigo-400', bg: 'bg-indigo-500/5' },
  ];

  const salesFrameworkCards = [
    { title: 'SPIN Qualification', value: `${summary.qualificationRate || 70}%`, icon: Target, color: 'text-yellow-400', bg: 'bg-yellow-500/5' },
    { title: 'Average Deal Size', value: `$${summary.aov || 550}`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/5' },
    { title: 'Avg Sales Cycle', value: `${summary.avgSalesCycle || 2.1} Days`, icon: Clock, color: 'text-pink-400', bg: 'bg-pink-500/5' },
    { title: 'Upsell Success Rate', value: `${summary.upsellAcceptanceRate || 40}%`, icon: Zap, color: 'text-indigo-400', bg: 'bg-indigo-500/5' }
  ];

  return (
    <div className="space-y-8 text-left">
      {/* Welcome Heading */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight font-display">
          Welcome back to {company?.name || 'Workspace'}
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Here is a summary of your AI sales agent's activity and conversion performance.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="glass-panel p-5 rounded-2xl flex flex-col justify-between border-gray-900 bg-slate-900/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400">{card.title}</span>
                <span className={`p-2 rounded-xl ${card.bg} ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-bold text-white tracking-tight">{card.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* SPIN Sales Framework KPI Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-300 tracking-wider">AI SPIN Sales Consultant Metrics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {salesFrameworkCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="glass-panel p-5 rounded-2xl flex flex-col justify-between border-gray-900 bg-slate-900/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400">{card.title}</span>
                  <span className={`p-2 rounded-xl ${card.bg} ${card.color}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-bold text-white tracking-tight">{card.value}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Charts & Side Feed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Growth Chart */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 border-gray-900">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-base text-white">Sales & Revenue Growth</h3>
              <p className="text-xs text-gray-500 mt-0.5">Revenue generated from converted leads</p>
            </div>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" /> Live tracking
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.salesGrowth}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1f2937', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="Sales" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Pipeline Feed */}
        <div className="glass-panel p-6 rounded-2xl border-gray-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-base text-white">Recent Leads</h3>
              <Link to="/dashboard/leads" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center">
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-4">
              {recentLeads.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-xs flex flex-col items-center gap-2">
                  <Bot className="h-8 w-8 text-gray-600" />
                  <p>No leads captured yet.</p>
                  <p className="text-[10px]">Open AI Agent and simulate a chat!</p>
                </div>
              ) : (
                recentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-900/50 border border-gray-900 hover:border-gray-850 transition">
                    <div>
                      <h4 className="font-semibold text-xs text-white">{lead.name}</h4>
                      <p className="text-[10px] text-gray-500 mt-0.5">{lead.phone}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {lead.interestedProduct || 'N/A'}
                      </span>
                      <span className={`block text-[9px] font-bold mt-1.5 uppercase ${
                        lead.status === 'sold' ? 'text-emerald-400' :
                        lead.status === 'lost' ? 'text-red-400' : 'text-amber-400'
                      }`}>
                        {lead.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          {recentLeads.length > 0 && (
            <div className="pt-4 border-t border-gray-900 mt-4 text-center">
              <Link to="/dashboard/agent" className="text-xs text-gray-400 hover:text-indigo-400 transition font-medium inline-flex items-center gap-1.5">
                Simulate Customer Conversation <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Growth */}
        <div className="glass-panel p-6 rounded-2xl border-gray-900">
          <h3 className="font-bold text-base text-white mb-6">Customer Growth</h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.customerGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1f2937', borderRadius: '12px' }} />
                <Line type="monotone" dataKey="Customers" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Conversation volume analytics */}
        <div className="glass-panel p-6 rounded-2xl border-gray-900">
          <h3 className="font-bold text-base text-white mb-6">Daily Conversation Volume</h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.conversationAnalytics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1f2937', borderRadius: '12px' }} />
                <Bar dataKey="Chats" fill="#a855f7" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
