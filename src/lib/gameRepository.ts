import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore'
import { advanceRound, createInitialGame } from '../game/engine'
import type { GameDoc, LobbyDoc, LobbyPlayer } from '../game/types'
import { loadCardsFromStorage } from './cardStorage'
import { getDb } from './firebase'

function lobbyRef(code: string) {
  return doc(getDb(), 'lobbies', code.toUpperCase())
}

function gameRef(code: string) {
  return doc(getDb(), 'games', code.toUpperCase())
}

function asLobbyPlayer(playerId: string, name: string, score = 0): LobbyPlayer {
  return {
    id: playerId,
    name,
    score,
    connected: true,
    joinedAt: Date.now(),
  }
}

export async function joinLobby(params: {
  lobbyCode: string
  playerId: string
  playerName: string
}): Promise<LobbyDoc> {
  const code = params.lobbyCode.toUpperCase()
  const ref = lobbyRef(code)

  await runTransaction(getDb(), async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) {
      const player = asLobbyPlayer(params.playerId, params.playerName)
      const initialLobby: LobbyDoc = {
        code,
        hostPlayerId: params.playerId,
        status: 'waiting',
        createdAt: Date.now(),
        currentGameId: null,
        players: {
          [params.playerId]: player,
        },
      }
      tx.set(ref, initialLobby)
      return
    }

    const lobby = snap.data() as LobbyDoc
    const players = { ...lobby.players }
    const existing = players[params.playerId]
    players[params.playerId] = {
      ...(existing ?? asLobbyPlayer(params.playerId, params.playerName)),
      id: params.playerId,
      name: params.playerName,
      connected: true,
      score: existing?.score ?? 0,
      joinedAt: existing?.joinedAt ?? Date.now(),
    }

    tx.update(ref, { players })
  })

  const snap = await getDoc(ref)
  return snap.data() as LobbyDoc
}

export function subscribeLobby(lobbyCode: string, onData: (lobby: LobbyDoc | null) => void): Unsubscribe {
  return onSnapshot(lobbyRef(lobbyCode), (snapshot) => {
    onData(snapshot.exists() ? (snapshot.data() as LobbyDoc) : null)
  })
}

export function subscribeGame(lobbyCode: string, onData: (game: GameDoc | null) => void): Unsubscribe {
  return onSnapshot(gameRef(lobbyCode), (snapshot) => {
    onData(snapshot.exists() ? (snapshot.data() as GameDoc) : null)
  })
}

export async function startGame(lobbyCode: string, requesterId: string): Promise<void> {
  const lRef = lobbyRef(lobbyCode)
  const gRef = gameRef(lobbyCode)

  const { filenames, hint } = await loadCardsFromStorage()
  if (filenames.length === 0) {
    const base =
      'No card images found in Firebase Storage. In the Firebase console, open Storage, add a folder named "cards" (or match VITE_FIREBASE_CARDS_STORAGE_PREFIX), upload .png or .jpg files, and set rules to allow read (and list) on that path. Confirm VITE_FIREBASE_STORAGE_BUCKET in .env matches the bucket shown under Storage (e.g. project-id.appspot.com).'
    throw new Error(hint ? `${base} Details: ${hint}` : base)
  }

  await runTransaction(getDb(), async (tx) => {
    const lobbySnap = await tx.get(lRef)
    if (!lobbySnap.exists()) throw new Error('Lobby does not exist')

    const lobby = lobbySnap.data() as LobbyDoc
    if (lobby.hostPlayerId !== requesterId) {
      throw new Error('Only the host can start the game')
    }
    if (lobby.status !== 'waiting') {
      throw new Error('Game already started')
    }

    const players = Object.values(lobby.players)
    if (players.length < 3 || players.length > 10) {
      throw new Error('Dixit requires 3 to 10 players')
    }

    const game = createInitialGame(lobby.code, players)
    tx.set(gRef, game)
    tx.update(lRef, { status: 'playing', currentGameId: lobby.code })
  })
}

