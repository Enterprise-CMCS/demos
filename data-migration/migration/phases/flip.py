"""P7: go-live verification.

PMDA (legacy) and DEMOS (new) are separate apps served on separate URLs;
the dev team owns the URL/redirect work outside this repo. This phase
therefore does **not** perform a DNS or load-balancer swap. Its job is
to verify the new app is reachable and responsive at its own healthz
endpoint and to record operator confirmation that the legacy app has
been placed in read-only mode.
"""

from __future__ import annotations

import time
import urllib.request
from collections.abc import Callable
from urllib.parse import urlparse

from tenacity import RetryError, Retrying, stop_after_attempt, wait_fixed

from migration.lib import Env, confirm, die, log, phase

HEALTHZ_RETRIES = 5
HEALTHZ_BACKOFF_SECONDS = 2.0
HEALTHZ_TIMEOUT_SECONDS = 10
_ALLOWED_SCHEMES = {"http", "https"}


def _probe_once(url: str) -> None:
    """Issue one GET to ``url`` and raise unless the response status is 200."""
    with urllib.request.urlopen(url, timeout=HEALTHZ_TIMEOUT_SECONDS) as resp:
        if resp.status != 200:
            raise RuntimeError(f"status {resp.status}")


def _check_healthz(url: str, *, sleep: Callable[[float], None] = time.sleep) -> None:
    """Hit `url` up to HEALTHZ_RETRIES times; die() on persistent failure.

    A flaky LB or slow first byte should not abort the cutover, so we
    retry with a fixed backoff via ``tenacity``. Scheme is restricted
    to http/https so a misconfigured ``file://`` (or worse) cannot turn
    the healthz probe into a file read.

    ``sleep`` is the backoff sleeper tenacity calls between attempts;
    it is injectable so tests fast-forward the backoff with a no-op.
    """
    scheme = urlparse(url).scheme.lower()
    if scheme not in _ALLOWED_SCHEMES:
        die(f"healthz URL scheme {scheme!r} not allowed (only http/https)")

    retrying = Retrying(
        stop=stop_after_attempt(HEALTHZ_RETRIES),
        wait=wait_fixed(HEALTHZ_BACKOFF_SECONDS),
        reraise=False,
        sleep=sleep,
    )
    try:
        for attempt in retrying:
            with attempt:
                attempt_no = attempt.retry_state.attempt_number
                try:
                    _probe_once(url)
                    log(f"  healthz OK on attempt {attempt_no}/{HEALTHZ_RETRIES}")
                except Exception as e:
                    log(
                        f"  healthz attempt {attempt_no}/{HEALTHZ_RETRIES} "
                        f"failed: {e}; sleeping {HEALTHZ_BACKOFF_SECONDS:.1f}s"
                    )
                    raise
    except RetryError as final:
        last_exc = final.last_attempt.exception() if final.last_attempt else None
        die(f"healthz failed after {HEALTHZ_RETRIES} attempts: {last_exc}")


@phase("flip", requires="parity")
def run_flip() -> None:
    """Run P7 go-live verification: probe DEMOS healthz and confirm PMDA read-only.

    Requires the ``parity`` gate. Prompts the operator to confirm PMDA is
    in read-only mode, then verifies the DEMOS healthz endpoint
    (``NEW_APP_HEALTHZ_URL`` env) via :func:`_check_healthz`. Dies if the
    endpoint is unset rather than probing a placeholder. Marks the
    ``flip`` gate on success.
    """
    log("P7 flip: verifying DEMOS is live and PMDA is read-only")
    log("  (PMDA and DEMOS are separate apps on separate URLs; no DNS swap needed)")
    if not confirm("confirm PMDA is in read-only mode (y/N)?"):
        die("flip not confirmed: legacy app not in read-only mode")

    healthz = Env.load().new_app_healthz_url
    if not healthz:
        die("NEW_APP_HEALTHZ_URL not set; set the DEMOS healthz endpoint in .env before flip")
    log(f"verifying DEMOS healthz at {healthz}")
    _check_healthz(healthz)
