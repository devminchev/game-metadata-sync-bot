import { useSDK } from '@contentful/react-apps-toolkit';
import { PageAppSDK } from '@contentful/app-sdk';
import { Button, FormControl, Heading, Select, Stack, Table } from '@contentful/f36-components';
import useGamesContent from '../hooks/useGamesContent';
import { PAGE_TABLE_HEADER_STYLE } from '../constants/ui';

const Page = () => {
    const { locales } = useSDK<PageAppSDK>();
    const {
        gameContent,
        ventureEntries,
        selectedVenture,
        onVentureSelect,
        queryProgress,
        missingGamesContent,
        checkMissingGames,
        outdatedGamesContent,
        checkOutdatedGames,
        createContents,
        updateOutdatedGames
    } = useGamesContent();

    const disabledScanAction = !selectedVenture || !selectedVenture.id || queryProgress > 0;
    const disabledCreateAction = !selectedVenture || !selectedVenture.id || missingGamesContent.length === 0 || queryProgress > 0;
    const disabledUpdateAction = !selectedVenture || !selectedVenture.id || outdatedGamesContent.length === 0 || queryProgress > 0;
    const disabledPublishAction = !selectedVenture || !selectedVenture.id || missingGamesContent.length === 0 || queryProgress > 0;

    const renderList = () => {
        if (missingGamesContent.length > 0) {
            return (
                <Stack fullWidth fullHeight justifyContent='center' flexDirection="column">
                    <Heading>Missing Games </Heading>
                    <Table align='center'>
                        <Table.Head>
                            <Table.Row>
                                <Table.Cell align='center' style={PAGE_TABLE_HEADER_STYLE}>#</Table.Cell>
                                <Table.Cell align='center' style={PAGE_TABLE_HEADER_STYLE}>GAME LAUNCH CODE</Table.Cell>
                                <Table.Cell align='center' style={PAGE_TABLE_HEADER_STYLE}>GAME-V2 ENTRY ID</Table.Cell>
                            </Table.Row>
                        </Table.Head>
                        <Table.Body>
                            {missingGamesContent.map((content: any, index: number) => {
                                return (
                                    <Table.Row key={index + 1}>
                                        <Table.Cell align='center'>{index + 1}</Table.Cell>
                                        <Table.Cell align='center' style={{ fontSize: '12px' }}>
                                            {content.sourceGame.game.launchCode}
                                        </Table.Cell>
                                        <Table.Cell align='center' style={{ fontSize: '12px' }}>{content.gameEntry?.sys.id || "N/A"}</Table.Cell>
                                    </Table.Row>
                                );
                            })}
                        </Table.Body>
                    </Table>
                </Stack>
            )
        };

        if (outdatedGamesContent.length > 0) {
            return (
                <Stack fullWidth fullHeight justifyContent='center' flexDirection="column">
                    <Heading>Outdated Games</Heading>
                    <Table align='center'>
                        <Table.Head>
                            <Table.Row>
                                <Table.Cell align='center' style={PAGE_TABLE_HEADER_STYLE}>#</Table.Cell>
                                <Table.Cell align='center' style={PAGE_TABLE_HEADER_STYLE}>SITEGAME-V2 ENTRY ID</Table.Cell>
                                <Table.Cell align='center' style={PAGE_TABLE_HEADER_STYLE}>GAME-V2 ENTRY ID</Table.Cell>
                                <Table.Cell align='center' style={PAGE_TABLE_HEADER_STYLE}>GAME-V2 LAUNCH CODE</Table.Cell>
                            </Table.Row>
                        </Table.Head>
                        <Table.Body>
                            {outdatedGamesContent.map((content: any, index: number) => {
                                return (
                                    <Table.Row key={index + 1}>
                                        <Table.Cell align='center' style={{ fontSize: '12px' }}>{index + 1}</Table.Cell>
                                        <Table.Cell align='center' style={{ fontSize: '12px' }}>{content.siteGameEntry.sys.id}</Table.Cell>
                                        <Table.Cell align='center' style={{ fontSize: '12px' }}>{content.gameEntry.sys.id}</Table.Cell>
                                        <Table.Cell align='center' style={{ fontSize: '12px' }}>{content.gameEntry.fields.launchCode?.[locales.default]}</Table.Cell>
                                    </Table.Row>
                                );
                            })}
                        </Table.Body>
                    </Table>
                </Stack>
            )
        };

        return null;
    };

    return (
        <Stack flexDirection="column" spacing="spacingL">
            <Heading>Game Metadata Actions</Heading>
            <Stack fullWidth justifyContent='center'>
                <FormControl id="ventures" isRequired isInvalid={!selectedVenture?.id} style={{ width: '30%', margin: '5px' }} maxLength={300}>
                    <FormControl.Label>
                        Select Venture
                    </FormControl.Label>
                    <Select
                        id="ventures"
                        name="ventures"
                        value={selectedVenture?.id || ''}
                        onChange={onVentureSelect}
                    >
                        <Select.Option key="none" value="">
                            Select Venture
                        </Select.Option>
                        {ventureEntries?.map((venture: any) => (
                            <Select.Option key={venture.id} value={venture.id}>
                                {venture.name}
                            </Select.Option>
                        ))}
                    </Select>
                </FormControl>
            </Stack>
            <Stack fullWidth justifyContent='space-evenly' flexWrap='wrap' alignItems='center'>
                <Button variant='negative' onClick={checkMissingGames} isLoading={queryProgress > 0} isDisabled={disabledScanAction} style={{ maxWidth: '270px' }}>
                    Missing Game Contents {missingGamesContent.length}
                </Button>
                <Button variant='secondary' onClick={checkOutdatedGames} isLoading={queryProgress > 0} isDisabled={disabledScanAction} style={{ maxWidth: '270px' }}>
                    Outdated Game Contents {gameContent.length}
                </Button>
                <Button variant='primary' onClick={createContents} isLoading={queryProgress > 0} isDisabled={disabledCreateAction} style={{ maxWidth: '270px' }}>
                    Create Missing Game Contents
                </Button>
                <Button variant='primary' onClick={updateOutdatedGames} isLoading={queryProgress > 0} isDisabled={disabledUpdateAction} style={{ maxWidth: '270px' }}>
                    Update Outdated Games Contents
                </Button>
                {/* <Button variant='positive' onClick={createContents} isLoading={queryProgress > 0} isDisabled={disabledPublishAction}>
                    Publish New Games Contents
                </Button> */}
            </Stack>
            {renderList()}
        </Stack>
    )
};

export default Page;
