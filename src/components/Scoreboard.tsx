import type { LobbyPlayer } from '../game/types'

type ScoreboardProps = {
  players: LobbyPlayer[]
  storytellerId?: string
  title?: string
}

export function Scoreboard({ players, storytellerId, title = 'Scoreboard' }: ScoreboardProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score)

  return (
    <section className="card-panel" aria-label={title}>
      <div className="field-label">{title}</div>
      <ul className="scoreboard-list">
        {sorted.map((player) => (
          <li key={player.id} className="scoreboard-list__item">
            <span>
              {player.name}
              {storytellerId === player.id ? ' (storyteller)' : ''}
            </span>
            <span>{player.score}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

