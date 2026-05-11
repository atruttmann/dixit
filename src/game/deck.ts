import type { CardDefinition } from './types'

export const DEFAULT_DECK_SIZE = 84
export const HAND_SIZE = 6

export function createDeck(size = DEFAULT_DECK_SIZE): CardDefinition[] {
  return Array.from({ length: size }, (_, index) => {
    const cardNumber = index + 1
    return {
      id: `card-${String(cardNumber).padStart(3, '0')}`,
      imageUrl: `https://picsum.photos/seed/dixit-${cardNumber}/420/280`,
    }
  })
}

export function shuffleIds(cardIds: string[]): string[] {
  const items = [...cardIds]
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items
}

export function toCardImageMap(deck: CardDefinition[]): Record<string, string> {
  return deck.reduce<Record<string, string>>((acc, card) => {
    acc[card.id] = card.imageUrl
    return acc
  }, {})
}

