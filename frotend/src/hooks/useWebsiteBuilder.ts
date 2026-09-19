import { useState, useMemo, useRef } from 'react';
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
  const [streamingCode, setStreamingCode] = useState('');
  const socketRef = useRef<WebSocket | null>(null);

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

  function applyChatResponse(response: ChatWebsiteResponse) {
    setMessages((prev) => {
      // If live streaming assistant message was already appended, avoid duplicate message
      if (prev.length > 0 && prev[prev.length - 1].role === 'assistant') {
        const last = prev[prev.length - 1];
        if (!last.content || last.content !== response.answer) {
          return [...prev.slice(0, -1), { role: 'assistant', content: response.answer }];
        }
        return prev;
      }
      return [...prev, { role: 'assistant', content: response.answer }];
    });

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

  function runWebSocketTask(
    payload: any,
    onComplete: (data: any) => void,
    onFallback: () => Promise<void>
  ) {
    setStreamingCode('');
    let ws: WebSocket;
    let fallbackTriggered = false;

    const triggerFallback = async () => {
      if (fallbackTriggered) return;
      fallbackTriggered = true;
      console.warn('WebSocket failed or unavailable, falling back to HTTP...');
      await onFallback();
    };

    try {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.port ? `${window.location.hostname}:8000` : window.location.host;
      ws = new WebSocket(`${wsProtocol}//${host}/ws/llm/stream/`);
      socketRef.current = ws;
    } catch {
      triggerFallback();
      return;
    }

    ws.onopen = () => {
      ws.send(JSON.stringify(payload));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'status') {
          setStatus(data.message);
        } else if (data.type === 'chunk') {
          setStreamingCode((prev) => prev + data.content);
          if (data.target === 'chat') {
            setMessages((prev) => {
              if (prev.length === 0 || prev[prev.length - 1].role !== 'assistant') {
                return [...prev, { role: 'assistant', content: data.content }];
              }
              const last = prev[prev.length - 1];
              return [
                ...prev.slice(0, -1),
                { ...last, content: last.content + data.content },
              ];
            });
          }
        } else if (data.type === 'complete') {
          onComplete(data.result);
          setLoading(false);
          ws.close();
        } else if (data.type === 'error') {
          setStatus(`Error: ${data.message}`);
          setLoading(false);
          ws.close();
        }
      } catch (err) {
        console.error('WS parse error', err);
      }
    };

    ws.onerror = () => {
      ws.close();
      triggerFallback();
    };
  }

  async function handleBuild() {
    if (!prompt.trim()) return;

    setLoading(true);
    setStatus('Connecting WebSocket...');

    const payload = {
      action: 'build',
      prompt: prompt.trim(),
      project_name: projectName.trim() || undefined,
      project_type: projectType,
      model_name: modelName,
      api_key: apiKey.trim() || undefined,
    };

    const httpFallback = async () => {
      setStatus('Generating website (HTTP)...');
      try {
        const result = await buildWebsite(payload);
        setBuildResult(result);
        setMessages([]);
        setStatus('Website generated successfully.');
      } catch (error) {
        setStatus((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    runWebSocketTask(
      payload,
      (result: BuildWebsiteResponse) => {
        setBuildResult(result);
        setMessages([]);
        setStatus('Website generated successfully.');
      },
      httpFallback
    );
  }

  async function handleSend() {
    if (!buildResult || !messageInput.trim()) return;

    const currentMessage = messageInput.trim();
    setLoading(true);
    setMessageInput('');
    setMessages((prev) => [...prev, { role: 'user', content: currentMessage }]);
    setStatus(applyChanges ? 'Applying changes...' : 'Thinking...');

    const payload = {
      action: 'chat',
      site_url: buildResult.site_url,
      message: currentMessage,
      apply_changes: applyChanges,
      project_dir: buildResult.project_dir,
      project_name: buildResult.plan?.name ?? (projectName.trim() || undefined),
      container_name: buildResult.container_name,
      project_type: buildResult.project_type,
      model_name: modelName,
      api_key: apiKey.trim() || undefined,
    };

    const httpFallback = async () => {
      try {
        const response = await chatWebsite(payload);
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
    };

    runWebSocketTask(
      payload,
      (response: ChatWebsiteResponse) => {
        applyChatResponse(response);
      },
      httpFallback
    );
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
    streamingCode,
    siteUrl,
    projectDir,
    files,
    metadata,
    handleBuild,
    handleSend,
    handleStop,
  };
}
