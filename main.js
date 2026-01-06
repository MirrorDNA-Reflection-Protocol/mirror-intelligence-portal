/* ═══════════════════════════════════════════════════════════════
   Mirror Intelligence Portal — Main Application v2.0
   
   Now with LIVE data from consortium and AI expert panel format
   ═══════════════════════════════════════════════════════════════ */

import './style.css'

// Topic schedule
const TOPICS = {
  0: { name: 'Weekly Review', icon: '📊', color: 'gold' },
  1: { name: 'AI & Technology', icon: '🤖', color: 'purple' },
  2: { name: 'Finance & Markets', icon: '💹', color: 'green' },
  3: { name: 'Geopolitics', icon: '🌍', color: 'blue' },
  4: { name: 'Science & Health', icon: '🧬', color: 'red' },
  5: { name: 'Business & Strategy', icon: '📈', color: 'gold' },
  6: { name: 'Deep Dive', icon: '🔬', color: 'purple' }
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// AI Expert Panel - each model has a specialty
const AI_PANEL = {
  gpt: {
    name: 'GPT-4o',
    role: 'Narrative Analyst',
    icon: '🧠',
    specialty: 'Identifies narrative shifts and framing patterns'
  },
  deepseek: {
    name: 'DeepSeek R1',
    role: 'Facts & Metrics',
    icon: '📊',
    specialty: 'Extracts concrete numbers and specifications'
  },
  groq: {
    name: 'Llama 3.3 70B',
    role: 'Signal Filter',
    icon: '🎯',
    specialty: 'Separates hype from durable change'
  },
  mistral: {
    name: 'Mistral',
    role: 'Contrarian View',
    icon: '💭',
    specialty: 'Finds overlooked angles and counter-narratives'
  }
};

// LIVE DATA — from consortium run 2026-01-06
const LIVE_BRIEFING = {
  date: 'January 6, 2026',
  generatedAt: '1:00 PM IST',
  topic: TOPICS[1], // Monday = AI & Technology
  articleCount: 8,
  modelCount: 4,

  keyInsights: {
    headline: 'AI Industry Shifts from Hype to Pragmatism',
    subheadline: 'Mega IPOs worth $3 trillion signal market confidence while open-weight models democratize access'
  },

  sections: {
    changed: [
      {
        text: 'Shift to Pragmatism: AI industry transitioning from hype to real-world applications with focus on collaborative roles',
        source: { num: 2, title: 'TechCrunch', url: 'https://techcrunch.com/2026/01/02/in-2026-ai-will-move-from-hype-to-pragmatism/' },
        expert: 'gpt'
      },
      {
        text: 'Mega IPO Year: SpaceX, OpenAI, and Anthropic preparing for public debuts with combined valuation approaching $3 trillion',
        source: { num: 4, title: 'Economic Times', url: 'https://economictimes.indiatimes.com/news/international/us/2026-set-to-be-the-historic-year-of-the-mega-ipo' },
        expert: 'deepseek'
      },
      {
        text: 'Open-Weight Models Surge: Models like DeepSeek R1 enable top-tier AI performance without relying on OpenAI, Google, or Anthropic',
        source: { num: 1, title: 'MIT Technology Review', url: 'https://www.technologyreview.com/2026/01/05/1130662/whats-next-for-ai-in-2026/' },
        expert: 'gpt'
      },
      {
        text: 'Agentic AI Evolution: AI moving beyond task automation to become collaborative and independent partners',
        source: { num: 7, title: 'Tech Times', url: 'https://www.techtimes.com/articles/313559/20251231/top-technology-trends-that-will-shape-2026' },
        expert: 'groq'
      },
      {
        text: 'Regulatory Battles Intensify: U.S.-China competition, innovation vs risk balance dominating policy discussions',
        source: { num: 8, title: 'The Hill', url: 'https://thehill.com/policy/technology/5657624-5-key-ai-fights-to-watch-in-2026/' },
        expert: 'mistral'
      }
    ],
    matters: [
      {
        text: 'Market Confidence: Anticipated IPOs signal strong investor confidence — could reach $20+ billion individual raises',
        source: { num: 5, title: 'Gizmodo', url: 'https://gizmodo.com/2026-is-poised-to-be-the-year-of-the-tech-ipo' },
        expert: 'deepseek'
      },
      {
        text: 'Technological Democratization: Open-weight models may fundamentally disrupt the AI oligopoly of major tech companies',
        source: { num: 1, title: 'MIT Technology Review', url: 'https://www.technologyreview.com/2026/01/05/1130662/whats-next-for-ai-in-2026/' },
        expert: 'gpt'
      },
      {
        text: 'Real-World Impact: AI entering production phase — medicine, software development, manufacturing seeing tangible integration',
        source: { num: 3, title: 'Microsoft News', url: 'https://news.microsoft.com/source/features/ai/whats-next-in-ai-7-trends-to-watch-in-2026' },
        expert: 'groq'
      }
    ],
    ignore: [
      {
        text: 'General Optimism: Positive outlook may overlook potential market corrections or AI bubble risks',
        source: { num: 5, title: 'Gizmodo', url: 'https://gizmodo.com/2026-is-poised-to-be-the-year-of-the-tech-ipo' },
        expert: 'mistral'
      },
      {
        text: 'Collaboration Framing: AI-as-partner narrative downplays job displacement and economic disruption concerns',
        source: { num: 3, title: 'Microsoft News', url: 'https://news.microsoft.com/source/features/ai/whats-next-in-ai-7-trends-to-watch-in-2026' },
        expert: 'mistral'
      },
      {
        text: 'Speculative Valuations: $3T combined valuation discussions may not reflect underlying economic realities',
        source: { num: 4, title: 'Economic Times', url: 'https://economictimes.indiatimes.com/news/international/us/2026-set-to-be-the-historic-year-of-the-mega-ipo' },
        expert: 'groq'
      }
    ],
    risks: [
      {
        text: 'AI Bubble Concern: Overvaluation and unsustainable enthusiasm could lead to significant market correction',
        source: { num: 5, title: 'Gizmodo', url: 'https://gizmodo.com/2026-is-poised-to-be-the-year-of-the-tech-ipo' },
        expert: 'mistral',
        severity: 'high'
      },
      {
        text: 'Regulatory Backlash: Increasing scrutiny could hinder AI development, especially in U.S.-China competitive context',
        source: { num: 8, title: 'The Hill', url: 'https://thehill.com/policy/technology/5657624-5-key-ai-fights-to-watch-in-2026/' },
        expert: 'mistral',
        severity: 'medium'
      }
    ],
    actions: [
      { text: 'Monitor AI policy discussions and regulatory changes impacting operations', priority: 'high' },
      { text: 'Evaluate IPO implications for investment strategies and partnerships', priority: 'medium' },
      { text: 'Explore open-weight model integration (DeepSeek R1, Llama) for local deployment', priority: 'high' }
    ],
    dissent: {
      text: 'While majority view is optimistic, Gizmodo raises valid concerns about AI bubble burst. Current enthusiasm may not be sustainable — markets have seen similar patterns before dot-com and crypto crashes.',
      source: { num: 5, title: 'Gizmodo', url: 'https://gizmodo.com/2026-is-poised-to-be-the-year-of-the-tech-ipo' },
      expert: 'mistral'
    }
  }
};

// Predictions based on today's analysis
const LIVE_PREDICTIONS = [
  {
    id: 'pred-20260106-001',
    text: 'OpenAI IPO will value the company at $200B+ within Q2 2026',
    confidence: 'high',
    timeframe: '6 months',
    basis: 'Based on $3T combined valuation signals and market appetite',
    expert: 'deepseek'
  },
  {
    id: 'pred-20260106-002',
    text: 'Open-weight models will capture 30%+ of enterprise AI deployments by end of 2026',
    confidence: 'medium',
    timeframe: '12 months',
    basis: 'R1 performance approaching frontier models, cost advantages',
    expert: 'gpt'
  },
  {
    id: 'pred-20260106-003',
    text: 'At least one major AI company will face significant regulatory action in the U.S. or EU',
    confidence: 'medium',
    timeframe: '12 months',
    basis: 'Intensifying regulatory battles, bipartisan policy conflicts',
    expert: 'mistral'
  },
  {
    id: 'pred-20260106-004',
    text: 'AI-related market correction of 15-25% will occur if IPO expectations are not met',
    confidence: 'low',
    timeframe: '18 months',
    basis: 'Historical bubble patterns, valuation concerns',
    expert: 'groq'
  }
];

const SOURCES = [
  { num: 1, title: "What's next for AI in 2026", domain: 'MIT Technology Review', url: 'https://www.technologyreview.com/2026/01/05/1130662/whats-next-for-ai-in-2026/' },
  { num: 2, title: 'AI will move from hype to pragmatism', domain: 'TechCrunch', url: 'https://techcrunch.com/2026/01/02/in-2026-ai-will-move-from-hype-to-pragmatism/' },
  { num: 3, title: '7 AI trends to watch in 2026', domain: 'Microsoft News', url: 'https://news.microsoft.com/source/features/ai/whats-next-in-ai-7-trends-to-watch-in-2026' },
  { num: 4, title: '2026 set to be historic IPO year', domain: 'Economic Times', url: 'https://economictimes.indiatimes.com/news/international/us/2026-set-to-be-the-historic-year-of-the-mega-ipo' },
  { num: 5, title: 'Year of Tech IPO or AI Bubble Burst?', domain: 'Gizmodo', url: 'https://gizmodo.com/2026-is-poised-to-be-the-year-of-the-tech-ipo' },
  { num: 6, title: "What's next for AI in 2026", domain: 'MIT Technology Review', url: 'https://www.technologyreview.com/2026/01/05/1130662/whats-next-for-ai-in-2026/' },
  { num: 7, title: 'Top Technology Trends 2026', domain: 'Tech Times', url: 'https://www.techtimes.com/articles/313559/20251231/top-technology-trends-that-will-shape-2026' },
  { num: 8, title: '5 key AI fights to watch in 2026', domain: 'The Hill', url: 'https://thehill.com/policy/technology/5657624-5-key-ai-fights-to-watch-in-2026/' }
];

// Render functions
function renderHeader() {
  return `
    <header>
      <div class="header-content">
        <a href="/" class="logo">
          <div class="logo-icon">⟡</div>
          <div class="logo-text">Mirror <span>Intelligence</span></div>
        </a>
        <nav>
          <a href="#" class="active">Today's Brief</a>
          <a href="#predictions">Predictions</a>
          <a href="#panel">AI Panel</a>
          <a href="#sources">Sources</a>
        </nav>
      </div>
    </header>
  `;
}

function renderHero() {
  const briefing = LIVE_BRIEFING;
  return `
    <section class="hero">
      <div class="hero-badge">
        <span>🔴</span> Live — ${briefing.generatedAt}
      </div>
      <h1>${briefing.keyInsights.headline}</h1>
      <p>${briefing.keyInsights.subheadline}</p>
      <div class="hero-stats">
        <div class="stat">
          <span class="stat-num">${briefing.articleCount}</span>
          <span class="stat-label">Sources Analyzed</span>
        </div>
        <div class="stat">
          <span class="stat-num">${briefing.modelCount}</span>
          <span class="stat-label">AI Models</span>
        </div>
        <div class="stat">
          <span class="stat-num">$3T</span>
          <span class="stat-label">IPO Valuations</span>
        </div>
      </div>
    </section>
  `;
}

function renderTopicCalendar() {
  const today = new Date().getDay();

  const days = [1, 2, 3, 4, 5, 6, 0].map(dayNum => {
    const topic = TOPICS[dayNum];
    const isActive = dayNum === today;

    return `
      <div class="topic-day ${isActive ? 'active' : ''}" data-day="${dayNum}">
        <span class="day-name">${DAY_NAMES[dayNum]}</span>
        <span class="topic-icon">${topic.icon}</span>
        <span class="topic-name">${topic.name}</span>
      </div>
    `;
  }).join('');

  return `<div class="topic-calendar">${days}</div>`;
}

function renderExpertBadge(expertKey) {
  const expert = AI_PANEL[expertKey];
  if (!expert) return '';
  return `<span class="expert-badge" title="${expert.specialty}">${expert.icon} ${expert.name}</span>`;
}

function renderBriefingSection(title, icon, items, sectionClass = '') {
  const listItems = items.map(item => `
    <li class="${sectionClass}">
      <div class="item-content">
        <span class="item-text">${item.text}</span>
        ${item.source ? `<a href="${item.source.url}" class="citation" target="_blank" title="${item.source.title}">[${item.source.num}]</a>` : ''}
      </div>
      <div class="item-meta">
        ${item.expert ? renderExpertBadge(item.expert) : ''}
        ${item.severity ? `<span class="severity ${item.severity}">${item.severity.toUpperCase()}</span>` : ''}
        ${item.priority ? `<span class="priority ${item.priority}">${item.priority.toUpperCase()}</span>` : ''}
      </div>
    </li>
  `).join('');

  return `
    <div class="briefing-section">
      <div class="section-header">
        <span class="section-icon">${icon}</span>
        <span class="section-title">${title}</span>
      </div>
      <div class="section-content">
        <ul>${listItems}</ul>
      </div>
    </div>
  `;
}

function renderBriefingCard() {
  const briefing = LIVE_BRIEFING;

  return `
    <article class="briefing-card fade-in" id="briefing">
      <div class="briefing-header">
        <div class="briefing-title">
          <div class="briefing-icon">${briefing.topic.icon}</div>
          <div>
            <h2>${briefing.topic.name} Brief</h2>
            <div class="briefing-date">${briefing.date}</div>
          </div>
        </div>
        <div class="briefing-meta">
          <span class="meta-badge">📰 ${briefing.articleCount} sources</span>
          <span class="meta-badge">🤖 ${briefing.modelCount} AI analysts</span>
        </div>
      </div>
      
      ${renderBriefingSection('What Changed Today', '📊', briefing.sections.changed)}
      ${renderBriefingSection('Why It Matters', '⚡', briefing.sections.matters)}
      ${renderBriefingSection('Safe to Ignore', '🔇', briefing.sections.ignore)}
      ${renderBriefingSection('Risks & Drift Detected', '⚠️', briefing.sections.risks, 'risk-item')}
      ${renderBriefingSection('Recommended Actions', '🎯', briefing.sections.actions, 'action-item')}
      
      <div class="briefing-section dissent-section">
        <div class="section-header">
          <span class="section-icon">💭</span>
          <span class="section-title">Dissenting View</span>
        </div>
        <div class="dissent-content">
          <p>${briefing.sections.dissent.text}</p>
          <div class="dissent-meta">
            ${renderExpertBadge(briefing.sections.dissent.expert)}
            <a href="${briefing.sections.dissent.source.url}" class="citation" target="_blank">[${briefing.sections.dissent.source.num}] ${briefing.sections.dissent.source.title}</a>
          </div>
        </div>
      </div>
    </article>
  `;
}

function renderExpertPanel() {
  const panels = Object.entries(AI_PANEL).map(([key, expert]) => `
    <div class="expert-card">
      <div class="expert-icon">${expert.icon}</div>
      <div class="expert-info">
        <div class="expert-name">${expert.name}</div>
        <div class="expert-role">${expert.role}</div>
        <div class="expert-specialty">${expert.specialty}</div>
      </div>
    </div>
  `).join('');

  return `
    <div class="panel-card fade-in delay-3" id="panel">
      <div class="panel-header">
        <div class="panel-title">
          <span class="icon">🧠</span>
          AI Expert Panel
        </div>
      </div>
      <div class="expert-grid">
        ${panels}
      </div>
    </div>
  `;
}

function renderPredictions() {
  const predictions = LIVE_PREDICTIONS.map(pred => `
    <div class="prediction-item">
      <div class="prediction-text">${pred.text}</div>
      <div class="prediction-basis">${pred.basis}</div>
      <div class="prediction-meta">
        ${renderExpertBadge(pred.expert)}
        <span class="confidence ${pred.confidence}">${pred.confidence.toUpperCase()}</span>
        <span class="timeframe">⏱️ ${pred.timeframe}</span>
      </div>
    </div>
  `).join('');

  return `
    <div class="panel-card fade-in delay-1" id="predictions">
      <div class="panel-header">
        <div class="panel-title">
          <span class="icon">🔮</span>
          Predictions
        </div>
        <span class="accuracy-badge">Tracking 4 active</span>
      </div>
      ${predictions}
    </div>
  `;
}

function renderSources() {
  const sources = SOURCES.map(source => `
    <div class="source-item">
      <span class="source-num">[${source.num}]</span>
      <a href="${source.url}" class="source-title" target="_blank">${source.title}</a>
      <span class="source-domain">${source.domain}</span>
    </div>
  `).join('');

  return `
    <div class="panel-card fade-in delay-2" id="sources">
      <div class="panel-header">
        <div class="panel-title">
          <span class="icon">📚</span>
          Sources (${SOURCES.length})
        </div>
      </div>
      <div class="sources-list">
        ${sources}
      </div>
    </div>
  `;
}

function renderFooter() {
  return `
    <footer>
      <p>Generated by <a href="https://activemirror.ai">Active Mirror</a> Multi-AI Consortium</p>
      <p>⟡ GPT-4o • DeepSeek R1 • Llama 3.3 • Mistral — ${LIVE_BRIEFING.date}</p>
    </footer>
  `;
}

// Main render
function render() {
  document.querySelector('#app').innerHTML = `
    <div class="bg-pattern"></div>
    <div class="grid-overlay"></div>
    
    ${renderHeader()}
    ${renderHero()}
    ${renderTopicCalendar()}
    
    <main>
      <div class="content-grid">
        ${renderBriefingCard()}
        <aside class="predictions-panel">
          ${renderPredictions()}
          ${renderExpertPanel()}
          ${renderSources()}
        </aside>
      </div>
    </main>
    
    ${renderFooter()}
  `;

  // Add event listeners
  document.querySelectorAll('.topic-day').forEach(day => {
    day.addEventListener('click', (e) => {
      document.querySelectorAll('.topic-day').forEach(d => d.classList.remove('active'));
      e.currentTarget.classList.add('active');
    });
  });
}

// Initialize
render();
