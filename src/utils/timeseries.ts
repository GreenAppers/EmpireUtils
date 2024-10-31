import type { TimeSeries } from '../types'

export function addSampleToTimeseries(
  value: number,
  timestamp: Date,
  timeseries: TimeSeries,
  adjustWindowNow?: Date | undefined
) {
  let changed = false
  const buckets = [...timeseries.buckets]

  if (adjustWindowNow) {
    const minLastBucket =
      adjustWindowNow.getTime() - (adjustWindowNow.getTime() % timeseries.duration)
    const minFirstBucket =
      minLastBucket - (timeseries.samples - 1) * timeseries.duration

    while (buckets.length && buckets[0].time < minFirstBucket) {
      buckets.shift()
      changed = true
    }

    if (!buckets.length) {
      buckets.push({ time: minFirstBucket, value: 0 })
      changed = true
    }

    while (buckets.length < timeseries.samples) {
      buckets.push({
        time: buckets[buckets.length - 1].time + timeseries.duration,
        value: 0,
      })
      changed = true
    }
  }

  const firstBucket = buckets[0].time
  const lastBucket = buckets[buckets.length - 1].time
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
