from collections import defaultdict, deque
from threading import Lock
from time import monotonic

from fastapi import HTTPException, Request, status

from app.core.config import settings

_request_times: dict[str, deque[float]] = defaultdict(deque)
_lock = Lock()


def enforce_auth_rate_limit(request: Request) -> None:
    host = request.client.host if request.client is not None else "unknown"
    now = monotonic()
    cutoff = now - settings.auth_rate_limit_window_seconds
    with _lock:
        for address, timestamps in list(_request_times.items()):
            while timestamps and timestamps[0] <= cutoff:
                timestamps.popleft()
            if not timestamps:
                del _request_times[address]

        timestamps = _request_times[host]
        if len(timestamps) >= settings.auth_rate_limit_requests:
            retry_after = max(1, int(timestamps[0] + settings.auth_rate_limit_window_seconds - now))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many authentication requests. Try again later.",
                headers={"Retry-After": str(retry_after)},
            )
        timestamps.append(now)
