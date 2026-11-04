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




/**
 * Profile — a head and shoulders inside a frame.
 *
 * Replaces the retired Community icon in the set: same grid and stroke, so the
 * navigation does not gain a visual outlier.
 */
export function IconProfile(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8.6" r="3.4" />
      <path d="M5.2 19.6c.7-3.2 3.4-5 6.8-5s6.1 1.8 6.8 5" />
      <path d="M3.2 12a8.8 8.8 0 0 1 17.6 0 8.8 8.8 0 0 1-17.6 0Z" opacity=".28" />
    </Icon>
  )
}

/* ---------------------------------------------------------------- learn hub */

/** Lessons — an open book with a bookmark. */
export function IconLessons(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 6.4C10.2 5.2 8.2 4.7 5.4 4.7c-.8 0-1.4.6-1.4 1.4v10.2c0 .8.6 1.4 1.4 1.4 2.8 0 4.8.5 6.6 1.7" />
      <path d="M12 6.4c1.8-1.2 3.8-1.7 6.6-1.7.8 0 1.4.6 1.4 1.4v10.2c0 .8-.6 1.4-1.4 1.4-2.8 0-4.8.5-6.6 1.7" />
      <path d="M12 6.4v13" />
      <path d="M15.6 4.9v4.2l1.5-1.1 1.5 1.1V4.9" />
    </Icon>
  )
}

/** Quizzes — a checkmark on a card with a progress dot. */
export function IconQuiz(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.6" y="4.4" width="16.8" height="15.2" rx="2.4" />
      <path d="M7.6 9.2h4.2M7.6 13h3M7.6 16.4h2" />
      <circle cx="16.2" cy="12" r="3.6" />
      <path d="m14.9 12 1 1 1.7-1.9" />
    </Icon>
  )
}

/** Proverbs — a speech mark with a wisdom spark. */
export function IconProverb(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10.2 6.2H6.4A2.4 2.4 0 0 0 4 8.6v3.2a2.4 2.4 0 0 0 2.4 2.4h1.2l-1 2.6 3-2.6h.6a2.4 2.4 0 0 0 2.4-2.4V8.6a2.4 2.4 0 0 0-2.4-2.4Z" />
      <path d="M16.4 8.6h3.2A2.4 2.4 0 0 1 22 11v3.2a2.4 2.4 0 0 1-2.4 2.4h-.9l1 2.6-3-2.6h-1a2.4 2.4 0 0 1-2.4-2.4" opacity=".55" />
    </Icon>
  )
}

/** Stories — a moonlit tale told under a tree. */
export function IconStory(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.4 12.2c3.1-.9 5.1-.9 7.6-.3 2.5-.6 4.5-.6 7.6.3" />
      <path d="M4.4 12.2v4.6c3.1-.9 5.1-.9 7.6-.3 2.5-.6 4.5-.6 7.6.3v-4.6" />
      <path d="M4.4 16.8v2.4c3.1-.9 5.1-.9 7.6-.3 2.5-.6 4.5-.6 7.6.3v-2.4" opacity=".5" />
      <path d="M12 11.9V4.6" />
      <path d="M12 6.6c1.5-.9 2.8-1.2 4.4-1.2 0 1.6-.5 2.7-1.6 3.5M12 6.6c-1.5-.9-2.8-1.2-4.4-1.2 0 1.6.5 2.7 1.6 3.5" />
    </Icon>
  )
}

/** Speaker — used by Read Aloud controls. */
export function IconSpeaker(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.4 9.6h3.2l4.2-3.2v11.2l-4.2-3.2H4.4Z" />
      <path d="M15.2 9a4 4 0 0 1 0 6" />
      <path d="M17.8 6.6a7.6 7.6 0 0 1 0 10.8" opacity=".55" />
    </Icon>
  )
}

export function IconPlay(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 5.4 18.4 12 8 18.6Z" />
    </Icon>
  )
}

export function IconPause(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 5.4v13.2M15 5.4v13.2" />
    </Icon>
  )
}

export function IconRestart(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.8 12a7.2 7.2 0 1 0 2.4-5.4" />
      <path d="M4.4 4.8v4h4" />
    </Icon>
  )
}

export function IconBack(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M19 12H5.4" />
      <path d="m10.4 6.6-5 5.4 5 5.4" />
    </Icon>
  )
}

export function IconSun(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4.1" />
      <path d="M12 3v2.1M12 18.9V21M4.2 12H6.3M17.7 12h2.1M6.5 6.5l1.5 1.5M16 16l1.5 1.5M17.5 6.5 16 8M8 16l-1.5 1.5" />
    </Icon>
  )
}

export function IconMoon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M19.4 14.6A7.8 7.8 0 0 1 9.4 4.6 8.4 8.4 0 1 0 19.4 14.6Z" />
    </Icon>
  )
}

export function IconMonitor(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.2" y="4.8" width="17.6" height="11.6" rx="1.8" />
      <path d="M9 20h6M12 16.4V20" />
    </Icon>
  )
}

export function IconUser(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8.4" r="3.6" />
      <path d="M4.8 20c.8-3.6 3.7-5.6 7.2-5.6s6.4 2 7.2 5.6" />
    </Icon>
  )
}

export function IconGlobe2(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M3.6 12h16.8" />
      <path d="M12 3.6c2.2 2.4 3.4 5.3 3.4 8.4S14.2 18 12 20.4c-2.2-2.4-3.4-5.3-3.4-8.4S9.8 6 12 3.6Z" />
    </Icon>
  )
}

export function IconLock(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4.8" y="10.4" width="14.4" height="9.4" rx="2.2" />
      <path d="M8.2 10.4V8a3.8 3.8 0 0 1 7.6 0v2.4" />
      <path d="M12 14v2.2" />
    </Icon>
  )
}

export function IconBell(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6.6 10.2a5.4 5.4 0 0 1 10.8 0c0 3.2.8 4.6 1.6 5.4H5c.8-.8 1.6-2.2 1.6-5.4Z" />
      <path d="M10.2 18.4a1.9 1.9 0 0 0 3.6 0" />
    </Icon>
  )
}

export function IconShield(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.4 19 6v5.6c0 4.3-2.9 7.4-7 9-4.1-1.6-7-4.7-7-9V6Z" />
      <path d="m9.2 11.8 1.9 1.9 3.7-3.9" />
    </Icon>
  )
}

export function IconWhatsApp(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20.4 11.7a8.3 8.3 0 0 1-12.3 7.3L3.6 20.4l1.4-4.4A8.3 8.3 0 1 1 20.4 11.7Z" />
      <path d="M9 9.2c.2 2.4 2.3 4.6 4.8 5.1l1.1-1.2 1.9.8c.2.9-.4 1.7-1.4 1.9-3.1.5-6.9-2.9-7.4-6 0-.9.6-1.6 1.5-1.7Z" />
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
