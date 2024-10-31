import {
  Flex,
  Heading,
  IconButton,
  Link,
  List,
  ListItem,
  Select,
  Tooltip,
} from '@chakra-ui/react'
import {
  ChevronDownIcon,
  ChevronUpIcon,
  EditIcon,
  SettingsIcon,
} from '@chakra-ui/icons'
import React, { useEffect, useState } from 'react'

import type { TimeSeries } from '../types'
import { addSampleToTimeseries } from '../utils/timeseries'
import TimeseriesChart from './TimeseriesChart'
import { STORE_KEYS } from '../constants'

interface AnalyticsWindow {
  beginDate?: Date
  endDate?: Date
  duration: number
  samples: number
}

interface GameAnalytics {
  gamelogs: string[]
  userName: string
  serverName: string
  timeSeries: Record<string, TimeSeries>
}

const soldContainer = /Successfully sold a container worth: \$([,\d]+.\d+)!/
const soldContainer2 = /Sold \d+ item\(s\) for \$([,\d]+.\d+)!/

const playerKilledPVPLegacy =
  /(\S+) has been killed by (\S+) with ([.\d]+) health left./

function topUpAnalyticsTimeSeries(analytics: Record<string, GameAnalytics>) {
  const now = new Date()
  const result = { ...analytics }
  for (const key in analytics) {
    const userAnalytics = analytics[key]
    for (const seriesName in userAnalytics.timeSeries) {
      const timeseries = userAnalytics.timeSeries[seriesName]
      result[key].timeSeries[seriesName] = addSampleToTimeseries(
        0,
        now,
        timeseries,
        now
      )
    }
  }
  return result
}

function updateAnalyticsTimeSeries(
  analytics: Record<string, GameAnalytics>,
  window: AnalyticsWindow,
  userName: string,
  serverName: string,
  seriesName: string,
  value: number,
  timestamp: Date,
  source?: string
) {
  const key = `${userName}@${serverName}`
  let userAnalytics = analytics[key]
  if (!userAnalytics) {
    userAnalytics = {
      gamelogs: [],
      userName: userName,
      serverName: serverName,
      timeSeries: {},
    }
  }
  let timeseries = userAnalytics.timeSeries[seriesName]
  if (!timeseries) {
    timeseries = {
      duration: window.duration,
      samples: window.samples,
      buckets: [],
    }
  }
  timeseries = addSampleToTimeseries(value, timestamp, timeseries, timestamp)
  const result = {
    ...analytics,
    [key]: {
      ...userAnalytics,
      gamelogs: [
        ...userAnalytics.gamelogs,
        ...(!source || userAnalytics.gamelogs.find((x) => x === source)
          ? []
          : [source]),
      ],
      timeSeries: {
        ...userAnalytics.timeSeries,
        [seriesName]: timeseries,
      },
    },
  }
  // console.log('updateAnalyticsTimeSeries result', result)
  return result
}

