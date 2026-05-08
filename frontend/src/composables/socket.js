import { io } from 'socket.io-client'
import { onBeforeUnmount } from 'vue'

let socket = null

export function getSocket() {
  if (!socket) {
    socket = io('/', { autoConnect: false, transports: ['websocket', 'polling'] })
  }
  return socket
}

export function connectSocket() {
  const s = getSocket()
  if (!s.connected) s.connect()
  return s
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect()
}

export function useSocket() {
  const socket = connectSocket()
  const listeners = []

  function on(event, handler) {
    socket.on(event, handler)
    listeners.push([event, handler])
    return () => socket.off(event, handler)
  }

  onBeforeUnmount(() => {
    listeners.forEach(([event, handler]) => socket.off(event, handler))
  })

  return { socket, on }
}
