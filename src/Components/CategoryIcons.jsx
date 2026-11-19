// Category illustrated SVG icons matching BookMyShow design
export function MovieIcon({ className = "cat-svg-icon" }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="34" height="34">
      {/* Background circle */}
      <circle cx="20" cy="20" r="19" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="1" />
      {/* Clapperboard Body */}
      <rect x="9" y="15" width="22" height="15" rx="2.5" fill="#1E293B" />
      {/* Bottom lines */}
      <rect x="12" y="21" width="7" height="2" rx="1" fill="#64748B" />
      <rect x="12" y="25" width="16" height="2" rx="1" fill="#475569" />
      <circle cx="26" cy="22" r="2" fill="#E11D48" />
      {/* Top Clapper Bar */}
      <g transform="rotate(-6 9 14)">
        <rect x="8" y="10.5" width="23" height="5" rx="1.5" fill="#0F172A" />
        {/* Slanted White Stripes */}
        <path d="M12 10.5L14 15.5H16.5L14.5 10.5H12Z" fill="#F8FAFC" />
        <path d="M18 10.5L20 15.5H22.5L20.5 10.5H18Z" fill="#F8FAFC" />
        <path d="M24 10.5L26 15.5H28.5L26.5 10.5H24Z" fill="#F8FAFC" />
      </g>
    </svg>
  );
}

export function LiveEventIcon({ className = "cat-svg-icon" }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="34" height="34">
      <circle cx="20" cy="20" r="19" fill="#FFF1F2" stroke="#FFE4E6" strokeWidth="1" />
      {/* Circus Tent Canopy */}
      <path d="M20 9L9 20V29C9 29.5 9.5 30 10 30H30C30.5 30 31 29.5 31 29V20L20 9Z" fill="#E11D48" />
      {/* White Stripes */}
      <path d="M20 9L15 20V30H18V20L20 9Z" fill="#FFFFFF" />
      <path d="M20 9L25 20V30H22V20L20 9Z" fill="#FFFFFF" />
      {/* Tent Entrance / Arch */}
      <path d="M17 30V24C17 22.5 18.5 21.5 20 21.5C21.5 21.5 23 22.5 23 24V30H17Z" fill="#881337" />
      {/* Scalloped Eaves */}
      <path d="M9 20C10.5 21.5 12.5 21.5 14 20C15.5 21.5 17.5 21.5 19 20C20.5 21.5 22.5 21.5 24 20C25.5 21.5 27.5 21.5 29 20C30.5 21.5 31.5 21 31 20" stroke="#FDE047" strokeWidth="1.5" fill="none" />
      {/* Flag on top */}
      <path d="M20 9V5" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M20 5L25 7L20 9V5Z" fill="#F59E0B" />
    </svg>
  );
}

export function MusicIcon({ className = "cat-svg-icon" }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="34" height="34">
      <circle cx="20" cy="20" r="19" fill="#F5F3FF" stroke="#EDE9FE" strokeWidth="1" />
      {/* Double Eighth Note */}
      {/* Beams */}
      <path d="M15 13L27 10V14.5L15 17.5V13Z" fill="#7C3AED" />
      <path d="M15 16L27 13V15.5L15 18.5V16Z" fill="#9333EA" />
      {/* Stems */}
      <rect x="14" y="13" width="2.5" height="13" rx="1.2" fill="#7C3AED" />
      <rect x="25.5" y="10" width="2.5" height="14" rx="1.2" fill="#7C3AED" />
      {/* Noteheads */}
      <ellipse cx="12.5" cy="25.5" rx="3.8" ry="2.8" transform="rotate(-20 12.5 25.5)" fill="#6D28D9" />
      <ellipse cx="24" cy="23.5" rx="3.8" ry="2.8" transform="rotate(-20 24 23.5)" fill="#6D28D9" />
      {/* Sound rings */}
      <path d="M28 17C29.5 18.5 29.5 21 28 22.5" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ComedyIcon({ className = "cat-svg-icon" }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="34" height="34">
      <circle cx="20" cy="20" r="19" fill="#FEFCE8" stroke="#FEF08A" strokeWidth="1" />
      {/* Mic Capsule */}
      <rect x="16" y="9" width="8" height="13" rx="4" fill="#334155" />
      {/* Mic Grille Lines */}
      <line x1="16" y1="13" x2="24" y2="13" stroke="#94A3B8" strokeWidth="1" />
      <line x1="16" y1="16" x2="24" y2="16" stroke="#94A3B8" strokeWidth="1" />
      <line x1="20" y1="9" x2="20" y2="18" stroke="#64748B" strokeWidth="1" />
      {/* U-Shape Holder */}
      <path d="M13 17C13 21 16 24 20 24C24 24 27 21 27 17" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
      {/* Mic Stand Stem */}
      <path d="M20 24V29" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
      {/* Mic Base */}
      <ellipse cx="20" cy="30" rx="7" ry="2" fill="#475569" />
      <ellipse cx="20" cy="29.5" rx="5" ry="1.2" fill="#D97706" />
    </svg>
  );
}