export function Analytics() {
  const [analytics, setAnalytics] = useState<Record<string, GameAnalytics>>({})
  const [analyticsProfile, setAnalyticsProfile] = useState('')
  const [analyticsWindow, setAnalyticsWindow] = useState<AnalyticsWindow>({
    beginDate: new Date(new Date().setHours(0, 0, 0, 0) - 24 * 60 * 60 * 1000),
    duration: 60 * 1000,
    samples: 24 * 60,
  })
  const [gameLogDirectories, setGameLogDirectories] = useState<string[]>([])
  const [showGameLogDirectories, setShowGameLogDirectories] = useState(false)
  const [showGameLogFiles, setShowGameLogFiles] = useState(false)

  // load store
  useEffect(() => {
    setGameLogDirectories(window.api.store.get(STORE_KEYS.gameLogDirectories))
  }, [])

  useEffect(() => {
    let total = 0
    let earliestTimestamp: Date | undefined
    if (!gameLogDirectories.length) return

    const handle = window.api.readGameLogs(
      gameLogDirectories,
      (
        userName: string,
        serverName: string,
        content: string,
        timestamp: Date,
        source: string
      ) => {
        if (!earliestTimestamp) earliestTimestamp = timestamp

        const playerKilledPVPLegacyMatch = content.match(playerKilledPVPLegacy)
        if (playerKilledPVPLegacyMatch) {
          let userNameMatch = false
          if (playerKilledPVPLegacyMatch[1] === userName) {
            setAnalytics((analytics) =>
              updateAnalyticsTimeSeries(
                analytics,
                analyticsWindow,
                userName,
                serverName,
                'deaths',
                1,
                timestamp,
                source
              )
            )
            userNameMatch = true
          }
          if (playerKilledPVPLegacyMatch[2] === userName) {
            setAnalytics((analytics) =>
              updateAnalyticsTimeSeries(
                analytics,
                analyticsWindow,
                userName,
                serverName,
                'kills',
                1,
                timestamp,
                source
              )
            )
            userNameMatch = true
          }
          if (userNameMatch)
            console.log(
              'PVP kill',
              playerKilledPVPLegacyMatch[1],
              'was killed by',
              playerKilledPVPLegacyMatch[2],
              'with',
              playerKilledPVPLegacyMatch[3],
              'health left',
              source
            )
          return
        }

        let soldContainerValue = 0
        const soldContainerMatch = content.match(soldContainer)
        if (soldContainerMatch) {
          soldContainerValue = parseFloat(
            soldContainerMatch[1].replace(/,/g, '')
          )
        }
        const soldContainerMatch2 = content.match(soldContainer2)
        if (soldContainerMatch2) {
          soldContainerValue = parseFloat(
            soldContainerMatch2[1].replace(/,/g, '')
          )
        }

        if (soldContainerValue) {
          total += soldContainerValue
          setAnalytics((analytics) =>
            updateAnalyticsTimeSeries(
              analytics,
              analyticsWindow,
              userName,
              serverName,
              'sold',
              soldContainerValue,
              timestamp,
              source
            )
          )
          const totalSeconds =
            (timestamp.getTime() - earliestTimestamp.getTime()) / 1000
          const ratePerMinute = (total * 60) / totalSeconds
          console.log(
            `${userName}@${serverName} Sold container value`,
            soldContainerValue,
            'Total',
            total,
            'Rate',
            ratePerMinute.toFixed(2),
            'per minute',
            (ratePerMinute * 60).toFixed(2),
            'per hour',
            timestamp,
            source
          )
          return
        }
      },
      analyticsWindow.beginDate,
      analyticsWindow.endDate
    )
    return () => window.api.removeListener(handle)
  }, [analyticsWindow, gameLogDirectories, setAnalytics])

  useEffect(() => {
    setAnalytics(topUpAnalyticsTimeSeries)
    const handle = setInterval(
      () => setAnalytics(topUpAnalyticsTimeSeries),
      30 * 1000
    )
    return () => clearInterval(handle)
  }, [setAnalytics])

  const sessionName = analytics[analyticsProfile]
    ? analyticsProfile
    : Object.keys(analytics)[0] ?? ''
  const session: GameAnalytics | undefined = analytics[sessionName]

  return (
    <>
      <Heading>
        <Flex>
          📊&nbsp;
          <Select
            value={sessionName}
            onChange={(event) => setAnalyticsProfile(event.target.value)}
          >
            {Object.keys(analytics).map((profile) => (
              <option value={profile}>{profile}</option>
            ))}
          </Select>
        </Flex>
      </Heading>

      <Heading as="h6" size="xs" marginTop="1rem">
        Game logs&nbsp;
        <Tooltip label="Show game log files">
          <IconButton
            aria-label="Game log files"
            icon={showGameLogFiles ? <ChevronUpIcon /> : <ChevronDownIcon />}
            onClick={() => setShowGameLogFiles((x) => !x)}
          />
        </Tooltip>
        &nbsp;
        <Tooltip label="Setup game log directories">
          <IconButton
            aria-label="Game log directories"
            icon={<SettingsIcon />}
            onClick={() => setShowGameLogDirectories((x) => !x)}
          />
        </Tooltip>
      </Heading>

      {showGameLogFiles && (
        <List>
          {(session?.gamelogs ?? []).map((gamelog) => (
            <ListItem>
              <Link
                onClick={() =>
                  window.api.openBrowserWindow(`file://${gamelog}`)
                }
              >
                {gamelog}
              </Link>
            </ListItem>
          ))}
        </List>
      )}

      {showGameLogDirectories && (
        <>
          <Heading as="h6" size="xs" marginTop="1rem">
            Game log directories
          </Heading>
          <List>
            {(gameLogDirectories ?? []).map((directory) => (
              <ListItem>
                <Link
                  onClick={() =>
                    window.api.openBrowserWindow(`file://${directory}`)
                  }
                >
                  {directory}
                </Link>
              </ListItem>
            ))}
            <ListItem>
              <Tooltip label="Add game log directory">
                <>
                  <IconButton
                    aria-label="Add game log directory"
                    icon={<EditIcon />}
                    onClick={() =>
                      window.api
                        .openFileDialog(session?.gamelogs?.[0])
                        .then((gameLogPath) => {
                          console.log('setGameLogPath', gameLogPath)
                        })
                    }
                  />
                  &nbsp;Add directory
                </>
              </Tooltip>
            </ListItem>
          </List>
        </>
      )}

      <Heading as="h5" size="sm" marginTop="2rem">
        Kills
      </Heading>
      <TimeseriesChart timeseries={session?.timeSeries?.['kills']} />

      <Heading as="h5" size="sm" marginTop="2rem">
        Deaths
      </Heading>
      <TimeseriesChart timeseries={session?.timeSeries?.['deaths']} />

      <Heading as="h5" size="sm" marginTop="2rem">
        Successfully sold a container worth
      </Heading>
      <TimeseriesChart timeseries={session?.timeSeries?.['sold']} />
    </>
  )
}
