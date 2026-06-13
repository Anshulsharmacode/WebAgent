import { downloadFile, postJson } from './http'
import type {
  BuildWebsitePayload,
  BuildWebsiteResponse,
  ChatWebsitePayload,
  ChatWebsiteResponse,
  StopWebsitePayload,
} from '../types/website'

export function buildWebsite(payload: BuildWebsitePayload): Promise<BuildWebsiteResponse> {
  return postJson<BuildWebsiteResponse>('/llm/build/', payload)
}

export function chatWebsite(payload: ChatWebsitePayload): Promise<ChatWebsiteResponse> {
  return postJson<ChatWebsiteResponse>('/llm/chat/', payload)
}

export function stopWebsite(payload: StopWebsitePayload): Promise<{ status: string }> {
  return postJson<{ status: string }>('/llm/stop/', payload)
}

export function downloadProject(projectDir: string): Promise<void> {
  return downloadFile(
    `/llm/download/?project_dir=${encodeURIComponent(projectDir)}`,
    'project.zip',
  )
}
