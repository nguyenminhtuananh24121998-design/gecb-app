import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Using process.cwd() is standard for Node environments like Vercel build.
  // Casting to any avoids potential TS version mismatch issues with node types.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Polyfill process.env for the browser so the Gemini SDK works properly.
      // We safely default to empty string if undefined to prevent build crashes.
      'process.env': {
        API_KEY: JSON.stringify(env.API_KEY || ''),
        NODE_ENV: JSON.stringify(mode)
      }
    }
  }
})