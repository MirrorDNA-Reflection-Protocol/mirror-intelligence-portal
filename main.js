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
// STATE
// ═══════════════════════════════════════════════════════════════

let currentPage = 'home';
let currentTopic = new Date().getDay();
let realityUpdatedAt = new Date();

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
  }
};

// ═══════════════════════════════════════════════════════════════
// BRIEFING DATA — The Intelligence
// ═══════════════════════════════════════════════════════════════

const BRIEFINGS = {
  1: {
    date: 'January 6, 2026',
    updated: new Date(),
    sources: 8,
    models: 4,
    headline: 'The Industry Pivots from Spectacle to Substance',
    subline: 'Mega IPOs approach. Open models democratize. The hype cycle ends.',
    summary: `The AI industry is undergoing a fundamental transformation. After years of scaling-first approaches, 2026 marks the pivot to real-world deployment. Three historic IPOs—SpaceX, OpenAI, Anthropic—are poised to reshape capital markets with combined valuations approaching $3 trillion. Meanwhile, open-weight models like DeepSeek R1 challenge the oligopoly, giving anyone access to frontier capabilities without gatekeepers.`,
    sections: {
      changed: [
        {
          text: 'Industry transitioning from demonstration to deployment — practical applications now outpace benchmark improvements',
          detail: 'TechCrunch reports 2026 as the year AI "sobers up." Targeted deployments replace scaling theater. Real revenue begins to matter.',
          source: { n: 2, name: 'TechCrunch' },
          voice: 'gpt'
        },
        {
          text: 'Mega IPO year confirmed — SpaceX, OpenAI, Anthropic preparing public debuts with combined $3T+ valuation potential',
          detail: 'Each company could individually raise $20+ billion, making these among the largest public offerings in history.',
          source: { n: 4, name: 'Economic Times' },
          voice: 'deepseek'
        },
        {
          text: 'Open-weight models surge — DeepSeek R1 enables frontier performance without dependency on major tech gatekeepers',
          detail: 'MIT Technology Review highlights the democratization: download, run locally, no API calls required.',
          source: { n: 1, name: 'MIT Tech Review' },
          voice: 'gpt'
        },
        {
          text: 'Agentic AI evolution — moving beyond task completion to collaborative partnership in complex workflows',
          detail: 'Medicine, software development, and manufacturing seeing AI as amplifier of expertise, not replacement.',
          source: { n: 7, name: 'Tech Times' },
          voice: 'groq'
        }
      ],
      matters: [
        {
          text: 'Market confidence signal — successful IPOs would validate the thesis and trigger new funding waves',
          source: { n: 5, name: 'Gizmodo' },
          voice: 'deepseek'
        },
        {
          text: 'Power redistribution — open models break concentration, shift advantage to those who deploy well',
          source: { n: 1, name: 'MIT Tech Review' },
          voice: 'gpt'
        },
        {
          text: 'Integration phase — medicine, software, manufacturing entering production AI, not experiment AI',
          source: { n: 3, name: 'Microsoft News' },
          voice: 'groq'
        }
      ],
      ignore: [
        {
          text: 'General optimism in coverage may mask correction risks — historical patterns suggest caution',
          voice: 'mistral'
        },
        {
          text: 'Collaboration framing overshadows displacement — watch for countervailing employment data',
          voice: 'mistral'
        }
      ],
      risks: [
        {
          text: 'Bubble concern intensifying — $3T combined valuation discussions echo dot-com patterns',
          detail: 'Gizmodo explicitly asks: will 2026 be the year the AI bubble bursts?',
          severity: 'high',
          voice: 'mistral'
        },
        {
          text: 'Regulatory fragmentation — EU AI Act enforcement Q2 could create compliance burden and slow innovation',
          severity: 'medium',
          voice: 'mistral'
        }
      ],
      actions: [
        { text: 'Monitor regulatory developments in EU and US — compliance timelines becoming concrete', priority: 'high' },
        { text: 'Evaluate open-weight models for local deployment — R1, Llama integration feasibility', priority: 'high' },
        { text: 'Assess IPO positioning — direct investment windows may open Q2-Q3', priority: 'medium' }
      ],
      dissent: {
        text: 'The majority view is optimistic, but this mirrors patterns before corrections. The question is not whether a correction occurs, but when and how severe. Gizmodo raises this explicitly: current enthusiasm may not be sustainable.',
        voice: 'mistral',
        source: { n: 5, name: 'Gizmodo' }
      }
    }
  }
};

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

