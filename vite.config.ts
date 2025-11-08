import path from "path"
import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"
import componentTagger from "@dyad-sh/react-vite-component-tagger"

export default defineConfig({
  plugins: [
    componentTagger(),
    react()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
  },
})