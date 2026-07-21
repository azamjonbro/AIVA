import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { Bot, ShieldAlert, Loader2, Sparkles, Scale, DollarSign, Truck, MessageSquare, Check, Wifi, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const { aiSettings, updateSettings, addToast } = useApp();
  
  // State variables for all AI Setting properties
  const [aiName, setAiName] = useState('Aiva');
  const [brandVoice, setBrandVoice] = useState('');
  const [tone, setTone] = useState('friendly');
  const [workingHours, setWorkingHours] = useState('09:00 - 18:00');
  const [languages, setLanguages] = useState(['en']);
  
  const [greetingStyle, setGreetingStyle] = useState('natural');
  const [formality, setFormality] = useState('informal');
  const [emojiUsage, setEmojiUsage] = useState(true);
  const [shippingPolicy, setShippingPolicy] = useState('');
  const [paymentMethods, setPaymentMethods] = useState('');
  const [returnPolicy, setReturnPolicy] = useState('');
  const [responseLength, setResponseLength] = useState('short');
  const [salesStyle, setSalesStyle] = useState('consultative');
  
  // New API configuration states
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('gpt-3.5-turbo');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [claudeApiKey, setClaudeApiKey] = useState('');
  
  // Testing States
  const [testingConnection, setTestingConnection] = useState(false);
  const [testStatus, setTestStatus] = useState({ status: 'idle', message: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (aiSettings) {
      setAiName(aiSettings.aiName || 'Aiva');
      setBrandVoice(aiSettings.brandVoice || '');
      setTone(aiSettings.tone || 'friendly');
      setWorkingHours(aiSettings.workingHours || '09:00 - 18:00');
      setLanguages(aiSettings.languages || ['en']);
      setGreetingStyle(aiSettings.greetingStyle || 'natural');
      setFormality(aiSettings.formality || 'informal');
      setEmojiUsage(aiSettings.emojiUsage !== undefined ? aiSettings.emojiUsage : true);
      setShippingPolicy(aiSettings.shippingPolicy || '');
      setPaymentMethods(aiSettings.paymentMethods || '');
      setReturnPolicy(aiSettings.returnPolicy || '');
      setResponseLength(aiSettings.responseLength || 'short');
      setSalesStyle(aiSettings.salesStyle || 'consultative');
      
      // Load provider settings
      setProvider(aiSettings.provider || 'openai');
      setModel(aiSettings.model || 'gpt-3.5-turbo');
      setOpenaiApiKey(aiSettings.openaiApiKey || '');
      setGeminiApiKey(aiSettings.geminiApiKey || '');
      setClaudeApiKey(aiSettings.claudeApiKey || '');
      setTestStatus({ status: 'idle', message: '' });
    }
  }, [aiSettings]);

  // Update model when provider changes to set a smart default
  const handleProviderChange = (e) => {
    const nextProvider = e.target.value;
    setProvider(nextProvider);
    setTestStatus({ status: 'idle', message: '' });
    if (nextProvider === 'gemini') {
      setModel('gemini-1.5-flash');
    } else if (nextProvider === 'claude') {
      setModel('claude-3-5-sonnet-20240620');
    } else {
      setModel('gpt-3.5-turbo');
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestStatus({ status: 'testing', message: 'Testing connection to provider...' });
    
    let key = '';
    if (provider === 'openai') key = openaiApiKey;
    else if (provider === 'gemini') key = geminiApiKey;
    else if (provider === 'claude') key = claudeApiKey;

    try {
      const res = await axios.post('/api/auth/settings/test-ai', {
        provider,
        model,
        apiKey: key
      });
      if (res.data.success) {
        setTestStatus({ status: 'connected', message: 'Connected successfully!' });
        addToast('AI Connection verified successfully!', 'success');
      } else {
        setTestStatus({ status: 'failed', message: res.data.message || 'Connection failed' });
        addToast('AI Connection failed.', 'error');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Connection test failed';
      setTestStatus({ status: 'failed', message: msg });
      addToast(`Connection error: ${msg}`, 'error');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleLanguageToggle = (lang) => {
    if (languages.includes(lang)) {
      if (languages.length > 1) {
        setLanguages(languages.filter((l) => l !== lang));
      }
    } else {
      setLanguages([...languages, lang]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await updateSettings({
      aiName,
      companyIntroduction: brandVoice, // Sync for legacy schema endpoints
      brandVoice,
      tone,
      workingHours,
      languages,
      greetingStyle,
      formality,
      emojiUsage,
      shippingPolicy,
      paymentMethods,
      returnPolicy,
      responseLength,
      salesStyle,
      provider,
      model,
      openaiApiKey,
      geminiApiKey,
      claudeApiKey
    });
    setSubmitting(false);
  };

  return (
    <div className="space-y-8 text-left max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight font-display">AI Employee Settings</h1>
        <p className="text-gray-400 text-sm mt-1">
          Train and customize your digital sales representative. Tune response behavior, policies, and voice.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Core Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Model & API Provider Settings Card */}
          <div className="glass-panel p-6 rounded-2xl border-gray-900 space-y-6 bg-slate-950/20">
            <h3 className="font-bold text-sm text-white border-b border-gray-900 pb-3 flex items-center gap-2">
              <Wifi className="h-5 w-5 text-indigo-400" /> AI Model & API Provider Settings
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Provider Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">AI Provider</label>
                <select
                  value={provider}
                  onChange={handleProviderChange}
                  className="block w-full px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-300 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="openai">OpenAI (ChatGPT)</option>
                  <option value="gemini">Google Gemini (Optional)</option>
                  <option value="claude">Anthropic Claude (Optional)</option>
                </select>
              </div>

              {/* Model Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">LLM Model</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-300 text-xs focus:outline-none cursor-pointer"
                >
                  {provider === 'gemini' && (
                    <>
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast & Cost-Efficient)</option>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro (High Reasoning)</option>
                    </>
                  )}
                  {provider === 'claude' && (
                    <>
                      <option value="claude-3-5-sonnet-20240620">Claude 3.5 Sonnet (Recommended)</option>
                      <option value="claude-3-opus-20240229">Claude 3 Opus (Powerful)</option>
                      <option value="claude-3-haiku-20240307">Claude 3 Haiku (Fast)</option>
                    </>
                  )}
                  {provider === 'openai' && (
                    <>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Standard)</option>
                      <option value="gpt-4o">GPT-4o (Omni Reasoning)</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Custom Token Inputs */}
            <div className="space-y-3 pt-2">
              {provider === 'openai' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">OpenAI API Key (Optional)</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={openaiApiKey}
                      onChange={(e) => setOpenaiApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="block flex-1 px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-100 text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={testingConnection}
                      onClick={handleTestConnection}
                      className="px-3 py-2 text-xs font-bold bg-gray-900 border border-gray-800 text-gray-300 hover:text-white rounded-xl transition cursor-pointer"
                    >
                      {testingConnection ? 'Testing...' : 'Test Connection'}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Leave blank to use the system default OpenAI API Key configured by server.
                  </p>
                </div>
              )}

              {provider === 'gemini' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Gemini API Key</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="block flex-1 px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-100 text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={testingConnection}
                      onClick={handleTestConnection}
                      className="px-3 py-2 text-xs font-bold bg-gray-900 border border-gray-800 text-gray-300 hover:text-white rounded-xl transition cursor-pointer"
                    >
                      {testingConnection ? 'Testing...' : 'Test Connection'}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Enter your Google Gemini API Key to run your agent on Gemini.
                  </p>
                </div>
              )}

              {provider === 'claude' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Claude API Key</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={claudeApiKey}
                      onChange={(e) => setClaudeApiKey(e.target.value)}
                      placeholder="sk-ant-..."
                      className="block flex-1 px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-100 text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={testingConnection}
                      onClick={handleTestConnection}
                      className="px-3 py-2 text-xs font-bold bg-gray-900 border border-gray-800 text-gray-300 hover:text-white rounded-xl transition cursor-pointer"
                    >
                      {testingConnection ? 'Testing...' : 'Test Connection'}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Enter your Anthropic Claude API Key to run your agent on Claude.
                  </p>
                </div>
              )}

              {/* Status Badge */}
              {testStatus.status !== 'idle' && (
                <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-medium ${
                  testStatus.status === 'connected' 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                    : testStatus.status === 'testing'
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}>
                  {testStatus.status === 'connected' && <Check className="h-4 w-4 text-emerald-400" />}
                  {testStatus.status === 'testing' && <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />}
                  {testStatus.status === 'failed' && <AlertTriangle className="h-4 w-4 text-red-400" />}
                  <span>{testStatus.message}</span>
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border-gray-900 space-y-6 bg-slate-950/20">
            
            {/* Personality section */}
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-white border-b border-gray-900 pb-3 flex items-center gap-2">
                <Bot className="h-5 w-5 text-indigo-400" /> Employee Personality & Tone
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* AI Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Employee Name</label>
                  <input
                    type="text"
                    required
                    value={aiName}
                    onChange={(e) => setAiName(e.target.value)}
                    placeholder="Aiva"
                    className="block w-full px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-100 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Sales style */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Sales Pitching Style</label>
                  <select
                    value={salesStyle}
                    onChange={(e) => setSalesStyle(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-300 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="consultative">Consultative (Suggest options politely)</option>
                    <option value="hard-sell">Hard Sell (Urgent calls to action)</option>
                    <option value="soft-sell">Soft Sell (Informational & relaxed)</option>
                    <option value="educational">Educational (Feature deep dive)</option>
                  </select>
                </div>
              </div>

              {/* Brand voice prompt */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Brand Voice & Intro Prompt</label>
                <textarea
                  value={brandVoice}
                  onChange={(e) => setBrandVoice(e.target.value)}
                  placeholder="We offer premium smart watches. Highlight our 1-year product warranty and our shop locator in Tashkent."
                  rows="4"
                  className="block w-full px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-100 text-xs focus:outline-none leading-relaxed focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Advanced Tone Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Default Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-300 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="friendly">Friendly / Warm</option>
                    <option value="professional">Professional / Formal</option>
                    <option value="casual">Casual / Direct</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Greeting Tone Style</label>
                  <select
                    value={greetingStyle}
                    onChange={(e) => setGreetingStyle(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-300 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="natural">Natural Greeting</option>
                    <option value="energetic">Energetic / Welcoming</option>
                    <option value="polite">Polite & Reserved</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Formality</label>
                  <select
                    value={formality}
                    onChange={(e) => setFormality(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-300 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="informal">Informal (Sinfdoshlar kabi)</option>
                    <option value="formal">Formal (Hurmatli mijoz)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {/* Working hours */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Working Hours</label>
                  <input
                    type="text"
                    required
                    value={workingHours}
                    onChange={(e) => setWorkingHours(e.target.value)}
                    placeholder="09:00 - 18:00"
                    className="block w-full px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-100 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Response length */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Response Length</label>
                  <select
                    value={responseLength}
                    onChange={(e) => setResponseLength(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-300 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="short">Short (1-2 sentences)</option>
                    <option value="medium">Medium (2-3 sentences)</option>
                    <option value="long">Detailed / Descriptive</option>
                  </select>
                </div>

                {/* Emojis usage toggle */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Use Emojis</label>
                  <select
                    value={emojiUsage ? 'yes' : 'no'}
                    onChange={(e) => setEmojiUsage(e.target.value === 'yes')}
                    className="block w-full px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-300 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="yes">Yes (Aesthetic & lively)</option>
                    <option value="no">No (Strict text only)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Business policies context */}
            <div className="space-y-4 pt-4 border-t border-gray-900">
              <h3 className="font-bold text-sm text-white pb-1 flex items-center gap-2">
                <Scale className="h-5 w-5 text-indigo-400" /> Business Policies & Rules
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Shipping policy */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1">
                    <Truck className="h-3.5 w-3.5 text-gray-500" /> Shipping Policy
                  </label>
                  <textarea
                    value={shippingPolicy}
                    onChange={(e) => setShippingPolicy(e.target.value)}
                    placeholder="We ship within 24 hours. Tashkent delivery is free, region delivery costs $5."
                    rows="3"
                    className="block w-full px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-100 text-xs focus:outline-none leading-relaxed"
                  />
                </div>

                {/* Payment methods */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-gray-500" /> Payment Methods
                  </label>
                  <textarea
                    value={paymentMethods}
                    onChange={(e) => setPaymentMethods(e.target.value)}
                    placeholder="Click, Payme, cash on delivery, bank transfer."
                    rows="3"
                    className="block w-full px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-100 text-xs focus:outline-none leading-relaxed"
                  />
                </div>

                {/* Return policy */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5 text-gray-500" /> Return Policy
                  </label>
                  <textarea
                    value={returnPolicy}
                    onChange={(e) => setReturnPolicy(e.target.value)}
                    placeholder="Customers can return items within 14 days of purchase if tags are intact."
                    rows="3"
                    className="block w-full px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-100 text-xs focus:outline-none leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Language checklist */}
            <div className="pt-4 border-t border-gray-900">
              <label className="block text-xs font-semibold text-gray-400 mb-2">Fluency Languages</label>
              <div className="flex gap-4">
                {[
                  { value: 'en', label: 'English' },
                  { value: 'uz', label: 'Uzbek (O‘zbekcha)' },
                  { value: 'ru', label: 'Russian (Русский)' }
                ].map((lang) => {
                  const isChecked = languages.includes(lang.value);
                  return (
                    <button
                      key={lang.value}
                      type="button"
                      onClick={() => handleLanguageToggle(lang.value)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                        isChecked
                          ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400'
                          : 'bg-transparent border-gray-800 text-gray-400 hover:text-gray-250'
                      }`}
                    >
                      {lang.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-xs transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/15 cursor-pointer"
              >
                {submitting ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : 'Retrain & Save Settings'}
              </button>
            </div>

          </div>
        </div>

        {/* Side Panel Tips */}
        <div className="space-y-6">
          {/* AI Info details */}
          <div className="glass-panel p-6 rounded-2xl border-gray-900 space-y-4 bg-slate-950/40 text-xs">
            <h4 className="font-bold text-sm text-white flex items-center gap-1">
              <Sparkles className="h-4 w-4 text-indigo-400" /> AIVA Sales Agent Roster
            </h4>
            <p className="text-gray-400 leading-relaxed">
              When saving these settings, the backend triggers model instruction compilation. The next client DM will immediately be handled by this newly configured profile.
            </p>
            <div className="space-y-3 pt-3 border-t border-gray-950">
              <div className="flex justify-between py-1 border-b border-gray-900/60">
                <span className="text-gray-500">AI Active State:</span>
                <span className="font-semibold text-emerald-400">● Live Chat</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-900/60">
                <span className="text-gray-500">Sales Channel:</span>
                <span className="font-semibold text-white">Multichannel</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">LLM Processor:</span>
                <span className="font-semibold text-indigo-400">GPT-3.5 Turbo</span>
              </div>
            </div>
          </div>

          {/* Policy Tips */}
          <div className="glass-panel p-6 rounded-2xl border-gray-900 space-y-3 bg-slate-950/40">
            <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-indigo-400" /> Guardrail Guidelines
            </h4>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Be direct with prices, delivery details, and return windows. AIVA uses these settings as constraints to handle complaints and compare product specs without hallucination.
            </p>
          </div>
        </div>

      </form>
    </div>
  );
}
