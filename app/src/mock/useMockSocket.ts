import { useEffect, useRef } from 'react'
import { useRoomsStore } from '../state/rooms'

const SOCKET_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3001'

type RoomsPayload = { type: 'rooms:update'; rooms: unknown }
type PresencePayload = { type: 'presence:update'; roomId?: string; playerId: string; playerName: string; playerColor: string }

type RoomsRequest = { type: 'rooms:request' }

export const useMockSocket = (roomId: string) => {
  const lastRoomsRef = useRef(useRoomsStore.getState().rooms)
  const suppressRef = useRef(false)
  const selfRef = useRef(useRoomsStore.getState().self)

  useEffect(() => {
    selfRef.current = useRoomsStore.getState().self
    let ws: WebSocket | null = null
    let reconnectTimer: number | null = null
    let active = true

    const connect = () => {
      if (!active) return
      ws = new WebSocket(SOCKET_URL)

      ws.addEventListener('open', () => {
        ws?.send(JSON.stringify({ type: 'rooms:request' } satisfies RoomsRequest))
        const self = selfRef.current
        if (roomId && roomId !== 'lobby') {
          ws?.send(
            JSON.stringify({
              type: 'presence:update',
              roomId,
              playerId: self.id,
              playerName: self.name,
              playerColor: self.color,
            } satisfies PresencePayload),
          )
        }
      })

      ws.addEventListener('message', (event) => {
        try {
          const payload = JSON.parse(String(event.data)) as RoomsPayload
          if (payload.type === 'rooms:update') {
            suppressRef.current = true
            useRoomsStore.setState({ rooms: payload.rooms as ReturnType<typeof useRoomsStore.getState>['rooms'] })
            lastRoomsRef.current = useRoomsStore.getState().rooms
            suppressRef.current = false
          }
        } catch {
          return
        }
      })

      ws.addEventListener('close', () => {
        if (!active) return
        if (reconnectTimer) window.clearTimeout(reconnectTimer)
        reconnectTimer = window.setTimeout(connect, 1500)
      })
    }

    connect()

    const handlePresence = () => {
      if (ws?.readyState !== WebSocket.OPEN) return
      if (!roomId || roomId === 'lobby') return
      const self = selfRef.current
      ws.send(
        JSON.stringify({
          type: 'presence:update',
          roomId,
          playerId: self.id,
          playerName: self.name,
          playerColor: self.color,
        } satisfies PresencePayload),
      )
    }

    const handleUnload = () => {
      if (ws?.readyState !== WebSocket.OPEN) return
      if (!roomId || roomId === 'lobby') return
      const self = selfRef.current
      ws.send(
        JSON.stringify({
          type: 'presence:update',
          roomId: undefined,
          playerId: self.id,
          playerName: self.name,
          playerColor: self.color,
        } satisfies PresencePayload),
      )
    }

    handlePresence()
    window.addEventListener('beforeunload', handleUnload)

    const unsubStore = useRoomsStore.subscribe(() => {
      if (suppressRef.current) return
      const rooms = useRoomsStore.getState().rooms
      if (rooms === lastRoomsRef.current) return
      lastRoomsRef.current = rooms
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'rooms:update', rooms } satisfies RoomsPayload))
      }
    })

    return () => {
      active = false
      if (reconnectTimer) window.clearTimeout(reconnectTimer)
      window.removeEventListener('beforeunload', handleUnload)
      handleUnload()
      ws?.close()
      unsubStore()
    }
  }, [roomId])
}
