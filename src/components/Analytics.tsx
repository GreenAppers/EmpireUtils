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

import type { TimeSeries, TimeValue } from '../types'
import { addSamplesToTimeseries } from '../utils/timeseries'
import TimeseriesChart from './TimeseriesChart'
import { QUERY_KEYS, STORE_KEYS } from '../constants'
import { useQuery } from '@tanstack/react-query'

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

interface TimeseriesUpdates {
  sources: Set<string>
  values: Record<string, TimeValue[]>
}

type PlayersTimeseriesUpdates = Record<string, TimeseriesUpdates>

const soldContainer = /Successfully sold a container worth: \$([,\d]+.\d+)!/
const soldContainer2 = /Sold \d+ item\(s\) for \$([,\d]+.\d+)!/

const playerKilledPVPLegacy =
  /(\S+) has been killed by (\S+) with ([.\d]+) health left./

const formatPlayerKey = (userName: string, serverName: string) =>
  `${userName}@${serverName}`

const parsePlayerKey = (key: string) => {
  const [userName, serverName] = key.split('@')
  return { userName, serverName }
}

const ensureAnalyticsTimeSeriesUpdate = (
  updates: PlayersTimeseriesUpdates,
  userName: string,
  serverName: string
) => {
  const key = formatPlayerKey(userName, serverName)
  return updates[key] || (updates[key] = { sources: new Set(), values: {} })
}

const addAnalyticsTimeSeriesUpdate = (
  updates: PlayersTimeseriesUpdates,
  userName: string,
  serverName: string,
  seriesName: string,
  timestamp: Date,
  value: number
) => {
  const userUpdates = ensureAnalyticsTimeSeriesUpdate(
    updates,
    userName,
    serverName
  )
  const userSeriesUpdates =
    userUpdates.values[seriesName] || (userUpdates.values[seriesName] = [])
  userSeriesUpdates.push({ time: timestamp.getTime(), value })
}

function updateAnalyticsTimeSeries(
  analytics: Record<string, GameAnalytics>,
  window: AnalyticsWindow,
  updates: PlayersTimeseriesUpdates
) {
  const result = { ...analytics }
  for (const [key, seriesUpdates] of Object.entries(updates)) {
    const { userName, serverName } = parsePlayerKey(key)
    const userAnalytics = analytics[key] || {
      gamelogs: [],
      userName: userName,
      serverName: serverName,
      timeSeries: {},
    }
    const updatedUserAnalytics = (result[key] = {
      ...userAnalytics,
      gamelogs: Array.from(
        new Set([...userAnalytics.gamelogs, ...seriesUpdates.sources])
      ),
      timeSeries: { ...userAnalytics.timeSeries },
    })
    for (const [seriesName, values] of Object.entries(seriesUpdates.values)) {
      const timeseries = userAnalytics.timeSeries[seriesName] || {
        duration: window.duration,
        samples: window.samples,
        buckets: [],
      }
      updatedUserAnalytics.timeSeries[seriesName] = addSamplesToTimeseries(
        timeseries,
        values
      )
    }
  }
  const players = Object.keys(result)
  for (const player of players) {
    const userAnalytics = result[player]
    if (
      (!userAnalytics.userName || !userAnalytics.serverName) &&
      !Object.keys(userAnalytics.timeSeries).length
    ) {
      delete result[player]
    }
  }
  return result
}

function topUpAnalyticsTimeSeries(analytics: Record<string, GameAnalytics>) {
  const now = new Date()
  const result = { ...analytics }
  for (const key in analytics) {
    const userAnalytics = analytics[key]
    for (const seriesName in userAnalytics.timeSeries) {
      const timeseries = userAnalytics.timeSeries[seriesName]
      result[key].timeSeries[seriesName] = addSamplesToTimeseries(timeseries, [
        { time: now.getTime(), value: 0 },
      ])
    }
  }
  return result
}

