import { FEDERAL_GAME_TYPE_ID_MAP, SUB_GAME_TYPE_ID_MAP } from '../constants/metadataMaps.js';
import { mapDeviceTypes } from './platformMapper.js';

export function buildSitegamePayload(siteGameEntry: any, locale: string, metadata: any, deviceTypes: string[]) {
    return {
        ...siteGameEntry,
        fields: {
            ...siteGameEntry.fields,
            minBet: {
                ...siteGameEntry.fields.minBet,
                [locale]: `$${metadata.minStake.toString()}`
            },
            maxBet: {
                ...siteGameEntry.fields.maxBet,
                [locale]: `$${metadata.maxStake.toString()}`
            },
            platformVisibility: {
                [locale]: mapDeviceTypes(deviceTypes)
            },
            liveHidden: {
                [locale]: true
            }
        }
    };
};

export function buildGamePayload(gameEntry: any, locale: string, siteGameMetadata: any, gameDetail: any, targetJurisdiction: string) {
    const metadata = gameDetail.variants.find((v: any) => v.jurisdiction === 'all') || gameDetail.variants.find((v: any) => v.jurisdiction === targetJurisdiction);
    const sharedImagePattern = createNaImgPattern(gameDetail?.game?.launchCode, locale);
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
            progressiveJackpot: {
                [locale]: false
            },
            operatorBarDisabled: {
                [locale]: false
            },
            rgpEnabled: {
                [locale]: false
            },
            vendor: {
                [locale]: 'whitehat'
            },
            platform: {
                [locale]: ['Desktop', 'Tablet', 'Phone']
            },
            funPanelEnabled: {
                [locale]: false
            },
            imgUrlPattern:sharedImagePattern,
            loggedOutImgUrlPattern: sharedImagePattern,
            infoImgUrlPattern: sharedImagePattern,
            dfgWeeklyImgUrlPattern: sharedImagePattern,
            introductionContent: {
                [locale]: gameDetail?.description?.description || ''
            },
            gamePlatformConfig: {
                [locale]: {
                    gameSkin: gameDetail.game.launchCode,
                    name: gameDetail.game.launchCode,
                    rtp: siteGameMetadata.game.rtp,
                    gameType: {
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

export function updateRequestSiteGamePayload(siteGameEntry: any, locale: string, sourceGameDetail: any, apiQueryParams: any) {
    const siteGameMetadata = sourceGameDetail.variants.find((v: any) => v.jurisdiction === apiQueryParams.jurisdiction && v.brandId === apiQueryParams.brandId);

    return {
        ...siteGameEntry,
        fields: {
            ...siteGameEntry.fields,
            minBet: {
                ...siteGameEntry.fields.minBet,
                [locale]: siteGameMetadata?.minStake ? `$${siteGameMetadata?.minStake?.toString()}` : ''
            },
            maxBet: {
                ...siteGameEntry.fields.maxBet,
                [locale]: siteGameMetadata?.maxStake ? `$${siteGameMetadata?.maxStake?.toString()}` : ''
            },
            platformVisibility: {
                [locale]: mapDeviceTypes(sourceGameDetail.game.deviceType)
            },
            liveHidden: {
                [locale]: true
            }
        }
    };
};

export function updateRequestGamePayload(gameEntry: any, locale: string, siteGameMetadata: any, gameDetail: any, targetJurisdiction: string) {
    const metadata = gameDetail.variants.find((v: any) => v.jurisdiction === 'all') || gameDetail.variants.find((v: any) => v.jurisdiction === targetJurisdiction);
    const sharedImagePattern = createNaImgPattern(gameDetail?.game?.launchCode, locale);
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
                [locale]: siteGameMetadata?.minStake ? `$${siteGameMetadata.game?.minStake?.toString()}` : ''
            },
            maxBet: {
                ...gameEntry.fields.maxBet,
                [locale]: siteGameMetadata?.maxStake ? `$${siteGameMetadata.game?.maxStake?.toString()}` : ''
            },
            platformVisibility: {
                [locale]: mapDeviceTypes(siteGameMetadata.game.deviceType)
            },
            funPanelEnabled: {
                [locale]: false
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

export const createNaImgPattern = (launchCode: string, spaceLocale: string) => {
    return {[spaceLocale]: `/assets/common/images/casino/tiles/${launchCode}/scale-2/game-tile-15-444.jpg`};
}
