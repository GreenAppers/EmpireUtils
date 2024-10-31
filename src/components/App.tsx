import {
  Container,
  Flex,
  IconButton,
  Image,
  Tab,
  Tabs,
  TabList,
  TabPanel,
  TabPanels,
  Spacer,
  Box,
  useColorMode,
  useColorModeValue,
} from '@chakra-ui/react'
import React from 'react'
import { PieRayHelper } from './PieRayHelper'
import { Analytics } from './Analytics'

function App() {
  return (
    <Tabs variant="soft-rounded" colorScheme="green" defaultIndex={1}>
      <Box bg={useColorModeValue('gray.100', 'gray.900')} px={4}>
        <Flex alignItems="center" height="6rem">
          <IconButton
            aria-label="logo"
            width = "5rem"
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
        </Flex>
      </Box>
      <TabPanels>
        <TabPanel>
          <Analytics />
        </TabPanel>
        <TabPanel>
          <PieRayHelper />
        </TabPanel>
        <TabPanel></TabPanel>
        <TabPanel></TabPanel>
      </TabPanels>
    </Tabs>
  )
}

export default App
