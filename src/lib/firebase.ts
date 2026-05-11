import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  getFirestore,
  type Firestore,
  enableIndexedDbPersistence,
} from 'firebase/firestore'
import { getFirebaseClientConfig } from './env'

let appInstance: FirebaseApp | null = null
let dbInstance: Firestore | null = null

export function getFirebaseApp(): FirebaseApp {
  if (!appInstance) {
    const config = getFirebaseClientConfig()
    appInstance = initializeApp(config)
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

