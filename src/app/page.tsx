import Link from "next/link";
import { Bot, BarChart3, TrendingUp, ShieldCheck, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#050B18] text-gray-100 font-sans selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600/20 p-2 rounded-lg border border-blue-500/30">
            <Bot className="w-6 h-6 text-blue-400" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Mahanka
          </span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-medium text-gray-400">
          <a href="#" className="hover:text-blue-400 transition-colors">Forecaster</a>
          <a href="#" className="hover:text-blue-400 transition-colors">Unit Economics</a>
          <a href="#" className="hover:text-blue-400 transition-colors">Reconciliation</a>
        </div>
        <Link
          href="/cfo-agent"
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-full text-sm font-bold transition-all shadow-lg shadow-blue-600/20"
        >
          Launch Agent
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 relative overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] -z-10 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] -z-10 animate-pulse delay-700"></div>

        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest">
            <Zap className="w-3 h-3" />
            AI-Powered CFO v1.0
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
            Your AI Financial Co-Pilot for <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500 bg-clip-text text-transparent">
              Indian D2C Growth
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Stop drowning in spreadsheets. Ask about margins, dead stock, tariffs, and cashflow.
            Mahanka CFO Agent automates your month-end close with institutional-grade precision.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/cfo-agent"
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-lg transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 group"
            >
              Start Free Chat
              <TrendingUp className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Link>
            <button className="w-full sm:w-auto px-8 py-4 bg-gray-900/50 hover:bg-gray-800 border border-gray-800 text-gray-300 rounded-2xl font-bold text-lg transition-all">
              Watch Demo
            </button>
          </div>

          {/* Trust Badges */}
          <div className="pt-16 flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              <span className="font-semibold uppercase tracking-widest text-xs">Bank-Grade Privacy</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              <span className="font-semibold uppercase tracking-widest text-xs">Real-Time Sync</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-8 border-t border-gray-900 bg-[#0A1128]/50 text-center">
        <p className="text-gray-500 text-sm tracking-wide">
          Powered by <span className="text-blue-400 font-bold tracking-widest uppercase text-xs">Mahanka Proprietary Intelligence</span>
        </p>
        <div className="mt-4 flex justify-center gap-6 text-xs text-gray-600">
          <a href="#" className="hover:text-gray-400">Terms</a>
          <a href="#" className="hover:text-gray-400">Privacy</a>
          <a href="#" className="hover:text-gray-400">Security</a>
        </div>
      </footer>
    </div>
  );
}

