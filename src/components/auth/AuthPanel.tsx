function DotGrid() {
  return (
    <div
      className="grid gap-[10px] opacity-40"
      style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}
    >
      {Array.from({ length: 70 }).map((_, i) => (
        <div key={i} className="w-[5px] h-[5px] rounded-full bg-white/30" />
      ))}
    </div>
  )
}

interface AuthPanelProps {
  headline: string
  highlight: string
  sub: string
}

export default function AuthPanel({ headline, highlight, sub }: AuthPanelProps) {
  return (
    <div
      className="hidden lg:flex lg:w-[58%] relative flex-col justify-between p-12 overflow-hidden"
      style={{ background: 'linear-gradient(140deg, #1F2937 0%, #111827 55%, #0B0F14 100%)' }}
    >
      {/* Marca neutra (sistema ainda sem nome) */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-[10px] bg-white grid place-items-center">
          <span className="w-3.5 h-[3px] rounded-full bg-[#111827]" />
        </div>
        <div className="leading-tight">
          <p className="font-sora font-black text-[15px] leading-none text-white">Gerador de</p>
          <p className="font-sora font-black text-[15px] leading-none text-white/60">Propostas</p>
        </div>
      </div>

      <div className="absolute top-12 right-12">
        <DotGrid />
      </div>

      <div className="mb-8">
        <h1 className="font-sora font-black text-[52px] leading-[1.1] text-white">
          {headline}
          <br />
          <span className="text-white/60">{highlight}</span>
        </h1>
        <div className="w-10 h-[3px] bg-white/40 rounded-full mt-6 mb-6" />
        <p className="text-slate-300 text-[15px] leading-relaxed max-w-[400px]">{sub}</p>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>© 2026 Gerador de Propostas</span>
        <span>Propostas Comerciais</span>
      </div>
    </div>
  )
}