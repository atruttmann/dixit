type SubmittedCardsGridProps = {
  cardIds: string[]
  cardImageById: Record<string, string>
  selectedCardId: string | null
  votesByCard?: Record<string, number>
  revealVoteCounts?: boolean
  disabled?: boolean
  onSelectCard: (cardId: string) => void
}

export function SubmittedCardsGrid({
  cardIds,
  cardImageById,
  selectedCardId,
  votesByCard = {},
  revealVoteCounts = false,
  disabled = false,
  onSelectCard,
}: SubmittedCardsGridProps) {
  return (
    <section className="card-panel">
      <div className="field-label">Submitted cards</div>
      <div className="card-grid card-grid--submitted">
        {cardIds.map((cardId, index) => {
          const selected = selectedCardId === cardId
          return (
            <button
              key={cardId}
              type="button"
              className={`play-card ${selected ? 'play-card--selected' : ''}`}
              onClick={() => onSelectCard(cardId)}
              disabled={disabled}
            >
              <img src={cardImageById[cardId]} alt={`Submitted card ${index + 1}`} loading="lazy" />
              <span className="play-card__badge">#{index + 1}</span>
              {revealVoteCounts ? (
                <span className="play-card__votes">{votesByCard[cardId] ?? 0} votes</span>
              ) : null}
            </button>
          )
        })}
      </div>
    </section>
  )
}

