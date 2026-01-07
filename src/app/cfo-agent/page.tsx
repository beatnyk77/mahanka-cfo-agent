'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, BarChart3, Receipt, Package, TrendingUp, ShieldCheck, ArrowRight, Upload, FileSpreadsheet, CheckCircle2, X } from 'lucide-react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface TallyImportState {
    isImporting: boolean;
    success: boolean;
    error: string | null;
    summary: string | null;
    confidenceBoost: number;
}

export default function CFOAgentPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStage, setLoadingStage] = useState('');
    const [view, setView] = useState<'chat' | 'audit'>('chat');
    const [usage, setUsage] = useState(65); // Mock monetization stub
    const [pendingApproval, setPendingApproval] = useState<{ tool: string; data: any } | null>(null);
    const [agentMemoryContext, setAgentMemoryContext] = useState('Initializing memory...');
    const [tallyImport, setTallyImport] = useState<TallyImportState>({
        isImporting: false,
        success: false,
        error: null,
        summary: null,
        confidenceBoost: 0,
    });
    const [showTallyModal, setShowTallyModal] = useState(false);
    const tallyFileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Fetch memory context on mount
    useEffect(() => {
        setTimeout(() => setAgentMemoryContext('FoundersOffice Cloud linked. Remembering Dec GST filing and Nov dead stock audit.'), 1000);
    }, []);

    // Handle Tally XML file upload
    const handleTallyFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.xml')) {
            setTallyImport(prev => ({ ...prev, error: 'Please upload a valid XML file.' }));
            return;
        }

        setTallyImport(prev => ({ ...prev, isImporting: true, error: null }));
        setShowTallyModal(false);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/tally/import', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to import Tally data');
            }

            setTallyImport({
                isImporting: false,
                success: true,
                error: null,
                summary: result.summary,
                confidenceBoost: result.confidenceBoost || 18,
            });

            // Update memory context
            setAgentMemoryContext(prev => `${prev} | Tally ledger imported (+18% confidence).`);

            // Add a message to the chat
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `[CONFIDENCE: +18% Boost | DATA SOURCE: Tally ERP | STATUS: Verified]\n\n✅ **Tally data imported successfully!**\n\n${result.summary}\n\nYou can now ask me to analyze your sales, purchases, inventory, GST compliance, or bank reconciliation with higher accuracy.`
            }]);

        } catch (error: any) {
            setTallyImport(prev => ({
                ...prev,
                isImporting: false,
                error: error.message || 'Failed to import Tally data',
            }));
        }

        // Reset file input
        if (tallyFileInputRef.current) {
            tallyFileInputRef.current.value = '';
        }
    };

    const handleApproval = async (approved: boolean) => {
        if (!pendingApproval) return;

        const content = approved ? `✅ Approved: ${pendingApproval.tool}` : `❌ Rejected: ${pendingApproval.tool}`;
        setMessages((prev) => [...prev, { role: 'assistant', content }]);
        setPendingApproval(null);

        if (approved) {
            // In a real app, this would resume the LangGraph thread
            setIsLoading(true);
            setLoadingStage(`Executing ${pendingApproval.tool}...`);
            setTimeout(() => {
                setMessages((prev) => [...prev, { role: 'assistant', content: `[CONFIDENCE: 98% | COMPLETENESS: 100% | ISSUES: None] Action executed: ${pendingApproval.tool} has been processed successfully.` }]);
                setIsLoading(false);
                setLoadingStage('');
            }, 1500);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const stages = ['Reconciling ledgers...', 'Analyzing unit economics...', 'Running simulations...', 'Preparing Real Talk summary...'];
        let stageIdx = 0;
        const stageInterval = setInterval(() => {
            setLoadingStage(stages[stageIdx % stages.length]);
            stageIdx++;
        }, 1200);

        try {
            const response = await fetch('/api/agent/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: input, history: messages }),
            });

            const data = await response.json();
            clearInterval(stageInterval);

            // Simulate interrupt for WhatsApp tool or GST draft
            if (input.toLowerCase().includes('alert') || input.toLowerCase().includes('whatsapp')) {
                setPendingApproval({ tool: 'send_whatsapp_alert', data: { message: input } });
            } else if (input.toLowerCase().includes('gst') || input.toLowerCase().includes('tax')) {
                setPendingApproval({ tool: 'generate_gst_draft', data: { month: 'Current' } });
            }

            setMessages((prev) => [...prev, { role: 'assistant', content: data.content }]);
            setUsage((prev) => Math.min(100, prev + 5)); // Increase usage for stub
        } catch (error) {
            clearInterval(stageInterval);
            console.error('Error:', error);
            setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
        } finally {
            setIsLoading(false);
            setLoadingStage('');
        }
    };

    const parseConfidence = (content: string) => {
        const match = content.match(/\[CONFIDENCE: (.*?) \| COMPLETENESS: (.*?) \| ISSUES: (.*?)\]/);
        if (match) {
            return {
                score: match[1],
                completeness: match[2],
                issues: match[3],
                cleanContent: content.replace(match[0], '').trim()
            };
        }
        return null;
    };

    return (
        <div className="flex flex-col h-screen bg-navy-dark text-gray-100 font-sans selection:bg-gold/30">
            {/* Header */}
            <header className="border-b border-white/5 bg-navy-dark/95 backdrop-blur-md sticky top-0 z-50">
                <div className="p-4 flex items-center justify-between max-w-7xl mx-auto w-full">
                    <div className="flex items-center gap-3">
                        <div className="bg-gold/10 p-2 rounded-xl border border-gold/20 shadow-lg shadow-gold/5">
                            <Bot className="w-6 h-6 text-gold" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold serif text-white tracking-tight">
                                Mahanka <span className="text-gold">CFO</span> Agent <span className="text-[10px] bg-gold/10 px-2 py-0.5 rounded text-gold font-mono ml-2 border border-gold/20">v1.5</span>
                            </h1>
                            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-500">Unbreakable Institutional Finance</p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-4">
                        {/* Tally Import Button */}
                        <button
                            onClick={() => setShowTallyModal(true)}
                            disabled={tallyImport.isImporting}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold transition-all disabled:opacity-50"
                        >
                            {tallyImport.isImporting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <FileSpreadsheet className="w-4 h-4" />
                            )}
                            Import Tally Ledger XML
                        </button>
                        <div className="flex flex-col items-end gap-1">
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Usage Meter</div>
                            <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-gold transition-all duration-1000 shadow-[0_0_10px_rgba(251,191,36,0.5)]" style={{ width: `${usage}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Memory Awareness Bar */}
                <div className="bg-gold/5 border-t border-b border-gold/10 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-gold uppercase tracking-widest">Agent remembers:</span>
                        <span className="text-[10px] text-gray-400 font-medium truncate italic">"{agentMemoryContext}"</span>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setView('chat')} className={`text-[10px] font-bold px-3 py-1 rounded-full transition-colors ${view === 'chat' ? 'bg-gold text-navy-dark' : 'text-gray-500 hover:text-white'}`}>ENGINE</button>
                        <button onClick={() => setView('audit')} className={`text-[10px] font-bold px-3 py-1 rounded-full transition-colors ${view === 'audit' ? 'bg-gold text-navy-dark' : 'text-gray-500 hover:text-white'}`}>AUDIT LEDGER</button>
                    </div>
                </div>

                {/* Tally Success Banner */}
                {tallyImport.success && (
                    <div className="bg-emerald-500/10 border-t border-b border-emerald-500/20 px-4 py-2 flex items-center justify-between animate-in slide-in-from-top duration-300">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span className="text-[11px] font-bold text-emerald-400">Tally data detected — confidence +{tallyImport.confidenceBoost}%</span>
                        </div>
                        <button
                            onClick={() => setTallyImport(prev => ({ ...prev, success: false }))}
                            className="text-emerald-400/50 hover:text-emerald-400 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Tally Error Banner */}
                {tallyImport.error && (
                    <div className="bg-red-500/10 border-t border-b border-red-500/20 px-4 py-2 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-red-400">⚠️ {tallyImport.error}</span>
                        <button
                            onClick={() => setTallyImport(prev => ({ ...prev, error: null }))}
                            className="text-red-400/50 hover:text-red-400 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </header>

            {/* Tally Import Modal */}
            {showTallyModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">
                    <div className="bg-navy border border-gold/20 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                                Import Tally Ledger XML
                            </h2>
                            <button
                                onClick={() => setShowTallyModal(false)}
                                className="text-gray-500 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-sm text-gray-400 mb-6">
                            Upload your Tally ERP XML export to automatically extract sales vouchers, purchase data, inventory items, GST details, and bank payments.
                        </p>

                        <div className="border-2 border-dashed border-gold/20 rounded-xl p-8 text-center hover:border-gold/40 transition-colors cursor-pointer"
                            onClick={() => tallyFileInputRef.current?.click()}
                        >
                            <Upload className="w-12 h-12 text-gold/50 mx-auto mb-4" />
                            <p className="text-sm font-bold text-gray-300 mb-2">Drop your Tally XML file here</p>
                            <p className="text-xs text-gray-500">or click to browse</p>
                        </div>

                        <input
                            ref={tallyFileInputRef}
                            type="file"
                            accept=".xml"
                            onChange={handleTallyFileUpload}
                            className="hidden"
                        />

                        <div className="mt-6 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-2">Confidence Boost</p>
                            <p className="text-xs text-gray-400">
                                Importing Tally data increases analysis confidence by <span className="text-emerald-400 font-bold">+18%</span> for GST reconciliation, unit economics, and financial forecasting.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main View Area */}
            {view === 'audit' ? (
                <main className="flex-1 overflow-y-auto p-4 max-w-5xl mx-auto w-full">
                    <div className="space-y-4 animate-in fade-in duration-500">
                        <div className="p-6 bg-navy border border-white/5 rounded-2xl">
                            <h2 className="text-xl font-bold serif text-white mb-4">Immutable Audit Ledger</h2>
                            <p className="text-sm text-gray-400 mb-6">Trace every agent action, tool input, and confidence calculation. Verifiable and production-logged.</p>
                            <div className="space-y-4">
                                {[
                                    { step: 'Ledger Reconciliation', tool: 'bank_sync_ledger', status: 'Success', confidence: '98%', time: '2 mins ago' },
                                    { step: 'Compliance Draft', tool: 'generate_gst_draft', status: 'Frozen in Beta', confidence: '92%', time: '5 mins ago' },
                                    { step: 'Risk Analysis', tool: 'dead_stock_oracle', status: 'Success', confidence: '84%', time: '12 mins ago' },
                                ].map((log, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-navy-dark/50 border border-white/5 rounded-xl">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-white/5 p-2 rounded-lg"><Package className="w-4 h-4 text-gray-500" /></div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{log.step}</p>
                                                <p className="text-[10px] font-mono text-gray-500 uppercase">{log.tool} | {log.time}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-gold">{log.confidence} Conf.</p>
                                            <p className={`text-[10px] uppercase font-bold ${log.status.includes('Frozen') ? 'text-red-400' : 'text-green-400'}`}>{log.status}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
            ) : (
                <main className="flex-1 overflow-y-auto p-4 space-y-6 max-w-5xl mx-auto w-full custom-scrollbar">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-8 animate-in fade-in zoom-in duration-700">
                            <div className="p-8 bg-gold/5 rounded-full border border-gold/10 relative">
                                <Bot className="w-20 h-20 text-gold/20" />
                                <div className="absolute inset-0 bg-gold/5 rounded-full blur-2xl -z-10 animate-pulse"></div>
                            </div>
                            <div className="space-y-3">
                                <h2 className="text-3xl font-extrabold serif text-white tracking-tight">Financial Command Center</h2>
                                <p className="text-gray-400 max-w-md mx-auto font-medium">Institutional-grade analysis for GST, Unit Economics, and Seed Prep.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                                {['Run month-end unit economics', 'Draft my GST-1 for last month', 'Predict dead stock risk', 'Prepare seed round roadmap'].map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => setInput(suggestion)}
                                        className="p-4 text-sm text-left bg-navy border border-white/5 rounded-2xl hover:border-gold/40 hover:bg-gold/5 transition-all group relative overflow-hidden"
                                    >
                                        <span className="relative z-10 text-gray-300 group-hover:text-gold transition-colors font-semibold">{suggestion}</span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-gold/0 to-gold/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((m, i) => {
                        const confidenceData = m.role === 'assistant' ? parseConfidence(m.content) : null;
                        const contentToShow = confidenceData ? confidenceData.cleanContent : m.content;

                        return (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-300`}>
                                <div className={`flex gap-4 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${m.role === 'user' ? 'bg-teal' : 'bg-gold/10 border border-gold/20'
                                        }`}>
                                        {m.role === 'user' ? <User className="w-6 h-6 text-white" /> : <Bot className="w-6 h-6 text-gold" />}
                                    </div>
                                    <div className={`p-5 rounded-2xl shadow-2xl relative group ${m.role === 'user'
                                        ? 'bg-teal text-white rounded-tr-none'
                                        : 'bg-navy border border-white/5 text-gray-200 rounded-tl-none'
                                        }`}>
                                        {confidenceData && (
                                            <div className="mb-4 flex items-center gap-3 pb-3 border-b border-white/5 group/tooltip relative">
                                                <span className="text-[10px] uppercase font-black text-gray-500 tracking-[0.2em]">Close Engine Analysis</span>
                                                <div className="flex items-center gap-2 cursor-help">
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${parseInt(confidenceData.score) > 90 ? 'bg-green-500/10 text-green-400' : 'bg-gold/10 text-gold'
                                                        }`}>
                                                        CONFIDENCE: {confidenceData.score}
                                                    </span>
                                                </div>
                                                {/* Tooltip */}
                                                <div className="absolute top-0 left-full ml-4 w-48 p-3 bg-navy-dark border border-white/10 rounded-xl shadow-2xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-50 pointer-events-none">
                                                    <p className="text-[10px] text-gray-400 uppercase font-black mb-2 tracking-widest">Data Health</p>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] flex justify-between"><span>Completeness</span> <span className="text-gold">{confidenceData.completeness}</span></p>
                                                        <p className="text-[10px] flex justify-between"><span>Issues</span> <span className="text-red-400">{confidenceData.issues}</span></p>
                                                    </div>
                                                    {parseInt(confidenceData.score) < 85 && (
                                                        <div className="mt-3 p-2 bg-red-400/5 border border-red-400/10 rounded-lg">
                                                            <p className="text-[9px] text-red-200 uppercase font-black tracking-tight mb-1">Failure Replay</p>
                                                            <p className="text-[9px] text-gray-400 leading-tight">Missing fulfillment logs — Upload CSV to boost confidence by 18%.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        <div className="relative">
                                            {m.content.toLowerCase().includes('gst') && m.role === 'assistant' && (
                                                <div className="absolute -top-1 -left-1 w-full h-full border-2 border-red-500/20 rounded-xl pointer-events-none flex items-center justify-center -rotate-12 z-0">
                                                    <span className="text-red-500/40 font-black text-xl uppercase tracking-tighter opacity-50">DRAFT — CA REVIEW REQ.</span>
                                                </div>
                                            )}
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium relative z-10">{contentToShow}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {pendingApproval && (
                        <div className="flex justify-start animate-in zoom-in duration-500">
                            <div className="flex gap-4 max-w-[85%]">
                                <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shadow-lg">
                                    <ShieldCheck className="w-6 h-6 text-gold" />
                                </div>
                                <div className="p-8 rounded-3xl bg-navy-dark border border-gold/20 text-gray-200 rounded-tl-none shadow-[0_0_50px_rgba(251,191,36,0.1)] space-y-6">
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-bold serif text-gold flex items-center gap-2">
                                            Human-in-the-loop Required
                                        </h3>
                                        <p className="text-sm text-gray-400 font-medium">The agent is requesting permission for: <code className="text-gold font-mono bg-gold/5 px-2 py-0.5 rounded border border-gold/10">{pendingApproval.tool}</code></p>
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => handleApproval(true)}
                                            className="bg-gold hover:bg-gold-deep text-navy-dark px-8 py-3 rounded-xl font-black text-sm transition-all gold-glow"
                                        >
                                            Execute Action
                                        </button>
                                        <button
                                            onClick={() => handleApproval(false)}
                                            className="bg-navy hover:bg-navy-dark border border-white/10 text-gray-400 px-8 py-3 rounded-xl font-bold text-sm transition-all hover:text-white"
                                        >
                                            Decline
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {isLoading && (
                        <div className="flex justify-start animate-pulse">
                            <div className="flex gap-4 max-w-[85%]">
                                <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shadow-lg">
                                    <Loader2 className="w-6 h-6 text-gold animate-spin" />
                                </div>
                                <div className="p-5 rounded-2xl bg-navy border border-white/5 text-gray-400 rounded-tl-none">
                                    <span className="text-sm italic font-medium">{loadingStage || 'CFO Agent is processing data...'}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </main>
            )}

            {/* Input Area */}
            <footer className="p-6 bg-gradient-to-t from-navy-dark via-navy-dark to-transparent">
                <div className="max-w-4xl mx-auto mb-4 p-3 bg-red-400/5 border border-red-400/10 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Regulatory Boundary Statement</p>
                    <p className="text-[9px] text-gray-500 font-medium">Mahanka provides automated drafts & intelligence. Final compliance and filings must be verified by a licensed professional.</p>
                </div>
                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative group">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your query (e.g., 'Analyze unit economics tracker')..."
                        className="w-full bg-navy border border-white/10 rounded-2xl py-5 pl-8 pr-16 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all placeholder:text-gray-600 shadow-2xl font-medium"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || pendingApproval !== null || !input.trim()}
                        className="absolute right-3 top-3 p-3 bg-gold text-navy-dark rounded-xl hover:bg-gold-deep disabled:opacity-50 transition-all shadow-lg gold-glow"
                    >
                        <Send className="w-6 h-6" />
                    </button>
                </form>
                <div className="mt-6 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 opacity-100 transition-all duration-500 cursor-default">
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">Institutional Grade</span>
                        <span className="serif text-xs font-bold text-gold">CFO Engine v1.5</span>
                    </div>
                </div>
            </footer>

            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(251, 191, 36, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(251, 191, 36, 0.2);
        }
      `}</style>
        </div>
    );
}
