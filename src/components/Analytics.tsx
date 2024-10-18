import { Heading, IconButton, Link, Tooltip } from '@chakra-ui/react'
import { EditIcon } from '@chakra-ui/icons'
import React, { useEffect, useState } from 'react'

import type { TimeSeries } from '../types'
import { addSampleToTimeseries } from '../utils/timeseries'
import TimeseriesChart from './TimeseriesChart'

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

const playerKilledPVPLegacy =
  /(\S+) has been killed by (\S+) with ([.\d]+) health left./

function updateAnalyticsTimeSeries(
  analytics: Record<string, GameAnalytics>,
  window: AnalyticsWindow,
  userName: string,
  serverName: string,
  seriesName: string,
  value: number,
  timestamp: Date,
  source: string
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
  return {
    ...analytics,
    [key]: {
      ...userAnalytics,
      gamelogs: [
        ...userAnalytics.gamelogs,
        ...(userAnalytics.gamelogs.find((x) => x === source) ? [] : [source]),
      ],
      timeSeries: {
        ...userAnalytics.timeSeries,
        [seriesName]: timeseries,
      },
    },
  }
}

export function Analytics() {
  const [analytics, setAnalytics] = useState<Record<string, GameAnalytics>>({})
  const [analyticsProfile, setAnalyticsProfile] = useState('')
  const [analyticsWindow, setAnalyticsWindow] = useState<AnalyticsWindow>({
    beginDate: new Date(new Date().setHours(0, 0, 0, 0)),
    duration: 24 * 60 * 1000,
    samples: 24 * 10,
  })

  useEffect(() => {
    let total = 0
    let earliestTimestamp: Date | undefined

    const handle = window.api.readGameLogs(
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

        const soldContainerMatch = content.match(soldContainer)
        if (soldContainerMatch) {
          const soldContainerValue = parseFloat(
            soldContainerMatch[1].replace(/,/g, '')
          )
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
            'Sold container value',
            soldContainerValue,
            'Total',
            total,
            'Rate',
            ratePerMinute.toFixed(2),
            'per minute',
            (ratePerMinute * 60).toFixed(2),
            'per hour'
          )
          return
        }
      },
      analyticsWindow.beginDate,
      analyticsWindow.endDate
    )
    return () => window.api.removeListener(handle)
  }, [setAnalytics])

  /*
  useEffect(() => {
    const handle = setInterval(
      () =>
        setSoldTimeseries((timeseries) =>
          addSampleToTimeseries(0, new Date(), timeseries)
        ),
      30 * 1000
    )
    return () => clearInterval(handle)
  }, [setSoldTimeseries])
*/

  const session: GameAnalytics | undefined =
    analytics[analyticsProfile] || analytics[Object.keys(analytics)[0]]

  return (
    <>
      <Heading>
        📊{' '}
        {(session?.userName || '') +
          (session?.userName && session?.serverName ? ' @ ' : '') +
          (session?.serverName || '')}
      </Heading>
      <Heading as="h6" size="xs">
        Game log&nbsp;
        <Link
          onClick={() =>
            window.api.openBrowserWindow(`file://${session?.gamelogs?.[0]}`)
          }
        >
          {session?.gamelogs?.[0]}
        </Link>
        &nbsp;
        <Tooltip label="Choose game log">
          <IconButton
            aria-label="Game log"
            icon={<EditIcon />}
            onClick={() =>
              window.api
                .openFileDialog(session?.gamelogs?.[0])
                .then((gameLogPath) => {
                  console.log('setGameLogPath', gameLogPath)
                })
            }
          />
        </Tooltip>
      </Heading>

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
