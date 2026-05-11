import type { LobbyPlayer } from '../game/types'

type ScoreboardProps = {
  players: LobbyPlayer[]
  /** Marks the viewing player's row with “(you)”. */
  currentPlayerId?: string
  title?: string
}

export function Scoreboard({ players, currentPlayerId, title = 'Scoreboard' }: ScoreboardProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score)

  return (
    <section className="card-panel" aria-label={title}>
      <div className="field-label">{title}</div>
      <ul className="scoreboard-list">
        {sorted.map((player) => (
          <li key={player.id} className="scoreboard-list__item">
            <span>
              {player.name}
              {currentPlayerId === player.id ? ' (you)' : ''}
            </span>
            <span>{player.score}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

