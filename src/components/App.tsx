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
} from '@chakra-ui/react'
import React from 'react'
import { PieRayHelper } from './PieRayHelper'
import { Analytics } from './Analytics'

function App() {
  return (
    <Container>
      <Tabs variant="soft-rounded" colorScheme="green" defaultIndex={1}>
        <Flex alignItems="center">
          <IconButton
            aria-label="logo"
            icon={
              <Image src="https://github.com/GreenAppers/EmpireUtils/blob/389e3594b37a48f48d01fd8b8b48fa09fe9987fa/images/1024.png?raw=true" />
            }
          />
          &nbsp;
          <Spacer />
          <TabList>
            <Tab>Analytics</Tab>
            <Tab>Anti/PieRay</Tab>
            <Tab>Nether Portals</Tab>
            <Tab>Strongholds</Tab>
            <Tab>Waypoints</Tab>
          </TabList>
        </Flex>
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
    </Container>
  )
}

export default App
