// src/db.ts
// Helper functions to sync state with MongoDB via Vercel API

const USER_ID_KEY = 'learn2unlock_userid'

// Generate or retrieve a persistent user ID
export function getUserId(): string {
  let id = localStorage.getItem(USER_ID_KEY)
  if (!id) {
    id = 'user_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now()
    localStorage.setItem(USER_ID_KEY, id)
  }
  return id
}

// Load state from MongoDB (fallback to localStorage if offline)
export async function loadFromDB<T>(localFallback: T): Promise<T> {
  try {
    const userId = getUserId()
    const res = await fetch(`/api/user?userId=${userId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) return localFallback
    const data = await res.json()
    if (!data) return localFallback
    // Remove MongoDB metadata
    const { userId: _uid, updatedAt: _upd, ...state } = data
    void _uid; void _upd
    return state as T
  } catch {
    // Offline or API error — use local fallback
    return localFallback
  }
}

// Save state to MongoDB (fire-and-forget, also save to localStorage)
export async function saveToDB<T extends object>(state: T): Promise<void> {
  try {
    const userId = getUserId()
    await fetch(`/api/user?userId=${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    })
  } catch {
    // Offline — silently ignore, localStorage still saved
  }
}
