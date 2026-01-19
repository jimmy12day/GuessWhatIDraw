type Props = {
  seconds?: number
}

export const CountdownBadge = ({ seconds }: Props) => {
  if (seconds === undefined) return null
  return (
    <div className="px-2 py-1 rounded bg-amber-500/20 text-amber-200 text-xs border border-amber-400/30">
      倒计时：{seconds}s
    </div>
  )
}
