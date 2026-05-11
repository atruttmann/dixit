type PlayerHandProps = {
  cards: string[]
  cardImageById: Record<string, string>
  selectedCardId: string | null
  disabled?: boolean
  onSelectCard: (cardId: string) => void
  title?: string
}

export function PlayerHand({
  cards,
  cardImageById,
  selectedCardId,
  disabled = false,
  onSelectCard,
  title = 'Your hand',
}: PlayerHandProps) {
  return (
    <section className="card-panel">
      <div className="field-label">{title}</div>
      <div className="card-grid card-grid--hand">
        {cards.map((cardId) => {
          const selected = selectedCardId === cardId
          return (
            <button
              key={cardId}
              type="button"
              className={`play-card ${selected ? 'play-card--selected' : ''}`}
              onClick={() => onSelectCard(cardId)}
              disabled={disabled}
            >
              <img src={cardImageById[cardId]} alt={cardId} loading="lazy" />
            </button>
          )
        })}
      </div>
    </section>
  )
}

