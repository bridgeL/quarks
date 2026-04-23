import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import wsService from '../services/wsService'

interface AuthContextType {
  token: string | null
  username: string | null
  nickname: string | null
  login: (token: string, username: string, nickname: string) => void
  updateProfile: (username: string, nickname: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const TOKEN_KEY = 'auth_token'
const USERNAME_KEY = 'auth_username'
const NICKNAME_KEY = 'auth_nickname'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem(USERNAME_KEY))
  const [nickname, setNickname] = useState<string | null>(() => localStorage.getItem(NICKNAME_KEY))

  const login = useCallback((newToken: string, newUsername: string, newNickname: string) => {
    localStorage.setItem(TOKEN_KEY, newToken)
    localStorage.setItem(USERNAME_KEY, newUsername)
    localStorage.setItem(NICKNAME_KEY, newNickname)
    setToken(newToken)
    setUsername(newUsername)
    setNickname(newNickname)
    wsService.connect(newToken)
  }, [])

  const updateProfile = useCallback((newUsername: string, newNickname: string) => {
    localStorage.setItem(USERNAME_KEY, newUsername)
    localStorage.setItem(NICKNAME_KEY, newNickname)
    setUsername(newUsername)
    setNickname(newNickname)
  }, [])

  const logout = useCallback(() => {
    wsService.disconnect()
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USERNAME_KEY)
    localStorage.removeItem(NICKNAME_KEY)
    setToken(null)
    setUsername(null)
    setNickname(null)
  }, [])

  return (
    <AuthContext.Provider value={{ token, username, nickname, login, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
