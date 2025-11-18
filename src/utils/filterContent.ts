import { Entry } from '@contentful/app-sdk';
import { CONTENTFUL_GAME_CONTENT_TYPE_ID, CONTENTFUL_SITEGAME_CONTENT_TYPE_ID } from '../constants/cms';

type GameSyncEntry = {
    siteGameEntry: Entry;
    gameEntry: Entry;
};

export function buildSourceGameMap(sourceGames: any[]): Map<string, string> {
    const map = new Map<string, string>();

    for (const game of sourceGames) {
        const launchCode = game?.game?.launchCode;
        const updatedAt = game?.game?.updatedAt;

        if (!launchCode || !updatedAt) {
            continue;
        };

        map.set(launchCode, updatedAt);
    };

    return map;
};

export function filterMissingGames(
    externalResourceGames: any[],
    gameContentEntries: Entry[],
    locale: string,
    ventureId: string
) {
    const gameByLaunch = new Map();
    for (const entry of gameContentEntries) {
        if (entry.sys.contentType?.sys?.id === 'gameV2') {
            const code = entry.fields.launchCode?.[locale];
            if (code) {
                gameByLaunch.set(code, entry);
            }
        }
    }
    const results = [];

    for (const sourceGame of externalResourceGames) {
        const launchCode = sourceGame.game?.launchCode;
        const gameV2 = gameByLaunch.get(launchCode);

        if (!gameV2) {
            results.push({ sourceGame, siteGameEntry: null, gameEntry: null });
            continue;
        }
        const siteGameV2 = gameContentEntries.find(entry =>
            entry.sys.contentType?.sys?.id === 'siteGameV2' &&
            entry.fields.game?.[locale]?.sys?.id === gameV2.sys.id &&
            entry.fields.venture?.[locale]?.sys?.id === ventureId
        );

        if (!siteGameV2) {
            results.push({ sourceGame, siteGameEntry: siteGameV2, gameEntry: gameV2 });
        }
    }

    return results;
}

export function filterOutdatedGames(
    externalResourceGames: any[],
    gameContentEntries: Entry[],
    locale: string,
): GameSyncEntry[] {
    const sourceGameMap = buildSourceGameMap(externalResourceGames);
    const results: GameSyncEntry[] = [];

    const siteGameMap = new Map<string, Entry>();
    const gameEntries: Entry[] = [];

    for (let i = 0; i < gameContentEntries.length; i++) {
        const entry = gameContentEntries[i];
        const contentTypeId = entry.sys.contentType?.sys?.id;

        if (contentTypeId === CONTENTFUL_SITEGAME_CONTENT_TYPE_ID) {
            const linkedGameId = entry.fields?.game?.[locale]?.sys?.id;
            if (linkedGameId) {
                siteGameMap.set(linkedGameId, entry);
            };
        } else if (contentTypeId === CONTENTFUL_GAME_CONTENT_TYPE_ID) {
            gameEntries.push(entry);
        };
    };

    for (let i = 0; i < gameEntries.length; i++) {
        const gameEntry = gameEntries[i];
        const launchCode = gameEntry.fields?.launchCode?.[locale];
        if (!launchCode) {
            continue;
        };

        const sourceUpdatedTimestamp = sourceGameMap.get(launchCode);
        const isOutdated = sourceUpdatedTimestamp && new Date(sourceUpdatedTimestamp).getTime() > new Date(gameEntry.sys.updatedAt).getTime();
        if (!isOutdated) {
            continue;
        };

        const siteGameEntry = siteGameMap.get(gameEntry.sys.id);
        if (siteGameEntry) {
            results.push({ gameEntry, siteGameEntry });
        };
    };

    return results;
};