import { ChevronRight, History, Image as ImageIcon, MessageSquare, Send, Zap } from 'lucide-react';

function HistoryTab({ currentUser, fetchHistory, historyItems, loadHistoryItem, prompt, result, selectedHistoryItem }) {
  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 h-[700px] flex flex-col">
      <div className="mb-8 flex items-center justify-between px-4">
        <div>
          <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white flex items-center gap-4">
            <History className="text-blue-500" />
            Neural Gallery
          </h2>
          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.3em] mt-2 italic">
            Reviewing {historyItems.length} cloud records
          </p>
        </div>
        <button onClick={() => fetchHistory(currentUser?.email)} className="p-3 hover:bg-white/5 rounded-full text-gray-500 hover:text-blue-500 transition-all">
          <Zap size={20} />
        </button>
      </div>

      <div className="flex-1 flex gap-10 overflow-hidden">
        <div className="w-1/3 space-y-2 overflow-y-auto pr-4 custom-scrollbar border-r border-white/5">
          {historyItems.map((item) => (
            <div
              key={item.id}
              onClick={() => loadHistoryItem(item)}
              className={`group flex items-center gap-4 px-6 py-5 rounded-[2rem] cursor-pointer transition-all border ${
                result === item.image_url
                  ? 'bg-blue-600/10 border-blue-500/30'
                  : 'hover:bg-white/5 border-transparent'
              }`}
            >
              <div className={`w-3 h-3 rounded-full transition-all ${result === item.image_url ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6]' : 'bg-gray-800'}`}></div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate italic uppercase tracking-tighter ${result === item.image_url ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>
                  {item.prompt || 'No Prompt'}
                </p>
                <p className="text-[9px] font-black text-gray-700 uppercase mt-1">
                  {new Date(item.created_at).toLocaleTimeString()}
                </p>
              </div>
              <ChevronRight size={14} className={`transition-all ${result === item.image_url ? 'text-blue-500 translate-x-1' : 'text-gray-800 opacity-0 group-hover:opacity-100'}`} />
            </div>
          ))}
        </div>

        <div className="flex-1 bg-[#09090c] rounded-[3rem] border border-white/5 p-8 flex flex-col relative group">
          <div className="absolute top-6 left-10 z-10">
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] italic bg-[#0d0d11] px-4 py-2 rounded-full border border-blue-500/20 shadow-xl">
              Preview Mode
            </span>
          </div>

          <div className="flex-1 rounded-[2rem] overflow-hidden bg-black/40 border border-white/5 relative flex items-center justify-center">
            {result ? (
              <img src={result} className="w-full h-full object-contain animate-in zoom-in-95 duration-500" alt="Full Preview" />
            ) : (
              <div className="text-center opacity-10">
                <ImageIcon size={80} />
                <p className="text-xs font-black uppercase mt-6 tracking-widest">Select an item to view</p>
              </div>
            )}
          </div>

          {result && (
            <div className="mt-8 p-6 bg-white/5 rounded-3xl border border-white/5 animate-in slide-in-from-bottom-2">
              <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                <MessageSquare size={12} />
                Original Prompt:
              </p>
              <p className="prompt-display-text text-[1.45rem] text-gray-100">
                "{prompt}"
              </p>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => loadHistoryItem(selectedHistoryItem, { openEditor: true })}
                  className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-black uppercase italic text-[11px] tracking-widest transition-all shadow-lg active:scale-95"
                >
                  Open in Editor <Send size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HistoryTab;
