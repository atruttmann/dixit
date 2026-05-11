import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import type { LobbyDoc } from '../game/types'
import { joinLobby, leaveLobby, startGame, subscribeLobby } from '../lib/gameRepository'
import { getOrCreatePlayerId, getStoredPlayerName, setStoredPlayerName } from '../lib/playerIdentity'
import { Scoreboard } from '../components/Scoreboard'

export function LobbyPage() {
  const { lobbyCode = '' } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const fallbackName = getStoredPlayerName()
  const queryName = searchParams.get('name') ?? fallbackName
  const queryPlayerId = searchParams.get('playerId') ?? getOrCreatePlayerId()
  const [lobby, setLobby] = useState<LobbyDoc | null>(null)
  const [error, setError] = useState<string>('')
  const [busy, setBusy] = useState(false)

  const normalizedCode = useMemo(() => lobbyCode.toUpperCase(), [lobbyCode])

  useEffect(() => {
    if (!normalizedCode || !queryName.trim()) return
    setStoredPlayerName(queryName.trim())
    void joinLobby({
      lobbyCode: normalizedCode,
      playerId: queryPlayerId,
      playerName: queryName.trim(),
    }).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : 'Failed to join lobby'
      setError(message)
    })
  }, [normalizedCode, queryName, queryPlayerId])

  useEffect(() => {
    if (!normalizedCode) return undefined
    const unsub = subscribeLobby(normalizedCode, setLobby)
    return () => {
      unsub()
      void leaveLobby(normalizedCode, queryPlayerId)
    }
  }, [normalizedCode, queryPlayerId])

  useEffect(() => {
    if (lobby?.status === 'playing') {
      navigate(`/game/${normalizedCode}?playerId=${encodeURIComponent(queryPlayerId)}`)
    }
  }, [lobby?.status, navigate, normalizedCode, queryPlayerId])

  async function handleStartGame() {
    if (!lobby) return
    setError('')
    setBusy(true)
    try {
      await startGame(normalizedCode, queryPlayerId)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start game'
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  const players = lobby ? Object.values(lobby.players) : []
  const isHost = lobby?.hostPlayerId === queryPlayerId
  const canStart = isHost && players.length >= 3 && players.length <= 10 && lobby?.status === 'waiting'

  return (
    <div className="app-main">
      <main className="app-main__content stack-gap">
        <section className="card-panel">
          <div className="field-label">Lobby code</div>
          <h2>{normalizedCode}</h2>
          <p>Share this link with friends:</p>
          <input
            className="ghost-input"
            value={`${window.location.origin}/lobby/${normalizedCode}`}
            readOnly
            onFocus={(e) => e.currentTarget.select()}
          />
          {error ? <p className="error-copy">{error}</p> : null}
        </section>

        <section className="card-panel card-panel--muted">
          <div className="field-label">Players ({players.length}/10)</div>
          <ul className="player-list">
            {players.map((player) => (
              <li key={player.id}>
                <span>{player.name}</span>
                <span>
                  {player.id === lobby?.hostPlayerId ? 'Host' : player.connected ? 'Ready' : 'Away'}
                </span>
              </li>
            ))}
          </ul>
          {isHost ? (
            <button type="button" className="primary-button" onClick={handleStartGame} disabled={!canStart || busy}>
              {busy ? 'Starting...' : 'Start game'}
            </button>
          ) : (
            <p>Waiting for host to start the game.</p>
          )}
        </section>
      </main>

      <aside className="app-main__side">
        <Scoreboard players={players} title="Lobby board" />
        <section className="card-panel card-panel--muted">
          <div className="field-label">Need to change name?</div>
          <p>Go back home to update your display name.</p>
          <Link className="primary-button" to="/">
            Back home
          </Link>
        </section>
      </aside>
    </div>
  )
}

