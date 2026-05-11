import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const envFile = loadEnv(mode, process.cwd(), '')
  const explicit = (process.env.VITE_BASE_PATH ?? envFile.VITE_BASE_PATH)?.trim()
  const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? ''

  let base = '/'
  if (explicit) {
    base = explicit.endsWith('/') ? explicit : `${explicit}/`
  } else if (mode === 'production' && repoName) {
    base = `/${repoName}/`
  }

  return {
    plugins: [react()],
    base,
  }
})
