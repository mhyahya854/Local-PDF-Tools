# Contributing

## Setup

- Install Node.js 20.19 or newer.
- Install Rust stable.
- Install qpdf for desktop execution tests.
- Run `npm ci`.

## Daily Commands

- `npm run dev` starts the browser preview.
- `npm run tauri:dev` starts the desktop app.
- `npm run lint` checks TypeScript and React rules.
- `npm run typecheck` checks TypeScript types.
- `npm run test` runs Vitest tests.
- `cargo check --manifest-path src-tauri/Cargo.toml` checks Rust.

## Tool Implementation Rule

Do not expose a tool as runnable from frontend metadata alone.

New runnable tools need:

- backend capability descriptor
- backend execution adapter
- option validation in Rust
- renderer form and TS validation
- tests for success and failure
- support matrix update
