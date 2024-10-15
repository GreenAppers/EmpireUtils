import React, { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { GameLog, TimeSeries } from '../types'
import { addSampleToTimeseries } from '../utils/timeseries'
import { Heading, Link, Spacer } from '@chakra-ui/react'

const vanillaTimestamp = /^\[(\d\d:\d\d:\d\d)\]/
const lunarTimestamp = /^\[(\d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d.\d\d\d)\]/

const connectingTo = /Connecting to (\W),/
const soldContainer = /Successfully sold a container worth: \$([,\d]+.\d+)!/

const contentDelimiter = ': '

export default function TimeseriesChart(props: {
  color?: string
  timeseries: TimeSeries
}) {
  const color = props.color || '#38A169'
  return (
    <>
      <AreaChart
        accessibilityLayer
        data={props.timeseries.buckets.map((x) => ({
          time: new Date(x.time),
          value: x.value,
        }))}
        width={730}
        height={250}
        margin={{
          left: 10,
          right: 40,
          top: 40,
          bottom: 20,
        }}
      >
        <CartesianGrid vertical={false} />
        <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />

        <XAxis
          dataKey="time"
          tickLine={true}
          axisLine={true}
          tickMargin={8}
          minTickGap={32}
          tickFormatter={(value) => new Date(value).toLocaleTimeString()}
        />

        <YAxis
          tickLine={true}
          axisLine={true}
          tickMargin={8}
          tickFormatter={(value) => `${value}`}
        />
        <defs>
          <linearGradient id={`fill${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.8} />
            <stop offset="95%" stopColor={color} stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <Area
          dataKey="value"
          fill={`url(#fill${color})`}
          type="monotone"
          stroke={color}
          strokeWidth={1.5}
        />
      </AreaChart>
    </>
  )
}

export function Analytics() {
  const [gameLogPath, setGameLogPath] = useState('')
  const [gameLogPaths, setGameLogPaths] = useState([] as GameLog[])
  const [serverName, setServerName] = useState('')
  const [soldTimeseries, setSoldTimeseries] = useState<TimeSeries>({
    buckets: [],
    duration: 60 * 1000,
    samples: 60,
  })

  useEffect(() => {
    window.api.findGameLog().then((gameLogPaths) => {
      setGameLogPath(
        (currentLog) => currentLog || gameLogPaths?.[0]?.path || currentLog
      )
      setGameLogPaths(gameLogPaths)
    })
  }, [setGameLogPath, setGameLogPaths])

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

  useEffect(() => {
    if (!gameLogPath) return
    let total = 0
    let firstTimestamp: Date | undefined

    const handle = window.api.onTailGameLog(gameLogPath, (line: string) => {
      let timestamp: Date | undefined

      const now = new Date()
      const vanillaTimestampMatch = line.match(vanillaTimestamp)
      if (vanillaTimestampMatch)
        timestamp = new Date(
          new Date().toLocaleDateString() + ' ' + vanillaTimestampMatch[1]
        )
      const lunarTimestampMatch = line.match(lunarTimestamp)
      if (lunarTimestampMatch) timestamp = new Date(lunarTimestampMatch[1])
      if (!timestamp) timestamp = now
      if (!firstTimestamp) firstTimestamp = timestamp

      const contentDelimiterIndex = line.indexOf(contentDelimiter)
      if (contentDelimiterIndex < 0) return
      const content = line.slice(
        contentDelimiterIndex + contentDelimiter.length
      )

      const connectingToMatch = content.match(connectingTo)
      if (connectingToMatch) {
        setServerName(connectingToMatch[1])
      }

      const soldContainerMatch = content.match(soldContainer)
      if (soldContainerMatch) {
        const soldContainerValue = parseFloat(
          soldContainerMatch[1].replace(/,/g, '')
        )
        total += soldContainerValue
        setSoldTimeseries((timeseries) =>
          addSampleToTimeseries(soldContainerValue, timestamp, timeseries)
        )

        const totalSeconds =
          (timestamp.getTime() - firstTimestamp.getTime()) / 1000
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
      }
    })
    return () => window.api.removeListener(handle)
  }, [gameLogPath, setServerName, setSoldTimeseries])

  return (
    <>
      <Heading>{serverName || 'Analytics'}</Heading>
      <Heading as="h6" size="xs">
        Game log&nbsp;
        <Link
          onClick={() => window.api.openBrowserWindow(`file://${gameLogPath}`)}
        >
          {gameLogPath}
        </Link>
      </Heading>

      <Heading as="h5" size="sm" marginTop="2rem">
        Successfully sold a container worth
      </Heading>
      <TimeseriesChart timeseries={soldTimeseries} />
    </>
  )
}
