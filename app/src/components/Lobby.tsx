import { type FC, useState } from 'react'
import { type Room, useRoomsStore } from '../state/rooms'

type Props = {
  rooms: Room[]
  onJoin: (roomId: string) => void
  onCreate: (name: string) => void
}

export const Lobby: FC<Props> = ({ rooms, onJoin, onCreate }) => {
  const [name, setName] = useState('新房间')
  const { self } = useRoomsStore()
  return (
    <main className="flex-1 px-6 py-8">
      <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs text-slate-400">你好，{self.name}</p>
            <h2 className="text-xl font-semibold">大厅</h2>
          </div>
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="房间名称"
              className="px-3 py-2 rounded-lg bg-slate-800 border border-white/5 text-xs focus:border-accent outline-none"
            />
            <button
              className="px-4 py-2 rounded-lg bg-accent text-slate-950 text-xs font-semibold hover:translate-y-[-1px] transition shadow-card"
              onClick={() => name.trim() && onCreate(name.trim())}
            >
              创建房间
            </button>
          </div>
        </div>
        <div className="grid gap-4">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="rounded-xl bg-panel border border-white/5 p-4 shadow-card flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{room.name}</h3>
                  <span className="text-[11px] px-2 py-1 rounded-full bg-white/10 text-slate-200">
                    {room.players.length} 人
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2">状态：{room.phase === 'lobby' ? '准备中' : '进行中'}</p>
                <p className="text-xs text-slate-500 mt-1">已有 {room.players.length} 名玩家，是否加入？</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {room.players.map((p) => (
                    <span
                      key={p.id}
                    className="text-[11px] px-2 py-1 rounded bg-white/5 border border-white/5"
                    style={{ color: p.color }}
                  >
                    {p.name}
                    </span>
                  ))}
                </div>
              </div>
              <button
                className="mt-4 px-3 py-2 rounded-lg bg-white/10 text-xs font-semibold hover:bg-white/15"
                onClick={() => onJoin(room.id)}
              >
                加入
              </button>
            </div>
          ))}
          {rooms.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-slate-400">
              还没有房间，创建一个吧。
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
