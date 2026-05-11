import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import type { EmblaOptionsType } from 'embla-carousel'

type CardSwipeCarouselProps = {
  children: ReactNode
  className?: string
  /** When this index changes, scroll that slide into view (e.g. keep carousel in sync with selection). */
  scrollToSlideIndex?: number
  emblaOptions?: EmblaOptionsType
  /** Visually hidden label for prev/next (locale). */
  prevLabel?: string
  nextLabel?: string
}

const defaultOptions: EmblaOptionsType = {
  align: 'center',
  containScroll: 'trimSnaps',
  dragFree: false,
}

/**
 * Touch/drag horizontal carousel. Built with [Embla Carousel](https://www.embla-carousel.com/)
 * (small, no jQuery, works well on mobile).
 */
export function CardSwipeCarousel({
  children,
  className,
  scrollToSlideIndex,
  emblaOptions,
  prevLabel = 'Previous card',
  nextLabel = 'Next card',
}: CardSwipeCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    ...defaultOptions,
    ...emblaOptions,
  })
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)
  const lastSyncedIndex = useRef<number | undefined>(undefined)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setCanPrev(emblaApi.canScrollPrev())
    setCanNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on('reInit', onSelect)
    emblaApi.on('select', onSelect)
    queueMicrotask(() => onSelect())
    return () => {
      emblaApi.off('reInit', onSelect)
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi, onSelect])

  useEffect(() => {
    if (scrollToSlideIndex == null) {
      lastSyncedIndex.current = undefined
      return
    }
    if (emblaApi == null || scrollToSlideIndex < 0) return
    if (lastSyncedIndex.current === scrollToSlideIndex) return
    lastSyncedIndex.current = scrollToSlideIndex
    emblaApi.scrollTo(scrollToSlideIndex)
  }, [emblaApi, scrollToSlideIndex])

  return (
    <div className={`card-swipe ${className ?? ''}`}>
      <button
        type="button"
        className="card-swipe__btn card-swipe__btn--prev"
        aria-label={prevLabel}
        disabled={!canPrev}
        onClick={() => emblaApi?.scrollPrev()}
      >
        ‹
      </button>
      <div className="card-swipe__viewport" ref={emblaRef}>
        <div className="card-swipe__container">{children}</div>
      </div>
      <button
        type="button"
        className="card-swipe__btn card-swipe__btn--next"
        aria-label={nextLabel}
        disabled={!canNext}
        onClick={() => emblaApi?.scrollNext()}
      >
        ›
      </button>
      <p className="card-swipe__hint">Swipe or use arrows to browse cards</p>
    </div>
  )
}
