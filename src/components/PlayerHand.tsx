import { CardMedia } from './CardMedia'
import { CardSwipeCarousel } from './CardSwipeCarousel'

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
  const selectedIndex =
    selectedCardId != null && cards.includes(selectedCardId) ? cards.indexOf(selectedCardId) : undefined

  return (
    <section className="card-panel card-panel--hand">
      <div className="field-label">{title}</div>
      <CardSwipeCarousel scrollToSlideIndex={selectedIndex} prevLabel="Previous card in hand" nextLabel="Next card in hand">
        {cards.map((cardId) => {
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
                <CardMedia cardId={cardId} src={cardImageById[cardId]} alt={cardId} />
              </button>
            </div>
          )
        })}
      </CardSwipeCarousel>
    </section>
  )
}

