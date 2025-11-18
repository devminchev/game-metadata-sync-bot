# Game Metadata Sync App

## Overview
Game Metadata Sync is a custom Contentful app that keeps `gameV2` and `siteGameV2` entries aligned with metadata from external gaming platforms (e.g., White Hat). Inside Contentful it offers:
- An **App Configuration** screen where admins store primary/secondary API hosts per jurisdiction.
- A **Page extension** for operations teams to scan ventures, create missing entries, and update outdated ones in bulk.
- An **Entry sidebar** button that re-syncs or resets a single site game on demand via an App Action.

## Architecture
| Layer | Responsibility | Key Files |
| --- | --- | --- |
| Location router | Chooses which React component to render for each Contentful location. | `src/index.tsx` |
| Config UI | Manages installation parameters (primary/secondary API hosts) and default values sourced from the app definition. | `src/locations/ConfigScreen.tsx` |
| Operations page | Loads ventures, fetches Contentful entries & external games, filters missing/outdated content, and runs create/update actions. | `src/locations/Page.tsx`, `src/hooks/useGamesContent.ts`, `src/utils/filterContent.ts`, `src/utils/entryBuilder.ts` |
| Entry sidebar | Fetches linked entries for the current site game and triggers the `gameMetadataSyncAction` App Action. | `src/locations/Sidebar.tsx`, `src/hooks/useSidebarConfig.ts`, `src/hooks/useSyncAction.ts` |
| Serverless App Action | Calls the upstream metadata API, checks freshness, and updates both game and site game entries. | `functions/game-metadata-sync-action-handler.ts`, `functions/apis/externalGameMetadataApi.ts`, `functions/utils/*` |

## Prerequisites
- Node.js 18+ and npm/yarn.
- Access to a Contentful space with the `gameV2`, `siteGameV2`, `venture`, and `jurisdiction` content types plus an app definition with page, sidebar, and app-config locations enabled.
- External metadata endpoints reachable from the Contentful environment.
- Environment variables for CLI deployments: `CONTENTFUL_ORG_ID`, `CONTENTFUL_APP_DEF_ID`, `CONTENTFUL_ACCESS_TOKEN`.

## Installation
```bash
npm install
# or
yarn install
```

## Running locally
- **Dev server:** `npm run dev` starts Vite with Contentful’s SDK provider, showing a localhost warning unless rendered inside Contentful.
- **Tests:** `npm run test` executes Vitest (no suites included yet).
- **Functions build:** `npm run build:functions` packages the `functions/` bundle (used automatically inside `npm run build`).

To see the app inside Contentful while developing, run `npm run dev`, expose the URL via `ngrok` or `contentful tunnel`, and point the app definition’s locations to the tunnel URL.

## Building & deploying
1. **Build frontend + functions:** `npm run build`.
2. **Upload bundle manually:** `npm run upload` (prompts for org/app IDs).
3. **CI/CD upload:** `npm run upload-ci` with the required environment variables for non-interactive deployments.
4. **App definition helpers:** `npm run create-app-definition`, `npm run add-locations`, and `npm run upsert-actions` streamline configuring the app and registering the `gameMetadataSyncAction`.

## Usage
### 1. Configure API hosts
From the Contentful Apps section, open the app’s configuration screen and provide:
- `Game Metadata External Source API Host` (primary White Hat host).
- Optional `Secondary External Source API Host` (used for CA-ON). Defaults display beneath each field if defined on the app definition.

### 2. Scan & manage game metadata
Open the Page extension:
1. Select a venture; the app computes jurisdiction, brand, and country using `setWhiteHatParams` and the stored hosts.
2. Click **Missing Game Contents** to compare external games with existing `gameV2`/`siteGameV2` entries. The view lists launch codes and entry IDs needing creation.
3. Click **Outdated Game Contents** to find entries whose Contentful `updatedAt` precedes the upstream `updatedAt`.
4. Use **Create Missing Game Contents** to bulk-create `gameV2` and linked `siteGameV2` entries with payloads built from the external metadata and detailed API calls. The hook debounces API requests, checks for duplicates, and populates fields like stakes, platform visibility, venture links, and platform config.
5. Use **Update Outdated Games Contents** to fetch fresh details, update both entries, and clear the outdated list.

### 3. Entry-level sync/reset
From a `siteGameV2` entry sidebar:
1. Click **CHECK & SYNC New Updates** to run the `gameMetadataSyncAction`, which fetches the latest metadata, compares timestamps, and updates both the site game and linked game when needed.
2. Click **RESTORE Active Data** to force a reset even if timestamps look current (passes `doReset=true`). Feedback appears via Contentful notifications.

## Contributing
1. Fork and clone this repository.
2. Create a branch for your change.
3. Run `npm run dev` for frontend changes and `npm run build:functions` after editing `functions/`.
4. Submit a PR describing the feature/fix, and ensure deployments are handled via the Contentful CLI scripts above.
