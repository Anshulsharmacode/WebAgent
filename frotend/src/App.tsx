import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { PreviewPane } from "./components/PreviewPane";
import { ChatPanel } from "./components/ChatPanel";
import { SettingsModal } from "./components/SettingsModal";
import { AuthScreen } from "./components/AuthScreen";
import { useModal } from "./hooks/useModal";
import { useSettings } from "./hooks/useSettings";
import { useWebsiteBuilder } from "./hooks/useWebsiteBuilder";

function App() {
  const { isLoggedIn, apiKey, setApiKey, modelName, setModelName } =
    useSettings();
  const settingsModal = useModal(false);

  const {
    prompt,
    setPrompt,
    projectName,
    setProjectName,
    projectType,
    setProjectType,
    messageInput,
    setMessageInput,
    messages,
    buildResult,
    loading,
    status,
    streamingCode,
    streamingFiles,
    siteUrl,
    projectDir,
    files,
    metadata,
    handleBuild,
    handleSend,
    handleStop,
  } = useWebsiteBuilder({ apiKey, modelName });

  if (!isLoggedIn) {
    return <AuthScreen />;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground font-sans overflow-hidden">
      {/* Top Navigation Header */}
      <Header
        status={status}
        loading={loading}
        onOpenSettings={settingsModal.open}
      />

      {/* Main Responsive Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          prompt={prompt}
          projectName={projectName}
          projectType={projectType}
          modelName={modelName}
          apiKey={apiKey}
          loading={loading}
          canStop={Boolean(buildResult)}
          metadata={metadata}
          files={files}
          onPromptChange={setPrompt}
          onProjectNameChange={setProjectName}
          onProjectTypeChange={setProjectType}
          onModelNameChange={setModelName}
          onApiKeyChange={setApiKey}
          onBuild={handleBuild}
          onStop={handleStop}
        />

        {/* Right Preview & Assistant Pane */}
        <main className="flex-1 flex flex-col overflow-hidden bg-background">
          <PreviewPane
            siteUrl={siteUrl}
            projectDir={projectDir}
            loading={loading}
            status={status}
            streamingCode={streamingCode}
            streamingFiles={streamingFiles}
          />
          <ChatPanel
            messages={messages}
            messageInput={messageInput}
            loading={loading}
            canSend={Boolean(buildResult && messageInput.trim())}
            streamingCode={streamingCode}
            onMessageInputChange={setMessageInput}
            onSend={handleSend}
          />
        </main>
      </div>

      {/* Account & Settings Modal */}
      <SettingsModal
        isOpen={settingsModal.isOpen}
        onClose={settingsModal.close}
      />
    </div>
  );
}

export default App;
