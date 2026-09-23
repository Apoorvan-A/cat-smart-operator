// A small, curated inline-SVG icon set. Hand-picked over an icon dependency so
// the bundle stays lean and every glyph matches the industrial line weight.
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...p,
});

export const IconGauge = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 13a2 2 0 1 0 0-.01" />
    <path d="m14 11 3-3" />
    <path d="M4.5 19a9 9 0 1 1 15 0" />
  </svg>
);
export const IconTasks = (p: P) => (
  <svg {...base(p)}>
    <path d="M9 6h11M9 12h11M9 18h11" />
    <path d="m3.5 6 1 1 1.5-2M3.5 12l1 1 1.5-2M3.5 18l1 1 1.5-2" />
  </svg>
);
export const IconHeart = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 20s-7-4.35-9.5-8.5C1 8.5 2.5 5 6 5c2 0 3 1.2 4 2.5C11 6.2 12 5 14 5c3.5 0 5 3.5 3.5 6.5C19 15.65 12 20 12 20Z" />
    <path d="M8.5 12h2l1-2 1.5 3 1-1H16" />
  </svg>
);
export const IconShield = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
export const IconRadar = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 12 20 5" />
    <path d="M12 3a9 9 0 1 0 9 9" />
    <path d="M12 8a4 4 0 1 0 4 4" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
  </svg>
);
export const IconAlert = (p: P) => (
  <svg {...base(p)}>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);
export const IconClipboard = (p: P) => (
  <svg {...base(p)}>
    <rect x="8" y="3" width="8" height="4" rx="1" />
    <path d="M9 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3" />
    <path d="M9 12h6M9 16h4" />
  </svg>
);
export const IconGrad = (p: P) => (
  <svg {...base(p)}>
    <path d="m12 3 9 4.5-9 4.5-9-4.5L12 3Z" />
    <path d="M21 12.5 12 17 3 12.5M21 7.5V13" />
  </svg>
);
export const IconChart = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 4v16h16" />
    <path d="M8 15v-3M12 15V8M16 15v-6" />
  </svg>
);
export const IconHandover = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 12h13M12 7l5 5-5 5" />
    <path d="M21 5v14" />
  </svg>
);
export const IconSpark = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3v3M12 18v3M5 12H2M22 12h-3M6.3 6.3 8.4 8.4M15.6 15.6l2.1 2.1M17.7 6.3l-2.1 2.1M8.4 15.6l-2.1 2.1" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
export const IconBolt = (p: P) => (
  <svg {...base(p)}>
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
  </svg>
);
export const IconFuel = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 20V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v15M3 20h12" />
    <path d="M7 9h4" />
    <path d="M14 8h2.5a1.5 1.5 0 0 1 1.5 1.5V16a2 2 0 0 0 2 2 2 2 0 0 0 2-2V9l-3-3" />
  </svg>
);
export const IconTemp = (p: P) => (
  <svg {...base(p)}>
    <path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0Z" />
    <path d="M12 9v6" />
  </svg>
);
export const IconClock = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
export const IconCheck = (p: P) => (
  <svg {...base(p)}>
    <path d="m4 12 5 5L20 6" />
  </svg>
);
export const IconX = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const IconChevron = (p: P) => (
  <svg {...base(p)}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);
export const IconLogout = (p: P) => (
  <svg {...base(p)}>
    <path d="M15 12H4M8 8l-4 4 4 4" />
    <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
  </svg>
);
export const IconSend = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 12 20 4l-6 16-3-7-7-1Z" />
  </svg>
);
export const IconSeatbelt = (p: P) => (
  <svg {...base(p)}>
    <path d="M17 4 7 20M7 4l4 7" />
    <rect x="4" y="18" width="16" height="3" rx="1" />
  </svg>
);
export const IconWorker = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="7" r="3" />
    <path d="M6 21v-1a6 6 0 0 1 12 0v1" />
  </svg>
);
export const IconTruck = (p: P) => (
  <svg {...base(p)}>
    <path d="M2 7h10v9H2zM12 10h4l3 3v3h-7" />
    <circle cx="6" cy="18" r="1.6" />
    <circle cx="16" cy="18" r="1.6" />
  </svg>
);
export const IconExcavator = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 20h16M5 20v-4h6v4" />
    <path d="M11 15 9 11l7-4 1 3" />
    <path d="M17 10c2 .5 3 2 3 4" />
    <circle cx="7" cy="18" r="1" />
  </svg>
);
export const IconInfo = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 7.5h.01" />
  </svg>
);
export const IconMenu = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
export const IconWeather = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 16a4 4 0 0 1 .5-8 5 5 0 0 1 9.5 1.5A3.5 3.5 0 0 1 16.5 16Z" />
    <path d="M8 19l-1 2M12 19l-1 2M16 19l-1 2" />
  </svg>
);
