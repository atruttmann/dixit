import {
  getDownloadURL,
  listAll,
  ref,
  type FirebaseStorage,
  type StorageReference,
} from 'firebase/storage'
import { CARD_IMAGE_FILENAMES } from '../game/cardManifest.generated'
import { getFirebaseStorage } from './firebase'
import { isCardMediaFilename } from './cardMedia'

function cardsPrefix(): string {
  const p = import.meta.env.VITE_FIREBASE_CARDS_STORAGE_PREFIX
  return typeof p === 'string' && p.trim() ? p.replace(/^\/+|\/+$/g, '') : 'cards'
}

function idRelativeToPrefix(prefix: string, fileRef: StorageReference): string {
  const p = prefix.replace(/^\/+|\/+$/g, '')
  const fp = fileRef.fullPath
  if (fp.startsWith(`${p}/`)) return fp.slice(p.length + 1)
  return fileRef.name
}

/** Lists image/video files under `folderRef`, including nested "folders" in Storage. */
async function collectMediaFileRefs(
  storage: FirebaseStorage,
  folderRef: StorageReference,
): Promise<StorageReference[]> {
  const { items, prefixes } = await listAll(folderRef)
  const here = items.filter((r) => isCardMediaFilename(r.name))
  const nested = await Promise.all(
    prefixes.map((subRef) => collectMediaFileRefs(storage, subRef)),
  )
  return [...here, ...nested.flat()]
}

/** `undefined` = not loaded yet; `[]` = loaded, no cards */
let filenamesCache: string[] | undefined
let urlsCache: Record<string, string> | undefined
let loadInFlight: Promise<{ filenames: string[]; urlById: Record<string, string> }> | null = null

function sortNames(names: string[]): string[] {
  return [...names].sort((a, b) => a.localeCompare(b, 'en'))
}

async function resolveUrlsForNames(names: string[]): Promise<Record<string, string>> {
  const prefix = cardsPrefix()
  const storage = getFirebaseStorage()
  const urlById: Record<string, string> = {}
  const chunk = 36
  for (let i = 0; i < names.length; i += chunk) {
    const slice = names.slice(i, i + chunk)
    const settled = await Promise.allSettled(
      slice.map((name) => getDownloadURL(ref(storage, `${prefix}/${name}`))),
    )
    slice.forEach((name, j) => {
      const r = settled[j]
      if (r.status === 'fulfilled') urlById[name] = r.value
    })
  }
  return urlById
}

async function loadFromManifestPaths(): Promise<{ filenames: string[]; urlById: Record<string, string> }> {
  const names = sortNames([...CARD_IMAGE_FILENAMES].filter((n) => isCardMediaFilename(n)))
  const urlById = await resolveUrlsForNames(names)
  const filenames = sortNames(Object.keys(urlById))
  return { filenames, urlById }
}

function cacheIfNonEmpty(filenames: string[], urlById: Record<string, string>): void {
  if (filenames.length > 0) {
    filenamesCache = filenames
    urlsCache = urlById
  }
}

function formatStorageErr(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err && typeof (err as { code: unknown }).code === 'string') {
    return (err as { code: string }).code
  }
  if (err instanceof Error) return err.message
  return String(err)
}

async function doLoadCardsFromStorage(): Promise<{
  filenames: string[]
  urlById: Record<string, string>
  hint?: string
}> {
  const prefix = cardsPrefix()
  const storage = getFirebaseStorage()

  try {
    const folderRef = ref(storage, prefix)
    const cardRefs = await collectMediaFileRefs(storage, folderRef)

    const urlById: Record<string, string> = {}
    const chunk = 36
    for (let i = 0; i < cardRefs.length; i += chunk) {
      const slice = cardRefs.slice(i, i + chunk)
      const urls = await Promise.all(slice.map((r) => getDownloadURL(r)))
      slice.forEach((r, j) => {
        urlById[idRelativeToPrefix(prefix, r)] = urls[j]!
      })
    }

    const filenames = sortNames(Object.keys(urlById))
    cacheIfNonEmpty(filenames, urlById)
    if (filenames.length === 0) {
      return {
        filenames,
        urlById,
        hint: `Storage path "${prefix}/" has no image or video files (.png, .jpg, .mp4, .webm, etc.). Upload files there, or set VITE_FIREBASE_CARDS_STORAGE_PREFIX to match your folder.`,
      }
    }
    return { filenames, urlById }
  } catch (err) {
    const code = formatStorageErr(err)
    console.warn('[cards] listAll failed; trying manifest filenames + getDownloadURL:', err)
    try {
      const { filenames, urlById } = await loadFromManifestPaths()
      cacheIfNonEmpty(filenames, urlById)
      if (filenames.length === 0) {
        return {
          filenames,
          urlById,
          hint: `Could not list or read "${prefix}/" (${code}). Fix Storage rules (read + list on that path), confirm VITE_FIREBASE_STORAGE_BUCKET matches the console, then retry.`,
        }
      }
      return { filenames, urlById }
    } catch (e) {
      console.warn('[cards] Could not resolve Storage URLs:', e)
      return {
        filenames: [],
        urlById: {},
        hint: `Storage error: ${code}. Manifest fallback also failed (${formatStorageErr(e)}).`,
      }
    }
  }
}

/**
 * Lists `VITE_FIREBASE_CARDS_STORAGE_PREFIX` in the default bucket, resolves download URLs,
 * and caches filenames + url map for the deck and UI.
 */
export async function loadCardsFromStorage(): Promise<{
  filenames: string[]
  urlById: Record<string, string>
  hint?: string
}> {
  if (filenamesCache !== undefined && urlsCache !== undefined) {
    return { filenames: filenamesCache, urlById: urlsCache }
  }
  if (!loadInFlight) {
    loadInFlight = doLoadCardsFromStorage().finally(() => {
      loadInFlight = null
    })
  }
  return loadInFlight
}

/** Clears cached card list so the next load hits Storage again (e.g. after fixing rules or uploads). */
export function clearCardsCache(): void {
  filenamesCache = undefined
  urlsCache = undefined
}

/** Filenames (Storage paths relative to the cards prefix) after `loadCardsFromStorage` has run. */
export function getCachedCardFilenamesSync(): string[] {
  if (filenamesCache !== undefined) return filenamesCache
  return []
}

export function getCachedCardImageUrlsSync(): Record<string, string> | undefined {
  return urlsCache
}
