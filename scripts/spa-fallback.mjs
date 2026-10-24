// GitHub Pages has no rewrite rules, so unknown paths fall back to 404.html. Serving the app shell there makes deep links work.
import { copyFileSync } from 'node:fs'
copyFileSync('dist/index.html', 'dist/404.html')
