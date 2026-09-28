# Vault client

This is a frontend-only implementation of the approved cover-based Spaces design.
The existing backend and deployment files are not used or modified by this work.

## Run

From `client`, run `npm install`, then `npm run dev`.
Use `npm run build` for a static production build and `npm run preview` to inspect it.
`npm run lint` checks the code; `npm test` runs the demo repository tests.
Tests require Node 22.18+ (or a newer Node version supporting TypeScript stripping).

## Preview behavior

- Four sample Spaces with folders, categories, and representative arbitrary file types.
- Create/edit Spaces, choose a built-in cover, create nested folders, rename folders.
- Create/rename/remove categories. Files have one category within their folder.
- Grid/list browsing, search, sorting, multi-select, favorites, moves, Trash and restore.
- Drop device files onto a Space, folder, or category to review their destination.
- Upload button and a native multiple-file picker on all devices.
- Drag existing file cards to folders or categories; keyboard/touch alternatives use the selection toolbar.
- Local file contents use object URLs. Image, text/CSV, PDF, browser-supported audio/video previews and downloads use actual local files.
- Unsupported types get a generic card and download. Some sample files contain metadata only; the UI explicitly says when a preview/download is unavailable.
- Light, dark, and system themes. Theme preference is the only localStorage data.
- A numeric 4–8 digit PIN flow for folder settings, change/removal, explicit locking, and unlocking. Descendants are hidden in browsing/search while locked in the demo.

All library changes and added files are **in memory for the current tab**. Refreshing
restores the sample library. Nothing is sent to the Raspberry Pi or any backend.
There are no pretend network progress bars: the activity tray reports files added
to the preview. Local files are not backed up or persisted. PINs demonstrate the
interaction only and are not real security; no automatic inactivity lock is implemented.

## Structure

- `src/App.tsx`: application shell, navigation, theme preference, shared UI state.
- `src/app/`: typed context and creation/editing dialogs.
- `src/pages/`: Spaces home and folder/collection browser.
- `src/features/files/`: file cards, details, safe text/media previews, downloads, drag targets.
- `src/features/uploads/`: destination selection, native picker, upload review.
- `src/components/ui/`: shared SVG icons and native accessible modal dialog.
- `src/data/`: types, fixtures, and observable in-memory repository. Domain updates are centralized here.
- `src/index.css`: theme tokens and base styles; `src/App.css`: layouts, components, breakpoints.
- `tests/`: data relationship, mutation, file identity, and demo-lock checks.

Hash routes support Back/Forward and direct folder links without configuring
server-side SPA rewrites. IDs for newly created entities use `crypto.randomUUID()`;
non-localhost deployment should use HTTPS. No runtime UI dependencies were added.
Covers, icons, and system fonts are served locally; the running client needs no
external font or image requests.

## Backend handoff

The client uses stable entity IDs and file metadata. Physical filesystem paths,
S3 object keys, and PIN hashes belong to the server and are not UI concerns.
Categories are folder-specific. Moving a file to a different folder clears its old
category. Removing a category does not remove its files. Files in Trash retain
their destination so they can be restored.

Replace `createDemoVault` with an API-backed adapter and add asynchronous pending,
failure/retry, and empty/loading states to each mutation and query. The current
repository is synchronous; connecting a server requires this explicit async work,
not just replacing the URL. Backend integration should include:

1. Listing Spaces/folders/categories and paginated file metadata.
2. Creating/updating entities and validating category/folder ownership.
3. Upload transport with real progress, cancellation, retry, and error responses.
4. Thumbnail/preview/download URLs, including authorization.
5. Trash/restore, moving, renaming, favorites, and cover persistence.
6. Server-enforced PIN protection for all descendant listing/upload/preview/download
   operations, secure PIN verification, lock sessions, and expiry.

The development server binds to loopback only. Production deployment on the Pi
should serve `dist/` through the user's chosen web server alongside their API.

## Cover sources

Locally saved demonstration photos from Unsplash's image service:

- Mountains: https://images.unsplash.com/photo-1464822759023-fed622ff2c3b
- Cabin/Projects: https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8
- Coast: https://images.unsplash.com/photo-1500375592092-40eb2168fd21
- Journal: https://images.unsplash.com/photo-1455390582262-044cdead277a
