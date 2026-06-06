// ============================================================
// Anima Pulse — icon set (ported from prototype components.jsx)
// Minimal stroked icons, 24 viewBox.
// ============================================================
import type { ReactNode } from 'react';

export const Icon = ({ d, size = 18, fill = 'none', stroke = 'currentColor' }: { d: ReactNode; size?: number; fill?: string; stroke?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);

export const I: Record<string, ReactNode> = {
  home: <Icon d={<><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v10h14V10" /></>} />,
  pulse: <Icon d={<path d="M3 12h4l2-6 4 12 2-6h6" />} />,
  team: <Icon d={<><circle cx="9" cy="9" r="3" /><path d="M2 20c1-3.5 4-5 7-5s6 1.5 7 5" /><circle cx="17" cy="7" r="2.5" /><path d="M16 13c2 .5 4 2 5 5" /></>} />,
  kol: <Icon d={<><circle cx="12" cy="8" r="3.5" /><path d="M5 20c1-4 4-6 7-6s6 2 7 6" /><circle cx="18" cy="5" r="1.5" /></>} />,
  vault: <Icon d={<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18" /><path d="M9 14l2 2 4-4" /></>} />,
  settings: <Icon d={<><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.4.7a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.4a7 7 0 0 0-2 1.2l-2.4-.7-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-.7a7 7 0 0 0 2 1.2L10 21h4l.5-2.4a7 7 0 0 0 2-1.2l2.4.7 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z" /></>} />,
  plus: <Icon d={<path d="M12 5v14M5 12h14" />} />,
  check: <Icon d={<path d="M4 12l5 5L20 6" />} />,
  arrow: <Icon d={<path d="M5 12h14M13 5l7 7-7 7" />} />,
  arrowUp: <Icon d={<path d="M12 19V5M5 12l7-7 7 7" />} />,
  arrowDn: <Icon d={<path d="M12 5v14M5 12l7 7 7-7" />} />,
  clock: <Icon d={<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>} />,
  search: <Icon d={<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>} />,
  filter: <Icon d={<path d="M3 5h18M6 12h12M10 19h4" />} />,
  download: <Icon d={<><path d="M12 4v12" /><path d="m7 11 5 5 5-5" /><path d="M5 20h14" /></>} />,
  more: <Icon d={<><circle cx="5" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="19" cy="12" r="1.4" /></>} />,
  external: <Icon d={<><path d="M14 4h6v6" /><path d="M20 4 10 14" /><path d="M14 20H6a2 2 0 0 1-2-2v-8" /></>} />,
  tiktok: <Icon d={<path d="M14 4v9.5a3.5 3.5 0 1 1-3.5-3.5" />} />,
  ig: <Icon d={<><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17" cy="7" r=".8" fill="currentColor" /></>} />,
  user: <Icon d={<><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></>} />,
  trending: <Icon d={<><path d="M3 17 10 10l4 4 7-7" /><path d="M14 7h7v7" /></>} />,
  flag: <Icon d={<><path d="M4 21V4h12l-2 4 2 4H4" /></>} />,
  close: <Icon d={<path d="M6 6l12 12M18 6 6 18" />} />,
  menu: <Icon d={<path d="M4 6h16M4 12h16M4 18h16" />} />,
  link: <Icon d={<><path d="M10 14a4 4 0 0 1 0-5.6l3-3a4 4 0 0 1 5.6 5.6L17 12" /><path d="M14 10a4 4 0 0 1 0 5.6l-3 3a4 4 0 1 1-5.6-5.6L7 12" /></>} />,
  copy: <Icon d={<><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M4 16V6a2 2 0 0 1 2-2h10" /></>} />,
  bell: <Icon d={<><path d="M6 10a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10 20a2 2 0 0 0 4 0" /></>} />,
  logout: <Icon d={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></>} />,
};
