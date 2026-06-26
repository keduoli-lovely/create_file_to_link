# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build/Run Commands

```bash
npm run tauri dev     # Development (hot-reload frontend + Rust backend)
npm run tauri build   # Production build (NSIS/MSI/App bundle)
npm run dev           # Vite-only frontend dev server (port 1420)
npm run build         # Vite-only frontend build
```

## Architecture Overview

This is a **Tauri v2** desktop app for Windows that moves/copies files/folders and creates symbolic links to them. Frontend is **Vue 3 + Vite + Pinia + Element Plus**; backend is **Rust**.

### Rust Backend (`src-tauri/src/`)

Entry: `lib.rs` — builds the Tauri app with plugins (store, fs, dialog, opener) and registers 5 commands.

| Command | File | Purpose |
|---|---|---|
| `create_link_auto` | `create_file_link.rs` | Creates Windows symlinks (file or dir, auto-detected) |
| `run_check_copy_move_files` | `copy_move_file.rs` | Copy/move files with progress, emits `file-progress`/`file-complete`/`file-error`/`file-move-err`/`check_move_file_error` events |
| `is_symlink` | `check_file_disk/fs_utils.rs` | Checks if a path is a symlink |
| `file_or_dir` | `check_file_disk/fs_utils.rs` | Returns `(exists, "file"/"dir"/"null")` |
| `open_devtools` | `lib.rs` | Opens Tauri devtools in the main window |

`check_file_disk/index.rs` validates disk space before move/copy: walks the file tree, locks files to check permissions, and compares total size against free disk space.

`LockState` (in `lib.rs`) holds file locks during the disk check to prevent the OS from modifying files mid-operation.

Build: `build.rs` injects `requireAdministrator` manifest in release mode.

### Frontend (`src/`)

**State management — Pinia stores (5):**
- `useConfigStore` — user settings (link creation, dark theme, name conflict mode, etc.)
- `useFileStore` — currently selected files/folders and target path
- `useHistoryStore` — migration history list with computed "clear enabled" state
- `useProgressStore` — current operation progress (percent, filename, status)
- `useDragStore` — drag-and-drop UI state (overlay visibility, conflict resolution)

**Business logic — composables (6):**
- `useFileOperation` — file selection dialog, symlink opening, name conflict checking, copy/move invocation
- `useDragFile` — Tauri drag-drop event handlers (`tauri://drag-enter/leave/drop`), file list deduplication
- `useAppListener` — event listeners for `file-complete`, `file-error`, `file-move-err`, `check_move_file_error`, and window close (merges history into persistent store)
- `useProgress` — throttled `file-progress` event listener
- `useHistory` — clear history operations
- `useChangeTheme` — toggles `dark` class on `<html>`

**Frontend ↔ Backend communication pattern:**
- Frontend calls Rust: `invoke("<command_name>", { args })`
- Rust notifies frontend: `app.emit("<event-name>", payload)` → frontend listens with `listen("<event-name>", callback)`

**Config persistence:** Uses `@tauri-apps/plugin-store` — saved as `.settings.json` in the app data directory. Default config includes system paths excluded from operations (`C:\Windows`, `C:\$Recycle.Bin`, etc.).

**Key utilities:**
- `utils/fileUtils.js` — `filter_fileList` (classifies drag-dropped paths as file/dir/mixed), `check_isSymLink_fn` (batch symlink check)
- `utils/filenameUtils.js` — `buildLinkName` (insert suffix before extension for file links), `shortenByWidth` (truncate paths with ellipsis via canvas measurement)

### Window Configuration

- Size: 500×782, non-resizable, frameless (custom titlebar via `title_bar.vue`)
- `requireAdministrator` on Windows (release mode only)
- `CSP: null` in tauri.conf.json (no content security policy restrictions)
