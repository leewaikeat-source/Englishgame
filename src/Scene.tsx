import type { CSSProperties } from 'react';
export default function Scene({ cleared = 0, compact = false }: { cleared?: number; compact?: boolean }) {
  return <div className={`scene ${compact ? 'scene-compact' : ''}`} style={{ '--clear': cleared / 100, '--fog': 1 - cleared / 100 } as CSSProperties} role="img" aria-label={`Illustrated fictional Malaysian city. ${cleared}% of haze cleared.`}>
    <svg viewBox="0 0 1000 380" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs><linearGradient id="sky" x2="0" y2="1"><stop stopColor="#9cdaed"/><stop offset="1" stopColor="#e4f4e6"/></linearGradient><linearGradient id="fog" x2="0" y2="1"><stop stopColor="#aab7b9"/><stop offset="1" stopColor="#d1d7ce"/></linearGradient><pattern id="windows" width="25" height="30" patternUnits="userSpaceOnUse"><rect x="8" y="8" width="9" height="14" rx="2" fill="#e5f4dc"/></pattern></defs>
      <path fill="url(#sky)" d="M0 0H1000V380H0Z"/>
      <g className="sun"><circle cx="792" cy="83" r="62" fill="#fff2b1" opacity=".4"/><circle cx="792" cy="83" r="40" fill="#ffdf7a"/><g stroke="#fff0ae" strokeWidth="5" strokeLinecap="round"><path d="M792 17V5M792 149V160M726 83H714M858 83H870M745 36L737 28M839 130L848 139M839 36L848 27M745 130L736 139"/></g></g>
      <g fill="#fff" opacity=".65"><path d="M80 82Q80 62 105 63Q118 35 146 58Q174 48 181 77Q205 78 209 93H70Z"/><path d="M557 72Q562 47 590 55Q603 34 626 58Q654 56 660 81H549Z"/></g>
      <path d="M0 269Q120 210 230 257Q360 195 490 260Q700 211 1000 254V380H0" fill="#a3c4b7"/>
      <g fill="#89a9ac"><path d="M29 160H105V319H29ZM115 194H182V320H115ZM213 118H290V323H213ZM310 176H372V330H310ZM637 163H697V324H637ZM710 123H791V330H710ZM810 183H871V330H810ZM886 142H960V330H886Z"/><path d="M245 72H252V122H245ZM741 75H751V125H741Z"/></g>
      <g fill="url(#windows)"><path d="M34 165H100V310H34ZM218 124H285V315H218ZM715 131H785V320H715ZM892 149H955V320H892Z"/></g>
      <path d="M0 329Q500 303 1000 329V380H0" fill="#91b58c"/>
      <g><path d="M351 247H635V341H351Z" fill="#f7ecd1"/><path d="M336 249L376 219H611L649 249Z" fill="#bc7961"/><path d="M451 217H534V342H451Z" fill="#ffefd5"/><path d="M440 219L492 177L545 219Z" fill="#af6554"/><rect x="464" y="241" width="56" height="16" rx="3" fill="#365a59"/><text x="492" y="253" textAnchor="middle" fill="#fff7d9" fontFamily="sans-serif" fontSize="10" fontWeight="bold">SEKOLAH</text><path d="M479 294H508V342H479Z" fill="#547b78"/><g fill="#7caaa4"><path d="M369 267H392V286H369ZM408 267H431V286H408ZM551 267H574V286H551ZM590 267H613V286H590ZM369 303H392V322H369ZM408 303H431V322H408ZM551 303H574V322H551ZM590 303H613V322H590Z"/></g><path d="M492 177V152" stroke="#46666a" strokeWidth="3"/><path d="M494 153H518L512 164H494Z" fill="#e9b04b"/></g>
      <path d="M481 342H505L545 380H438Z" fill="#d8d1b5"/>
      {[80, 177, 310, 675, 844, 943].map((x, i) => <g key={x} transform={`translate(${x},${i % 2 ? 304 : 325})`}><path d="M0 0V34" stroke="#6d7760" strokeWidth="9"/><ellipse cy="-14" rx="27" ry="37" fill={i % 2 ? '#558c75' : '#75a076'}/><path d="M0 8V-22M0 0L-12 -9M0 -9L12 -20" stroke="#487663" strokeWidth="3" fill="none"/></g>)}
      <g className="fog-layer"><path d="M0 0H1000V380H0Z" fill="url(#fog)" opacity=".88"/><g className="fog-drift" fill="#e4e7df" opacity=".6"><ellipse cx="150" cy="182" rx="280" ry="57"/><ellipse cx="730" cy="260" rx="380" ry="45"/><ellipse cx="430" cy="84" rx="320" ry="40"/></g></g>
      <g className="birds" fill="none" stroke="#416b75" strokeWidth="2.5" strokeLinecap="round"><path d="M380 79q9 -9 18 0q9 -9 18 0M427 101q7 -7 14 0q7 -7 14 0"/></g>
    </svg>
    <span className="scene-caption"><span className="status-dot"/> FICTIONAL CITY · REAL-WORLD LEARNING</span>
    <div className="scene-meter"><span>{100 - cleared}%</span> haze remaining <i><b style={{ width: `${100 - cleared}%` }}/></i></div>
  </div>;
}
