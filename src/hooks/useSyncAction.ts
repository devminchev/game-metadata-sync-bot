import { useState } from 'react';
import { CreateAppActionCallProps, CreateWithResponseParams } from 'contentful-management';
import { useSDK } from '@contentful/react-apps-toolkit';
import { DEFAULT_API_PARAMS, setWhiteHatParams } from '../utils/queryParamMaps';
import { SidebarAppSDK } from '@contentful/app-sdk';

function useSyncAction() {
    const { cma, ids, notifier } = useSDK<SidebarAppSDK>();
    const [actionInProgress, setActionInProgress] = useState(false);

    async function onSyncAction(gameSiteDetails: any, ventureName: string, doReset = false) {
        if (!ids.app || !ventureName) return;

        try {
            setActionInProgress(true);
            const actionCallResponse = await cma.appActionCall.createWithResponse(
                {
                    appActionId: "gameMetadataSyncAction",
                    appDefinitionId: ids.app,
                    retries: 2,
                } as CreateWithResponseParams,
                {
                    parameters: {
                        queryParams: JSON.stringify({ ...DEFAULT_API_PARAMS, ...setWhiteHatParams(ventureName) }),
                        entry: JSON.stringify(gameSiteDetails.siteGame),
                        gameEntry: JSON.stringify(gameSiteDetails.game),
                        doReset,
                    },
                } as CreateAppActionCallProps
            );
            const response = JSON.parse(actionCallResponse.response.body);

            if (!response.success) {
                throw new Error(response.error);
            };

            switch (response.data.code) {
                case "UPDATE_SYNC_SUCCESS":
                    notifier.success(response.data.message);
                    break;
                case "RESET_SYNC_SUCCESS":
                    notifier.success(response.data.message);
                    break;
                case "SYNC_NOT_REQUIRED_SUCCESS":
                    notifier.warning(response.data.message);
                    break;
                default:
                    notifier.warning(response.data.message);
            };
        } catch (error) {
            console.log(error as any);
            notifier.error((error as any).message);
        } finally {
            setActionInProgress(false);
        };
    };

    return { actionInProgress, onSyncAction };
};

export default useSyncAction;
