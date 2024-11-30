import {
  Button,
  Flex,
  IconButton,
  Image,
  Tab,
  Tabs,
  TabList,
  TabPanel,
  TabPanels,
  Box,
  Avatar,
  Spacer,
  Tooltip,
  ColorModeProvider,
  ThemeProvider,
  extendTheme,
} from '@chakra-ui/react'
import React, { useMemo } from 'react'

import { useGameAcocuntsQuery } from '../hooks/useStore'
import { Analytics } from './Analytics'
import { Launcher } from './Launcher'
import { PieRayHelper } from './PieRayHelper'
import { Waypoints } from './Waypoints'
import { PlayerHead } from './PlayerHead'

export const theme = extendTheme({})

export function ThemedApp(props: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <ColorModeProvider value="dark">
        <Box
          color="chakra-body-text"
          style={{
            backgroundImage: 'url(app-file://images/icons/deepslate.png)',
            backgroundSize: '64px',
            height: '100%',
          }}
        >
          {props.children}
        </Box>
      </ColorModeProvider>
    </ThemeProvider>
  )
}

export function App() {
  const gameAccounts = useGameAcocuntsQuery()
  const gameAccount = useMemo(
    () => gameAccounts.data?.find((x) => x.active && x.profile.name),
    [gameAccounts.data]
  )
  const [selectedTab, setSelectedTab] = React.useState(2)

  return (
    <Tabs
      variant="soft-rounded"
      colorScheme="yellow"
      index={selectedTab}
      onChange={(index) => setSelectedTab(index)}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
    >
      <Box bgImage="app-file://images/icons/blackstone.png" bgSize={64} px={4}>
        <Flex alignItems="center" height="6rem">
          <IconButton
            aria-label="logo"
            width="5rem"
            variant="ghost"
            icon={<Image src="app-file://images/1024fg.png" />}
          />
          &nbsp;
          <TabList>
            <Tab color="yellow.100" _hover={{ color: 'yellow.300' }}>
              Analytics
            </Tab>
            <Tab color="yellow.100" _hover={{ color: 'yellow.300' }}>
              Anti/PieRay
            </Tab>
            <Tab color="yellow.100" _hover={{ color: 'yellow.300' }}>
              Launcher
            </Tab>
            <Tab color="yellow.100" _hover={{ color: 'yellow.300' }}>
              Strongholds
            </Tab>
            <Tab color="yellow.100" _hover={{ color: 'yellow.300' }}>
              Waypoints
            </Tab>
          </TabList>
          <Spacer />
          {gameAccount ? (
            <PlayerHead headSize={76} profile={gameAccount.profile} />
          ) : (
            <Button
              variant="ghost"
              onClick={() => window.api.loginToMicrosoftAccount()}
            >
              <Tooltip label="Sign in">
                <Avatar />
              </Tooltip>
            </Button>
          )}
        </Flex>
      </Box>
      <TabPanels>
        <TabPanel>{selectedTab === 0 && <Analytics />}</TabPanel>
        <TabPanel>{selectedTab === 1 && <PieRayHelper />}</TabPanel>
        <TabPanel>
          <Launcher />
        </TabPanel>
        <TabPanel></TabPanel>
        <TabPanel>{selectedTab === 4 && <Waypoints />}</TabPanel>
      </TabPanels>
    </Tabs>
  )
}
