import React, { useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Send, Sparkles, Loader2, Download, Home, History, Settings,
  LogOut, AlertCircle, ShieldCheck, Image as ImageIcon, Clock, Cloud, Plus, X, 
  ChevronRight, Zap, Database, MessageSquare, Layers, Cpu, Sliders
} from 'lucide-react';

// --- 1. CONFIGURATION ---
// App.jsx

// Token và URl của supabase được lưu trong file .env
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); 
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [authError, setAuthError] = useState('');
  
  // States mở rộng
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [referencePreview, setReferencePreview] = useState(null);
  const [referenceFile, setReferenceFile] = useState(null);
  const fileInputRef = useRef(null);

  // States Form Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullname, setFullname] = useState('');

  // --- 2. LOGIC HỆ THỐNG ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) handleUserSession(session.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) handleUserSession(session.user);
      else { setIsLoggedIn(false); setCurrentUser(null); }
    });
    return () => subscription.unsubscribe();
  }, []);
const handleDownload = async (imageUrl) => {
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `AI-Vision-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      alert("Không thể tải ảnh. Vui lòng thử lại!");
    }
  };
  const handleUserSession = (user) => {
    setCurrentUser({
      name: user.user_metadata.full_name || user.user_metadata.name || 'Nguyễn Minh Hiền',
      email: user.email,
      avatar: user.user_metadata.avatar_url,
    });
    setIsLoggedIn(true);
    fetchHistory(user.email);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsSettingsOpen(false);
    setIsLoggedIn(false);
    window.location.reload();
  };

  const fetchHistory = async (email) => {
    if (!email) return;
    try {
      console.log("🔍 Fetching history for:", email);
      const res = await fetch(`${API_BASE_URL}/get-history?email=${email}`);
      const data = await res.json();
      
      if (data.status === 'success') {
        if (data.data && data.data.length > 0) {
          // NẾU CÓ DỮ LIỆU THẬT: Hiện dữ liệu thật
          setHistoryItems(data.data);
        } else {
          // NẾU DATABASE TRỐNG: Hiện thông báo hoặc giữ nguyên dữ liệu mẫu để demo
          console.log("ℹ️ Database is empty for this user.");
        }
      }
    } catch (e) { 
      console.error("❌ Link Backend lỗi hoặc chưa bật main.py"); 
    }
  };

  const handleManualAuth = async (e) => {
    e.preventDefault();
    setAuthError('');

    // --- CONDITION 1: EMAIL FORMAT VALIDATION ---
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setAuthError('Invalid email format (Example: name@email.com)');
      return;
    }

    // --- CONDITION 2: PASSWORD LENGTH VALIDATION ---
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters long!');
      return;
    }

    const endpoint = isRegistering ? '/register' : '/login';
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    if (isRegistering) formData.append('fullname', fullname);

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'POST', body: formData });
      const data = await res.json();
      
      if (data.status === 'success') {
        if (isRegistering) {
          setIsRegistering(false);
          alert("Registration successful! Please sign in.");
        } else {
          handleUserSession({ 
            email: data.email, 
            user_metadata: { full_name: data.fullname } 
          });
        }
      } else {
        // Handle error details from Backend
        setAuthError(data.detail || 'Invalid email or password!');
      }
    } catch (err) {
      setAuthError('System maintenance in progress, please try again later!');
    }
  };
  // Hàm này giúp bà "xóa sạch dấu vết" để làm cái mới
  const startNewProject = () => {
    setResult(null);            // Xóa ảnh kết quả cũ
    setPrompt('');              // Xóa câu lệnh cũ
    setReferencePreview(null);  // Xóa ảnh gốc cũ
    setReferenceFile(null);     // Xóa file đã chọn
    setActiveTab('home');       // Quay về trang chủ
  };
 const generateImage = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('text', prompt.trim());
      formData.append('email', currentUser.email);
      if (referenceFile) formData.append('image', referenceFile);
      
      const res = await fetch(`${API_BASE_URL}/edit-image`, { method: 'POST', body: formData });
      const data = await res.json();
      
      if (data.status === 'success') {
        // --- ĐÂY LÀ PHẦN SỬA LỖI FRONTEND ---
        // 'result' state được set trực tiếp bằng chuỗi Data URI: "data:image/png;base64,iVBOR..."
        setResult(data.image_url); 
        fetchHistory(currentUser.email);
      } else {
        alert("Lỗi AI: " + data.message);
      }
    } catch (e) { console.error(e); alert("Lỗi hệ thống gen ảnh."); }
    finally { setLoading(false); }
  };

  // =========================================================
  // --- 3. UI LOGIN (TRẢ LẠI BẢN GỐC HÀO NHOÁNG) ---
  // =========================================================
  if (!isLoggedIn) {
    return (
      <div className="h-screen w-full bg-[#050505] flex items-center justify-center p-10 font-sans relative overflow-hidden">
        <div className="w-full max-w-7xl h-[850px] bg-[#0b0b0d] rounded-[4rem] overflow-hidden flex border border-white/5 shadow-2xl z-10">
          <div className="hidden lg:flex w-1/2 bg-black relative">
            <img src="https://cdn.sforum.vn/sforum/wp-content/uploads/2023/07/hinh-nen-ai-76.jpg" className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105" alt="Lab Art" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0d] via-transparent to-transparent"></div>
            <div className="relative z-10 p-24 mt-auto">
              <h2 className="text-7xl font-black text-white italic uppercase leading-none tracking-tighter">Future <br /> AI Vision</h2>
              <p className="text-blue-500 font-bold mt-6 tracking-[0.3em] uppercase text-xs italic">Next-gen image processing lab</p>
            </div>
          </div>
          <div className="w-full lg:w-1/2 p-20 flex flex-col justify-center bg-[#0d0d11]">
            <header className="mb-12">
              <span className="text-blue-500 font-black text-[10px] uppercase tracking-[0.5em] mb-3 block italic">System Authorization</span>
              <h1 className="text-6xl font-black text-white uppercase tracking-tighter italic">{isRegistering ? 'CREATE' : 'SIGN IN'}</h1>
            </header>
            {authError && <div className="mb-6 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs flex items-center gap-3"><AlertCircle size={14}/> {authError}</div>}
            <form onSubmit={handleManualAuth} className="space-y-6">
              {isRegistering && (
                <div className="space-y-2">
                  <label className="text-[15px] font-black text-gray-500 uppercase tracking-widest ml-2">Full Name</label>
                  <input type="text" required className="w-full bg-[#16161c] border border-white/5 rounded-2xl p-5 text-white outline-none focus:border-blue-600 transition-all" onChange={(e)=>setFullname(e.target.value)} />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-[15px] font-black text-gray-500 uppercase tracking-widest ml-2">Email Address</label>
                <input type="email" required placeholder="name@email.com" className="w-full bg-[#16161c] border border-white/5 rounded-2xl p-5 text-white outline-none focus:border-blue-600 transition-all placeholder:text-gray-600" onChange={(e)=>setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-[15px] font-black text-gray-500 uppercase tracking-widest ml-2">Password</label>
                <input type="password" required className="w-full bg-[#16161c] border border-white/5 rounded-2xl p-5 text-white outline-none focus:border-blue-600 transition-all" onChange={(e)=>setPassword(e.target.value)} />
              </div>
              <button className="w-full bg-blue-600 hover:bg-blue-500 py-6 rounded-2xl font-black uppercase text-white active:scale-95 transition-all shadow-lg mt-4 tracking-widest text-xs">Account Login</button>
            </form>
            <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin, queryParams: { prompt: 'select_account' } } })} className="mt-8 w-full bg-white text-black py-6 rounded-2xl font-black uppercase flex items-center justify-center gap-4 active:scale-95 transition-all shadow-2xl hover:bg-gray-100 text-xs tracking-widest"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" />Continue with Google</button>
            <button onClick={()=>setIsRegistering(!isRegistering)} className="mt-10 text-gray-500 text-[12px] uppercase font-bold text-center hover:text-blue-600 transition-all underline underline-offset-8 decoration-white/10">{isRegistering ? 'Back to Login' : 'Create an account'}</button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // --- 4. GIAO DIỆN DASHBOARD (SIDEBAR + CONTENT) ---
  // =========================================================
  return (
    <div className="flex h-screen bg-[#0d0d11] text-white overflow-hidden font-sans relative">
      
      {/* SIDEBAR */}
      <aside className="w-80 bg-[#09090c] border-r border-white/5 flex flex-col p-8 shrink-0 shadow-2xl">
        <div className="flex items-center gap-4 mb-20 px-2">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20"><Sparkles size={24} /></div>
          <span className="font-black text-2xl italic tracking-tighter uppercase">AI VISION</span>
        </div>
        <nav className="flex-1 space-y-4">
          {/* Nút Home: Vừa chuyển tab, vừa xóa sạch dữ liệu cũ để làm cái mới */}
          <NavItem 
            icon={<Home size={20}/>} 
            label="HOME DASHBOARD" 
            active={activeTab==='home'} 
            onClick={() => {
              setResult(null);             // Xóa ảnh kết quả
              setPrompt('');               // Xóa chữ trong ô nhập
              setReferencePreview(null);    // Xóa ảnh xem trước
              setReferenceFile(null);       // Xóa file vật lý đã chọn
              setActiveTab('home');        // Chuyển về màn hình chính
            }} 
          />

          {/* Nút History: Chỉ chuyển tab thôi, để khi bà bấm vào ảnh trong history nó vẫn còn đó */}
          <NavItem 
            icon={<History size={20}/>} 
            label="HISTORY EDIT" 
            active={activeTab==='history'} 
            onClick={() => {
              setActiveTab('history');
              fetchHistory(currentUser?.email); // Tiện tay cập nhật lịch sử mới nhất luôn
            }} 
          />

          <NavItem 
            icon={<Settings size={20}/>} 
            label="AI ENGINE CONFIG" 
            active={activeTab==='config'} 
            onClick={() => setActiveTab('config')} 
          />
        </nav>
        <div className="mt-auto p-6 bg-white/5 rounded-[2.5rem] border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-black border-2 border-blue-400/30 overflow-hidden">
            {currentUser?.avatar ? <img src={currentUser.avatar} className="w-full h-full object-cover"/> : currentUser?.name?.slice(0,1)}
          </div>
          <div className="min-w-0"><p className="font-black text-sm truncate uppercase">{currentUser?.name}</p><p className="text-[9px] text-blue-500 font-black uppercase italic tracking-widest flex items-center gap-1"><ShieldCheck size={10}/> Verified IT Student</p></div>
        </div>
      </aside>

      {/* MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#0d0d11]">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-12 bg-black/20 backdrop-blur-xl sticky top-0 z-20 shadow-xl">
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-black text-gray-700 uppercase tracking-[0.4em]">PROJECT 2026</span>
            <span className="text-xl font-black italic uppercase tracking-widest border-l border-white/10 pl-6">
              {activeTab.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></div>
              <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">CLOUD ONLINE</span>
            </div>
            <div 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)} 
              className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all hover:bg-white/10 ${isSettingsOpen ? 'bg-white/10 text-white' : 'text-gray-500'}`}
            >
              <Settings size={20} />
            </div>
          </div>
        </header>

        <div className="flex-1 p-12 overflow-y-auto pb-48 custom-scrollbar">
          
          {/* TAB 1: HOME DASHBOARD */}
          {activeTab === 'home' && (
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in duration-500">
              <div className="bg-[#09090c] rounded-[2.75rem] p-10 border border-white/5 shadow-2xl relative group">
                <div className="flex justify-between items-center mb-8"><span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] flex items-center gap-2"><ImageIcon size={14}/> REFERENCE IMAGE</span><button onClick={()=>fileInputRef.current.click()} className="text-gray-500 hover:text-white transition-all"><Plus size={20}/></button></div>
                <div className="aspect-square bg-black/40 rounded-[2.2rem] border-2 border-dashed border-white/5 flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-500/50 transition-all" onClick={()=>fileInputRef.current.click()}>
                  {referencePreview ? <img src={referencePreview} className="w-full h-full object-cover" /> : <div className="text-center opacity-10"><ImageIcon size={48} /><p className="text-[10px] font-bold uppercase tracking-widest mt-4">Upload Input</p></div>}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" onChange={(e)=>{if(e.target.files[0]){setReferenceFile(e.target.files[0]); setReferencePreview(URL.createObjectURL(e.target.files[0]));}}} />
              </div>
              <div className="bg-[#09090c] rounded-[2.75rem] p-10 border border-white/5 shadow-2xl relative">
                <div className="flex justify-between items-center mb-8"><span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] flex items-center gap-2"><Sparkles size={14}/> AI RESULT</span>{result && <button onClick={()=>{const a=document.createElement('a'); a.href=result; a.download='ai-res.png'; a.click();}} className="bg-blue-600 p-2 rounded-lg hover:bg-blue-500 transition-all shadow-lg"><Download size={18}/></button>}</div>
                <div className="aspect-square bg-black/40 rounded-[2.2rem] border border-white/5 flex items-center justify-center overflow-hidden">
                  {loading ? <div className="text-center"><Loader2 className="animate-spin text-blue-500" size={48} /><p className="text-[10px] font-black uppercase text-blue-500 mt-4">Processing</p></div> : result ? <img src={result} className="w-full h-full object-cover animate-in zoom-in-95 duration-500" /> : <div className="text-center opacity-5"><Sparkles size={48} /><p className="text-xs font-bold uppercase tracking-widest mt-4">Waiting for Prompt</p></div>}
                </div>
              </div>
              <div className="fixed bottom-12 left-[calc(50%+160px)] translate-x-[-50%] w-full max-w-4xl px-8 z-40">
                <div className="bg-[#09090c]/95 backdrop-blur-2xl p-4 rounded-full border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.6)] flex items-center gap-4 group focus-within:border-blue-500/50 transition-all">
                  <input className="flex-1 bg-transparent px-8 py-4 outline-none italic text-2xl placeholder:text-gray-800 text-white" placeholder="change the color flower to red flower..." value={prompt} onChange={(e)=>setPrompt(e.target.value)} onKeyDown={(e)=>e.key==='Enter' && generateImage()} />
                  <button onClick={generateImage} disabled={loading} className="bg-blue-600 text-white p-6 rounded-full hover:bg-blue-500 active:scale-95 transition-all disabled:opacity-50">{loading ? <Loader2 className="animate-spin" size={32}/> : <Send size={32}/>}</button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HISTORY EDIT (PREVIEW MODE) */}
{activeTab === 'history' && (
  <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 h-[700px] flex flex-col">
    {/* Header */}
    <div className="mb-8 flex items-center justify-between px-4">
      <div>
        <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white flex items-center gap-4">
          <History className="text-blue-500" /> Neural Gallery
        </h2>
        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.3em] mt-2 italic">Reviewing {historyItems.length} cloud records</p>
      </div>
      <button onClick={() => fetchHistory(currentUser?.email)} className="p-3 hover:bg-white/5 rounded-full text-gray-500 hover:text-blue-500 transition-all">
        <Zap size={20}/>
      </button>
    </div>

    {/* Giao diện 2 cột: Danh sách & Xem trước */}
    <div className="flex-1 flex gap-10 overflow-hidden">
      
      {/* CỘT TRÁI: DANH SÁCH SESSIONS */}
      <div className="w-1/3 space-y-2 overflow-y-auto pr-4 custom-scrollbar border-r border-white/5">
        {historyItems.map((item) => (
          <div 
            key={item.id} 
            onClick={() => { 
              // Load vào bộ nhớ để hiện bên cột Preview
              if(item.image_url) setResult(item.image_url); 
              setPrompt(item.prompt); 
            }} 
            className={`group flex items-center gap-4 px-6 py-5 rounded-[2rem] cursor-pointer transition-all border ${
              result === item.image_url 
              ? 'bg-blue-600/10 border-blue-500/30' 
              : 'hover:bg-white/5 border-transparent'
            }`}
          >
            <div className={`w-3 h-3 rounded-full transition-all ${result === item.image_url ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6]' : 'bg-gray-800'}`}></div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold truncate italic uppercase tracking-tighter ${result === item.image_url ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>
                {item.prompt || "No Prompt"}
              </p>
              <p className="text-[9px] font-black text-gray-700 uppercase mt-1">
                {new Date(item.created_at).toLocaleTimeString()}
              </p>
            </div>
            <ChevronRight size={14} className={`transition-all ${result === item.image_url ? 'text-blue-500 translate-x-1' : 'text-gray-800 opacity-0 group-hover:opacity-100'}`} />
          </div>
        ))}
      </div>

      {/* CỘT PHẢI: KHUNG XEM ẢNH TO (PREVIEW PANE) */}
      <div className="flex-1 bg-[#09090c] rounded-[3rem] border border-white/5 p-8 flex flex-col relative group">
        <div className="absolute top-6 left-10 z-10">
          <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] italic bg-[#0d0d11] px-4 py-2 rounded-full border border-blue-500/20 shadow-xl">
            Preview Mode
          </span>
        </div>

        {/* Khung hiển thị ảnh chính */}
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

        {/* Thông tin câu lệnh đi kèm ảnh */}
        {result && (
          <div className="mt-8 p-6 bg-white/5 rounded-3xl border border-white/5 animate-in slide-in-from-bottom-2">
            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2 flex items-center gap-2">
              <MessageSquare size={12}/> Original Prompt:
            </p>
            <p className="text-xl font-black italic text-gray-200 uppercase tracking-tighter">
              "{prompt}"
            </p>
            
            {/* Nút Edit - Chỉ khi nào muốn sửa tiếp mới bấm đây để về Home */}
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setActiveTab('home')}
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
)}

          {/* TAB 3: CONFIGURATION */}
          {activeTab === 'config' && (
            <div className="max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-700">
               <div className="mb-12 px-4"><h2 className="text-3xl font-black italic uppercase tracking-tighter text-white flex items-center gap-4"><Cpu className="text-blue-500" /> AI Engine Config</h2><p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.3em] mt-2 italic">Neural Core Optimization / v2.0.4</p></div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
                  <div className="bg-[#09090c] border border-white/5 p-8 rounded-[2.5rem] space-y-6">
                     <div className="flex items-center gap-4 mb-4"><div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500"><Sliders size={20}/></div><span className="text-[11px] font-black uppercase tracking-widest">Processing Mode</span></div>
                     <select className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-bold uppercase tracking-widest text-white italic outline-none focus:border-blue-600 transition-all"><option>Black Forest Labs - FLUX.1</option><option>Stability AI - SDXL Turbo</option></select>
                  </div>
                  <div className="bg-[#09090c] border border-white/5 p-8 rounded-[2.5rem] space-y-6">
                     <div className="flex items-center gap-4 mb-4"><div className="w-10 h-10 bg-green-600/10 rounded-xl flex items-center justify-center text-green-500"><Database size={20}/></div><span className="text-[11px] font-black uppercase tracking-widest">Memory Storage</span></div>
                     <div className="p-4 bg-green-500/5 border border-green-500/10 rounded-2xl flex justify-between items-center"><span className="text-[10px] font-bold uppercase tracking-widest text-green-500">Cloud Sync Active</span><div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div></div>
                  </div>
               </div>
            </div>
          )}

        </div>
      </main>

      {/* SETTINGS POPOVER (KIỂU GOOGLE CHUẨN) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] overflow-hidden">
          <div className="absolute inset-0 bg-transparent" onClick={() => setIsSettingsOpen(false)}></div>
          <div className="absolute top-20 right-10 w-[380px] bg-[#1e1f20] rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/5 p-6 animate-in slide-in-from-top-2 duration-300">
            <div className="flex justify-end mb-2"><X size={20} className="text-gray-500 cursor-pointer hover:text-white transition-all" onClick={()=>setIsSettingsOpen(false)}/></div>
            <div className="text-center pb-6 border-b border-white/5 relative">
              <p className="text-[11px] text-gray-400 font-medium mb-4 tracking-widest truncate px-4">{currentUser?.email}</p>
              <div className="w-20 h-20 bg-blue-600 rounded-full mx-auto flex items-center justify-center text-3xl font-black border-4 border-[#2d2e30] mb-4 shadow-xl">{currentUser?.name?.slice(0,1)}</div>
              <h2 className="text-xl font-medium text-white tracking-tight italic">Welcome {currentUser?.name?.split(' ').pop()},</h2>
              <button onClick={() => alert("Profile Mode!")} className="mt-4 px-6 py-2 rounded-full border border-gray-600 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all text-gray-300">Manage your Lab account</button>
            </div>
            <div className="mt-4 space-y-1">
              <div onClick={() => alert("Flux.1-schnell activated!")} className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl cursor-pointer group transition-all"><div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-white/10 text-blue-400"><Sparkles size={18}/></div><div><p className="text-sm font-bold text-white">AI Model</p><p className="text-[10px] text-gray-500 italic uppercase">FLUX.1-schnell</p></div></div>
              <div className="mt-4 pt-4 border-t border-white/5"><div onClick={handleLogout} className="flex items-center justify-center gap-3 p-4 hover:bg-red-500/10 rounded-2xl cursor-pointer text-gray-400 hover:text-red-400 transition-all"><LogOut size={18}/><span className="text-xs font-black uppercase tracking-widest">Sign out of Lab</span></div></div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// NavItem Component
function NavItem({ icon, label, active, onClick }) {
  return (
    <div onClick={onClick} className={`flex items-center gap-6 px-8 py-6 rounded-[2rem] cursor-pointer transition-all border ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-[1.02]' : 'text-gray-600 border-transparent hover:bg-white/5 hover:text-white'}`}>
      {icon} <span className={`text-[11px] uppercase tracking-[0.2em] ${active ? 'font-black' : 'font-bold'}`}>{label}</span>
    </div>
  );
}

export default App;