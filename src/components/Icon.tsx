const paths = {
  sun: "M12 4V2m0 20v-2m8-8h2M2 12h2m13.66-5.66 1.41-1.41M4.93 19.07l1.41-1.41m0-11.32L4.93 4.93m14.14 14.14-1.41-1.41M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  moon: "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z",
  pin: "m15 4 5 5-3 1-3 3-1 4-3-3-5 5m5-5-3-3 4-1 3-3 1-3",
  swap: "M7 7h13m0 0-3-3m3 3-3 3M17 17H4m0 0 3 3m-3-3 3-3",
  copy: "M9 9h10v11H9zM5 15V4h10",
  check: "m5 12 4.5 4.5L19 7",
  arrow: "M5 12h14m0 0-5-5m5 5-5 5",
  back: "M19 12H5m0 0 5-5m-5 5 5 5",
  refresh: "M20 11a8 8 0 0 0-14.5-4M4 4v3.5h3.5M4 13a8 8 0 0 0 14.5 4M20 20v-3.5h-3.5",
} as const;

/** A decorative stroke icon; the control it sits in carries the accessible name. */
export function Icon({ name, size = 18 }: { name: keyof typeof paths; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
}
