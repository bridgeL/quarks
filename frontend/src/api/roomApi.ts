import { apiRequest } from './base'

const API_ORIGIN = import.meta.env.DEV ? 'http://127.0.0.1:52000' : ''
const BASE_URL = `${API_ORIGIN}/room`

export interface CreateRoomRequest {
  name?: string
}

export interface CreateRoomResponse {
  room_id: string
  name: string
  created_by: string
  created_at: number
  status: string
}

export interface RoomListItem {
  room_id: string
  name: string
  created_by: string
  created_by_nickname: string
  created_at: number
  user_count: number
  status: string
}

export interface RoomUserInfo {
  user_id: string
  username: string
  nickname: string
  is_auto_registered: boolean
}

export interface RoomPlayerInfo {
  player_id: string
  user_id: string
  username: string
  nickname: string
  is_auto_registered: boolean
  left_at: number | null
}

export interface RoomGameInfo {
  game_id: string
  room_id: string
  started_at: number
  players: RoomPlayerInfo[]
}

export interface RoomResponse {
  room_id: string
  name: string
  created_by: string
  created_at: number
  status: string
  users: RoomUserInfo[]
  game: RoomGameInfo | null
}

export interface JoinLeaveResponse {
  ok: boolean
  room_id: string
}

export async function createRoom(name?: string): Promise<CreateRoomResponse> {
  const result = await apiRequest<CreateRoomResponse>(`${BASE_URL}/create`, {
    method: 'POST',
    body: JSON.stringify({ name } as CreateRoomRequest),
  })
  if (result.error) {
    throw new Error(result.error)
  }
  return result.data!
}

export async function listRooms(): Promise<RoomListItem[]> {
  const result = await apiRequest<RoomListItem[]>(`${BASE_URL}/list`, {
    method: 'GET',
  })
  if (result.error) {
    throw new Error(result.error)
  }
  return result.data!
}

export async function getRoom(roomId: string): Promise<RoomResponse> {
  const result = await apiRequest<RoomResponse>(`${BASE_URL}/${roomId}`, {
    method: 'GET',
  })
  if (result.error) {
    throw new Error(result.error)
  }
  return result.data!
}

export async function joinRoom(roomId: string): Promise<JoinLeaveResponse> {
  const result = await apiRequest<JoinLeaveResponse>(`${BASE_URL}/${roomId}/join`, {
    method: 'POST',
  })
  if (result.error) {
    throw new Error(result.error)
  }
  return result.data!
}

export async function leaveRoom(roomId: string): Promise<JoinLeaveResponse> {
  const result = await apiRequest<JoinLeaveResponse>(`${BASE_URL}/${roomId}/leave`, {
    method: 'POST',
  })
  if (result.error) {
    throw new Error(result.error)
  }
  return result.data!
}

export async function startGame(roomId: string): Promise<{ ok: boolean; room_id: string; status: string }> {
  const result = await apiRequest<{ ok: boolean; room_id: string; status: string }>(`${BASE_URL}/${roomId}/start`, {
    method: 'POST',
  })
  if (result.error) {
    throw new Error(result.error)
  }
  return result.data!
}

export async function endGame(roomId: string): Promise<{ ok: boolean; room_id: string; status: string }> {
  const result = await apiRequest<{ ok: boolean; room_id: string; status: string }>(`${BASE_URL}/${roomId}/end`, {
    method: 'POST',
  })
  if (result.error) {
    throw new Error(result.error)
  }
  return result.data!
}
