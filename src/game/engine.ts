import { createDeck, HAND_SIZE, shuffleIds, toCardImageMap } from './deck'
import { scoreOfficialDixitRound } from './scoring'
import type { GameDoc, LobbyPlayer } from './types'

export function createInitialGame(lobbyCode: string, players: LobbyPlayer[]): GameDoc {
  const playerIds = players
    .slice()
    .sort((a, b) => a.joinedAt - b.joinedAt)
    .map((player) => player.id)
  const now = Date.now()
  const cardDefs = createDeck()
  const cardIds = shuffleIds(cardDefs.map((card) => card.id))
  const hands: Record<string, string[]> = {}
  const scores: Record<string, number> = {}

  for (const playerId of playerIds) {
    hands[playerId] = []
    scores[playerId] = 0
  }

  const deckRemaining = [...cardIds]
  for (let i = 0; i < HAND_SIZE; i += 1) {
    for (const playerId of playerIds) {
      const nextCard = deckRemaining.shift()
      if (!nextCard) break
      hands[playerId].push(nextCard)
    }
  }

  return {
    id: lobbyCode,
    lobbyCode,
    phase: 'story',
    roundNumber: 1,
    turnOrder: playerIds,
    storytellerPlayerId: playerIds[0],
    clue: '',
    deckRemaining,
    discardedCardIds: [],
    hands,
    submissions: {},
    submissionOrder: [],
    votes: {},
    pointsDelta: {},
    scores,
    winningPlayerIds: [],
    lastRoundSummary: '',
    createdAt: now,
    updatedAt: now,
  }
}

export function toCardImageLookup(): Record<string, string> {
  return toCardImageMap(createDeck())
}

export function rotateStoryteller(turnOrder: string[], currentId: string): string {
  const index = turnOrder.indexOf(currentId)
  if (index === -1) return turnOrder[0]
  return turnOrder[(index + 1) % turnOrder.length]
}

export function advanceRound(game: GameDoc): GameDoc {
  const storytellerId = game.storytellerPlayerId
  const storytellerCardId = game.submissions[storytellerId]
  if (!storytellerCardId) throw new Error('Storyteller card missing for scoring')

  const { pointsDelta, summary } = scoreOfficialDixitRound({
    storytellerId,
    storytellerCardId,
    submissions: game.submissions,
    votes: game.votes,
  })

  const newScores = { ...game.scores }
  for (const [playerId, delta] of Object.entries(pointsDelta)) {
    newScores[playerId] = (newScores[playerId] ?? 0) + delta
  }

  const hands = structuredClone(game.hands)
  const usedCards = Object.values(game.submissions)
  for (const [playerId, cardId] of Object.entries(game.submissions)) {
    hands[playerId] = (hands[playerId] ?? []).filter((id) => id !== cardId)
  }

  const deckRemaining = [...game.deckRemaining]
  for (const playerId of game.turnOrder) {
    const draw = deckRemaining.shift()
    if (!draw) break
    hands[playerId].push(draw)
  }

  const storytellerPlayerId = rotateStoryteller(game.turnOrder, storytellerId)
  const updatedAt = Date.now()
  const deckExhausted = deckRemaining.length === 0
  const phase = deckExhausted ? 'ended' : 'story'
  const roundNumber = phase === 'ended' ? game.roundNumber : game.roundNumber + 1
  const maxScore = Math.max(...Object.values(newScores))
  const winners =
    phase === 'ended'
      ? Object.entries(newScores)
          .filter(([, score]) => score === maxScore)
          .map(([playerId]) => playerId)
      : []

  return {
    ...game,
    phase,
    roundNumber,
    storytellerPlayerId,
    clue: '',
    submissions: {},
    submissionOrder: [],
    votes: {},
    pointsDelta,
    scores: newScores,
    deckRemaining,
    discardedCardIds: [...game.discardedCardIds, ...usedCards],
    hands,
    winningPlayerIds: winners,
    lastRoundSummary: deckExhausted
      ? `${summary} Deck exhausted: highest score wins.`
      : summary,
    updatedAt,
  }
}

