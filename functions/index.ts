import { FunctionEventHandler } from '@contentful/node-apps-toolkit';
import { gameMetadataActionHandler } from "./game-metadata-sync-action-handler";

export const handler: FunctionEventHandler = async (event, context) => {
    switch (event.type) {
        case 'appaction.call':
            return gameMetadataActionHandler(event, context);
        default:
            throw new Error(`Unsupported event type: ${event.type}`);
    }
};
