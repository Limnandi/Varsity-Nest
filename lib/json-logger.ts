export function jsonLog(level: string, message: string, meta?: Record<string, any>) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...meta,
  }
  // print to stdout so it will be captured by typical log aggregators
  console.log(JSON.stringify(payload))
}
