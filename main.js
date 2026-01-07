// ═══════════════════════════════════════════════════════════════
// Mirror Intelligence — Truth Engine v4.0
// A Living Intelligence Surface
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

const API_BASE = '';
let MIND = null;
let EVENT_SOURCE = null;
let ENGINE_PHASE = 'idle';
let ACTIVITY_LOG = [];

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

async function init() {
  console.log("⟡ Truth Engine v4 initializing...");
  renderShell();
  await loadMind();
  loadStatus(); // Load status immediately after mind loads
  connectLiveStream();
  startPulseAnimation();
}

function renderShell() {
  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderLiveBar()}
    ${renderHeader()}
    ${renderStatusStrip()}
    <div id="content-area">
      <div class="loading-state">
        <div class="pulse-ring"></div>
        <div>Connecting to Truth Engine...</div>
      </div>
    </div>
    ${renderFooter()}
  `;
}

// ═══════════════════════════════════════════════════════════════
// DATA LOADING
// ═══════════════════════════════════════════════════════════════

async function loadMind() {
  try {
    const resp = await fetch(`${API_BASE}/api/briefing`);
    if (resp.ok) {
      const data = await resp.json();
      if (data.mind) {
        MIND = data.mind;
        render();
        return;
      }
    }
  } catch (e) {
    console.warn("API failed:", e);
  }

  // Fallback
  try {
    const resp = await fetch('/public/data.json');
    if (resp.ok) {
      const data = await resp.json();
      if (data.mind) {
        MIND = data.mind;
        render();
        return;
      }
    }
  } catch (e) { }

  renderDegraded();
}

async function loadStatus() {
  try {
    const resp = await fetch(`${API_BASE}/api/status`);
    if (resp.ok) {
      const status = await resp.json();
      ENGINE_PHASE = status.phase;
      updateStatusIndicators(status);
    }
  } catch (e) { }
}

// ═══════════════════════════════════════════════════════════════
// LIVE STREAM
// ═══════════════════════════════════════════════════════════════

function connectLiveStream() {
  try {
    EVENT_SOURCE = new EventSource(`${API_BASE}/api/live`);

    EVENT_SOURCE.onopen = () => {
      document.body.classList.add('live-connected');
      updateLiveIndicator(true);
    };

    EVENT_SOURCE.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        handleLiveEvent(event);
      } catch (err) { }
    };

    EVENT_SOURCE.onerror = () => {
      document.body.classList.remove('live-connected');
      updateLiveIndicator(false);
      EVENT_SOURCE.close();
      setTimeout(connectLiveStream, 5000);
    };
  } catch (e) { }
}

function handleLiveEvent(event) {
  // Update phase from authoritative source
  if (event.phase) {
    ENGINE_PHASE = event.phase;
    updatePhaseDisplay(event.phase);
  }

  // Add to activity log (real events only, not heartbeats)
  if (event.type !== 'heartbeat' && event.type !== 'connected') {
    ACTIVITY_LOG.unshift({
      ...event,
      receivedAt: new Date().toISOString()
    });
    if (ACTIVITY_LOG.length > 50) ACTIVITY_LOG.pop();
    updateActivityFeed(event);
    updateLiveActivityTicker(event);
  }

  // Specific event handling
  switch (event.type) {
    case 'phase_change':
      showPhaseTransition(event.phase, event.message);
      loadStatus(); // Refresh authoritative state
      break;
    case 'model_thinking':
    case 'agent_thinking':
      showModelActivity(event.model || event.agent, event.model_name || event.agent_name, 'thinking');
      break;
    case 'model_take':
    case 'agent_complete':
      showModelActivity(event.model || event.agent, event.model_name || event.agent_name, 'complete', event.take);
      break;
    case 'model_response':
      showModelDebate(event.model, event.responding_to, event.agreement);
      break;
    case 'synthesis_complete':
      showSynthesis(event);
      break;
    case 'pipeline_complete':
    case 'council_complete':
      loadMind(); // Refresh all data including deltas
      loadStatus();
      break;
    case 'ingest_complete':
      updateIngestStatus(event);
      break;
  }
}

function updateLiveActivityTicker(event) {
  // Update the live activity display with real events
  const ticker = document.getElementById('live-activity-ticker');
  if (!ticker) return;

  const eventText = formatEventForTicker(event);
  if (!eventText) return;

  const entry = document.createElement('div');
  entry.className = 'ticker-event';
  entry.innerHTML = `
    <span class="ticker-time">${formatTime(event.timestamp || new Date().toISOString())}</span>
    <span class="ticker-text">${eventText}</span>
  `;

  ticker.insertBefore(entry, ticker.firstChild);

  // Keep only last 10 events
  while (ticker.children.length > 10) {
    ticker.removeChild(ticker.lastChild);
  }
}

function formatEventForTicker(event) {
  switch (event.type) {
    case 'ingest_complete':
      return `Ingested ${event.count || 'N'} sources`;
    case 'agent_thinking':
    case 'model_thinking':
      return `${event.agent_name || event.model_name || 'Agent'} analyzing...`;
    case 'agent_complete':
    case 'model_take':
      return `${event.agent_name || event.model_name || 'Agent'} completed`;
    case 'phase_change':
      return `Phase: ${event.phase}`;
    case 'synthesis_complete':
      return 'Synthesis complete';
    case 'pipeline_complete':
    case 'council_complete':
      return 'Pipeline finished';
    case 'dissent_recorded':
      return `Dissent: ${event.message || 'counter recorded'}`;
    case 'forecast_updated':
      return `Forecast updated: ${event.forecast_id || ''}`;
    default:
      return event.message || null;
  }
}

function updateIngestStatus(event) {
  const sourcesEl = document.getElementById('status-sources');
  if (sourcesEl && event.count) {
    sourcesEl.textContent = event.count;
  }
}

function updateLiveIndicator(connected) {
  const indicator = document.getElementById('live-indicator');
  if (indicator) {
    indicator.className = `live-indicator ${connected ? 'connected' : 'disconnected'}`;
    indicator.textContent = connected ? '● LIVE' : '○ OFFLINE';
  }
}

function updatePhaseDisplay(phase) {
  const phaseEl = document.getElementById('engine-phase');
  if (phaseEl) {
    phaseEl.textContent = phase.toUpperCase();
    phaseEl.className = `phase-badge phase-${phase}`;
  }
}

// ═══════════════════════════════════════════════════════════════
// RENDERING
// ═══════════════════════════════════════════════════════════════

function render() {
  if (!MIND) {
    renderDegraded();
    return;
  }

  const content = document.getElementById('content-area');
  if (!content) return;

  content.innerHTML = `
    ${renderActivityPanel()}
    ${renderDeltaTicker()}
    ${renderMentalModel()}
    ${renderDeliberationPanel()}
    ${renderForecasts()}
    ${renderLedger()}
    ${renderBeliefs()}
    ${renderRisks()}
    ${renderHowItWorks()}
  `;

  attachEventListeners();
}

function renderLiveBar() {
  return `
    <div class="live-bar">
      <div class="live-bar-inner">
        <span id="live-indicator" class="live-indicator disconnected">○ CONNECTING</span>
        <span id="engine-phase" class="phase-badge phase-idle">IDLE</span>
        <span class="live-time" id="live-time">${formatTime(new Date())}</span>
      </div>
    </div>
  `;
}

function renderHeader() {
  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  return `
    <header class="main-header">
      <div class="header-brand">MIRROR INTELLIGENCE</div>
      <h1 class="header-title">Truth Engine</h1>
      <div class="header-date">${date}</div>
      <div class="header-tagline">Multi-Model Deliberation • Transparent Reasoning • Falsifiable Forecasts</div>
    </header>
  `;
}

function renderStatusStrip() {
  return `
    <div class="status-strip" id="status-strip">
      <div class="status-item">
        <span class="status-label">ENGINE</span>
        <span class="status-value" id="status-engine">--</span>
      </div>
      <div class="status-item">
        <span class="status-label">SOURCES</span>
        <span class="status-value" id="status-sources">--</span>
      </div>
      <div class="status-item">
        <span class="status-label">AGENTS</span>
        <span class="status-value" id="status-models">--</span>
      </div>
      <div class="status-item">
        <span class="status-label">FORECASTS</span>
        <span class="status-value" id="status-forecasts">--</span>
      </div>
      <div class="status-item status-item-wide">
        <span class="status-label">LAST UPDATE</span>
        <span class="status-value" id="status-updated">--</span>
      </div>
      <button class="refresh-btn" onclick="triggerRefresh()">⟳ REFRESH</button>
    </div>
  `;
}

function renderActivityPanel() {
  return `
    <div class="activity-panel" id="activity-panel">
      <div class="panel-header">
        <span class="panel-title">⟡ LIVE ACTIVITY</span>
        <span class="panel-subtitle" id="activity-count">0 events</span>
      </div>
      <div class="activity-feed" id="activity-feed">
        <div class="activity-empty">Waiting for activity...</div>
      </div>
    </div>
  `;
}

function renderDeltaTicker() {
  const deltas = MIND?.deltas || [];

  // If no real deltas, show informative message with last update time
  if (deltas.length === 0) {
    const lastUpdate = MIND?.stats?.last_updated ? formatTimeAgo(MIND.stats.last_updated) : 'Unknown';
    const sourcesCount = MIND?.sources?.length || 0;
    return `
      <div class="delta-section">
        <div class="section-header">REALITY SIGNALS</div>
        <div class="delta-empty-state">
          <div class="empty-icon">📡</div>
          <div class="empty-text">Awaiting signal extraction</div>
          <div class="empty-meta">${sourcesCount} sources ingested • Last run: ${lastUpdate}</div>
          <button class="action-btn" onclick="triggerRefresh()">Run Pipeline</button>
        </div>
      </div>
    `;
  }

  const items = deltas.map((d, i) => `
    <div class="delta-card delta-${d.sentiment}" data-index="${i}" onclick="openPulse(${i})">
      <div class="delta-mag">${d.magnitude > 0 ? '+' : ''}${d.magnitude || 0}%</div>
      <div class="delta-text">${d.text}</div>
      <div class="delta-type">${d.type}</div>
    </div>
  `).join('');

  return `
    <div class="delta-section">
      <div class="section-header">REALITY SIGNALS</div>
      <div class="delta-grid">${items}</div>
    </div>
  `;
}

function renderMentalModel() {
  const update = MIND?.update;
  if (!update) return '';

  return `
    <div class="mental-model-section">
      <div class="section-header">EXECUTIVE MODEL</div>
      <div class="model-card">
        <div class="model-row">
          <span class="model-label">SIGNAL</span>
          <span class="model-value">${update.matters}</span>
        </div>
        <div class="model-row">
          <span class="model-label">CONFIDENCE</span>
          <span class="model-value">${update.confidence}</span>
        </div>
        <div class="model-row">
          <span class="model-label">UNRESOLVED</span>
          <span class="model-value">${update.unresolved}</span>
        </div>
      </div>
    </div>
  `;
}

function renderDeliberationPanel() {
  return `
    <div class="deliberation-section">
      <div class="section-header">MODEL DELIBERATION</div>
      <div class="deliberation-container" id="deliberation-container">
        <div class="deliberation-placeholder">
          <div class="placeholder-icon">🤖</div>
          <div>No active deliberation</div>
          <button class="action-btn" onclick="triggerDeliberation()">Start Deliberation</button>
        </div>
      </div>
    </div>
  `;
}

function renderForecasts() {
  const forecasts = MIND?.forecasts || [];
  const open = forecasts.filter(f => f.status === 'open');
  const resolved = forecasts.filter(f => f.status === 'resolved');

  return `
    <div class="forecasts-section">
      <div class="section-header">FORECASTS (${open.length} open, ${resolved.length} resolved)</div>
      
      ${open.length > 0 ? `
        <div class="forecast-grid">
          ${open.map(f => `
            <div class="forecast-card" onclick="openForecast('${f.id}')">
              <div class="forecast-prob">${(f.probability * 100).toFixed(0)}%</div>
              <div class="forecast-question">${f.question}</div>
              <div class="forecast-meta">
                <span>Resolves: ${formatDate(f.resolution_date)}</span>
              </div>
              <div class="forecast-criteria">${f.resolution_criteria}</div>
            </div>
          `).join('')}
        </div>
      ` : '<div class="empty-state">No open forecasts</div>'}
      
      ${resolved.length > 0 ? `
        <div class="section-subheader">RESOLVED</div>
        <div class="forecast-grid resolved">
          ${resolved.map(f => `
            <div class="forecast-card ${f.outcome ? 'outcome-yes' : 'outcome-no'}" onclick="openForecast('${f.id}')">
              <div class="forecast-outcome">${f.outcome ? '✓ YES' : '✗ NO'}</div>
              <div class="forecast-question">${f.question}</div>
              <div class="forecast-brier">Brier: ${f.brier_score}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

function renderLedger() {
  const ledger = MIND?.ledger || [];
  const recent = [...ledger].reverse().slice(0, 15);

  return `
    <div class="ledger-section">
      <div class="section-header">TRUTH LEDGER (${ledger.length} entries)</div>
      <div class="ledger-info">Append-only. No edits. No deletions.</div>
      <div class="ledger-feed">
        ${recent.map(e => `
          <div class="ledger-entry">
            <span class="ledger-time">${formatTime(e.timestamp)}</span>
            <span class="ledger-type type-${e.type.toLowerCase()}">${e.type}</span>
            <span class="ledger-summary">${summarizeLedger(e)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderBeliefs() {
  const beliefs = MIND?.beliefs || [];
  if (beliefs.length === 0) return '';

  return `
    <div class="beliefs-section">
      <div class="section-header">LIVING BELIEFS</div>
      <div class="beliefs-grid">
        ${beliefs.map(b => `
          <div class="belief-card status-${b.status}">
            <div class="belief-header">
              <span class="belief-confidence">${b.confidence}%</span>
              <span class="belief-status">${b.status}</span>
            </div>
            <div class="belief-statement">${b.statement}</div>
            <div class="belief-evidence">
              <div><strong>For:</strong> ${b.evidence_for}</div>
              <div><strong>Against:</strong> ${b.evidence_against}</div>
            </div>
            <div class="belief-updated">Last challenged: ${b.last_challenged}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderRisks() {
  const risks = MIND?.risks || [];
  if (risks.length === 0) return '';

  return `
    <div class="risks-section">
      <div class="section-header">SYSTEMIC RISKS</div>
      <div class="risks-list">
        ${risks.map(r => `
          <div class="risk-card severity-${r.severity}">
            <div class="risk-indicator"></div>
            <div class="risk-content">
              <div class="risk-text">${r.text}</div>
              <div class="risk-compound">If unchecked: ${r.compounding_factor}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderHowItWorks() {
  return `
    <div class="how-section">
      <div class="section-header">HOW THIS WORKS</div>
      <div class="how-grid">
        <div class="how-card">
          <div class="how-icon">📡</div>
          <div class="how-title">Ingest</div>
          <div class="how-desc">25+ RSS feeds across tech, markets, policy, security. Deduplicated and clustered.</div>
        </div>
        <div class="how-card">
          <div class="how-icon">🤖</div>
          <div class="how-title">Deliberate</div>
          <div class="how-desc">Multiple AI models independently analyze, then respond to each other. Forced dissent.</div>
        </div>
        <div class="how-card">
          <div class="how-icon">📊</div>
          <div class="how-title">Forecast</div>
          <div class="how-desc">Binary predictions with explicit criteria. Brier-scored for accountability.</div>
        </div>
        <div class="how-card">
          <div class="how-icon">📜</div>
          <div class="how-title">Ledger</div>
          <div class="how-desc">Append-only truth log. Every change recorded. No rewrites.</div>
        </div>
      </div>
      <div class="how-philosophy">
        <strong>Why multiple models?</strong> Single models have blind spots. Disagreement reveals uncertainty honestly.
        Cross-validation catches hallucinations. Different architectures see different patterns.
      </div>
    </div>
  `;
}

function renderFooter() {
  return `
    <footer class="main-footer">
      <div>Mirror Intelligence — Truth Engine v4.0</div>
      <div>Multi-Model Deliberation • Append-Only Ledger • Brier Scoring</div>
    </footer>
  `;
}

function renderDegraded() {
  const content = document.getElementById('content-area');
  if (content) {
    content.innerHTML = `
      <div class="degraded-state">
        <div class="degraded-icon">⚠</div>
        <div class="degraded-title">Engine Unavailable</div>
        <div class="degraded-message">Unable to connect to Truth Engine. Retrying...</div>
        <button class="action-btn" onclick="loadMind()">Retry</button>
      </div>
    `;
  }
}

// ═══════════════════════════════════════════════════════════════
// LIVE ACTIVITY DISPLAY
// ═══════════════════════════════════════════════════════════════

function updateActivityFeed(event) {
  const feed = document.getElementById('activity-feed');
  if (!feed) return;

  // Remove placeholder
  const placeholder = feed.querySelector('.activity-empty');
  if (placeholder) placeholder.remove();

  // Create entry
  const entry = document.createElement('div');
  entry.className = `activity-entry type-${event.type}`;
  entry.innerHTML = `
    <span class="activity-time">${formatTime(event.timestamp)}</span>
    <span class="activity-type">${event.type}</span>
    <span class="activity-message">${event.message || event.model_name || ''}</span>
  `;

  // Add with animation
  entry.style.opacity = '0';
  feed.insertBefore(entry, feed.firstChild);
  requestAnimationFrame(() => entry.style.opacity = '1');

  // Limit entries
  while (feed.children.length > 20) {
    feed.removeChild(feed.lastChild);
  }

  // Update count
  const count = document.getElementById('activity-count');
  if (count) count.textContent = `${ACTIVITY_LOG.length} events`;
}

function showPhaseTransition(phase, message) {
  const container = document.getElementById('deliberation-container');
  if (!container) return;

  container.innerHTML = `
    <div class="phase-transition">
      <div class="phase-indicator phase-${phase}">
        <div class="phase-pulse"></div>
        <div class="phase-name">${phase.toUpperCase()}</div>
      </div>
      <div class="phase-message">${message}</div>
    </div>
  `;
}

function showModelActivity(modelId, modelName, status, take = null) {
  const container = document.getElementById('deliberation-container');
  if (!container) return;

  let modelCard = container.querySelector(`[data-model="${modelId}"]`);

  if (!modelCard) {
    modelCard = document.createElement('div');
    modelCard.className = 'model-card-live';
    modelCard.dataset.model = modelId;
    container.appendChild(modelCard);
  }

  if (status === 'thinking') {
    modelCard.innerHTML = `
      <div class="model-header">
        <span class="model-name">${modelName}</span>
        <span class="model-status thinking">Thinking...</span>
      </div>
      <div class="model-thinking-indicator">
        <span></span><span></span><span></span>
      </div>
    `;
  } else if (status === 'complete' && take) {
    modelCard.innerHTML = `
      <div class="model-header">
        <span class="model-name">${modelName}</span>
        <span class="model-status complete">✓</span>
      </div>
      <div class="model-take">${take}</div>
    `;
  }
}

function showModelDebate(responder, target, agreement) {
  const container = document.getElementById('deliberation-container');
  if (!container) return;

  const debateLine = document.createElement('div');
  debateLine.className = `debate-line ${agreement > 0 ? 'agree' : 'disagree'}`;
  debateLine.innerHTML = `
    <span class="debate-from">${responder}</span>
    <span class="debate-arrow">${agreement > 0 ? '→✓' : '→✗'}</span>
    <span class="debate-to">${target}</span>
    <span class="debate-score">${(agreement * 100).toFixed(0)}%</span>
  `;
  container.appendChild(debateLine);
}

function showSynthesis(event) {
  const container = document.getElementById('deliberation-container');
  if (!container) return;

  const synthCard = document.createElement('div');
  synthCard.className = 'synthesis-card';
  synthCard.innerHTML = `
    <div class="synthesis-header">⟡ SYNTHESIS</div>
    <div class="synthesis-consensus">${event.consensus}</div>
    <div class="synthesis-meta">
      ${event.disagreement_count} disagreements
      ${event.final_probability ? ` • p=${(event.final_probability * 100).toFixed(0)}%` : ''}
    </div>
  `;
  container.appendChild(synthCard);
}

function updateStatusIndicators(status) {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val || '--';
  };

  // Engine phase — AUTHORITATIVE, no fallback
  // If API doesn't respond, we show nothing (honest)
  const phase = status?.phase || '--';
  ENGINE_PHASE = phase; // Sync local for other uses
  set('status-engine', phase.toUpperCase());

  // Show blocked reason if present (state correctness)
  const blockedEl = document.getElementById('status-blocked');
  if (blockedEl) {
    if (status?.blocked_reason) {
      blockedEl.textContent = status.blocked_reason;
      blockedEl.style.display = 'block';
    } else {
      blockedEl.style.display = 'none';
    }
  }

  // Sources - try status first, then MIND stats
  const sources = status?.sources_ingested || MIND?.stats?.sources_scanned_24h || MIND?.sources?.length || 0;
  set('status-sources', sources > 0 ? sources : '--');

  // Agents - from agents_available field
  const agents = status?.agents_available || '--';
  set('status-models', agents);

  // Forecasts and last update from MIND
  if (MIND) {
    const activeForecasts = MIND.stats?.active_forecasts || MIND.forecasts?.filter(f => f.status === 'open')?.length || 0;
    set('status-forecasts', activeForecasts);
    set('status-updated', formatTimeAgo(MIND.stats?.last_updated));
  } else {
    set('status-forecasts', '--');
    set('status-updated', '--');
  }

  // Update phase badge class
  const phaseEl = document.getElementById('status-engine');
  if (phaseEl) {
    phaseEl.className = `status-value phase-${phase}`;
  }
}

// ═══════════════════════════════════════════════════════════════
// ACTIONS
// ═══════════════════════════════════════════════════════════════

async function triggerRefresh() {
  try {
    const btn = document.querySelector('.refresh-btn');
    if (btn) btn.textContent = '⟳ RUNNING...';

    await fetch(`${API_BASE}/api/refresh`, { method: 'POST' });
  } catch (e) {
    console.error("Refresh failed:", e);
  }
}

async function triggerDeliberation() {
  try {
    await fetch(`${API_BASE}/api/deliberate`, { method: 'POST' });
  } catch (e) {
    console.error("Deliberation failed:", e);
  }
}

async function openPulse(index) {
  try {
    const resp = await fetch(`${API_BASE}/api/pulse/${index}`);
    if (resp.ok) {
      const data = await resp.json();
      showModal(renderPulseDetail(data));
    }
  } catch (e) { }
}

async function openForecast(id) {
  try {
    const resp = await fetch(`${API_BASE}/api/forecast/${id}`);
    if (resp.ok) {
      const data = await resp.json();
      showModal(renderForecastDetail(data));
    }
  } catch (e) { }
}

function renderPulseDetail(data) {
  return `
    <div class="modal-header">
      <span class="modal-type">${data.type}</span>
      <span class="modal-mag ${data.sentiment}">${data.magnitude > 0 ? '+' : ''}${data.magnitude}%</span>
    </div>
    <h3>${data.summary}</h3>
    <div class="modal-section">
      <div class="modal-label">What Changed</div>
      <div>${data.what_changed}</div>
    </div>
    <div class="modal-section">
      <div class="modal-label">Why It Matters</div>
      <div>${data.why_it_matters}</div>
    </div>
    <div class="modal-section">
      <div class="modal-label">Sources (${data.citation_count})</div>
      ${data.citations.map(c => `
        <div class="citation">
          <a href="${c.url}" target="_blank">${c.title}</a>
          <div class="citation-domain">${c.domain}</div>
          <div class="citation-excerpt">${c.excerpt}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderForecastDetail(data) {
  return `
    <div class="modal-status ${data.status}">${data.status.toUpperCase()}</div>
    <h3>${data.question}</h3>
    <div class="modal-prob">${data.probability_pct}</div>
    <div class="modal-section">
      <div class="modal-label">Resolution Criteria</div>
      <div>${data.resolution_criteria}</div>
    </div>
    <div class="modal-section">
      <div class="modal-label">Resolves</div>
      <div>${formatDate(data.resolution_date)}</div>
    </div>
    ${data.brier_score !== null ? `
      <div class="modal-section">
        <div class="modal-label">Brier Score</div>
        <div>${data.brier_score}</div>
      </div>
    ` : ''}
  `;
}

function showModal(content) {
  let modal = document.getElementById('modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal';
    modal.className = 'modal-overlay';
    modal.onclick = (e) => { if (e.target === modal) modal.classList.add('hidden'); };
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-content">
      <button class="modal-close" onclick="document.getElementById('modal').classList.add('hidden')">×</button>
      ${content}
    </div>
  `;
  modal.classList.remove('hidden');
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

function formatTime(ts) {
  if (!ts) return '--:--';
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch { return '--:--'; }
}

function formatDate(ts) {
  if (!ts) return '--';
  try {
    const d = new Date(ts);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return '--'; }
}

function formatTimeAgo(ts) {
  if (!ts) return '--';
  try {
    const d = new Date(ts);
    const now = new Date();
    const mins = Math.floor((now - d) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return formatDate(ts);
  } catch { return '--'; }
}

function summarizeLedger(entry) {
  const p = entry.payload || {};
  switch (entry.type) {
    case 'INGEST': return p.title || 'Source ingested';
    case 'FORECAST_OPEN': return `${(p.question || '').substring(0, 40)}...`;
    case 'FORECAST_RESOLVE': return `${p.outcome ? 'YES' : 'NO'} (Brier: ${p.brier_score})`;
    case 'SYSTEM_UPDATE': return p.message || 'System update';
    default: return JSON.stringify(p).substring(0, 50);
  }
}

function startPulseAnimation() {
  // Update live time
  setInterval(() => {
    const el = document.getElementById('live-time');
    if (el) el.textContent = formatTime(new Date());
  }, 1000);

  // Poll status
  setInterval(loadStatus, 10000);
  loadStatus();
}

function attachEventListeners() {
  // Delegated click handlers added inline
}

// ═══════════════════════════════════════════════════════════════
// BOOT
// ═══════════════════════════════════════════════════════════════

init();
