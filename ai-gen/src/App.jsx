import ConfigTab from './components/engine-config/ConfigTab';
import HistoryTab from './components/history-edit/HistoryTab';
import HomeDashboard from './components/home-dashboard/HomeDashboard';
import AppNoticeBanner from './components/layout/AppNoticeBanner';
import DashboardHeader from './components/layout/DashboardHeader';
import DashboardSidebar from './components/layout/DashboardSidebar';
import LoginScreen from './components/login/LoginScreen';
import SettingsPopover from './components/settings/SettingsPopover';
import useAuthFeature from './features/auth/useAuthFeature';
import useWorkspaceFeature from './features/workspace/useWorkspaceFeature';

function App() {
  const workspace = useWorkspaceFeature();
  const auth = useAuthFeature({
    fetchHistory: workspace.fetchHistory,
    setAppNotice: workspace.setAppNotice,
    setIsSettingsOpen: workspace.setIsSettingsOpen,
  });

  const handleGenerateImage = () => workspace.generateImage(auth.currentUser?.email);
  const openHistoryTab = () => workspace.openHistoryTab(auth.currentUser?.email);

  if (!auth.isLoggedIn) {
    return (
      <LoginScreen
        authError={auth.authError}
        authSuccess={auth.authSuccess}
        closeResetPasswordModal={auth.closeResetPasswordModal}
        displayFilterStyle={workspace.displayFilterStyle}
        email={auth.email}
        fullname={auth.fullname}
        handleForgotPassword={auth.handleForgotPassword}
        handleManualAuth={auth.handleManualAuth}
        handleResetPasswordSubmit={auth.handleResetPasswordSubmit}
        isRecoveryMode={auth.isRecoveryMode}
        isRegistering={auth.isRegistering}
        isResetPasswordOpen={auth.isResetPasswordOpen}
        onGoogleSignIn={auth.handleGoogleSignIn}
        password={auth.password}
        rememberMe={auth.rememberMe}
        resetEmail={auth.resetEmail}
        resetNewPassword={auth.resetNewPassword}
        setEmail={auth.setEmail}
        setFullname={auth.setFullname}
        setIsRegistering={auth.setIsRegistering}
        setPassword={auth.setPassword}
        setRememberMe={auth.setRememberMe}
        setResetEmail={auth.setResetEmail}
        setResetNewPassword={auth.setResetNewPassword}
      />
    );
  }

  return (
    <div
      className="flex h-screen bg-[radial-gradient(circle_at_bottom_left,_rgba(0,163,255,0.15),_transparent_26%),radial-gradient(circle_at_bottom_center,_rgba(255,0,128,0.12),_transparent_22%),linear-gradient(180deg,#0a0c14_0%,#090b12_100%)] text-white overflow-hidden font-sans relative transition-all duration-300"
      style={workspace.displayFilterStyle}
    >
      <DashboardSidebar
        activeTab={workspace.activeTab}
        currentUser={auth.currentUser}
        onConfigClick={() => workspace.setActiveTab('config')}
        onHistoryClick={openHistoryTab}
        onHomeClick={workspace.startNewProject}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden bg-transparent">
        <DashboardHeader
          activeTab={workspace.activeTab}
          brightness={workspace.brightness}
          decreaseBrightness={workspace.decreaseBrightness}
          increaseBrightness={workspace.increaseBrightness}
          isSettingsOpen={workspace.isSettingsOpen}
          setIsSettingsOpen={workspace.setIsSettingsOpen}
        />

        <div className="flex-1 p-10 overflow-y-auto pb-40 custom-scrollbar">
          <AppNoticeBanner appNotice={workspace.appNotice} onClose={() => workspace.setAppNotice('')} />

          {workspace.activeTab === 'home' && (
            <HomeDashboard
              fileInputRef={workspace.fileInputRef}
              generateImage={handleGenerateImage}
              handleDownload={workspace.handleDownload}
              handleReferenceFileChange={workspace.handleReferenceFileChange}
              imageCaption={workspace.imageCaption}
              loading={workspace.loading}
              loadingElapsedSeconds={workspace.loadingElapsedSeconds}
              prompt={workspace.prompt}
              promptSuggestion={workspace.promptSuggestion}
              referencePreview={workspace.referencePreview}
              result={workspace.result}
              setPrompt={workspace.setPrompt}
              suggestingPrompt={workspace.suggestingPrompt}
            />
          )}

          {workspace.activeTab === 'history' && (
            <HistoryTab
              currentUser={auth.currentUser}
              fetchHistory={workspace.fetchHistory}
              historyItems={workspace.historyItems}
              loadHistoryItem={workspace.loadHistoryItem}
              prompt={workspace.prompt}
              result={workspace.result}
              selectedHistoryItem={workspace.selectedHistoryItem}
            />
          )}

          {workspace.activeTab === 'config' && <ConfigTab />}
        </div>
      </main>

      {workspace.isSettingsOpen && (
        <SettingsPopover
          brightness={workspace.brightness}
          currentUser={auth.currentUser}
          displayFirstName={auth.displayFirstName}
          handleLogout={auth.handleLogout}
          onClose={() => workspace.setIsSettingsOpen(false)}
          onGoogleSignIn={auth.handleGoogleSignIn}
          resetBrightness={workspace.resetBrightness}
          setAppNotice={workspace.setAppNotice}
          setBrightness={workspace.setBrightness}
        />
      )}
    </div>
  );
}

export default App;
