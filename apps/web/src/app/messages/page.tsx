'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Send, User, ChevronLeft, Sparkles, FolderPlus, ArrowLeft } from 'lucide-react';
import { messagingApi, authApi } from '../../lib/api';
import { motion } from 'framer-motion';

export default function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [me, setMe] = useState<any>(null);
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  useEffect(() => {
    initMessages();
  }, []);

  const initMessages = async () => {
    try {
      const profile = await authApi.me();
      setMe(profile);

      const convs = await messagingApi.getConversations();
      setConversations(convs || []);
      if (convs && convs.length > 0) {
        handleSelectConv(convs[0], profile.id);
      }
    } catch (err) {
      console.error('Failed to load chats:', err);
    } finally {
      setLoadingConv(false);
    }
  };

  const handleSelectConv = async (conv: any, myId: string) => {
    setActiveConv(conv);
    setLoadingMsgs(true);
    try {
      const list = await messagingApi.getMessages(conv.id);
      setMessages(list || []);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoadingMsgs(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeConv || !me) return;

    // Find recipient ID (it's the participant who is NOT me)
    const recipient = activeConv.participants.find((p: string) => p !== me.id);
    if (!recipient) return;

    try {
      const newMsg = await messagingApi.sendMessage({
        receiverId: recipient,
        body: text,
        fileUrls: []
      });

      setMessages(prev => [...prev, newMsg]);
      setText('');

      // Refresh conversations metadata list
      const convs = await messagingApi.getConversations();
      setConversations(convs || []);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <main className="relative min-h-screen w-full bg-bg grid-bg pb-12 flex flex-col">
      {/* Top Bar */}
      <header className="flex h-16 items-center justify-between border-b border-border/40 px-6 bg-black/30 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </a>
          <span className="text-base font-bold text-white tracking-wider flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-emerald-400" />
            LaunchHub Messaging
          </span>
        </div>
        <a href="/dashboard" className="text-xs font-bold text-slate-400 hover:text-white transition-colors">
          Return to Console
        </a>
      </header>

      {/* Main Split Interface */}
      <div className="flex-1 flex overflow-hidden max-w-7xl w-full mx-auto px-4 py-4 gap-4">
        {/* Left Side: Conversations */}
        <div className="w-80 rounded-2xl border border-border bg-surface-card flex flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b border-border/40 bg-black/10 text-xs font-bold text-slate-400 uppercase tracking-wider">
            Conversations
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border/30">
            {loadingConv ? (
              <div className="flex justify-center items-center py-12">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500/20 border-t-emerald-500" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-6 text-center">No active chat rooms.</p>
            ) : (
              conversations.map((c) => {
                const active = activeConv?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelectConv(c, me.id)}
                    className={`w-full text-left p-4 space-y-1 transition-colors block ${active ? 'bg-emerald-500/10 border-l-2 border-emerald-500' : 'hover:bg-slate-900/50'}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white text-xs">Chat Room: {c.id.substring(5, 12)}...</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(c.lastTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{c.lastMessage}</p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Message Thread */}
        <div className="flex-1 rounded-2xl border border-border bg-surface-card flex flex-col overflow-hidden">
          {activeConv ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-border/40 bg-black/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <User className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">Direct Channel</h4>
                    <p className="text-[10px] text-slate-500">Channel ID: {activeConv.id}</p>
                  </div>
                </div>
              </div>

              {/* Messages log */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMsgs ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500/20 border-t-emerald-500" />
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId === me.id;
                    return (
                      <div 
                        key={m.id} 
                        className={`flex flex-col max-w-[70%] space-y-1 ${isMe ? 'ml-auto items-end' : 'items-start'}`}
                      >
                        <span className="text-[9px] text-slate-500">
                          {isMe ? 'You' : `User (${m.senderId.substring(0, 5)}...)`} • {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className={`p-3 rounded-2xl text-xs leading-relaxed ${isMe ? 'bg-emerald-500 text-black font-semibold' : 'bg-slate-900 border border-border text-white'}`}>
                          {m.body}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Send Form */}
              <form onSubmit={handleSend} className="p-4 border-t border-border/40 bg-black/10 flex gap-2 shrink-0">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type message..."
                  className="flex-1 bg-black/40 border border-border/60 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-400 p-2.5 text-black shadow-glow flex items-center justify-center transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-2">
              <MessageSquare className="h-8 w-8 text-slate-700" />
              <h4 className="font-semibold text-slate-400 text-sm">Select Conversation</h4>
              <p className="text-xs text-slate-500 max-w-xs">Pick a chat session from the list on the left to see messaging records.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
