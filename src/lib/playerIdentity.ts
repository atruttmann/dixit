const PLAYER_ID_KEY = 'dixit.playerId'
const PLAYER_NAME_KEY = 'dixit.playerName'

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `p_${Math.random().toString(36).slice(2, 10)}`
}

export function getOrCreatePlayerId(): string {
  const existing = localStorage.getItem(PLAYER_ID_KEY)
  if (existing) return existing
  const id = newId()
  localStorage.setItem(PLAYER_ID_KEY, id)
  return id
}

export function getStoredPlayerName(): string {
  return localStorage.getItem(PLAYER_NAME_KEY) ?? ''
}

export function setStoredPlayerName(name: string): void {
  localStorage.setItem(PLAYER_NAME_KEY, name)
}

