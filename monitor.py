"""
Uptime monitor — health-checks a list of sites and records the results.

For every site in config.json it sends an HTTP request, measures the response
time and status code, and appends the result to a rolling history. Everything
is written to status.json, which the static dashboard reads. Run on a schedule
by GitHub Actions (see .github/workflows/monitor.yml), so the page stays fresh
with no server.

Pure standard library — no dependencies.

Run:  python monitor.py   ->   status.json
"""

import json
import time
import datetime as dt
import urllib.request
import urllib.error

CONFIG_FILE = "config.json"
STATUS_FILE = "status.json"
UA = "uptime-monitor/1.0 (+https://github.com/evelinvee)"


def load_json(path, default=None):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return default


def check(url, timeout):
    """Return (ok, status_code, latency_ms, error)."""
    req = urllib.request.Request(url, method="GET", headers={"User-Agent": UA})
    start = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            code = resp.status
        ms = round((time.perf_counter() - start) * 1000)
        return (200 <= code < 400, code, ms, None)
    except urllib.error.HTTPError as e:
        ms = round((time.perf_counter() - start) * 1000)
        # 2xx/3xx already handled; treat <500 as "reachable but not OK"
        return (e.code < 400, e.code, ms, None)
    except Exception as e:  # timeout, DNS, connection refused, ...
        ms = round((time.perf_counter() - start) * 1000)
        return (False, None, ms, type(e).__name__)


def uptime_pct(history):
    if not history:
        return 100.0
    ok = sum(1 for h in history if h["ok"])
    return round(ok / len(history) * 100, 1)


def main():
    config = load_json(CONFIG_FILE, {}) or {}
    sites = config.get("sites", [])
    timeout = config.get("timeout_seconds", 8)
    hist_len = config.get("history_length", 48)

    prev = load_json(STATUS_FILE, {}) or {}
    prev_sites = {s["url"]: s for s in prev.get("sites", [])}

    now = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()

    results = []
    for site in sites:
        ok, code, ms, err = check(site["url"], timeout)
        history = prev_sites.get(site["url"], {}).get("history", [])
        history.append({"t": now, "ok": ok, "ms": ms})
        history = history[-hist_len:]
        results.append({
            "name": site["name"],
            "url": site["url"],
            "ok": ok,
            "status_code": code,
            "latency_ms": ms,
            "error": err,
            "last_checked": now,
            "uptime": uptime_pct(history),
            "history": history,
        })
        flag = "UP  " if ok else "DOWN"
        print(f"{flag} {site['name']:<14} {str(code):<5} {ms:>5} ms")

    up = sum(1 for r in results if r["ok"])
    data = {
        "generated": now,
        "summary": {"total": len(results), "up": up, "down": len(results) - up},
        "sites": results,
    }
    with open(STATUS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    print(f"\n{up}/{len(results)} sites up — wrote {STATUS_FILE}")


if __name__ == "__main__":
    main()
