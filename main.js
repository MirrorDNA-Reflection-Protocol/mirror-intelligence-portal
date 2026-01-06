/* ═══════════════════════════════════════════════════════════════
   Mirror Intelligence — Temporal Instrument v5.0
   
   "A daily ritual for decision-makers."
   
   Core Philosophy:
   - Time as first-class citizen
   - Predictions as living artifacts
   - The consortium as a council of voices
   - Sunday is sacred
   ═══════════════════════════════════════════════════════════════ */

import './style.css'

// ═══════════════════════════════════════════════════════════════
// DATA LOADING
// ═══════════════════════════════════════════════════════════════

let BRIEFINGS = {};
let PREDICTIONS = [];
let DATA_LOADED = false;

async function loadData() {
  try {
    const resp = await fetch('/data.json');
    if (resp.ok) {
      const data = await resp.json();
      console.log('⟡ Loaded dynamic data:', data);

      // Transform incoming single day briefing into the schedule format
      // Note: In a real system, we'd fetch the full schedule.
      // Here we map the dynamic brief to the CURRENT topic/day.

      const day = new Date().getDay();

      BRIEFINGS[day] = {
        date: data.meta.date,
        sources: data.briefing.stats.sources,
        models: data.briefing.stats.models,
        headline: data.briefing.headline,
        subline: data.briefing.subline,
        summary: data.briefing.summary,
        sections: data.briefing.sections
      };

      PREDICTIONS = data.predictions;
      DATA_LOADED = true;
      render();
    }
  } catch (e) {
    console.error('Failed to load dynamic data, using static snapshot:', e);
  }
}

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let currentPage = 'home';
let currentTopic = new Date().getDay();
let realityUpdatedAt = new Date();
let userState = {
  lastVisit: null,
  visitCount: 0,
  streak: 0
};

// Initialize User Memory
try {
  const stored = localStorage.getItem('mirror_user_state');
  if (stored) {
    userState = JSON.parse(stored);

    // Check for streak (visit within 24-48h of last)
    const now = new Date();
    const last = new Date(userState.lastVisit);
    const diffHours = (now - last) / (1000 * 60 * 60);

    if (diffHours > 24 && diffHours < 48) {
      userState.streak++;
    } else if (diffHours > 48) {
      userState.streak = 1; // Reset streak if missed a day
    }
    // If < 24h, streak remains same (don't increment for multiple visits same day)
  } else {
    userState.streak = 1;
    userState.visitCount = 1;
  }

  // Update visit time immediate
  userState.lastVisit = new Date().toISOString();
  userState.visitCount++;
  localStorage.setItem('mirror_user_state', JSON.stringify(userState));

} catch (e) {
  console.warn('User memory disabled (privacy/error)', e);
}

// Topic schedule — each day has meaning
const TOPICS = {
  0: { name: 'Weekly Review', icon: '◈', color: 'gold', mood: 'grave' },
  1: { name: 'AI & Compute', icon: '⬡', color: 'cyan' },
  2: { name: 'Markets & Capital', icon: '◇', color: 'green' },
  3: { name: 'Power & Geopolitics', icon: '⬢', color: 'rose' },
  4: { name: 'Science & Health', icon: '○', color: 'cyan' },
  5: { name: 'Strategy & Business', icon: '△', color: 'amber' },
  6: { name: 'Deep Dive', icon: '⟡', color: 'gold' }
};

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

// Map legacy static data structure to BRIEFINGS until data loads
BRIEFINGS = {
  1: {
    date: 'January 6, 2026',
    updated: new Date(),
    sources: 8,
    models: 4,
    headline: 'The Industry Pivots from Spectacle to Substance',
    subline: 'CES 2026 is quiet. That is the point.',
    summary: 'The era of "AI Magic" marketing is over. As compute costs stabilize and consumer fatigue sets in, the major players (Apple, Google, OpenAI) are shifting focus to "invisible intelligence"—deep integration, battery efficiency, and institutional reliability. The noise has collapsed; the signal is operational depth.',
    sections: {
      changed: [
        { text: "OpenAI announces 'Sovereign-Lite' tiers for enterprise (local weights).", detail: "A direct response to Llama 4's dominance.", source: { n: 1, name: "The Information" }, voice: "gpt" },
        { text: "NVIDIA Blackwell yield issues resolved; stock up 4% pre-market.", detail: "Supply chain normalization faster than consensus.", source: { n: 2, name: "Bloomberg" }, voice: "deepseek" },
        { text: "EU AI Act 'Phase 2' enforcement begins today.", detail: "General purpose models now require watermark compliance.", source: { n: 3, name: "FT" }, voice: "mistral", severity: "risk" }
      ],
      matters: [
        { text: "The pivot to 'Local Weights' validates the MirrorDNA thesis.", voice: "gpt" },
        { text: "Regulatory drag in EU is widening the 'Compute Gap' compared to US/China.", voice: "mistral" }
      ],
      risks: [
        { text: "Deepfake volume up 400% in Q4; verifying identity is now a critical path.", severity: "high", voice: "mistral" }
      ],
      actions: [
        { text: "Monitor: OpenAI 'Sovereign' pricing vs. Llama 4 inference costs.", priority: "high" }
      ],
      ignore: [
        { text: "Samsung's 'AI Fridge' announcements (CES vaporware).", voice: "groq" }
      ]
    }
  }
};

// The Council — each voice has character
const COUNCIL = {
  gpt: {
    name: 'GPT-4o',
    symbol: '◉',
    role: 'Narrative Analyst',
    bias: 'Finds the story beneath the data. Sees patterns in communication.',
    color: 'cyan'
  },
  deepseek: {
    name: 'DeepSeek R1',
    symbol: '◈',
    role: 'Facts & Metrics',
    bias: 'Extracts concrete numbers. Distrusts vague claims.',
    color: 'green'
  },
  groq: {
    name: 'Llama 3.3',
    symbol: '△',
    role: 'Signal Filter',
    bias: 'Separates hype from durable change. Thinks in 6-month windows.',
    color: 'amber'
  },
  mistral: {
    name: 'Mistral',
    symbol: '◇',
    role: 'Contrarian Voice',
    bias: 'Finds what everyone is missing. Comfortable with dissent.',
    color: 'rose'
  },
  swarm: {
    name: 'THE SWARM',
    symbol: '⚡',
    role: 'Distribution',
    bias: 'Fractures coherence into viral artifacts. Pure kinetic energy.',
    color: 'violet'
  }
};

