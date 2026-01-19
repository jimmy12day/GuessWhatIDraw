import { type FC, useMemo, useRef, useState } from 'react'
import classNames from 'classnames'
import { DrawingCanvas } from './canvas/DrawingCanvas'
import { useRoomsStore } from '../state/rooms'
import { useMockSocket } from '../mock/useMockSocket'
import { useAiGuess } from '../mock/useAiGuess'
import { Fireworks } from './ui/Fireworks'

import type { Room } from '../state/rooms'

type Props = {
  roomId: string
  onExit: () => void
}

export const RoomView: FC<Props> = ({ roomId, onExit }) => {
  const { rooms, self, addMessage, addPath, clearPaths, startRound, guess } = useRoomsStore()
  const room = rooms.find((r) => r.id === roomId) as Room | undefined
  const [guessText, setGuessText] = useState('')
  const [aiResult, setAiResult] = useState<string>('')
  const [showFireworks, setShowFireworks] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  useMockSocket(roomId)
  const ai = useAiGuess()

  const painter = useMemo(() => room?.players.find((p) => p.id === room?.painterId), [room])

  if (!room) return null

  const handleSend = () => {
    if (!guessText.trim()) return
    const res = guess(room.id, guessText.trim())
    addMessage(room.id, `${self.name}: ${guessText}`)
    setGuessText('')
    if (res.isCorrect) {
      setAiResult('猜对了！')
      setShowFireworks(true)
      setTimeout(() => setShowFireworks(false), 3000)
    } else {
      setAiResult('AI判定未命中')
    }
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
  }

  const handleStart = () => {
    startRound(room.id)
    clearPaths(room.id)
    setAiResult('')
  }

  const handleAiAssist = async () => {
    if (!guessText.trim()) return
    const r = await ai.guess(room.id, guessText.trim())
    setAiResult(r.message)
  }

  return (
    <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] min-h-0">
      <section className="border-r border-white/5 bg-slate-950/40 backdrop-blur p-6 flex flex-col min-h-0">
        {showFireworks && <Fireworks />}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-slate-400">房间</p>
            <h2 className="text-xl font-semibold">{room.name}</h2>
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-2 rounded-lg bg-white/10 text-sm"
              onClick={handleStart}
            >
              开始/重开
            </button>
            <button
              className="px-3 py-2 rounded-lg bg-white/10 text-sm"
              onClick={onExit}
            >
              退出房间
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 mb-3 text-sm text-slate-300">
          <span className="px-2 py-1 rounded bg-white/10">阶段：{room.phase}</span>
          {room.word && <span className="px-2 py-1 rounded bg-accent/20 text-accent">词：{room.word}</span>}
          {room.hint && <span className="px-2 py-1 rounded bg-accent2/15 text-accent2">提示：{room.hint}</span>}
          {painter && <span className="px-2 py-1 rounded bg-white/10">画手：{painter.name}</span>}
        </div>
        <div className="flex-1 min-h-0 rounded-2xl overflow-hidden border border-white/5 shadow-card">
          <DrawingCanvas
            roomId={room.id}
            paths={room.paths}
            onPath={(path) => addPath(room.id, path)}
            painterId={room.painterId}
            selfId={self.id}
          />
        </div>
      </section>

      <section className="flex flex-col bg-panel/80 border-l border-white/5 min-h-0">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-lg font-semibold">猜词 / 聊天</h3>
          <p className="text-sm text-slate-400 mt-1">与房间玩家互动，也可请 AI 协助。</p>
        </div>
        <div className="flex-1 grid grid-rows-[1fr_auto] min-h-0">
          <div className="overflow-y-auto p-4 space-y-2" ref={chatRef}>
            {room.messages.map((m) => (
              <div key={m.id} className="text-sm text-slate-200">
                <span className="text-slate-500 mr-2">[{new Date(m.ts).toLocaleTimeString()}]</span>
                {m.from}：{m.text}
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-white/5 bg-panel/90 space-y-2">
            <div className="flex gap-2">
              <input
                value={guessText}
                onChange={(e) => setGuessText(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-white/5 text-sm"
                placeholder="输入猜测或聊天"
              />
              <button
                onClick={handleSend}
                className="px-4 py-2 rounded-lg bg-accent text-slate-950 font-semibold"
              >
                发送
              </button>
              <button
                onClick={handleAiAssist}
                className="px-3 py-2 rounded-lg bg-white/10 text-sm"
              >
                AI辅助
              </button>
            </div>
            {aiResult && <div className="text-xs text-slate-400">{aiResult}</div>}
          </div>
        </div>
        <div className="p-4 border-t border-white/5 bg-panel/90">
          <h4 className="text-sm text-slate-400 mb-2">玩家</h4>
          <div className="flex flex-wrap gap-2">
            {room.players.map((p) => (
              <div
                key={p.id}
                className={classNames(
                  'px-3 py-2 rounded-lg border border-white/5 text-sm flex items-center gap-2',
                  p.id === room.painterId && 'border-accent text-accent',
                )}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                {p.name}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
