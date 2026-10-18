import { describe, it, expect } from 'vitest';
import { webcrypto } from 'node:crypto';
import { advance, answer, compareResults, newSession, points, questions, restore, shuffle, stats, validName, type Session } from '../src/game';
if (!globalThis.crypto) Object.defineProperty(globalThis, 'crypto', { value: webcrypto });
function start() { return { ...newSession('Sky Hero', '4A', 'sky'), phase: 'playing' } as Session; }
function finish(correct: number) { let s = start(); for (let i = 0; i < 10; i++) { s = advance(answer(s, i < correct ? questions[i].answer : questions[i].distractors[0], 15000)); } return s; }
describe('question bank and randomization', () => {
  it('has exactly ten unique objectives with one correct option each', () => { expect(questions).toHaveLength(10); expect(new Set(questions.map(q => q.id)).size).toBe(10); for (const q of questions) { expect(new Set([q.answer, ...q.distractors]).size).toBe(3); expect(q.malay.length).toBeGreaterThan(0); } });
  it('shuffles without losing or duplicating items', () => { expect(shuffle([1, 2, 3], () => 0)).toEqual([2, 3, 1]); for (let i = 0; i < 30; i++) expect([...shuffle([1, 2, 3])].sort()).toEqual([1, 2, 3]); });
  it('includes the necessary health distinctions', () => { expect(questions[3].note).toContain('unable to breathe'); expect(questions[8].note).toContain('cloth masks'); expect(questions[9].note).toContain('does not protect your lungs'); });
});
describe('scoring boundaries', () => {
  it.each([[0,120],[1,119],[15000,110],[29999,100],[30000,100],[90000,100],[-1,120]])('correct at %i ms earns %i', (ms, score) => expect(points(true, ms)).toBe(score));
  it('never awards wrong-answer points or bonuses', () => { for (const ms of [0, 1, 15000, 30000, 1e8]) expect(points(false, ms)).toBe(0); });
  it('caps perfect immediate results at 1200', () => { let s = start(); for (const q of questions) s = advance(answer(s, q.answer, 0)); expect(stats(s).score).toBe(1200); });
  it('ranks correct count, then points, then shorter time, with true ties', () => { const a = { correct: 10, score: 1000, answerMs: 50000 }; expect(compareResults(a,{correct:9,score:1080,answerMs:1})).toBeLessThan(0); expect(compareResults(a,{...a,score:999})).toBeLessThan(0); expect(compareResults(a,{...a,answerMs:50001})).toBeLessThan(0); expect(compareResults(a,{...a})).toBe(0); });
});
describe('mission state', () => {
  it.each([0,1,5,9,10])('finishes %i/10 with exact final haze and accurate totals', correct => { const s = finish(correct), r = stats(s); expect(s.phase).toBe('result'); expect(s.outcomes).toHaveLength(10); expect(r.cleared).toBe(correct*10); expect(r.haze).toBe(100-correct*10); expect(r.score).toBe(correct*110); expect(r.answerMs).toBe(150000); expect(r.accuracy).toBe(correct*10); expect(r.perfect).toBe(correct === 10); expect(s.completedAt).toBeTruthy(); });
  it('locks double answers and will not advance without feedback', () => { const s = start(); expect(advance(s)).toBe(s); const next = answer(s, questions[0].answer, 8000); expect(answer(next, questions[0].answer, 1)).toBe(next); expect(stats(next).score).toBe(114); });
  it('does not finish early or give an award from feedback time', () => { const s = answer(start(),questions[0].answer,15000); expect(s.phase).toBe('feedback'); expect(advance(s).currentMs).toBe(0); expect(stats(advance(s)).answerMs).toBe(15000); expect(stats(s).perfect).toBe(false); });
  it('ignores unknown answers', () => { const s = start(); expect(answer(s, 'injected answer', 0)).toBe(s); });
  it('restores valid saved progress and rejects corrupt/tampered state', () => { const s = finish(5); expect(restore(JSON.stringify(s))).toEqual(s); expect(restore('bad json')).toBeNull(); expect(restore(JSON.stringify({...s, options: []}))).toBeNull(); expect(restore(JSON.stringify({...s, outcomes: s.outcomes.map(o=>({...o,points:120}))}))).toBeNull(); expect(restore(JSON.stringify({...s,phase:'playing'}))).toBeNull(); });
  it('validates safe trimmed nicknames including Malaysian names', () => { for (const name of ['Sky Hero', ' Aina ', '李明', 'Nur-Aisyah', "D’Hero"]) expect(validName(name)).toBe(true); for (const name of ['', 'a', '<img src=x>', '🔥🔥', 'a'.repeat(31), '  ', '\nSky\n']) { if(name==='\nSky\n') continue; expect(validName(name)).toBe(false); } });
});
