import fs from 'fs';
import path from 'path';
import type { NetworkCallData } from '../support/helpers/network-collector';

const RESULTS_FILE = path.resolve('playwright-report/test-results.json');
const NETWORK_DIR = path.resolve('network-data');
const OUTPUT_FILE = path.resolve('playwright-report/full-report.html');

// ─── Types ──────────────────────────────────────────────────

interface TestEntry {
  title: string;
  suiteName: string;
  projectName: string;
  file: string;
  line: number;
  tags: string[];
  status: 'passed' | 'failed' | 'flaky' | 'skipped';
  duration: number;
  error?: {
    message: string;
    location?: { file: string; line: number; column: number };
  };
  networkCalls: NetworkCallData[];
}

// ─── Helpers ────────────────────────────────────────────────

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

function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

function getStatusIcon(status: string): string {
  if (status === 'passed') return '<span class="icon-pass">&#10003;</span>';
  if (status === 'failed') return '<span class="icon-fail">&#10007;</span>';
  if (status === 'flaky') return '<span class="icon-flaky">&#9888;</span>';
  return '<span class="icon-skip">&#9644;</span>';
}

function getStatusClass(status: string): string {
  if (status === 'passed') return 'status-passed';
  if (status === 'failed') return 'status-failed';
  if (status === 'flaky') return 'status-flaky';
  return 'status-skipped';
}

function getHttpBadgeClass(status: number): string {
  if (status >= 200 && status < 300) return 'http-2xx';
  if (status >= 300 && status < 400) return 'http-3xx';
  return 'http-4xx';
}

function shortPath(fullPath: string): string {
  const idx = fullPath.indexOf('tests/');
  return idx >= 0 ? fullPath.slice(idx) : fullPath;
}

// ─── Extract code snippet around error line ─────────────────

function getCodeSnippet(filePath: string, errorLine: number, context = 3): string {
  try {
    if (!fs.existsSync(filePath)) return '';
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
    const start = Math.max(0, errorLine - context - 1);
    const end = Math.min(lines.length, errorLine + context);

    return lines
      .slice(start, end)
      .map((line, i) => {
        const lineNum = start + i + 1;
        const isError = lineNum === errorLine;
        const prefix = isError ? '>' : ' ';
        return `${prefix} ${String(lineNum).padStart(4)} | ${escapeHtml(line)}`;
      })
      .join('\n');
  } catch {
    return '';
  }
}

// ─── Parse Playwright results + merge network data ──────────

function collectTests(): TestEntry[] {
  if (!fs.existsSync(RESULTS_FILE)) {
    console.error('No test-results.json found. Run tests first.');
    process.exit(1);
  }

  const results = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf-8'));

  // Load network data
  const networkCalls: NetworkCallData[] = [];
  if (fs.existsSync(NETWORK_DIR)) {
    const files = fs.readdirSync(NETWORK_DIR).filter((f) => f.endsWith('.json'));
    for (const f of files) {
      networkCalls.push(JSON.parse(fs.readFileSync(path.join(NETWORK_DIR, f), 'utf-8')));
    }
  }

  const tests: TestEntry[] = [];

  for (const suite of results.suites) {
    for (const innerSuite of suite.suites || []) {
      for (const spec of innerSuite.specs || []) {
        for (const t of spec.tests || []) {
          const r = t.results?.[0];
          if (!r) continue;

          const status =
            t.status === 'unexpected' ? 'failed' : r.status === 'passed' ? 'passed' : r.status;

          const error = r.errors?.[0];

          // Match network calls by test title
          const matchedCalls = networkCalls.filter((nc) => nc.testName === spec.title);

          tests.push({
            title: spec.title,
            suiteName: innerSuite.title,
            projectName: t.projectName,
            file: spec.file,
            line: spec.line,
            tags: spec.tags || [],
            status: status as TestEntry['status'],
            duration: r.duration,
            error: error
              ? {
                  message: stripAnsi(error.message || ''),
                  location: error.location,
                }
              : undefined,
            networkCalls: matchedCalls,
          });
        }
      }
    }
  }

  return tests;
}

// ─── Generate HTML ──────────────────────────────────────────

