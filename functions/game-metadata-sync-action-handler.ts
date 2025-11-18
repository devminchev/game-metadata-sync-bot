import { AppActionRequest, FunctionEventContext, FunctionEventHandler, FunctionTypeEnum } from "@contentful/node-apps-toolkit";
import { fetchGameDetail, fetchGamesList } from "./apis/externalGameMetadataApi.js";
import { updateRequestGamePayload, updateRequestSiteGamePayload } from "./utils/entryBuilder.js";

const opName = (isResetOperation: boolean) => isResetOperation ? "RESET_SYNC" : "UPDATE_SYNC";

export const gameMetadataActionHandler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (event: AppActionRequest, context: FunctionEventContext) => {
    const { appInstallationParameters } = context;
    const cma = context.cma!;
    const { body: { queryParams, entry, gameEntry, doReset = false } } = event as any;

    const siteGameEntry = JSON.parse(entry);
    const linkGameEntry = JSON.parse(gameEntry);
    const params = JSON.parse(queryParams);
    const gameCode = linkGameEntry.fields.launchCode?.[params.language];
    const queryString = new URLSearchParams(params).toString();
    let isResetOperation = false;

    try {
        const apiBaseUrl = params.jurisdiction !== 'CA-ON' ? appInstallationParameters.externalSourceApiHost : appInstallationParameters.secondaryExternalSourceApiHost;
        const [sourceGameDetails, sourceSiteGames] = await Promise.all([fetchGameDetail(apiBaseUrl, gameCode), fetchGamesList(apiBaseUrl, queryString)]);

        if (!doReset) {
            const isOutdated = sourceGameDetails && new Date(sourceGameDetails.game.updatedAt).getTime() > new Date(siteGameEntry.sys.updatedAt).getTime();
            if (!isOutdated) {
                return {
                    success: true,
                    status: 200,
                    data: {
                        code: "SYNC_NOT_REQUIRED_SUCCESS",
                        message: `gameCode: ${gameCode} => metadata is UP-TO-DATE. SYNC OP is not required.`,
                    },
                };
            };
        } else {
            isResetOperation = true;
        };

        const siteGameMetadata = sourceSiteGames.find((item: any) => item.game.launchCode === gameCode && item.jurisdictions.find((j: string) => j === params.jurisdiction));
        if (!siteGameMetadata) {
            throw new Error(`No sitegame metadata for ${gameCode}`);
        };

        const updateSite = cma.entry.update(
            { entryId: siteGameEntry.sys.id },
            updateRequestSiteGamePayload(siteGameEntry, params.language, siteGameMetadata)
        );
        const updateLink = cma.entry.update(
            { entryId: linkGameEntry.sys.id },
            updateRequestGamePayload(linkGameEntry, params.language, siteGameMetadata, sourceGameDetails, params.jurisdiction)
        );
        await Promise.all([updateSite, updateLink]);

        return {
            success: true,
            status: 200,
            data: {
                code: `${opName(isResetOperation)}_SUCCESS`,
                message: `gameCode: ${gameCode} => ${opName(isResetOperation)} is successful.`,
            }
        };
    } catch (error) {
        const errorMsg = `${opName(isResetOperation)}_ERROR App Action (${gameCode}) - ${(error as Error).message}`;
        console.error(errorMsg);

        return { success: false, error: errorMsg };
    };
};
