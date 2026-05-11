export type LobbyStatus = 'waiting' | 'playing' | 'finished'

export type GamePhase = 'story' | 'submit' | 'vote' | 'score' | 'ended'

export type LobbyPlayer = {
  id: string
  name: string
  score: number
  joinedAt: number
  connected: boolean
}

export type LobbyDoc = {
  code: string
  hostPlayerId: string
  status: LobbyStatus
  createdAt: number
  currentGameId: string | null
  players: Record<string, LobbyPlayer>
}

export type GameDoc = {
  id: string
  lobbyCode: string
  phase: GamePhase
  roundNumber: number
  turnOrder: string[]
  storytellerPlayerId: string
  clue: string
  deckRemaining: string[]
  discardedCardIds: string[]
  hands: Record<string, string[]>
  submissions: Record<string, string>
  submissionOrder: string[]
  votes: Record<string, string>
  pointsDelta: Record<string, number>
  scores: Record<string, number>
  winningPlayerIds: string[]
  lastRoundSummary: string
  createdAt: number
  updatedAt: number
}

export type CardDefinition = {
  id: string
  imageUrl: string
}

