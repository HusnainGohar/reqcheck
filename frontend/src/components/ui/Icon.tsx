import * as React from 'react';

export const iconPaths = {
  chevron: 'M6 9l6 6 6-6',
  overview: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  folder: 'M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z',
  document: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 12h8 M8 16h6',
  edit: 'M12 20H4v-8 M16 3l5 5 M8 16l1-5L18 2l4 4-9 9z',
  chart: 'M4 3v18h17 M8 17v-5 M13 17V7 M18 17V4',
  plus: 'M12 5v14 M5 12h14',
  check: 'M5 12l4 4L19 6',
  close: 'M6 6l12 12 M18 6L6 18',
  upload: 'M12 16V3 M7 8l5-5 5 5 M4 15v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5',
  download: 'M12 3v13 M7 11l5 5 5-5 M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4',
  search: 'M21 21l-6-6 M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
  trash: 'M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7',
  save: 'M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5z M7 3v6h10V3 M7 21v-8h10v8',
  split: 'M12 21v-9 M12 12L5 5 M12 12l7-7 M5 10V5h5 M14 5h5v5',
  merge: 'M5 21v-4l7-7 7 7v4 M12 10V3 M7 8l5-5 5 5',
  warning: 'M12 3L2 21h20z M12 9v5 M12 17v1',
  info: 'M12 16v-4 M12 8v-1 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  shield: 'M12 2l9 4v6c0 5-9 10-9 10S3 17 3 12V6z M8 12l3 3 5-6',
  user: 'M20 21v-2a7 7 0 0 0-14 0v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  eyeOff: 'M3 3l18 18 M10 5a12 12 0 0 1 12 7s-1 2-3 4 M6 6a20 20 0 0 0-4 6s4 7 10 7a12 12 0 0 0 5-1 M10 10a3 3 0 0 0 4 4',
  play: 'M8 4l12 8-12 8z',
  arrow: 'M4 12h16 M14 6l6 6-6 6',
  clock: 'M12 6v6l4 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
};

export function Icon(props: { name: keyof typeof iconPaths; size?: number }) {
  return (
    <svg className="ui-icon" width={props.size || 18} height={props.size || 18}
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={iconPaths[props.name]} />
    </svg>
  );
}
