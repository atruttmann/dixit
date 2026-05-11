import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { getOrCreatePlayerId, getStoredPlayerName, setStoredPlayerName } from '../lib/playerIdentity'

function randomLobbyCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return code
}

export function HomePage() {
  const navigate = useNavigate()
  const [name, setName] = useState(getStoredPlayerName())
  const [code, setCode] = useState('')
  const playerId = useMemo(() => getOrCreatePlayerId(), [])

  const disabled = name.trim().length < 2

  function handleCreateLobby(e: FormEvent) {
    e.preventDefault()
    if (disabled) return
    setStoredPlayerName(name.trim())
    const newCode = randomLobbyCode()
    navigate(
      `/lobby/${newCode}?name=${encodeURIComponent(name.trim())}&playerId=${encodeURIComponent(playerId)}`,
    )
  }

  function handleJoinLobby(e: FormEvent) {
    e.preventDefault()
    if (disabled || code.trim().length < 3) return
    setStoredPlayerName(name.trim())
    navigate(
      `/lobby/${code.trim().toUpperCase()}?name=${encodeURIComponent(name.trim())}&playerId=${encodeURIComponent(playerId)}`,
    )
  }

  return (
    <div className="app-main">
      <main className="app-main__content">
        <section className="card-panel">
          <h1>Dixit online</h1>
          <p>
            Host a room, share the link, and play the classic storytelling game together in your
            browser.
          </p>
        </section>
      </main>
      <aside className="app-main__side">
        <section className="card-panel card-panel--muted" aria-label="Enter name and create a lobby">
          <div className="field-label">Your name</div>
          <input
            className="ghost-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Type the name other players will see"
            maxLength={20}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="primary-button"
              onClick={handleCreateLobby}
              disabled={disabled}
            >
              Create lobby
            </button>
          </div>
        </section>
        <section className="card-panel card-panel--muted" aria-label="Join existing lobby">
          <div className="field-label">Lobby code</div>
          <input
            className="ghost-input"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. FABLES"
            maxLength={8}
          />
          <button
            type="button"
            className="primary-button"
            onClick={handleJoinLobby}
            disabled={disabled || code.trim().length < 3}
            style={{ marginTop: 12 }}
          >
            Join lobby
          </button>
        </section>
      </aside>
    </div>
  )
}

