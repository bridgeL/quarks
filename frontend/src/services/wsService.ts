const WS_ORIGIN = import.meta.env.DEV ? 'ws://127.0.0.1:52000' : ''
const WS_URL = `${WS_ORIGIN}/ws/connect`

const HEARTBEAT_INTERVAL = 30000
const HEARTBEAT_TIMEOUT = 40000
const MAX_RECONNECT_DELAY = 30000

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
let shouldReconnect = false
let reconnectDelay = 1000
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let heartbeatTimer: ReturnType<typeof setInterval> | null = null
let heartbeatTimeoutTimer: ReturnType<typeof setTimeout> | null = null

const openHandlers: VoidHandler[] = []
const messageHandlers: MessageHandler[] = []
const closeHandlers: VoidHandler[] = []
const errorHandlers: ((error: Event) => void)[] = []

function isLoggedIn(): boolean {
  return localStorage.getItem(TOKEN_KEY) !== null
}

function clearHeartbeat(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
  if (heartbeatTimeoutTimer) {
    clearTimeout(heartbeatTimeoutTimer)
    heartbeatTimeoutTimer = null
  }
}

function startHeartbeat(): void {
  clearHeartbeat()
  heartbeatTimer = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }))
      heartbeatTimeoutTimer = setTimeout(() => {
        ws?.close()
      }, HEARTBEAT_TIMEOUT)
    }
  }, HEARTBEAT_INTERVAL)
}

function handleOpen(): void {
  reconnectDelay = 1000
  startHeartbeat()
  openHandlers.forEach((h) => h())
}

function handleMessage(event: MessageEvent): void {
  console.log('[WS] <<<', event.data)
  try {
    const msg = JSON.parse(event.data as string)
    if (msg.type === 'ping') {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'pong' }))
      }
      return
    }
    messageHandlers.forEach((h) => h(msg))
  } catch {
    messageHandlers.forEach((h) => h(event.data))
  }
}

function handleClose(): void {
  clearHeartbeat()
  ws = null
  closeHandlers.forEach((h) => h())
  if (shouldReconnect && isLoggedIn()) {
    scheduleReconnect()
  }
}

function handleError(event: Event): void {
  errorHandlers.forEach((h) => h(event))
}

function scheduleReconnect(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
  }
  reconnectTimer = setTimeout(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (shouldReconnect && token && isLoggedIn()) {
      connect(token)
    }
  }, reconnectDelay)
  reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY)
}

function connect(token: string): void {
  if (ws) {
    ws.onopen = null
    ws.onmessage = null
    ws.onclose = null
    ws.onerror = null
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close()
    }
  }
  shouldReconnect = true
  ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`)
  ws.onopen = handleOpen
  ws.onmessage = handleMessage
  ws.onclose = handleClose
  ws.onerror = handleError
}

function disconnect(): void {
  shouldReconnect = false
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  clearHeartbeat()
  if (ws) {
    ws.onopen = null
    ws.onmessage = null
    ws.onclose = null
    ws.onerror = null
    ws.close()
    ws = null
  }
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
