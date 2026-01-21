import { WebSocketServer } from 'ws'

const PORT = Number(process.env.PORT ?? 3001)

const initialRooms = [
  {
    id: 'demo',
    name: '示例房间',
    players: [],
    paths: [],
    messages: [],
    phase: 'lobby',
    hint: '水果类别',
  },
]

const state = {
  rooms: initialRooms,
}

const connections = new Map()

const removePlayer = (roomId, playerId) => {
  const room = state.rooms.find((target) => target.id === roomId)
  if (!room) return
  room.players = room.players.filter((player) => player.id !== playerId)
  if (room.players.length === 0) {
    state.rooms = state.rooms.filter((target) => target.id !== roomId)
  }
}

const addPlayer = (roomId, player) => {
  let room = state.rooms.find((target) => target.id === roomId)
  if (!room) {
    room = {
      id: roomId,
      name: '未命名房间',
      players: [],
      paths: [],
      messages: [],
      phase: 'lobby',
    }
    state.rooms = [...state.rooms, room]
  }
  if (!room.players.find((existing) => existing.id === player.id)) {
    room.players = [...room.players, player]
  }
}

const wss = new WebSocketServer({ port: PORT })

const broadcast = (payload) => {
  const message = JSON.stringify(payload)
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(message)
    }
  })
}

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    try {
      const payload = JSON.parse(data.toString())
      if (payload.type === 'rooms:request') {
        ws.send(JSON.stringify({ type: 'rooms:update', rooms: state.rooms }))
        return
      }
      if (payload.type === 'presence:update' && payload.playerId) {
        const existing = connections.get(ws)
        if (existing?.roomId && existing.playerId) {
          removePlayer(existing.roomId, existing.playerId)
        }
        if (payload.roomId) {
          addPlayer(payload.roomId, {
            id: payload.playerId,
            name: payload.playerName ?? '玩家',
            score: 0,
            color: payload.playerColor ?? '#ff8a3d',
          })
          connections.set(ws, { roomId: payload.roomId, playerId: payload.playerId })
        } else {
          connections.delete(ws)
        }
        broadcast({ type: 'rooms:update', rooms: state.rooms })
        return
      }
      if (payload.type === 'rooms:update' && Array.isArray(payload.rooms)) {
        state.rooms = payload.rooms.map((room) => {
          const existingRoom = state.rooms.find((target) => target.id === room.id)
          if (!existingRoom) return room
          const nextPlayers = existingRoom.players.map((player) => {
            const incoming = Array.isArray(room.players)
              ? room.players.find((p) => p.id === player.id)
              : undefined
            return incoming
              ? {
                  ...player,
                  role: incoming.role ?? player.role,
                  isHost: incoming.isHost ?? player.isHost,
                  score: incoming.score ?? player.score,
                }
              : player
          })
          return { ...room, players: nextPlayers }
        })
        broadcast({ type: 'rooms:update', rooms: state.rooms })
      }
    } catch {
      return
    }
  })

  ws.on('close', () => {
    const existing = connections.get(ws)
    if (existing?.roomId && existing.playerId) {
      removePlayer(existing.roomId, existing.playerId)
      connections.delete(ws)
      broadcast({ type: 'rooms:update', rooms: state.rooms })
    }
  })
})

console.log(`Sketch Arena WS server listening on ${PORT}`)
