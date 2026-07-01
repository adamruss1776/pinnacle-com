---
name: uuid ESM override for xcode@3
description: How to pin uuid to v9 (CJS) so expo prebuild's xcode@3 doesn't fail with ERR_REQUIRE_ESM
---

## Rule
`xcode@3.0.1` (used by expo prebuild) calls `require('uuid')` but uuid@10+ is ESM-only.
Pin uuid to `"9"` in the root `package.json` `pnpm.overrides` field.

**Why:** `pnpm-workspace.yaml` overrides are ignored for this; the authoritative override location for pnpm is `pnpm.overrides` in the root `package.json`. The lockfile's overrides section mirrors whatever is in `package.json`.

**How to apply:** In root `package.json`:
```json
"pnpm": {
  "overrides": {
    "uuid": "9"
  }
}
```
Then run `pnpm install --no-frozen-lockfile --lockfile-only` to regenerate the lockfile. Confirm `uuid@9.x` appears in `pnpm-lock.yaml`.

Do NOT edit `pnpm-lock.yaml` manually — `--lockfile-only` overwrites any manual edits during re-resolution.
