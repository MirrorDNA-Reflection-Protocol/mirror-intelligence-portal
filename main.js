import './index.css';

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let MIND = null;
let EVENT_SOURCE = null;

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

async function init() {
  console.log("⟡ Living Mind initializing...");

  // 1. Initial Data Load
  await loadMind();

  // 2. Connect Live Stream
  connectLiveStream();

  // 3. Render Loop (for smoother updates if needed)
  setInterval(() => {
    // Optional: Update relative times
  }, 60000);
}

async function loadMind() {
  // Try API first, fallback to static
  const sources = ['http://localhost:8083/api/briefing', '/data.json'];

  for (const src of sources) {
    try {
      const resp = await fetch(src);
      if (resp.ok) {
        const data = await resp.json();
        if (data.mind) { // Verify it's the new schema
          MIND = data.mind;
          render();
          return;
        }
      }
    } catch (e) {
      console.warn(`Failed to load from ${src}`, e);
    }
  }
}

function connectLiveStream() {
  try {
    EVENT_SOURCE = new EventSource('http://localhost:8083/api/live');

    EVENT_SOURCE.onopen = () => {
      document.body.classList.add('live-active');
      const indicator = document.createElement('div');
      indicator.className = 'live-indicator';
      indicator.title = 'Living Mind: Connected';
      document.body.appendChild(indicator);
    };

    EVENT_SOURCE.onmessage = (e) => {
      const event = JSON.parse(e.data);
      if (event.type === 'publish') {
        // Refresh full state on publish
        loadMind();
      } else if (event.type === 'delta') {
        // Could show a toast or flash the ticker
        console.log("⟡ Delta:", event.message);
      }
    };

    EVENT_SOURCE.onerror = () => {
      document.body.classList.remove('live-active');
      const ind = document.querySelector('.live-indicator');
      if (ind) ind.remove();
      EVENT_SOURCE.close();
      // Retry in 10s
      setTimeout(connectLiveStream, 10000);
    };
  } catch (e) {
    console.warn("SSE not supported or failed");
  }
}

// ═══════════════════════════════════════════════════════════════
// RENDERING
// ═══════════════════════════════════════════════════════════════

function render() {
  if (!MIND) return;

  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderRealityDelta(MIND.deltas)}
    ${renderHeader(MIND.update)}
    ${renderMentalModel(MIND.update)}
    ${renderSectionHeader("Living Beliefs")}
    ${renderBeliefs(MIND.beliefs)}
    ${renderSectionHeader("Systemic Risks")}
    ${renderRisks(MIND.risks)}
    ${renderFooter()}
  `;
}

function renderRealityDelta(deltas) {
  if (!deltas || deltas.length === 0) return '';

  const items = deltas.map(d => `
    <span class="delta-item ${d.sentiment}">
      <span class="delta-icon">${d.magnitude > 0 ? '▲' : '▼'}</span>
      <span class="delta-text">${d.text}</span>
      ${d.magnitude ? `<span class="delta-mag">${d.magnitude > 0 ? '+' : ''}${d.magnitude}%</span>` : ''}
    </span>
  `).join('');

  return `
    <div class="reality-delta">
      <div class="delta-ticker">
        ${items} ${items} <!-- Duplicate for infinite scroll illusion -->
      </div>
    </div>
  `;
}

function renderHeader(update) {
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  return `
    <div style="padding: 2rem 1.5rem 0; text-align: center;">
      <div style="font-family: var(--font-sans); font-size: 0.75rem; color: var(--text-muted); letter-spacing: 0.1em; margin-bottom: 0.5rem;">
        MIRROR INTELLIGENCE // LIVING MIND
      </div>
      <div style="font-family: var(--font-serif); font-size: 1.5rem;">
        ${date}
      </div>
    </div>
  `;
}

function renderMentalModel(update) {
  return `
    <div class="mental-model">
      <div class="model-header">Executive Model Update</div>
      <div class="model-point"><strong>This Matters:</strong> ${update.matters}</div>
      <div class="model-point"><strong>Confidence Shift:</strong> ${update.confidence}</div>
      <div class="model-point"><strong>Unresolved:</strong> ${update.unresolved}</div>
    </div>
  `;
}

function renderSectionHeader(title) {
  return `
    <div style="padding: 2rem 1.5rem 0.5rem; font-family: var(--font-sans); font-size: 0.75rem; color: var(--text-muted); letter-spacing: 0.1em; border-bottom: 1px solid var(--border-subtle); margin: 0 1.5rem;">
      ${title.toUpperCase()}
    </div>
  `;
}

function renderBeliefs(beliefs) {
  if (!beliefs) return '';
  return `
    <div class="living-beliefs">
      ${beliefs.map(b => `
        <div class="belief-card">
          <div class="belief-status">
            <span class="status-tag ${b.status}">${b.status}</span>
            <span>Ref: ${b.last_challenged}</span>
          </div>
          <div class="belief-statement">${b.statement}</div>
          <div class="belief-meta">
            <div>
              <div style="font-size: 0.7rem; text-transform: uppercase;">Confidence</div>
              <div style="font-size: 1.1rem; color: var(--text-ink);">${b.confidence}%</div>
            </div>
            <div>
              <div style="font-size: 0.7rem; text-transform: uppercase;">History</div>
              <!-- Simple SVG Sparkline placeholder -->
              <svg class="sparkline" viewBox="0 0 100 30">
                <path d="M0,15 Q50,5 100,20" fill="none" stroke="currentColor" stroke-width="2" />
              </svg>
            </div>
            <div style="flex: 1; text-align: right;">
               <div style="font-size: 0.7rem; text-transform: uppercase;">Evidence</div>
               <div style="font-size: 0.85rem; max-width: 300px; margin-left: auto;">${b.evidence_for}</div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderRisks(risks) {
  if (!risks) return '';
  return `
    <div class="blindspots">
      ${risks.map(r => `
        <div class="risk-item">
          <div class="risk-severity ${r.severity}"></div>
          <div>
            <div style="font-weight: 500;">${r.text}</div>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">
              <strong>Compounding factor:</strong> ${r.compounding_factor}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderFooter() {
  return `
    <div style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.75rem;">
      Mirror Intelligence // Cognitive Primitive v2.0
      <br>Synced with Reality
    </div>
  `;
}

init();
