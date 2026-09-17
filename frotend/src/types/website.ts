export type ProjectType = 'classic_html' | 'react'

export type BuildWebsitePayload = {
  prompt: string
  project_name?: string
  project_type: ProjectType
  api_key?: string
  model_name?: string
}

export type BuildWebsiteResponse = {
  plan?: {
    name?: string
    pages?: string[]
    style_notes?: string[]
  }
  project_type: ProjectType
  project_dir: string
  files: string[]
  generated_files?: Record<string, string>
  container_id: string
  container_name: string
  image_tag: string
  host_port: number
  site_url: string
}

export type ChatWebsitePayload = {
  site_url: string
  message: string
  apply_changes?: boolean
  project_dir?: string
  project_name?: string
  container_name?: string
  project_type?: ProjectType
  api_key?: string
  model_name?: string
}

export type ChatWebsiteResponse = {
  answer: string
  changes_applied?: boolean
  change_summary?: string
  generated_files?: Record<string, string>
  project_type?: ProjectType
  container_id?: string
  container_name?: string
  image_tag?: string
  host_port?: number
  site_url?: string
}

export type StopWebsitePayload = {
  container_id?: string
  container_name?: string
}

export type AuthPayload = {
  username?: string
  email: string
  password: string
}

export type AuthResponse = {
  access?: string
  refresh?: string
  message?: string
  user?: {
    id: number
    username: string
    email: string
  }
}

export type ApiKeyModelPayload = {
  api_key?: string
  model_name?: string
}

export type ApiKeyModelResponse = {
  api_key?: string
  model_name?: string
  message?: string
  user?: {
    id: number
    api_key?: string
    model_name?: string
  }
}

