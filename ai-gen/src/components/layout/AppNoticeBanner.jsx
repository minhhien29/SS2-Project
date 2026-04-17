import { AlertCircle, X } from 'lucide-react';

function AppNoticeBanner({ appNotice, onClose }) {
  if (!appNotice) return null;

  return (
    <div className="max-w-7xl mx-auto mb-6 p-5 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl text-yellow-300 text-xs flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <AlertCircle size={14} />
        <span>{appNotice}</span>
      </div>
      <button onClick={onClose} className="text-yellow-300/70 hover:text-yellow-200 transition-all">
        <X size={14} />
      </button>
    </div>
  );
}

export default AppNoticeBanner;