export function PlaysIcon({ className = "cat-svg-icon" }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="34" height="34">
      <circle cx="20" cy="20" r="19" fill="#EFF6FF" stroke="#DBEAFE" strokeWidth="1" />
      {/* Tragedy Mask (Blue, background layer) */}
      <g transform="translate(6, 12)">
        <path d="M0 5C0 1.5 3 0 7 0C11 0 14 1.5 14 5C14 11 11 15 7 15C3 15 0 11 0 5Z" fill="#3B82F6" />
        {/* Slanted Eyes */}
        <path d="M3 4.5L5.5 6" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M11 4.5L8.5 6" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
        {/* Sad Mouth */}
        <path d="M4.5 11C5.5 9.5 8.5 9.5 9.5 11" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      </g>
      {/* Comedy Mask (Gold/Amber, foreground layer) */}
      <g transform="translate(18, 14)">
        <path d="M0 5C0 1.5 3 0 7.5 0C12 0 15 1.5 15 5C15 11.5 12 16 7.5 16C3 16 0 11.5 0 5Z" fill="#F59E0B" />
        {/* Curved Happy Eyes */}
        <path d="M3 5C3.8 4 5.2 4 6 5" stroke="#78350F" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <path d="M9 5C9.8 4 11.2 4 12 5" stroke="#78350F" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        {/* Big Smile */}
        <path d="M4 9C5 12.5 10 12.5 11 9Z" fill="#78350F" />
      </g>
    </svg>
  );
}

export function SportsIcon({ className = "cat-svg-icon" }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="34" height="34">
      <circle cx="20" cy="20" r="19" fill="#FFF7ED" stroke="#FFEDD5" strokeWidth="1" />
      {/* Trophy Cup */}
      <path d="M14 10H26V17C26 20.5 23.5 23 20 23C16.5 23 14 20.5 14 17V10Z" fill="#F59E0B" />
      {/* Trophy Rim */}
      <rect x="13" y="9" width="14" height="2.5" rx="1" fill="#D97706" />
      {/* Cup Highlight */}
      <path d="M16 11V17C16 18.5 17 19.5 18 20" stroke="#FDE68A" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      {/* Left Handle */}
      <path d="M14 12H10.5C9.5 12 8.5 13 8.5 14.5C8.5 16.5 10.5 18 14 18" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Right Handle */}
      <path d="M26 12H29.5C30.5 12 31.5 13 31.5 14.5C31.5 16.5 29.5 18 26 18" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Trophy Stem */}
      <path d="M18.5 23H21.5V26.5H18.5V23Z" fill="#D97706" />
      {/* Trophy Base */}
      <path d="M15 27H25L26 31H14L15 27Z" fill="#9A3412" />
      <rect x="13" y="30" width="14" height="2" rx="1" fill="#431407" />
    </svg>
  );
}

export function ActivitiesIcon({ className = "cat-svg-icon" }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="34" height="34">
      <circle cx="20" cy="20" r="19" fill="#ECFEFF" stroke="#CFFAFE" strokeWidth="1" />
      {/* Ferris Wheel / Adventure Wheel */}
      <circle cx="20" cy="18" r="9" stroke="#0891B2" strokeWidth="1.8" fill="none" />
      <circle cx="20" cy="18" r="3.5" fill="#F97316" />
      {/* Spokes */}
      <line x1="20" y1="9" x2="20" y2="27" stroke="#0891B2" strokeWidth="1.2" />
      <line x1="11" y1="18" x2="29" y2="18" stroke="#0891B2" strokeWidth="1.2" />
      <line x1="13.5" y1="11.5" x2="26.5" y2="24.5" stroke="#0891B2" strokeWidth="1.2" />
      <line x1="13.5" y1="24.5" x2="26.5" y2="11.5" stroke="#0891B2" strokeWidth="1.2" />
      {/* Gondolas */}
      <circle cx="20" cy="9" r="1.8" fill="#EF4444" />
      <circle cx="20" cy="27" r="1.8" fill="#EF4444" />
      <circle cx="11" cy="18" r="1.8" fill="#F59E0B" />
      <circle cx="29" cy="18" r="1.8" fill="#F59E0B" />
      <circle cx="13.5" cy="11.5" r="1.8" fill="#8B5CF6" />
      <circle cx="26.5" cy="24.5" r="1.8" fill="#8B5CF6" />
      <circle cx="13.5" cy="24.5" r="1.8" fill="#10B981" />
      <circle cx="26.5" cy="11.5" r="1.8" fill="#10B981" />
      {/* Stand Base */}
      <path d="M15 31L18.5 20H21.5L25 31" stroke="#334155" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <line x1="13" y1="31" x2="27" y2="31" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Icon helper by id/type
export function renderCategoryIcon(type, className) {
  switch (type) {
    case "movies":
      return <MovieIcon className={className} />;
    case "events":
      return <LiveEventIcon className={className} />;
    case "music":
      return <MusicIcon className={className} />;
    case "comedy":
      return <ComedyIcon className={className} />;
    case "plays":
      return <PlaysIcon className={className} />;
    case "sports":
      return <SportsIcon className={className} />;
    case "activities":
      return <ActivitiesIcon className={className} />;
    default:
      return <MovieIcon className={className} />;
  }
}
