# 📈 Status Monitor

A self-updating uptime monitor for a list of websites. A Python checker pings each site, records its status code, latency and a rolling history into `status.json`, and a static HTML/CSS/JS dashboard renders it. A scheduled **GitHub Actions** workflow runs the checker every 30 minutes and commits the fresh data — so the page stays live with no server.

![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-2088FF?logo=githubactions&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-vanilla-F7DF1E?logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/license-MIT-16c784)

> **View it live:** https://evelinvee.github.io/uptime-monitor/ — status, latency, uptime % and a history bar for each site, refreshed automatically by GitHub Actions.

---

## ✨ Features

- **Scheduled checks** — a GitHub Actions cron job runs the monitor every 30 minutes (and on demand)
- **No server, no database** — results live in `status.json`, committed by the workflow and read by a static page
- **Per-site metrics** — up/down state, HTTP status code, latency in ms, and rolling uptime %
- **History bars** — a sparkline-style strip of recent checks, colour-coded green/red
- **Zero dependencies** — the checker uses only the Python standard library
- **Configurable** — add or remove sites by editing `config.json`
- **Responsive** dark dashboard for desktop and mobile

## ▶️ Run it

Check the sites once and refresh `status.json`:

```bash
python monitor.py
```

Preview the dashboard locally:

```bash
python -m http.server 8000
# http://localhost:8000
```

On GitHub, the `.github/workflows/monitor.yml` workflow runs on a schedule and commits the updated `status.json` automatically — no setup beyond enabling Actions and Pages.

## 🗂️ Structure

```
monitor.py                    # health-checks each site -> status.json
config.json                   # list of monitored sites + settings
status.json                   # latest results + rolling history (auto-updated)
index.html                    # dashboard markup
style.css                     # styling
app.js                        # renders status.json
.github/workflows/monitor.yml # scheduled checker (GitHub Actions)
requirements.txt
LICENSE
```

## 🛠️ Tech

Python (standard library) · GitHub Actions (cron) · vanilla JavaScript · HTML · CSS. Fully static frontend, automated by CI.

## 📄 License

MIT © [evelinvee](https://github.com/evelinvee)
