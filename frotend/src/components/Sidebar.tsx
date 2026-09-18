import type { ProjectType } from "../types/website";
import { BuildForm } from "./BuildForm";
import { ProjectFiles } from "./ProjectFiles";
import { SessionDetails } from "./SessionDetails";

type SidebarProps = {
  prompt: string;
  projectName: string;
  projectType: ProjectType;
  modelName: string;
  apiKey: string;
  loading: boolean;
  canStop: boolean;
  metadata: string[][];
  files: string[];
  onPromptChange: (val: string) => void;
  onProjectNameChange: (val: string) => void;
  onProjectTypeChange: (val: ProjectType) => void;
  onModelNameChange: (val: string) => void;
  onApiKeyChange: (val: string) => void;
  onBuild: () => void;
  onStop: () => void;
};

export function Sidebar({
  prompt,
  projectName,
  projectType,
  modelName,
  apiKey,
  loading,
  canStop,
  metadata,
  files,
  onPromptChange,
  onProjectNameChange,
  onProjectTypeChange,
  onModelNameChange,
  onApiKeyChange,
  onBuild,
  onStop,
}: SidebarProps) {
  return (
    <aside
      className="
        flex
        h-full
        w-full
        shrink-0
        flex-col
        overflow-y-auto
        border-border
        bg-card/25
        divide-y divide-border/60
        lg:w-[380px]
        xl:w-[420px]
        lg:border-r
      "
    >
      {/* Generator Form */}
      <BuildForm
        prompt={prompt}
        projectName={projectName}
        projectType={projectType}
        modelName={modelName}
        apiKey={apiKey}
        loading={loading}
        canStop={canStop}
        onPromptChange={onPromptChange}
        onProjectNameChange={onProjectNameChange}
        onProjectTypeChange={onProjectTypeChange}
        onModelNameChange={onModelNameChange}
        onApiKeyChange={onApiKeyChange}
        onBuild={onBuild}
        onStop={onStop}
      />

      {/* Session Details */}
      <SessionDetails metadata={metadata} />

      {/* Project Files */}
      <ProjectFiles files={files} />
    </aside>
  );
}
