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
let COMMAND_PALETTE_OPEN = false;

// User Memory (localStorage)
const USER_MEMORY_KEY = 'mirror_intelligence_user';
function getUserMemory() {
  try {
    return JSON.parse(localStorage.getItem(USER_MEMORY_KEY)) || {
      lastVisit: null,
      viewedForecasts: [],
      questionsAsked: []
    };
  } catch { return { lastVisit: null, viewedForecasts: [], questionsAsked: [] }; }
}
function saveUserMemory(mem) {
  try { localStorage.setItem(USER_MEMORY_KEY, JSON.stringify(mem)); } catch { }
}
function recordVisit() {
  const mem = getUserMemory();
  mem.lastVisit = new Date().toISOString();
  saveUserMemory(mem);
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

async function init() {
  console.log("⟡ Truth Engine v4 initializing...");
  renderShell();
  await loadMind();
  loadStatus();
  connectLiveStream();
  startPulseAnimation();
  initCommandPalette();
  recordVisit();
}

function initCommandPalette() {
  document.addEventListener('keydown', (e) => {
    // ⌘K or / to open
    if ((e.metaKey && e.key === 'k') || (e.key === '/' && !e.target.matches('input, textarea'))) {
      e.preventDefault();
      toggleCommandPalette();
    }
    // Escape to close
    if (e.key === 'Escape' && COMMAND_PALETTE_OPEN) {
      closeCommandPalette();
    }
  });
}

function toggleCommandPalette() {
  COMMAND_PALETTE_OPEN = !COMMAND_PALETTE_OPEN;
  const overlay = document.getElementById('command-palette-overlay');
  if (overlay) {
    overlay.classList.toggle('open', COMMAND_PALETTE_OPEN);
    if (COMMAND_PALETTE_OPEN) {
      setTimeout(() => overlay.querySelector('.command-input')?.focus(), 50);
    }
  }
}

function closeCommandPalette() {
  COMMAND_PALETTE_OPEN = false;
  const overlay = document.getElementById('command-palette-overlay');
  if (overlay) overlay.classList.remove('open');
}

function renderShell() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <!-- PLANE 1: SIGNAL FIELD -->
    ${renderSignalField()}
    
    <div id="content-area">
      <div class="idle-surface">
        <div class="idle-breathing"></div>
        <div class="idle-status">⟡ CONNECTING TO TRUTH ENGINE</div>
      </div>
    </div>
    
    ${renderFooter()}
  `;
}

function renderSignalField() {
  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  const time = formatTime(new Date());
  const phase = ENGINE_PHASE || 'idle';
  const isIdle = phase === 'idle' || phase === '--';

  return `
    <div class="signal-field">
      <!-- Ambient signal bands -->
      <div class="signal-band" style="top: 25%"></div>
      <div class="signal-band" style="top: 50%"></div>
      <div class="signal-band" style="top: 75%"></div>
      
      <!-- Signal particles -->
      <div class="signal-particle" style="top: 30%; animation-delay: 0s;"></div>
      <div class="signal-particle" style="top: 50%; animation-delay: 2s;"></div>
      <div class="signal-particle" style="top: 70%; animation-delay: 4s;"></div>
      
      <div class="signal-header">
        <div class="signal-brand">MIRROR INTELLIGENCE</div>
        <h1 class="signal-title">Truth Engine</h1>
        <div class="signal-timestamp">${date}</div>
        
        <div class="signal-pulse">
          <span class="pulse-dot ${isIdle ? 'idle' : ''}"></span>
          <span class="pulse-label">${isIdle ? 'WATCHING' : phase.toUpperCase()}</span>
          <span class="pulse-label" style="margin-left: 16px;">${time}</span>
        </div>
      </div>
    </div>
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
  // Epistemic event language - not mechanical
  switch (event.type) {
    case 'ingest_complete':
      return `Scanned ${event.count || 'multiple'} sources for signals`;
    case 'agent_thinking':
    case 'model_thinking':
      const agent = event.agent_name || event.model_name || 'Agent';
      return `${agent} deliberating...`;
    case 'agent_complete':
    case 'model_take':
      const completeAgent = event.agent_name || event.model_name || 'Agent';
      return `${completeAgent} rendered judgment`;
    case 'phase_change':
      const phaseLabels = {
        'ingesting': 'Scanning sources',
        'deliberating': 'Multi-agent deliberation active',
        'synthesizing': 'Synthesizing consensus',
        'published': 'Analysis published',
        'idle': 'System idle — watching'
      };
      return phaseLabels[event.phase] || `Phase: ${event.phase}`;
    case 'synthesis_complete':
      return 'Consensus synthesis complete';
    case 'pipeline_complete':
    case 'council_complete':
      return 'Deliberation cycle complete — ledger updated';
    case 'dissent_recorded':
      return `Skeptic challenged confidence (penalty pending)`;
    case 'forecast_updated':
      return `Forecast probability adjusted`;
    case 'confidence_shift':
      return `Confidence shifted: ${event.from}% → ${event.to}%`;
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

  // SPATIAL HUB ARCHITECTURE
  content.innerHTML = `
    <!-- COMMAND PALETTE (Hidden until ⌘K) -->
    ${renderCommandPalette()}
    
    <!-- HUB GRID: 3 COLUMNS -->
    <div class="hub-container">
      
      <!-- LEFT RAIL: Inputs & Commands -->
      <div class="left-rail">
        ${renderAskEngine()}
        ${renderExampleQuestions()}
        ${renderUserMemory()}
      </div>
      
      <!-- CENTER: THINKING CORE (Sticky) -->
      <div class="thinking-core" id="thinking-core">
        ${renderThinkingCore()}
      </div>
      
      <!-- RIGHT RAIL: Live State -->
      <div class="right-rail">
        ${renderLiveStateRail()}
        ${renderDeltasRail()}
      </div>
      
    </div>
    
    <!-- COMMIT SURFACE (Bottom) -->
    <div class="commit-surface">
      <div class="commit-header">⟡ CRYSTALLIZED TRUTH</div>
      ${renderForecasts()}
      ${renderBeliefs()}
      ${renderRisks()}
      ${renderLedger()}
    </div>
  `;

  attachEventListeners();
  updateThinkingCoreState();
}

function renderCommandPalette() {
  const commands = [
    { icon: '⟡', text: 'Request new analysis', hint: 'deliberate', action: 'triggerDeliberation()' },
    { icon: '🔍', text: 'Search forecasts', hint: 'search', action: '' },
    { icon: '📊', text: 'Show belief changes', hint: 'changes', action: '' },
    { icon: '⚠️', text: 'View active risks', hint: 'risks', action: '' },
    { icon: '📜', text: 'Open ledger', hint: 'ledger', action: '' },
  ];

  return `
    <div class="command-palette-overlay" id="command-palette-overlay" onclick="if(event.target === this) closeCommandPalette()">
      <div class="command-palette">
        <div class="command-input-wrapper">
          <span class="command-icon">⟡</span>
          <input type="text" class="command-input" placeholder="What would you like to do?" autofocus>
          <span class="command-shortcut">esc</span>
        </div>
        <div class="command-results">
          ${commands.map((c, i) => `
            <div class="command-item ${i === 0 ? 'selected' : ''}" onclick="${c.action}">
              <span class="command-item-icon">${c.icon}</span>
              <span class="command-item-text">${c.text}</span>
              <span class="command-item-hint">${c.hint}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderThinkingCore() {
  const update = MIND?.update || {};
  const lastUpdate = MIND?.stats?.last_updated;
  const signal = update.matters || 'Awaiting signal extraction...';
  const confidence = update.confidence || 'No dissent recorded — confidence stable';
  const unresolved = update.unresolved || null;

  return `
    <div class="core-header">
      <span class="core-title">EXECUTIVE MODEL</span>
      <div class="core-status">
        <span class="core-status-dot ${ENGINE_PHASE === 'idle' ? 'idle' : ''}"></span>
        <span>${ENGINE_PHASE === 'idle' ? 'WATCHING' : ENGINE_PHASE.toUpperCase()}</span>
      </div>
    </div>
    
    <div class="core-signal">${signal}</div>
    
    <div class="core-confidence">
      <span class="core-confidence-label">CONFIDENCE</span>
      <span class="core-confidence-value">${confidence}</span>
    </div>
    
    ${unresolved ? `
      <div class="core-unresolved">
        <strong>UNRESOLVED:</strong> ${unresolved}
      </div>
    ` : ''}
    
    <div class="core-timestamp">Updated ${formatTimeAgo(lastUpdate)}</div>
  `;
}

function updateThinkingCoreState() {
  const core = document.getElementById('thinking-core');
  if (!core) return;

  // Remove old state classes
  core.classList.remove('ingesting', 'deliberating', 'challenged');

  // Add current state class
  if (ENGINE_PHASE === 'ingesting') core.classList.add('ingesting');
  if (ENGINE_PHASE === 'deliberating') core.classList.add('deliberating');
  if (MIND?.update?.unresolved) core.classList.add('challenged');
}

function renderLiveStateRail() {
  const events = ACTIVITY_LOG.slice(0, 5);
  const isIdle = events.length === 0;

  return `
    <div class="rail-section">
      <div class="rail-header">
        <span class="rail-indicator ${isIdle ? 'idle' : ''}"></span>
        <span>${isIdle ? 'WATCHING' : 'LIVE ACTIVITY'}</span>
      </div>
      <div class="activity-feed" id="activity-feed" style="font-size: 0.8rem;">
        ${events.length > 0 ? events.map(e => `
          <div class="activity-event" style="padding: 4px 0;">
            <span class="event-time">${formatTime(e.timestamp || e.receivedAt)}</span>
            <span class="event-text">${formatEventForTicker(e) || e.type}</span>
          </div>
        `).join('') : `
          <div style="color: var(--text-ghost); font-size: 0.75rem;">
            System idle — monitoring for signals
          </div>
        `}
      </div>
    </div>
    
    <div class="rail-section">
      <div class="rail-header">STATUS</div>
      ${renderStatusReadingsCompact()}
    </div>
  `;
}

function renderStatusReadingsCompact() {
  const sources = MIND?.stats?.sources_scanned_24h || MIND?.sources?.length || 0;
  const forecasts = MIND?.forecasts?.filter(f => f.status === 'open')?.length || 0;
  const agents = MIND?.stats?.models_participated || 4;

  return `
    <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.8rem;">
      <div style="display: flex; justify-content: space-between;">
        <span style="color: var(--text-ghost);">Sources</span>
        <span style="color: var(--text-primary); font-family: var(--font-mono);">${sources}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: var(--text-ghost);">Agents</span>
        <span style="color: var(--text-primary); font-family: var(--font-mono);">${agents}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: var(--text-ghost);">Forecasts</span>
        <span style="color: var(--text-primary); font-family: var(--font-mono);">${forecasts}</span>
      </div>
    </div>
  `;
}

function renderDeltasRail() {
  const deltas = MIND?.deltas || [];

  if (deltas.length === 0) {
    return `
      <div class="rail-section">
        <div class="rail-header">REALITY SIGNALS</div>
        <div style="color: var(--text-ghost); font-size: 0.75rem;">
          No signals extracted yet
        </div>
      </div>
    `;
  }

  return `
    <div class="rail-section">
      <div class="rail-header">REALITY SIGNALS</div>
      ${deltas.slice(0, 3).map(d => `
        <div style="display: flex; gap: 8px; padding: 8px 0; border-bottom: 1px solid var(--text-ghost); cursor: pointer;">
          <span style="color: ${d.sentiment === 'positive' ? 'var(--signal-confidence)' : d.sentiment === 'negative' ? 'var(--signal-challenge)' : 'var(--text-muted)'}; font-family: var(--font-mono); font-weight: 600; min-width: 40px;">
            ${d.magnitude > 0 ? '+' : ''}${d.magnitude || 0}%
          </span>
          <span style="font-size: 0.8rem; color: var(--text-body);">${d.text?.substring(0, 60)}...</span>
        </div>
      `).join('')}
    </div>
  `;
}

function renderUserMemory() {
  const mem = getUserMemory();
  const forecasts = MIND?.forecasts || [];
  const beliefs = MIND?.beliefs || [];
  const risks = MIND?.risks || [];

  const timeSinceLastVisit = mem.lastVisit
    ? formatTimeAgo(mem.lastVisit)
    : 'First visit';

  return `
    <div class="user-memory">
      <div class="memory-header">Since ${timeSinceLastVisit}</div>
      <div class="memory-items">
        <div class="memory-item">
          <span class="memory-delta positive">+${forecasts.filter(f => f.status === 'open').length}</span>
          <span>forecasts</span>
        </div>
        <div class="memory-item">
          <span class="memory-delta neutral">${beliefs.length}</span>
          <span>beliefs</span>
        </div>
        <div class="memory-item">
          <span class="memory-delta ${risks.length > 3 ? 'negative' : 'neutral'}">${risks.length}</span>
          <span>risks</span>
        </div>
      </div>
    </div>
  `;
}

function renderAskEngine() {
  return `
    <div class="ask-engine">
      <div class="ask-engine-title">What would you like to know?</div>
      <div class="ask-engine-subtitle">The Truth Engine synthesizes intelligence from ${MIND?.sources?.length || 200}+ sources daily</div>
      <button class="ask-engine-btn" onclick="triggerDeliberation()">
        ⟡ Request Analysis
      </button>
    </div>
  `;
}

function renderExampleQuestions() {
  const examples = [
    "What cyber risks are rising fastest right now?",
    "Which forecasts changed confidence this week?",
    "What would most likely break our current assumptions?"
  ];

  return `
    <div class="example-questions">
      <div class="examples-header">Try asking</div>
      <div class="examples-list">
        ${examples.map(q => `
          <div class="example-item" onclick="showExampleResponse('${q}')">
            <span class="example-bullet">→</span>
            <span>${q}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderChangesSummary() {
  const forecasts = MIND?.forecasts || [];
  const beliefs = MIND?.beliefs || [];
  const risks = MIND?.risks || [];
  const lastUpdate = MIND?.stats?.last_updated;

  // Simulate changes (in production, compare with stored state)
  const forecastsAdded = forecasts.filter(f => f.status === 'open').length;
  const risksCount = risks.length;

  return `
    <div class="changes-summary">
      <div class="changes-header">Since your last visit</div>
      <div class="changes-list">
        <div class="change-item">
          <span class="change-delta positive">+${forecastsAdded}</span>
          <span>active forecasts</span>
        </div>
        <div class="change-item">
          <span class="change-delta neutral">${beliefs.length}</span>
          <span>beliefs tracked</span>
        </div>
        <div class="change-item">
          <span class="change-delta ${risksCount > 3 ? 'negative' : 'neutral'}">${risksCount}</span>
          <span>risks surfaced</span>
        </div>
        <div class="change-item">
          <span class="change-delta neutral">${formatTimeAgo(lastUpdate)}</span>
          <span>last deliberation</span>
        </div>
      </div>
    </div>
  `;
}

function showExampleResponse(question) {
  // For now, trigger deliberation
  console.log('Example question:', question);
  triggerDeliberation();
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
  return renderActivityStream();
}

function renderActivityStream() {
  const events = ACTIVITY_LOG.slice(0, 8);
  const isIdle = events.length === 0;

  return `
    <div class="activity-stream">
      <div class="activity-header">
        <span class="activity-indicator ${isIdle ? 'idle' : ''}"></span>
        <span class="activity-title">${isIdle ? 'WATCHING' : 'LIVE EVENTS'}</span>
      </div>
      <div class="activity-feed" id="activity-feed">
        ${events.length > 0 ? events.map(e => `
          <div class="activity-event">
            <span class="event-time">${formatTime(e.timestamp || e.receivedAt)}</span>
            <span class="event-text">${formatEventForTicker(e) || e.message || e.type}</span>
          </div>
        `).join('') : `
          <div class="activity-event">
            <span class="event-time">${formatTime(new Date())}</span>
            <span class="event-text">System idle — monitoring for signals</span>
          </div>
        `}
      </div>
    </div>
  `;
}

function renderStatusReadings() {
  const sources = MIND?.stats?.sources_scanned_24h || MIND?.sources?.length || 0;
  const forecasts = MIND?.forecasts?.filter(f => f.status === 'open')?.length || 0;
  const agents = MIND?.stats?.models_participated || 4;
  const lastUpdate = MIND?.stats?.last_updated;

  return `
    <div class="status-strip">
      <div class="status-reading">
        <span class="reading-value" id="status-sources">${sources}</span>
        <span class="reading-label">SOURCES</span>
      </div>
      <div class="status-reading">
        <span class="reading-value" id="status-models">${agents}</span>
        <span class="reading-label">AGENTS</span>
      </div>
      <div class="status-reading">
        <span class="reading-value" id="status-forecasts">${forecasts}</span>
        <span class="reading-label">FORECASTS</span>
      </div>
      <div class="status-reading">
        <span class="reading-value" id="status-updated">${formatTimeAgo(lastUpdate)}</span>
        <span class="reading-label">LAST RUN</span>
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

// Alias for new structure
function renderDeltas() {
  return renderDeltaTicker();
}

function renderExecutiveModel() {
  return renderMentalModel();
}

function renderMentalModel() {
  const update = MIND?.update;
  if (!update) return '';

  const lastUpdate = MIND?.stats?.last_updated;
  const confidence = update.confidence || 'No dissent recorded this cycle — confidence unchanged';
  const unresolved = update.unresolved || 'No unresolved questions surfaced';

  return `
    <div class="mental-model-section">
      <div class="section-header">EXECUTIVE MODEL</div>
      <div class="model-card">
        <div class="model-row">
          <span class="model-label">SIGNAL</span>
          <span class="model-value">${update.matters || 'Awaiting signal extraction'}</span>
        </div>
        <div class="model-row">
          <span class="model-label">CONFIDENCE</span>
          <span class="model-value">${confidence}</span>
        </div>
        <div class="model-row">
          <span class="model-label">UNRESOLVED</span>
          <span class="model-value">${unresolved}</span>
        </div>
        ${lastUpdate ? `<div class="model-timestamp">${formatTimeAgo(lastUpdate)}</div>` : ''}
      </div>
    </div>
  `;
}

function renderDeliberationPanel() {
  const lastSession = MIND?.stats?.last_deliberation;
  const agentsCount = MIND?.stats?.models_participated || 0;
  const lastUpdate = MIND?.stats?.last_updated;

  // Calculate hours since last deliberation
  let hoursSince = '--';
  if (lastUpdate) {
    const hours = Math.floor((Date.now() - new Date(lastUpdate).getTime()) / (1000 * 60 * 60));
    hoursSince = hours < 1 ? '<1' : hours;
  }

  return `
    <div class="deliberation-section">
      <div class="section-header">MODEL DELIBERATION</div>
      <div class="deliberation-panel">
        <div class="deliberation-idle">
          <div class="deliberation-idle-status">● System Idle • Watching</div>
          
          <div class="deliberation-idle-meta">
            <div class="idle-stat">
              <span class="idle-stat-value">${hoursSince}h</span>
              <span class="idle-stat-label">Since Last Run</span>
            </div>
            <div class="idle-stat">
              <span class="idle-stat-value">${agentsCount}</span>
              <span class="idle-stat-label">Agents Involved</span>
            </div>
            <div class="idle-stat">
              <span class="idle-stat-value">${MIND?.risks?.length || 0}</span>
              <span class="idle-stat-label">Risks Surfaced</span>
            </div>
          </div>
          
          <div class="deliberation-agents">
            <strong>Last cycle:</strong> Extractor, Skeptic, Analyst, Forecaster
          </div>
          
          <button class="deliberation-btn" onclick="triggerDeliberation()">Request New Deliberation</button>
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
        <div class="forecasts-grid">
          ${open.map(f => `
            <div class="forecast-card" onclick="openForecast('${f.id}')">
              <div class="forecast-prob">${(f.probability * 100).toFixed(0)}</div>
              <div class="forecast-question">${f.question}</div>
              <div class="forecast-criteria">${f.resolution_criteria || 'Criteria pending'}</div>
              <div class="forecast-meta">
                <span class="forecast-status open">OPEN</span>
                <span class="forecast-resolve-date">Resolves ${formatDate(f.resolution_date)}</span>
              </div>
              <div class="forecast-updated">Updated ${formatTimeAgo(f.updated_at || MIND?.stats?.last_updated)}</div>
            </div>
          `).join('')}
        </div>
      ` : '<div class="empty-state">No open forecasts</div>'}
      
      ${resolved.length > 0 ? `
        <div class="section-header" style="margin-top: var(--space-xl);">RESOLVED</div>
        <div class="forecasts-grid">
          ${resolved.slice(0, 6).map(f => `
            <div class="forecast-card" onclick="openForecast('${f.id}')">
              <div class="forecast-prob" style="color: ${f.outcome ? 'var(--accent-green)' : 'var(--accent-red)'};">
                ${f.outcome ? '✓' : '✗'}
              </div>
              <div class="forecast-question">${f.question}</div>
              <div class="forecast-meta">
                <span class="forecast-status resolved">${f.outcome ? 'CORRECT' : 'INCORRECT'}</span>
                <span class="forecast-resolve-date">Brier: ${f.brier_score?.toFixed(3) || 'N/A'}</span>
              </div>
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
