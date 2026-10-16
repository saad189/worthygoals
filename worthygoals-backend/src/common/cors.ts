type OriginCallback = (err: Error | null, allow?: boolean) => void;

/**
 * One CORS policy for HTTP and the Socket.IO gateway.
 *
 * The gateway used `cors: true` — any origin, whatever ALLOWED_ORIGINS said
 * for HTTP. This is a function rather than a value because the gateway's
 * decorator is evaluated at import time, before env is loaded; the function
 * reads env per request.
 *
 * ALLOWED_ORIGINS set → allow exactly those. Unset → allow all outside
 * production, none in production. Requests with no Origin (the native app,
 * curl, health probes) are not browser requests and are always allowed.
 */
export function corsOrigin(origin: string | undefined, cb: OriginCallback) {
  if (!origin) return cb(null, true);
  const raw = process.env.ALLOWED_ORIGINS;
  if (raw) {
    return cb(
      null,
      raw
        .split(',')
        .map((o) => o.trim())
        .includes(origin),
    );
  }
  cb(null, process.env.NODE_ENV !== 'prod');
}
