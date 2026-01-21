import { useMemo, useState } from 'react'
import { nanoid } from 'nanoid'
import { RoomView } from './components/RoomView'
import { Lobby } from './components/Lobby'
import { useRoomsStore } from './state/rooms'
import { useMockSocket } from './mock/useMockSocket'
import './App.css'

function App() {
  const { rooms, createRoom, joinRoom, leaveRoom } = useRoomsStore()
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null)

  useMockSocket(currentRoomId ?? 'lobby')

  const sortedRooms = useMemo(
    () => [...rooms].sort((a, b) => b.players.length - a.players.length),
    [rooms],
  )

  const handleCreate = (name: string) => {
    const id = createRoom(name)
    joinRoom(id)
    setCurrentRoomId(id)
  }

  const handleJoin = (roomId: string) => {
    joinRoom(roomId)
    setCurrentRoomId(roomId)
  }

  const handleExit = (roomId: string) => {
    leaveRoom(roomId)
    setCurrentRoomId(null)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {!currentRoomId && (
        <header className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-slate-900/60 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent to-accent2 shadow-card" />
            <div>
              <p className="text-xs text-slate-400">AI你画我猜</p>
              <h1 className="text-lg font-semibold">Sketch Arena</h1>
            </div>
          </div>
          <button
            className="px-3 py-2 rounded-lg bg-accent text-slate-950 text-sm font-semibold hover:translate-y-[-1px] transition shadow-card"
            onClick={() => handleCreate(`房间-${nanoid(4)}`)}
          >
            快速开房
          </button>
        </header>
      )}

      {currentRoomId ? (
        <RoomView roomId={currentRoomId} onExit={() => handleExit(currentRoomId)} />
      ) : (
        <Lobby rooms={sortedRooms} onJoin={handleJoin} onCreate={handleCreate} />
      )}
    </div>
  )
}

export default App
