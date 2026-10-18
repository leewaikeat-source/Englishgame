export const avatars = [
  { id: 'sky', name: 'Captain Sky', power: 'A little courage. A clearer sky.', color: '#e7eefb' },
  { id: 'wind', name: 'Wind Warrior', power: 'Small actions. A mighty breeze.', color: '#e8f3ec' },
  { id: 'sun', name: 'Sunshine Star', power: 'Let your bright ideas shine.', color: '#fff0d0' },
  { id: 'eco', name: 'Eco Guardian', power: 'Protect our planet, together.', color: '#eee8f6' },
] as const;
export type AvatarId = typeof avatars[number]['id'];
export const asset = (id: AvatarId) => `${import.meta.env.BASE_URL}avatars/${id}.svg`;
export interface Question { id: number; text: string; answer: string; distractors: [string, string]; malay: string; example: string; note: string }
export const questions: Question[] = [
  { id: 1, text: '________ is the act of burning rubbish or waste outdoors.', answer: 'Open burning', distractors: ['Eye irritation', 'Stay hydrated'], malay: 'pembakaran terbuka', example: 'Open burning pollutes the air.', note: 'Burning waste outside releases smoke into the air.' },
  { id: 2, text: '________ can spread quickly and produce a lot of smoke.', answer: 'Forest fires', distractors: ['Face masks', 'Clear skies'], malay: 'kebakaran hutan', example: 'Forest fires can spread quickly and produce a lot of smoke.', note: 'These fires burn trees and other plants in a forest.' },
  { id: 3, text: 'Smoke from fires can cause serious ________.', answer: 'Air pollution', distractors: ['Clean water', 'Fresh food'], malay: 'pencemaran udara', example: 'Smoke from fires can cause serious air pollution.', note: 'Air pollution means harmful substances in the air.' },
  { id: 4, text: 'People may ________ if they cannot get enough air to breathe.', answer: 'Suffocate', distractors: ['Celebrate', 'Recycle'], malay: 'lemas akibat tidak dapat bernafas', example: 'People may suffocate if they cannot get enough air to breathe.', note: 'Suffocate means being unable to breathe. It does not mean just coughing or having mild breathing difficulty.' },
  { id: 5, text: 'Haze reduces ________, making it difficult for drivers to see the road.', answer: 'Visibility', distractors: ['Temperature', 'Homework'], malay: 'jarak penglihatan', example: 'Haze reduces visibility, making it difficult for drivers to see the road.', note: 'Visibility means how far or how clearly you can see.' },
  { id: 6, text: 'Breathing polluted air can cause ________, especially for people with asthma.', answer: 'Respiratory problems', distractors: ['Good eyesight', 'Strong muscles'], malay: 'masalah pernafasan', example: 'Breathing polluted air can cause respiratory problems, especially for people with asthma.', note: 'These are problems affecting breathing and the lungs.' },
  { id: 7, text: 'Red, sore and itchy eyes are signs of ________.', answer: 'Eye irritation', distractors: ['Forest fires', 'Open burning'], malay: 'kerengsaan mata', example: 'Red, sore and itchy eyes are signs of eye irritation.', note: 'Smoke can make your eyes feel sore and itchy.' },
  { id: 8, text: 'During severe haze, we should ________ and avoid unnecessary outdoor activities.', answer: 'Stay indoors', distractors: ['Play outdoors', 'Burn rubbish'], malay: 'berada di dalam rumah', example: 'During severe haze, we should stay indoors and avoid unnecessary outdoor activities.', note: 'Stay inside and follow local health advice during severe haze.' },
  { id: 9, text: 'If we must go outside during haze, we should ________ using a properly fitted N95 respirator when appropriate.', answer: 'Wear a face mask', distractors: ['Light a fire', 'Open all windows'], malay: 'memakai pelitup muka', example: 'If we must go outside during haze, we should wear a face mask using a properly fitted N95 respirator when appropriate.', note: 'Ordinary cloth masks do not offer the same smoke-particle protection as a properly fitted N95 respirator.' },
  { id: 10, text: 'We should drink enough water to ________.', answer: 'Stay hydrated', distractors: ['Cause pollution', 'Reduce visibility'], malay: 'minum air secukupnya', example: 'We should drink enough water to stay hydrated.', note: 'Water keeps your body hydrated. Water alone does not protect your lungs from haze.' },
];
export function shuffle<T>(items: readonly T[], random = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
export function points(correct: boolean, ms: number): number {
  return correct ? 100 + Math.floor(20 * Math.max(0, 1 - Math.max(0, ms) / 30000)) : 0;
}
export interface Outcome { questionId: number; selected: string; correct: boolean; ms: number; points: number }
export interface Session { version: 1; id: string; name: string; className: string; avatar: AvatarId; options: string[][]; outcomes: Outcome[]; currentMs: number; phase: 'instructions' | 'playing' | 'feedback' | 'result'; completedAt?: string; ownerUid?: string }
export function validName(value: string) { return /^[\p{L}\p{M}\p{N} ._'’\-]{2,30}$/u.test(value.trim()) && /[\p{L}\p{N}]/u.test(value); }
export function newSession(name: string, className: string, avatar: AvatarId): Session {
  return { version: 1, id: crypto.randomUUID(), name: name.trim(), className: className.trim(), avatar, options: questions.map(q => shuffle([q.answer, ...q.distractors])), outcomes: [], currentMs: 0, phase: 'instructions' };
}
export function stats(session: Pick<Session, 'outcomes'>) {
  const correct = session.outcomes.filter(o => o.correct).length;
  return { correct, score: session.outcomes.reduce((n, o) => n + o.points, 0), answerMs: Math.round(session.outcomes.reduce((n, o) => n + o.ms, 0)), accuracy: session.outcomes.length ? Math.round(correct / session.outcomes.length * 100) : 0, cleared: correct * 10, haze: 100 - correct * 10, perfect: session.outcomes.length === 10 && correct === 10 };
}
export function answer(session: Session, selected: string, elapsed: number): Session {
  if (session.phase !== 'playing' || session.outcomes.length >= 10) return session;
  const question = questions[session.outcomes.length];
  if (!session.options[session.outcomes.length].includes(selected)) return session;
  const ms = Math.max(0, Math.round(elapsed));
  const correct = selected === question.answer;
  return { ...session, currentMs: ms, phase: 'feedback', outcomes: [...session.outcomes, { questionId: question.id, selected, correct, ms, points: points(correct, ms) }] };
}
export function advance(session: Session): Session {
  if (session.phase !== 'feedback') return session;
  return { ...session, phase: session.outcomes.length === 10 ? 'result' : 'playing', currentMs: 0, ...(session.outcomes.length === 10 ? { completedAt: new Date().toISOString() } : {}) };
}
export function compareResults(a: { correct: number; score: number; answerMs: number }, b: { correct: number; score: number; answerMs: number }) { return b.correct - a.correct || b.score - a.score || a.answerMs - b.answerMs; }
export const duration = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
export const localDate = (value: string) => new Intl.DateTimeFormat('en-MY', { timeZone: 'Asia/Kuala_Lumpur', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
// Local storage is convenience, never a trusted source for ranking.
export function restore(raw: string | null): Session | null {
  try {
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    if (s.version !== 1 || !/^[a-f0-9-]{36}$/.test(s.id) || !validName(s.name) || typeof s.className !== 'string' || s.className.length > 40 || !avatars.some(a => a.id === s.avatar) || !['instructions', 'playing', 'feedback', 'result'].includes(s.phase) || !Number.isFinite(s.currentMs) || s.currentMs < 0 || !Array.isArray(s.outcomes) || s.outcomes.length > 10 || !Array.isArray(s.options) || s.options.length !== 10) return null;
    if (s.options.some((opts, i) => !Array.isArray(opts) || opts.length !== 3 || new Set(opts).size !== 3 || opts.some(o => ![questions[i].answer, ...questions[i].distractors].includes(o)))) return null;
    if (s.outcomes.some((o, i) => o.questionId !== questions[i].id || !s.options[i].includes(o.selected) || !Number.isFinite(o.ms) || o.ms < 0 || o.correct !== (o.selected === questions[i].answer) || o.points !== points(o.correct, o.ms))) return null;
    if ((s.phase === 'instructions' && s.outcomes.length !== 0) || (s.phase === 'playing' && s.outcomes.length >= 10) || (s.phase === 'feedback' && !s.outcomes.length) || (s.phase === 'result' && (s.outcomes.length !== 10 || !s.completedAt || !Number.isFinite(Date.parse(s.completedAt))))) return null;
    return s;
  } catch { return null; }
}
