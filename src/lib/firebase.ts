import { initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app'
import {
  getFirestore,
  type Firestore,
  enableIndexedDbPersistence,
} from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'
import { getFirebaseClientConfig } from './env'

let appInstance: FirebaseApp | null = null
let dbInstance: Firestore | null = null
let storageInstance: FirebaseStorage | null = null

export function getFirebaseApp(): FirebaseApp {
  if (!appInstance) {
    const config = getFirebaseClientConfig()
    const options: FirebaseOptions = {
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      appId: config.appId,
    }
    if (config.storageBucket?.trim()) {
      options.storageBucket = config.storageBucket.trim()
    }
    appInstance = initializeApp(options)
  }
  return appInstance
}

export function getDb(): Firestore {
  if (!dbInstance) {
    const app = getFirebaseApp()
    dbInstance = getFirestore(app)
    void enableIndexedDbPersistence(dbInstance).catch(() => {
      // Offline persistence is best-effort only in the client.
    })
  }
  return dbInstance
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storageInstance) {
    storageInstance = getStorage(getFirebaseApp())
  }
  return storageInstance
}

