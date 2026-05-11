export type FirebaseClientConfig = {
  apiKey: string
  authDomain: string
  projectId: string
  appId: string
  storageBucket?: string
}

function readEnv(name: string): string {
  const value = import.meta.env[name]
  if (typeof value !== 'string' || !value) {
    console.warn(`[env] Missing expected environment variable: ${name}`)
    return ''
  }
  return value
}

export function getFirebaseClientConfig(): FirebaseClientConfig {
  return {
    apiKey: readEnv('VITE_FIREBASE_API_KEY'),
    authDomain: readEnv('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: readEnv('VITE_FIREBASE_PROJECT_ID'),
    appId: readEnv('VITE_FIREBASE_APP_ID'),
    storageBucket: readEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  }
}

