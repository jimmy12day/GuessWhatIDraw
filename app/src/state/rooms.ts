import { create } from 'zustand'
import { nanoid } from 'nanoid'

export type Phase = 'lobby' | 'drawing' | 'reveal'

export type Player = {
  id: string
  name: string
  score: number
  isHost?: boolean
  color: string
  role?: 'painter' | 'guesser'
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
  answerOptions?: string[]
  winnerName?: string
}

type Store = {
  self: Player
  rooms: Room[]
  currentWord?: string
  createRoom: (name: string) => string
  joinRoom: (roomId: string, player?: Player) => void
  leaveRoom: (roomId: string, playerId?: string) => void
  setPlayerRole: (roomId: string, playerId: string, role: Player['role']) => void
  addMessage: (roomId: string, text: string) => void
  addPath: (roomId: string, path: DrawingPath) => void
  clearPaths: (roomId: string) => void
  startRound: (roomId: string) => void
  setTimeLeft: (roomId: string, timeLeft: number) => void
  endRound: (roomId: string, winnerName?: string) => void
  resetRoles: (roomId: string) => void
  guess: (roomId: string, text: string) => { isCorrect: boolean; target?: string }
}

const randomColor = () => {
  const palette = ['#ff8a3d', '#5de4c7', '#7c3aed', '#22d3ee', '#f472b6', '#facc15']
  return palette[Math.floor(Math.random() * palette.length)]
}

const createPlayer = (): Player => ({
  id: nanoid(6),
  name: `玩家-${Math.floor(Math.random() * 90 + 10)}`,
  score: 0,
  isHost: true,
  color: randomColor(),
})

const defaultSelf = createPlayer()

const initialRoom: Room = {
  id: 'demo',
  name: '示例房间',
  players: [],
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
      players: [],
      paths: [],
      messages: [],
      phase: 'lobby',
    }
    set((state) => ({ rooms: [...state.rooms, room] }))
    return room.id
  },
  joinRoom: (roomId, player) => {
    const fallbackPlayer = player ?? get().self
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.id === roomId && !room.players.find((p) => p.id === fallbackPlayer.id)
          ? {
              ...room,
              players: [...room.players, { ...fallbackPlayer, isHost: room.players.length === 0 }],
            }
          : room,
      ),
    }))
  },
  leaveRoom: (roomId, playerId) => {
    const targetId = playerId ?? get().self.id
    set((state) => ({
      rooms: state.rooms
        .map((room) => {
          if (room.id !== roomId) return room
          const remainingPlayers = room.players.filter((p) => p.id !== targetId)
          if (remainingPlayers.length === 0) {
            return { ...room, players: remainingPlayers, painterId: undefined }
          }
          const stillHasPainter = remainingPlayers.some((p) => p.id === room.painterId)
          if (stillHasPainter) {
            return { ...room, players: remainingPlayers }
          }
          const nextPainterId = remainingPlayers[0].id
          return {
            ...room,
            painterId: nextPainterId,
            players: remainingPlayers.map((player) =>
              player.id === nextPainterId
                ? { ...player, role: 'painter' as const }
                : { ...player, role: 'guesser' as const },
            ),
          }
        })
        .filter((room) => room.players.length > 0),
    }))
  },
  setPlayerRole: (roomId, playerId, role) => {
    set((state) => ({
      rooms: state.rooms.map((room) => {
        if (room.id !== roomId) return room
        const nextPainterId =
          role === 'painter'
            ? playerId
            : room.painterId === playerId
              ? undefined
              : room.painterId
        return {
          ...room,
          painterId: nextPainterId,
          players: room.players.map((player) => {
            if (player.id === playerId) return { ...player, role }
            if (role === 'painter') return { ...player, role: 'guesser' }
            return player
          }),
        }
      }),
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
    const optionsPool = mockWords
      .map((w) => w.word)
      .filter((w) => w !== nextWord.word)
      .sort(() => Math.random() - 0.5)
      .slice(0, 7)
    const answerOptions = [...optionsPool, nextWord.word].sort(() => Math.random() - 0.5)

    set((state) => ({
      rooms: state.rooms.map((room) => {
        if (room.id !== roomId) return room
        const painterId =
          room.players.find((player) => player.role === 'painter')?.id ?? room.players[0]?.id
        return {
          ...room,
          phase: 'drawing',
          word: nextWord.word,
          hint: nextWord.hint,
          painterId,
          timeLeft: 60,
          paths: [],
          answerOptions,
          winnerName: undefined,
        }
      }),
    }))
  },
  setTimeLeft: (roomId, timeLeft) => {
    set((state) => ({
      rooms: state.rooms.map((room) => (room.id === roomId ? { ...room, timeLeft } : room)),
    }))
  },
  endRound: (roomId, winnerName) => {
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.id === roomId
          ? { ...room, phase: 'reveal', timeLeft: undefined, winnerName }
          : room,
      ),
    }))
  },
  resetRoles: (roomId) => {
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.id === roomId
          ? {
              ...room,
              painterId: undefined,
              players: room.players.map((player) => ({ ...player, role: undefined })),
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
      const winnerName = get().self.name
      set((state) => ({
        rooms: state.rooms.map((r) =>
          r.id === roomId
            ? {
                ...r,
                phase: 'reveal',
                paths: r.paths,
                winnerName,
                timeLeft: undefined,
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
  { word: '篮球', hint: '圆形球类运动' },
  { word: '宇航员', hint: '在太空工作的人' },
  { word: '火山', hint: '会喷发的山体' },
  { word: '鲸鱼', hint: '海洋里的巨型哺乳动物' },
  { word: '风筝', hint: '风中飞的纸做玩具' },
  { word: '雪人', hint: '用雪堆出的形象' },
]
