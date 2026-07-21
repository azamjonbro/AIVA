import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { 
  History, Search, User, Bot, MessageSquare, AlertCircle, RefreshCw, 
  Hand, ShieldAlert, Send, Sparkles, Target, Zap, Clock, DollarSign, 
  Brain, Heart, Shield, HelpCircle, Activity
} from 'lucide-react';

export default function ConversationsPage() {
  const { addToast } = useApp();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConv, setSelectedConv] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyInput, setReplyInput] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [showSalesPanel, setShowSalesPanel] = useState(true);

  const fetchConversations = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await axios.get('/api/conversations');
      setConversations(res.data);
      
      // Keep selected conversation in sync if it is open
      if (selectedConv) {
        const updated = res.data.find(c => c.id === selectedConv.id);
        if (updated) {
          setSelectedConv(updated);
        }
      } else if (res.data.length > 0 && !silent) {
        setSelectedConv(res.data[0]); // default to first conversation
      }
    } catch (err) {
      console.error('Fetch conversations error:', err);
      if (!silent) addToast('Failed to load conversation history.', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    const timer = setInterval(() => {
      fetchConversations(true);
    }, 5500);
    return () => clearInterval(timer);
  }, [selectedConv?.id]);

  const handleTakeover = async () => {
    if (!selectedConv) return;
    try {
      await axios.post(`/api/conversations/${selectedConv.id}/takeover`);
      addToast('Conversation assigned to human operator.', 'info');
      fetchConversations(true);
    } catch (err) {
      addToast('Failed to takeover conversation.', 'error');
    }
  };

  const handleHandback = async () => {
    if (!selectedConv) return;
    try {
      await axios.post(`/api/conversations/${selectedConv.id}/handback`);
      addToast('AI responder activated for this conversation.', 'success');
      fetchConversations(true);
    } catch (err) {
      addToast('Failed to transfer control to AI.', 'error');
    }
  };

  const handleSendManualMessage = async (e) => {
    e.preventDefault();
    if (!replyInput.trim() || !selectedConv) return;

    setSubmittingReply(true);
    try {
      await axios.post(`/api/conversations/${selectedConv.id}/message`, { text: replyInput });
      setReplyInput('');
      fetchConversations(true);
    } catch (err) {
      addToast('Failed to send operator response.', 'error');
    } finally {
      setSubmittingReply(false);
    }
  };

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const getChannelBadge = (channel) => {
    const badges = {
      sandbox: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25',
      telegram: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
      instagram: 'bg-pink-500/10 text-pink-400 border-pink-500/25'
    };
    return (
      <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${badges[channel] || badges.sandbox}`}>
        {channel}
      </span>
    );
  };

  const getSentimentPill = (sentimentVal) => {
    const sentiment = sentimentVal?.toLowerCase() || 'neutral';
    const styles = {
      positive: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      excited: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 animate-pulse',
      interested: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      concerned: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      confused: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      frustrated: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      negative: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      neutral: 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    };
    return (
      <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${styles[sentiment] || styles.neutral}`}>
        {sentiment}
      </span>
    );
  };

  const getNextBestActionAlert = (actionVal) => {
    const actions = {
      ask_discovery: { label: 'Ask Discovery Query', desc: 'Acquire user situation metrics', style: 'bg-blue-950/15 text-blue-400 border-blue-500/20' },
      present_feature: { label: 'Present AIVA Spec', desc: 'List platform features & specs', style: 'bg-indigo-950/15 text-indigo-400 border-indigo-500/20' },
      suggest_demo: { label: 'Provide Video Demo', desc: 'Direct to video workflows & trust files', style: 'bg-teal-950/15 text-teal-400 border-teal-500/20' },
      recommend_pricing: { label: 'Share Pricing tiers', desc: 'Pitch packages & check budget', style: 'bg-purple-950/15 text-purple-400 border-purple-500/20' },
      close_deal: { label: 'Execute Close Strategy', desc: 'Propose direct contract check-out', style: 'bg-emerald-950/15 text-emerald-400 border-emerald-500/20' },
      transfer_to_human: { label: 'Assign Human Takeover', desc: 'High urgency human response required', style: 'bg-rose-950/15 text-rose-400 border-rose-500/20 animate-pulse' }
    };
    const act = actions[actionVal] || actions.ask_discovery;
    return (
      <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed space-y-1 ${act.style}`}>
        <div className="font-bold flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
          <Activity className="h-3.5 w-3.5" /> Next Best Action: {act.label}
        </div>
        <p className="text-[10px] text-gray-400">{act.desc}</p>
      </div>
    );
  };

  const getPersonalityTip = (styleVal) => {
    const styles = {
      analytical: 'Detail oriented. Leverage technical specifications, documentation & ROI case studies.',
      driver: 'Results focused. Keep replies brief, direct, and speed up closing proposals.',
      friendly: 'Relationship focused. Use warm greetings, emojis, and friendly dialogue.',
      supportive: 'Consultative focus. Walk through steps, answer questions with high patience.',
      detail_oriented: 'Provide precise answers, structural policy details, and feature specifications.'
    };
    return styles[styleVal?.toLowerCase()] || 'Consultative partner. Focus on business value and BANT validation.';
  };

  const filteredConversations = conversations.filter((c) =>
    c.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.customerPhone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.messages?.some(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeSentiment = selectedConv?.sentimentTimeline?.length > 0
    ? selectedConv.sentimentTimeline[selectedConv.sentimentTimeline.length - 1].sentiment
    : 'neutral';

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-10rem)] max-h-[800px] text-left animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-display">Conversations Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">
            Audit customer sentiment, alphabet script mirroring, and active AI Sales Brain intelligence.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedConv && (
            <button
              onClick={() => setShowSalesPanel(!showSalesPanel)}
              className={`px-3 py-1.5 border rounded-xl text-xs font-semibold transition cursor-pointer ${
                showSalesPanel ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400' : 'bg-gray-900 border-gray-800 text-gray-450 hover:text-white'
              }`}
            >
              Sales Intelligence Board
            </button>
          )}
          <button
            onClick={() => fetchConversations()}
            className="p-2 border border-gray-800 hover:border-gray-700 bg-gray-900/50 hover:text-white text-gray-400 rounded-xl transition cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 glass-panel rounded-2xl flex items-center justify-center animate-pulse">
          <div className="text-gray-500 flex items-center gap-2">
            <History className="h-5 w-5 animate-spin" /> Loading historical conversations...
          </div>
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex-1 glass-panel p-16 rounded-2xl text-center border-gray-900 bg-slate-950/20 flex flex-col justify-center items-center">
          <MessageSquare className="h-12 w-12 text-gray-655 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Active Logs</h3>
          <p className="text-sm text-gray-550 max-w-sm">
            No customer chats have been logged yet. Connect integration bot keys or write inside the Playground.
          </p>
        </div>
      ) : (
        <div className="flex-1 glass-panel rounded-2xl border-gray-900 overflow-hidden flex divide-x divide-gray-900 bg-slate-950/20">
          
          {/* Left panel: Conversation List */}
          <div className="w-full md:w-80 flex flex-col min-w-0 bg-slate-950/40 shrink-0">
            <div className="p-4 border-b border-gray-900 shrink-0">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-150 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs transition"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-900/40">
              {filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-505">No chats match search query.</div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = selectedConv?.id === conv.id;
                  const lastMsg = conv.messages?.[conv.messages.length - 1];
                  const isHumanAssigned = conv.assignedTo === 'human';
                  
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConv(conv)}
                      className={`w-full p-4 flex flex-col text-left hover:bg-slate-900/30 transition relative cursor-pointer ${
                        isSelected ? 'bg-slate-900/55' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-white truncate max-w-[55%]">{conv.customerName || 'Visitor'}</span>
                        <span className="text-[9px] text-gray-500 shrink-0">
                          {lastMsg ? formatTime(lastMsg.timestamp) : ''}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 mt-1">
                        {getChannelBadge(conv.channel || 'sandbox')}
                        <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold tracking-wider ${
                          isHumanAssigned ? 'bg-amber-500/10 text-amber-400 border border-amber-500/15' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/15'
                        }`}>
                          {isHumanAssigned ? 'Human' : 'AI'}
                        </span>
                      </div>

                      <p className="text-[10px] text-gray-400 truncate mt-2.5 leading-relaxed font-sans">
                        {lastMsg ? lastMsg.text : 'Empty conversation'}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right panel: Active Chat Log with sub-split */}
          <div className="hidden md:flex flex-1 divide-x divide-gray-900 bg-transparent relative">
            {selectedConv ? (
              <>
                {/* Left Area: Chat feed */}
                <div className="flex-1 flex flex-col min-w-0 bg-transparent relative">
                  
                  {/* Chat Top Banner Info */}
                  <div className="p-4 border-b border-gray-900 bg-slate-950/40 flex items-center justify-between shrink-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-white">{selectedConv.customerName || 'Visitor'}</h3>
                        {getChannelBadge(selectedConv.channel || 'sandbox')}
                      </div>
                      {selectedConv.customerPhone && (
                        <p className="text-[10px] text-indigo-400 font-medium mt-0.5">Phone: {selectedConv.customerPhone}</p>
                      )}
                    </div>
                    
                    {/* Takeover Actions */}
                    <div className="flex items-center gap-2">
                      {selectedConv.assignedTo === 'human' ? (
                        <button
                          onClick={handleHandback}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold text-white transition flex items-center gap-1 cursor-pointer shadow shadow-indigo-600/10"
                        >
                          <Bot className="h-3.5 w-3.5" /> Hand back to AI
                        </button>
                      ) : (
                        <button
                          onClick={handleTakeover}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-[10px] font-bold text-white transition flex items-center gap-1 cursor-pointer shadow shadow-amber-600/10"
                        >
                          <Hand className="h-3.5 w-3.5" /> Takeover Chat
                        </button>
                      )}
                      <div className="px-2.5 py-1.5 rounded bg-slate-900 border border-gray-800 text-[9px] font-bold text-gray-500">
                        ID: {selectedConv.id}
                      </div>
                    </div>
                  </div>

                  {/* Dialog Feeds */}
                  <div className="flex-1 p-6 overflow-y-auto space-y-4 min-h-0 bg-slate-950/5">
                    {selectedConv.messages?.map((msg, idx) => {
                      const isSystemAI = msg.sender === 'ai';
                      const isCustomer = msg.sender === 'customer';
                      
                      return (
                        <div
                          key={idx}
                          className={`flex gap-3 max-w-[80%] ${isCustomer ? 'ml-auto flex-row-reverse text-right' : 'self-start text-left'}`}
                        >
                          <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center ${
                            isCustomer ? 'bg-slate-800 text-gray-200' : (isSystemAI ? 'bg-indigo-600 text-white' : 'bg-amber-600 text-white')
                          }`}>
                            {isCustomer ? <User className="h-4 w-4" /> : (isSystemAI ? <Bot className="h-4 w-4" /> : <Hand className="h-4 w-4" />)}
                          </div>
                          <div>
                            <div className={`p-3.5 rounded-2xl text-xs ${
                              isCustomer ? 'bg-indigo-600 text-white rounded-tr-none font-sans' : (isSystemAI ? 'bg-slate-900 border border-gray-850 text-gray-300 rounded-tl-none font-sans' : 'bg-slate-900 border border-amber-500/20 text-amber-300 rounded-tl-none font-sans')
                            }`}>
                              <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                            </div>
                            <span className="text-[9px] text-gray-500 mt-1 block">
                              {formatTime(msg.timestamp)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Operator Text Input */}
                  <div className="p-4 border-t border-gray-900 bg-slate-950/60 shrink-0">
                    {selectedConv.assignedTo === 'human' ? (
                      <form onSubmit={handleSendManualMessage} className="flex gap-3">
                        <input
                          type="text"
                          value={replyInput}
                          onChange={(e) => setReplyInput(e.target.value)}
                          placeholder="Type operator response (sends directly to customer)..."
                          className="flex-1 px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-150 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
                        />
                        <button
                          type="submit"
                          disabled={!replyInput.trim() || submittingReply}
                          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold transition disabled:opacity-50 flex items-center justify-center gap-1.5 text-xs cursor-pointer shadow shadow-amber-600/10"
                        >
                          <Send className="h-3.5 w-3.5" /> Send
                        </button>
                      </form>
                    ) : (
                      <div className="p-3 bg-indigo-950/10 border border-indigo-500/10 rounded-xl flex items-center gap-2.5 text-xs text-indigo-400">
                        <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
                        <span>AI automated responder mode is active. Click **Takeover Chat** to send manual replies.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Area: Sales Intelligence & Behavioral Sidebar */}
                {showSalesPanel && (
                  <div className="w-80 bg-slate-950/45 overflow-y-auto p-5 space-y-5 hidden xl:block shrink-0 scroll-smooth border-l border-gray-900">
                    
                    {/* Top Action alert banner */}
                    {selectedConv.nextBestAction && getNextBestActionAlert(selectedConv.nextBestAction)}

                    <h3 className="font-extrabold text-[10px] text-gray-400 uppercase tracking-widest border-b border-gray-900 pb-3 flex items-center gap-1.5">
                      <Sparkles className="h-4.5 w-4.5 text-indigo-400" /> Behavioral Profiling
                    </h3>

                    {/* Dynamic Sales Readiness Dial */}
                    <div className="glass-panel p-4 rounded-2xl border-gray-900/50 bg-slate-900/30 text-center space-y-1">
                      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Sales Readiness Index</span>
                      <div className="flex items-baseline justify-center gap-0.5">
                        <span className="text-3xl font-extrabold text-indigo-400">{selectedConv.salesReadiness || 15}</span>
                        <span className="text-xs text-indigo-500 font-bold">%</span>
                      </div>
                      <div className="w-full bg-gray-900 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-indigo-500 to-pink-500 h-full rounded-full transition-all duration-700" 
                          style={{ width: `${selectedConv.salesReadiness || 15}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Behavioral Stats indicators */}
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="p-2.5 rounded-xl border border-gray-900 bg-gray-900/40">
                        <span className="text-[8px] text-gray-550 uppercase font-semibold block mb-1">Sentiment</span>
                        {getSentimentPill(activeSentiment)}
                      </div>
                      <div className="p-2.5 rounded-xl border border-gray-900 bg-gray-900/40">
                        <span className="text-[8px] text-gray-550 uppercase font-semibold block">Preferred Script</span>
                        <span className="font-bold block mt-1 uppercase text-indigo-400">{selectedConv.alphabetPreferred || 'latin'}</span>
                      </div>
                    </div>

                    {/* Personality & Trust Gauge */}
                    <div className="space-y-3">
                      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block flex items-center gap-1">
                        <Brain className="h-3.5 w-3.5 text-indigo-400" /> Personality Profile
                      </span>
                      {selectedConv.personalityStyle && (
                        <div className="p-3 bg-gray-900/30 border border-gray-900 rounded-xl space-y-1.5">
                          <span className="text-[10px] font-bold text-white capitalize block flex items-center gap-1">
                            <Heart className="h-3 w-3 text-pink-400" /> Style: {selectedConv.personalityStyle}
                          </span>
                          <p className="text-[9px] text-gray-400 leading-relaxed">{getPersonalityTip(selectedConv.personalityStyle)}</p>
                        </div>
                      )}

                      <div className="pt-1.5">
                        <div className="flex justify-between items-center text-[9px] mb-1">
                          <span className="text-gray-500 font-bold uppercase">Estimated Trust Level</span>
                          <span className="font-bold uppercase text-indigo-400">{selectedConv.trustLevel || 'medium'}</span>
                        </div>
                        <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              selectedConv.trustLevel === 'high' ? 'bg-emerald-500' : (selectedConv.trustLevel === 'low' ? 'bg-rose-500' : 'bg-indigo-500')
                            }`} 
                            style={{ width: selectedConv.trustLevel === 'high' ? '90%' : (selectedConv.trustLevel === 'low' ? '25%' : '60%') }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* SPIN Stepper */}
                    <div className="space-y-3 pt-2">
                      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block flex items-center gap-1">
                        <Target className="h-3.5 w-3.5 text-indigo-400" /> SPIN Sales Funnel Stage
                      </span>
                      <div className="relative pl-3.5 border-l border-gray-900 space-y-3.5 ml-1">
                        {[
                          { id: 'situation', label: 'Situation', desc: 'Discover environment context' },
                          { id: 'problem', label: 'Problem', desc: 'Identify core pain points' },
                          { id: 'implication', label: 'Implication', desc: 'Assess revenue/cost impact' },
                          { id: 'need_payoff', label: 'Need-Payoff', desc: 'ROI automation alignment' },
                          { id: 'presentation', label: 'Presentation', desc: 'Pitch packages & upsells' },
                          { id: 'closing', label: 'Closing', desc: 'Deal sign-off & checkout' }
                        ].map((st, idx) => {
                          const stages = ['situation', 'problem', 'implication', 'need_payoff', 'presentation', 'closing'];
                          const currentIdx = stages.indexOf(selectedConv.salesStage || 'situation');
                          const isCurrent = (selectedConv.salesStage || 'situation') === st.id;
                          const isCompleted = idx < currentIdx;
                          
                          return (
                            <div key={st.id} className="relative group text-left">
                              <span className={`absolute -left-[19.5px] top-1 h-2.5 w-2.5 rounded-full border-2 transition ${
                                isCurrent ? 'bg-indigo-500 border-indigo-400 animate-pulse ring-4 ring-indigo-500/10' :
                                (isCompleted ? 'bg-emerald-500 border-emerald-400' : 'bg-gray-950 border-gray-800')
                              }`}></span>
                              <div>
                                <span className={`text-[10px] font-bold block ${
                                  isCurrent ? 'text-indigo-400' : (isCompleted ? 'text-gray-300' : 'text-gray-600')
                                }`}>
                                  {st.label}
                                </span>
                                <span className="text-[8px] text-gray-500 block leading-tight">{st.desc}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Objection timeline tracker */}
                    {selectedConv.objectionsLog && selectedConv.objectionsLog.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block flex items-center gap-1">
                          <Shield className="h-3.5 w-3.5 text-indigo-400" /> Objections Logged
                        </span>
                        <div className="space-y-2 text-[10px]">
                          {selectedConv.objectionsLog.map((obj, idx) => (
                            <div key={idx} className="bg-gray-905/40 border border-gray-900 p-2.5 rounded-xl space-y-1">
                              <div className="flex justify-between items-center text-[8px] font-bold uppercase">
                                <span className="text-amber-400">Category: {obj.category}</span>
                                <span className="text-gray-500">{formatTime(obj.timestamp)}</span>
                              </div>
                              <p className="text-gray-400 leading-relaxed font-sans">"{obj.text}"</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* BANT Qualification Checklist */}
                    <div className="space-y-3">
                      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block flex items-center gap-1">
                        <Zap className="h-3.5 w-3.5 text-indigo-400" /> BANT Qualification Check
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className={`p-2 rounded-xl border flex flex-col justify-between ${
                          selectedConv.qualification?.budget ? 'bg-emerald-950/15 border-emerald-500/20 text-emerald-400' : 'bg-gray-900/60 border-gray-900 text-gray-600'
                        }`}>
                          <span className="text-[8px] text-gray-500 uppercase font-semibold">Budget</span>
                          <span className="font-bold truncate mt-1">{selectedConv.qualification?.budget ? `$${selectedConv.qualification.budget}` : 'Unqualified'}</span>
                        </div>
                        <div className={`p-2 rounded-xl border flex flex-col justify-between ${
                          selectedConv.qualification?.decisionMaker ? 'bg-emerald-950/15 border-emerald-500/20 text-emerald-400' : 'bg-gray-900/60 border-gray-900 text-gray-600'
                        }`}>
                          <span className="text-[8px] text-gray-500 uppercase font-semibold">Authority</span>
                          <span className="font-bold truncate mt-1">{selectedConv.qualification?.decisionMaker || 'Unqualified'}</span>
                        </div>
                        <div className={`p-2 rounded-xl border flex flex-col justify-between ${
                          selectedConv.qualification?.painLevel ? 'bg-emerald-950/15 border-emerald-500/20 text-emerald-400' : 'bg-gray-900/60 border-gray-900 text-gray-600'
                        }`}>
                          <span className="text-[8px] text-gray-500 uppercase font-semibold">Need (Pain)</span>
                          <span className="font-bold truncate mt-1">{selectedConv.qualification?.painLevel ? `Pain: ${selectedConv.qualification.painLevel}` : 'Unqualified'}</span>
                        </div>
                        <div className={`p-2 rounded-xl border flex flex-col justify-between ${
                          selectedConv.qualification?.timeline ? 'bg-emerald-950/15 border-emerald-500/20 text-emerald-400' : 'bg-gray-900/60 border-gray-900 text-gray-600'
                        }`}>
                          <span className="text-[8px] text-gray-500 uppercase font-semibold">Timeline</span>
                          <span className="font-bold truncate mt-1">{selectedConv.qualification?.timeline || 'Unqualified'}</span>
                        </div>
                      </div>
                    </div>

                    {/* SPIN Answers Summary Cards */}
                    <div className="space-y-3 pt-2">
                      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">SPIN Summary Intel</span>
                      <div className="space-y-2 text-[10px]">
                        {selectedConv.spinAnswers?.situation && (
                          <div className="bg-gray-900/40 p-2.5 rounded-xl border border-gray-900 leading-relaxed text-gray-400 font-sans">
                            <span className="text-[8px] font-bold text-gray-500 uppercase block mb-0.5">Situation context</span>
                            {selectedConv.spinAnswers.situation}
                          </div>
                        )}
                        {selectedConv.spinAnswers?.problem && (
                          <div className="bg-gray-900/40 p-2.5 rounded-xl border border-gray-900 leading-relaxed text-gray-400 font-sans">
                            <span className="text-[8px] font-bold text-amber-500 uppercase block mb-0.5">Identified Problem</span>
                            {selectedConv.spinAnswers.problem}
                          </div>
                        )}
                        {selectedConv.spinAnswers?.implication && (
                          <div className="bg-gray-900/40 p-2.5 rounded-xl border border-gray-900 leading-relaxed text-gray-400 font-sans">
                            <span className="text-[8px] font-bold text-red-400 uppercase block mb-0.5">Business Implication</span>
                            {selectedConv.spinAnswers.implication}
                          </div>
                        )}
                        {selectedConv.spinAnswers?.needPayoff && (
                          <div className="bg-gray-900/40 p-2.5 rounded-xl border border-gray-900 leading-relaxed text-gray-400 font-sans">
                            <span className="text-[8px] font-bold text-emerald-400 uppercase block mb-0.5">Need-Payoff Value</span>
                            {selectedConv.spinAnswers.needPayoff}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Close Probability, Pain highlights, and buying signals */}
                    <div className="space-y-3 pt-3 border-t border-gray-900">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-gray-500 font-bold uppercase tracking-wider">Close Probability</span>
                        <span className="font-extrabold text-emerald-400">{selectedConv.closeProbability || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${selectedConv.closeProbability || 0}%` }}
                        ></div>
                      </div>

                      {/* Buying Signals */}
                      {selectedConv.buyingSignals && selectedConv.buyingSignals.length > 0 && (
                        <div className="pt-2">
                          <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Buying Signals Detected</span>
                          <div className="flex flex-wrap gap-1">
                            {selectedConv.buyingSignals.map(sig => (
                              <span key={sig} className="px-2 py-0.5 rounded-lg bg-emerald-950/20 text-emerald-400 border border-emerald-500/10 text-[8px] font-medium">{sig}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Pain Point Pills */}
                      {selectedConv.painPoints && selectedConv.painPoints.length > 0 && (
                        <div className="pt-2">
                          <span className="text-[8px] text-gray-550 font-bold uppercase tracking-wider block mb-1">Pains Highlighted</span>
                          <div className="flex flex-wrap gap-1">
                            {selectedConv.painPoints.map(p => (
                              <span key={p} className="px-2 py-0.5 rounded-lg bg-red-950/20 text-red-400 border border-red-500/10 text-[8px] font-medium">{p}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 text-xs">
                <AlertCircle className="h-8 w-8 text-gray-650 mb-2" />
                <span>Select a conversation from the sidebar list to audit.</span>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