export async function submitStorytellerClue(
  lobbyCode: string,
  storytellerId: string,
  clue: string,
  cardId: string,
): Promise<void> {
  await runTransaction(getDb(), async (tx) => {
    const gRef = gameRef(lobbyCode)
    const snap = await tx.get(gRef)
    if (!snap.exists()) throw new Error('Game does not exist')
    const game = snap.data() as GameDoc

    if (game.phase !== 'story') throw new Error('Not in storyteller phase')
    if (game.storytellerPlayerId !== storytellerId) throw new Error('Not storyteller turn')
    if (!(game.hands[storytellerId] ?? []).includes(cardId)) throw new Error('Card not in hand')

    const submissions = { ...game.submissions, [storytellerId]: cardId }
    const submissionOrder = shuffleForReveal(Object.values(submissions))
    tx.update(gRef, {
      phase: 'submit',
      clue: clue.trim(),
      submissions,
      submissionOrder,
      updatedAt: Date.now(),
    })
  })
}

export async function submitPlayerCard(
  lobbyCode: string,
  playerId: string,
  cardId: string,
): Promise<void> {
  await runTransaction(getDb(), async (tx) => {
    const gRef = gameRef(lobbyCode)
    const snap = await tx.get(gRef)
    if (!snap.exists()) throw new Error('Game does not exist')
    const game = snap.data() as GameDoc

    if (!['submit', 'story'].includes(game.phase)) throw new Error('Not in submission phase')
    if (game.storytellerPlayerId === playerId) throw new Error('Storyteller card already submitted')
    if (game.submissions[playerId]) throw new Error('Card already submitted')
    if (!(game.hands[playerId] ?? []).includes(cardId)) throw new Error('Card not in hand')

    const submissions = { ...game.submissions, [playerId]: cardId }
    const allSubmitted = Object.keys(submissions).length === game.turnOrder.length
    tx.update(gRef, {
      phase: allSubmitted ? 'vote' : 'submit',
      submissions,
      submissionOrder: allSubmitted ? shuffleForReveal(Object.values(submissions)) : game.submissionOrder,
      updatedAt: Date.now(),
    })
  })
}

export async function submitVote(lobbyCode: string, voterId: string, cardId: string): Promise<void> {
  await runTransaction(getDb(), async (tx) => {
    const gRef = gameRef(lobbyCode)
    const lRef = lobbyRef(lobbyCode)
    const gameSnap = await tx.get(gRef)
    const lobbySnap = await tx.get(lRef)
    if (!gameSnap.exists() || !lobbySnap.exists()) throw new Error('Lobby or game missing')
    const game = gameSnap.data() as GameDoc
    const lobby = lobbySnap.data() as LobbyDoc

    if (game.phase !== 'vote') throw new Error('Voting is not open')
    if (voterId === game.storytellerPlayerId) throw new Error('Storyteller cannot vote')
    if (game.votes[voterId]) throw new Error('Vote already submitted')
    if (!Object.values(game.submissions).includes(cardId)) throw new Error('Invalid vote card')
    if (game.submissions[voterId] === cardId) throw new Error('Cannot vote for your own card')

    const votes = { ...game.votes, [voterId]: cardId }
    const expectedVotes = game.turnOrder.length - 1
    if (Object.keys(votes).length < expectedVotes) {
      tx.update(gRef, { votes, updatedAt: Date.now() })
      return
    }

    const scored = advanceRound({ ...game, votes, phase: 'score' })
    const players = { ...lobby.players }
    for (const playerId of Object.keys(players)) {
      players[playerId] = { ...players[playerId], score: scored.scores[playerId] ?? 0 }
    }

    tx.set(gRef, scored)
    tx.update(lRef, {
      players,
      status: scored.phase === 'ended' ? 'finished' : 'playing',
    })
  })
}

export async function leaveLobby(lobbyCode: string, playerId: string): Promise<void> {
  const ref = lobbyRef(lobbyCode)
  await runTransaction(getDb(), async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) return
    const lobby = snap.data() as LobbyDoc
    if (!lobby.players[playerId]) return
    const players = { ...lobby.players }
    players[playerId] = { ...players[playerId], connected: false }
    tx.update(ref, { players })
  })
}

export async function ensureSeedGameDocument(lobbyCode: string): Promise<void> {
  const ref = gameRef(lobbyCode)
  const snapshot = await getDoc(ref)
  if (!snapshot.exists()) {
    await setDoc(ref, {})
  }
}

function shuffleForReveal(cardIds: string[]): string[] {
  const cards = [...cardIds]
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[cards[i], cards[j]] = [cards[j], cards[i]]
  }
  return cards
}

