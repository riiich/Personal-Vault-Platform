import type { CSSProperties } from "react";

const paths = {
  grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  folder:
    "M3 7V5a1 1 0 0 1 1-1h5l2 3h9a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z",
  home: "m3 10 9-7 9 7v10H3Z M9 20v-7h6v7",
  search: "M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Zm5.5-2 5 5",
  plus: "M12 5v14 M5 12h14",
  upload: "M12 16V3 m-5 5 5-5 5 5 M4 15v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5",
  download: "M12 3v13 m-5-5 5 5 5-5 M4 15v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5",
  chevron: "m9 5 7 7-7 7",
  down: "m6 9 6 6 6-6",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-16v6l4 2",
  star: "m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.3-5.7-3-5.7 3 1.1-6.3-4.6-4.5 6.4-.9Z",
  trash: "M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7",
  settings:
    "m9 3-1 3-3 1-2 3 2 2-1 3 2 3 3-1 2 3h3l1-3 3-1 2-3-2-2 1-3-2-3-3 1-2-3Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  sun: "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M12 2v2 M12 20v2 M2 12h2 M20 12h2 M5 5l1.5 1.5 M17.5 17.5l1.5 1.5 M5 19l1.5-1.5 M17.5 6.5l1.5-1.5",
  moon: "M20.5 14A9 9 0 0 1 10 3.5 9 9 0 1 0 20.5 14Z",
  monitor: "M3 4h18v13H3Z M8 21h8 M12 17v4",
  more: "M5 12h.01 M12 12h.01 M19 12h.01",
  close: "m6 6 12 12 M6 18 18 6",
  file: "M5 3h9l5 5v13H5Z M14 3v6h5 M8 13h8 M8 17h5",
  image: "M3 3h18v18H3Z m0 14 5-5 4 4 3-3 6 6 M8 8h.01",
  video: "M3 5h13v14H3Z m13 5 5-3v10l-5-3",
  music:
    "M9 18V5l11-2v13 M9 8l11-2 M6 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M17 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  archive: "M4 3h16v18H4Z M11 3v3h2v3h-2v3h2v3h-2v3h2",
  cube: "m12 2 10 5v10l-10 5-10-5V7Z m-10 5 10 5 10-5 M12 12v10 M7 4.5l10 5",
  sheet: "M4 3h16v18H4Z M4 9h16 M4 15h16 M10 9v12",
  tag: "M3 3h8l10 10-8 8L3 11Z M7 7h.01",
  lock: "M5 10h14v11H5Z M8 10V6a4 4 0 0 1 8 0v4 M12 14v3",
  unlock: "M5 10h14v11H5Z M8 10V6a4 4 0 0 1 7.5-2 M12 14v3",
  check: "m5 12 4 4L19 6",
  arrow: "M4 12h16 m-6-6 6 6-6 6",
  back: "M20 12H4 m6-6-6 6 6 6",
  list: "M8 5h13 M8 12h13 M8 19h13 M3 5h.01 M3 12h.01 M3 19h.01",
  info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z M12 10v7 M12 6h.01",
  edit: "m4 16 12-12 4 4L8 20H4Z M14 6l4 4",
  restore: "M3 4v6h6 M3 10a9 9 0 1 1 0 6",
  shield: "m12 2 9 4v7c0 5-9 9-9 9S3 18 3 13V6Z m-4 10 3 3 5-6",
  move: "M3 7h12 m-4-4 4 4-4 4 M9 17h12 m-4-4 4 4-4 4",
  spark: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z",
} as const;

export type IconName = keyof typeof paths;
export function Icon({
  name,
  size = 20,
  className,
  style,
}: {
  name: IconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={name === "more" ? 3.5 : 1.65}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={style}
    >
      <path d={paths[name]} />
    </svg>
  );
}
