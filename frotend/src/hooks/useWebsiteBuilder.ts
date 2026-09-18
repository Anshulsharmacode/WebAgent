import { useState, useMemo } from 'react';
import { buildWebsite, chatWebsite, stopWebsite } from '../api/website';
import type { BuildWebsiteResponse, ChatWebsiteResponse, ProjectType } from '../types/website';

export type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type UseWebsiteBuilderOptions = {
  apiKey: string;
  modelName: string;
};

export function useWebsiteBuilder({ apiKey, modelName }: UseWebsiteBuilderOptions) {
  const [prompt, setPrompt] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('react');

  const [applyChanges, setApplyChanges] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [buildResult, setBuildResult] = useState<BuildWebsiteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Ready');

  const siteUrl = buildResult?.site_url;
  const projectDir = buildResult?.project_dir;
  const files = buildResult?.files ?? [];

  const metadata = useMemo(() => {
    if (!buildResult) return [];
    return [
      ['Type', buildResult.project_type],
      ['Port', String(buildResult.host_port)],
      ['Container', buildResult.container_name],
      ['Model', modelName],
    ];
  }, [buildResult, modelName]);

  async function handleBuild() {
    if (!prompt.trim()) return;

    setLoading(true);
    setStatus('Generating website...');
    try {
      const result = await buildWebsite({
        prompt: prompt.trim(),
        project_name: projectName.trim() || undefined,
        project_type: projectType,
        model_name: modelName,
        api_key: apiKey.trim() || undefined,
      });
      console.log('Build result:', result);
      setBuildResult(result);
      setMessages([]);
      setStatus('Website generated successfully.');
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error('Build error:', errorMessage);
      setStatus(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  function applyChatResponse(response: ChatWebsiteResponse) {
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: response.answer },
    ]);

    if (!buildResult) return;

    const nextBuild: BuildWebsiteResponse = {
      ...buildResult,
      container_id: response.container_id ?? buildResult.container_id,
      container_name: response.container_name ?? buildResult.container_name,
      host_port: response.host_port ?? buildResult.host_port,
      image_tag: response.image_tag ?? buildResult.image_tag,
      site_url: response.site_url ?? buildResult.site_url,
      project_type: response.project_type ?? buildResult.project_type,
      files: response.generated_files
        ? Object.keys(response.generated_files)
        : buildResult.files,
      generated_files: response.generated_files ?? buildResult.generated_files,
    };

    setBuildResult(nextBuild);
    if (response.changes_applied) {
      setStatus(response.change_summary || 'Changes applied.');
      return;
    }
    setStatus('Ready');
  }

  async function handleSend() {
    if (!buildResult || !messageInput.trim()) return;

    const currentMessage = messageInput.trim();
    setLoading(true);
    setMessageInput('');
    setMessages((prev) => [...prev, { role: 'user', content: currentMessage }]);
    setStatus(applyChanges ? 'Applying changes...' : 'Thinking...');

    try {
      const response = await chatWebsite({
        site_url: buildResult.site_url,
        message: currentMessage,
        apply_changes: applyChanges,
        project_dir: buildResult.project_dir,
        project_name:
          buildResult.plan?.name ?? (projectName.trim() || undefined),
        container_name: buildResult.container_name,
        project_type: buildResult.project_type,
        model_name: modelName,
        api_key: apiKey.trim() || undefined,
      });

      applyChatResponse(response);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: (error as Error).message },
      ]);
      setStatus((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStop() {
    if (!buildResult) return;
    setLoading(true);
    setStatus('Stopping...');
    try {
      await stopWebsite({
        container_name: buildResult.container_name,
      });
      setStatus('Stopped.');
      setBuildResult(null);
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return {
    prompt,
    setPrompt,
    projectName,
    setProjectName,
    projectType,
    setProjectType,
    applyChanges,
    setApplyChanges,
    messageInput,
    setMessageInput,
    messages,
    buildResult,
    loading,
    status,
    siteUrl,
    projectDir,
    files,
    metadata,
    handleBuild,
    handleSend,
    handleStop,
  };
}
