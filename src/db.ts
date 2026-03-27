// src/db.ts
// Helper functions to sync game state with MongoDB via Vercel API
// Uses the logged-in user's email as the key (not random ID)

const STORAGE_KEY = 'learn2unlock_v2'

/** Get current user's email from localStorage */
function getUserEmail(): string | null {
  return localStorage.getItem('user')
}

/**
 * Load game state from MongoDB.
 * Falls back to localFallback if user is not logged in or network error.
 */
export async function loadFromDB<T>(localFallback: T): Promise<T> {
  const email = getUserEmail()
  if (!email) return localFallback

  try {
    const res = await fetch(`/api/state?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) return localFallback
    const data = await res.json()
    if (!data || !data.state) return localFallback
    return data.state as T
  } catch {
    // Offline or API error — use local fallback
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try { return JSON.parse(raw) as T } catch { /* ignore */ }
    }
    return localFallback
  }
}

/**
 * Save game state to MongoDB (also saved to localStorage).
 */
export async function saveToDB<T extends object>(state: T): Promise<void> {
  const email = getUserEmail()

  // Always save locally
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* ignore */ }

  if (!email) return

  try {
    await fetch(`/api/state?email=${encodeURIComponent(email)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state }),
    })
  } catch {
    // Offline — silently ignore, localStorage still saved
  }
}