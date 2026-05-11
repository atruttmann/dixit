export type RoundScoreInput = {
  storytellerId: string
  storytellerCardId: string
  submissions: Record<string, string>
  votes: Record<string, string>
}

export type RoundScoreResult = {
  pointsDelta: Record<string, number>
  summary: string
  correctlyGuessedBy: string[]
}

export function scoreOfficialDixitRound(input: RoundScoreInput): RoundScoreResult {
  const { storytellerId, storytellerCardId, submissions, votes } = input
  const points: Record<string, number> = {}
  const nonStoryPlayers = Object.keys(submissions).filter((id) => id !== storytellerId)
  const correctlyGuessedBy = nonStoryPlayers.filter(
    (playerId) => votes[playerId] === storytellerCardId,
  )

  for (const playerId of Object.keys(submissions)) {
    points[playerId] = 0
  }

  const allFound = correctlyGuessedBy.length === nonStoryPlayers.length
  const noneFound = correctlyGuessedBy.length === 0

  if (allFound || noneFound) {
    for (const playerId of nonStoryPlayers) points[playerId] += 2
  } else {
    points[storytellerId] += 3
    for (const playerId of correctlyGuessedBy) points[playerId] += 3
  }

  const ownerByCardId = Object.entries(submissions).reduce<Record<string, string>>(
    (acc, [playerId, cardId]) => {
      acc[cardId] = playerId
      return acc
    },
    {},
  )

  for (const [voterId, votedCardId] of Object.entries(votes)) {
    const owner = ownerByCardId[votedCardId]
    if (!owner) continue
    if (owner === storytellerId) continue
    if (owner === voterId) continue
    points[owner] += 1
  }

  const summary = allFound
    ? 'Everyone found the storyteller card. Storyteller gets 0, others get +2.'
    : noneFound
      ? 'Nobody found the storyteller card. Storyteller gets 0, others get +2.'
      : 'Some players found the storyteller card. Storyteller and correct guessers get +3.'

  return { pointsDelta: points, summary, correctlyGuessedBy }
}

