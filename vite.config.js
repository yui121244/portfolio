import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

// Pages has no SPA rewrites: emit real entry files for all five projects.
function projectPageEntries() {
  return {
    name: 'project-page-entries',
    async writeBundle({ dir }) {
      const html = await readFile(join(dir, 'index.html'), 'utf8')
      await Promise.all([1, 2, 3, 4, 5].map(async (id) => {
        const directory = join(dir, 'projects', String(id))
        await mkdir(directory, { recursive: true })
        await writeFile(join(directory, 'index.html'), html)
      }))
    },
  }
}

export default defineConfig({
  base: '/portfolio/',
  plugins: [react(), projectPageEntries()],
  server: { host: '127.0.0.1' },
  build: { target: 'es2020' },
})
