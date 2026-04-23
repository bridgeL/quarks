const API_ORIGIN = import.meta.env.DEV ? 'http://127.0.0.1:52000' : ''
const WS_ORIGIN = import.meta.env.DEV ? 'ws://127.0.0.1:52000' : ''
const WS_URL = `${WS_ORIGIN}/ws/connect`

const HEARTBEAT_INTERVAL = 20000
const RECONNECT_INTERVAL = 3000

const TOKEN_KEY = 'auth_token'

type MessageHandler = (data: unknown) => void
type VoidHandler = () => void

interface WsService {
  init: () => void
  connect: (token: string) => void
  disconnect: () => void
  send: (data: unknown) => void
  onOpen: (handler: VoidHandler) => void
  setMessageHandler: (handler: MessageHandler | null) => void
  onClose: (handler: VoidHandler) => void
  onError: (handler: (error: Event) => void) => void
}

let ws: WebSocket | null = null
let heartbeatTimer: ReturnType<typeof setInterval> | null = null
let reconnectTimer: ReturnType<typeof setInterval> | null = null
let cachedToken: string | null = null
let cachedPingValid = false

const openHandlers: VoidHandler[] = []
let messageHandler: MessageHandler | null = null
const closeHandlers: VoidHandler[] = []
const errorHandlers: ((error: Event) => void)[] = []

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

async function validateToken(): Promise<boolean> {
  const token = getToken()
  if (!token) {
    cachedToken = null
    cachedPingValid = false
    return false
  }
  if (token !== cachedToken) {
    cachedToken = token
    try {
      const res = await fetch(`${API_ORIGIN}/auth/ping`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      cachedPingValid = res.ok
    } catch {
      cachedPingValid = false
    }
  }
  return cachedPingValid
}

function startHeartbeat(): void {
  if (heartbeatTimer) return
  heartbeatTimer = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const payload = JSON.stringify({ type: 'ping' })
      console.log('[WS] >>>', payload)
      ws.send(payload)
    }
  }, HEARTBEAT_INTERVAL)
}

function startReconnect(): void {
  if (reconnectTimer) return
  reconnectTimer = setInterval(async () => {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return
    if (await validateToken()) {
      const token = getToken()
      if (token) _connect(token)
    }
  }, RECONNECT_INTERVAL)
}

function _connect(token: string): void {
  if (ws) {
    ws.onopen = null
    ws.onmessage = null
    ws.onclose = null
    ws.onerror = null
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close()
    }
    ws = null
  }
  ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`)

  ws.onopen = () => {
    console.log('[WS] connected')
    openHandlers.forEach((h) => h())
  }

  ws.onmessage = (event) => {
    console.log('[WS] <<<', event.data)
    try {
      const msg = JSON.parse(event.data as string)
      if (msg.type === 'ping') {
        if (ws && ws.readyState === WebSocket.OPEN) {
          const pong = JSON.stringify({ type: 'pong' })
          console.log('[WS] >>>', pong)
          ws.send(pong)
        }
        return
      }
      messageHandler?.(msg)
    } catch {
      messageHandler?.(event.data)
    }
  }

  ws.onclose = () => {
    console.log('[WS] closed')
    ws = null
    closeHandlers.forEach((h) => h())
  }

  ws.onerror = (event) => {
    errorHandlers.forEach((h) => h(event))
  }
}

function connect(token: string): void {
  cachedToken = token
  cachedPingValid = true
  _connect(token)
}

function init(): void {
  startHeartbeat()
  startReconnect()
}

function disconnect(): void {
  if (ws) {
    ws.onopen = null
    ws.onmessage = null
    ws.onclose = null
    ws.onerror = null
    ws.close()
    ws = null
  }
  cachedToken = null
  cachedPingValid = false
}

function send(data: unknown): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    const payload = JSON.stringify(data)
    console.log('[WS] >>>', payload)
    ws.send(payload)
  }
}

function onOpen(handler: VoidHandler): void {
  openHandlers.push(handler)
}

function setMessageHandler(handler: MessageHandler | null): void {
  messageHandler = handler
}

function onClose(handler: VoidHandler): void {
  closeHandlers.push(handler)
}

function onError(handler: (error: Event) => void): void {
  errorHandlers.push(handler)
}

const wsService: WsService = { init, connect, disconnect, send, onOpen, setMessageHandler, onClose, onError }

export default wsService
