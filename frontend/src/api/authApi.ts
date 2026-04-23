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

export interface AutoRegisterRequest {
  nickname?: string
}

export interface AuthResponse {
  access_token: string
  username: string
  nickname: string
  token_type: string
}

export interface CurrentUserResponse {
  id: string
  username: string
  nickname: string
  is_auto_registered: boolean
}

export interface UpdateProfileRequest {
  nickname?: string
  old_password?: string
  password?: string
}

export async function login(payload: LoginRequest): Promise<AuthResponse> {
  const result = await apiRequest<AuthResponse>(`${BASE_URL}/login`, {
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

export async function register(payload: RegisterRequest): Promise<AuthResponse> {
  const result = await apiRequest<AuthResponse>(`${BASE_URL}/register`, {
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

export async function autoRegister(payload: AutoRegisterRequest = {}): Promise<AuthResponse> {
  const result = await apiRequest<AuthResponse>(`${BASE_URL}/auto-register`, {
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

export async function getMe(): Promise<CurrentUserResponse> {
  const result = await apiRequest<CurrentUserResponse>(`${BASE_URL}/me`, {
    method: 'GET',
  })
  if (result.error) {
    throw new Error(result.error)
  }
  return result.data!
}

export async function updateProfile(payload: UpdateProfileRequest): Promise<CurrentUserResponse> {
  const result = await apiRequest<CurrentUserResponse>(`${BASE_URL}/update`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (result.error) {
    throw new Error(result.error)
  }
  return result.data!
}
