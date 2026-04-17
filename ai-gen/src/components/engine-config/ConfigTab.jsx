import { Cpu, Database, Sliders } from 'lucide-react';

function ConfigTab() {
  return (
    <div className="max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-700">
      <div className="mb-12 px-4">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white flex items-center gap-4">
          <Cpu className="text-blue-500" />
          AI Engine Config
        </h2>
        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.3em] mt-2 italic">
          Neural Core Optimization / v2.0.4
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
        <div className="bg-[#09090c] border border-white/5 p-8 rounded-[2.5rem] space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500">
              <Sliders size={20} />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest">Processing Mode</span>
          </div>
          <select className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-bold uppercase tracking-widest text-white italic outline-none focus:border-blue-600 transition-all">
            <option>Black Forest Labs - FLUX.1</option>
            <option>Stability AI - SDXL Turbo</option>
          </select>
        </div>
        <div className="bg-[#09090c] border border-white/5 p-8 rounded-[2.5rem] space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-green-600/10 rounded-xl flex items-center justify-center text-green-500">
              <Database size={20} />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest">Memory Storage</span>
          </div>
          <div className="p-4 bg-green-500/5 border border-green-500/10 rounded-2xl flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-green-500">Cloud Sync Active</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfigTab;
