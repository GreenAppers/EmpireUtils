import type { TimeSeries, TimeValue } from '../types'

export function addSamplesToTimeseries(
  timeseries: TimeSeries,
  values: TimeValue[],
  adjustWindowNow?: Date | undefined
) {
  const buckets = [...timeseries.buckets]
  let changed = false

  if (adjustWindowNow) {
    if (
      adjustTimeseriesBucketsWindow(
        timeseries,
        buckets,
        adjustWindowNow.getTime()
      )
    )
      changed = true
  }

  for (const value of values) {
    if (!adjustWindowNow) {
      if (adjustTimeseriesBucketsWindow(timeseries, buckets, value.time))
        changed = true
    }
    const firstBucket = buckets[0].time
    const lastBucket = buckets[buckets.length - 1].time
    if (
      value.time >= firstBucket &&
      value.time < lastBucket + timeseries.duration
    ) {
      const bucketIndex = Math.floor(
        (value.time - firstBucket) / timeseries.duration
      )
      buckets[bucketIndex].value += value.value
      changed = true
    }
  }

  return changed ? { ...timeseries, buckets } : timeseries
}

export function adjustTimeseriesBucketsWindow(
  timeseries: TimeSeries,
  buckets: TimeValue[],
  adjustWindowNow: number
) {
  const minLastBucket =
    adjustWindowNow - (adjustWindowNow % timeseries.duration)
  const minFirstBucket =
    minLastBucket - (timeseries.samples - 1) * timeseries.duration
  let changed = false

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

  return changed
}
