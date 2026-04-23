const WS_ORIGIN = import.meta.env.DEV ? 'ws://127.0.0.1:52000' : ''
const WS_URL = `${WS_ORIGIN}/ws/connect`

const HEARTBEAT_INTERVAL = 20000
const RECONNECT_INTERVAL = 3000

const TOKEN_KEY = 'auth_token'

type MessageHandler = (data: unknown) => void
type VoidHandler = () => void

interface WsService {
  connect: (token: string) => void
  disconnect: () => void
  send: (data: unknown) => void
  onOpen: (handler: VoidHandler) => void
  onMessage: (handler: MessageHandler) => void
  onClose: (handler: VoidHandler) => void
  onError: (handler: (error: Event) => void) => void
}

let ws: WebSocket | null = null
let token: string | null = null
let heartbeatTimer: ReturnType<typeof setInterval> | null = null
let reconnectTimer: ReturnType<typeof setInterval> | null = null

const openHandlers: VoidHandler[] = []
const messageHandlers: MessageHandler[] = []
const closeHandlers: VoidHandler[] = []
const errorHandlers: ((error: Event) => void)[] = []

function isLoggedIn(): boolean {
  return localStorage.getItem(TOKEN_KEY) !== null
}

function clearTimers(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
  if (reconnectTimer) {
    clearInterval(reconnectTimer)
    reconnectTimer = null
  }
}

function startHeartbeat(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
  }
  heartbeatTimer = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const payload = JSON.stringify({ type: 'ping' })
      console.log('[WS] >>>', payload)
      ws.send(payload)
    }
  }, HEARTBEAT_INTERVAL)
}

function startReconnect(): void {
  if (reconnectTimer) {
    clearInterval(reconnectTimer)
  }
  reconnectTimer = setInterval(() => {
    if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
      if (isLoggedIn() && token) {
        connect(token)
      }
    }
  }, RECONNECT_INTERVAL)
}

function connect(newToken: string): void {
  token = newToken
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
  ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(newToken)}`)

  ws.onopen = () => {
    console.log('[WS] connected')
    startHeartbeat()
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
      messageHandlers.forEach((h) => h(msg))
    } catch {
      messageHandlers.forEach((h) => h(event.data))
    }
  }

  ws.onclose = () => {
    console.log('[WS] closed')
    clearTimers()
    ws = null
    closeHandlers.forEach((h) => h())
    if (isLoggedIn()) {
      startReconnect()
    }
  }

  ws.onerror = (event) => {
    errorHandlers.forEach((h) => h(event))
  }
}

function disconnect(): void {
  clearTimers()
  if (ws) {
    ws.onopen = null
    ws.onmessage = null
    ws.onclose = null
    ws.onerror = null
    ws.close()
    ws = null
  }
  token = null
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

function onMessage(handler: MessageHandler): void {
  messageHandlers.push(handler)
}

function onClose(handler: VoidHandler): void {
  closeHandlers.push(handler)
}

function onError(handler: (error: Event) => void): void {
  errorHandlers.push(handler)
}

const wsService: WsService = { connect, disconnect, send, onOpen, onMessage, onClose, onError }

export default wsService