export const useGameLogDirectoriesQuery = () =>
  useQuery<string[]>({
    queryKey: [QUERY_KEYS.useGameLogDirectories],
    queryFn: () => window.api.store.get(STORE_KEYS.gameLogDirectories),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

export function Analytics() {
  const [analytics, setAnalytics] = useState<Record<string, GameAnalytics>>({})
  const [analyticsProfile, setAnalyticsProfile] = useState('')
  const [analyticsWindow, setAnalyticsWindow] = useState<AnalyticsWindow>({
    beginDate: new Date(new Date().setHours(0, 0, 0, 0) - 24 * 60 * 60 * 1000),
    duration: 60 * 1000,
    samples: 24 * 60,
  })
  const gameLogDirectories = useGameLogDirectoriesQuery()
  const [showGameLogDirectories, setShowGameLogDirectories] = useState(false)
  const [showGameLogFiles, setShowGameLogFiles] = useState(false)

  useEffect(() => {
    let total = 0
    let earliestTimestamp: Date | undefined
    if (!gameLogDirectories.isSuccess || !gameLogDirectories.data?.length)
      return

    const handle = window.api.readGameLogs(
      gameLogDirectories.data,
      (lines) => {
        const updates: PlayersTimeseriesUpdates = {}
        for (const line of lines) {
          if (!earliestTimestamp) earliestTimestamp = line.timestamp
          ensureAnalyticsTimeSeriesUpdate(
            updates,
            line.userName,
            line.serverName
          ).sources.add(line.source)

          const playerKilledPVPLegacyMatch = line.content.match(
            playerKilledPVPLegacy
          )
          if (playerKilledPVPLegacyMatch) {
            let userNameMatch = false
            if (playerKilledPVPLegacyMatch[1] === line.userName) {
              addAnalyticsTimeSeriesUpdate(
                updates,
                line.userName,
                line.serverName,
                'deaths',
                line.timestamp,
                1
              )
              userNameMatch = true
            }
            if (playerKilledPVPLegacyMatch[2] === line.userName) {
              addAnalyticsTimeSeriesUpdate(
                updates,
                line.userName,
                line.serverName,
                'kills',
                line.timestamp,
                1
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
                line.source
              )
            continue
          }

          let soldContainerValue = 0
          const soldContainerMatch = line.content.match(soldContainer)
          if (soldContainerMatch) {
            soldContainerValue = parseFloat(
              soldContainerMatch[1].replace(/,/g, '')
            )
          }
          const soldContainerMatch2 = line.content.match(soldContainer2)
          if (soldContainerMatch2) {
            soldContainerValue = parseFloat(
              soldContainerMatch2[1].replace(/,/g, '')
            )
          }

          if (soldContainerValue) {
            total += soldContainerValue
            addAnalyticsTimeSeriesUpdate(
              updates,
              line.userName,
              line.serverName,
              'sold',
              line.timestamp,
              soldContainerValue
            )
            const totalSeconds =
              (line.timestamp.getTime() - earliestTimestamp.getTime()) / 1000
            const ratePerMinute = (total * 60) / totalSeconds
            console.log(
              `${line.userName}@${line.serverName} Sold container value`,
              soldContainerValue,
              'Total',
              total,
              'Rate',
              ratePerMinute.toFixed(2),
              'per minute',
              (ratePerMinute * 60).toFixed(2),
              'per hour',
              line.timestamp,
              line.source
            )
            continue
          }
        }
        setAnalytics((analytics) =>
          updateAnalyticsTimeSeries(analytics, analyticsWindow, updates)
        )
      },
      analyticsWindow.beginDate,
      analyticsWindow.endDate
    )
    return () => window.api.removeListener(handle)
  }, [
    analyticsWindow,
    gameLogDirectories.isSuccess,
    gameLogDirectories.data,
    setAnalytics,
  ])

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
              <option key={profile} value={profile}>{profile}</option>
            ))}
          </Select>
        </Flex>
      </Heading>

      <Heading as="h6" size="xs" marginTop="1rem">
        Game logs&nbsp;
        <Tooltip label="Show game log files">
          <IconButton
            aria-label="Game log files"
            icon={showGameLogFiles ? <ChevronDownIcon /> : <ChevronUpIcon />}
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
            <ListItem key={gamelog}>
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
            {(gameLogDirectories.data ?? []).map((directory) => (
              <ListItem key={directory}>
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
