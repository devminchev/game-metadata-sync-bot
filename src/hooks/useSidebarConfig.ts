import { useEffect, useState } from 'react';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { CONTENTFUL_GAME_CONTENT_TYPE_ID, CONTENTFUL_JURISDICTION_CONTENT_TYPE_ID, CONTENTFUL_VENTURE_CONTENT_TYPE_ID } from '../constants/cms';

function useSidebarConfig() {
    const { cma, entry, locales } = useSDK<SidebarAppSDK>();
    const [gameSiteDetails, setGameSiteDetails] = useState<any>(null);
    const [ventureName, setVentureName] = useState('');
    useAutoResizer();

    const loadGameDetails = async () => {
        const siteGameRefs = await cma.entry.references({ entryId: entry.getSys().id, include: 2 });
        const siteGame = siteGameRefs.items[0];
        const gameRefLink = siteGameRefs.includes?.Entry?.filter((ref) => ref.sys.contentType.sys.id === CONTENTFUL_GAME_CONTENT_TYPE_ID)?.[0];
        const ventureRefLink = siteGameRefs.includes?.Entry?.filter((ref) => ref.sys.contentType.sys.id === CONTENTFUL_VENTURE_CONTENT_TYPE_ID)?.[0];
        const jurisdictionRefLink = siteGameRefs.includes?.Entry?.filter((ref) => ref.sys.contentType.sys.id === CONTENTFUL_JURISDICTION_CONTENT_TYPE_ID)?.[0];

        if (!gameRefLink || !ventureRefLink || !jurisdictionRefLink) {
            console.log('Missing required link entries !');

            return;
        };
        if (!gameRefLink.fields.launchCode) {
            console.log('Linked game entry has no launch code !');

            return;
        };
        setVentureName(ventureRefLink?.fields.name[locales.default])
        setGameSiteDetails({ siteGame, game: gameRefLink });
    };

    useEffect(() => {
        if (!entry.fields.game || !entry.fields.venture) return;

        loadGameDetails();
    }, []);

    return { gameSiteDetails, loadGameDetails, ventureName };
}

export default useSidebarConfig;
