import { Lock, Mail, X } from 'lucide-react';

function ResetPasswordModal({
  handleResetPasswordSubmit,
  isRecoveryMode,
  isResetPasswordOpen,
  onClose,
  resetEmail,
  resetNewPassword,
  setResetEmail,
  setResetNewPassword,
}) {
  if (!isResetPasswordOpen) return null;

  return (
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
            onClick={onClose}
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
              onClick={onClose}
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
  );
}

export default ResetPasswordModal;
