import { asset, avatars, duration, localDate, stats, type Session } from './game';
export async function downloadCertificate(session: Session) {
  const canvas = document.createElement('canvas'); canvas.width = 1000; canvas.height = 1200;
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('PNG export is unavailable in this browser. Please take a screenshot.');
  const avatar = new Image(); avatar.src = asset(session.avatar); await avatar.decode();
  const result = stats(session);
  ctx.fillStyle = '#f7f5ee'; ctx.fillRect(0, 0, 1000, 1200);
  ctx.strokeStyle = '#2d6b5d'; ctx.lineWidth = 6; ctx.strokeRect(25, 25, 950, 1150);
  const text = (value: string, y: number, size = 30, color = '#203a38') => { ctx.fillStyle = color; ctx.font = `bold ${size}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(value, 500, y, 890); };
  text('HAZE HEROES', 105, 52); text('MISSION CLEAR SKY • MISSION CERTIFICATE', 150, 24);
  ctx.drawImage(avatar, 410, 182, 180, 200);
  text(result.perfect ? 'THANK YOU, HAZE HERO!' : 'GOOD EFFORT, HAZE HERO!', 425, 34);
  text(session.name, 490, 48); text(`${avatars.find(a => a.id === session.avatar)!.name}${session.className ? ' · ' + session.className : ''}`, 535, 26);
  text(`${result.correct}/10 correct   •   ${result.score}/1200 points`, 625, 39);
  text(`${result.accuracy}% accuracy   •   ${duration(result.answerMs)} answer time`, 690, 30);
  text(`${result.cleared}% haze cleared`, 765, 45, '#2d6b5d');
  ctx.fillStyle = '#dee5db'; ctx.fillRect(120, 800, 760, 20); ctx.fillStyle = '#2d6b5d'; ctx.fillRect(120, 800, 760 * result.cleared / 100, 20);
  text(result.perfect ? 'You have helped clear the sky!' : 'You helped make the sky clearer. Keep learning!', 910, 28);
  text(localDate(session.completedAt!) + ' MYT', 1000, 24);
  text('Keep learning. Small actions make a big difference.', 1085, 24);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('Please use a screenshot instead.')), 'image/png'));
  const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `haze-heroes-${session.id}.png`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
