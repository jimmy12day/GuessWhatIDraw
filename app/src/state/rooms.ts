import { create } from 'zustand'
import { nanoid } from 'nanoid'

export type Phase = 'lobby' | 'drawing' | 'reveal'

export type Player = {
  id: string
  name: string
  score: number
  isHost?: boolean
  color: string
}

export type DrawingPoint = { x: number; y: number }
export type DrawingPath = { id: string; color: string; width: number; points: DrawingPoint[] }

export type Message = {
  id: string
  from: string
  text: string
  ts: number
}

export type Room = {
  id: string
  name: string
  players: Player[]
  paths: DrawingPath[]
  messages: Message[]
  phase: Phase
  word?: string
  hint?: string
  painterId?: string
  timeLeft?: number
}

type Store = {
  self: Player
  rooms: Room[]
  currentWord?: string
  createRoom: (name: string) => string
  joinRoom: (roomId: string) => void
  leaveRoom: (roomId: string) => void
  addMessage: (roomId: string, text: string) => void
  addPath: (roomId: string, path: DrawingPath) => void
  clearPaths: (roomId: string) => void
  startRound: (roomId: string) => void
  guess: (roomId: string, text: string) => { isCorrect: boolean; target?: string }
}

const randomColor = () => {
  const palette = ['#ff8a3d', '#5de4c7', '#7c3aed', '#22d3ee', '#f472b6', '#facc15']
  return palette[Math.floor(Math.random() * palette.length)]
}

const defaultSelf: Player = {
  id: nanoid(6),
  name: `玩家-${Math.floor(Math.random() * 90 + 10)}`,
  score: 0,
  isHost: true,
  color: randomColor(),
}

const initialRoom: Room = {
  id: 'demo',
  name: '示例房间',
  players: [defaultSelf],
  paths: [],
  messages: [],
  phase: 'lobby',
  hint: '水果类别',
}

export const useRoomsStore = create<Store>((set, get) => ({
  self: defaultSelf,
  rooms: [initialRoom],
  createRoom: (name: string) => {
    const room: Room = {
      id: nanoid(6),
      name,
      players: [get().self],
      paths: [],
      messages: [],
      phase: 'lobby',
    }
    set((state) => ({ rooms: [...state.rooms, room] }))
    return room.id
  },
  joinRoom: (roomId) => {
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.id === roomId && !room.players.find((p) => p.id === state.self.id)
          ? { ...room, players: [...room.players, { ...state.self, isHost: room.players.length === 0 }] }
          : room,
      ),
    }))
  },
  leaveRoom: (roomId) => {
    set((state) => ({
      rooms: state.rooms
        .map((room) =>
          room.id === roomId
            ? { ...room, players: room.players.filter((p) => p.id !== state.self.id) }
            : room,
        )
        .filter((room) => room.players.length > 0),
    }))
  },
  addMessage: (roomId, text) => {
    const from = get().self.name
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.id === roomId
          ? {
              ...room,
              messages: [...room.messages, { id: nanoid(6), from, text, ts: Date.now() }],
            }
          : room,
      ),
    }))
  },
  addPath: (roomId, path) => {
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.id === roomId ? { ...room, paths: [...room.paths, path] } : room,
      ),
    }))
  },
  clearPaths: (roomId) => {
    set((state) => ({
      rooms: state.rooms.map((room) => (room.id === roomId ? { ...room, paths: [] } : room)),
    }))
  },
  startRound: (roomId) => {
    const nextWord = mockWords[Math.floor(Math.random() * mockWords.length)]
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.id === roomId
          ? {
              ...room,
              phase: 'drawing',
              word: nextWord.word,
              hint: nextWord.hint,
              painterId: room.players[0]?.id,
              timeLeft: 60,
              paths: [],
            }
          : room,
      ),
    }))
  },
  guess: (roomId, text) => {
    const room = get().rooms.find((r) => r.id === roomId)
    if (!room?.word) return { isCorrect: false }
    const isCorrect = text.trim().toLowerCase() === room.word.toLowerCase()
    if (isCorrect) {
      set((state) => ({
        rooms: state.rooms.map((r) =>
          r.id === roomId
            ? {
                ...r,
                phase: 'reveal',
                paths: r.paths,
              }
            : r,
        ),
      }))
    }
    return { isCorrect, target: room.word }
  },
}))

const mockWords = [
  { word: '苹果', hint: '常见水果，红绿皆有' },
  { word: '长颈鹿', hint: '动物，脖子很长' },
  { word: '彩虹', hint: '雨后天空出现的色带' },
  { word: '吉他', hint: '弦乐器，常用来弹唱' },
]
