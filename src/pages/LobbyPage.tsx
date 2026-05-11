import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import type { LobbyDoc } from '../game/types'
import { loadCardsFromStorage } from '../lib/cardStorage'
import { joinLobby, leaveLobby, startGame, subscribeLobby } from '../lib/gameRepository'
import { getOrCreatePlayerId, getStoredPlayerName, setStoredPlayerName } from '../lib/playerIdentity'
import { Scoreboard } from '../components/Scoreboard'

export function LobbyPage() {
  const { lobbyCode = '' } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const fallbackName = getStoredPlayerName()
  const queryName = (searchParams.get('name') ?? fallbackName).trim()
  const queryPlayerId = useMemo(
    () => searchParams.get('playerId') ?? getOrCreatePlayerId(),
    [searchParams],
  )
  const [lobby, setLobby] = useState<LobbyDoc | null>(null)
  const [error, setError] = useState<string>('')
  const [busy, setBusy] = useState(false)
  const [nameInput, setNameInput] = useState(queryName)
  const [joinedName, setJoinedName] = useState(queryName)

  const normalizedCode = useMemo(() => lobbyCode.toUpperCase(), [lobbyCode])
  const hasJoined = joinedName.trim().length > 0

  useEffect(() => {
    if (!normalizedCode || !joinedName.trim()) return
    setStoredPlayerName(joinedName.trim())
    void joinLobby({
      lobbyCode: normalizedCode,
      playerId: queryPlayerId,
      playerName: joinedName.trim(),
    }).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : 'Failed to join lobby'
      setError(message)
    })
  }, [normalizedCode, joinedName, queryPlayerId])

  useEffect(() => {
    if (!hasJoined) return undefined
    if (!normalizedCode) return undefined
    const unsub = subscribeLobby(normalizedCode, setLobby)
    return () => {
      unsub()
      void leaveLobby(normalizedCode, queryPlayerId)
    }
  }, [hasJoined, normalizedCode, queryPlayerId])

  useEffect(() => {
    if (!hasJoined) return
    if (lobby?.status === 'playing') {
      navigate(`/game/${normalizedCode}?playerId=${encodeURIComponent(queryPlayerId)}`)
    }
  }, [hasJoined, lobby?.status, navigate, normalizedCode, queryPlayerId])

  useEffect(() => {
    if (!hasJoined || !normalizedCode) return
    void loadCardsFromStorage()
  }, [hasJoined, normalizedCode])

  function handleJoinGame(e: FormEvent) {
    e.preventDefault()
    const trimmedName = nameInput.trim()
    if (trimmedName.length < 2) {
      setError('Please enter a name with at least 2 characters.')
      return
    }
    setError('')
    setJoinedName(trimmedName)
  }

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

  if (!hasJoined) {
    return (
      <div className="app-main">
        <main className="app-main__content">
          <section className="card-panel card-panel--muted">
            <div className="field-label">Lobby code</div>
            <h2>{normalizedCode}</h2>
            <form onSubmit={handleJoinGame} className="stack-gap">
              <label className="field-label" htmlFor="lobby-name">
                Enter your name
              </label>
              <input
                id="lobby-name"
                className="ghost-input"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="How should other players see you?"
                maxLength={20}
                autoFocus
              />
              <button type="submit" className="primary-button" disabled={nameInput.trim().length < 2}>
                Join game
              </button>
            </form>
            {error ? <p className="error-copy">{error}</p> : null}
          </section>
        </main>
      </div>
    )
  }

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

