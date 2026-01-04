'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, BarChart3, Receipt, Package, TrendingUp } from 'lucide-react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function CFOAgentPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/agent/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: input, history: messages }),
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            setMessages((prev) => [...prev, { role: 'assistant', content: data.content }]);
        } catch (error) {
            console.error('Error:', error);
            setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#050B18] text-gray-100 font-sans">
            {/* Header */}
            <header className="border-b border-gray-800 p-4 bg-[#0A1128]/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600/20 p-2 rounded-lg border border-blue-500/30">
                        <Bot className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                            Mahanka CFO Agent
                        </h1>
                        <p className="text-xs text-gray-400">Agentic AI for D2C Finance</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <TrendingUp className="w-5 h-5 text-gray-400 hover:text-blue-400 cursor-help transition-colors" />
                    <Receipt className="w-5 h-5 text-gray-400 hover:text-blue-400 cursor-help transition-colors" />
                    <Package className="w-5 h-5 text-gray-400 hover:text-blue-400 cursor-help transition-colors" />
                </div>
            </header>

            {/* Chat Container */}
            <main className="flex-1 overflow-y-auto p-4 space-y-6 max-w-4xl mx-auto w-full custom-scrollbar">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-in fade-in zoom-in duration-500">
                        <div className="p-6 bg-blue-600/5 rounded-full border border-blue-500/10">
                            <Bot className="w-16 h-16 text-blue-500/40" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-semibold text-gray-300">How can I assist you today?</h2>
                            <p className="text-gray-500 max-w-md">I can help with unit economics analysis, tariff forecasting, and dead stock identification.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                            {['Run month-end unit economics', 'Predict dead stock risk', 'Forecast duty for HS 8517', 'Check GST mismatches'].map((suggestion) => (
                                <button
                                    key={suggestion}
                                    onClick={() => setInput(suggestion)}
                                    className="p-3 text-sm text-left bg-[#0A1128] border border-gray-800 rounded-xl hover:border-blue-500/50 hover:bg-blue-500/5 transition-all"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-indigo-600' : 'bg-blue-600/20 border border-blue-500/30'
                                }`}>
                                {m.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-blue-400" />}
                            </div>
                            <div className={`p-4 rounded-2xl ${m.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                : 'bg-[#0A1128] border border-gray-800 text-gray-200 rounded-tl-none shadow-xl'
                                }`}>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start animate-pulse">
                        <div className="flex gap-3 max-w-[85%]">
                            <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                            </div>
                            <div className="p-4 rounded-2xl bg-[#0A1128] border border-gray-800 text-gray-400 rounded-tl-none">
                                <span className="text-sm italic">CFO Agent is thinking...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>

            {/* Input Area */}
            <footer className="p-4 bg-gradient-to-t from-[#050B18] via-[#050B18] to-transparent">
                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative group">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your query (e.g., 'Analyze unit economics for last month')..."
                        className="w-full bg-[#0A1128] border border-gray-800 rounded-2xl py-4 pl-6 pr-14 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-gray-600 shadow-2xl"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="absolute right-2 top-2 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:opacity-50 disabled:bg-gray-800 transition-all shadow-lg"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
                <p className="text-[10px] text-center text-gray-600 mt-3 uppercase tracking-widest font-medium">
                    Mahanka Proprietary CFO Intelligence Platform
                </p>
            </footer>

            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}</style>
        </div>
    );
}
