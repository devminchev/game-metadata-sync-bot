import { useEffect } from 'react';
import { Button, Stack, Subheading, Text } from '@contentful/f36-components';
import useSyncAction from '../hooks/useSyncAction';
import useSidebarConfig from '../hooks/useSidebarConfig';

const Sidebar = () => {
    const { gameSiteDetails, ventureName, loadGameDetails } = useSidebarConfig();
    const { actionInProgress, onSyncAction } = useSyncAction();

    useEffect(() => {
        loadGameDetails();
    }, [actionInProgress]);

    return (
        <Stack fullWidth justifyContent='center' flexDirection="column">
            <Subheading>Game Config Updates & Sync</Subheading>
            <Button variant='primary' isFullWidth onClick={() => onSyncAction(gameSiteDetails, ventureName)} isDisabled={actionInProgress}>
                <Text fontColor="colorWhite" fontWeight="fontWeightMedium">CHECK & SYNC New Updates</Text>
            </Button>
            <Button variant='negative' size='small' onClick={() => onSyncAction(gameSiteDetails, ventureName, true)} isDisabled={actionInProgress}>
                <Text fontWeight='fontWeightDemiBold' fontColor='colorNegative'>RESTORE Active Data</Text>
            </Button>
        </Stack>
    );
};

export default Sidebar;
