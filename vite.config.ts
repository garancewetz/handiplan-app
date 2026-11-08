import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    // React Compiler : mémoïsation automatique, donc ni useMemo, ni useCallback, ni React.memo dans le code.
    react({ babel: { plugins: ['babel-plugin-react-compiler'] } }),
    tailwindcss(),
  ],
  resolve: {
    alias: { '~': '/src' },
  },
})
