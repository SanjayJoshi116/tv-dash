export const GENRE_COLORS: Record<string, string> = {
  Animation: 'purple',
  Action: 'red',
  'Action & Adventure': 'red',
  Comedy: 'gold',
  Drama: 'blue',
  Fantasy: 'geekblue',
  'Sci-Fi & Fantasy': 'geekblue',
  Mystery: 'cyan',
  Thriller: 'volcano',
  Romance: 'pink',
  Horror: 'magenta',
  Adventure: 'orange',
}

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const
export const SECTION_GAP = 24

export function ratingColor(v: number): string {
  return v >= 8 ? '#52c41a' : v >= 6 ? '#faad14' : '#f5222d'
}

export function completionColor(v: number): string {
  return v >= 75 ? '#52c41a' : v >= 40 ? '#faad14' : '#f5222d'
}

export const STATUS_COLORS: Record<string, string> = {
  'Returning Series': '#52c41a',
  'Ended': '#8c8c8c',
  'Canceled': '#ff4d4f',
}

export const STATUS_TAG_COLORS: Record<string, string> = {
  'Returning Series': 'green',
  'Ended': 'default',
  'Canceled': 'red',
}
