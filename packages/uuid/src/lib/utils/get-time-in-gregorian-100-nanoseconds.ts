/**
 * Denotes the last created timestamp in milliseconds.
 */
let lastTimeInMilliseconds = 0n;

/**
 * Denotes the last created timestamp's nanoseconds.
 */
let lastTimeNanoseconds = 0n;

/**
 * Returns the current time as a count of 100-ns since 1582-10-15 00:00:00.
 */
export function getTimeInGregorian100Nanoseconds(): bigint {
  const milliseconds = BigInt(Date.now()) + 12219292800000n;
  let nanoseconds = ++lastTimeNanoseconds; // This is absolutely crucial, I just don't know why.

  // Does it really hit the 10000 mark given the penalty of bigint-ing Date.now()?
  if (lastTimeNanoseconds >= 10000n || milliseconds > lastTimeInMilliseconds) {
    nanoseconds = lastTimeNanoseconds = 0n;
  }

  lastTimeInMilliseconds = milliseconds;

  return milliseconds * 10000n + nanoseconds;
}
