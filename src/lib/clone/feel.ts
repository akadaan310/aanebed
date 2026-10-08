/**
 * Event → sound, speech, touch. Each cue is tied to a real event in the
 * chain; nothing plays on a timer. All three degrade silently: no audio
 * permission, no speech, no vibration motor — the screen still says it all.
 */
import { soundOn } from "../v6/sound";

export type Feel = "emerge" | "opened" | "arrive" | "resolve" | "branch" | "error" | "tap";
const TONES: Record<Feel, { f: number[]; wave: OscillatorType; gain: number; len: number }> = {
  emerge: { f: [55, 82.4, 110], wave: "sine", gain: 0.06, len: 1.6 },
  opened: { f: [220, 277.2], wave: "sine", gain: 0.035, len: 0.5 },
  arrive: { f: [330, 415.3, 494], wave: "triangle", gain: 0.04, len: 0.8 },
  resolve: { f: [261.6, 329.6, 392, 523.3], wave: "sine", gain: 0.05, len: 1.4 },
  branch: { f: [392, 587.3], wave: "sine", gain: 0.035, len: 0.6 },
  error: { f: [233.1, 246.9], wave: "sawtooth", gain: 0.015, len: 0.5 },
  tap: { f: [880], wave: "sine", gain: 0.02, len: 0.12 },
};
const BUZZ: Record<Feel, number[]> = { emerge: [18], opened: [10], arrive: [20, 60, 20], resolve: [30, 50, 30, 50, 80], branch: [15, 40, 15], error: [60], tap: [6] };
let ctx: AudioContext | null = null;

const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export function feel(kind: Feel, say?: string) {
  if (typeof window === "undefined") return;
  try { if (navigator.vibrate && !reduced()) navigator.vibrate(BUZZ[kind]); } catch { /* no haptics */ }
  if (!soundOn()) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    const t = TONES[kind], t0 = ctx.currentTime;
    t.f.forEach((f, i) => {
      const o = ctx!.createOscillator(), g = ctx!.createGain(), p = ctx!.createStereoPanner();
      o.type = t.wave; o.frequency.value = f; p.pan.value = (i - (t.f.length - 1) / 2) * 0.3;
      const s = t0 + i * (kind === "emerge" ? 0.25 : 0.09);
      g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(t.gain, s + Math.min(0.3, t.len / 4)); g.gain.exponentialRampToValueAtTime(0.0001, s + t.len);
      o.connect(g).connect(p).connect(ctx!.destination); o.start(s); o.stop(s + t.len + 0.05);
    });
  } catch { /* no audio */ }
  if (say) { try { const u = new SpeechSynthesisUtterance(say); u.rate = 0.95; u.pitch = 0.9; u.volume = 0.8; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch { /* no speech */ } }
}

/** Clones this browser started (cache only: the server is the authority). Owner keys never leave this browser except to delete. */
export const OWN_KEY = "pearls.clones.v1";
export interface Own { token: string; owner_key: string; created_at: string; parent?: string | null }
export function readOwn(): Own[] { try { const v = JSON.parse(localStorage.getItem(OWN_KEY) ?? "[]"); return Array.isArray(v) ? v.filter((x) => x && typeof x.token === "string") : []; } catch { return []; } }
export function addOwn(o: Own) { try { localStorage.setItem(OWN_KEY, JSON.stringify([...readOwn().filter((x) => x.token !== o.token), o].slice(-100))); } catch { /* private mode */ } }
export function dropOwn(token: string) { try { localStorage.setItem(OWN_KEY, JSON.stringify(readOwn().filter((x) => x.token !== token))); } catch { /* ignore */ } }
