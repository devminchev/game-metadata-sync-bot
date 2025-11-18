/* eslint-disable react-hooks/exhaustive-deps */
import axios from 'axios';
import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { Entry, PageAppSDK } from '@contentful/app-sdk';
import { buildGamePayload, updateRequestGamePayload, updateRequestSiteGamePayload } from '../utils/entryBuilder';
import { filterMissingGames, filterOutdatedGames } from '../utils/filterContent';
import pause from '../utils/pause';
import { BRAND_ID_MAP, DEFAULT_API_PARAMS, setWhiteHatParams } from '../utils/queryParamMaps';
import { CONTENTFUL_GAME_CONTENT_TYPE_ID, CONTENTFUL_SITEGAME_CONTENT_TYPE_ID, CONTENTFUL_VENTURE_CONTENT_TYPE_ID } from '../constants/cms';

function useGamesContent() {
    const { cma: { entry: contentfulClient }, notifier, locales, parameters: { installation } } = useSDK<PageAppSDK>();
    const [queryProgress, setQueryProgress] = useState(0);
    const [ventureEntries, setVentureEntries] = useState<Record<string, string>[]>([]);
    const [selectedVenture, setSelectedVenture] = useState<{ id: string, name: string }>({ id: '', name: '' });
    const [apiQueryParams, setApiQueryParams] = useState<any>(DEFAULT_API_PARAMS);
    const [apiBaseUrl, setApiBaseUrl] = useState('');
    const [gameContent, setGameContent] = useState<Entry[]>([]);
    const [externalSourceGames, setExternalSourceGames] = useState<any[]>([]);
    const [missingGamesContent, setMissingGamesContent] = useState<any[]>([]);
    const [outdatedGamesContent, setOutdatedGamesContent] = useState<any[]>([]);

    const loadVentures = async () => {
        try {
            const response = await contentfulClient.getPublished({ query: { content_type: CONTENTFUL_VENTURE_CONTENT_TYPE_ID, 'fields.name[exists]': true } });

            const mapped = response.items.filter((i: any) => BRAND_ID_MAP[i.fields.name[locales.default]]).map((i: any) => ({ id: i.sys.id, name: i.fields.name[locales.default] }))
            setVentureEntries(mapped);
            notifier.success(`Ventures succesfully loaded .`);
        } catch (err) {
            console.log(`Error: loading published Ventures: `, err);
            notifier.error(`Error: loading published Ventures failed .`);
        };
    };

    const onVentureSelect = (event: ChangeEvent<HTMLSelectElement>) => {
        const id = event.target.value;
        const name = event.target.options[event.target.selectedIndex].text;

        setSelectedVenture({ id, name });
        if (id) {
            const requiredParams = setWhiteHatParams(name);
            setApiQueryParams((prev: any) => ({ ...prev, ...requiredParams }))
            const apiBaseUrl = requiredParams?.jurisdiction !== 'CA-ON' ? installation?.externalSourceApiHost : installation?.secondaryExternalSourceApiHost;
            setApiBaseUrl(apiBaseUrl);
            setMissingGamesContent([]);
            setOutdatedGamesContent([]);
        } else {
            setApiQueryParams(DEFAULT_API_PARAMS);
            setApiBaseUrl('');
        };
    };

    const fetchGameContent = useCallback(async () => {
        setQueryProgress(0);
        const params = { content_type: CONTENTFUL_GAME_CONTENT_TYPE_ID };
        const batchSize = 100;
        let allEntries: Entry[] = [];
        let skip = 0;
        let totalFetched = 0;
        try {
            const { total } = await contentfulClient.getMany({
                query: { limit: batchSize, include: 0, ...params }
            });
            while (totalFetched < total) {
                const res = await contentfulClient.getMany({
                    query: { skip, limit: batchSize, include: 0, ...params }
                });
                allEntries = allEntries.concat(res.items);
                totalFetched += res.items.length;
                skip += res.items.length;
                const pct = Math.min(100, (totalFetched / total) * 100).toFixed(1);
                setQueryProgress(Number(pct));
            };
            notifier.success('Loaded existing game content');
        } catch (err) {
            console.error('fetchGameV2Content error', err);
            notifier.error('Failed to load existing game content');
        } finally {
            setQueryProgress(0);
        };
        setGameContent(allEntries);
        return allEntries;
    }, [contentfulClient]);

    const fetchSiteGameContent = useCallback(async () => {
        setQueryProgress(0);
        const params = { 'sys.contentType.sys.id[in]': `${CONTENTFUL_SITEGAME_CONTENT_TYPE_ID},${CONTENTFUL_GAME_CONTENT_TYPE_ID}` };
        const batchSize = 200;
        let allEntries: Entry[] = [];
        let skip = 0;
        let totalFetched = 0;
        try {
            const { total } = await contentfulClient.getMany({
                query: { limit: batchSize, include: 0, ...params }
            });
            while (totalFetched < total) {
                const res = await contentfulClient.getMany({
                    query: { skip, limit: batchSize, include: 0, ...params }
                });
                allEntries = allEntries.concat(res.items);
                totalFetched += res.items.length;
                skip += res.items.length;
                const pct = Math.min(100, (totalFetched / total) * 100).toFixed(1);
                setQueryProgress(Number(pct));
            };
            notifier.success('Loaded existing game content');
        } catch (err) {
            console.error('fetchGameV2Content error', err);
            notifier.error('Failed to load existing game content');
        } finally {
            setQueryProgress(0);
        };
        return allEntries;
    }, [contentfulClient]);

    const fetchExternalResources = useCallback(async () => {
        if (!selectedVenture.name || !apiBaseUrl) return;

        setQueryProgress(0);
        try {
            const { data } = await axios.get(`${apiBaseUrl}/api/games`, {
                params: apiQueryParams
            });
            notifier.success('Loaded external games list');

            setExternalSourceGames(data);
            return data;
        } catch (err) {
            console.error('scanExternalResources error', err);
            notifier.error('Failed to load external games');
            setExternalSourceGames([]);
            return [];
        } finally {
            setQueryProgress(0);
        }
    }, [selectedVenture, apiBaseUrl]);

    const checkMissingGames = useCallback(async () => {
        setOutdatedGamesContent([]);
        setQueryProgress(0);
        const externalList = await fetchExternalResources();
        const gameContents = await fetchSiteGameContent();
        if (externalList.length > 0) {
            const missingGames = filterMissingGames(externalList, gameContents, locales.default, selectedVenture.id);
            setMissingGamesContent(missingGames);
        } else {
            setMissingGamesContent([]);
        };
        setQueryProgress(0);
    }, [fetchGameContent, fetchExternalResources]);

    const checkOutdatedGames = useCallback(async () => {
        setMissingGamesContent([]);
        setQueryProgress(0);
        const externalList = await fetchExternalResources();
        const gameContents = await fetchSiteGameContent();

        if (externalList.length > 0 || gameContents.length > 0) {
            const outDated = filterOutdatedGames(externalList, gameContents, locales.default);
            setOutdatedGamesContent(outDated);
        } else {
            setOutdatedGamesContent([]);
        };
        setQueryProgress(0);
    }, [fetchGameContent, fetchExternalResources]);

    const createContents = useCallback(async () => {
        if (!selectedVenture.name || !apiBaseUrl || missingGamesContent.length === 0) return;

        setQueryProgress(0.1);
        try {
            for (let i = 0; i < missingGamesContent.length; i++) {
                const externalResourceSiteGame = missingGamesContent[i];
                const { data: details } = await axios.get(`${apiBaseUrl}/api/games/details/${externalResourceSiteGame.sourceGame.game.launchCode}`);

                // Pre-creation check: Verify if siteGame already exists for this game + venture combination
                try {
                    // First check if a game entry exists for this launch code
                    const existingGame = await contentfulClient.getMany({
                        query: {
                            content_type: CONTENTFUL_GAME_CONTENT_TYPE_ID,
                            'fields.launchCode': externalResourceSiteGame.sourceGame.game.launchCode
                        }
                    });

                    if (existingGame.items.length > 0) {
                        const gameEntryId = existingGame.items[0].sys.id;
                        
                        // Then check if a siteGame exists for this game + venture combination
                        const existingSiteGame = await contentfulClient.getMany({
                            query: {
                                content_type: CONTENTFUL_SITEGAME_CONTENT_TYPE_ID,
                                'fields.game.sys.id': gameEntryId,
                                'fields.venture.sys.id': selectedVenture.id
                            }
                        });

                        if (existingSiteGame.items.length > 0) {
                            console.log(`SiteGame already exists for game ${externalResourceSiteGame.sourceGame.game.launchCode} and venture ${selectedVenture.name}, skipping creation`);
                            continue; // Skip creation - already exists
                        }
                    }
                } catch (checkError) {
                    console.warn(`Error checking for existing siteGame: ${checkError}`);
                    // Continue with creation if check fails
                }

                if (!externalResourceSiteGame?.gameEntry) {
                    const createdGameContent = await contentfulClient.create(
                        { contentTypeId: CONTENTFUL_GAME_CONTENT_TYPE_ID },
                        {
                            fields: {
                                entryTitle: { [locales.default]: externalResourceSiteGame.sourceGame.game.seoName },
                                launchCode: { [locales.default]: externalResourceSiteGame.sourceGame.game.launchCode }
                            }
                        }
                    );
                    await contentfulClient.update(
                        { entryId: createdGameContent.sys.id },
                        buildGamePayload(createdGameContent, locales.default, externalResourceSiteGame.sourceGame, details, apiQueryParams.jurisdiction)
                    );
                    await pause(250);

                    await contentfulClient.create(
                        { contentTypeId: CONTENTFUL_SITEGAME_CONTENT_TYPE_ID },
                        {
                            fields: {
                                entryTitle: { [locales.default]: `${externalResourceSiteGame.sourceGame.game.seoName} [${selectedVenture.name}]` },
                                venture: {
                                    [locales.default]: {
                                        sys: {
                                            type: "Link",
                                            linkType: "Entry",
                                            id: selectedVenture.id
                                        }
                                    }
                                },
                                game: {
                                    [locales.default]: {
                                        sys: {
                                            type: "Link",
                                            linkType: "Entry",
                                            id: createdGameContent.sys.id
                                        }
                                    }
                                },
                                minBet: {
                                    [locales.default]: `$${externalResourceSiteGame.sourceGame.game.minStake.toString()}`
                                },
                                maxBet: {
                                    [locales.default]: `$${externalResourceSiteGame.sourceGame.game.maxStake.toString()}`
                                },
                                liveHidden: {
                                    [locales.default]: true
                                },
                                environment: {
                                    [locales.default]: ['staging', 'production']
                                },
                            }
                        }
                    );
                } else {
                    await contentfulClient.create(
                        { contentTypeId: CONTENTFUL_SITEGAME_CONTENT_TYPE_ID },
                        {
                            fields: {
                                entryTitle: { [locales.default]: `${externalResourceSiteGame.sourceGame.game.seoName} [${selectedVenture.name}]` },
                                venture: {
                                    [locales.default]: {
                                        sys: {
                                            type: "Link",
                                            linkType: "Entry",
                                            id: selectedVenture.id
                                        }
                                    }
                                },
                                game: {
                                    [locales.default]: {
                                        sys: {
                                            type: "Link",
                                            linkType: "Entry",
                                            id: externalResourceSiteGame.gameEntry.sys.id
                                        }
                                    }
                                },
                                minBet: {
                                    [locales.default]: `$${externalResourceSiteGame.sourceGame.game.minStake.toString()}`
                                },
                                maxBet: {
                                    [locales.default]: `$${externalResourceSiteGame.sourceGame.game.maxStake.toString()}`
                                },
                                liveHidden: {
                                    [locales.default]: true
                                },
                                environment: {
                                    [locales.default]: ['staging', 'production']
                                },
                            }
                        }
                    );
                }

                const pct = Math.min(100, ((i + 1) / missingGamesContent.length) * 100).toFixed(1);
                setQueryProgress(Number(pct));
            }
            notifier.success('Game & SiteGame contents created successfully .');
        } catch (err) {
            console.error('Game & SiteGame Create Error', err);
            notifier.error('Create Game & SiteGame Failed .');
        } finally {
            setQueryProgress(0);
            setMissingGamesContent([]);
        };

    }, [selectedVenture, missingGamesContent]);

    const updateOutdatedGames = useCallback(async () => {
        if (!selectedVenture.name || !apiBaseUrl || outdatedGamesContent.length === 0) return;

        setQueryProgress(0.1);
        try {
            for (let i = 0; i < outdatedGamesContent.length; i++) {
                const { siteGameEntry, gameEntry } = outdatedGamesContent[i];
                const launchCode = gameEntry.fields.launchCode?.[locales.default];
                const externalResourceSiteGame = externalSourceGames.find(i => i.game.launchCode === launchCode);
                // await onSyncAction({ siteGame: siteGameEntry, game: gameEntry }, selectedVenture.name);
                const { data: sourceGameDetails } = await axios.get(`${apiBaseUrl}/api/games/details/${launchCode}`);

                if (!sourceGameDetails) {
                    throw new Error(`No metadata for ${launchCode}`);
                };

                const updateGamePromise = contentfulClient.update(
                    { entryId: gameEntry.sys.id },
                    updateRequestGamePayload(gameEntry, locales.default, externalResourceSiteGame, sourceGameDetails, apiQueryParams.jurisdiction)
                );
                const updateSiteGamePromise = contentfulClient.update(
                    { entryId: siteGameEntry.sys.id },
                    updateRequestSiteGamePayload(siteGameEntry, locales.default, sourceGameDetails, apiQueryParams)
                );
                await Promise.all([updateGamePromise, updateSiteGamePromise]);

                const pct = Math.min(100, ((i + 1) / outdatedGamesContent.length) * 100).toFixed(1);
                setQueryProgress(Number(pct));

                await pause(250);
            }
            notifier.success('Update Game & SiteGame Contents successful .');
        } catch (err) {
            console.error('Update Game & SiteGame Contents Error', err);
            notifier.error('Update Game & SiteGame Contents Error .');
        } finally {
            setQueryProgress(0);
        };

        setOutdatedGamesContent([]);
    }, [selectedVenture, outdatedGamesContent, externalSourceGames]);

    useEffect(() => {
        loadVentures();
    }, []);

    return {
        queryProgress,
        ventureEntries,
        selectedVenture,
        gameContent,
        missingGamesContent,
        outdatedGamesContent,
        checkMissingGames,
        checkOutdatedGames,
        createContents,
        updateOutdatedGames,
        onVentureSelect
    };
};

export default useGamesContent;
