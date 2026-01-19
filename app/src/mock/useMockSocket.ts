import { useEffect } from 'react'
import { useRoomsStore } from '../state/rooms'

// Simple BroadcastChannel-based mock sync for multi-tab demo
export const useMockSocket = (roomId: string) => {
  useEffect(() => {
    const channel = new BroadcastChannel('mock-room')
    const unsub = useRoomsStore.subscribe((state) => state.rooms)

    const handler = (ev: MessageEvent) => {
      if (ev.data?.type === 'rooms:update') {
        // naive merge: replace store rooms with incoming
        useRoomsStore.setState({ rooms: ev.data.rooms })
      }
    }

    channel.addEventListener('message', handler)

    const sync = () => {
      const rooms = useRoomsStore.getState().rooms
      channel.postMessage({ type: 'rooms:update', rooms })
    }

    const unsubStore = useRoomsStore.subscribe(() => sync())

    return () => {
      channel.removeEventListener('message', handler)
      unsubStore()
      unsub()
      channel.close()
    }
  }, [roomId])
}
