const base = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

const make = (paths) =>
  function Icon(props) {
    return <svg {...base} {...props}>{paths}</svg>
  }

export const SearchIcon = make(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>)
export const BagIcon = make(<><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>)
export const MenuIcon = make(<path d="M3 7h18M3 12h18M3 17h18" />)
export const CloseIcon = make(<path d="M6 6l12 12M18 6 6 18" />)
export const ChevronLeft = make(<path d="m15 18-6-6 6-6" />)
export const ChevronRight = make(<path d="m9 18 6-6-6-6" />)
export const ChevronDown = make(<path d="m6 9 6 6 6-6" />)
export const PlusIcon = make(<path d="M12 5v14M5 12h14" />)
export const MinusIcon = make(<path d="M5 12h14" />)
export const TrashIcon = make(<><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13M9 7V4h6v3" /></>)
export const ClockIcon = make(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>)
export const PinIcon = make(<><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></>)
export const TruckIcon = make(<><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></>)
export const InstagramIcon = make(<><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".6" fill="currentColor" /></>)

export function WhatsAppIcon({ width = 22, height = 22, ...props }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.12-.27-.2-.57-.35M12.04 21.5h-.01a9.45 9.45 0 0 1-4.82-1.32l-.35-.2-3.58.93.96-3.49-.23-.36a9.43 9.43 0 0 1-1.45-5.03c0-5.22 4.25-9.47 9.48-9.47a9.4 9.4 0 0 1 6.7 2.78 9.4 9.4 0 0 1 2.77 6.7c0 5.22-4.25 9.46-9.47 9.46M20.1 3.9A11.32 11.32 0 0 0 12.04.55C5.76.55.65 5.66.65 11.94c0 2.01.52 3.97 1.52 5.7L.55 23.45l5.95-1.56a11.36 11.36 0 0 0 5.54 1.41h.01c6.28 0 11.39-5.11 11.39-11.39 0-3.04-1.19-5.9-3.34-8.05" />
    </svg>
  )
}

export function Stars({ value = 5, className = '' }) {
  return (
    <span className={`inline-flex gap-0.5 ${className}`} role="img" aria-label={`${value} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i <= value ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.4" aria-hidden>
          <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
        </svg>
      ))}
    </span>
  )
}

// ─── Icônes de l'admin ─────────────────────────────────────────
export const HomeIcon = make(<><path d="M4 11 12 4l8 7" /><path d="M6 10v10h12V10" /></>)
export const ReceiptIcon = make(<><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 8h6M9 12h6" /></>)
export const TagIcon = make(<><path d="M3 12V4h8l9 9-8 8-9-9Z" /><circle cx="7.5" cy="8" r="1.3" /></>)
export const GiftIcon = make(<><rect x="3" y="8" width="18" height="5" /><path d="M5 13v8h14v-8M12 8v13" /><path d="M12 8S10 3 7.5 4.5 9 8 12 8Zm0 0s2-5 4.5-3.5S15 8 12 8Z" /></>)
export const PercentIcon = make(<><path d="M19 5 5 19" /><circle cx="7" cy="7" r="2.5" /><circle cx="17" cy="17" r="2.5" /></>)
export const LeafIcon = make(<><path d="M5 19C5 10 10 5 20 4c-1 10-6 15-15 15Z" /><path d="M5 19 13 11" /></>)
export const BookIcon = make(<><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z" /><path d="M4 19a2 2 0 0 1 2-2h13" /></>)
export const StarIcon = make(<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />)
export const HelpIcon = make(<><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7" /><circle cx="12" cy="17" r=".6" fill="currentColor" /></>)
export const ChartIcon = make(<><path d="M4 20h16" /><path d="M7 16v-5M12 16V7M17 16v-8" /></>)
export const GearIcon = make(<><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" /></>)
export const ExternalIcon = make(<><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v6H4V6h6" /></>)
export const LogoutIcon = make(<><path d="M15 4h4v16h-4" /><path d="M10 8l-4 4 4 4M6 12h10" /></>)
export const ArrowUpRight = make(<path d="M7 17 17 7M8 7h9v9" />)
export const FolderIcon = make(<path d="M3 6h6l2 2h10v11H3V6Z" />)
