import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { Bot, Send, RefreshCw, CheckCircle2, AlertTriangle, Sparkles, SendHorizontal } from 'lucide-react';

const Instagram = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

export default function IntegrationsPage() {
  const { addToast } = useApp();
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Configuration States
  const [tgToken, setTgToken] = useState('');
  const [igUsername, setIgUsername] = useState('');
  const [igToken, setIgToken] = useState('');
  
  // Simulator States
  const [simChannel, setSimChannel] = useState('telegram');
  const [simMessages, setSimMessages] = useState([]);
  const [simInput, setSimInput] = useState('');
  const [simUser, setSimUser] = useState({ id: 'sim-user-123', name: 'Alisher Rahimov' });
  const [isTyping, setIsTyping] = useState(false);
  const simEndRef = useRef(null);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/integrations');
      setIntegrations(res.data);
      
      const tg = res.data.find(i => i.type === 'telegram');
      const ig = res.data.find(i => i.type === 'instagram');
      
      if (tg && tg.status === 'connected') setTgToken(tg.config?.token || '');
      if (ig && ig.status === 'connected') {
        setIgUsername(ig.config?.username || '');
        setIgToken(ig.config?.accessToken || '');
      }
    } catch (err) {
      console.error('Fetch integrations error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  useEffect(() => {
    simEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [simMessages, isTyping]);

  const handleConnectTelegram = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/integrations/telegram', { token: tgToken, status: 'connected' });
      addToast('Telegram Bot connected successfully!', 'success');
      fetchIntegrations();
    } catch (err) {
      addToast('Failed to connect Telegram Bot.', 'error');
    }
  };

  const handleDisconnectTelegram = async () => {
    try {
      await axios.post('/api/integrations/telegram', { status: 'disconnected' });
      addToast('Telegram Bot disconnected.', 'info');
      setTgToken('');
      fetchIntegrations();
    } catch (err) {
      addToast('Failed to disconnect Telegram Bot.', 'error');
    }
  };

  const handleConnectInstagram = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/integrations/instagram', { username: igUsername, accessToken: igToken, status: 'connected' });
      addToast('Instagram Business connected successfully!', 'success');
      fetchIntegrations();
    } catch (err) {
      addToast('Failed to connect Instagram.', 'error');
    }
  };

  const handleDisconnectInstagram = async () => {
    try {
      await axios.post('/api/integrations/instagram', { status: 'disconnected' });
      addToast('Instagram disconnected.', 'info');
      setIgUsername('');
      setIgToken('');
      fetchIntegrations();
    } catch (err) {
      addToast('Failed to disconnect Instagram.', 'error');
    }
  };

  const handleSendSimulated = async (e) => {
    e.preventDefault();
    if (!simInput.trim()) return;

    const userMessage = {
      sender: 'customer',
      text: simInput,
      timestamp: new Date().toISOString()
    };

    setSimMessages(prev => [...prev, userMessage]);
    setSimInput('');
    setIsTyping(true);

    try {
      const res = await axios.post('/api/integrations/simulate', {
        channel: simChannel,
        senderId: simUser.id,
        senderName: simUser.name,
        text: userMessage.text
      });

      setIsTyping(false);
      setSimMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: res.data.reply,
          timestamp: new Date().toISOString()
        }
      ]);

      if (res.data.leadCreated) {
        addToast('Simulator: New Lead Captured!', 'success');
      }
      if (res.data.transferToHuman) {
        addToast('Simulator: Human Takeover Triggered!', 'warning');
      }
    } catch (err) {
      console.error('Simulator error:', err);
      setIsTyping(false);
      addToast('Simulator failed to get reply.', 'error');
    }
  };

  const tgIntegration = integrations.find(i => i.type === 'telegram');
  const igIntegration = integrations.find(i => i.type === 'instagram');
  const isTgConnected = tgIntegration?.status === 'connected';
  const isIgConnected = igIntegration?.status === 'connected';

  return (
    <div className="space-y-8 text-left max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight font-display">Sales Channels Integrations</h1>
        <p className="text-gray-400 text-sm mt-1">
          Connect your store's social channels so AIVA can greet customers, answer questions, and log deals.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Side: Connection cards */}
        <div className="space-y-6">
          
          {/* Telegram bot */}
          <div className="glass-panel p-6 rounded-2xl border-gray-900 space-y-4 bg-slate-950/20">
            <div className="flex items-center justify-between border-b border-gray-900 pb-3">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                  <Bot className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-white">Telegram Bot Employee</h3>
                  <p className="text-[10px] text-gray-500">Run AIVA inside your custom Telegram bot</p>
                </div>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold ${
                isTgConnected ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-gray-900 border-gray-800 text-gray-500'
              }`}>
                {isTgConnected ? 'Connected' : 'Offline'}
              </span>
            </div>

            {isTgConnected ? (
              <div className="space-y-3 pt-2">
                <div className="p-3 bg-gray-900/60 border border-gray-900 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Bot Username:</span>
                    <span className="font-semibold text-white">@AivaEmployeeBot</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Connected Date:</span>
                    <span className="font-semibold text-gray-400">{new Date(tgIntegration.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <button
                  onClick={handleDisconnectTelegram}
                  className="w-full py-2.5 rounded-xl border border-red-500/20 hover:bg-red-500/5 text-xs font-semibold text-red-400 transition cursor-pointer"
                >
                  Disconnect Telegram Bot
                </button>
              </div>
            ) : (
              <form onSubmit={handleConnectTelegram} className="space-y-3 pt-2">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-1">Telegram Bot Token *</label>
                  <input
                    type="password"
                    required
                    value={tgToken}
                    onChange={(e) => setTgToken(e.target.value)}
                    placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                    className="block w-full px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-100 text-xs focus:outline-none"
                  />
                  <p className="text-[9px] text-gray-500 mt-1 leading-relaxed">
                    Create a bot with <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">@BotFather</a> and paste the API token above.
                  </p>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition cursor-pointer"
                >
                  Activate Telegram Bot
                </button>
              </form>
            )}
          </div>

          {/* Instagram Account */}
          <div className="glass-panel p-6 rounded-2xl border-gray-900 space-y-4 bg-slate-950/20">
            <div className="flex items-center justify-between border-b border-gray-900 pb-3">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-pink-500/10 rounded-xl text-pink-400">
                  <Instagram className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-white">Instagram Direct Messages</h3>
                  <p className="text-[10px] text-gray-500">Auto-respond to client DMs and queries</p>
                </div>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold ${
                isIgConnected ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-gray-900 border-gray-800 text-gray-500'
              }`}>
                {isIgConnected ? 'Connected' : 'Offline'}
              </span>
            </div>

            {isIgConnected ? (
              <div className="space-y-3 pt-2">
                <div className="p-3 bg-gray-900/60 border border-gray-900 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Connected Account:</span>
                    <span className="font-semibold text-white">@{igUsername}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Connected Date:</span>
                    <span className="font-semibold text-gray-400">{new Date(igIntegration.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <button
                  onClick={handleDisconnectInstagram}
                  className="w-full py-2.5 rounded-xl border border-red-500/20 hover:bg-red-500/5 text-xs font-semibold text-red-400 transition cursor-pointer"
                >
                  Disconnect Instagram Page
                </button>
              </div>
            ) : (
              <form onSubmit={handleConnectInstagram} className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 mb-1">Instagram Username *</label>
                    <input
                      type="text"
                      required
                      value={igUsername}
                      onChange={(e) => setIgUsername(e.target.value)}
                      placeholder="myshop_official"
                      className="block w-full px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-100 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 mb-1">Page Access Token *</label>
                    <input
                      type="password"
                      required
                      value={igToken}
                      onChange={(e) => setIgToken(e.target.value)}
                      placeholder="EAACEd0..."
                      className="block w-full px-3 py-2 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-100 text-xs focus:outline-none"
                    />
                  </div>
                </div>
                
                <details className="text-[10px] text-gray-400 bg-gray-950/40 p-3 rounded-xl border border-gray-900 group cursor-pointer transition">
                  <summary className="font-semibold text-indigo-400 hover:text-indigo-300 list-none flex items-center justify-between">
                    <span>Instagram Page Access Tokenni qanday olish mumkin?</span>
                    <span className="text-[8px] uppercase tracking-wider text-gray-500 group-open:hidden">Ko'rsatish</span>
                    <span className="text-[8px] uppercase tracking-wider text-gray-500 hidden group-open:inline">Yashirish</span>
                  </summary>
                  <div className="mt-2.5 space-y-2 border-t border-gray-900/60 pt-2 text-[9.5px] leading-relaxed text-gray-400 select-text">
                    <p><strong>1-Bosqich:</strong> Instagram sahifangizni <em>Business / Creator</em> hisobga o'tkazing va uni Facebook Sahifangizga bog'lang (Linked Accounts bo'limi orqali).</p>
                    <p><strong>2-Bosqich:</strong> <a href="https://developers.facebook.com/" target="_blank" rel="noreferrer" className="text-indigo-400 underline">Meta for Developers</a> saytida yangi <strong>Business</strong> turidagi Ilova (App) yarating.</p>
                    <p><strong>3-Bosqich:</strong> Ilova dashboardida <strong>Messenger</strong> mahsulotini faollashtiring (Set Up) va <strong>Instagram Settings</strong> bo'limiga o'ting.</p>
                    <p><strong>4-Bosqich:</strong> Facebook sahifangizni qo'shib, Instagram ulanishiga ruxsat bering, so'ng <strong>Generate Token</strong> tugmasini bosing va uzun Page Access Tokenni nusxalab shu maydonga joylang.</p>
                    <p className="text-[9px] text-amber-500"><strong>Muhim Ruxsatlar:</strong> instagram_basic, instagram_manage_messages, pages_manage_metadata, pages_show_list, pages_read_engagement.</p>
                  </div>
                </details>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition cursor-pointer"
                >
                  Activate Instagram DM Handler
                </button>
              </form>
            )}
          </div>

        </div>

        {/* Right Side: Channel Simulator console (Aesthetic) */}
        <div className="glass-panel rounded-2xl overflow-hidden flex flex-col border-gray-900 bg-slate-950/40 min-h-[500px]">
          
          {/* Simulator header */}
          <div className="p-4 border-b border-gray-900 bg-slate-950/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping"></span>
              <h3 className="font-bold text-sm text-white flex items-center gap-1">
                <Sparkles className="h-4.5 w-4.5 text-indigo-400" /> Channel Simulator Console
              </h3>
            </div>
            
            <div className="flex bg-gray-900/60 p-0.5 rounded-lg border border-gray-800">
              <button
                onClick={() => setSimChannel('telegram')}
                className={`px-3 py-1 rounded text-[10px] font-semibold transition cursor-pointer ${
                  simChannel === 'telegram' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                Telegram Bot
              </button>
              <button
                onClick={() => setSimChannel('instagram')}
                className={`px-3 py-1 rounded text-[10px] font-semibold transition cursor-pointer ${
                  simChannel === 'instagram' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                Instagram DM
              </button>
            </div>
          </div>

          {/* Simulator Sandbox info banner */}
          <div className="px-4 py-2 border-b border-gray-900/40 bg-indigo-950/10 text-[10px] text-indigo-300 leading-relaxed">
            Verify automated conversation logs! Try typing: <span className="font-bold text-white">"iPhone bormi? Narxi qancha?"</span>.
          </div>

          {/* Messages body */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[350px]">
            {simMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 space-y-2 py-16">
                <SendHorizontal className="h-8 w-8 text-gray-600 animate-bounce" />
                <p className="text-xs">No active messages in simulated pipeline.</p>
                <p className="text-[10px] max-w-xs text-gray-650">Choose a channel above and type a message below to test responses.</p>
              </div>
            ) : (
              simMessages.map((msg, i) => {
                const isAI = msg.sender === 'ai';
                return (
                  <div key={i} className={`flex gap-2.5 max-w-[85%] ${isAI ? 'self-start text-left' : 'ml-auto flex-row-reverse text-right'}`}>
                    <div className={`h-7 w-7 rounded-full shrink-0 flex items-center justify-center text-xs ${
                      isAI ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-gray-200'
                    }`}>
                      {isAI ? (simChannel === 'telegram' ? <Bot className="h-4 w-4" /> : <Instagram className="h-4 w-4" />) : 'C'}
                    </div>
                    <div>
                      <div className={`p-3 rounded-2xl text-xs ${
                        isAI ? 'bg-slate-900 border border-gray-850 text-gray-300 rounded-tl-none' : 'bg-indigo-600 text-white rounded-tr-none'
                      }`}>
                        <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>
                      </div>
                      <span className="text-[9px] text-gray-600 mt-1 block">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}

            {isTyping && (
              <div className="flex gap-2.5 max-w-[85%] self-start text-left">
                <div className="h-7 w-7 rounded-full shrink-0 flex items-center justify-center bg-indigo-600 text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="p-3 rounded-2xl bg-slate-900 border border-gray-850 text-gray-400 rounded-tl-none flex items-center gap-1 justify-center min-w-[60px]">
                  <span className="h-1 w-1 rounded-full bg-gray-500 typing-dot"></span>
                  <span className="h-1 w-1 rounded-full bg-gray-500 typing-dot"></span>
                  <span className="h-1 w-1 rounded-full bg-gray-500 typing-dot"></span>
                </div>
              </div>
            )}
            <div ref={simEndRef} />
          </div>

          {/* Simulator Form */}
          <form onSubmit={handleSendSimulated} className="p-4 border-t border-gray-900 bg-slate-950/60 flex gap-3">
            <input
              type="text"
              value={simInput}
              onChange={(e) => setSimInput(e.target.value)}
              placeholder={`Send simulated message to ${simChannel === 'telegram' ? 'Telegram Bot' : 'Instagram DM'}...`}
              className="flex-1 px-3 py-2.5 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-150 placeholder-gray-500 focus:outline-none text-xs"
            />
            <button
              type="submit"
              disabled={!simInput.trim() || isTyping}
              className="px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50 flex items-center justify-center cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
