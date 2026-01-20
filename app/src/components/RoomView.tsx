import { type FC, useEffect, useMemo, useRef, useState } from 'react'
import classNames from 'classnames'
import { DrawingCanvas } from './canvas/DrawingCanvas'
import { useRoomsStore } from '../state/rooms'
import { useMockSocket } from '../mock/useMockSocket'
import { useAiGuess } from '../mock/useAiGuess'
import { Fireworks } from './ui/Fireworks'
import { CountdownBadge } from './ui/CountdownBadge'
import { OptionsGrid } from './ui/OptionsGrid'

import type { Room } from '../state/rooms'

type Props = {
  roomId: string
  onExit: () => void
}

export const RoomView: FC<Props> = ({ roomId, onExit }) => {
  const {
    rooms,
    self,
    addMessage,
    addPath,
    clearPaths,
    startRound,
    guess,
    setTimeLeft,
    endRound,
    setPlayerRole,
  } = useRoomsStore()
  const room = rooms.find((r) => r.id === roomId) as Room | undefined
  const selfPlayer = room?.players.find((player) => player.id === self.id)
  const [guessText, setGuessText] = useState('')
  const [aiResult, setAiResult] = useState<string>('')
  const [showFireworks, setShowFireworks] = useState(false)
  const [showNextPrompt, setShowNextPrompt] = useState(false)
  const [showTakeoverConfirm, setShowTakeoverConfirm] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<number | null>(null)

  useMockSocket(roomId)
  const ai = useAiGuess()

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [])

  const painter = useMemo(() => room?.players.find((p) => p.id === room?.painterId), [room])

  useEffect(() => {
    if (!room) return
    if (room.phase === 'drawing') {
      setShowNextPrompt(false)
      setAiResult('')
      if (timerRef.current) window.clearInterval(timerRef.current)
      let timeLeft = 60
      setTimeLeft(room.id, timeLeft)
      timerRef.current = window.setInterval(() => {
        timeLeft -= 1
        if (timeLeft <= 0) {
          if (timerRef.current) window.clearInterval(timerRef.current)
          endRound(room.id)
        } else {
          setTimeLeft(room.id, timeLeft)
        }
      }, 1000)
    }
    if (room.phase === 'reveal') {
      if (timerRef.current) window.clearInterval(timerRef.current)
      setShowNextPrompt(true)
      const timeoutId = window.setTimeout(() => setShowNextPrompt(false), 5000)
      return () => window.clearTimeout(timeoutId)
    }
    return undefined
  }, [room?.phase])

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
      endRound(room.id, self.name)
    } else {
      setAiResult('AI判定未命中')
    }
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
  }

  const handleStart = () => {
    startRound(room.id)
    clearPaths(room.id)
    setAiResult('')
    setShowNextPrompt(false)
  }

  const handleAiAssist = async () => {
    if (!guessText.trim()) return
    const r = await ai.guess(room.id, guessText.trim())
    setAiResult(r.message)
  }

  const handleRoleSelect = (role: 'painter' | 'guesser') => {
    if (!room) return
    setPlayerRole(room.id, self.id, role)
  }

  const handleTakePainter = () => {
    if (!room) return
    setShowTakeoverConfirm(true)
  }

  const confirmTakePainter = () => {
    if (!room) return
    setPlayerRole(room.id, self.id, 'painter')
    setShowTakeoverConfirm(false)
  }

  const cancelTakePainter = () => {
    setShowTakeoverConfirm(false)
  }

  return (
    <main className="relative flex-1 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] min-h-0">
      {!selfPlayer?.role && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-panel px-6 py-7 text-center shadow-card">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">加入成功</p>
            <h3 className="mt-2 text-2xl font-semibold">请选择角色</h3>
            <p className="mt-2 text-sm text-slate-400">画家负责绘制，猜谜者负责答题。</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                className="rounded-xl border border-accent/40 bg-accent/20 px-4 py-3 text-sm font-semibold text-accent hover:bg-accent/30"
                onClick={() => handleRoleSelect('painter')}
              >
                我是画家
              </button>
              <button
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-white/10"
                onClick={() => handleRoleSelect('guesser')}
              >
                我是猜谜者
              </button>
            </div>
          </div>
        </div>
      )}
      {showTakeoverConfirm && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-panel px-6 py-6 text-center shadow-card">
            <h4 className="text-lg font-semibold">确认接管画家？</h4>
            <p className="mt-2 text-sm text-slate-400">当前画家将自动变为猜谜者。</p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                className="px-4 py-2 rounded-lg bg-white/10 text-sm text-slate-200 hover:bg-white/15"
                onClick={cancelTakePainter}
              >
                取消
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-accent/20 text-sm font-semibold text-accent hover:bg-accent/30"
                onClick={confirmTakePainter}
              >
                确认接管
              </button>
            </div>
          </div>
        </div>
      )}
      <section className="border-r border-white/5 bg-slate-950/40 backdrop-blur p-6 flex flex-col min-h-0">
        {showFireworks && <Fireworks />}
        {room.phase === 'reveal' && room.winnerName && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-4xl md:text-6xl font-black text-white drop-shadow-[0_5px_20px_rgba(0,0,0,0.45)]">
              恭喜 {room.winnerName} 猜对！
            </div>
          </div>
        )}
        {room.phase === 'reveal' && showNextPrompt && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-black/60 text-sm text-slate-200">
            5 秒后可开始下一局
          </div>
        )}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-slate-400">房间</p>
              <h2 className="text-xl font-semibold">{room.name}</h2>
            </div>
            <div className="flex flex-col items-end gap-2">
              {selfPlayer?.role !== 'painter' && (
                <span className="text-xs text-slate-500">只有画家可以开始游戏</span>
              )}
              <div className="flex gap-2">
                {selfPlayer?.role === 'guesser' && (
                  <button
                    className="px-3 py-2 rounded-lg bg-accent/20 text-accent text-sm font-semibold hover:bg-accent/30"
                    onClick={handleTakePainter}
                  >
                    接管画家
                  </button>
                )}
                <button
                  className={classNames(
                    'px-3 py-2 rounded-lg text-sm',
                    selfPlayer?.role === 'painter'
                    ? 'bg-white/10 hover:bg-white/15'
                    : 'bg-white/5 text-slate-500 cursor-not-allowed',
                )}
                onClick={handleStart}
                disabled={selfPlayer?.role !== 'painter'}
                title={selfPlayer?.role === 'painter' ? '开始或重开本局' : '只有画家可以开始游戏'}
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
        </div>
          <div className="flex items-center gap-3 mb-3 text-sm text-slate-300">
            <span className="px-2 py-1 rounded bg-white/10">阶段：{room.phase}</span>
            {room.word && <span className="px-2 py-1 rounded bg-accent/20 text-accent">词：{room.word}</span>}
            {room.hint && <span className="px-2 py-1 rounded bg-accent2/15 text-accent2">提示：{room.hint}</span>}
            {painter && <span className="px-2 py-1 rounded bg-white/10">画手：{painter.name}</span>}
            {selfPlayer?.role && (
              <span className="px-2 py-1 rounded bg-white/10">
                你的角色：{selfPlayer.role === 'painter' ? '画家' : '猜谜者'}
              </span>
            )}
            <CountdownBadge seconds={room.timeLeft} />
          </div>
        <OptionsGrid options={room.answerOptions} />
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
                {p.role && (
                  <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                    {p.role === 'painter' ? '画家' : '猜谜者'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
