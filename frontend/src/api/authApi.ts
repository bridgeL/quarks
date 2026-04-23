import { apiRequest, setToken } from './base'

const BASE_URL = 'http://127.0.0.1:52000/auth'

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  password: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface AutoRegisterResponse {
  access_token: string
  username: string
  nickname: string
  token_type: string
}

export async function login(payload: LoginRequest): Promise<TokenResponse> {
  const result = await apiRequest<TokenResponse>(`${BASE_URL}/login`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (result.error) {
    throw new Error(result.error)
  }
  if (result.data) {
    setToken(result.data.access_token)
  }
  return result.data!
}

export async function register(payload: RegisterRequest): Promise<TokenResponse> {
  const result = await apiRequest<TokenResponse>(`${BASE_URL}/register`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (result.error) {
    throw new Error(result.error)
  }
  if (result.data) {
    setToken(result.data.access_token)
  }
  return result.data!
}

export async function autoRegister(): Promise<AutoRegisterResponse> {
  const result = await apiRequest<AutoRegisterResponse>(`${BASE_URL}/auto-register`, {
    method: 'POST',
  })
  if (result.error) {
    throw new Error(result.error)
  }
  if (result.data) {
    setToken(result.data.access_token)
  }
  return result.data!
}
