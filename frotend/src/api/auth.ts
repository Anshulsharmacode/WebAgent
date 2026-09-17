import { getJson, postJson, removeAccessToken, setAccessToken } from './http'
import type {
  ApiKeyModelPayload,
  ApiKeyModelResponse,
  AuthPayload,
  AuthResponse,
} from '../types/website'

export async function signUpUser(payload: AuthPayload): Promise<AuthResponse> {
  return postJson<AuthResponse>('/api/v1/users/signup/', payload)
}

export async function signInUser(payload: AuthPayload): Promise<AuthResponse> {
  const data = await postJson<AuthResponse>('/api/v1/users/signin/', payload)
  if (data.access) {
    setAccessToken(data.access)
  }
  return data
}

export function signOutUser(): void {
  removeAccessToken()
}

export async function getApiKeyModel(): Promise<ApiKeyModelResponse> {
  return getJson<ApiKeyModelResponse>('/api/v1/users/api-key/')
}

export async function updateApiKeyModel(
  payload: ApiKeyModelPayload,
): Promise<ApiKeyModelResponse> {
  return postJson<ApiKeyModelResponse>('/api/v1/users/api-key/', payload)
}
