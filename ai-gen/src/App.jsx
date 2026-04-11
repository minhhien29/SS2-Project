import React, { useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Send, Sparkles, Loader2, Download, Home, History, Settings,
  LogOut, AlertCircle, ShieldCheck, Image as ImageIcon, Clock, Cloud, Plus, X, 
  ChevronRight, Zap, Database, MessageSquare, Layers, Cpu, Sliders, Sun, Moon
} from 'lucide-react';

// --- 1. CONFIGURATION ---
// App.jsx

// Token vÃ  URl cá»§a supabase Ä‘Æ°á»£c lÆ°u trong file .env
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const DISPLAY_BRIGHTNESS_STORAGE_KEY = 'ai-vision-display-brightness';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
function App() {
  const HISTORY_REFERENCE_STORAGE_KEY = 'ai-vision-history-reference-images';
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); 
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [appNotice, setAppNotice] = useState('');
  const [brightness, setBrightness] = useState(() => {
    if (typeof window === 'undefined') return 100;

    const savedBrightness = Number(window.localStorage.getItem(DISPLAY_BRIGHTNESS_STORAGE_KEY));
    return Number.isFinite(savedBrightness) && savedBrightness >= 70 && savedBrightness <= 300
      ? savedBrightness
      : 100;
  });
  
  // States má»Ÿ rá»™ng
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [referencePreview, setReferencePreview] = useState(null);
  const [referenceFile, setReferenceFile] = useState(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const fileInputRef = useRef(null);

  // States Form Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullname, setFullname] = useState('');

  // --- 2. LOGIC Há»† THá»NG ---
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

  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (message) => {
      const text = String(message ?? '');

      if (text === 'Profile Mode!' || text === 'Flux.1-schnell activated!') {
        setAppNotice('This feature is currently being updated.');
        return;
      }

      if (text === 'Registration successful! Please sign in.') {
        setAuthSuccess('Your account has been created successfully.');
        return;
      }

      setAppNotice(text);
    };

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  useEffect(() => {
    setAppNotice('');
  }, [activeTab]);

  useEffect(() => {
    window.localStorage.setItem(DISPLAY_BRIGHTNESS_STORAGE_KEY, String(brightness));
  }, [brightness]);

  const handleUserSession = (user) => {
    setCurrentUser({
      name: user.user_metadata.full_name || user.user_metadata.name || 'Nguyá»…n Minh Hiá»n',
      email: user.email,
      avatar: user.user_metadata.avatar_url,
    });
    setIsLoggedIn(true);
    fetchHistory(user.email);
  };

  const displayFirstName = currentUser?.name?.trim()?.split(/\s+/).slice(-1)[0] || 'Developer';
  const decreaseBrightness = () => setBrightness((current) => Math.max(70, current - 10));
  const increaseBrightness = () => setBrightness((current) => Math.min(300, current + 10));
  const resetBrightness = () => setBrightness(100);
  const displayFilterStyle = { filter: `brightness(${brightness}%)` };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsSettingsOpen(false);
    setIsLoggedIn(false);
    window.location.reload();
  };
