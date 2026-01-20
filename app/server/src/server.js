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
      if (payload.type === 'rooms:update' && Array.isArray(payload.rooms)) {
        state.rooms = payload.rooms
        broadcast({ type: 'rooms:update', rooms: state.rooms })
      }
    } catch {
      return
    }
  })

  ws.on('close', () => {})
})

console.log(`Sketch Arena WS server listening on ${PORT}`)
