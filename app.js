/* Status Monitor — reads status.json (written by monitor.py on a schedule via
   GitHub Actions) and renders a live uptime board. Pure vanilla JS, no backend. */

const MAX_BARS = 48;

function host(url) {
  try { return new URL(url).host; } catch { return url; }
}

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  return Math.floor(s / 86400) + "d ago";
}

function bars(history) {
  const recent = history.slice(-MAX_BARS);
  const pad = MAX_BARS - recent.length;
  const cells = [];
  for (let i = 0; i < pad; i++) cells.push('<i class="empty" style="height:40%"></i>');
  recent.forEach(h => {
    const cls = h.ok ? "" : "down";
    const ms = h.ms || 0;
    const height = h.ok ? Math.max(30, Math.min(100, 30 + ms / 12)) : 100;
    const title = `${new Date(h.t).toLocaleString()} — ${h.ok ? "up " + ms + "ms" : "down"}`;
    cells.push(`<i class="${cls}" style="height:${height}%" title="${title}"></i>`);
  });
  return cells.join("");
}

function card(s) {
  const state = s.ok ? "up" : "down";
  const codeLine = s.ok
    ? `${s.latency_ms} ms`
    : (s.status_code ? "HTTP " + s.status_code : (s.error || "unreachable"));
  return `
  <div class="card">
    <div class="card-top">
      <div class="site">
        <span class="dot ${state}"></span>
        <div>
          <div class="name">${s.name}</div>
          <a class="host" href="${s.url}" target="_blank" rel="noopener">${host(s.url)}</a>
        </div>
      </div>
      <div class="meta">
        <div class="latency">
          <div class="val">${s.ok ? s.latency_ms : "—"}</div>
          <div class="lbl">${s.ok ? "ms" : "latency"}</div>
        </div>
        <div>
          <div class="val">${s.uptime}%</div>
          <div class="lbl">uptime</div>
        </div>
        <div>
          <div class="val state ${state}">${s.ok ? "UP" : "DOWN"}</div>
          <div class="lbl">${codeLine}</div>
        </div>
      </div>
    </div>
    <div class="bars">${bars(s.history || [])}</div>
  </div>`;
}

async function init() {
  let data;
  try {
    data = await (await fetch("status.json", { cache: "no-store" })).json();
  } catch {
    document.getElementById("cards").innerHTML =
      '<div class="card">No status data yet — the first check runs shortly.</div>';
    return;
  }

  const { up, total } = data.summary;
  const allUp = up === total;
  const overall = document.getElementById("overall");
  overall.className = "overall " + (allUp ? "ok" : "bad");
  overall.textContent = allUp
    ? `All systems operational · ${total}/${total} up`
    : `${up}/${total} operational`;

  document.getElementById("cards").innerHTML = data.sites.map(card).join("");

  document.getElementById("foot").innerHTML =
    `Last checked ${timeAgo(data.generated)} · checks run every 30 min via ` +
    `<a href="https://docs.github.com/actions" target="_blank" rel="noopener">GitHub Actions</a>. ` +
    `Edit <code>config.json</code> to change the monitored sites.`;
}

init();
