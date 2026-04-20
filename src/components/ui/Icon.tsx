type IconProps = {
  name:
    | "arrow"
    | "calendar"
    | "check"
    | "close"
    | "mail"
    | "map"
    | "menu"
    | "phone"
    | "send"
    | "star"
    | "telegram"
    | "user"
    | "whatsapp";
  className?: string;
};

export function Icon({ name, className = "h-5 w-5" }: IconProps) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
  };

  switch (name) {
    case "arrow":
      return (
        <svg {...common}>
          <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <path d="M7 3v4M17 3v4M4.5 9.5h15M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "close":
      return (
        <svg {...common}>
          <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "mail":
      return (
        <svg {...common}>
          <path d="M4.5 7.5 12 13l7.5-5.5M6 5h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "map":
      return (
        <svg {...common}>
          <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case "menu":
      return (
        <svg {...common}>
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "phone":
      return (
        <svg {...common}>
          <path d="M8.4 5.5 6.9 4A2 2 0 0 0 4 4.1C2.8 5.5 3.1 9 6.7 12.7S13.9 16.6 15.4 15.4a2 2 0 0 0 .1-2.9L14 11a1.3 1.3 0 0 0-1.7-.1l-1.1.8a8.2 8.2 0 0 1-2.9-2.9l.8-1.1a1.3 1.3 0 0 0-.1-1.7Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "send":
      return (
        <svg {...common}>
          <path d="M20 4 9.5 14.5M20 4l-5.5 16-5-5-5.5-2L20 4Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "star":
      return (
        <svg {...common} fill="currentColor">
          <path d="m12 3 2.6 5.7 6.2.7-4.6 4.2 1.3 6.1L12 16.6l-5.5 3.1 1.3-6.1-4.6-4.2 6.2-.7L12 3Z" />
        </svg>
      );
    case "telegram":
      return (
        <svg {...common}>
          <path d="M20.5 4.5 3.8 11c-1 .4-1 1.7.1 2l4.2 1.3 1.6 4.9c.3.9 1.4 1.1 2 .4l2.4-2.7 4.3 3.1c.8.6 1.9.1 2-1l2.2-12.6c.2-1.1-.9-1.9-2.1-1.4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="m8.2 14.2 7.9-5.4-5.9 7.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "user":
      return (
        <svg {...common}>
          <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20a7.5 7.5 0 0 1 15 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg {...common}>
          <path d="M5.2 19 6 16.2A7.6 7.6 0 1 1 8.9 19L5.2 19Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9.2 8.8c.2-.5.5-.5.8-.5h.5c.2 0 .4.1.5.4l.7 1.6c.1.3.1.5-.1.7l-.4.5c-.2.2-.2.4 0 .6.5.9 1.2 1.6 2.2 2.1.2.1.4.1.6-.1l.6-.7c.2-.2.4-.3.7-.2l1.6.7c.3.1.4.3.4.6 0 .7-.4 1.4-1 1.7-.8.4-2.5.1-4.4-1.1-2-1.3-3.2-3.1-3.5-4.3-.2-.7 0-1.5.3-2Z" fill="currentColor" />
        </svg>
      );
  }
}
