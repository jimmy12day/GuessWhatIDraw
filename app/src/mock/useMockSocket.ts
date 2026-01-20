import { useEffect, useRef } from 'react'
import { useRoomsStore } from '../state/rooms'

const SOCKET_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3001'

type RoomsPayload = { type: 'rooms:update'; rooms: unknown }

type RoomsRequest = { type: 'rooms:request' }

export const useMockSocket = (roomId: string) => {
  const lastRoomsRef = useRef(useRoomsStore.getState().rooms)
  const suppressRef = useRef(false)

  useEffect(() => {
    let ws: WebSocket | null = null
    let reconnectTimer: number | null = null
    let active = true

    const connect = () => {
      if (!active) return
      ws = new WebSocket(SOCKET_URL)

      ws.addEventListener('open', () => {
        ws?.send(JSON.stringify({ type: 'rooms:request' } satisfies RoomsRequest))
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
      ws?.close()
      unsubStore()
    }
  }, [roomId])
}
