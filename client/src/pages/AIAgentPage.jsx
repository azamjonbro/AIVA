import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { Bot, Send, User, RotateCcw, AlertTriangle, Sparkles, Award } from 'lucide-react';

export default function AIAgentPage() {
  const { company, addToast, addNotification } = useApp();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString || Date.now());
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Load welcome message on mount
  useEffect(() => {
    const welcomeText = `Hello! I am ${company?.settings?.aiName || 'Aiva'}, your AI sales assistant for ${company?.name || 'our company'}. How can I help you today?`;
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: welcomeText,
        timestamp: new Date().toISOString()
      }
    ]);
  }, [company]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      sender: 'customer',
      text: inputText,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const res = await axios.post('/api/conversations/chat', {
        conversationId,
        text: userMessage.text,
        companyId: company?.id
      });

      const { reply, conversation, leadCreated } = res.data;

      setIsTyping(false);
      setConversationId(conversation.id);
      
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + '-ai',
          sender: 'ai',
          text: reply,
          timestamp: new Date().toISOString()
        }
      ]);

      if (leadCreated) {
        addToast('New Lead Captured Successfully!', 'success');
        addNotification('New Lead Captured', `A customer showed intent to purchase. A lead has been logged under Customer CRM.`, 'success');
      }
    } catch (error) {
      console.error('Chat error:', error);
      setIsTyping(false);
      addToast('Failed to get response from AI Sales Agent', 'error');
    }
  };

  const handleReset = () => {
    setConversationId(null);
    const welcomeText = `Hello! I am ${company?.settings?.aiName || 'Aiva'}, your AI sales assistant for ${company?.name || 'our company'}. How can I help you today?`;
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: welcomeText,
        timestamp: new Date().toISOString()
      }
    ]);
    addToast('Conversation sandbox reset.', 'info');
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-10rem)] max-h-[800px] text-left">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-display">AI Agent Chat Sandbox</h1>
          <p className="text-gray-400 text-sm mt-1">
            Test how AIVA interacts with customers. Ask about products and input contact info to verify lead generation.
          </p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-400 hover:text-white border border-gray-800 hover:border-gray-700 bg-gray-900/50 rounded-xl transition cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset Chat
        </button>
      </div>

      {/* Main Sandbox Box */}
      <div className="flex-1 glass-panel rounded-2xl overflow-hidden flex flex-col border-gray-900 bg-slate-950/40 relative">
        
        {/* Chat Widget Header */}
        <div className="p-4 border-b border-gray-900 bg-slate-950/60 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">{company?.settings?.aiName || 'Aiva'}</h3>
                <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[9px] font-semibold uppercase tracking-wider">
                  {company?.settings?.tone || 'friendly'}
                </span>
              </div>
              <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                Sales Agent Online
              </p>
            </div>
          </div>
          <div className="flex gap-2 text-[10px] text-gray-500">
            <span>Hours: {company?.settings?.workingHours || '24/7'}</span>
          </div>
        </div>

        {/* Info Banner */}
        <div className="px-4 py-2 border-b border-gray-900/50 bg-indigo-950/10 flex items-center gap-2 text-xs text-indigo-300 shrink-0">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          <span><strong>Interactive Walkthrough:</strong> Ask "Do you have M3 MacBook Air?" and then say "My name is John, call me back on +998901234567" to verify lead creation!</span>
        </div>

        {/* Message Thread Board */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 min-h-0 bg-slate-950/10">
          {messages.map((msg) => {
            const isAI = msg.sender === 'ai';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${isAI ? 'self-start text-left' : 'ml-auto flex-row-reverse text-right'}`}
              >
                <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center ${
                  isAI ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-gray-200'
                }`}>
                  {isAI ? <Bot className="h-4.5 w-4.5" /> : <User className="h-4.5 w-4.5" />}
                </div>
                <div>
                  <div className={`p-3.5 rounded-2xl text-sm ${
                    isAI ? 'bg-slate-900 border border-gray-800 text-gray-200 rounded-tl-none' : 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/10'
                  }`}>
                    <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 block">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-3 max-w-[85%] self-start text-left">
              <div className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center bg-indigo-600 text-white">
                <Bot className="h-4.5 w-4.5" />
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-gray-800 text-gray-400 rounded-tl-none flex items-center gap-1 min-w-[70px] justify-center">
                <span className="h-1.5 w-1.5 rounded-full bg-gray-500 typing-dot"></span>
                <span className="h-1.5 w-1.5 rounded-full bg-gray-500 typing-dot"></span>
                <span className="h-1.5 w-1.5 rounded-full bg-gray-500 typing-dot"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input form */}
        <form onSubmit={handleSend} className="p-4 border-t border-gray-900 bg-slate-950/60 backdrop-blur-md flex gap-3 shrink-0">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a customer query (e.g., 'MacBook bormi?')"
            className="flex-1 px-4 py-3 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/15 cursor-pointer"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </form>

      </div>
    </div>
  );
}
