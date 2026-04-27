# PDF Powerhouse

Local-first PDF processing desktop app with a React/Vite frontend and Tauri/Rust backend.

## Development

- `npm install`
- `npm run dev` (web preview)
- `npm run tauri:dev` (desktop runtime)
- `npm run test`
- `npm run typecheck`

## Source Release Packaging

Do not zip the working directory directly. That can include local machine artifacts such as `.git`, `node_modules`, `dist`, and `src-tauri/target`.

Use:

- `npm run source:archive`

This creates a clean source archive in `release/` using `git archive`.

## Project Docs

- `support-matrix.md`
- `ENGINE_MATRIX.md`
- `ARCHITECTURE.md`
- `SECURITY.md`
- `RELEASE.md`
- `CONTRIBUTING.md`
