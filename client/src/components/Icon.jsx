const ICONS = {
  sparkles: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" /><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18M8 14h3M8 17h7" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />,
  rotate: <><path d="M20 7v5h-5" /><path d="M19 12a7 7 0 1 0 1.1 3.8M20 12a8 8 0 0 0-13.7-5.7L5 7.5" /></>,
  lightbulb: <><path d="M9 18h6M10 22h4M8 14a6 6 0 1 1 8 0c-.8.7-1 1.3-1 2H9c0-.7-.2-1.3-1-2Z" /></>,
  bolt: <path d="m13 2-9 12h7l-1 8 10-13h-7l1-7Z" />,
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z" /><path d="M4 17a2.5 2.5 0 0 1 2.5-2.5H20M8 7h8M8 10h6" /></>,
  graduation: <><path d="m2 10 10-6 10 6-10 6-10-6Z" /><path d="M6 12.5V17c3.5 2.7 8.5 2.7 12 0v-4.5M22 10v6" /></>,
  link: <><path d="M10 13a5 5 0 0 0 7.1 0l3-3A5 5 0 0 0 13 2.9l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.1 0l-3 3A5 5 0 0 0 11 21.1l1.7-1.7" /></>,
  edit: <><path d="m14 5 5 5M4 20l4.5-1 11-11a2.1 2.1 0 0 0-3-3l-11 11L4 20Z" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></>,
  folder: <path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z" />,
  video: <><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3" /></>,
  message: <><path d="M21 11.5a8.5 8.5 0 0 1-12.7 7.4L3 20l1.1-4.6A8.5 8.5 0 1 1 21 11.5Z" /><path d="M8 11h8M8 14h5" /></>,
  thumbsUp: <><path d="M7 10v10H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h3ZM7 20h9a3 3 0 0 0 2.9-2.2l1.5-5A2.2 2.2 0 0 0 18.3 10H14l.7-3.2A2.3 2.3 0 0 0 12.5 4L7 10v10Z" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  alert: <><path d="m12 3 10 18H2L12 3Z" /><path d="M12 9v5M12 17h.01" /></>,
};

export default function Icon({ name, className = '', size = '1em' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[name] || ICONS.sparkles}
    </svg>
  );
}
