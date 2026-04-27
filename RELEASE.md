# Release

## Checks

Run these before tagging a release:

- `npm ci`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `cargo fmt --manifest-path src-tauri/Cargo.toml --check`
- `cargo check --manifest-path src-tauri/Cargo.toml`
- `cargo test --manifest-path src-tauri/Cargo.toml`

## Source Archive

Do not zip the working tree. Use:

- `npm run source:archive`

The archive is created with `git archive`, which excludes `.git`, `node_modules`, `dist`, and `src-tauri/target`.

The source archive script intentionally fails when the git index or working tree is dirty, so archives always correspond to a committed revision.

## Desktop Bundles

Tauri bundling is disabled by default until release icon assets and signing/notarization are configured. Enable bundling only after:

- icons are present and referenced
- version matches `package.json`, `package-lock.json`, `src-tauri/Cargo.toml`, and `src-tauri/tauri.conf.json`
- platform signing policy is documented
- generated artifacts have checksums
