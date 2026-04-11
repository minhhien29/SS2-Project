import React, { useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Send, Sparkles, Loader2, Download, Home, History, Settings,
  LogOut, AlertCircle, ShieldCheck, Image as ImageIcon, Clock, Cloud, Plus, X, 
  ChevronRight, Zap, Database, MessageSquare, Layers, Cpu, Sliders, Sun, Moon,
  Mail, Lock, User
} from 'lucide-react';

// --- 1. CONFIGURATION ---
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const APP_BASE_URL = import.meta.env.VITE_APP_BASE_URL;
const DISPLAY_BRIGHTNESS_STORAGE_KEY = 'ai-vision-display-brightness';
const REMEMBER_ME_STORAGE_KEY = 'ai-vision-remember-me';
const REMEMBERED_EMAIL_STORAGE_KEY = 'ai-vision-remembered-email';
const REMEMBERED_USER_STORAGE_KEY = 'ai-vision-remembered-user';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});
function App() {
  const HISTORY_REFERENCE_STORAGE_KEY = 'ai-vision-history-reference-images';
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); 
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingElapsedSeconds, setLoadingElapsedSeconds] = useState(0);
  const [suggestingPrompt, setSuggestingPrompt] = useState(false);
  const [promptSuggestion, setPromptSuggestion] = useState('');
  const [imageCaption, setImageCaption] = useState('');
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
  
  // States Modal & Files
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [referencePreview, setReferencePreview] = useState(null);
  const [referenceFile, setReferenceFile] = useState(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const fileInputRef = useRef(null);

  // States Form Login
  const [email, setEmail] = useState(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(REMEMBERED_EMAIL_STORAGE_KEY) || '';
  });
  const [password, setPassword] = useState('');
  const [fullname, setFullname] = useState('');
  const [rememberMe, setRememberMe] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(REMEMBER_ME_STORAGE_KEY) === 'true';
  });
  const [resetEmail, setResetEmail] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const isPasswordRecoveryPath = () =>
    typeof window !== 'undefined' && window.location.pathname === '/reset-password';
  const openRecoveryModal = (userEmail = '') => {
    setIsRecoveryMode(true);
    setIsResetPasswordOpen(true);
    setResetNewPassword('');
    if (userEmail) setResetEmail(userEmail);
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  // 2. Effects and Handlers
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        if (isPasswordRecoveryPath()) {
          openRecoveryModal(session.user?.email || '');
          return;
        }
        handleUserSession(session.user);
        return;
      }

      const savedUser = window.localStorage.getItem(REMEMBERED_USER_STORAGE_KEY);
      if (!savedUser) return;

      try {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser?.email) handleUserSession(parsedUser, { persist: false });
      } catch (error) {
        window.localStorage.removeItem(REMEMBERED_USER_STORAGE_KEY);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'PASSWORD_RECOVERY') {
        openRecoveryModal(session?.user?.email || '');
        return;
      }
      if (session) {
        if (isPasswordRecoveryPath()) {
          openRecoveryModal(session.user?.email || '');
          return;
        }
        handleUserSession(session.user);
      }
      else { setIsLoggedIn(false); setCurrentUser(null); }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const syncRecoverySessionFromUrl = async () => {
      if (typeof window === 'undefined') return;

      const currentPath = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);

      if (currentPath === '/reset-password') {
        setIsResetPasswordOpen(true);
      }

      const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
      const hashParams = new URLSearchParams(hash);
      const code = searchParams.get('code');
      const tokenHash = searchParams.get('token_hash');
      const recoveryType = searchParams.get('type') || hashParams.get('type');

      try {
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setAuthError(error.message || 'This reset link is invalid or has expired.');
            return;
          }

          if (recoveryType === 'recovery' || currentPath === '/reset-password') {
            openRecoveryModal(data?.session?.user?.email || data?.user?.email || '');
          }

          window.history.replaceState({}, document.title, currentPath);
          return;
        }

        if (tokenHash && recoveryType === 'recovery') {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });

          if (error) {
            setAuthError(error.message || 'This reset link is invalid or has expired.');
            return;
          }

          openRecoveryModal(data?.user?.email || '');
          window.history.replaceState({}, document.title, currentPath);
          return;
        }
      } catch (error) {
        setAuthError('This reset link is invalid or has expired.');
        return;
      }

      if (!hash) return;

      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (recoveryType !== 'recovery' || !accessToken || !refreshToken) return;

      try {
        const { data } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        openRecoveryModal(data?.user?.email || data?.session?.user?.email || '');
        window.history.replaceState({}, document.title, currentPath);
      } catch (error) {
        setAuthError('This reset link is invalid or has expired.');
      }
    };

    syncRecoverySessionFromUrl();
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

  useEffect(() => {
    if (!loading) {
      setLoadingElapsedSeconds(0);
      return;
    }

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setLoadingElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [loading]);

  useEffect(() => {
    window.localStorage.setItem(REMEMBER_ME_STORAGE_KEY, String(rememberMe));

    if (rememberMe && email.trim()) {
      window.localStorage.setItem(REMEMBERED_EMAIL_STORAGE_KEY, email.trim());
    } else if (!rememberMe) {
      window.localStorage.removeItem(REMEMBERED_EMAIL_STORAGE_KEY);
      window.localStorage.removeItem(REMEMBERED_USER_STORAGE_KEY);
    }
  }, [rememberMe, email]);

  const handleUserSession = (user, options = {}) => {
    const shouldPersist = options.persist ?? rememberMe;

    setCurrentUser({
      name: user.user_metadata.full_name || user.user_metadata.name || 'Nguyá»…n Minh Hiá»n',
      email: user.email,
      avatar: user.user_metadata.avatar_url,
    });
    setIsLoggedIn(true);
    fetchHistory(user.email);

    if (shouldPersist) {
      window.localStorage.setItem(
        REMEMBERED_USER_STORAGE_KEY,
        JSON.stringify({
          email: user.email,
          user_metadata: {
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'Developer',
            avatar_url: user.user_metadata?.avatar_url || '',
          },
        })
      );
      window.localStorage.setItem(REMEMBERED_EMAIL_STORAGE_KEY, user.email || '');
    } else {
      window.localStorage.removeItem(REMEMBERED_USER_STORAGE_KEY);
    }
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
    window.localStorage.removeItem(REMEMBERED_USER_STORAGE_KEY);
    window.location.reload();
  };
// Others --- IGNORE----
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
          // Database
          setHistoryItems(data.data);
        } else {
console.log("Database is empty for this user.");
          setHistoryItems([]);}
      }
    } catch (e) { 
console.error(" Link Backend error or not running main.py");
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

  const handleForgotPassword = async () => {
    setAuthError('');
    setAuthSuccess('');
    setIsRecoveryMode(false);
    setResetEmail(email.trim());
    setIsResetPasswordOpen(true);
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    try {
      if (isRecoveryMode) {
        if (resetNewPassword.length < 6) {
          setAuthError('Password must be at least 6 characters long!');
          return;
        }

        const { error } = await supabase.auth.updateUser({ password: resetNewPassword });
        if (error) {
          setAuthError(error.message || 'Unable to update your password right now.');
          return;
        }

        setResetNewPassword('');
        setIsRecoveryMode(false);
        setIsResetPasswordOpen(false);
        setAuthSuccess('Your password has been updated successfully.');
        return;
      }

      const targetEmail = resetEmail.trim();
      if (!targetEmail) return;

      const formData = new FormData();
      formData.append('email', targetEmail);
      const resetRedirectUrl = `${APP_BASE_URL || window.location.origin}/reset-password`;
      formData.append('redirect_to', resetRedirectUrl);

      const res = await fetch(`${API_BASE_URL}/forgot-password`, { method: 'POST', body: formData });
      const data = await res.json();

      if (res.ok && data.status === 'success') {
        setEmail(targetEmail);
        setIsResetPasswordOpen(false);
        setAuthSuccess(data.message || 'A password reset link has been sent to your email.');
        setAppNotice('');
        return;
      }

      setAuthError(data.detail || data.message || 'Unable to reset your password right now.');
    } catch (error) {
      setAuthError(
        isRecoveryMode
          ? 'Unable to update your password right now.'
          : 'Unable to reset your password right now.'
      );
    }
  };

  const fetchPromptSuggestion = async (file) => {
    if (!file) return;

    setSuggestingPrompt(true);
    setPromptSuggestion('');
    setImageCaption('');
    setAppNotice('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_BASE_URL}/suggest-prompt`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setPromptSuggestion(data.suggested_prompt || '');
        setImageCaption(data.caption || '');
        return;
      }

      setAppNotice(data.message || data.detail || 'Unable to suggest a prompt for this image.');
    } catch (error) {
      console.error(error);
      setAppNotice('Unable to suggest a prompt for this image.');
    } finally {
      setSuggestingPrompt(false);
    }
  };

  const handleReferenceFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setReferenceFile(file);
    setReferencePreview(URL.createObjectURL(file));
    fetchPromptSuggestion(file);
  };
  const startNewProject = () => {
    setResult(null);            
    setPrompt('');             
    setPromptSuggestion('');
    setImageCaption('');
    setReferencePreview(null);  
    setReferenceFile(null);     
    setSelectedHistoryItem(null);
    setActiveTab('home');       
  };

  const loadHistoryItem = (item, options = {}) => {
    if (!item) return;

    const restoredReferenceImage = item.reference_image_url || getStoredReferenceImage(item.image_url);

    setSelectedHistoryItem(item);
    if (item.image_url) setResult(item.image_url);
    setPrompt(item.prompt || '');
    setPromptSuggestion('');
    setImageCaption('');
    setReferencePreview(restoredReferenceImage);
    setReferenceFile(null);

    if (options.openEditor) {
      setActiveTab('home');
    }
  };

  const generateImage = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setLoadingElapsedSeconds(0);
    setAppNotice('');
    try {
      const formData = new FormData();
      formData.append('text', prompt.trim());
      formData.append('email', currentUser.email);
      if (referenceFile) formData.append('image', referenceFile);
      
      const res = await fetch(`${API_BASE_URL}/edit-image`, { method: 'POST', body: formData });
      const data = await res.json();
      
      if (data.status === 'success') {
        // ---  FRONTEND ---
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

  const handleRegeneratePreview = () => {
    if (!referenceFile && !referencePreview) {
      setAppNotice('Upload a reference image first, then regenerate.');
      return;
    }

    if (!prompt.trim()) {
      setAppNotice('Choose a preset or enter a prompt before regenerating.');
      return;
    }

    generateImage();
  };

  // --- 3. UI LOGIN ---
  if (!isLoggedIn) {
    return (
      <>
      <div className="min-h-screen w-full bg-[#050505] font-sans relative overflow-y-auto transition-all duration-300" style={displayFilterStyle}>
      <div className="w-full min-h-screen bg-[#0b0b0d] flex">
          <div className="hidden lg:flex w-1/2 bg-black relative">
            <img src="https://cdn.sforum.vn/sforum/wp-content/uploads/2023/07/hinh-nen-ai-76.jpg" className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105" alt="Lab Art" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0d] via-transparent to-transparent"></div>
            <div className="relative z-10 p-24 mt-auto">
              <h2 className="text-7xl font-black text-white italic uppercase leading-none tracking-tighter">Future <br /> AI Vision</h2>
              <p className="text-blue-500 font-bold mt-6 tracking-[0.3em] uppercase text-xs italic">Next-gen image processing lab</p>
            </div>
          </div>
          <div className="w-full lg:w-1/2 min-h-screen px-6 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-8 flex flex-col justify-center bg-[#0d0d11] overflow-y-auto">
            <div className="w-full max-w-[520px] mx-auto">
            <header className={isRegistering ? 'mb-6 lg:mb-8' : 'mb-8 lg:mb-10'}>
              <span className="text-blue-400 font-black text-[10px] lg:text-[11px] uppercase tracking-[0.4em] mb-3 block italic">System Authorization</span>
              <h1 className={`${isRegistering ? 'text-[clamp(2.8rem,5.8vh,4.5rem)]' : 'text-[clamp(3.25rem,7vh,5.25rem)]'} font-black text-white uppercase tracking-tighter italic leading-[0.92]`}>{isRegistering ? 'CREATE' : 'SIGN IN'}</h1>
            </header>
            {authSuccess && <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-xs flex items-center gap-3"><ShieldCheck size={14}/> {authSuccess}</div>}
            {authError && <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs flex items-center gap-3"><AlertCircle size={14}/> {authError}</div>}
            <form onSubmit={handleManualAuth} className={isRegistering ? 'space-y-4 lg:space-y-5' : 'space-y-5 lg:space-y-6'}>
              {isRegistering && (
                <div className="space-y-2">
                  <label className="text-[15px] lg:text-[16px] font-black text-gray-300 uppercase tracking-wide">Full Name</label>
                  <div className="flex min-h-[56px] items-center gap-3 rounded-[1.05rem] bg-[#1a1b23] border border-white/5 px-4 py-3 transition-all focus-within:border-blue-500/70 focus-within:shadow-[0_0_0_1px_rgba(59,130,246,0.5),0_0_24px_rgba(59,130,246,0.2)]">
                  <input type="text" required placeholder="Your full name" className="flex-1 bg-transparent text-[15px] lg:text-[16px] text-white outline-none placeholder:text-gray-500" value={fullname} onChange={(e)=>setFullname(e.target.value)} />
                    <User size={18} className="text-blue-300/80 shrink-0" />
                  </div>
                </div>
              )}
              <div className={isRegistering ? 'space-y-2' : 'space-y-3'}>
                <label className="text-[16px] lg:text-[18px] font-black text-gray-300 uppercase tracking-wide">Email Address</label>
                <div className={`flex ${isRegistering ? 'min-h-[56px]' : 'min-h-[60px]'} items-center gap-3 rounded-[1.05rem] bg-[#1a1b23] border border-blue-400/30 px-4 py-3 shadow-[0_0_0_1px_rgba(96,165,250,0.28),0_0_18px_rgba(56,189,248,0.18)] transition-all focus-within:border-cyan-300/80 focus-within:shadow-[0_0_0_1px_rgba(96,165,250,0.5),0_0_28px_rgba(56,189,248,0.28)]`}>
                  <input type="email" required placeholder="name@email.com" className="flex-1 bg-transparent text-[15px] lg:text-[16px] text-white outline-none placeholder:text-gray-500" value={email} onChange={(e)=>setEmail(e.target.value)} />
                  <Mail size={18} className="text-blue-300/80 shrink-0" />
                </div>
              </div>
              <div className={isRegistering ? 'space-y-2' : 'space-y-3'}>
                <label className="text-[16px] lg:text-[18px] font-black text-gray-300 uppercase tracking-wide">Password</label>
                <div className={`flex ${isRegistering ? 'min-h-[56px]' : 'min-h-[60px]'} items-center gap-3 rounded-[1.05rem] bg-[#1a1b23] border border-blue-400/30 px-4 py-3 shadow-[0_0_0_1px_rgba(96,165,250,0.28),0_0_18px_rgba(56,189,248,0.18)] transition-all focus-within:border-cyan-300/80 focus-within:shadow-[0_0_0_1px_rgba(96,165,250,0.5),0_0_28px_rgba(56,189,248,0.28)]`}>
                  <input type="password" required placeholder="Password" className="flex-1 bg-transparent text-[15px] lg:text-[16px] text-white outline-none placeholder:text-gray-500" value={password} onChange={(e)=>setPassword(e.target.value)} />
                  <Lock size={18} className="text-blue-300/80 shrink-0" />
                </div>
              </div>
              <div className="w-full flex items-center justify-between text-[13px] lg:text-[14px]">
                <label className="flex items-center gap-3 text-gray-400 cursor-pointer select-none">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 rounded border border-white/15 bg-white/5 accent-blue-500" />
                  <span>Remember Me</span>
                </label>
                <button type="button" onClick={handleForgotPassword} className="text-gray-500 hover:text-gray-300 transition-all underline underline-offset-4 decoration-white/10">Forgot Password?</button>
              </div>
              <button className={`w-full bg-[linear-gradient(90deg,#1a188f_0%,#1d4dff_38%,#27a2ff_100%)] hover:brightness-110 ${isRegistering ? 'py-4' : 'py-5'} rounded-[1.05rem] font-black uppercase text-white active:scale-[0.98] transition-all shadow-[0_0_0_1px_rgba(96,165,250,0.45),0_12px_30px_rgba(37,99,235,0.45),inset_0_1px_0_rgba(255,255,255,0.12)] mt-1 tracking-wide ${isRegistering ? 'text-[13px]' : 'text-[14px]'} border border-blue-300/20`}>
                {isRegistering ? 'Create Account' : 'Account Login'}
              </button>
            </form>
            <div className={isRegistering ? 'mt-4' : 'mt-6'}>
              <p className="text-center text-gray-400 text-[14px] lg:text-[15px]">Or sign in with social media</p>
              <div className={isRegistering ? 'mt-3' : 'mt-4'}>
                <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin, queryParams: { prompt: 'select_account' } } })} className={`w-full bg-white text-black ${isRegistering ? 'h-11' : 'h-14'} rounded-[1rem] font-black uppercase flex items-center justify-center gap-3 active:scale-95 transition-all shadow-2xl hover:bg-gray-100 ${isRegistering ? 'text-[12px]' : 'text-[13px]'} tracking-wide`}>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" />
                  Continue with Google
                </button>
              </div>
            </div>
            <div className={`${isRegistering ? 'mt-4 gap-2.5' : 'mt-6 gap-3'} flex flex-col items-center text-[13px] lg:text-[14px]`}>
              <button onClick={()=>setIsRegistering(!isRegistering)} className="text-gray-400 uppercase font-bold hover:text-blue-400 transition-all underline underline-offset-8 decoration-2 decoration-white/30">{isRegistering ? 'Back to Login' : 'Create an account'}</button>
            </div>
            </div>
          </div>
        </div>
      </div>
      {isResetPasswordOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#12131a] p-8 shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-black uppercase tracking-[0.35em] text-blue-400">
                  {isRecoveryMode ? 'Update Password' : 'Password Reset'}
                </p>
                <h2 className="mt-3 text-3xl font-black uppercase italic text-white">
                  {isRecoveryMode ? 'Set New Password' : 'Reset Password'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsResetPasswordOpen(false);
                  setIsRecoveryMode(false);
                }}
                className="rounded-full p-2 text-gray-500 transition-all hover:bg-white/5 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="mt-8 space-y-6">
              <div className="space-y-3">
                <label className="text-[16px] font-black uppercase tracking-wide text-gray-300">Email Address</label>
                <div className="flex items-center gap-4 rounded-[1.35rem] bg-[#1a1b23] border border-blue-400/30 px-5 py-4 shadow-[0_0_0_1px_rgba(96,165,250,0.28),0_0_18px_rgba(56,189,248,0.18)]">
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="flex-1 bg-transparent text-[17px] text-white outline-none placeholder:text-gray-500"
                    placeholder="name@email.com"
                  />
                  <Mail size={18} className="text-blue-300/80" />
                </div>
              </div>

              {isRecoveryMode ? (
                <div className="space-y-3">
                  <label className="text-[16px] font-black uppercase tracking-wide text-gray-300">New Password</label>
                  <div className="flex items-center gap-4 rounded-[1.35rem] bg-[#1a1b23] border border-blue-400/30 px-5 py-4 shadow-[0_0_0_1px_rgba(96,165,250,0.28),0_0_18px_rgba(56,189,248,0.18)]">
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      className="flex-1 bg-transparent text-[17px] text-white outline-none placeholder:text-gray-500"
                      placeholder="Enter a new password"
                    />
                    <Lock size={18} className="text-blue-300/80" />
                  </div>
                </div>
              ) : (
                <p className="rounded-[1.35rem] border border-white/10 bg-white/5 px-5 py-4 text-sm leading-6 text-gray-400">
                  We will send a secure password reset link to your email address. Open the link in your inbox to choose a new password.
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetPasswordOpen(false);
                    setIsRecoveryMode(false);
                  }}
                  className="flex-1 rounded-[1rem] border border-white/10 bg-white/5 px-5 py-4 text-sm font-black uppercase tracking-wide text-gray-300 transition-all hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-[1rem] border border-blue-300/20 bg-[linear-gradient(90deg,#1a188f_0%,#1d4dff_38%,#27a2ff_100%)] px-5 py-4 text-sm font-black uppercase tracking-wide text-white shadow-[0_0_0_1px_rgba(96,165,250,0.45),0_12px_30px_rgba(37,99,235,0.45)] transition-all hover:brightness-110"
                >
                  {isRecoveryMode ? 'Save Password' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>
    );
  }

  // --- 4. DASHBOARD (SIDEBAR + CONTENT) ---
  return (
    <div className="flex h-screen bg-[radial-gradient(circle_at_bottom_left,_rgba(0,163,255,0.15),_transparent_26%),radial-gradient(circle_at_bottom_center,_rgba(255,0,128,0.12),_transparent_22%),linear-gradient(180deg,#0a0c14_0%,#090b12_100%)] text-white overflow-hidden font-sans relative transition-all duration-300" style={displayFilterStyle}>
      
      {/* SIDEBAR */}
      <aside className="w-80 bg-[linear-gradient(180deg,rgba(22,26,44,0.96),rgba(10,12,20,0.98))] border-r border-cyan-400/10 flex flex-col p-6 shrink-0 shadow-[0_0_40px_rgba(0,140,255,0.08)] relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.16),transparent_35%)]"></div>
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-cyan-300/40 to-transparent"></div>
        <div className="flex items-center gap-4 mb-20 px-2">
          <div className="w-12 h-12 bg-[radial-gradient(circle_at_center,_#38bdf8,_#2563eb)] rounded-xl flex items-center justify-center shadow-[0_0_24px_rgba(56,189,248,0.5)] text-white relative z-10"><Sparkles size={24} /></div>
          <span className="font-black text-2xl italic tracking-tighter uppercase text-cyan-100 drop-shadow-[0_0_14px_rgba(125,211,252,0.28)] relative z-10">AI VISION</span>
        </div>
        <nav className="flex-1 space-y-4 relative z-10">
          {/*Home*/}
          <NavItem 
            icon={<Home size={20}/>} 
            label="HOME DASHBOARD" 
            active={activeTab==='home'} 
            onClick={() => {
              setResult(null);             
              setPrompt('');               
              setReferencePreview(null);    
              setReferenceFile(null);       
              setSelectedHistoryItem(null);
              setActiveTab('home');        
            }} 
          />

          {/*History*/}
          <NavItem 
            icon={<History size={20}/>} 
            label="HISTORY EDIT" 
            active={activeTab==='history'} 
            onClick={() => {
              setActiveTab('history');
              fetchHistory(currentUser?.email);
            }} 
          />

          <NavItem 
            icon={<Settings size={20}/>} 
            label="AI ENGINE CONFIG" 
            active={activeTab==='config'} 
            onClick={() => setActiveTab('config')} 
          />
        </nav>
        <div className="mt-auto p-6 bg-white/5 rounded-[2.5rem] border border-cyan-300/15 flex items-center gap-4 relative z-10 shadow-[0_0_24px_rgba(56,189,248,0.12)] backdrop-blur-xl">
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-black border-2 border-blue-400/30 overflow-hidden">
            {currentUser?.avatar ? <img src={currentUser.avatar} className="w-full h-full object-cover"/> : currentUser?.name?.slice(0,1)}
          </div>
          <div className="min-w-0"><p className="font-black text-sm truncate uppercase">{currentUser?.name}</p><p className="text-[9px] text-blue-500 font-black uppercase italic tracking-widest flex items-center gap-1"><ShieldCheck size={10}/> Verified IT Student</p></div>
        </div>
      </aside>

      {/* MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-transparent">
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

        <div className="flex-1 p-10 overflow-y-auto pb-40 custom-scrollbar">
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
            <div className="max-w-[1200px] mx-auto animate-in fade-in duration-500">
              <div className="grid grid-cols-1 xl:grid-cols-[1.45fr_0.85fr] gap-6">
                <div className="rounded-[2.75rem] border border-cyan-300/15 bg-[linear-gradient(180deg,rgba(13,16,30,0.92),rgba(9,10,18,0.98))] shadow-[0_0_45px_rgba(59,130,246,0.08)] p-6 relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-cyan-400/0 via-cyan-300/70 to-pink-400/0"></div>
                  <div className="flex justify-between items-center mb-5">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.32em] flex items-center gap-2"><ImageIcon size={14}/> Preview Image</span>
                    <button onClick={()=>fileInputRef.current.click()} className="text-gray-500 hover:text-white transition-all"><Plus size={20}/></button>
                  </div>
                  <div className="rounded-[2rem] p-[2px] bg-[linear-gradient(90deg,rgba(34,211,238,0.9),rgba(56,189,248,0.35),rgba(244,114,182,0.9),rgba(163,230,53,0.85))] shadow-[0_0_40px_rgba(96,165,250,0.2)]">
                    <div className="h-[min(42vh,360px)] rounded-[calc(2rem-2px)] bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),transparent_30%),linear-gradient(180deg,#0b0d17_0%,#090b12_100%)] border border-white/5 flex items-center justify-center overflow-hidden cursor-pointer relative" onClick={()=>fileInputRef.current.click()}>
                      {referencePreview ? (
                        <img src={referencePreview} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center opacity-25">
                          <ImageIcon size={58} />
                          <p className="text-[10px] font-bold uppercase tracking-widest mt-4">Upload Input</p>
                        </div>
                      )}
                      <div className="absolute top-4 right-4 px-4 py-2 rounded-full border border-white/10 bg-black/35 backdrop-blur-xl text-[10px] font-black uppercase tracking-[0.22em] text-white/80">
                        Click to browse
                      </div>
                    </div>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleReferenceFileChange} />

                  {(suggestingPrompt || promptSuggestion) && (
                    <div className="mt-5 rounded-[1.7rem] border border-cyan-300/15 bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(9,11,18,0.95))] p-5 shadow-[0_0_35px_rgba(34,211,238,0.08)]">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-black text-cyan-300 uppercase tracking-[0.28em]">Prompt Suggestion</p>
                          <p className="mt-2 text-sm text-gray-400">
                            {suggestingPrompt
                              ? 'Analyzing your reference image and building a suggested prompt...'
                              : imageCaption
                                ? `AI image analysis: ${imageCaption}`
                                : 'A suggested prompt is ready for this image.'}
                          </p>
                        </div>
                        {promptSuggestion && (
                          <button
                            type="button"
                            onClick={() => setPrompt(promptSuggestion)}
                            className="shrink-0 rounded-full bg-cyan-400/15 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200 transition-all hover:bg-cyan-400/25"
                          >
                            Use Suggestion
                          </button>
                        )}
                      </div>
                      <div className="mt-4 rounded-[1.3rem] border border-white/10 bg-black/20 px-4 py-4 text-sm leading-7 text-gray-200">
                        {suggestingPrompt ? (
                          <div className="flex items-center gap-3 text-cyan-200">
                            <Loader2 className="animate-spin" size={18} />
                            <span>Generating a prompt suggestion...</span>
                          </div>
                        ) : (
                          promptSuggestion
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 rounded-[2rem] border border-white/10 bg-[#0d1019]/90 backdrop-blur-2xl p-3 shadow-[0_20px_60px_rgba(0,0,0,0.45)] flex items-center gap-3 group focus-within:border-cyan-300/40 transition-all">
                    <input
                      className="flex-1 bg-transparent px-5 py-3 outline-none italic text-xl placeholder:text-slate-600 text-white"
                      placeholder="change the color flower to red flower..."
                      value={prompt}
                      onChange={(e)=>setPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !loading) {
                          e.preventDefault();
                          generateImage();
                        }
                      }}
                    />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="px-5 py-3 rounded-full border border-white/10 bg-white/5 text-[11px] font-black uppercase tracking-wide text-gray-300 hover:bg-white/10 transition-all">Browse File</button>
                    <button onClick={generateImage} disabled={loading} className="bg-blue-600 text-white p-4 rounded-full hover:bg-blue-500 active:scale-95 transition-all disabled:opacity-50 shadow-[0_0_26px_rgba(59,130,246,0.28)]">{loading ? <Loader2 className="animate-spin" size={24}/> : <Send size={24}/>}</button>
                  </div>

                  <div className="mt-6 rounded-[1.7rem] border border-white/10 bg-black/20 p-5">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.28em]">Editing Workflow</p>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        '1. Upload a reference image',
                        '2. Review or apply the suggested prompt',
                        '3. Press Enter or click send to generate a new result',
                      ].map((step) => (
                        <div key={step} className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-gray-300">
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-[2.75rem] border border-cyan-300/15 bg-[linear-gradient(180deg,rgba(13,16,30,0.92),rgba(9,10,18,0.98))] shadow-[0_0_45px_rgba(236,72,153,0.08)] p-6 relative overflow-hidden">
                  <div className="flex justify-between items-center mb-5">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.32em] flex items-center gap-2"><Sparkles size={14}/> Final Output</span>
                    {result && <button onClick={() => handleDownload(result)} className="bg-blue-600 p-2 rounded-lg hover:bg-blue-500 transition-all shadow-lg"><Download size={18}/></button>}
                  </div>

                  <div className="rounded-[2rem] border border-white/10 bg-black/25 p-5 min-h-[420px] flex items-center justify-center overflow-hidden">
                    {loading ? <div className="text-center"><Loader2 className="animate-spin text-blue-500 mx-auto" size={42} /><p className="text-[10px] font-black uppercase text-blue-500 mt-4">Processing</p><p className="mt-3 text-sm text-gray-400">{loadingElapsedSeconds}s elapsed</p></div> : result ? <img src={result} className="w-full h-full max-h-[420px] object-contain animate-in zoom-in-95 duration-500" /> : <div className="text-center opacity-10"><Sparkles size={60} className="mx-auto" /><p className="text-xs font-bold uppercase tracking-widest mt-4">Waiting for Prompt</p></div>}
                  </div>

                  <div className="mt-5 rounded-[1.7rem] border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.28em]">Output Notes</p>
                    <p className="mt-4 text-sm leading-7 text-gray-300">
                      Upload a clear reference image and write a specific prompt for the best result. Mention the subject, the change you want, and the desired style or mood.
                    </p>
                  </div>
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

    {/*Danhsach*/}
    <div className="flex-1 flex gap-10 overflow-hidden">
      
      {/* SESSIONS */}
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
          <div className="absolute inset-0 bg-black/15 backdrop-blur-[2px]" onClick={() => setIsSettingsOpen(false)}></div>
          <div className="absolute top-20 right-8 w-[400px] bg-[linear-gradient(180deg,rgba(37,43,62,0.86),rgba(20,23,34,0.92))] rounded-[2.5rem] shadow-[0_0_40px_rgba(34,211,238,0.18),0_20px_70px_rgba(0,0,0,0.5)] border border-cyan-300/25 p-6 animate-in slide-in-from-top-2 duration-300 backdrop-blur-2xl">
            <div className="absolute inset-0 rounded-[2.5rem] bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),transparent_30%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.12),transparent_24%)] pointer-events-none"></div>
            <div className="relative z-10 flex justify-end mb-2"><X size={20} className="text-gray-500 cursor-pointer hover:text-white transition-all" onClick={()=>setIsSettingsOpen(false)}/></div>
            <div className="relative z-10 text-center pb-6 border-b border-white/10">
              <p className="text-[11px] text-gray-400 font-medium mb-4 tracking-widest truncate px-4">{currentUser?.email}</p>
              <div className="w-24 h-24 bg-blue-600 rounded-full mx-auto flex items-center justify-center text-3xl font-black border-4 border-cyan-300/30 mb-4 shadow-[0_0_30px_rgba(56,189,248,0.25)] overflow-hidden">
                {currentUser?.avatar ? <img src={currentUser.avatar} className="w-full h-full object-cover" alt={currentUser?.name || 'User avatar'} /> : currentUser?.name?.slice(0,1)}
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">Welcome {displayFirstName},</h2>
              <button onClick={() => setAppNotice('This feature is currently being updated.')} className="mt-4 px-6 py-3 rounded-full border border-cyan-300/20 bg-blue-500/10 text-[10px] font-bold uppercase tracking-widest hover:bg-blue-500/20 transition-all text-cyan-100 shadow-[0_0_20px_rgba(56,189,248,0.12)]">Manage your Lab account</button>
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
              <div onClick={() => setAppNotice('This feature is currently being updated.')} className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl cursor-pointer group transition-all bg-white/6 border border-white/10"><div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-white/10 text-blue-400"><Sparkles size={18}/></div><div><p className="text-sm font-bold text-white">AI Model</p><p className="text-[10px] text-gray-500 italic uppercase">Flux.1-Schnell</p></div></div>
              <div className="pt-1">
                <p className="text-center text-[11px] text-gray-400 mb-3">Or sign in with social media</p>
                <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin, queryParams: { prompt: 'select_account' } } })} className="w-full bg-white text-black h-12 rounded-[1rem] font-black uppercase flex items-center justify-center gap-3 active:scale-95 transition-all shadow-2xl hover:bg-gray-100 text-[12px] tracking-wide">
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" />
                  Sign In with Google
                </button>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10"><div onClick={handleLogout} className="flex items-center justify-center gap-3 p-4 hover:bg-red-500/10 rounded-2xl cursor-pointer text-gray-400 hover:text-red-400 transition-all"><LogOut size={18}/><span className="text-xs font-black uppercase tracking-widest">Sign out of Lab</span></div></div>
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
    <div onClick={onClick} className={`flex items-center gap-6 px-8 py-6 rounded-[2rem] cursor-pointer transition-all border ${active ? 'bg-[linear-gradient(90deg,#d7fbff,#7dd3fc)] text-slate-950 shadow-[0_0_28px_rgba(103,232,249,0.34)] border-cyan-200/40 scale-[1.01]' : 'text-gray-500 border-transparent hover:bg-white/5 hover:text-white'}`}>
      {icon} <span className={`text-[11px] uppercase tracking-[0.2em] ${active ? 'font-black' : 'font-bold'}`}>{label}</span>
    </div>
  );
}

export default App;

