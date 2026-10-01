// "Twinkle Twinkle Little Star" as a tiny synthesized music box — no audio files needed.
const C = 523.25
const D = 587.33
const E = 659.25
const F = 698.46
const G = 783.99
const A = 880
const _ = 0

const MELODY = [
  C, C, G, G, A, A, G, _, F, F, E, E, D, D, C, _,
  G, G, F, F, E, E, D, _, G, G, F, F, E, E, D, _,
]

export function scheduleMusicBox(ctx: AudioContext, out: AudioNode, start: number, duration: number) {
  const master = ctx.createGain()
  master.gain.setValueAtTime(0.9, start)
  master.gain.setValueAtTime(0.9, Math.max(start, start + duration - 1.5))
  master.gain.linearRampToValueAtTime(0.0001, start + duration)
  master.connect(out)

  const beat = 0.42
  for (let i = 0, t = start + 0.1; t < start + duration - 1; i++, t += beat) {
    const f = MELODY[i % MELODY.length]
    if (!f) continue
    for (const [mult, vol, type] of [
      [1, 0.2, 'sine'],
      [2, 0.05, 'triangle'],
    ] as const) {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = type
      osc.frequency.value = f * mult
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(vol, t + 0.015)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1)
      osc.connect(g).connect(master)
      osc.start(t)
      osc.stop(t + 1.15)
    }
  }
}
