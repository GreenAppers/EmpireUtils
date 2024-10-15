import {
  Container,
  Tab,
  Tabs,
  TabList,
  TabPanel,
  TabPanels,
} from '@chakra-ui/react'
import React from 'react'
import { PieRayHelper } from './PieRayHelper'
import { Analytics } from './Analytics'

function App() {
  return (
    <Container>
      <Tabs variant="soft-rounded" colorScheme="green" defaultIndex={1}>
        <TabList>
          <Tab>Analytics</Tab>
          <Tab>Anti/PieRay</Tab>
          <Tab>Nether Portals</Tab>
          <Tab>Strongholds</Tab>
          <Tab>Waypoints</Tab>
        </TabList>
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
