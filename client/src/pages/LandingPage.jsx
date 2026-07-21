import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Bot, Shield, Zap, TrendingUp, Clock, MessageSquare, Check, ArrowRight, Play } from 'lucide-react';

export default function LandingPage() {
  const { token, loginDemo } = useApp();
  const navigate = useNavigate();

  const handleDemoClick = async () => {
    const res = await loginDemo();
    if (res.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-950 overflow-hidden text-gray-100 selection:bg-indigo-500 selection:text-white">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-1/2 right-1/10 w-80 h-80 bg-pink-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/10 left-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Navigation Header */}
      <header className="relative z-10 border-b border-gray-900 bg-gray-950/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-2xl tracking-wider text-white">
            <span className="p-2 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Bot className="h-6 w-6 text-white" />
            </span>
            <span>AIVA</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-indigo-400 transition">Features</a>
            <a href="#problem" className="hover:text-indigo-400 transition">Why AIVA</a>
            <a href="#pricing" className="hover:text-indigo-400 transition">Pricing</a>
          </nav>
          <div className="flex items-center gap-4">
            {token ? (
              <Link to="/dashboard" className="px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-2 shadow-lg shadow-indigo-500/20">
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-gray-300 hover:text-white transition">
                  Sign In
                </Link>
                <button onClick={handleDemoClick} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:text-white border border-emerald-500/30 hover:border-emerald-500 rounded-lg bg-emerald-500/5 hover:bg-emerald-500/20 transition cursor-pointer">
                  <Play className="h-3 w-3 fill-current" /> Fast Demo
                </button>
                <Link to="/register" className="px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-500/25">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-8 animate-pulse">
          <Zap className="h-3.5 w-3.5" /> Introducing AIVA 1.0 — The AI Sales Employee
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 font-display max-w-5xl mx-auto leading-tight">
          Your AI Employee For <span className="text-gradient">Automated Sales</span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
          Instantly respond to customers, answer complex product queries, capture leads, and close sales 24/7. Ready to deploy for your business in 5 minutes.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/register" className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/30 text-base">
            Start Growing Sales <ArrowRight className="h-5 w-5" />
          </Link>
          <button onClick={handleDemoClick} className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold bg-slate-900 border border-slate-800 hover:border-slate-700 text-gray-200 hover:text-white transition flex items-center justify-center gap-3 hover:bg-slate-850 text-base cursor-pointer">
            <Bot className="h-5 w-5 text-indigo-400" /> Open Interactive Demo
          </button>
        </div>

        {/* Floating Mockup Preview */}
        <div className="mt-16 relative mx-auto max-w-5xl rounded-2xl border border-gray-800 bg-gray-900/50 p-3 shadow-2xl backdrop-blur-sm animate-float">
          <div className="rounded-xl border border-gray-800 bg-gray-950/80 overflow-hidden shadow-inner flex flex-col md:flex-row h-[350px]">
            {/* Mock Client Widget Preview */}
            <div className="w-full md:w-2/5 border-r border-gray-900 bg-gray-950 p-6 flex flex-col justify-between text-left text-xs">
              <div className="flex items-center gap-2 pb-4 border-b border-gray-900">
                <div className="h-7 w-7 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">A</div>
                <div>
                  <h4 className="font-semibold text-white">AIVA Sales Agent</h4>
                  <p className="text-[10px] text-emerald-400">● Online</p>
                </div>
              </div>
              <div className="flex-1 py-4 flex flex-col gap-3 overflow-y-auto">
                <div className="self-start bg-slate-900 text-gray-300 rounded-lg p-2.5 max-w-[85%]">
                  iPhone 15 bormi?
                </div>
                <div className="self-end bg-indigo-600 text-white rounded-lg p-2.5 max-w-[85%]">
                  Yes, iPhone 15 is available for $700. It features a 128GB capacity and an advanced camera. Would you like delivery?
                </div>
              </div>
              <div className="pt-2 border-t border-gray-900 flex items-center justify-between">
                <span className="text-gray-500">Ask about products...</span>
                <span className="px-2 py-1 bg-indigo-600/20 text-indigo-400 rounded">Send</span>
              </div>
            </div>
            {/* Mock CRM Dashboard Preview */}
            <div className="hidden md:flex flex-1 bg-slate-950 p-6 flex-col text-left">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-sm text-white">Lead Workspace CRM</h4>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium">Synced</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-900 border border-gray-800 text-xs">
                  <div>
                    <p className="font-medium text-white">Anvar Alimov</p>
                    <p className="text-[10px] text-gray-500">+998 90 123 45 67</p>
                  </div>
                  <span className="px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px]">Interested: iPhone 15</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-600/20 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">Sold ($700)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-900 border border-gray-800 text-xs">
                  <div>
                    <p className="font-medium text-white">Elena Petrova</p>
                    <p className="text-[10px] text-gray-500">+7 910 123 45 67</p>
                  </div>
                  <span className="px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px]">Interested: iPad Pro</span>
                  <span className="px-2 py-0.5 rounded bg-amber-600/20 text-amber-400 text-[10px] font-semibold border border-amber-500/20">Negotiation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem & Solution Section */}
      <section id="problem" className="relative z-10 border-t border-gray-900 bg-gray-950/50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                The Hard Truth: <br />
                <span className="text-red-400">Delayed Responses Lose Customers</span>
              </h2>
              <p className="text-gray-400 leading-relaxed mb-6">
                Over 78% of customers buy from the business that responds first. If your sales managers are busy, offline, or sleeping, those prospects disappear forever.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-red-500/10 rounded-lg text-red-400 mt-1">✕</div>
                  <p className="text-gray-300"><span className="font-semibold text-white">No 24/7 availability:</span> Missed night queries, weekend traffic, and global leads.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-red-500/10 rounded-lg text-red-400 mt-1">✕</div>
                  <p className="text-gray-300"><span className="font-semibold text-white">Slow human responses:</span> Takes minutes or hours instead of milliseconds.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-indigo-950/20 border border-indigo-500/10 rounded-2xl p-8 backdrop-blur-sm">
              <span className="p-3 bg-indigo-600/20 text-indigo-400 rounded-xl inline-block mb-6">
                <Bot className="h-6 w-6" />
              </span>
              <h3 className="text-2xl font-bold text-white mb-4">
                The Solution: AIVA Sales Employee
              </h3>
              <p className="text-gray-400 leading-relaxed mb-6">
                AIVA acts as a direct sales rep. It reads your product catalog, understands client intentions, lists product benefits, gathers contact numbers, and automatically logs leads.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400 mt-1">✓</div>
                  <p className="text-gray-300"><span className="font-semibold text-white">Instant replies:</span> AI responds in under a second in English, Uzbek, or Russian.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400 mt-1">✓</div>
                  <p className="text-gray-300"><span className="font-semibold text-white">Lead capture:</span> Gently guides customers to input their name and phone number.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Features Designed for Hyper-Growth</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Everything you need to automate customer relations, capture leads, and analyze your sales pipelines.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="glass-panel glass-panel-hover p-8 rounded-2xl text-left">
            <span className="p-3 bg-indigo-600/10 text-indigo-400 rounded-xl inline-block mb-6">
              <Clock className="h-6 w-6" />
            </span>
            <h3 className="text-lg font-bold text-white mb-2">24/7 Automated Support</h3>
            <p className="text-sm text-gray-400 leading-relaxed">No breaks, no holidays. AIVA handles thousands of parallel inquiries instantly, keeping your store online day and night.</p>
          </div>

          <div className="glass-panel glass-panel-hover p-8 rounded-2xl text-left">
            <span className="p-3 bg-indigo-600/10 text-indigo-400 rounded-xl inline-block mb-6">
              <Shield className="h-6 w-6" />
            </span>
            <h3 className="text-lg font-bold text-white mb-2">Product Knowledge Base</h3>
            <p className="text-sm text-gray-400 leading-relaxed">Input your products, pricing, specifications, and features. AIVA memorizes everything to answer customer inquiries correctly.</p>
          </div>

          <div className="glass-panel glass-panel-hover p-8 rounded-2xl text-left">
            <span className="p-3 bg-indigo-600/10 text-indigo-400 rounded-xl inline-block mb-6">
              <MessageSquare className="h-6 w-6" />
            </span>
            <h3 className="text-lg font-bold text-white mb-2">Smart CRM Integration</h3>
            <p className="text-sm text-gray-400 leading-relaxed">Incoming customer details and historical conversations are automatically organized into an interactive CRM database.</p>
          </div>

          <div className="glass-panel glass-panel-hover p-8 rounded-2xl text-left">
            <span className="p-3 bg-indigo-600/10 text-indigo-400 rounded-xl inline-block mb-6">
              <TrendingUp className="h-6 w-6" />
            </span>
            <h3 className="text-lg font-bold text-white mb-2">Detailed Analytics</h3>
            <p className="text-sm text-gray-400 leading-relaxed">Track message statistics, lead conversions, product interest trends, and sales growth through rich, interactive visual charts.</p>
          </div>

          <div className="glass-panel glass-panel-hover p-8 rounded-2xl text-left">
            <span className="p-3 bg-indigo-600/10 text-indigo-400 rounded-xl inline-block mb-6">
              <Bot className="h-6 w-6" />
            </span>
            <h3 className="text-lg font-bold text-white mb-2">Custom Brand Settings</h3>
            <p className="text-sm text-gray-400 leading-relaxed">Choose your AI’s name, customize company introductions, define brand tone (Friendly, Casual, Professional), and working hours.</p>
          </div>

          <div className="glass-panel glass-panel-hover p-8 rounded-2xl text-left">
            <span className="p-3 bg-indigo-600/10 text-indigo-400 rounded-xl inline-block mb-6">
              <Zap className="h-6 w-6" />
            </span>
            <h3 className="text-lg font-bold text-white mb-2">Multi-lingual Agent</h3>
            <p className="text-sm text-gray-400 leading-relaxed">Communicate naturally with customers in Uzbek, Russian, and English. Auto-detects language and maintains fluent sales conversations.</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 border-t border-gray-900 bg-gray-950/40 py-24">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Flexible SaaS Pricing Plans</h2>
          <p className="text-gray-400 max-w-xl mx-auto mb-16">Deploy AIVA at any scale. Cancel or upgrade your plan at any time.</p>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <div className="glass-panel p-8 rounded-2xl border border-gray-800 text-left flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
                <p className="text-xs text-gray-400 mb-6">Perfect for small local shops</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold text-white">$19</span>
                  <span className="text-sm text-gray-500">/month</span>
                </div>
                <ul className="space-y-3.5 text-sm text-gray-300 mb-8">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> Up to 20 Products</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> 1,000 Chats/month</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> Fallback AI Assistant</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> Basic Analytics</li>
                </ul>
              </div>
              <Link to="/register" className="w-full py-3 rounded-xl font-semibold bg-gray-900 hover:bg-gray-850 border border-gray-800 text-center text-white transition">
                Start Free Trial
              </Link>
            </div>

            {/* Business Plan (Recommended) */}
            <div className="glass-panel p-8 rounded-2xl border-2 border-indigo-600 text-left relative flex flex-col justify-between shadow-xl shadow-indigo-600/10">
              <span className="absolute top-0 right-6 -translate-y-1/2 px-3 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold tracking-wider uppercase">Recommended</span>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Business</h3>
                <p className="text-xs text-indigo-300 mb-6">Best for growing ecommerce brands</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold text-white">$49</span>
                  <span className="text-sm text-gray-500">/month</span>
                </div>
                <ul className="space-y-3.5 text-sm text-gray-300 mb-8">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> Unlimited Products</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> 10,000 Chats/month</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> OpenAI Core Integration</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> Live CRM & Leads Manager</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> Premium Analytics Charts</li>
                </ul>
              </div>
              <Link to="/register" className="w-full py-3 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-500 text-center text-white transition shadow-lg shadow-indigo-500/25">
                Get Started Now
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="glass-panel p-8 rounded-2xl border border-gray-800 text-left flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
                <p className="text-xs text-gray-400 mb-6">Custom deployment for large brands</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold text-white">$149</span>
                  <span className="text-sm text-gray-500">/month</span>
                </div>
                <ul className="space-y-3.5 text-sm text-gray-300 mb-8">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> Unlimited Products & Chats</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> Custom GPT Model Fine-tuning</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> Dedicated Account Manager</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> Telegram, WhatsApp APIs</li>
                </ul>
              </div>
              <a href="mailto:support@aiva.com" className="w-full py-3 rounded-xl font-semibold bg-gray-900 hover:bg-gray-850 border border-gray-800 text-center text-white transition">
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-900 bg-gray-950 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 font-bold text-lg text-white">
            <span className="p-1.5 bg-indigo-600 rounded flex items-center justify-center">
              <Bot className="h-4.5 w-4.5 text-white" />
            </span>
            <span>AIVA AI</span>
          </div>
          <p className="text-xs text-gray-500">© 2026 AIVA. All rights reserved. Built for modern digital business operations.</p>
          <div className="flex gap-6 text-xs text-gray-400">
            <span className="hover:text-indigo-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-indigo-400 cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