function generateHtml(tests: TestEntry[]): string {
  const passed = tests.filter((t) => t.status === 'passed').length;
  const failed = tests.filter((t) => t.status === 'failed').length;
  const total = tests.length;

  // ── Left panel: test list ──
  const testListItems = tests
    .map((t, index) => {
      const statusClass = getStatusClass(t.status);
      const icon = getStatusIcon(t.status);
      return `
      <div class="test-item ${statusClass} ${index === 0 ? 'active' : ''}" data-index="${index}" onclick="selectTest(${index})">
        <div class="test-item-header">
          ${icon}
          <span class="test-title">${escapeHtml(t.title)}</span>
          <span class="test-duration">${t.duration}ms</span>
        </div>
        <div class="test-item-meta">
          <span class="test-file">${escapeHtml(t.file)}:${t.line}</span>
          <div class="test-tags">
            <span class="tag tag-project">${escapeHtml(t.projectName)}</span>
            ${t.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
          </div>
        </div>
      </div>`;
    })
    .join('\n');

  // ── Right panel: detail panels ──
  const detailPanels = tests
    .map((t, index) => {
      // Error section
      let errorSection = '';
      if (t.error) {
        const snippet = t.error.location
          ? getCodeSnippet(t.error.location.file, t.error.location.line)
          : '';

        const locationStr = t.error.location
          ? `${shortPath(t.error.location.file)}:${t.error.location.line}:${t.error.location.column}`
          : '';

        // Parse error message into structured parts
        const msgLines = t.error.message.split('\n');
        const firstLine = msgLines[0] || '';
        const restMessage = msgLines.slice(1).join('\n');

        errorSection = `
        <div class="error-section">
          <div class="error-header">Errors</div>
          <div class="error-content">
            <div class="error-assertion">${escapeHtml(firstLine)}</div>
            ${restMessage ? `<pre class="error-details">${escapeHtml(restMessage)}</pre>` : ''}
            ${locationStr ? `<div class="error-location">${escapeHtml(locationStr)}</div>` : ''}
            ${snippet ? `<pre class="code-snippet"><code>${snippet}</code></pre>` : ''}
          </div>
        </div>`;
      }

      // Network section
      let networkSection = '';
      if (t.networkCalls.length > 0) {
        const callItems = t.networkCalls
          .map((call, ci) => {
            const httpClass = getHttpBadgeClass(call.response.status);
            const duration = call.durationMs != null ? `${call.durationMs}ms` : '';

            const reqHeaders = call.request.headers
              ? Object.entries(call.request.headers)
                  .map(
                    ([k, v]) =>
                      `<tr><td class="hdr-key">${escapeHtml(k)}</td><td class="hdr-val">${escapeHtml(v)}</td></tr>`,
                  )
                  .join('')
              : '<tr><td colspan="2" class="empty-msg">No request headers captured</td></tr>';

            const resHeaders = Object.entries(call.response.headers)
              .map(
                ([k, v]) =>
                  `<tr><td class="hdr-key">${escapeHtml(k)}</td><td class="hdr-val">${escapeHtml(v)}</td></tr>`,
              )
              .join('');

            const reqBody = call.request.body
              ? `<div class="sub-section"><div class="sub-label">Request Body</div><pre class="json-block"><code>${formatJson(call.request.body)}</code></pre></div>`
              : '';

            const resBody = `<pre class="json-block"><code>${formatJson(call.response.body)}</code></pre>`;

            return `
            <div class="network-call">
              <div class="call-summary" onclick="toggleCall(${index}, ${ci})">
                <span class="http-badge ${httpClass}">${call.response.status}</span>
                <span class="call-method">${call.request.method}</span>
                <span class="call-url">${escapeHtml(call.request.url)}</span>
                <span class="call-duration">${duration}</span>
                <span class="call-chevron" id="chevron-${index}-${ci}">&#9654;</span>
              </div>
              <div class="call-detail" id="call-detail-${index}-${ci}" style="display:none">
                <div class="call-tabs">
                  <button class="ctab active" onclick="switchCallTab(${index}, ${ci}, 'req')">Request</button>
                  <button class="ctab" onclick="switchCallTab(${index}, ${ci}, 'res')">Response</button>
                </div>
                <div class="ctab-content" id="ctab-req-${index}-${ci}">
                  <div class="sub-label">Request Headers</div>
                  <table class="hdr-table">${reqHeaders}</table>
                  ${reqBody}
                </div>
                <div class="ctab-content" id="ctab-res-${index}-${ci}" style="display:none">
                  <div class="sub-label">Response Headers</div>
                  <table class="hdr-table">${resHeaders}</table>
                  <div class="sub-section">
                    <div class="sub-label">Response Body <button class="copy-btn" onclick="copyJson(event, ${index}, ${ci})">Copy</button></div>
                    ${resBody}
                  </div>
                </div>
              </div>
            </div>`;
          })
          .join('');

        networkSection = `
        <div class="network-section">
          <div class="section-header">Network</div>
          ${callItems}
        </div>`;
      }

      return `
      <div class="detail-panel" id="panel-${index}" style="display: ${index === 0 ? 'block' : 'none'}">
        <div class="panel-header">
          <div class="panel-suite">${escapeHtml(t.suiteName)}</div>
          <div class="panel-title">${getStatusIcon(t.status)} ${escapeHtml(t.title)}</div>
          <div class="panel-meta">
            <span>${escapeHtml(t.file)}:${t.line}</span>
            <span>${t.duration}ms</span>
          </div>
          <div class="panel-tags">
            <span class="tag tag-project">${escapeHtml(t.projectName)}</span>
            ${t.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
          </div>
        </div>
        ${errorSection}
        ${networkSection}
      </div>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Full Test Report — Playwright E2E</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
    .top-bar h1 { font-size: 15px; font-weight: 600; }
    .top-bar h1 span { color: #89b4fa; }
    .summary { display: flex; gap: 12px; font-size: 13px; align-items: center; }
    .summary-pill {
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    .pill-all { background: #313244; color: #cdd6f4; }
    .pill-pass { background: #1e3a2f; color: #a6e3a1; }
    .pill-fail { background: #3a1e1e; color: #f38ba8; }

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
    }
    .filter-btn:hover, .filter-btn.active { background: #313244; color: #cdd6f4; border-color: #89b4fa; }
    .search-input {
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
    .search-input:focus { border-color: #89b4fa; }
    .search-input::placeholder { color: #6c7086; }

    /* ── Main Layout ── */
    .main { display: flex; flex: 1; overflow: hidden; }

    /* ── Left: Test List ── */
    .test-list {
      width: 400px;
      min-width: 300px;
      border-right: 1px solid #313244;
      overflow-y: auto;
      background: #1e1e2e;
      resize: horizontal;
    }
    .test-item {
      padding: 10px 14px;
      cursor: pointer;
      border-bottom: 1px solid #181825;
      border-left: 3px solid transparent;
      transition: background 0.1s;
    }
    .test-item:hover { background: #313244; }
    .test-item.active { background: #313244; border-left-color: #89b4fa; }
    .test-item.status-failed { border-left-color: #f38ba8; }
    .test-item.status-failed.active { border-left-color: #f38ba8; }
    .test-item-header { display: flex; align-items: center; gap: 8px; }
    .test-title { font-size: 13px; font-weight: 500; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .test-duration { font-size: 11px; color: #6c7086; font-variant-numeric: tabular-nums; }
    .test-item-meta { display: flex; align-items: center; justify-content: space-between; margin-top: 4px; }
    .test-file { font-size: 11px; color: #6c7086; }
    .test-tags { display: flex; gap: 4px; }
    .tag {
      font-size: 10px;
      padding: 1px 6px;
      border-radius: 3px;
      background: #313244;
      color: #a6adc8;
    }
    .tag-project { background: #1e3a5f; color: #89b4fa; }

    .icon-pass { color: #a6e3a1; font-weight: bold; }
    .icon-fail { color: #f38ba8; font-weight: bold; }
    .icon-flaky { color: #f9e2af; }
    .icon-skip { color: #6c7086; }

    /* ── Right: Detail Panel ── */
    .detail-area { flex: 1; overflow-y: auto; }
    .panel-header {
      padding: 16px 20px;
      border-bottom: 1px solid #313244;
      background: #181825;
    }
    .panel-suite { font-size: 12px; color: #6c7086; margin-bottom: 4px; }
    .panel-title { font-size: 18px; font-weight: 600; margin-bottom: 6px; }
    .panel-meta { font-size: 12px; color: #6c7086; display: flex; gap: 20px; margin-bottom: 6px; }
    .panel-tags { display: flex; gap: 4px; }

    /* ── Error Section ── */
    .error-section {
      border-bottom: 1px solid #313244;
    }
    .error-header {
      padding: 10px 20px;
      font-size: 13px;
      font-weight: 600;
      color: #f38ba8;
      background: #181825;
      border-bottom: 1px solid #313244;
    }
    .error-content { padding: 16px 20px; }
    .error-assertion {
      font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
      font-size: 13px;
      color: #f38ba8;
      margin-bottom: 10px;
    }
    .error-details {
      font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
      font-size: 12px;
      color: #cdd6f4;
      background: #11111b;
      border: 1px solid #313244;
      border-radius: 6px;
      padding: 12px;
      overflow-x: auto;
      max-height: 300px;
      overflow-y: auto;
      margin-bottom: 10px;
      white-space: pre-wrap;
      line-height: 1.5;
    }
    .error-location {
      font-size: 12px;
      color: #89b4fa;
      margin-bottom: 10px;
      cursor: pointer;
    }
    .code-snippet {
      background: #11111b;
      border: 1px solid #313244;
      border-radius: 6px;
      padding: 12px;
      overflow-x: auto;
      font-size: 12px;
      line-height: 1.6;
      font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
    }
    .code-snippet code { color: #a6adc8; }

    /* ── Network Section ── */
    .network-section { border-bottom: 1px solid #313244; }
    .section-header {
      padding: 10px 20px;
      font-size: 13px;
      font-weight: 600;
      color: #89b4fa;
      background: #181825;
      border-bottom: 1px solid #313244;
    }
    .network-call { border-bottom: 1px solid #232334; }
    .call-summary {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 20px;
      cursor: pointer;
      transition: background 0.1s;
    }
    .call-summary:hover { background: #2a2a3c; }
    .http-badge { font-size: 12px; font-weight: 600; font-variant-numeric: tabular-nums; min-width: 32px; }
    .http-2xx { color: #a6e3a1; }
    .http-3xx { color: #f9e2af; }
    .http-4xx { color: #f38ba8; }
    .call-method { font-size: 11px; font-weight: 600; color: #89b4fa; min-width: 45px; }
    .call-url { font-size: 12px; color: #a6adc8; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .call-duration { font-size: 11px; color: #6c7086; font-variant-numeric: tabular-nums; }
    .call-chevron { font-size: 10px; color: #6c7086; transition: transform 0.15s; }
    .call-chevron.open { transform: rotate(90deg); }

    .call-detail { padding: 0 20px 12px 20px; }
    .call-tabs { display: flex; gap: 0; margin-bottom: 10px; border-bottom: 1px solid #313244; }
    .ctab {
      background: none; border: none; color: #6c7086;
      padding: 8px 14px; cursor: pointer; font-size: 12px; font-weight: 500;
      border-bottom: 2px solid transparent;
    }
    .ctab:hover { color: #cdd6f4; }
    .ctab.active { color: #89b4fa; border-bottom-color: #89b4fa; }

    .sub-label {
      font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;
      color: #6c7086; margin-bottom: 6px; display: flex; align-items: center; gap: 8px;
    }
    .sub-section { margin-top: 12px; }
    .hdr-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 12px; }
    .hdr-table tr { border-bottom: 1px solid #232334; }
    .hdr-table td { padding: 4px 6px; vertical-align: top; }
    .hdr-key { color: #cba6f7; font-weight: 500; width: 240px; white-space: nowrap; }
    .hdr-val { color: #a6adc8; word-break: break-all; }
    .empty-msg { color: #6c7086; font-style: italic; }

    .json-block {
      background: #11111b; border: 1px solid #313244; border-radius: 6px;
      padding: 12px; overflow-x: auto; font-size: 12px; line-height: 1.5;
      font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
      color: #cdd6f4; max-height: 400px; overflow-y: auto;
    }
    .copy-btn {
      background: #313244; border: 1px solid #45475a; color: #a6adc8;
      padding: 1px 8px; border-radius: 3px; cursor: pointer; font-size: 10px;
    }
    .copy-btn:hover { background: #45475a; color: #cdd6f4; }
    .copy-btn.copied { background: #a6e3a1; color: #1e1e2e; border-color: #a6e3a1; }

    /* ── Scrollbar ── */
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: #181825; }
    ::-webkit-scrollbar-thumb { background: #45475a; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #585b70; }
  </style>
</head>
<body>
  <div class="top-bar">
    <h1><span>Full Test Report</span> — Playwright API E2E</h1>
    <div class="summary">
      <span class="summary-pill pill-all">All ${total}</span>
      <span class="summary-pill pill-pass">Passed ${passed}</span>
      <span class="summary-pill pill-fail">Failed ${failed}</span>
    </div>
  </div>

  <div class="filter-bar">
    <button class="filter-btn active" onclick="filterTests('all')">All</button>
    <button class="filter-btn" onclick="filterTests('passed')">Passed</button>
    <button class="filter-btn" onclick="filterTests('failed')">Failed</button>
    <input type="text" class="search-input" placeholder="Search tests..." oninput="searchTests(this.value)">
  </div>

  <div class="main">
    <div class="test-list">
      ${testListItems}
    </div>
    <div class="detail-area">
      ${detailPanels}
    </div>
  </div>

  <script>
    const testsData = ${JSON.stringify(tests.map((t) => ({ title: t.title, status: t.status, networkCalls: t.networkCalls })))};

    function selectTest(index) {
      document.querySelectorAll('.test-item').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.detail-panel').forEach(el => el.style.display = 'none');
      const item = document.querySelector('.test-item[data-index="' + index + '"]');
      const panel = document.getElementById('panel-' + index);
      if (item) item.classList.add('active');
      if (panel) panel.style.display = 'block';
    }

    function toggleCall(testIdx, callIdx) {
      const detail = document.getElementById('call-detail-' + testIdx + '-' + callIdx);
      const chevron = document.getElementById('chevron-' + testIdx + '-' + callIdx);
      if (detail.style.display === 'none') {
        detail.style.display = 'block';
        chevron.classList.add('open');
      } else {
        detail.style.display = 'none';
        chevron.classList.remove('open');
      }
    }

    function switchCallTab(testIdx, callIdx, tab) {
      const parent = document.getElementById('call-detail-' + testIdx + '-' + callIdx);
      parent.querySelectorAll('.ctab').forEach(t => t.classList.remove('active'));
      parent.querySelectorAll('.ctab-content').forEach(c => c.style.display = 'none');
      const reqTab = document.getElementById('ctab-req-' + testIdx + '-' + callIdx);
      const resTab = document.getElementById('ctab-res-' + testIdx + '-' + callIdx);
      if (tab === 'req') {
        reqTab.style.display = 'block';
        parent.querySelectorAll('.ctab')[0].classList.add('active');
      } else {
        resTab.style.display = 'block';
        parent.querySelectorAll('.ctab')[1].classList.add('active');
      }
    }

    function copyJson(evt, testIdx, callIdx) {
      evt.stopPropagation();
      const body = testsData[testIdx].networkCalls[callIdx].response.body;
      const text = typeof body === 'string' ? body : JSON.stringify(body, null, 2);
      navigator.clipboard.writeText(text).then(() => {
        const btn = evt.target;
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1500);
      });
    }

    function filterTests(type) {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      event.target.classList.add('active');
      document.querySelectorAll('.test-item').forEach(el => {
        const idx = parseInt(el.dataset.index);
        const status = testsData[idx].status;
        el.style.display = (type === 'all' || status === type) ? '' : 'none';
      });
    }

    function searchTests(text) {
      const lower = text.toLowerCase();
      document.querySelectorAll('.test-item').forEach(el => {
        const idx = parseInt(el.dataset.index);
        const match = testsData[idx].title.toLowerCase().includes(lower);
        el.style.display = match ? '' : 'none';
      });
    }
  </script>
</body>
</html>`;
}

// ── Main ──
function main(): void {
  const tests = collectTests();
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, generateHtml(tests));

  console.log(`\n╔══════════════════════════════════════════════════════════╗`);
  console.log(`║  Full Test Report generated!                             ║`);
  console.log(`║  Open: playwright-report/full-report.html                ║`);
  console.log(`╚══════════════════════════════════════════════════════════╝\n`);
}

main();
