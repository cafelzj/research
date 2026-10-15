"""Verify that GitHub Pages serves the exact files from this deployment."""

import argparse
import hashlib
from pathlib import Path
import time
import urllib.error
import urllib.parse
import urllib.request


def verify(base_url, attempts=12, delay=10):
    parsed = urllib.parse.urlsplit(base_url)
    if parsed.scheme != "https" or not parsed.netloc:
        raise ValueError("The public site URL must use HTTPS")
    root = Path(__file__).resolve().parents[1]
    pending = {name: (root / name).read_bytes() for name in ("index.html", "atlas.html")}
    for attempt in range(attempts):
        for name, expected in list(pending.items()):
            digest = hashlib.sha256(expected).hexdigest()
            url = urllib.parse.urljoin(base_url.rstrip("/") + "/", name)
            url += "?verify=" + digest[:16] + "&attempt=" + str(attempt)
            try:
                request = urllib.request.Request(url, headers={"Cache-Control": "no-cache"})
                with urllib.request.urlopen(request, timeout=20) as response:
                    actual = response.read()
                    if response.status != 200:
                        raise ValueError(f"HTTP {response.status}")
                    if response.headers.get_content_type() != "text/html":
                        raise ValueError("Response is not HTML")
                    if actual != expected:
                        raise ValueError("Public content does not match this commit")
                print(f"PASS {name}: HTTP 200, SHA-256 {digest}", flush=True)
                del pending[name]
            except (OSError, ValueError) as exc:
                print(f"Attempt {attempt + 1}/{attempts}: {name}: {exc}", flush=True)
        if not pending:
            print("Public deployment verified: " + base_url, flush=True)
            return
        if attempt + 1 < attempts:
            time.sleep(delay)
    raise SystemExit("Public verification failed: " + ", ".join(pending))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("url")
    args = parser.parse_args()
    verify(args.url)
