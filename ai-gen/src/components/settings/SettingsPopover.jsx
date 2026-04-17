import { LogOut, Moon, Sparkles, Sun, X } from 'lucide-react';

function SettingsPopover({
  brightness,
  currentUser,
  displayFirstName,
  handleLogout,
  onClose,
  onGoogleSignIn,
  resetBrightness,
  setAppNotice,
  setBrightness,
}) {
  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      <div className="absolute inset-0 bg-black/15 backdrop-blur-[2px]" onClick={onClose}></div>
      <div className="absolute top-20 right-8 w-[400px] bg-[linear-gradient(180deg,rgba(37,43,62,0.86),rgba(20,23,34,0.92))] rounded-[2.5rem] shadow-[0_0_40px_rgba(34,211,238,0.18),0_20px_70px_rgba(0,0,0,0.5)] border border-cyan-300/25 p-6 animate-in slide-in-from-top-2 duration-300 backdrop-blur-2xl">
        <div className="absolute inset-0 rounded-[2.5rem] bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),transparent_30%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.12),transparent_24%)] pointer-events-none"></div>
        <div className="relative z-10 flex justify-end mb-2">
          <X size={20} className="text-gray-500 cursor-pointer hover:text-white transition-all" onClick={onClose} />
        </div>
        <div className="relative z-10 text-center pb-6 border-b border-white/10">
          <p className="text-[11px] text-gray-400 font-medium mb-4 tracking-widest truncate px-4">{currentUser?.email}</p>
          <div className="w-24 h-24 bg-blue-600 rounded-full mx-auto flex items-center justify-center text-3xl font-black border-4 border-cyan-300/30 mb-4 shadow-[0_0_30px_rgba(56,189,248,0.25)] overflow-hidden">
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} className="w-full h-full object-cover" alt={currentUser?.name || 'User avatar'} />
            ) : (
              currentUser?.name?.slice(0, 1)
            )}
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Welcome {displayFirstName},</h2>
          <button onClick={() => setAppNotice('This feature is currently being updated.')} className="mt-4 px-6 py-3 rounded-full border border-cyan-300/20 bg-blue-500/10 text-[10px] font-bold uppercase tracking-widest hover:bg-blue-500/20 transition-all text-cyan-100 shadow-[0_0_20px_rgba(56,189,248,0.12)]">
            Manage your Lab account
          </button>
        </div>
        <div className="relative z-10 mt-4 space-y-3">
          <div className="p-4 rounded-2xl bg-white/8 border border-white/10 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-yellow-500/10 rounded-full flex items-center justify-center text-yellow-400 shadow-[0_0_18px_rgba(250,204,21,0.14)]">
                  {brightness >= 100 ? <Sun size={18} /> : <Moon size={18} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Display Brightness</p>
                  <p className="text-[10px] text-gray-500 italic uppercase">{brightness}% intensity</p>
                </div>
              </div>
              <button
                onClick={resetBrightness}
                className="px-4 py-2 rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-widest text-cyan-100 hover:bg-white/5 transition-all"
              >
                Re-Set
              </button>
            </div>
            <input
              type="range"
              min="70"
              max="300"
              step="5"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="mt-4 w-full accent-blue-500 cursor-pointer"
            />
          </div>
          <div onClick={() => setAppNotice('This feature is currently being updated.')} className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl cursor-pointer group transition-all bg-white/6 border border-white/10">
            <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-white/10 text-blue-400">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">AI Model</p>
              <p className="text-[10px] text-gray-500 italic uppercase">Flux.1-Schnell</p>
            </div>
          </div>
          <div className="pt-1">
            <p className="text-center text-[11px] text-gray-400 mb-3">Or sign in with social media</p>
            <button onClick={onGoogleSignIn} className="w-full bg-white text-black h-12 rounded-[1rem] font-black uppercase flex items-center justify-center gap-3 active:scale-95 transition-all shadow-2xl hover:bg-gray-100 text-[12px] tracking-wide">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" />
              Sign In with Google
            </button>
          </div>
          <div className="mt-4 pt-4 border-t border-white/10">
            <div onClick={handleLogout} className="flex items-center justify-center gap-3 p-4 hover:bg-red-500/10 rounded-2xl cursor-pointer text-gray-400 hover:text-red-400 transition-all">
              <LogOut size={18} />
              <span className="text-xs font-black uppercase tracking-widest">Sign out of Lab</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPopover;
