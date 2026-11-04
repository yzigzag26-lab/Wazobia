import type { SVGProps } from 'react'

/**
 * WAZOBIA icon set.
 *
 * Hand-authored, 24px grid, single 1.5px stroke, `currentColor`. Kept in-house
 * rather than pulling an icon package: it keeps the visual language consistent
 * and avoids adding ~1MB of dependency for sixteen glyphs.
 *
 * Icons are decorative by default (`aria-hidden`); the interactive element that
 * contains them is responsible for its accessible name.
 */

type IconProps = SVGProps<SVGSVGElement> & { title?: string }

function Icon({ title, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      focusable="false"
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  )
}

/* ---------------------------------------------------------------- destinations */

/** AI — a speech spark inside a conversation frame. */
export function IconAi(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H9l-4 4v-4H6.5A2.5 2.5 0 0 1 4 13.5Z" />
      <path d="M12 7.5v1.8M12 12.2v.3" />
      <path d="M9.6 9.9h4.8" />
    </Icon>
  )
}

/** Translate — two opposing arrows between language forms. */
export function IconTranslate(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 6h9M7.5 6v-.8" />
      <path d="M10.4 6c-.4 3.2-2.4 6-5.4 7.6" />
      <path d="M5.6 9.4c1 1.7 2.5 3 4.4 3.8" />
      <path d="M12.5 20l3.4-8.6L19.3 20" />
      <path d="M13.7 17.2h4.4" />
    </Icon>
  )
}

/** Learn — an open book with a rising path. */
export function IconLearn(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 6.6C10.4 5.2 8.2 4.6 4.5 4.6v12.2c3.7 0 5.9.6 7.5 2 1.6-1.4 3.8-2 7.5-2V4.6c-3.7 0-5.9.6-7.5 2Z" />
      <path d="M12 6.6v12.2" />
    </Icon>
  )
}

/** Speak — a microphone with a sound arc. */
export function IconSpeak(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" />
      <path d="M12 18v3" />
    </Icon>
  )
}

/** Dictionary — a page with a lookup mark. */
export function IconDictionary(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 4.8A1.8 1.8 0 0 1 6.8 3H18a1 1 0 0 1 1 1v14.6" />
      <path d="M5 4.8v14.4A1.8 1.8 0 0 0 6.8 21H19" />
      <path d="M9.6 15.6l2.2-5.6 2.2 5.6M10.4 13.9h2.8" />
    </Icon>
  )
}

/** Community — three figures in conversation. */
export function IconCommunity(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8" r="2.8" />
      <path d="M3.6 19.2c.5-2.9 2.7-4.6 5.4-4.6s4.9 1.7 5.4 4.6" />
      <path d="M16 5.6a2.6 2.6 0 0 1 0 5" />
      <path d="M17.6 14.9c1.7.5 2.7 1.9 3 4.3" />
    </Icon>
  )
}

/** Preserve — an archive vessel holding a record. */
export function IconPreserve(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 8.4h16v9.8A2.8 2.8 0 0 1 17.2 21H6.8A2.8 2.8 0 0 1 4 18.2Z" />
      <path d="M3 4.6h18v3.8H3z" />
      <path d="M10 12.6h4" />
    </Icon>
  )
}

/** Research & AI Data — layered dataset with a benchmark mark. */
export function IconResearch(props: IconProps) {
  return (
    <Icon {...props}>
      <ellipse cx="12" cy="6.2" rx="7" ry="2.8" />
      <path d="M5 6.2v5.6c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8V6.2" />
      <path d="M5 11.8v5.6c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-5.6" />
    </Icon>
  )
}

/* ------------------------------------------------------------------- interface */

export function IconSearch(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="m15.6 15.6 4 4" />
    </Icon>
  )
}

export function IconClose(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </Icon>
  )
}

export function IconMenu(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  )
}

export function IconPanelCollapse(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2.2" />
      <path d="M9 4v16" />
      <path d="m16.5 9.5-2.5 2.5 2.5 2.5" />
    </Icon>
  )
}

export function IconPanelExpand(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2.2" />
      <path d="M9 4v16" />
      <path d="m14 9.5 2.5 2.5L14 14.5" />
    </Icon>
  )
}

export function IconChevronRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />
    </Icon>
  )
}

export function IconArrowRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 12h15" />
      <path d="m13.5 6.5 6 5.5-6 5.5" />
    </Icon>
  )
}

export function IconMore(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="5.5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </Icon>
  )
}

export function IconInfo(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.2M12 8.2v.3" />
    </Icon>
  )
}

export function IconAlert(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4.4 21 19.6H3Z" />
      <path d="M12 9.6v4.2M12 16.6v.3" />
    </Icon>
  )
}

export function IconCheck(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m5 12.8 4.2 4.2L19 7.2" />
    </Icon>
  )
}

export function IconGlobe(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.2 2.3 3.4 5.3 3.4 8.5S14.2 18.2 12 20.5c-2.2-2.3-3.4-5.3-3.4-8.5S9.8 5.8 12 3.5Z" />
    </Icon>
  )
}
