import { CardMedia } from './CardMedia'
import { CardSwipeCarousel } from './CardSwipeCarousel'

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
  const selectedIndex =
    selectedCardId != null && cardIds.includes(selectedCardId) ? cardIds.indexOf(selectedCardId) : undefined

  return (
    <section className="card-panel card-panel--submitted-carousel">
      <div className="field-label">Submitted cards</div>
      <CardSwipeCarousel
        scrollToSlideIndex={selectedIndex}
        prevLabel="Previous submitted card"
        nextLabel="Next submitted card"
      >
        {cardIds.map((cardId, index) => {
          const selected = selectedCardId === cardId
          return (
            <div className="card-swipe__slide" key={cardId}>
              <button
                type="button"
                className={`play-card play-card--carousel ${selected ? 'play-card--selected' : ''}`}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('video')) return
                  onSelectCard(cardId)
                }}
                disabled={disabled}
              >
                <CardMedia
                  cardId={cardId}
                  src={cardImageById[cardId]}
                  alt={`Submitted card ${index + 1}`}
                />
                <span className="play-card__badge">#{index + 1}</span>
                {revealVoteCounts ? (
                  <span className="play-card__votes">{votesByCard[cardId] ?? 0} votes</span>
                ) : null}
              </button>
            </div>
          )
        })}
      </CardSwipeCarousel>
    </section>
  )
}

