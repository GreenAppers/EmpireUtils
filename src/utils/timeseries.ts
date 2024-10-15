import type { TimeSeries } from '../types'

export function addSampleToTimeseries(
  value: number,
  timestamp: Date,
  timeseries: TimeSeries,
  now = new Date()
) {
  let changed = false
  const buckets = [...timeseries.buckets]
  const lastBucket = now.getTime() - (now.getTime() % timeseries.duration)
  const firstBucket =
    lastBucket - (timeseries.samples - 1) * timeseries.duration

  while (buckets.length && buckets[0].time < firstBucket) {
    buckets.shift()
    changed = true
  }

  if (!buckets.length) {
    buckets.push({ time: firstBucket, value: 0 })
    changed = true
  }

  while (buckets.length < timeseries.samples) {
    buckets.push({
      time: buckets[buckets.length - 1].time + timeseries.duration,
      value: 0,
    })
    changed = true
  }

  if (
    timestamp.getTime() >= firstBucket &&
    timestamp.getTime() < lastBucket + timeseries.duration
  ) {
    const bucketIndex = Math.floor(
      (timestamp.getTime() - firstBucket) / timeseries.duration
    )
    buckets[bucketIndex].value += value
    changed = true
  }

  return changed ? { ...timeseries, buckets } : timeseries
}
