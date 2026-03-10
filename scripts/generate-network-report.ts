import fs from 'fs';
import path from 'path';
import type { NetworkCallData } from '../support/helpers/network-collector';

const DATA_DIR = path.resolve('network-data');
const OUTPUT_FILE = path.resolve('playwright-report/network-report.html');

function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return '#4caf50';
  if (status >= 300 && status < 400) return '#ff9800';
  if (status >= 400 && status < 500) return '#f44336';
  if (status >= 500) return '#e91e63';
  return '#9e9e9e';
}

function getStatusBadgeClass(status: number): string {
  if (status >= 200 && status < 300) return 'badge-success';
  if (status >= 300 && status < 400) return 'badge-warning';
  return 'badge-error';
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatJson(obj: unknown): string {
  try {
    return escapeHtml(JSON.stringify(obj, null, 2));
  } catch {
    return escapeHtml(String(obj));
  }
}

function generateHtml(calls: NetworkCallData[]): string {
  const grouped = new Map<string, NetworkCallData[]>();
  for (const call of calls) {
    const existing = grouped.get(call.testName) || [];
    existing.push(call);
    grouped.set(call.testName, existing);
  }

  const testEntries = Array.from(grouped.entries());

  const requestRows = calls
    .map((call, index) => {
      const url = new URL(call.request.url);
      const shortUrl = url.pathname + url.search;
      const badgeClass = getStatusBadgeClass(call.response.status);
      const time = call.timestamp ? new Date(call.timestamp).toLocaleTimeString('en-GB', { hour12: false }) : '—';
      const duration = call.durationMs != null ? `${call.durationMs}ms` : '—';

      return `
      <div class="request-row ${index === 0 ? 'active' : ''}" data-index="${index}" onclick="selectRequest(${index})">
        <span class="status-badge ${badgeClass}">${call.response.status}</span>
        <span class="method">${call.request.method}</span>
        <span class="url" title="${escapeHtml(call.request.url)}">${escapeHtml(shortUrl)}</span>
        <span class="time">${time}</span>
        <span class="duration">${duration}</span>
      </div>`;
    })
    .join('\n');

  const detailPanels = calls
    .map((call, index) => {
      const reqHeaders = call.request.headers
        ? Object.entries(call.request.headers)
            .map(([k, v]) => `<tr><td class="header-key">${escapeHtml(k)}</td><td class="header-val">${escapeHtml(v)}</td></tr>`)
            .join('\n')
        : '<tr><td colspan="2" class="empty">No request headers captured</td></tr>';

      const resHeaders = Object.entries(call.response.headers)
        .map(([k, v]) => `<tr><td class="header-key">${escapeHtml(k)}</td><td class="header-val">${escapeHtml(v)}</td></tr>`)
        .join('\n');

      const reqBody = call.request.body
        ? `<div class="body-section">
            <h4>Request Body</h4>
            <pre class="json-body"><code>${formatJson(call.request.body)}</code></pre>
           </div>`
        : '';

      const resBody = `<pre class="json-body"><code>${formatJson(call.response.body)}</code></pre>`;

      return `
      <div class="detail-panel" id="detail-${index}" style="display: ${index === 0 ? 'block' : 'none'}">
        <div class="detail-header">
          <span class="status-badge ${getStatusBadgeClass(call.response.status)}">${call.response.status} ${escapeHtml(call.response.statusText)}</span>
          <span class="detail-method">${call.request.method}</span>
          <span class="detail-url">${escapeHtml(call.request.url)}</span>
        </div>
        <div class="detail-meta">
          <span>Test: <strong>${escapeHtml(call.testName)}</strong></span>
          <span>Time: ${call.timestamp}</span>
          ${call.durationMs != null ? `<span>Duration: <strong>${call.durationMs}ms</strong></span>` : ''}
        </div>

        <div class="tabs">
          <button class="tab active" onclick="switchTab(${index}, 'request')">Request</button>
          <button class="tab" onclick="switchTab(${index}, 'response')">Response</button>
        </div>

        <div class="tab-content" id="tab-request-${index}">
          <h4>Request Headers</h4>
          <table class="headers-table">${reqHeaders}</table>
          ${reqBody}
        </div>

        <div class="tab-content" id="tab-response-${index}" style="display: none;">
          <h4>Response Headers</h4>
          <table class="headers-table">${resHeaders}</table>
          <div class="body-section">
            <h4>Response Body <button class="copy-btn" onclick="copyBody(${index})">Copy</button></h4>
            ${resBody}
          </div>
        </div>
      </div>`;
    })
    .join('\n');

  // Summary counts — HTTP status distribution (not test pass/fail)
  const count2xx = calls.filter((c) => c.response.status >= 200 && c.response.status < 300).length;
  const count4xx = calls.filter((c) => c.response.status >= 400 && c.response.status < 500).length;
  const count5xx = calls.filter((c) => c.response.status >= 500).length;
  const total = calls.length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Network Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: #1e1e2e;
      color: #cdd6f4;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* ── Top Bar ── */
    .top-bar {
      background: #181825;
      border-bottom: 1px solid #313244;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .top-bar h1 {
      font-size: 15px;
      font-weight: 600;
      color: #cdd6f4;
    }
    .top-bar h1 span { color: #89b4fa; }
    .summary {
      display: flex;
      gap: 16px;
      font-size: 13px;
    }
    .summary-item { display: flex; align-items: center; gap: 4px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
    .dot-green { background: #4caf50; }
    .dot-red { background: #f44336; }
    .dot-total { background: #89b4fa; }

    /* ── Filter Bar ── */
    .filter-bar {
      background: #181825;
      border-bottom: 1px solid #313244;
      padding: 8px 20px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .filter-btn {
      background: none;
      border: 1px solid #45475a;
      color: #a6adc8;
      padding: 4px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.15s;
    }
    .filter-btn:hover, .filter-btn.active {
      background: #313244;
      color: #cdd6f4;
      border-color: #89b4fa;
    }
    .filter-input {
      background: #313244;
      border: 1px solid #45475a;
      color: #cdd6f4;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 12px;
      flex: 1;
      max-width: 300px;
      outline: none;
    }
    .filter-input::placeholder { color: #6c7086; }
    .filter-input:focus { border-color: #89b4fa; }

    /* ── Main Layout ── */
    .main {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    /* ── Left Panel: Request List ── */
    .request-list {
      width: 560px;
      min-width: 420px;
      border-right: 1px solid #313244;
      overflow-y: auto;
      background: #1e1e2e;
    }
    .request-list-header {
      display: grid;
      grid-template-columns: 50px 55px 1fr 70px 65px;
      padding: 8px 12px;
      font-size: 11px;
      color: #6c7086;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #313244;
      position: sticky;
      top: 0;
      background: #181825;
      z-index: 1;
    }
    .request-row {
      display: grid;
      grid-template-columns: 50px 55px 1fr 70px 65px;
      padding: 7px 12px;
      font-size: 13px;
      cursor: pointer;
      border-bottom: 1px solid #181825;
      transition: background 0.1s;
      align-items: center;
    }
    .time {
      font-size: 11px;
      color: #6c7086;
      font-variant-numeric: tabular-nums;
    }
    .duration {
      font-size: 11px;
      color: #a6adc8;
      font-variant-numeric: tabular-nums;
      text-align: right;
    }
    .request-row:hover { background: #313244; }
    .request-row.active { background: #313244; border-left: 2px solid #89b4fa; }
    .status-badge {
      font-size: 12px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
    .badge-success { color: #a6e3a1; }
    .badge-warning { color: #f9e2af; }
    .badge-error { color: #f38ba8; }
    .method {
      font-size: 11px;
      font-weight: 600;
      color: #89b4fa;
    }
    .url {
      font-size: 12px;
      color: #a6adc8;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* ── Right Panel: Details ── */
    .detail-area {
      flex: 1;
      overflow-y: auto;
      padding: 0;
    }
    .detail-panel { padding: 0; }
    .detail-header {
      padding: 16px 20px;
      border-bottom: 1px solid #313244;
      background: #181825;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .detail-header .status-badge { font-size: 14px; }
    .detail-method { font-size: 13px; font-weight: 600; color: #89b4fa; }
    .detail-url {
      font-size: 12px;
      color: #a6adc8;
      word-break: break-all;
    }
    .detail-meta {
      padding: 8px 20px;
      border-bottom: 1px solid #313244;
      font-size: 12px;
      color: #6c7086;
      display: flex;
      gap: 24px;
    }
    .detail-meta strong { color: #a6adc8; }

    /* ── Tabs ── */
    .tabs {
      display: flex;
      border-bottom: 1px solid #313244;
      background: #181825;
      padding: 0 20px;
    }
    .tab {
      background: none;
      border: none;
      color: #6c7086;
      padding: 10px 16px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      border-bottom: 2px solid transparent;
      transition: all 0.15s;
    }
    .tab:hover { color: #cdd6f4; }
    .tab.active { color: #89b4fa; border-bottom-color: #89b4fa; }

    /* ── Tab Content ── */
    .tab-content { padding: 16px 20px; }
    .tab-content h4 {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #6c7086;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* ── Headers Table ── */
    .headers-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 13px;
    }
    .headers-table tr { border-bottom: 1px solid #313244; }
    .headers-table td { padding: 6px 8px; vertical-align: top; }
    .header-key { color: #cba6f7; font-weight: 500; width: 260px; white-space: nowrap; }
    .header-val { color: #a6adc8; word-break: break-all; }
    .empty { color: #6c7086; font-style: italic; }

    /* ── JSON Body ── */
    .body-section { margin-top: 12px; }
    .json-body {
      background: #11111b;
      border: 1px solid #313244;
      border-radius: 6px;
      padding: 14px;
      overflow-x: auto;
      font-size: 12px;
      line-height: 1.6;
      font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
      color: #cdd6f4;
      max-height: 500px;
      overflow-y: auto;
    }

    /* ── Copy Button ── */
    .copy-btn {
      background: #313244;
      border: 1px solid #45475a;
      color: #a6adc8;
      padding: 2px 10px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 11px;
      transition: all 0.15s;
    }
    .copy-btn:hover { background: #45475a; color: #cdd6f4; }
    .copy-btn.copied { background: #a6e3a1; color: #1e1e2e; border-color: #a6e3a1; }

    /* ── No Data ── */
    .no-data {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #6c7086;
      font-size: 14px;
    }

    /* ── Scrollbar ── */
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: #181825; }
    ::-webkit-scrollbar-thumb { background: #45475a; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #585b70; }

    /* ── Resize Handle ── */
    .request-list { resize: horizontal; overflow: auto; }
  </style>
</head>
<body>
  <div class="top-bar">
    <h1><span>API Network Report</span> — Playwright E2E</h1>
    <div class="summary">
      <div class="summary-item"><span class="dot dot-total"></span> ${total} requests</div>
      <div class="summary-item"><span class="dot dot-green"></span> ${count2xx} 2xx</div>
      ${count4xx > 0 ? `<div class="summary-item"><span class="dot dot-red"></span> ${count4xx} 4xx</div>` : ''}
      ${count5xx > 0 ? `<div class="summary-item"><span class="dot dot-red"></span> ${count5xx} 5xx</div>` : ''}
    </div>
  </div>

  <div class="filter-bar">
    <button class="filter-btn active" onclick="filterRequests('all')">All</button>
    <button class="filter-btn" onclick="filterRequests('2xx')">2xx</button>
    <button class="filter-btn" onclick="filterRequests('4xx')">4xx</button>
    <button class="filter-btn" onclick="filterRequests('5xx')">5xx</button>
    <input type="text" class="filter-input" placeholder="Filter by URL or test name..." oninput="filterByText(this.value)">
  </div>

  <div class="main">
    <div class="request-list">
      <div class="request-list-header">
        <span>Status</span>
        <span>Method</span>
        <span>URL</span>
        <span>Time</span>
        <span style="text-align:right">Duration</span>
      </div>
      ${requestRows}
    </div>

    <div class="detail-area">
      ${calls.length > 0 ? detailPanels : '<div class="no-data">No API calls captured</div>'}
    </div>
  </div>

  <script>
    const callsData = ${JSON.stringify(calls)};

    function selectRequest(index) {
      document.querySelectorAll('.request-row').forEach(r => r.classList.remove('active'));
      document.querySelectorAll('.detail-panel').forEach(p => p.style.display = 'none');

      const row = document.querySelector(\`.request-row[data-index="\${index}"]\`);
      const panel = document.getElementById('detail-' + index);
      if (row) row.classList.add('active');
      if (panel) panel.style.display = 'block';
    }

    function switchTab(index, tab) {
      const panel = document.getElementById('detail-' + index);
      panel.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      panel.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');

      const reqTab = document.getElementById('tab-request-' + index);
      const resTab = document.getElementById('tab-response-' + index);

      if (tab === 'request') {
        reqTab.style.display = 'block';
        panel.querySelectorAll('.tab')[0].classList.add('active');
      } else {
        resTab.style.display = 'block';
        panel.querySelectorAll('.tab')[1].classList.add('active');
      }
    }

    function copyBody(index) {
      const body = callsData[index].response.body;
      const text = typeof body === 'string' ? body : JSON.stringify(body, null, 2);
      navigator.clipboard.writeText(text).then(() => {
        const btn = event.target;
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1500);
      });
    }

    function filterRequests(type) {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      event.target.classList.add('active');

      document.querySelectorAll('.request-row').forEach(row => {
        const index = parseInt(row.dataset.index);
        const status = callsData[index].response.status;
        let show = true;
        if (type === '2xx') show = status >= 200 && status < 300;
        else if (type === '4xx') show = status >= 400 && status < 500;
        else if (type === '5xx') show = status >= 500;
        row.style.display = show ? '' : 'none';
      });
    }

    function filterByText(text) {
      const lower = text.toLowerCase();
      document.querySelectorAll('.request-row').forEach(row => {
        const index = parseInt(row.dataset.index);
        const call = callsData[index];
        const match = call.request.url.toLowerCase().includes(lower) ||
                      call.testName.toLowerCase().includes(lower);
        row.style.display = match ? '' : 'none';
      });
    }
  </script>
</body>
</html>`;
}

// ── Main ──
function main(): void {
  if (!fs.existsSync(DATA_DIR)) {
    console.log('No network data found. Skipping report generation.');
    return;
  }

  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'));
  if (files.length === 0) {
    console.log('No network data files found. Skipping report generation.');
    return;
  }

  const calls: NetworkCallData[] = files
    .map((f) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf-8')))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const html = generateHtml(calls);
  fs.writeFileSync(OUTPUT_FILE, html);

  console.log(`\n╔══════════════════════════════════════════════════════════╗`);
  console.log(`║  API Network Report generated!                          ║`);
  console.log(`║  Open: playwright-report/network-report.html            ║`);
  console.log(`╚══════════════════════════════════════════════════════════╝\n`);
}

main();
