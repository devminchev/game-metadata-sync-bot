import { FEDERAL_GAME_TYPE_ID_MAP, SUB_GAME_TYPE_ID_MAP } from './metadataMaps.js';
import { mapDeviceTypes } from './platformMapper.js';

export function updateRequestSiteGamePayload(siteGameEntry: any, locale: string, metadata: any) {
    return {
        ...siteGameEntry,
        fields: {
            ...siteGameEntry.fields,
            minBet: {
                ...siteGameEntry.fields.minBet,
                [locale]: `$${metadata.game.minStake.toString()}`
            },
            maxBet: {
                ...siteGameEntry.fields.maxBet,
                [locale]: `$${metadata.game.maxStake.toString()}`
            },
            platformVisibility: {
                [locale]: mapDeviceTypes(metadata.game.deviceType)
            },
            liveHidden: {
                [locale]: true
            }
        }
    };
};

export function updateRequestGamePayload(gameEntry: any, locale: string, siteGameMetadata: any, gameDetail: any, targetJurisdiction: string) {
    const metadata = gameDetail.variants.find((v: any) => v.jurisdiction === 'all') || gameDetail.variants.find((v: any) => v.jurisdiction === targetJurisdiction);
    return {
        ...gameEntry,
        fields: {
            ...gameEntry.fields,
            title: {
                ...gameEntry.fields.title,
                [locale]: gameDetail.game.name
            },
            minBet: {
                ...gameEntry.fields.minBet,
                [locale]: `$${siteGameMetadata.game.minStake.toString()}`
            },
            maxBet: {
                ...gameEntry.fields.maxBet,
                [locale]: `$${siteGameMetadata.game.maxStake.toString()}`
            },
            platformVisibility: {
                [locale]: mapDeviceTypes(siteGameMetadata.game.deviceType)
            },
            introductionContent: {
                ...gameEntry.fields.introductionContent
            },
            progressiveJackpot: {
                ...gameEntry.fields.progressiveJackpot,
                [locale]: siteGameMetadata.game.jackpot
            },
            gamePlatformConfig: {
                ...gameEntry.fields.gamePlatformConfig,
                [locale]: {
                    gameSkin: gameDetail.game.launchCode,
                    name: gameDetail.game.launchCode,
                    rtp: siteGameMetadata.game.rtp,
                    gameType: {
                        ...gameEntry.fields.gamePlatformConfig[locale]?.gameType,
                        type: siteGameMetadata.game.gameType,
                        maxExposure: metadata.maxExposureAmount.toString(),
                        maxMultiplier: metadata.maxExposureMultiplier.toString()
                    },
                    gameProvider: siteGameMetadata.game.distributor || '',
                    gameStudio: siteGameMetadata.game.providerTitle || '',
                    subGameType: SUB_GAME_TYPE_ID_MAP[metadata.subGameTypeId] || '',
                    federalGameType: FEDERAL_GAME_TYPE_ID_MAP[metadata.subGameTypeId] || '',
                }
            }
        }
    };
};
