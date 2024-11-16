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
  useColorModeValue,
  Avatar,
  Spacer,
  Tooltip,
} from '@chakra-ui/react'
import React from 'react'
import { Analytics } from './Analytics'
import { Launcher } from './Launcher'
import { PieRayHelper } from './PieRayHelper'
import { Waypoints } from './Waypoints'

function App() {
  const [selectedTab, setSelectedTab] = React.useState(2)
  return (
    <Tabs
      variant="soft-rounded"
      colorScheme="green"
      index={selectedTab}
      onChange={(index) => setSelectedTab(index)}
    >
      <Box bg={useColorModeValue('gray.100', 'gray.900')} px={4}>
        <Flex alignItems="center" height="6rem">
          <IconButton
            aria-label="logo"
            width="5rem"
            icon={
              <Image src="https://github.com/GreenAppers/EmpireUtils/blob/389e3594b37a48f48d01fd8b8b48fa09fe9987fa/images/1024.png?raw=true" />
            }
          />
          &nbsp;
          <TabList>
            <Tab>Analytics</Tab>
            <Tab>Anti/PieRay</Tab>
            <Tab>Launcher</Tab>
            <Tab>Strongholds</Tab>
            <Tab>Waypoints</Tab>
          </TabList>
          <Spacer />
          <Button onClick={() => window.api.loginToMicrosoftAccount()}>
            <Tooltip label="Sign in">
              <Avatar />
            </Tooltip>
          </Button>
        </Flex>
      </Box>
      <TabPanels>
        <TabPanel>{selectedTab === 0 && <Analytics />}</TabPanel>
        <TabPanel>{selectedTab === 1 && <PieRayHelper />}</TabPanel>
        <TabPanel>{selectedTab === 2 && <Launcher />}</TabPanel>
        <TabPanel></TabPanel>
        <TabPanel>{selectedTab === 4 && <Waypoints />}</TabPanel>
      </TabPanels>
    </Tabs>
  )
}

export default App