// --- COPY ÄOáº N NÃ€Y DÃN VÃ€O DÃ’NG 65 ---
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
      setAppNotice('Unable to download the image. Please try again.');
    }
  };

  const getStoredReferenceImage = (imageUrl) => {
    if (!imageUrl) return null;

    try {
      const stored = localStorage.getItem(HISTORY_REFERENCE_STORAGE_KEY);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      return parsed[imageUrl] || null;
    } catch (error) {
      console.error('Failed to read cached reference image:', error);
      return null;
    }
  };

  const cacheReferenceImage = (imageUrl, previewUrl) => {
    if (!imageUrl || !previewUrl) return;

    try {
      const stored = localStorage.getItem(HISTORY_REFERENCE_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : {};
      parsed[imageUrl] = previewUrl;
      localStorage.setItem(HISTORY_REFERENCE_STORAGE_KEY, JSON.stringify(parsed));
    } catch (error) {
      console.error('Failed to cache reference image:', error);
    }
  };

  const fetchHistory = async (email) => {
    if (!email) return;
    try {
      console.log("ðŸ” Fetching history for:", email);
      const res = await fetch(`${API_BASE_URL}/get-history?email=${email}`);
      const data = await res.json();
      
      if (data.status === 'success') {
        if (data.data && data.data.length > 0) {
          // Náº¾U CÃ“ Dá»® LIá»†U THáº¬T: Hiá»‡n dá»¯ liá»‡u tháº­t
          setHistoryItems(data.data);
        } else {
          // Náº¾U DATABASE TRá»NG: Hiá»‡n thÃ´ng bÃ¡o hoáº·c giá»¯ nguyÃªn dá»¯ liá»‡u máº«u Ä‘á»ƒ demo
          console.log("â„¹ï¸ Database is empty for this user.");
        }
      }
    } catch (e) { 
      console.error("âŒ Link Backend lá»—i hoáº·c chÆ°a báº­t main.py"); 
    }
  };

  const handleManualAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

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
          setAuthSuccess('Your account has been created successfully.');
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
  // HÃ m nÃ y giÃºp bÃ  "xÃ³a sáº¡ch dáº¥u váº¿t" Ä‘á»ƒ lÃ m cÃ¡i má»›i
  const startNewProject = () => {
    setResult(null);            // XÃ³a áº£nh káº¿t quáº£ cÅ©
    setPrompt('');              // XÃ³a cÃ¢u lá»‡nh cÅ©
    setReferencePreview(null);  // XÃ³a áº£nh gá»‘c cÅ©
    setReferenceFile(null);     // XÃ³a file Ä‘Ã£ chá»n
    setSelectedHistoryItem(null);
    setActiveTab('home');       // Quay vá» trang chá»§
  };

  const loadHistoryItem = (item, options = {}) => {
    if (!item) return;

    const restoredReferenceImage = item.reference_image_url || getStoredReferenceImage(item.image_url);

    setSelectedHistoryItem(item);
    if (item.image_url) setResult(item.image_url);
    setPrompt(item.prompt || '');
    setReferencePreview(restoredReferenceImage);
    setReferenceFile(null);

    if (options.openEditor) {
      setActiveTab('home');
    }
  };

 const generateImage = async () => {
    if (!prompt.trim()) return;
    setAppNotice('');
    try {
      const formData = new FormData();
      formData.append('text', prompt.trim());
      formData.append('email', currentUser.email);
      if (referenceFile) formData.append('image', referenceFile);
      
      const res = await fetch(`${API_BASE_URL}/edit-image`, { method: 'POST', body: formData });
      const data = await res.json();
      
      if (data.status === 'success') {
        // --- ÄÃ‚Y LÃ€ PHáº¦N Sá»¬A Lá»–I FRONTEND ---
        // 'result' state Ä‘Æ°á»£c set trá»±c tiáº¿p báº±ng chuá»—i Data URI: "data:image/png;base64,iVBOR..."
        setResult(data.image_url); 
        setSelectedHistoryItem(null);
        cacheReferenceImage(data.image_url, referencePreview);
        fetchHistory(currentUser.email);
      } else {
        setAppNotice(`AI error: ${data.message}`);
      }
    } catch (e) { console.error(e); setAppNotice('Image generation system error.'); }
    finally { setLoading(false); }
  };

  // =========================================================
  // --- 3. UI LOGIN (TRáº¢ Láº I Báº¢N Gá»C HÃ€O NHOÃNG) ---
  // =========================================================
  if (!isLoggedIn) {
    return (
      <div className="h-screen w-full bg-[#050505] flex items-center justify-center p-10 font-sans relative overflow-hidden transition-all duration-300" style={displayFilterStyle}>
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
            {authSuccess && <div className="mb-6 p-5 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-xs flex items-center gap-3"><ShieldCheck size={14}/> {authSuccess}</div>}
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
              <button className="w-full bg-blue-600 hover:bg-blue-500 py-6 rounded-2xl font-black uppercase text-white active:scale-95 transition-all shadow-lg mt-4 tracking-widest text-xs">
                {isRegistering ? 'Create Account' : 'Account Login'}
              </button>
            </form>
            <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin, queryParams: { prompt: 'select_account' } } })} className="mt-8 w-full bg-white text-black py-6 rounded-2xl font-black uppercase flex items-center justify-center gap-4 active:scale-95 transition-all shadow-2xl hover:bg-gray-100 text-xs tracking-widest"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" />Continue with Google</button>
            <button onClick={()=>setIsRegistering(!isRegistering)} className="mt-10 text-gray-500 text-[12px] uppercase font-bold text-center hover:text-blue-600 transition-all underline underline-offset-8 decoration-white/10">{isRegistering ? 'Back to Login' : 'Create an account'}</button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // --- 4. GIAO DIá»†N DASHBOARD (SIDEBAR + CONTENT) ---
  // =========================================================
  return (
    <div className="flex h-screen bg-[#0d0d11] text-white overflow-hidden font-sans relative transition-all duration-300" style={displayFilterStyle}>
      
      {/* SIDEBAR */}
      <aside className="w-80 bg-[#09090c] border-r border-white/5 flex flex-col p-8 shrink-0 shadow-2xl">
        <div className="flex items-center gap-4 mb-20 px-2">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20"><Sparkles size={24} /></div>
          <span className="font-black text-2xl italic tracking-tighter uppercase">AI VISION</span>
        </div>
        <nav className="flex-1 space-y-4">
          {/* NÃºt Home: Vá»«a chuyá»ƒn tab, vá»«a xÃ³a sáº¡ch dá»¯ liá»‡u cÅ© Ä‘á»ƒ lÃ m cÃ¡i má»›i */}
          <NavItem 
            icon={<Home size={20}/>} 
            label="HOME DASHBOARD" 
            active={activeTab==='home'} 
            onClick={() => {
              setResult(null);             // XÃ³a áº£nh káº¿t quáº£
              setPrompt('');               // XÃ³a chá»¯ trong Ã´ nháº­p
              setReferencePreview(null);    // XÃ³a áº£nh xem trÆ°á»›c
              setReferenceFile(null);       // XÃ³a file váº­t lÃ½ Ä‘Ã£ chá»n
              setSelectedHistoryItem(null);
              setActiveTab('home');        // Chuyá»ƒn vá» mÃ n hÃ¬nh chÃ­nh
            }} 
          />

          {/* NÃºt History: Chá»‰ chuyá»ƒn tab thÃ´i, Ä‘á»ƒ khi bÃ  báº¥m vÃ o áº£nh trong history nÃ³ váº«n cÃ²n Ä‘Ã³ */}
          <NavItem 
            icon={<History size={20}/>} 
            label="HISTORY EDIT" 
            active={activeTab==='history'} 
            onClick={() => {
              setActiveTab('history');
              fetchHistory(currentUser?.email); // Tiá»‡n tay cáº­p nháº­t lá»‹ch sá»­ má»›i nháº¥t luÃ´n
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
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
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
          {appNotice && (
            <div className="max-w-7xl mx-auto mb-6 p-5 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl text-yellow-300 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <AlertCircle size={14}/>
                <span>{appNotice}</span>
              </div>
              <button onClick={() => setAppNotice('')} className="text-yellow-300/70 hover:text-yellow-200 transition-all">
                <X size={14}/>
              </button>
            </div>
          )}
          
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
                <div className="flex justify-between items-center mb-8"><span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] flex items-center gap-2"><Sparkles size={14}/> AI RESULT</span>{result && <button onClick={() => handleDownload(result)} className="bg-blue-600 p-2 rounded-lg hover:bg-blue-500 transition-all shadow-lg"><Download size={18}/></button>}</div>
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

    {/* Giao diá»‡n 2 cá»™t: Danh sÃ¡ch & Xem trÆ°á»›c */}
    <div className="flex-1 flex gap-10 overflow-hidden">
      
      {/* Cá»˜T TRÃI: DANH SÃCH SESSIONS */}
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

      {/* Cá»˜T PHáº¢I: KHUNG XEM áº¢NH TO (PREVIEW PANE) */}
      <div className="flex-1 bg-[#09090c] rounded-[3rem] border border-white/5 p-8 flex flex-col relative group">
        <div className="absolute top-6 left-10 z-10">
          <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] italic bg-[#0d0d11] px-4 py-2 rounded-full border border-blue-500/20 shadow-xl">
            Preview Mode
          </span>
        </div>

        {/* Khung hiá»ƒn thá»‹ áº£nh chÃ­nh */}
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

        {/* ThÃ´ng tin cÃ¢u lá»‡nh Ä‘i kÃ¨m áº£nh */}
        {result && (
          <div className="mt-8 p-6 bg-white/5 rounded-3xl border border-white/5 animate-in slide-in-from-bottom-2">
            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2 flex items-center gap-2">
              <MessageSquare size={12}/> Original Prompt:
            </p>
            <p className="prompt-display-text text-[1.45rem] text-gray-100">
              "{prompt}"
            </p>
            
            {/* NÃºt Edit - Chá»‰ khi nÃ o muá»‘n sá»­a tiáº¿p má»›i báº¥m Ä‘Ã¢y Ä‘á»ƒ vá» Home */}
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

      {/* SETTINGS POPOVER (KIá»‚U GOOGLE CHUáº¨N) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] overflow-hidden">
          <div className="absolute inset-0 bg-transparent" onClick={() => setIsSettingsOpen(false)}></div>
          <div className="absolute top-20 right-10 w-[380px] bg-[#1e1f20] rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/5 p-6 animate-in slide-in-from-top-2 duration-300">
            <div className="flex justify-end mb-2"><X size={20} className="text-gray-500 cursor-pointer hover:text-white transition-all" onClick={()=>setIsSettingsOpen(false)}/></div>
            <div className="text-center pb-6 border-b border-white/5 relative">
              <p className="text-[11px] text-gray-400 font-medium mb-4 tracking-widest truncate px-4">{currentUser?.email}</p>
              <div className="w-20 h-20 bg-blue-600 rounded-full mx-auto flex items-center justify-center text-3xl font-black border-4 border-[#2d2e30] mb-4 shadow-xl overflow-hidden">
                {currentUser?.avatar ? <img src={currentUser.avatar} className="w-full h-full object-cover" alt={currentUser?.name || 'User avatar'} /> : currentUser?.name?.slice(0,1)}
              </div>
              <h2 className="text-xl font-medium text-white tracking-tight italic">Welcome {displayFirstName},</h2>
              <button onClick={() => setAppNotice('This feature is currently being updated.')} className="mt-4 px-6 py-2 rounded-full border border-gray-600 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all text-gray-300">Manage your Lab account</button>
            </div>
            <div className="mt-4 space-y-1">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-yellow-500/10 rounded-full flex items-center justify-center text-yellow-400">
                      {brightness >= 100 ? <Sun size={18} /> : <Moon size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Display Brightness</p>
                      <p className="text-[10px] text-gray-500 italic uppercase">{brightness}% intensity</p>
                    </div>
                  </div>
                  <button
                    onClick={resetBrightness}
                    className="px-4 py-2 rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-widest text-gray-300 hover:bg-white/5 transition-all"
                  >
                    Reset
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
              <div onClick={() => setAppNotice('This feature is currently being updated.')} className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl cursor-pointer group transition-all"><div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-white/10 text-blue-400"><Sparkles size={18}/></div><div><p className="text-sm font-bold text-white">AI Model</p><p className="text-[10px] text-gray-500 italic uppercase">FLUX.1-schnell</p></div></div>
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


