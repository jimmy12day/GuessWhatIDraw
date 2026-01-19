type Props = {
  options?: string[]
}

export const OptionsGrid = ({ options }: Props) => {
  if (!options || options.length === 0) return null
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 text-sm">
      {options.map((opt) => (
        <div
          key={opt}
          className="px-2 py-1 rounded-lg border border-white/5 bg-white/5 text-slate-100 text-center"
        >
          {opt}
        </div>
      ))}
    </div>
  )
}
