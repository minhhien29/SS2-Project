import { useEffect, useState } from 'react';

import {
  API_BASE_URL,
  APP_BASE_URL,
  REMEMBERED_EMAIL_STORAGE_KEY,
  REMEMBERED_USER_STORAGE_KEY,
  REMEMBER_ME_STORAGE_KEY,
} from '../../config/appConfig';
import supabase from '../../config/supabaseClient';

function useAuthFeature({ fetchHistory, setAppNotice, setIsSettingsOpen }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
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
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  const isPasswordRecoveryPath = () =>
    typeof window !== 'undefined' && window.location.pathname === '/reset-password';

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

  const openRecoveryModal = (userEmail = '') => {
    setIsRecoveryMode(true);
    setIsResetPasswordOpen(true);
    setResetNewPassword('');
    if (userEmail) setResetEmail(userEmail);
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  const closeResetPasswordModal = () => {
    setIsResetPasswordOpen(false);
    setIsRecoveryMode(false);
  };

  const handleGoogleSignIn = () => {
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { prompt: 'select_account' },
      },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsSettingsOpen(false);
    setIsLoggedIn(false);
    window.localStorage.removeItem(REMEMBERED_USER_STORAGE_KEY);
    window.location.reload();
  };

  const handleManualAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setAuthError('Invalid email format (Example: name@email.com)');
      return;
    }

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
            user_metadata: { full_name: data.fullname },
          });
        }
      } else {
        setAuthError(data.detail || 'Invalid email or password!');
      }
    } catch {
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
    } catch {
      setAuthError(
        isRecoveryMode
          ? 'Unable to update your password right now.'
          : 'Unable to reset your password right now.'
      );
    }
  };

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
      } catch {
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
      } catch {
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
      } catch {
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
  }, [setAppNotice]);

  useEffect(() => {
    window.localStorage.setItem(REMEMBER_ME_STORAGE_KEY, String(rememberMe));

    if (rememberMe && email.trim()) {
      window.localStorage.setItem(REMEMBERED_EMAIL_STORAGE_KEY, email.trim());
    } else if (!rememberMe) {
      window.localStorage.removeItem(REMEMBERED_EMAIL_STORAGE_KEY);
      window.localStorage.removeItem(REMEMBERED_USER_STORAGE_KEY);
    }
  }, [rememberMe, email]);

  const displayFirstName = currentUser?.name?.trim()?.split(/\s+/).slice(-1)[0] || 'Developer';

  return {
    authError,
    authSuccess,
    closeResetPasswordModal,
    currentUser,
    displayFirstName,
    email,
    fullname,
    handleForgotPassword,
    handleGoogleSignIn,
    handleLogout,
    handleManualAuth,
    handleResetPasswordSubmit,
    isLoggedIn,
    isRecoveryMode,
    isRegistering,
    isResetPasswordOpen,
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
  };
}

export default useAuthFeature;
