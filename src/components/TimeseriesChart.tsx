import React from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TimeSeries } from '../types'

export default function TimeseriesChart(props: {
  color?: string
  timeseries?: TimeSeries
}) {
  if (!props.timeseries) return <></>
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
