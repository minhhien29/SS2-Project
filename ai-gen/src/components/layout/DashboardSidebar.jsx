import { History, Home, Settings, ShieldCheck, Sparkles } from 'lucide-react';

import NavItem from './NavItem';

function DashboardSidebar({ activeTab, currentUser, onConfigClick, onHistoryClick, onHomeClick }) {
  return (
    <aside className="w-80 bg-[linear-gradient(180deg,rgba(22,26,44,0.96),rgba(10,12,20,0.98))] border-r border-cyan-400/10 flex flex-col p-6 shrink-0 shadow-[0_0_40px_rgba(0,140,255,0.08)] relative overflow-hidden">
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.16),transparent_35%)]"></div>
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-cyan-300/40 to-transparent"></div>
      <div className="flex items-center gap-4 mb-20 px-2">
        <div className="w-12 h-12 bg-[radial-gradient(circle_at_center,_#38bdf8,_#2563eb)] rounded-xl flex items-center justify-center shadow-[0_0_24px_rgba(56,189,248,0.5)] text-white relative z-10">
          <Sparkles size={24} />
        </div>
        <span className="font-black text-2xl italic tracking-tighter uppercase text-cyan-100 drop-shadow-[0_0_14px_rgba(125,211,252,0.28)] relative z-10">
          AI VISION
        </span>
      </div>
      <nav className="flex-1 space-y-4 relative z-10">
        <NavItem
          icon={<Home size={20} />}
          label="HOME DASHBOARD"
          active={activeTab === 'home'}
          onClick={onHomeClick}
        />
        <NavItem
          icon={<History size={20} />}
          label="HISTORY EDIT"
          active={activeTab === 'history'}
          onClick={onHistoryClick}
        />
        <NavItem
          icon={<Settings size={20} />}
          label="AI ENGINE CONFIG"
          active={activeTab === 'config'}
          onClick={onConfigClick}
        />
      </nav>
      <div className="mt-auto p-6 bg-white/5 rounded-[2.5rem] border border-cyan-300/15 flex items-center gap-4 relative z-10 shadow-[0_0_24px_rgba(56,189,248,0.12)] backdrop-blur-xl">
        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-black border-2 border-blue-400/30 overflow-hidden">
          {currentUser?.avatar ? (
            <img src={currentUser.avatar} className="w-full h-full object-cover" />
          ) : (
            currentUser?.name?.slice(0, 1)
          )}
        </div>
        <div className="min-w-0">
          <p className="font-black text-sm truncate uppercase">{currentUser?.name}</p>
          <p className="text-[9px] text-blue-500 font-black uppercase italic tracking-widest flex items-center gap-1">
            <ShieldCheck size={10} />
            Verified IT Student
          </p>
        </div>
      </div>
    </aside>
  );
}

export default DashboardSidebar;
