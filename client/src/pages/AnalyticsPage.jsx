import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { BarChart3, TrendingUp, Zap, Users, MessageSquare, PieChart as PieIcon, HelpCircle, DollarSign, Clock, Target } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export default function AnalyticsPage() {
  const { addToast } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/analytics');
        setData(res.data);
      } catch (err) {
        console.error('Analytics load error:', err);
        addToast('Failed to fetch analytics metrics.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [addToast]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse text-left">
        <div className="h-10 w-48 bg-gray-900 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-900 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-gray-900 rounded-2xl"></div>
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
      conversionRate: 25,
      aov: 550,
      upsellAcceptanceRate: 40,
      crossSellAcceptanceRate: 35,
      avgSalesCycle: 2.1
    },
    charts: { salesGrowth: [], customerGrowth: [], conversationAnalytics: [], salesFunnel: [], totalMessagesBreakdown: [] }
  };

  // Safe division to prevent NaN
  const totalLeads = charts.salesFunnel?.reduce((sum, item) => sum + item.value, 0) || 0;
  const soldLeads = charts.salesFunnel?.find(f => f.name.includes('Converted'))?.value || 0;
  const conversionRate = totalLeads > 0 ? Math.round((soldLeads / totalLeads) * 100) : (summary.conversionRate || 0);

  // Custom Colors for Pie chart
  const COLORS = ['#6366f1', '#a855f7', '#06b6d4'];

  const metricCards = [
    { title: 'Response Automation Rate', value: `${summary.aiResponseRate}%`, subtitle: 'Chats managed by AI Agent', icon: Zap, color: 'text-indigo-400' },
    { title: 'Total Leads Captured', value: totalLeads || summary.newLeads + summary.convertedCustomers, subtitle: 'Opportunities recorded', icon: Users, color: 'text-blue-400' },
    { title: 'Pipeline Conversion Rate', value: `${conversionRate}%`, subtitle: 'Opportunities won', icon: TrendingUp, color: 'text-emerald-400' },
    { title: 'Gross Pipeline Revenue', value: `$${summary.revenueGenerated}`, subtitle: 'Closed won revenue', icon: BarChart3, color: 'text-purple-400' }
  ];

  const salesFrameworkCards = [
    { title: 'SPIN Qualification Rate', value: `${summary.qualificationRate}%`, subtitle: 'Conversations with Lead Score > 50%', icon: Zap, color: 'text-yellow-400' },
    { title: 'Average Order Value (AOV)', value: `$${summary.aov}`, subtitle: 'Average closed deal revenue value', icon: DollarSign, color: 'text-emerald-400' },
    { title: 'Average Sales Cycle', value: `${summary.avgSalesCycle} Days`, subtitle: 'Average deal close speed timeline', icon: Clock, color: 'text-pink-400' },
    { title: 'Upsell Acceptance Rate', value: `${summary.upsellAcceptanceRate}%`, subtitle: 'Tiers & package upgrade conversions', icon: Target, color: 'text-indigo-400' }
  ];

  return (
    <div className="space-y-8 text-left">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight font-display">SaaS Performance Analytics</h1>
        <p className="text-gray-400 text-sm mt-1">
          Detailed metrics showing AIVA response automated efficiency, lead capture conversion, and sales pipeline statistics.
        </p>
      </div>

      {/* Grid of Key Analytics Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="glass-panel p-6 rounded-2xl border-gray-900 bg-slate-900/10">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-gray-500">{card.title}</p>
                  <p className="text-2xl font-bold text-white tracking-tight mt-2">{card.value}</p>
                </div>
                <span className={`p-2 rounded-xl bg-gray-900 border border-gray-800 ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <p className="text-[10px] text-gray-400 mt-4 font-medium">{card.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* Grid of SPIN Sales Framework KPIs */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">AI SPIN Consultative Sales KPIs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {salesFrameworkCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="glass-panel p-6 rounded-2xl border-gray-900 bg-slate-900/10">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-gray-500">{card.title}</p>
                    <p className="text-2xl font-bold text-white tracking-tight mt-2">{card.value}</p>
                  </div>
                  <span className={`p-2 rounded-xl bg-gray-900 border border-gray-800 ${card.color}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-4 font-medium">{card.subtitle}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Chart Containers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Pipeline Funnel chart */}
        <div className="glass-panel p-6 rounded-2xl border-gray-900">
          <h3 className="font-bold text-base text-white mb-2">Sales Funnel stages</h3>
          <p className="text-xs text-gray-500 mb-6">Leads count categorized by CRM pipeline stages</p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.salesFunnel} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                <XAxis type="number" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} width={120} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1f2937', borderRadius: '12px' }} />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} maxBarSize={30}>
                  {charts.salesFunnel.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 3 ? '#10b981' : index === 4 ? '#ef4444' : '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Message automation Breakdown */}
        <div className="glass-panel p-6 rounded-2xl border-gray-900 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-white mb-2">Message Source Distribution</h3>
            <p className="text-xs text-gray-500 mb-6">Proportion of messages sent by AI vs Customer vs Humans</p>
            <div className="h-60 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.totalMessagesBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {charts.totalMessagesBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1f2937', borderRadius: '12px' }} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="text-[10px] text-center text-gray-500 flex items-center justify-center gap-1.5 pt-4 border-t border-gray-900 mt-4">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>AI answers represent automated responses. Human answers are dashboard override events.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
