import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { CluePanel } from '../components/CluePanel'
import { PlayerHand } from '../components/PlayerHand'
import { Scoreboard } from '../components/Scoreboard'
import { SubmittedCardsGrid } from '../components/SubmittedCardsGrid'
import { toCardImageLookup } from '../game/engine'
import type { GameDoc, LobbyDoc } from '../game/types'
import {
  joinLobby,
  leaveLobby,
  submitPlayerCard,
  submitStorytellerClue,
  submitVote,
  subscribeGame,
  subscribeLobby,
} from '../lib/gameRepository'
import { getOrCreatePlayerId, getStoredPlayerName } from '../lib/playerIdentity'

export function GamePage() {
  const { lobbyCode = '' } = useParams()
  const [searchParams] = useSearchParams()
  const playerId = searchParams.get('playerId') ?? getOrCreatePlayerId()
  const [lobby, setLobby] = useState<LobbyDoc | null>(null)
  const [game, setGame] = useState<GameDoc | null>(null)
  const [selectedHandCard, setSelectedHandCard] = useState<string | null>(null)
  const [selectedVoteCard, setSelectedVoteCard] = useState<string | null>(null)
  const [clue, setClue] = useState('')
  const [error, setError] = useState('')
  const cardImageById = useMemo(() => toCardImageLookup(), [])
  const normalizedCode = lobbyCode.toUpperCase()

  useEffect(() => {
    const name = getStoredPlayerName() || `Player-${playerId.slice(0, 4)}`
    void joinLobby({ lobbyCode: normalizedCode, playerId, playerName: name }).catch(() => {
      // Join attempt may fail if already in lobby; snapshot subscription is source of truth.
    })
  }, [normalizedCode, playerId])

  useEffect(() => {
    const unsubLobby = subscribeLobby(normalizedCode, setLobby)
    const unsubGame = subscribeGame(normalizedCode, setGame)
    return () => {
      unsubLobby()
      unsubGame()
      void leaveLobby(normalizedCode, playerId)
    }
  }, [normalizedCode, playerId])

  if (!lobby || !game) {
    return (
      <div className="app-main">
        <main className="app-main__content">
          <section className="card-panel">Connecting to game...</section>
        </main>
      </div>
    )
  }

  const me = lobby.players[playerId]
  const players = Object.values(lobby.players)
  const myHand = game.hands[playerId] ?? []
  const isStoryteller = game.storytellerPlayerId === playerId
  const storytellerName = lobby.players[game.storytellerPlayerId]?.name ?? 'Storyteller'
  const hasSubmitted = Boolean(game.submissions[playerId])
  const hasVoted = Boolean(game.votes[playerId])

  async function handleSubmitStory() {
    if (!selectedHandCard || clue.trim().length < 2) return
    setError('')
    try {
      await submitStorytellerClue(normalizedCode, playerId, clue, selectedHandCard)
      setSelectedHandCard(null)
      setClue('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit storyteller card')
    }
  }

  async function handleSubmitCard() {
    if (!selectedHandCard) return
    setError('')
    try {
      await submitPlayerCard(normalizedCode, playerId, selectedHandCard)
      setSelectedHandCard(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit card')
    }
  }

  async function handleSubmitVote() {
    if (!selectedVoteCard) return
    setError('')
    try {
      await submitVote(normalizedCode, playerId, selectedVoteCard)
      setSelectedVoteCard(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit vote')
    }
  }

  const voteCounts = Object.values(game.votes).reduce<Record<string, number>>((acc, cardId) => {
    acc[cardId] = (acc[cardId] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="app-main">
      <main className="app-main__content stack-gap">
        <section className="card-panel">
          <div className="field-label">Lobby {normalizedCode}</div>
          <h2>Round {game.roundNumber}</h2>
          <p>
            Phase: <strong>{game.phase}</strong>
          </p>
          {game.lastRoundSummary ? <p>{game.lastRoundSummary}</p> : null}
          {game.phase === 'ended' && game.winningPlayerIds.length > 0 ? (
            <p>
              Winner{game.winningPlayerIds.length > 1 ? 's' : ''}:{' '}
              {game.winningPlayerIds
                .map((winnerId) => lobby.players[winnerId]?.name ?? winnerId)
                .join(', ')}
            </p>
          ) : null}
          {error ? <p className="error-copy">{error}</p> : null}
        </section>

        <CluePanel
          clue={isStoryteller && game.phase === 'story' ? clue : game.clue}
          onClueChange={setClue}
          onSubmitClue={handleSubmitStory}
          canSubmit={Boolean(selectedHandCard) && clue.trim().length >= 2}
          isStoryteller={isStoryteller}
          storytellerName={storytellerName}
          phase={game.phase}
        />

        {(game.phase === 'vote' || game.phase === 'score' || game.phase === 'ended') && game.submissionOrder.length > 0 ? (
          <SubmittedCardsGrid
            cardIds={game.submissionOrder}
            cardImageById={cardImageById}
            selectedCardId={selectedVoteCard}
            votesByCard={voteCounts}
            revealVoteCounts={game.phase === 'score' || game.phase === 'ended'}
            disabled={game.phase !== 'vote' || isStoryteller || hasVoted}
            onSelectCard={setSelectedVoteCard}
          />
        ) : null}

        <PlayerHand
          cards={myHand}
          cardImageById={cardImageById}
          selectedCardId={selectedHandCard}
          onSelectCard={setSelectedHandCard}
          disabled={hasSubmitted || game.phase === 'vote' || game.phase === 'score' || game.phase === 'ended'}
        />

        {isStoryteller && game.phase === 'story' ? null : game.phase === 'submit' && !hasSubmitted ? (
          <button type="button" className="primary-button" disabled={!selectedHandCard} onClick={handleSubmitCard}>
            Submit card
          </button>
        ) : null}

        {game.phase === 'vote' && !isStoryteller && !hasVoted ? (
          <button type="button" className="primary-button" disabled={!selectedVoteCard} onClick={handleSubmitVote}>
            Submit vote
          </button>
        ) : null}
      </main>

      <aside className="app-main__side">
        <Scoreboard players={players} storytellerId={game.storytellerPlayerId} />
        <section className="card-panel card-panel--muted">
          <div className="field-label">You</div>
          <p>{me?.name ?? 'Unknown player'}</p>
          {game.phase === 'ended' ? (
            <>
              <p>Game ended.</p>
              <Link className="primary-button" to={`/lobby/${normalizedCode}?name=${encodeURIComponent(me?.name ?? '')}&playerId=${encodeURIComponent(playerId)}`}>
                Back to lobby
              </Link>
            </>
          ) : null}
        </section>
      </aside>
    </div>
  )
}

