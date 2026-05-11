/** Filename/path extensions treated as video cards (Storage path ends with these). */
const VIDEO_EXT_RE = /\.(mp4|webm|mov|m4v|ogv|avi)$/i

/** Image extensions for manifest / listing (non-video raster or svg). */
export const CARD_IMAGE_EXT_RE = /\.(png|jpg|jpeg|gif|webp|jfif|bmp|svg)$/i

export function isVideoCardId(cardId: string): boolean {
  return VIDEO_EXT_RE.test(cardId)
}

/** Matches image or video filenames for Firebase Storage card listing. */
export function isCardMediaFilename(name: string): boolean {
  return CARD_IMAGE_EXT_RE.test(name) || VIDEO_EXT_RE.test(name)
}