// Predictions as living artifacts — institutional-grade
const PREDICTIONS = [
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
        </div>
        
        <nav>
          <a href="#" onclick="navigateTo('home'); return false;" class="${currentPage === 'home' ? 'active' : ''}">Today</a>
          <a href="#" onclick="navigateTo('predictions'); return false;" class="${currentPage === 'predictions' ? 'active' : ''}">Predictions</a>
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
      <h1 style="margin-bottom: 2rem;">The Method</h1>
      
      <div class="executive-summary" style="margin-bottom: 3rem;">
        <p>Mirror Intelligence is a temporal instrument. It does not predict the future—it tracks the present as it becomes the future. Events move from possible → probable → inevitable. We help you see that motion.</p>
      </div>
      
      <h2 style="margin-bottom: 1rem;">The Daily Process</h2>
      <ol style="color: var(--text-secondary); margin-bottom: 3rem; padding-left: 1.5rem;">
        <li style="margin-bottom: 0.5rem;"><strong>Gather:</strong> Scan 50+ sources for signal</li>
        <li style="margin-bottom: 0.5rem;"><strong>Filter:</strong> Rank by credibility (Tier 1/2/3)</li>
        <li style="margin-bottom: 0.5rem;"><strong>Analyze:</strong> Four AI voices examine from different angles</li>
        <li style="margin-bottom: 0.5rem;"><strong>Synthesize:</strong> Produce intelligence, not information</li>
        <li style="margin-bottom: 0.5rem;"><strong>Predict:</strong> Make falsifiable claims with accountability</li>
      </ol>
      
      <h2 style="margin-bottom: 1rem;">The Council</h2>
      <p style="color: var(--text-secondary); margin-bottom: 2rem;">We use multiple AI models not for redundancy, but for perspective. Each has a bias—that's the point.</p>
      
      ${renderCouncil()}
      
      <h2 style="margin: 3rem 0 1rem;">Why Predictions Matter</h2>
      <p style="color: var(--text-secondary);">Most intelligence products never commit. They analyze but never predict. We believe accountability builds trust. Every prediction is tracked. Misses are public. This is how trust compounds.</p>
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
          <div style="font-size: 2.5rem; font-weight: 600; color: var(--text-primary);">—</div>
          <div class="ghost-text">Accuracy</div>
        </div>
        <div class="panel-section" style="text-align: center;">
          <div style="font-size: 2.5rem; font-weight: 600; color: var(--text-primary);">0</div>
          <div class="ghost-text">Resolved</div>
        </div>
      </div>
      
      <h2 style="margin-bottom: 1rem;">Active Predictions</h2>
      ${PREDICTIONS.map(p => `
        <div class="prediction-item ${p.state}" style="margin-bottom: 1rem;">
          <div class="prediction-text" style="font-size: 1.1rem;">${p.text}</div>
          <div class="prediction-basis" style="margin: 1rem 0;">${p.basis}</div>
          <div class="prediction-meta">
            ${renderVoiceBadge(p.voice)}
            <span class="confidence ${p.confidence}">${p.confidence}</span>
            <span class="timeframe mono">⏱ ${p.timeframe}</span>
            <span class="ghost-text">Created ${p.created}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

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
    'a': () => navigateTo('about'),
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

// Initialize
render();
