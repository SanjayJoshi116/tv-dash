// Text for anything that was thrown — Error, string, undefined, a null-prototype object… —
// without ever throwing itself (error fallbacks call this; a throw there would blank the page).
export function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  if (error == null) return 'Unknown error'
  try {
    return String(error) || 'Unknown error'
  } catch {
    return 'Unknown error'
  }
}
