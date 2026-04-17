import { Moon, Settings, Sun } from 'lucide-react';

function DashboardHeader({
  activeTab,
  brightness,
  decreaseBrightness,
  increaseBrightness,
  isSettingsOpen,
  setIsSettingsOpen,
}) {
  return (
    <header className="h-20 border-b border-white/5 flex items-center justify-between px-12 bg-[linear-gradient(180deg,rgba(15,19,32,0.92),rgba(10,12,20,0.65))] backdrop-blur-xl sticky top-0 z-20 shadow-xl">
      <div className="flex items-center gap-6">
        <span className="text-[10px] font-black text-gray-700 uppercase tracking-[0.4em]">PROJECT 2026</span>
        <span className="text-xl font-black italic uppercase tracking-widest border-l border-white/10 pl-6">
          {activeTab.toUpperCase()}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 shadow-[0_0_18px_rgba(59,130,246,0.08)]">
          <button
            onClick={decreaseBrightness}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            title="Giảm độ sáng"
            aria-label="Giảm độ sáng"
          >
            <Moon size={16} />
          </button>
          <span className="min-w-12 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
            {brightness}%
          </span>
          <button
            onClick={increaseBrightness}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            title="Tăng độ sáng"
            aria-label="Tăng độ sáng"
          >
            <Sun size={16} />
          </button>
        </div>
        <div className="flex items-center gap-2 bg-emerald-400/10 border border-emerald-300/20 px-4 py-2 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.14)]">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_12px_#34d399]"></div>
          <span className="text-[9px] font-black text-emerald-300 uppercase tracking-widest">CLOUD ONLINE</span>
        </div>
        <div
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all hover:bg-white/10 ${isSettingsOpen ? 'bg-white/10 text-white' : 'text-gray-500'}`}
        >
          <Settings size={20} />
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;