// ═══════════════════════════════════════════════════════════════
// BRIEFING DATA — The Intelligence
// ═══════════════════════════════════════════════════════════════

// Generate empty briefings for other days
[0, 2, 3, 4, 5, 6].forEach(day => {
  BRIEFINGS[day] = {
    date: '',
    updated: null,
    sources: 0,
    models: 0,
    headline: `${TOPICS[day].name} Brief`,
    subline: `Scheduled for ${DAYS[day]}`,
    summary: '',
    sections: { changed: [], matters: [], ignore: [], risks: [], actions: [], dissent: null }
  };
});


// Resolved predictions — The Trust Ledger
const RESOLVED_PREDICTIONS = [
  {
    id: 'r-001',
    text: 'Google releases Gemini 2.0 before end of 2025',
    status: 'correct',
    date: 'Dec 12, 2025',
    outcome: 'Gemini 2.0 Flash released Dec 11. Prediction validated.'
  },
  {
    id: 'r-002',
    text: 'Bitcoin breaks $100k by Q4 2025',
    status: 'correct',
    date: 'Nov 28, 2025',
    outcome: 'BTC touched $100,000 on Nov 22.'
  },
  {
    id: 'r-003',
    text: 'Apple announces dedicated search engine in 2025',
    status: 'miss',
    date: 'Dec 31, 2025',
    outcome: 'No announcement made. Apple Intelligence focused on summarization, not indexing.'
  },
  {
    id: 'r-004',
    text: 'Fed cuts rates 50bps in December 2025',
    status: 'mixed',
    date: 'Dec 18, 2025',
    outcome: 'Fed cut 25bps. Direction correct, magnitude wrong.'
  }
];

PREDICTIONS = [
  {
    id: 'p-001',
    text: 'OpenAI IPO will value company at $200B+ within Q2 2026',
    state: 'strengthening',
    timeframe: '6 months',
    created: '2026-01-06',
    // Probabilistic rigor
    probability: {
      base_rate: 15,        // Historical base rate for tech IPO at this scale
      updated: 68,          // Updated probability after evidence
      range: [55, 78],      // Confidence interval
      decay: 'Q2 2026'      // Time horizon
    },
    // Model-by-model reasoning
    reasoning: {
      gpt: {
        position: 'supports',
        argument: 'Narrative momentum is strong. IPO preparation signals are concrete.',
        would_change: 'Significant market downturn or major safety incident'
      },
      deepseek: {
        position: 'supports',
        argument: '$3T combined valuation signals. Preparation costs already incurred.',
        would_change: 'Revenue growth deceleration below 50% YoY'
      },
      groq: {
        position: 'neutral',
        argument: 'Timing uncertain. Q2 aggressive given regulatory scrutiny.',
        would_change: 'Clear regulatory clearance signal'
      },
      mistral: {
        position: 'skeptical',
        argument: 'Valuation multiples historically unsustainable. Bubble concern valid.',
        would_change: 'Demonstrated profitability path'
      }
    },
    // Evidence stack
    evidence: [
      { type: 'primary', text: 'WSJ: OpenAI board approved IPO exploration Dec 2025' },
      { type: 'quant', text: 'Last private round: $150B valuation, 33% premium expected' },
      { type: 'analog', text: 'Comparable: Google IPO 2004 at 27x revenue' }
    ]
  },
  {
    id: 'p-002',
    text: 'Open-weight models capture 30%+ of enterprise AI deployments by end of 2026',
    state: 'neutral',
    timeframe: '12 months',
    created: '2026-01-06',
    probability: {
      base_rate: 12,
      updated: 42,
      range: [30, 55],
      decay: 'Dec 2026'
    },
    reasoning: {
      gpt: {
        position: 'supports',
        argument: 'DeepSeek R1 performance parity. Privacy/cost advantages compound.',
        would_change: 'Major security vulnerability in open models'
      },
      deepseek: {
        position: 'supports',
        argument: 'Enterprise adoption accelerating. TCO 60% lower than API.',
        would_change: 'OpenAI dramatic price cuts'
      },
      groq: {
        position: 'neutral',
        argument: 'Enterprise moves slowly. 30% aggressive for 12 months.',
        would_change: 'Major Fortune 500 case studies'
      },
      mistral: {
        position: 'supports',
        argument: 'Regulatory push for data sovereignty favors local deployment.',
        would_change: 'EU privacy exemption for cloud AI'
      }
    },
    evidence: [
      { type: 'primary', text: 'MIT TR: R1 benchmarks within 5% of GPT-4o' },
      { type: 'quant', text: 'HuggingFace: 340% increase in enterprise model downloads' },
      { type: 'analog', text: 'Linux enterprise adoption curve: 8% → 35% in 3 years' }
    ]
  },
  {
    id: 'p-003',
    text: 'Major AI company faces significant regulatory action in US or EU',
    state: 'neutral',
    timeframe: '12 months',
    created: '2026-01-06',
    probability: {
      base_rate: 25,
      updated: 58,
      range: [45, 70],
      decay: 'Dec 2026'
    },
    reasoning: {
      gpt: {
        position: 'supports',
        argument: 'EU AI Act enforcement begins Q2. First actions likely by Q3.',
        would_change: 'Enforcement budget cuts or delays'
      },
      deepseek: {
        position: 'neutral',
        argument: 'Fines likely but "significant" threshold unclear.',
        would_change: 'Clear definition of significant (>$1B fine)'
      },
      groq: {
        position: 'supports',
        argument: 'Bipartisan regulatory pressure in US. DOJ already investigating.',
        would_change: 'Administration change in priorities'
      },
      mistral: {
        position: 'supports',
        argument: 'Copyright lawsuits create regulatory leverage. Settlement pressure high.',
        would_change: 'Broad licensing deals with content owners'
      }
    },
    evidence: [
      { type: 'primary', text: 'EU AI Act: Feb 2026 enforcement deadline' },
      { type: 'quant', text: 'Current open investigations: 7 (EU), 3 (US DOJ)' },
      { type: 'analog', text: 'GDPR first major action: 18 months after enforcement' }
    ]
  }
];


