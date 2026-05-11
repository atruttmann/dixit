import { isVideoCardId } from '../lib/cardMedia'

type CardMediaProps = {
  cardId: string
  src: string | undefined
  /** Shown when src is missing */
  alt?: string
  className?: string
}

/**
 * Renders a hand/submitted card: image or muted looping video with controls.
 */
export function CardMedia({ cardId, src, alt, className }: CardMediaProps) {
  const mediaClass = className ?? 'play-card__media'

  if (!src) {
    return <div className={`${mediaClass} play-card__media--empty`} aria-hidden />
  }

  if (isVideoCardId(cardId)) {
    return (
      <video
        className={mediaClass}
        src={src}
        muted
        loop
        playsInline
        controls
        preload="metadata"
        aria-label={alt ?? cardId}
        onClick={(e) => e.stopPropagation()}
      />
    )
  }

  return <img className={mediaClass} src={src} alt={alt ?? cardId} loading="lazy" />
}
