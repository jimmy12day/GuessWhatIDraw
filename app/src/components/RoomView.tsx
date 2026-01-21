import { type FC, useEffect, useRef, useState } from 'react'
import classNames from 'classnames'
import { DrawingCanvas } from './canvas/DrawingCanvas'
import { useRoomsStore } from '../state/rooms'
import { useAiGuess } from '../mock/useAiGuess'
import { Fireworks } from './ui/Fireworks'

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
    joinRoom,
    startRound,
    guess,
    setTimeLeft,
    endRound,
    setPlayerRole,
    resetRoles,
  } = useRoomsStore()
  const room = rooms.find((r) => r.id === roomId) as Room | undefined
  const roomKey = room?.id
  const roomPhase = room?.phase
  const winnerName = room?.winnerName
  const selfPlayer = room?.players.find((player) => player.id === self.id)
  const [guessText, setGuessText] = useState('')
  const [aiResult, setAiResult] = useState<string>('')
  const [showFireworks, setShowFireworks] = useState(false)
  const [winnerText, setWinnerText] = useState('')
  const [showTakeoverConfirm, setShowTakeoverConfirm] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<number | null>(null)

  const ai = useAiGuess()

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [])


  useEffect(() => {
    if (!room || selfPlayer) return
    joinRoom(room.id)
  }, [joinRoom, room, selfPlayer])

  useEffect(() => {
    if (!roomKey || !roomPhase) return
    if (roomPhase === 'drawing') {
      const promptResetId = window.setTimeout(() => {
        setAiResult('')
        setShowFireworks(false)
        setWinnerText('')
      }, 0)
      if (timerRef.current) window.clearInterval(timerRef.current)
      let timeLeft = 60
      setTimeLeft(roomKey, timeLeft)
      timerRef.current = window.setInterval(() => {
        timeLeft -= 1
        if (timeLeft <= 0) {
          if (timerRef.current) window.clearInterval(timerRef.current)
          endRound(roomKey)
          resetRoles(roomKey)
        } else {
          setTimeLeft(roomKey, timeLeft)
        }
      }, 1000)
      return () => window.clearTimeout(promptResetId)
    }
    if (roomPhase === 'reveal') {
      if (timerRef.current) window.clearInterval(timerRef.current)
      if (winnerName) {
        setShowFireworks(true)
        setWinnerText(`${winnerName} ✓`)
        const timeoutId = window.setTimeout(() => {
          setShowFireworks(false)
          setWinnerText('')
        }, 3000)
        return () => window.clearTimeout(timeoutId)
      }
    }
    return undefined
  }, [endRound, resetRoles, roomKey, roomPhase, setTimeLeft, winnerName])

  if (!room) return null

  const handleSend = () => {
    if (!guessText.trim()) return
    const res = guess(room.id, guessText.trim())
    addMessage(room.id, `${self.name}: ${guessText}`)
    setGuessText('')
    if (res.isCorrect) {
      setAiResult('猜对了！')
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
    <main className="room-layout relative flex-1 min-h-0">
      {!selfPlayer?.role && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-panel px-6 py-7 text-center shadow-card">
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">加入成功</p>
            <h3 className="mt-2 text-lg font-semibold">请选择角色</h3>
            <div className="mt-6 grid gap-3">
              <button
                className="rounded-xl border border-accent/40 bg-accent/20 px-4 py-3 text-xs font-semibold text-accent hover:bg-accent/30"
                onClick={() => handleRoleSelect('painter')}
              >
                我是画家
              </button>
              <button
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold text-slate-100 hover:bg-white/10"
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
            <h4 className="text-base font-semibold">确认接管画家？</h4>
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
      <section className="room-stage border-b border-white/5 bg-slate-950/40 backdrop-blur p-4 flex flex-col min-h-0">
        {showFireworks && <Fireworks />}
        {winnerText && (
          <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
            <div className="px-5 py-3 rounded-xl bg-black/70 text-lg font-semibold text-white">
              {winnerText}
            </div>
          </div>
        )}
          <button
            className="absolute top-3 right-3 h-11 w-11 rounded-full bg-black/70 text-xl text-slate-100 hover:bg-black/80"
            onClick={onExit}
            aria-label="退出房间"
            type="button"
          >
            ×
          </button>
          {room.timeLeft !== undefined && (
            <div className="absolute top-3 right-16 px-3 py-1.5 rounded-lg bg-black/60 text-xs text-slate-100">
              {room.timeLeft}s
            </div>
          )}
          <div className="flex items-center justify-start mb-4">
            <div className="flex flex-col items-start gap-2">
              <div className="flex gap-2">
                {selfPlayer?.role === 'guesser' && (
                  <button
                    className="px-3 py-2 rounded-lg bg-accent/20 text-accent text-xs font-semibold hover:bg-accent/30"
                    onClick={handleTakePainter}
                  >
                    接管画家
                  </button>
                )}
                <button
                  className={classNames(
                    'px-3 py-2 rounded-lg text-xs',
                    selfPlayer?.role === 'painter'
                    ? 'bg-white/10 hover:bg-white/15'
                    : 'bg-white/5 text-slate-500 cursor-not-allowed',
                )}
                onClick={handleStart}
                disabled={selfPlayer?.role !== 'painter'}
                title={selfPlayer?.role === 'painter' ? '开始或重开本局' : '只有画家可以开始游戏'}
                >
                开始
              </button>
            </div>
          </div>
        </div>
          {selfPlayer?.role === 'painter' && room.word && (
            <div className="mb-3 text-xs text-accent">{room.word}</div>
          )}
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

      <section className="room-chat flex flex-col bg-panel/80 border-t border-white/5 min-h-0">
        <div className="p-4 border-b border-white/5">
          <h3 className="text-base font-semibold">猜词 / 聊天</h3>
        </div>
        <div className="flex-1 grid grid-rows-[1fr_auto] min-h-0">
          <div className="overflow-y-auto p-4 space-y-2" ref={chatRef}>
            {room.messages.map((m) => (
              <div key={m.id} className="text-xs text-slate-200">
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
                className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-white/5 text-xs"
                placeholder="输入猜测或聊天"
              />
              <button
                onClick={handleSend}
                className="px-4 py-2 rounded-lg bg-accent text-slate-950 text-xs font-semibold"
              >
                发送
              </button>
              <button
                onClick={handleAiAssist}
                className="px-3 py-2 rounded-lg bg-white/10 text-xs"
              >
                AI辅助
              </button>
            </div>
            {aiResult && <div className="text-[11px] text-slate-400">{aiResult}</div>}
          </div>
        </div>
        <div className="p-4 border-t border-white/5 bg-panel/90">
          <h4 className="text-xs text-slate-400 mb-2">玩家 · {self.name}</h4>
          <div className="text-xs text-slate-300">当前玩家数：{room.players.length}</div>
        </div>
      </section>
    </main>
  )
}