const SOURCES = [
  { n: 1, title: "What's next for AI in 2026", domain: 'technologyreview.com', tier: 1 },
  { n: 2, title: 'AI moves from hype to pragmatism', domain: 'techcrunch.com', tier: 1 },
  { n: 3, title: '7 AI trends to watch', domain: 'microsoft.com', tier: 2 },
  { n: 4, title: '2026: Year of the Mega IPO', domain: 'economictimes.com', tier: 1 },
  { n: 5, title: 'Tech IPO or Bubble Burst?', domain: 'gizmodo.com', tier: 2 },
  { n: 7, title: 'Technology Trends 2026', domain: 'techtimes.com', tier: 2 },
  { n: 8, title: '5 AI fights to watch', domain: 'thehill.com', tier: 1 }
];

// ═══════════════════════════════════════════════════════════════
// TIME UTILITIES — First-Class Citizen
// ═══════════════════════════════════════════════════════════════

function formatRealityAge() {
  const now = new Date();
  const diff = now - realityUpdatedAt;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatDate(date = new Date()) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function startRealityClock() {
  setInterval(() => {
    const el = document.getElementById('reality-age');
    if (el) el.textContent = `Reality updated ${formatRealityAge()}`;
  }, 30000);
}

// ═══════════════════════════════════════════════════════════════
// RENDER — The Instrument
// ═══════════════════════════════════════════════════════════════

function renderHeader() {
  return `
    <header>
      <div class="header-content">
        <a href="#" class="logo" onclick="navigateTo('home'); return false;">
          <div class="logo-mark"><img src="/logo.png" alt="" /></div>
          <span class="logo-text">Mirror <span>Intelligence</span></span>
        </a>
        
        <div class="reality-status">
          <span class="reality-pulse"></span>
          <span id="reality-age">Reality updated ${formatRealityAge()}</span>
          ${userState.streak > 1 ? `<span class="streak-badge" title="${userState.streak} day streak">• ${userState.streak}d streak</span>` : ''}
        </div>
        
        <nav>
          <a href="#" onclick="navigateTo('home'); return false;" class="${currentPage === 'home' ? 'active' : ''}">Today</a>
          <a href="#" onclick="navigateTo('predictions'); return false;" class="${currentPage === 'predictions' ? 'active' : ''}">Predictions</a>
          <a href="#" onclick="navigateTo('live'); return false;" class="${currentPage === 'live' ? 'active' : ''}"><span class="pulse-dot">●</span> Live</a>
          <a href="#" onclick="navigateTo('archive'); return false;" class="${currentPage === 'archive' ? 'active' : ''}">Archive</a>
          <a href="#" onclick="navigateTo('about'); return false;" class="${currentPage === 'about' ? 'active' : ''}">Method</a>
        </nav>
      </div>
    </header>
  `;
}

function renderHero() {
  const b = BRIEFINGS[currentTopic];
  const t = TOPICS[currentTopic];
  const isEmpty = b.sources === 0;

  return `
    <section class="hero">
      <div class="hero-date ghost-text">${formatDate()}</div>
      <h1>${b.headline}</h1>
      <p class="hero-subline">${b.subline}</p>
      ${!isEmpty ? `
        <div class="hero-metrics">
          <div class="metric">
            <span class="metric-value">${b.sources}</span>
            <span class="metric-label">Sources</span>
          </div>
          <div class="metric">
            <span class="metric-value">${b.models}</span>
            <span class="metric-label">Models</span>
          </div>
          <div class="metric">
            <span class="metric-value">${PREDICTIONS.length}</span>
            <span class="metric-label">Active Predictions</span>
          </div>
        </div>
      ` : ''}
    </section>
  `;
}

function renderTopicNav() {
  const today = new Date().getDay();

  return `
    <div class="topic-nav">
      ${[1, 2, 3, 4, 5, 6, 0].map(day => {
    const t = TOPICS[day];
    const isActive = day === currentTopic;
    const isFuture = day > today && day !== 0;
    const hasData = BRIEFINGS[day].sources > 0;

    return `
          <div class="topic-day ${isActive ? 'active' : ''} ${isFuture ? 'future' : ''}"
               onclick="selectTopic(${day})">
            <span class="day-abbr">${DAYS[day]}</span>
            <span class="day-icon">${t.icon}</span>
            <span class="day-topic">${t.name}</span>
          </div>
        `;
  }).join('')}
    </div>
  `;
}

function renderVoiceBadge(voiceKey) {
  const v = COUNCIL[voiceKey];
  if (!v) return '';
  return `<span class="expert-badge"><span style="color: var(--signal-${v.color})">${v.symbol}</span> ${v.name}</span>`;
}

function renderSection(title, icon, items, type = '') {
  if (!items || items.length === 0) return '';

  return `
    <div class="briefing-section">
      <div class="section-header">
        <span class="section-icon">${icon}</span>
        <span class="section-title">${title}</span>
        <span class="section-count">${items.length}</span>
      </div>
      <div class="section-content">
        <ul>
          ${items.map(item => `
            <li class="${type} ${item.severity ? `risk-${item.severity}` : ''}">
              <div class="item-text">
                ${item.text}
                ${item.source ? `<a href="#" class="citation">[${item.source.n}]</a>` : ''}
              </div>
              ${item.detail ? `<div class="item-detail">${item.detail}</div>` : ''}
              <div class="item-meta">
                ${item.voice ? renderVoiceBadge(item.voice) : ''}
                ${item.priority ? `<span class="confidence ${item.priority}">${item.priority}</span>` : ''}
              </div>
            </li>
          `).join('')}
        </ul>
      </div>
    </div>
  `;
}

function renderBriefing() {
  const b = BRIEFINGS[currentTopic];
  const t = TOPICS[currentTopic];

  if (b.sources === 0) {
    return `
      <div class="briefing">
        <div class="briefing-card" style="text-align: center; padding: 4rem 2rem;">
          <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;">${t.icon}</div>
          <h2 style="margin-bottom: 0.5rem;">${t.name}</h2>
          <p class="ghost-text">Briefing scheduled for ${DAYS[currentTopic]}</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="briefing">
      <div class="briefing-card">
        <div class="briefing-header">
          <div class="briefing-title-group">
            <h2><span class="icon">${t.icon}</span> ${t.name}</h2>
            <div class="briefing-meta mono">${b.date} · ${b.sources} sources · ${b.models} models</div>
          </div>
        </div>
        
        <div class="executive-summary">
          <h3>Executive Summary</h3>
          <p>${b.summary}</p>
        </div>
        
        ${renderSection('What Changed', '◉', b.sections.changed)}
        ${renderSection('Why It Matters', '◈', b.sections.matters)}
        ${renderSection('Safe to Ignore', '○', b.sections.ignore, 'dim')}
        ${renderSection('Risks Detected', '△', b.sections.risks, 'risk')}
        ${renderSection('Recommended Actions', '→', b.sections.actions, 'action')}
        
        ${b.sections.dissent ? `
          <div class="briefing-section" style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--border-subtle);">
            <div class="section-header">
              <span class="section-icon">◇</span>
              <span class="section-title" style="color: var(--signal-rose);">Dissenting View</span>
            </div>
            <p style="color: var(--text-secondary); font-style: italic; margin-bottom: 1rem;">
              "${b.sections.dissent.text}"
            </p>
            <div class="item-meta">
              ${renderVoiceBadge(b.sections.dissent.voice)}
              ${b.sections.dissent.source ? `<a href="#" class="citation">[${b.sections.dissent.source.n}] ${b.sections.dissent.source.name}</a>` : ''}
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function renderCouncil() {
  return `
    <div class="panel-section">
      <div class="panel-header">
        <span class="panel-title">The Council</span>
      </div>
      <div class="council-grid">
        ${Object.entries(COUNCIL).map(([key, v]) => `
          <div class="council-voice">
            <div class="voice-symbol" style="color: var(--signal-${v.color})">${v.symbol}</div>
            <div class="voice-info">
              <div class="voice-name">${v.name}</div>
              <div class="voice-role">${v.role}</div>
              <div class="voice-bias">${v.bias}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}


window.toggleAnalysis = function (id) {
  const el = document.getElementById(`analysis-${id}`);
  const btn = document.getElementById(`btn-${id}`);
  if (el.classList.contains('hidden')) {
    el.classList.remove('hidden');
    btn.textContent = 'Collapse Analysis';
    btn.classList.add('active');
  } else {
    el.classList.add('hidden');
    btn.textContent = 'Expand Analysis';
    btn.classList.remove('active');
  }
};

function renderProbability(prob) {
  if (!prob) return '';
  const rangeWidth = prob.range[1] - prob.range[0];
  const rangeLeft = prob.range[0];

  return `
    <div class="probability-spine">
      <div class="prob-label">Probability Spine</div>
      <div class="prob-bar-container">
        <div class="prob-range" style="left: ${rangeLeft}%; width: ${rangeWidth}%;"></div>
        <div class="prob-marker" style="left: ${prob.updated}%;"></div>
        <div class="prob-base" style="left: ${prob.base_rate}%;" title="Base Rate: ${prob.base_rate}%"></div>
      </div>
      <div class="prob-meta">
        <span>Base Rate: ${prob.base_rate}%</span>
        <span class="prob-updated">Updated: ${prob.updated}%</span>
        <span>Confidence: ${prob.range[0]}%–${prob.range[1]}%</span>
      </div>
    </div>
  `;
}

function renderReasoning(reasoning) {
  if (!reasoning) return '';
  return `
    <div class="council-reasoning-grid">
      ${Object.entries(reasoning).map(([key, r]) => {
    const v = COUNCIL[key];
    return `
          <div class="reasoning-item ${r.position}">
            <div class="reasoning-header">
              <span class="voice-symbol" style="color: var(--signal-${v.color})">${v.symbol}</span>
              <span class="reasoning-role">${v.name}</span>
              <span class="reasoning-pos">${r.position}</span>
            </div>
            <div class="reasoning-arg">"${r.argument}"</div>
            <div class="reasoning-change">
              <span class="label">Would Change View:</span> ${r.would_change}
            </div>
          </div>
        `;
  }).join('')}
    </div>
  `;
}

function renderEvidence(evidence) {
  if (!evidence) return '';
  return `
    <div class="evidence-stack">
      <div class="evidence-header">Evidence Stack</div>
      ${evidence.map(e => `
        <div class="evidence-item ${e.type}">
          <span class="evidence-type mono">${e.type.toUpperCase()}</span>
          <span class="evidence-text">${e.text}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function renderPredictions() {
  return `
    <div class="panel-section">
      <div class="panel-header">
        <span class="panel-title">Living Predictions</span>
        <span class="ghost-text">${PREDICTIONS.length} active</span>
      </div>
      ${PREDICTIONS.map(p => `
        <div class="prediction-container">
          <div class="prediction-item ${p.state}">
            <div class="prediction-main">
              <div class="prediction-text">${p.text}</div>
              <div class="prediction-meta-row">
                <span class="timeframe mono">⏱ ${p.timeframe}</span>
                <span class="confidence-text">${p.probability ? p.probability.updated + '%' : p.confidence}</span>
                <button id="btn-${p.id}" class="btn-expand" onclick="toggleAnalysis('${p.id}')">Expand Analysis</button>
              </div>
            </div>
          </div>
          <div id="analysis-${p.id}" class="prediction-analysis hidden">
             <div class="analysis-content">
               ${renderProbability(p.probability)}
               <div class="analysis-grid">
                 ${renderReasoning(p.reasoning)}
                 ${renderEvidence(p.evidence)}
               </div>
             </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}


function renderSources() {
  return `
    <div class="panel-section">
      <div class="panel-header">
        <span class="panel-title">Sources</span>
        <span class="ghost-text">${SOURCES.length} cited</span>
      </div>
      ${SOURCES.map(s => `
        <div class="source-item">
          <span class="source-num mono">[${s.n}]</span>
          <span class="source-tier tier-${s.tier}">T${s.tier}</span>
          <a href="#" class="source-title">${s.title}</a>
          <span class="source-domain mono">${s.domain}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function renderFooter() {
  return `
    <footer>
      <div class="footer-subscribe">
        <h3>Daily Intelligence</h3>
        <p class="ghost-text">No noise. Just signal.</p>
        <form class="subscribe-form" onsubmit="handleSubscribe(event)">
          <input type="email" id="email-input" placeholder="your@email.com" required />
          <button type="submit" class="btn-subscribe">Subscribe</button>
        </form>
        <div id="subscribe-status"></div>
      </div>
      <div class="footer-links">
        <a href="#" onclick="navigateTo('about'); return false;">Methodology</a>
        <a href="#" onclick="navigateTo('terms'); return false;">Terms</a>
        <a href="/feed.xml" target="_blank">RSS</a>
        <a href="https://activemirror.ai" target="_blank">Active Mirror</a>
      </div>
      <p class="footer-credit">Generated by consortium: GPT-4o · DeepSeek R1 · Llama 3.3 · Mistral</p>
      <p class="footer-disclaimer">For orientation, not investment. The future is not guaranteed.</p>
    </footer>
  `;
}

function renderAboutPage() {
  return `
    <div style="max-width: 800px; margin: 0 auto; padding: 4rem 2rem;">
      <div class="method-header" style="margin-bottom: 4rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 2rem;">
        <span class="ghost-text mono">PROTOCOL v3.0</span>
        <h1 style="font-size: 3rem; margin-top: 1rem; margin-bottom: 1rem;">The Constitution of Mirror Intelligence</h1>
        <p style="font-size: 1.25rem; color: var(--text-secondary); line-height: 1.6;">
          An operating manual for an institutional-grade machine intelligence system designed to outperform expert human analysis through structure, rigorous cross-examination, and radical transparency.
        </p>
      </div>

      <div class="method-section" style="margin-bottom: 4rem;">
        <h2 style="margin-bottom: 1.5rem;">I. The Analytical Mandate</h2>
        <p>Mirror Intelligence is not a news aggregator. It is a filter for inevitability.</p>
        <p>Expert human analysts rely on mental models, primary sources, and peer debate. However, they suffer from cognitive fatigue, recency bias, and social pressure to conform. Mirror Intelligence eliminates these frailties by deploying a <strong>Multi-AI Council</strong> that never tires, has no social career risk, and is forced to disagree.</p>
      </div>

      <div class="method-section" style="margin-bottom: 4rem;">
        <h2 style="margin-bottom: 1.5rem;">II. The Council Protocol</h2>
        <p>For every major prediction, we execute a four-stage adversarial process:</p>
        <div class="process-list" style="margin-top: 1.5rem;">
          <div class="process-step">
            <span class="step-num mono">01</span>
            <div class="step-content">
              <strong>Independent Analysis</strong>
              <p>Four distinct models (GPT-4o, DeepSeek R1, Llama 3.3, Mistral) analyze the raw signal without seeing each other's work to prevent groupthink.</p>
            </div>
          </div>
          <div class="process-step">
             <span class="step-num mono">02</span>
             <div class="step-content">
               <strong>Disagreement Extraction</strong>
               <p>We specifically isolate where models diverge. Consensus is easy; divergence is where alpha exists.</p>
             </div>
          </div>
          <div class="process-step">
             <span class="step-num mono">03</span>
             <div class="step-content">
               <strong>Forced Rebuttal</strong>
               <p>Models are shown the strongest counter-arguments from their peers and asked: "Does this change your confidence?"</p>
             </div>
          </div>
          <div class="process-step">
             <span class="step-num mono">04</span>
             <div class="step-content">
               <strong>Probabilistic Synthesis</strong>
               <p>The final output is not a binary "Yes/No" but a probability distribution with explicit confidence intervals.</p>
             </div>
          </div>
        </div>
      </div>

      <div class="method-section" style="margin-bottom: 4rem;">
        <h2 style="margin-bottom: 1.5rem;">III. Probabilistic Rigor</h2>
        <p>We reject vague terms like "likely" or "possible." All analysis must be anchored in:</p>
        <ul style="list-style: none; padding: 0; margin-top: 1.5rem; display: grid; gap: 1rem;">
          <li style="padding: 1rem; border: 1px solid var(--border-subtle); background: rgba(255,255,255,0.02);">
            <strong>Base Rates:</strong> The historical frequency of similar events (e.g., "Only 15% of tech IPOs trade up in year 1").
          </li>
          <li style="padding: 1rem; border: 1px solid var(--border-subtle); background: rgba(255,255,255,0.02);">
            <strong>Updated Probability:</strong> How new evidence shifts the base rate (Bayesian update).
          </li>
          <li style="padding: 1rem; border: 1px solid var(--border-subtle); background: rgba(255,255,255,0.02);">
            <strong>Falsification Criteria:</strong> Every prediction must state what evidence would prove it wrong.
          </li>
        </ul>
      </div>

      <div class="method-section" style="margin-bottom: 4rem;">
        <h2 style="margin-bottom: 1.5rem;">IV. The Accountability Ledger</h2>
        <p>Trust is earned through failure. We maintain a permanent, public archive of all predictions.</p>
        <p>When we are wrong (and we will be), the <strong>Miss Analysis</strong> protocol triggers:</p>
        <ol style="margin-top: 1rem; color: var(--text-secondary); padding-left: 1.5rem;">
          <li style="margin-bottom: 0.5rem;">Which model was most confident and wrong?</li>
          <li style="margin-bottom: 0.5rem;">Was it a failure of data (missing info) or reasoning (bad logic)?</li>
          <li style="margin-bottom: 0.5rem;">How do we calibrate the weights for next time?</li>
        </ol>
      </div>
      
      <div style="margin-top: 4rem; padding-top: 2rem; border-top: 1px solid var(--border-subtle); color: var(--text-tertiary); font-family: var(--font-mono); font-size: 0.8rem;">
        LAST RATIFIED: JANUARY 6, 2026<br>
        SYSTEM ARCHITECT: ACTIVE MIRROR
      </div>
    </div>
  `;
}


function renderArchivePage() {
  const correct = RESOLVED_PREDICTIONS.filter(p => p.status === 'correct').length;
  const miss = RESOLVED_PREDICTIONS.filter(p => p.status === 'miss').length;
  const mixed = RESOLVED_PREDICTIONS.filter(p => p.status === 'mixed').length;
  const accuracy = Math.round((correct / RESOLVED_PREDICTIONS.length) * 100);

  return `
    <div style="max-width: 800px; margin: 0 auto; padding: 4rem 2rem;">
      <h1 style="margin-bottom: 2rem;">The Trust Ledger</h1>
      <p class="ghost-text" style="margin-bottom: 3rem;">
        We do not bury our dead. Every prediction is tracked to resolution.
        <br>Trust is built on the public acknowledgment of error.
      </p>

      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 4rem;">
        <div class="panel-section" style="text-align: center; padding: 1.5rem;">
          <div style="font-size: 2rem; font-weight: 600; color: var(--text-primary);">${accuracy}%</div>
          <div class="ghost-text" style="font-size: 0.8rem;">Accuracy</div>
        </div>
        <div class="panel-section" style="text-align: center; padding: 1.5rem;">
          <div style="font-size: 2rem; font-weight: 600; color: var(--signal-green);">${correct}</div>
          <div class="ghost-text" style="font-size: 0.8rem;">Correct</div>
        </div>
        <div class="panel-section" style="text-align: center; padding: 1.5rem;">
          <div style="font-size: 2rem; font-weight: 600; color: var(--signal-rose);">${miss}</div>
          <div class="ghost-text" style="font-size: 0.8rem;">Misses</div>
        </div>
        <div class="panel-section" style="text-align: center; padding: 1.5rem;">
          <div style="font-size: 2rem; font-weight: 600; color: var(--signal-amber);">${mixed}</div>
          <div class="ghost-text" style="font-size: 0.8rem;">Mixed</div>
        </div>
      </div>

      <div class="archive-grid">
        ${RESOLVED_PREDICTIONS.map(r => `
          <div class="archive-item">
            <div class="archive-status status-${r.status}">${r.status}</div>
            <div class="archive-content">
              <div class="archive-text">${r.text}</div>
              <div class="ghost-text" style="font-size: 0.85rem; margin-top: 0.25rem;">${r.outcome}</div>
            </div>
            <div class="archive-date">${r.date}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderPredictionsPage() {
  return `
    <div style="max-width: 1000px; margin: 0 auto; padding: 4rem 2rem;">
      <h1 style="margin-bottom: 1rem;">Prediction Tracker</h1>
      <p class="ghost-text" style="margin-bottom: 3rem;">We make specific, falsifiable predictions and track their outcomes. Transparency builds trust.</p>
      
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; margin-bottom: 3rem;">
        <div class="panel-section" style="text-align: center;">
          <div style="font-size: 2.5rem; font-weight: 600; color: var(--text-primary);">${PREDICTIONS.length}</div>
          <div class="ghost-text">Active</div>
        </div>
        <div class="panel-section" style="text-align: center;">
          <div style="font-size: 2.5rem; font-weight: 600; color: var(--text-primary);">75%</div>
          <div class="ghost-text">Accuracy</div>
        </div>
        <div class="panel-section" style="text-align: center;">
          <div style="font-size: 2.5rem; font-weight: 600; color: var(--text-primary);">${RESOLVED_PREDICTIONS.length}</div>
          <div class="ghost-text"><a href="#" onclick="navigateTo('archive'); return false;" style="color: inherit; text-decoration: underline;">Resolved</a></div>
        </div>
      </div>
      
      <h2 style="margin-bottom: 1rem;">Active Predictions</h2>
      ${PREDICTIONS.map(p => `
        <div class="prediction-container">
          <div class="prediction-item ${p.state}" style="margin-bottom: 0;">
            <div class="prediction-main">
              <div class="prediction-text" style="font-size: 1.1rem;">${p.text}</div>
              <div class="prediction-meta-row">
                <span class="timeframe mono">⏱ ${p.timeframe}</span>
                <span class="confidence-text">${p.probability ? p.probability.updated + '%' : p.confidence}</span>
                <button id="page-btn-${p.id}" class="btn-expand" onclick="toggleAnalysisPage('${p.id}')">Expand Analysis</button>
              </div>
            </div>
          </div>
          <div id="page-analysis-${p.id}" class="prediction-analysis hidden">
             <div class="analysis-content">
               ${renderProbability(p.probability)}
               <div class="analysis-grid">
                 ${renderReasoning(p.reasoning)}
                 ${renderEvidence(p.evidence)}
               </div>
             </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// Helper for page-specific analysis toggle (avoids ID conflict if needed, though simpler is to reuse)
window.toggleAnalysisPage = function (id) {
  const el = document.getElementById(`page-analysis-${id}`);
  const btn = document.getElementById(`page-btn-${id}`);
  if (el.classList.contains('hidden')) {
    el.classList.remove('hidden');
    btn.textContent = 'Collapse Analysis';
    btn.classList.add('active');
  } else {
    el.classList.add('hidden');
    btn.textContent = 'Expand Analysis';
    btn.classList.remove('active');
  }
};


// ═══════════════════════════════════════════════════════════════
// MAIN RENDER
// ═══════════════════════════════════════════════════════════════

function render() {
  let content = '';

  if (currentPage === 'home') {
    content = `
      ${renderHero()}
      ${renderTopicNav()}
      <main>
        <div class="instrument-grid">
          ${renderBriefing()}
          <aside class="council-panel">
            ${renderPredictions()}
            ${renderCouncil()}
            ${renderSources()}
          </aside>
        </div>
      </main>
    `;
  } else if (currentPage === 'about') {
    content = `<main>${renderAboutPage()}</main>`;
  } else if (currentPage === 'predictions') {
    content = `<main>${renderPredictionsPage()}</main>`;
  } else if (currentPage === 'archive') {
    content = `<main>${renderArchivePage()}</main>`;
  } else if (currentPage === 'live') {
    content = `<main>${renderLivePage()}</main>`;
    setTimeout(initLiveTerminal, 100);
  } else if (currentPage === 'terms') {
    content = `<main style="max-width: 800px; margin: 0 auto; padding: 4rem 2rem;">
      <h1>Terms & Disclaimers</h1>
      <div class="executive-summary" style="margin-top: 2rem;">
        <p><strong>Not Investment Advice:</strong> This is intelligence, not recommendation. Consult professionals before acting.</p>
      </div>
      <div class="executive-summary" style="border-left-color: var(--signal-amber);">
        <p><strong>AI-Generated:</strong> All content is produced by AI models and may contain errors. We are transparent about predictions, including misses.</p>
      </div>
      <div class="executive-summary" style="border-left-color: var(--signal-rose);">
        <p><strong>Predictions Are Speculative:</strong> Past accuracy does not guarantee future performance. The future is not guaranteed.</p>
      </div>
    </main>`;
  }

  document.querySelector('#app').innerHTML = `
    <div class="void-layer"></div>
    <div class="void-grain"></div>
    <div class="void-pulse"></div>
    ${renderHeader()}
    ${content}
    ${renderFooter()}
  `;

  startRealityClock();
}

// ═══════════════════════════════════════════════════════════════
// NAVIGATION & HANDLERS
// ═══════════════════════════════════════════════════════════════

window.navigateTo = function (page) {
  currentPage = page;
  render();
  window.scrollTo(0, 0);
};

window.selectTopic = function (day) {
  currentTopic = day;
  currentPage = 'home';
  render();
};

window.handleSubscribe = function (e) {
  e.preventDefault();
  const email = document.getElementById('email-input').value;
  const status = document.getElementById('subscribe-status');

  const subs = JSON.parse(localStorage.getItem('subs') || '[]');
  if (!subs.includes(email)) {
    subs.push(email);
    localStorage.setItem('subs', JSON.stringify(subs));
    status.innerHTML = '<span style="color: var(--signal-green)">Subscribed. Intelligence arrives at 6 AM.</span>';
    document.getElementById('email-input').value = '';
  } else {
    status.innerHTML = '<span style="color: var(--signal-amber)">Already subscribed.</span>';
  }
};

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;

  const keys = {
    'h': () => navigateTo('home'),
    'p': () => navigateTo('predictions'),
    'a': () => navigateTo('archive'),
    'l': () => navigateTo('live'),
    's': () => {
      document.body.classList.toggle('sunlight-mode');
      const isSun = document.body.classList.contains('sunlight-mode');
      localStorage.setItem('mirror_theme', isSun ? 'sunlight' : 'dark');
      console.log('⟡ Mode switched:', isSun ? 'Sunlight' : 'Dark');
    },
    '?': () => alert('Shortcuts:\n\nH / T: Today\nP: Predictions\nA: Archive\nL: Live Nerve Center\nS: Sunlight Mode (High Contrast)'),
    '1': () => selectTopic(1),
    '2': () => selectTopic(2),
    '3': () => selectTopic(3),
    '4': () => selectTopic(4),
    '5': () => selectTopic(5),
    '6': () => selectTopic(6),
    '0': () => selectTopic(0),
  };

  if (keys[e.key]) keys[e.key]();
});

// ═══════════════════════════════════════════════════════════════
// LIVE NERVE CENTER
// ═══════════════════════════════════════════════════════════════

function renderLivePage() {
  return `
    <div class="live-nerve-center" style="height: calc(100vh - 80px); background: #000; color: #0f0; font-family: 'JetBrains Mono', monospace; padding: 2rem; overflow: hidden; position: relative;">
      <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at 50% 50%, rgba(0, 50, 0, 0.1) 0%, rgba(0,0,0,1) 90%); pointer-events: none;"></div>
      
      <div class="live-header" style="display: flex; justify-content: space-between; margin-bottom: 2rem; border-bottom: 1px solid #333; padding-bottom: 1rem;">
        <div>
          <span style="color: #fff;">MIRROR CONSORTIUM // NERVE CENTER</span>
          <br><span style="color: #666; font-size: 0.8rem;">ESTABLISHED CONNECTION: SECURE (TLS 1.3)</span>
        </div>
        <div style="text-align: right;">
          <span class="live-clock">${new Date().toISOString()}</span>
          <br><span style="color: var(--signal-green);">● SYSTEM ONLINE</span>
        </div>
      </div>

      <div class="live-grid" style="display: grid; grid-template-columns: ${window.innerWidth < 768 ? '1fr' : '250px 1fr 300px'}; gap: ${window.innerWidth < 768 ? '1rem' : '2rem'}; height: ${window.innerWidth < 768 ? 'auto' : 'calc(100% - 100px)'}; overflow-y: ${window.innerWidth < 768 ? 'auto' : 'visible'};">
        <!-- Column 1: Active Agents -->
        <div class="live-agents" style="${window.innerWidth < 768 ? 'display: flex; flex-wrap: wrap; gap: 0.5rem;' : ''}">
          <div style="color: #666; margin-bottom: 1rem;">ACTIVE NODES</div>
          ${Object.entries(COUNCIL).map(([k, v]) => `
            <div class="agent-node" id="agent-${k}" style="margin-bottom: 1rem; padding: 1rem; border: 1px solid #222; opacity: 0.7; transition: all 0.3s;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="color: var(--signal-${v.color});">${v.symbol}</span>
                <span style="font-weight: bold; color: #fff;">${v.name}</span>
              </div>
              <div class="agent-status" style="font-size: 0.7rem; color: #888; margin-top: 0.5rem;">IDLE</div>
              <div class="agent-activity" style="font-size: 0.7rem; color: var(--signal-${v.color}); height: 2px; width: 0%; background: currentColor; margin-top: 0.5rem; transition: width 0.2s;"></div>
            </div>
          `).join('')}
        </div>

        <!-- Column 2: The Stream -->
        <div class="live-stream-container" style="display: flex; flex-direction: column; overflow: hidden;">
          <div style="color: #666; margin-bottom: 1rem;">COGNITION_STREAM_V3</div>
          <div id="terminal-output" style="flex: 1; border: 1px solid #222; background: rgba(0,10,0,0.5); padding: 1rem; overflow-y: auto; font-size: 0.9rem; line-height: 1.4; scroll-behavior: smooth;">
            <!-- Terminal logs go here -->
          </div>
        </div>

        <!-- Column 3: The Stack -->
        <div class="live-stack">
          <div style="color: #666; margin-bottom: 1rem;">LATEST_INGESTION</div>
          <div id="ingest-stack" style="font-size: 0.8rem; color: #888;">
            <div style="border-left: 2px solid #333; padding-left: 1rem; margin-bottom: 1rem;">
              <div>Reading: RSS_FEED_TECHCRUNCH</div>
              <div>Parsing... OK</div>
            </div>
             <div style="border-left: 2px solid #333; padding-left: 1rem; margin-bottom: 1rem;">
              <div>NewsWeb: fetching 'DeepSeek R1'</div>
              <div>Status: 200 OK</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════
// LIVE TERMINAL LOGIC
// ═══════════════════════════════════════════════════════════════

function initLiveTerminal() {
  const terminal = document.getElementById('terminal-output');
  if (!terminal) return;

  const logs = [
    { agent: 'system', msg: 'Initializing Consortium Protocols...' },
    { agent: 'system', msg: 'Loading context from MirrorDNA Vault...' },
    { agent: 'gpt', msg: 'Scanning narrative layer: DETECTED shift in "OpenAI IPO" framing.' },
    { agent: 'deepseek', msg: 'Ingesting financial report: 10-K from NVIDIA. Verifying CAPEX figures.' },
    { agent: 'mistral', msg: 'Counter-point generated: The market is ignoring regulatory tail risks in EU.' },
    { agent: 'groq', msg: 'Filtering noise: Samsung CES announcement marked "irrelevant".' },
    { agent: 'system', msg: 'Synthesis complete. Formatting JSON...' },
    { agent: 'gpt', msg: 'Analyzing Twitter sentiment for "DeepSeek"... negative spike detected.' },
    { agent: 'deepseek', msg: 'Checking GitHub stars trend. Repo: deepseek-ai/DeepSeek-V3. Slope: +200/hour.' },
    { agent: 'groq', msg: 'Latency check: 120ms. Ingesting new batch.' },
    { agent: 'mistral', msg: 'Rebutting GPT consensus on "Apple Search". Evidence weak.' },
    { agent: 'swarm', msg: 'Fracturing briefing for X (Twitter). Thread count: 6 tweets.' },
    { agent: 'swarm', msg: 'Generating "Hook": "The industry is lying to you about Agentic AI..."' },
    { agent: 'swarm', msg: 'Formatting LinkedIn strategic frame. Tone: "Thought Leader".' },
    { agent: 'swarm', msg: 'Distribution complete. Social artifacts deposited.' }
  ];

  function addLine(log) {
    const line = document.createElement('div');
    line.style.marginBottom = '0.5rem';
    line.style.opacity = '0';
    line.style.animation = 'fadeIn 0.2s forwards';

    const ts = new Date().toISOString().split('T')[1].split('.')[0];

    let color = '#888';
    if (log.agent !== 'system' && COUNCIL[log.agent]) color = `var(--signal-${COUNCIL[log.agent].color})`;

    line.innerHTML = `<span style="color: #444;">[${ts}]</span> <span style="color: ${color}; font-weight: bold;">${log.agent.toUpperCase()}</span>: ${log.msg}`;

    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;

    // Animate agent nav
    if (log.agent !== 'system') {
      const node = document.getElementById(`agent-${log.agent}`);
      if (node) {
        node.style.borderColor = color;
        node.style.boxShadow = `0 0 10px ${color}33`;
        node.querySelector('.agent-status').textContent = 'PROCESSING';
        node.querySelector('.agent-activity').style.width = '100%';

        setTimeout(() => {
          node.style.borderColor = '#222';
          node.style.boxShadow = 'none';
          node.querySelector('.agent-status').textContent = 'IDLE';
          node.querySelector('.agent-activity').style.width = '0%';
        }, 800);
      }
    }
  }

  // Simulation Loop
  setInterval(() => {
    const rand = logs[Math.floor(Math.random() * logs.length)];
    addLine(rand);
  }, 1500);
}

// Load saved theme
if (localStorage.getItem('mirror_theme') === 'sunlight') {
  document.body.classList.add('sunlight-mode');
}

// Initialize
loadData(); // Try to load dynamic data
render();   // Render static immediately
