import { AlertCircle, Lock, Mail, ShieldCheck, User } from 'lucide-react';

import ResetPasswordModal from './ResetPasswordModal';

function LoginScreen({
  authError,
  authSuccess,
  closeResetPasswordModal,
  displayFilterStyle,
  email,
  fullname,
  handleForgotPassword,
  handleManualAuth,
  handleResetPasswordSubmit,
  isRecoveryMode,
  isRegistering,
  isResetPasswordOpen,
  onGoogleSignIn,
  password,
  rememberMe,
  resetEmail,
  resetNewPassword,
  setEmail,
  setFullname,
  setIsRegistering,
  setPassword,
  setRememberMe,
  setResetEmail,
  setResetNewPassword,
}) {
  return (
    <>
      <div className="min-h-screen w-full bg-[#050505] font-sans relative overflow-y-auto transition-all duration-300" style={displayFilterStyle}>
        <div className="w-full min-h-screen bg-[#0b0b0d] flex">
          <div className="hidden lg:flex w-1/2 bg-black relative">
            <img src="https://cdn.sforum.vn/sforum/wp-content/uploads/2023/07/hinh-nen-ai-76.jpg" className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105" alt="Lab Art" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0d] via-transparent to-transparent"></div>
            <div className="relative z-10 p-24 mt-auto">
              <h2 className="text-7xl font-black text-white italic uppercase leading-none tracking-tighter">
                Future <br /> AI Vision
              </h2>
              <p className="text-blue-500 font-bold mt-6 tracking-[0.3em] uppercase text-xs italic">
                Next-gen image processing lab
              </p>
            </div>
          </div>
          <div className="w-full lg:w-1/2 min-h-screen px-6 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-8 flex flex-col justify-center bg-[#0d0d11] overflow-y-auto">
            <div className="w-full max-w-[520px] mx-auto">
              <header className={isRegistering ? 'mb-6 lg:mb-8' : 'mb-8 lg:mb-10'}>
                <span className="text-blue-400 font-black text-[10px] lg:text-[11px] uppercase tracking-[0.4em] mb-3 block italic">
                  System Authorization
                </span>
                <h1 className={`${isRegistering ? 'text-[clamp(2.8rem,5.8vh,4.5rem)]' : 'text-[clamp(3.25rem,7vh,5.25rem)]'} font-black text-white uppercase tracking-tighter italic leading-[0.92]`}>
                  {isRegistering ? 'CREATE' : 'SIGN IN'}
                </h1>
              </header>
              {authSuccess && (
                <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-xs flex items-center gap-3">
                  <ShieldCheck size={14} /> {authSuccess}
                </div>
              )}
              {authError && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs flex items-center gap-3">
                  <AlertCircle size={14} /> {authError}
                </div>
              )}
              <form onSubmit={handleManualAuth} className={isRegistering ? 'space-y-4 lg:space-y-5' : 'space-y-5 lg:space-y-6'}>
                {isRegistering && (
                  <div className="space-y-2">
                    <label className="text-[15px] lg:text-[16px] font-black text-gray-300 uppercase tracking-wide">Full Name</label>
                    <div className="flex min-h-[56px] items-center gap-3 rounded-[1.05rem] bg-[#1a1b23] border border-white/5 px-4 py-3 transition-all focus-within:border-blue-500/70 focus-within:shadow-[0_0_0_1px_rgba(59,130,246,0.5),0_0_24px_rgba(59,130,246,0.2)]">
                      <input type="text" required placeholder="Your full name" className="flex-1 bg-transparent text-[15px] lg:text-[16px] text-white outline-none placeholder:text-gray-500" value={fullname} onChange={(e) => setFullname(e.target.value)} />
                      <User size={18} className="text-blue-300/80 shrink-0" />
                    </div>
                  </div>
                )}
                <div className={isRegistering ? 'space-y-2' : 'space-y-3'}>
                  <label className="text-[16px] lg:text-[18px] font-black text-gray-300 uppercase tracking-wide">Email Address</label>
                  <div className={`flex ${isRegistering ? 'min-h-[56px]' : 'min-h-[60px]'} items-center gap-3 rounded-[1.05rem] bg-[#1a1b23] border border-blue-400/30 px-4 py-3 shadow-[0_0_0_1px_rgba(96,165,250,0.28),0_0_18px_rgba(56,189,248,0.18)] transition-all focus-within:border-cyan-300/80 focus-within:shadow-[0_0_0_1px_rgba(96,165,250,0.5),0_0_28px_rgba(56,189,248,0.28)]`}>
                    <input type="email" required placeholder="name@email.com" className="flex-1 bg-transparent text-[15px] lg:text-[16px] text-white outline-none placeholder:text-gray-500" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <Mail size={18} className="text-blue-300/80 shrink-0" />
                  </div>
                </div>
                <div className={isRegistering ? 'space-y-2' : 'space-y-3'}>
                  <label className="text-[16px] lg:text-[18px] font-black text-gray-300 uppercase tracking-wide">Password</label>
                  <div className={`flex ${isRegistering ? 'min-h-[56px]' : 'min-h-[60px]'} items-center gap-3 rounded-[1.05rem] bg-[#1a1b23] border border-blue-400/30 px-4 py-3 shadow-[0_0_0_1px_rgba(96,165,250,0.28),0_0_18px_rgba(56,189,248,0.18)] transition-all focus-within:border-cyan-300/80 focus-within:shadow-[0_0_0_1px_rgba(96,165,250,0.5),0_0_28px_rgba(56,189,248,0.28)]`}>
                    <input type="password" required placeholder="Password" className="flex-1 bg-transparent text-[15px] lg:text-[16px] text-white outline-none placeholder:text-gray-500" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <Lock size={18} className="text-blue-300/80 shrink-0" />
                  </div>
                </div>
                <div className="w-full flex items-center justify-between text-[13px] lg:text-[14px]">
                  <label className="flex items-center gap-3 text-gray-400 cursor-pointer select-none">
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 rounded border border-white/15 bg-white/5 accent-blue-500" />
                    <span>Remember Me</span>
                  </label>
                  <button type="button" onClick={handleForgotPassword} className="text-gray-500 hover:text-gray-300 transition-all underline underline-offset-4 decoration-white/10">
                    Forgot Password?
                  </button>
                </div>
                <button className={`w-full bg-[linear-gradient(90deg,#1a188f_0%,#1d4dff_38%,#27a2ff_100%)] hover:brightness-110 ${isRegistering ? 'py-4' : 'py-5'} rounded-[1.05rem] font-black uppercase text-white active:scale-[0.98] transition-all shadow-[0_0_0_1px_rgba(96,165,250,0.45),0_12px_30px_rgba(37,99,235,0.45),inset_0_1px_0_rgba(255,255,255,0.12)] mt-1 tracking-wide ${isRegistering ? 'text-[13px]' : 'text-[14px]'} border border-blue-300/20`}>
                  {isRegistering ? 'Create Account' : 'Account Login'}
                </button>
              </form>
              <div className={isRegistering ? 'mt-4' : 'mt-6'}>
                <p className="text-center text-gray-400 text-[14px] lg:text-[15px]">Or sign in with social media</p>
                <div className={isRegistering ? 'mt-3' : 'mt-4'}>
                  <button onClick={onGoogleSignIn} className={`w-full bg-white text-black ${isRegistering ? 'h-11' : 'h-14'} rounded-[1rem] font-black uppercase flex items-center justify-center gap-3 active:scale-95 transition-all shadow-2xl hover:bg-gray-100 ${isRegistering ? 'text-[12px]' : 'text-[13px]'} tracking-wide`}>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" />
                    Continue with Google
                  </button>
                </div>
              </div>
              <div className={`${isRegistering ? 'mt-4 gap-2.5' : 'mt-6 gap-3'} flex flex-col items-center text-[13px] lg:text-[14px]`}>
                <button onClick={() => setIsRegistering(!isRegistering)} className="text-gray-400 uppercase font-bold hover:text-blue-400 transition-all underline underline-offset-8 decoration-2 decoration-white/30">
                  {isRegistering ? 'Back to Login' : 'Create an account'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <ResetPasswordModal
          handleResetPasswordSubmit={handleResetPasswordSubmit}
          isRecoveryMode={isRecoveryMode}
          isResetPasswordOpen={isResetPasswordOpen}
          onClose={closeResetPasswordModal}
          resetEmail={resetEmail}
          resetNewPassword={resetNewPassword}
          setResetEmail={setResetEmail}
          setResetNewPassword={setResetNewPassword}
        />
      </div>
    </>
  );
}

export default LoginScreen;
