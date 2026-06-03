// Static data for DesignShowcase — all display-only configuration.

export const SHADOW_VARIANTS = [
  { label: 'shadow-card',         cls: 'shadow-card',         desc: 'Standard Cards' },
  { label: 'shadow-elevation-sm', cls: 'shadow-elevation-sm', desc: 'Hover-Zustand' },
  { label: 'shadow-elevation-md', cls: 'shadow-elevation-md', desc: 'Raised Cards' },
  { label: 'shadow-elevation-lg', cls: 'shadow-elevation-lg', desc: 'Toasts, Modals' },
] as const

export const COLOR_GROUPS = [
  {
    group: 'Brand',
    tokens: [
      { label: 'Brand Navy',    var: '--brand-navy' },
      { label: 'Primary',       var: '--primary' },
      { label: 'Primary Light', var: '--primary-light' },
      { label: 'Primary Pale',  var: '--primary-pale' },
    ],
  },
  {
    group: 'Status',
    tokens: [
      { label: 'Success',     var: '--success' },
      { label: 'Warning',     var: '--warning' },
      { label: 'Destructive', var: '--destructive' },
      { label: 'Info',        var: '--info' },
    ],
  },
  {
    group: 'Gamification',
    tokens: [
      { label: 'XP Gold (=Accent)', var: '--xp-gold' },
      { label: 'XP Gold Light',     var: '--xp-gold-light' },
      { label: 'Streak Orange',     var: '--streak-orange' },
    ],
  },
  {
    group: 'Emotionale Momente',
    tokens: [
      { label: 'Level-Up',        var: '--color-levelup' },
      { label: 'Level-Up Moment', var: '--color-moment-levelup' },
      { label: 'Repair (Lila)',   var: '--color-moment-repair' },
      { label: 'Erfolg/Boss',     var: '--color-moment-green' },
      { label: 'Streak-Verlust',  var: '--color-moment-red' },
      { label: 'Moment-Bühne',    var: '--color-moment-bg' },
    ],
  },
  {
    group: 'Text & Surface',
    tokens: [
      { label: 'Text Primary',   var: '--text-primary' },
      { label: 'Text Secondary', var: '--text-secondary' },
      { label: 'Text Muted',     var: '--text-muted' },
      { label: 'Surface',        var: '--surface' },
    ],
  },
] as const

export const SPACING_TOKENS = [
  { token: '--space-1',  px: '4px',  label: 'space-1' },
  { token: '--space-2',  px: '8px',  label: 'space-2' },
  { token: '--space-4',  px: '16px', label: 'space-4' },
  { token: '--space-6',  px: '24px', label: 'space-6' },
  { token: '--space-8',  px: '32px', label: 'space-8' },
  { token: '--space-12', px: '48px', label: 'space-12' },
  { token: '--space-16', px: '64px', label: 'space-16' },
] as const

export const ANIMATION_DEMOS = [
  { label: 'bounce-pop', cls: 'animate-bounce-pop' },
  { label: 'scale-in',   cls: 'animate-scale-in' },
  { label: 'fade-in',    cls: 'animate-fade-in' },
  { label: 'xp-pulse',   cls: 'animate-xp-pulse' },
] as const

export const AVATAR_NAMES = [
  'Anna Müller', 'Jonas Weber', 'Lena Fischer',
  'Max Bauer', 'Sophie Klein', 'Tim Schulz',
] as const
