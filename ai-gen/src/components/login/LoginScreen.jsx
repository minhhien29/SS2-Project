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
  const headerSpacingClass = isRegistering ? 'mb-[clamp(1.25rem,2.8vh,2rem)]' : 'mb-[clamp(1.75rem,3.6vh,2.5rem)]';
  const formSpacingClass = isRegistering ? 'space-y-[clamp(0.95rem,2vh,1.2rem)]' : 'space-y-[clamp(1rem,2.2vh,1.35rem)]';
  const fieldBlockSpacingClass = isRegistering ? 'space-y-2' : 'space-y-2.5';
  const fieldHeightClass = isRegistering ? 'min-h-[54px]' : 'min-h-[58px]';
  const actionButtonHeightClass = isRegistering ? 'h-[54px]' : 'h-[58px]';
  const socialSpacingClass = isRegistering ? 'mt-[clamp(1rem,2.4vh,1.25rem)]' : 'mt-[clamp(1.25rem,2.8vh,1.75rem)]';
  const footerSpacingClass = isRegistering ? 'mt-[clamp(1rem,2.2vh,1.25rem)]' : 'mt-[clamp(1.25rem,2.8vh,1.75rem)]';

  return (
    <>
      <div className="min-h-screen w-full bg-[#050505] font-sans relative overflow-y-auto transition-all duration-300" style={displayFilterStyle}>
        <div className="w-full min-h-screen bg-[#0b0b0d] flex">
          <div className="hidden xl:flex w-[46%] bg-black relative">
            <img src="https://cdn.sforum.vn/sforum/wp-content/uploads/2023/07/hinh-nen-ai-76.jpg" className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105" alt="Lab Art" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0d] via-transparent to-transparent"></div>
            <div className="relative z-10 mt-auto p-[clamp(2.5rem,5vw,6rem)]">
              <h2 className="text-7xl font-black text-white italic uppercase leading-none tracking-tighter">
                Future <br /> AI Vision
              </h2>
              <p className="text-blue-500 font-bold mt-6 tracking-[0.3em] uppercase text-xs italic">
                Next-gen image processing lab
              </p>
            </div>
          </div>
          <div className="w-full xl:w-[54%] min-h-screen px-[clamp(1.25rem,4vw,4rem)] py-[clamp(1.5rem,4vh,3rem)] flex flex-col justify-center bg-[#0d0d11] overflow-y-auto">
            <div className="w-full max-w-[34rem] mx-auto">
              <header className={headerSpacingClass}>
                <span className="mb-3 block text-[clamp(0.62rem,0.9vw,0.72rem)] font-black uppercase italic tracking-[0.36em] text-blue-400">
                  System Authorization
                </span>
                <h1 className={`${isRegistering ? 'text-[clamp(2.75rem,7vw,4.6rem)]' : 'text-[clamp(3rem,8vw,5rem)]'} font-black text-white uppercase tracking-[-0.05em] italic leading-[0.92]`}>
                  {isRegistering ? 'CREATE' : 'SIGN IN'}
                </h1>
              </header>
              {authSuccess && (
                <div className="mb-4 flex items-center gap-3 rounded-[1.35rem] border border-green-500/20 bg-green-500/10 px-4 py-4 text-[13px] leading-6 text-green-400">
                  <ShieldCheck size={14} /> {authSuccess}
                </div>
              )}
              {authError && (
                <div className="mb-4 flex items-center gap-3 rounded-[1.35rem] border border-red-500/20 bg-red-500/10 px-4 py-4 text-[13px] leading-6 text-red-400">
                  <AlertCircle size={14} /> {authError}
                </div>
              )}
              <form onSubmit={handleManualAuth} className={formSpacingClass}>
                {isRegistering && (
                  <div className="space-y-2">
                    <label className="text-[clamp(0.92rem,1.3vw,1rem)] font-black uppercase tracking-wide text-gray-300">Full Name</label>
                    <div className="flex min-h-[54px] items-center gap-3 rounded-[1.05rem] border border-white/5 bg-[#1a1b23] px-4 py-3 transition-all focus-within:border-blue-500/70 focus-within:shadow-[0_0_0_1px_rgba(59,130,246,0.5),0_0_24px_rgba(59,130,246,0.2)]">
                      <input type="text" required placeholder="Your full name" className="flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-gray-500" value={fullname} onChange={(e) => setFullname(e.target.value)} />
                      <User size={18} className="text-blue-300/80 shrink-0" />
                    </div>
                  </div>
                )}
                <div className={fieldBlockSpacingClass}>
                  <label className="text-[clamp(1rem,1.55vw,1.08rem)] font-black uppercase tracking-wide text-gray-300">Email Address</label>
                  <div className={`flex ${fieldHeightClass} items-center gap-3 rounded-[1.05rem] border border-blue-400/30 bg-[#1a1b23] px-4 py-3 shadow-[0_0_0_1px_rgba(96,165,250,0.28),0_0_18px_rgba(56,189,248,0.18)] transition-all focus-within:border-cyan-300/80 focus-within:shadow-[0_0_0_1px_rgba(96,165,250,0.5),0_0_28px_rgba(56,189,248,0.28)]`}>
                    <input type="email" required placeholder="name@email.com" className="flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-gray-500" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <Mail size={18} className="text-blue-300/80 shrink-0" />
                  </div>
                </div>
                <div className={fieldBlockSpacingClass}>
                  <label className="text-[clamp(1rem,1.55vw,1.08rem)] font-black uppercase tracking-wide text-gray-300">Password</label>
                  <div className={`flex ${fieldHeightClass} items-center gap-3 rounded-[1.05rem] border border-blue-400/30 bg-[#1a1b23] px-4 py-3 shadow-[0_0_0_1px_rgba(96,165,250,0.28),0_0_18px_rgba(56,189,248,0.18)] transition-all focus-within:border-cyan-300/80 focus-within:shadow-[0_0_0_1px_rgba(96,165,250,0.5),0_0_28px_rgba(56,189,248,0.28)]`}>
                    <input type="password" required placeholder="Password" className="flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-gray-500" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <Lock size={18} className="text-blue-300/80 shrink-0" />
                  </div>
                </div>
                <div className="flex w-full flex-col gap-3 text-[13px] text-gray-400 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex items-center gap-3 text-gray-400 cursor-pointer select-none">
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 rounded border border-white/15 bg-white/5 accent-blue-500" />
                    <span>Remember Me</span>
                  </label>
                  <button type="button" onClick={handleForgotPassword} className="self-start text-gray-500 underline decoration-white/10 underline-offset-4 transition-all hover:text-gray-300 sm:self-auto">
                    Forgot Password?
                  </button>
                </div>
                <button className={`mt-1 w-full ${actionButtonHeightClass} rounded-[1.05rem] border border-blue-300/20 bg-[linear-gradient(90deg,#1a188f_0%,#1d4dff_38%,#27a2ff_100%)] text-[13px] font-black uppercase tracking-wide text-white shadow-[0_0_0_1px_rgba(96,165,250,0.45),0_12px_30px_rgba(37,99,235,0.45),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all hover:brightness-110 active:scale-[0.98]`}>
                  {isRegistering ? 'Create Account' : 'Account Login'}
                </button>
              </form>
              <div className={socialSpacingClass}>
                <p className="text-center text-[14px] text-gray-400">Or sign in with social media</p>
                <div className="mt-4">
                  <button onClick={onGoogleSignIn} className={`flex w-full items-center justify-center gap-3 rounded-[1rem] bg-white text-black ${isRegistering ? 'h-[50px]' : 'h-[54px]'} text-[12px] font-black uppercase tracking-wide shadow-2xl transition-all hover:bg-gray-100 active:scale-95`}>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" />
                    Continue with Google
                  </button>
                </div>
              </div>
              <div className={`${footerSpacingClass} flex flex-col items-center gap-3 text-[13px]`}>
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
