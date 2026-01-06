/* ═══════════════════════════════════════════════════════════════
   Mirror Intelligence Portal — Main Application v3.0
   
   Enhanced with:
   - Live real-time clock
   - Working topic day buttons with historical data
   - More detailed briefings
   - Client-side routing for About/Terms
   - Comprehensive coverage
   ═══════════════════════════════════════════════════════════════ */

import './style.css'

// ═══════════════════════════════════════════════════════════════
// ROUTER STATE
// ═══════════════════════════════════════════════════════════════

let currentPage = 'home';
let currentTopic = new Date().getDay();

// Topic schedule
const TOPICS = {
  0: { name: 'Weekly Review', icon: '📊', color: 'gold', description: 'Comprehensive weekly synthesis of all topics' },
  1: { name: 'AI & Technology', icon: '🤖', color: 'purple', description: 'Artificial intelligence, machine learning, and tech innovation' },
  2: { name: 'Finance & Markets', icon: '💹', color: 'green', description: 'Stock markets, crypto, investment trends, and economic indicators' },
  3: { name: 'Geopolitics', icon: '🌍', color: 'blue', description: 'International relations, policy shifts, and global events' },
  4: { name: 'Science & Health', icon: '🧬', color: 'red', description: 'Medical breakthroughs, biotech, and scientific discoveries' },
  5: { name: 'Business & Strategy', icon: '📈', color: 'gold', description: 'Corporate moves, startups, M&A, and strategic insights' },
  6: { name: 'Deep Dive', icon: '🔬', color: 'purple', description: 'In-depth analysis of a trending topic' }
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// AI Expert Panel
const AI_PANEL = {
  gpt: {
    name: 'GPT-4o',
    role: 'Narrative Analyst',
    icon: '🧠',
    specialty: 'Identifies narrative shifts, framing patterns, and communication strategies'
  },
  deepseek: {
    name: 'DeepSeek R1',
    role: 'Facts & Metrics',
    icon: '📊',
    specialty: 'Extracts concrete numbers, specifications, and quantifiable data'
  },
  groq: {
    name: 'Llama 3.3 70B',
    role: 'Signal Filter',
    icon: '🎯',
    specialty: 'Separates hype from durable change, identifies what will matter in 6 months'
  },
  mistral: {
    name: 'Mistral',
    role: 'Contrarian View',
    icon: '💭',
    specialty: 'Finds overlooked angles, counter-narratives, and dissenting perspectives'
  }
};

// ═══════════════════════════════════════════════════════════════
// BRIEFING DATA STORE (per topic)
// ═══════════════════════════════════════════════════════════════

const BRIEFINGS = {
  // Monday - AI & Technology (Today's LIVE data)
  1: {
    date: 'January 6, 2026',
    lastUpdated: new Date().toISOString(),
    articleCount: 8,
    modelCount: 4,
    keyInsights: {
      headline: 'AI Industry Shifts from Hype to Pragmatism',
      subheadline: 'Mega IPOs worth $3 trillion signal market confidence while open-weight models democratize access'
    },
    executiveSummary: `The AI industry is undergoing a significant transformation in early 2026. After years of hype-driven growth, we're witnessing a shift toward pragmatic, real-world applications. Three mega-IPOs (SpaceX, OpenAI, Anthropic) are poised to reshape capital markets with a combined $3 trillion valuation. Meanwhile, open-weight models like DeepSeek R1 are democratizing access to frontier AI capabilities, challenging the oligopoly of major tech companies.`,
    sections: {
      changed: [
        {
          text: 'AI industry transitioning from hype to real-world applications with focus on collaborative roles and practical deployments',
          detail: 'TechCrunch reports that 2026 marks a pivotal year where AI moves from flashy demos to targeted deployments. The industry is "sobering up" after years of scaling-first approaches.',
          source: { num: 2, title: 'TechCrunch', url: 'https://techcrunch.com/2026/01/02/in-2026-ai-will-move-from-hype-to-pragmatism/' },
          expert: 'gpt'
        },
        {
          text: 'Mega IPO Year: SpaceX, OpenAI, and Anthropic preparing for public debuts with combined valuation approaching $3 trillion',
          detail: 'Wall Street is bracing for the most significant milestone in American capital markets history. Each company could individually raise over $20 billion, making these among the largest IPOs ever.',
          source: { num: 4, title: 'Economic Times', url: 'https://economictimes.indiatimes.com/news/international/us/2026-set-to-be-the-historic-year-of-the-mega-ipo' },
          expert: 'deepseek'
        },
        {
          text: 'Open-Weight Models Surge: DeepSeek R1 and similar models enable top-tier AI performance without relying on OpenAI, Google, or Anthropic',
          detail: 'MIT Technology Review highlights that open-weight models allow anyone to download and run frontier-level AI locally. This is democratizing access and reducing dependence on major tech gatekeepers.',
          source: { num: 1, title: 'MIT Technology Review', url: 'https://www.technologyreview.com/2026/01/05/1130662/whats-next-for-ai-in-2026/' },
          expert: 'gpt'
        },
        {
          text: 'Agentic AI Evolution: Moving beyond task automation to become collaborative, independent partners in workflows',
          detail: 'Future tech predictions indicate AI is no longer just answering questions but actively collaborating with humans. In medicine, software development, and manufacturing, AI is amplifying human expertise.',
          source: { num: 7, title: 'Tech Times', url: 'https://www.techtimes.com/articles/313559/20251231/top-technology-trends-that-will-shape-2026' },
          expert: 'groq'
        },
        {
          text: 'Regulatory Battles Intensify: U.S.-China competition, innovation vs risk balance dominating policy discussions',
          detail: 'The Hill reports that AI regulation has become increasingly contentious. Key issues like who decides regulations and how to compete with China don\'t fall along party lines, creating unusual political alignments.',
          source: { num: 8, title: 'The Hill', url: 'https://thehill.com/policy/technology/5657624-5-key-ai-fights-to-watch-in-2026/' },
          expert: 'mistral'
        }
      ],
      matters: [
        {
          text: 'Market Confidence: Anticipated IPOs signal strong investor confidence — could reach $20+ billion individual raises',
          detail: 'The successful completion of these IPOs would validate the AI investment thesis and potentially trigger a new wave of funding into the sector.',
          source: { num: 5, title: 'Gizmodo', url: 'https://gizmodo.com/2026-is-poised-to-be-the-year-of-the-tech-ipo' },
          expert: 'deepseek'
        },
        {
          text: 'Technological Democratization: Open-weight models may fundamentally disrupt the AI oligopoly of major tech companies',
          detail: 'For the first time, individuals and smaller companies can access frontier AI without going through OpenAI, Anthropic, or Google. This shifts power dynamics in the industry.',
          source: { num: 1, title: 'MIT Technology Review', url: 'https://www.technologyreview.com/2026/01/05/1130662/whats-next-for-ai-in-2026/' },
          expert: 'gpt'
        },
        {
          text: 'Real-World Impact: AI entering production phase — medicine, software development, manufacturing seeing tangible integration',
          detail: 'Microsoft News reports that AI is closing gaps in healthcare, learning developer preferences, and transforming collaboration. The focus has shifted from experimentation to deployment.',
          source: { num: 3, title: 'Microsoft News', url: 'https://news.microsoft.com/source/features/ai/whats-next-in-ai-7-trends-to-watch-in-2026' },
          expert: 'groq'
        }
      ],
      ignore: [
        {
          text: 'General Optimism: Positive outlook may overlook potential market corrections or AI bubble risks',
          detail: 'Most coverage presents an optimistic view, but historical patterns suggest caution is warranted when valuations reach these levels.',
          source: { num: 5, title: 'Gizmodo', url: 'https://gizmodo.com/2026-is-poised-to-be-the-year-of-the-tech-ipo' },
          expert: 'mistral'
        },
        {
          text: 'Collaboration Framing: AI-as-partner narrative downplays job displacement and economic disruption concerns',
          detail: 'The "AI as collaborator" messaging may be overshadowing legitimate concerns about workforce disruption. Watch for countervailing data on employment impacts.',
          source: { num: 3, title: 'Microsoft News', url: 'https://news.microsoft.com/source/features/ai/whats-next-in-ai-7-trends-to-watch-in-2026' },
          expert: 'mistral'
        },
        {
          text: 'Speculative Valuations: $3T combined valuation discussions may not reflect underlying economic realities',
          detail: 'Valuation discussions often outpace revenue fundamentals. Focus on actual product adoption and revenue metrics rather than market cap projections.',
          source: { num: 4, title: 'Economic Times', url: 'https://economictimes.indiatimes.com/news/international/us/2026-set-to-be-the-historic-year-of-the-mega-ipo' },
          expert: 'groq'
        }
      ],
      risks: [
        {
          text: 'AI Bubble Concern: Overvaluation and unsustainable enthusiasm could lead to significant market correction',
          detail: 'Gizmodo explicitly raises the question: will 2026 be the year the AI bubble bursts? Current enthusiasm mirrors historical patterns seen before dot-com and crypto crashes.',
          source: { num: 5, title: 'Gizmodo', url: 'https://gizmodo.com/2026-is-poised-to-be-the-year-of-the-tech-ipo' },
          expert: 'mistral',
          severity: 'high'
        },
        {
          text: 'Regulatory Backlash: Increasing scrutiny could hinder AI development, especially in U.S.-China competitive context',
          detail: 'New regulations in the EU and potential U.S. action could create compliance burdens and slow innovation. Watch for EU AI Act enforcement in Q2.',
          source: { num: 8, title: 'The Hill', url: 'https://thehill.com/policy/technology/5657624-5-key-ai-fights-to-watch-in-2026/' },
          expert: 'mistral',
          severity: 'medium'
        }
      ],
      actions: [
        { text: 'Monitor AI policy discussions and regulatory changes impacting operations', priority: 'high', timeframe: 'Ongoing' },
        { text: 'Evaluate IPO implications for investment strategies and partnerships', priority: 'medium', timeframe: 'Q1 2026' },
        { text: 'Explore open-weight model integration (DeepSeek R1, Llama) for local deployment', priority: 'high', timeframe: 'This week' }
      ],
      dissent: {
        text: 'While majority view is optimistic, Gizmodo raises valid concerns about AI bubble burst. Current enthusiasm may not be sustainable — markets have seen similar patterns before dot-com and crypto crashes. The question isn\'t whether a correction will happen, but when and how severe.',
        source: { num: 5, title: 'Gizmodo', url: 'https://gizmodo.com/2026-is-poised-to-be-the-year-of-the-tech-ipo' },
        expert: 'mistral'
      }
    }
  },

  // Sample data for other days (would be populated by consortium)
  2: {
    date: 'January 7, 2026',
    lastUpdated: null,
    articleCount: 0,
    modelCount: 0,
    keyInsights: {
      headline: 'Finance & Markets Brief Coming Tomorrow',
      subheadline: 'Consortium will analyze financial news on Tuesday'
    },
    executiveSummary: 'This briefing will be generated tomorrow (Tuesday) focusing on stock markets, cryptocurrency, economic indicators, and investment trends.',
    sections: { changed: [], matters: [], ignore: [], risks: [], actions: [], dissent: null }
  },
  3: {
    date: 'January 8, 2026',
    lastUpdated: null,
    articleCount: 0,
    modelCount: 0,
    keyInsights: {
      headline: 'Geopolitics Brief Coming Wednesday',
      subheadline: 'International relations and policy analysis'
    },
    executiveSummary: 'This briefing will be generated on Wednesday focusing on geopolitics, international relations, and global policy shifts.',
    sections: { changed: [], matters: [], ignore: [], risks: [], actions: [], dissent: null }
  },
  4: {
    date: 'January 9, 2026',
    lastUpdated: null,
    articleCount: 0,
    modelCount: 0,
    keyInsights: {
      headline: 'Science & Health Brief Coming Thursday',
      subheadline: 'Medical breakthroughs and scientific discoveries'
    },
    executiveSummary: 'This briefing will be generated on Thursday focusing on science, health, biotech, and medical research.',
    sections: { changed: [], matters: [], ignore: [], risks: [], actions: [], dissent: null }
  },
  5: {
    date: 'January 10, 2026',
    lastUpdated: null,
    articleCount: 0,
    modelCount: 0,
    keyInsights: {
      headline: 'Business & Strategy Brief Coming Friday',
      subheadline: 'Corporate moves and strategic insights'
    },
    executiveSummary: 'This briefing will be generated on Friday focusing on business strategy, M&A, startups, and corporate news.',
    sections: { changed: [], matters: [], ignore: [], risks: [], actions: [], dissent: null }
  },
  6: {
    date: 'January 11, 2026',
    lastUpdated: null,
    articleCount: 0,
    modelCount: 0,
    keyInsights: {
      headline: 'Deep Dive Coming Saturday',
      subheadline: 'In-depth analysis of a trending topic'
    },
    executiveSummary: 'Saturday deep dives explore one topic in comprehensive detail, with extended analysis and historical context.',
    sections: { changed: [], matters: [], ignore: [], risks: [], actions: [], dissent: null }
  },
  0: {
    date: 'January 5, 2026',
    lastUpdated: null,
    articleCount: 0,
    modelCount: 0,
    keyInsights: {
      headline: 'Weekly Review Coming Sunday',
      subheadline: 'Comprehensive synthesis of the week\'s insights'
    },
    executiveSummary: 'Sunday reviews synthesize the entire week\'s briefings into a comprehensive overview with key takeaways and strategic recommendations.',
    sections: { changed: [], matters: [], ignore: [], risks: [], actions: [], dissent: null }
  }
};

const PREDICTIONS = [
  {
    id: 'pred-20260106-001',
    text: 'OpenAI IPO will value the company at $200B+ within Q2 2026',
    confidence: 'high',
    timeframe: '6 months',
    basis: 'Based on $3T combined valuation signals and market appetite. Reported preparations for largest tech IPOs ever.',
    expert: 'deepseek',
    created: '2026-01-06'
  },
  {
    id: 'pred-20260106-002',
    text: 'Open-weight models will capture 30%+ of enterprise AI deployments by end of 2026',
    confidence: 'medium',
    timeframe: '12 months',
    basis: 'R1 performance approaching frontier models. Cost advantages and privacy benefits driving enterprise adoption.',
    expert: 'gpt',
    created: '2026-01-06'
  },
  {
    id: 'pred-20260106-003',
    text: 'At least one major AI company will face significant regulatory action in the U.S. or EU',
    confidence: 'medium',
    timeframe: '12 months',
    basis: 'Intensifying regulatory battles, bipartisan policy conflicts. EU AI Act enforcement begins Q2.',
    expert: 'mistral',
    created: '2026-01-06'
  },
  {
    id: 'pred-20260106-004',
    text: 'AI-related market correction of 15-25% will occur if IPO expectations are not met',
    confidence: 'low',
    timeframe: '18 months',
    basis: 'Historical bubble patterns, valuation concerns raised by analysts. Similar to dot-com and crypto patterns.',
    expert: 'groq',
    created: '2026-01-06'
  }
];

const SOURCES = [
  { num: 1, title: "What's next for AI in 2026", domain: 'MIT Technology Review', url: 'https://www.technologyreview.com/2026/01/05/1130662/whats-next-for-ai-in-2026/', tier: 1 },
  { num: 2, title: 'AI will move from hype to pragmatism', domain: 'TechCrunch', url: 'https://techcrunch.com/2026/01/02/in-2026-ai-will-move-from-hype-to-pragmatism/', tier: 1 },
  { num: 3, title: '7 AI trends to watch in 2026', domain: 'Microsoft News', url: 'https://news.microsoft.com/source/features/ai/whats-next-in-ai-7-trends-to-watch-in-2026', tier: 2 },
  { num: 4, title: '2026 set to be historic IPO year', domain: 'Economic Times', url: 'https://economictimes.indiatimes.com/news/international/us/2026-set-to-be-the-historic-year-of-the-mega-ipo', tier: 1 },
  { num: 5, title: 'Year of Tech IPO or AI Bubble Burst?', domain: 'Gizmodo', url: 'https://gizmodo.com/2026-is-poised-to-be-the-year-of-the-tech-ipo', tier: 2 },
  { num: 6, title: "What's next for AI in 2026", domain: 'MIT Technology Review', url: 'https://www.technologyreview.com/2026/01/05/1130662/whats-next-for-ai-in-2026/', tier: 1 },
  { num: 7, title: 'Top Technology Trends 2026', domain: 'Tech Times', url: 'https://www.techtimes.com/articles/313559/20251231/top-technology-trends-that-will-shape-2026', tier: 2 },
  { num: 8, title: '5 key AI fights to watch in 2026', domain: 'The Hill', url: 'https://thehill.com/policy/technology/5657624-5-key-ai-fights-to-watch-in-2026/', tier: 1 }
];

// ═══════════════════════════════════════════════════════════════
// LIVE TIME CLOCK
// ═══════════════════════════════════════════════════════════════

function formatLiveTime() {
  const now = new Date();
  return now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

function startClock() {
  const updateClock = () => {
    const clockEl = document.getElementById('live-clock');
    const dateEl = document.getElementById('live-date');
    if (clockEl) clockEl.textContent = formatLiveTime();
    if (dateEl) dateEl.textContent = formatDate();
  };
  updateClock();
  setInterval(updateClock, 1000);
}

// ═══════════════════════════════════════════════════════════════
// RENDER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function renderHeader() {
  return `
    <header>
      <div class="header-content">
        <a href="#" class="logo" onclick="navigateTo('home'); return false;">
          <div class="logo-icon">⟡</div>
          <div class="logo-text">Mirror <span>Intelligence</span></div>
        </a>
        <nav>
          <a href="#" onclick="navigateTo('home'); return false;" class="${currentPage === 'home' ? 'active' : ''}">Today's Brief</a>
          <a href="#" onclick="navigateTo('predictions'); return false;" class="${currentPage === 'predictions' ? 'active' : ''}">Predictions</a>
          <a href="#" onclick="navigateTo('about'); return false;" class="${currentPage === 'about' ? 'active' : ''}">How It Works</a>
          <a href="#" onclick="navigateTo('terms'); return false;" class="${currentPage === 'terms' ? 'active' : ''}">Terms</a>
        </nav>
      </div>
    </header>
  `;
}

function renderHero() {
  const briefing = BRIEFINGS[currentTopic];
  const topic = TOPICS[currentTopic];
  const isEmpty = briefing.articleCount === 0;

  return `
    <section class="hero">
      <div class="live-time-bar">
        <span class="live-indicator">🔴 LIVE</span>
        <span id="live-date">${formatDate()}</span>
        <span id="live-clock">${formatLiveTime()}</span>
      </div>
      <h1>${topic.icon} ${briefing.keyInsights.headline}</h1>
      <p>${briefing.keyInsights.subheadline}</p>
      ${!isEmpty ? `
      <div class="hero-stats">
        <div class="stat">
          <span class="stat-num">${briefing.articleCount}</span>
          <span class="stat-label">Sources Analyzed</span>
        </div>
        <div class="stat">
          <span class="stat-num">${briefing.modelCount}</span>
          <span class="stat-label">AI Analysts</span>
        </div>
        <div class="stat">
          <span class="stat-num">$3T</span>
          <span class="stat-label">IPO Valuations</span>
        </div>
      </div>
      ` : `
      <div class="coming-soon-badge">
        <span>📅</span> Briefing scheduled for ${topic.name} day
      </div>
      `}
    </section>
  `;
}

function renderTopicCalendar() {
  const today = new Date().getDay();

  const days = [1, 2, 3, 4, 5, 6, 0].map(dayNum => {
    const topic = TOPICS[dayNum];
    const isActive = dayNum === currentTopic;
    const isToday = dayNum === today;
    const briefing = BRIEFINGS[dayNum];
    const hasData = briefing && briefing.articleCount > 0;

    return `
      <div class="topic-day ${isActive ? 'active' : ''} ${!hasData ? 'no-data' : ''}" 
           data-day="${dayNum}" 
           onclick="selectTopic(${dayNum})">
        <span class="day-name">${DAY_NAMES[dayNum]}${isToday ? ' •' : ''}</span>
        <span class="topic-icon">${topic.icon}</span>
        <span class="topic-name">${topic.name}</span>
        ${hasData ? '<span class="has-data">✓</span>' : '<span class="no-data-badge">—</span>'}
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
  if (!items || items.length === 0) return '';

  const listItems = items.map(item => `
    <li class="${sectionClass}">
      <div class="item-content">
        <span class="item-text">${item.text}</span>
        ${item.source ? `<a href="${item.source.url}" class="citation" target="_blank" title="${item.source.title}">[${item.source.num}]</a>` : ''}
      </div>
      ${item.detail ? `<div class="item-detail">${item.detail}</div>` : ''}
      <div class="item-meta">
        ${item.expert ? renderExpertBadge(item.expert) : ''}
        ${item.severity ? `<span class="severity ${item.severity}">${item.severity.toUpperCase()}</span>` : ''}
        ${item.priority ? `<span class="priority ${item.priority}">${item.priority.toUpperCase()}</span>` : ''}
        ${item.timeframe ? `<span class="timeframe-badge">⏱️ ${item.timeframe}</span>` : ''}
      </div>
    </li>
  `).join('');

  return `
    <div class="briefing-section">
      <div class="section-header">
        <span class="section-icon">${icon}</span>
        <span class="section-title">${title}</span>
        <span class="section-count">${items.length} items</span>
      </div>
      <div class="section-content">
        <ul>${listItems}</ul>
      </div>
    </div>
  `;
}

function renderBriefingCard() {
  const briefing = BRIEFINGS[currentTopic];
  const topic = TOPICS[currentTopic];
  const isEmpty = briefing.articleCount === 0;

  if (isEmpty) {
    return `
      <article class="briefing-card empty-state fade-in">
        <div class="empty-icon">${topic.icon}</div>
        <h2>No Briefing Yet for ${topic.name}</h2>
        <p>${topic.description}</p>
        <p class="empty-hint">This briefing will be generated on the scheduled day. Check back later!</p>
      </article>
    `;
  }

  return `
    <article class="briefing-card fade-in" id="briefing">
      <div class="briefing-header">
        <div class="briefing-title">
          <div class="briefing-icon">${topic.icon}</div>
          <div>
            <h2>${topic.name} Brief</h2>
            <div class="briefing-date">${briefing.date}</div>
          </div>
        </div>
        <div class="briefing-meta">
          <span class="meta-badge">📰 ${briefing.articleCount} sources</span>
          <span class="meta-badge">🤖 ${briefing.modelCount} AI analysts</span>
        </div>
      </div>
      
      <div class="executive-summary">
        <h3>📋 Executive Summary</h3>
        <p>${briefing.executiveSummary}</p>
      </div>
      
      ${renderBriefingSection('What Changed Today', '📊', briefing.sections.changed)}
      ${renderBriefingSection('Why It Matters', '⚡', briefing.sections.matters)}
      ${renderBriefingSection('Safe to Ignore', '🔇', briefing.sections.ignore)}
      ${renderBriefingSection('Risks & Drift Detected', '⚠️', briefing.sections.risks, 'risk-item')}
      ${renderBriefingSection('Recommended Actions', '🎯', briefing.sections.actions, 'action-item')}
      
      ${briefing.sections.dissent ? `
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
      ` : ''}
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
  const predictions = PREDICTIONS.map(pred => `
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
        <span class="accuracy-badge">Tracking ${PREDICTIONS.length} active</span>
      </div>
      ${predictions}
    </div>
  `;
}

function renderSources() {
  const sources = SOURCES.map(source => `
    <div class="source-item">
      <span class="source-num">[${source.num}]</span>
      <span class="source-tier tier-${source.tier}">T${source.tier}</span>
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
      <div class="source-tier-legend">
        <span class="tier-legend"><span class="tier-dot tier-1"></span> Tier 1: Primary sources</span>
        <span class="tier-legend"><span class="tier-dot tier-2"></span> Tier 2: Aggregators</span>
      </div>
    </div>
  `;
}

function renderAboutPage() {
  return `
    <div class="page-content about-page fade-in">
      <h1>⟡ How Mirror Intelligence Works</h1>
      
      <section class="about-section">
        <h2>🎯 What We Do</h2>
        <p>Mirror Intelligence is a <strong>multi-AI consortium</strong> that synthesizes daily intelligence briefings from real-time news sources. Unlike single-model AI assistants, we leverage <strong>4 specialized AI models</strong>, each contributing unique analytical perspectives.</p>
      </section>
      
      <section class="about-section">
        <h2>🔄 Daily Process</h2>
        <ol>
          <li><strong>Web Search:</strong> We scan 50+ sources for the day's most relevant news</li>
          <li><strong>Source Selection:</strong> Articles are ranked by credibility (Tier 1/2/3)</li>
          <li><strong>Multi-Model Analysis:</strong> 4 AI models analyze the news through different lenses</li>
          <li><strong>Synthesis:</strong> A final model synthesizes insights into actionable intelligence</li>
          <li><strong>Human Review:</strong> Content is reviewed before publication</li>
        </ol>
      </section>
      
      <section class="about-section">
        <h2>🧠 Our AI Panel</h2>
        <div class="expert-grid about-expert-grid">
          ${Object.entries(AI_PANEL).map(([key, expert]) => `
            <div class="expert-card">
              <div class="expert-icon">${expert.icon}</div>
              <div class="expert-info">
                <div class="expert-name">${expert.name}</div>
                <div class="expert-role">${expert.role}</div>
                <div class="expert-specialty">${expert.specialty}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </section>
      
      <section class="about-section">
        <h2>📅 Topic Schedule</h2>
        <table class="about-table">
          <tbody>
            ${Object.entries(TOPICS).map(([day, topic]) => `
              <tr>
                <td><strong>${DAY_NAMES[day]}</strong></td>
                <td>${topic.icon} ${topic.name}</td>
                <td>${topic.description}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>
      
      <section class="about-section">
        <h2>📊 Source Tiers</h2>
        <ul>
          <li><strong>Tier 1:</strong> Primary sources — original journalism, official announcements, peer-reviewed research</li>
          <li><strong>Tier 2:</strong> Aggregators — reputable tech blogs, industry publications</li>
          <li><strong>Tier 3:</strong> Secondary — social media, forums, community sources</li>
        </ul>
      </section>
      
      <section class="about-section">
        <h2>🔮 Prediction Tracking</h2>
        <p>We make specific, falsifiable predictions and track their accuracy over time. Each prediction includes:</p>
        <ul>
          <li><strong>Confidence Level:</strong> High / Medium / Low</li>
          <li><strong>Timeframe:</strong> When we expect resolution</li>
          <li><strong>Basis:</strong> Evidence supporting the prediction</li>
          <li><strong>Expert:</strong> Which AI model contributed the prediction</li>
        </ul>
      </section>
      
      <section class="about-section">
        <h2>🏗️ Built By</h2>
        <p>Mirror Intelligence is a project by <a href="https://activemirror.ai" target="_blank">Active Mirror</a>, exploring the intersection of AI, identity, and collaborative intelligence.</p>
      </section>
    </div>
  `;
}

function renderTermsPage() {
  return `
    <div class="page-content terms-page fade-in">
      <h1>📜 Terms of Service & Disclaimers</h1>
      
      <section class="terms-section">
        <h2>⚠️ Important Disclaimers</h2>
        <div class="disclaimer-box">
          <p><strong>Not Investment Advice:</strong> The content on Mirror Intelligence is for informational purposes only. It does not constitute investment, financial, legal, or professional advice. Always consult qualified professionals before making decisions.</p>
        </div>
        <div class="disclaimer-box">
          <p><strong>AI-Generated Content:</strong> All briefings are generated by AI models and may contain errors, biases, or outdated information. We make no guarantees regarding accuracy, completeness, or timeliness.</p>
        </div>
        <div class="disclaimer-box">
          <p><strong>Predictions Are Speculative:</strong> Our predictions are experimental forecasts, not guarantees. Past prediction accuracy does not guarantee future performance.</p>
        </div>
      </section>
      
      <section class="terms-section">
        <h2>📋 Terms of Use</h2>
        <h3>1. Acceptance</h3>
        <p>By accessing Mirror Intelligence, you accept these terms. If you disagree, please discontinue use.</p>
        
        <h3>2. Use of Content</h3>
        <p>Content may be shared with attribution. Commercial use requires permission.</p>
        
        <h3>3. No Warranty</h3>
        <p>We provide this service "as is" without warranties of any kind.</p>
        
        <h3>4. Limitation of Liability</h3>
        <p>We are not liable for any damages arising from your use of this service or reliance on its content.</p>
        
        <h3>5. Changes to Terms</h3>
        <p>We may modify these terms at any time. Continued use constitutes acceptance.</p>
      </section>
      
      <section class="terms-section">
        <h2>🔒 Privacy</h2>
        <p>We do not collect personal data. We use minimal analytics to understand usage patterns. No cookies are used for tracking.</p>
      </section>
      
      <section class="terms-section">
        <h2>📧 Contact</h2>
        <p>Questions? Contact us at <a href="mailto:legal@activemirror.ai">legal@activemirror.ai</a></p>
      </section>
      
      <p class="terms-updated">Last updated: January 6, 2026</p>
    </div>
  `;
}

function renderPredictionsPage() {
  return `
    <div class="page-content predictions-page fade-in">
      <h1>🔮 Prediction Tracker</h1>
      <p class="page-intro">We make specific, falsifiable predictions and track their outcomes. Transparency builds trust.</p>
      
      <div class="prediction-stats">
        <div class="pred-stat">
          <span class="pred-stat-num">${PREDICTIONS.length}</span>
          <span class="pred-stat-label">Active Predictions</span>
        </div>
        <div class="pred-stat">
          <span class="pred-stat-num">—</span>
          <span class="pred-stat-label">Accuracy Rate</span>
        </div>
        <div class="pred-stat">
          <span class="pred-stat-num">0</span>
          <span class="pred-stat-label">Resolved</span>
        </div>
      </div>
      
      <h2>Active Predictions</h2>
      <div class="predictions-list">
        ${PREDICTIONS.map(pred => `
          <div class="prediction-card">
            <div class="prediction-text-large">${pred.text}</div>
            <div class="prediction-basis">${pred.basis}</div>
            <div class="prediction-meta-large">
              ${renderExpertBadge(pred.expert)}
              <span class="confidence ${pred.confidence}">${pred.confidence.toUpperCase()}</span>
              <span class="timeframe">⏱️ ${pred.timeframe}</span>
              <span class="created">Created: ${pred.created}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderFooter() {
  return `
    <footer>
      <div class="footer-links">
        <a href="#" onclick="navigateTo('about'); return false;">How It Works</a>
        <a href="#" onclick="navigateTo('terms'); return false;">Terms & Disclaimers</a>
        <a href="https://activemirror.ai" target="_blank">Active Mirror</a>
      </div>
      <p>⟡ Generated by Multi-AI Consortium • GPT-4o • DeepSeek R1 • Llama 3.3 • Mistral</p>
      <p class="footer-disclaimer">For informational purposes only. Not investment advice.</p>
    </footer>
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
    `;
  } else if (currentPage === 'about') {
    content = `<main>${renderAboutPage()}</main>`;
  } else if (currentPage === 'terms') {
    content = `<main>${renderTermsPage()}</main>`;
  } else if (currentPage === 'predictions') {
    content = `<main>${renderPredictionsPage()}</main>`;
  }

  document.querySelector('#app').innerHTML = `
    <div class="bg-pattern"></div>
    <div class="grid-overlay"></div>
    ${renderHeader()}
    ${content}
    ${renderFooter()}
  `;

  startClock();
}

// ═══════════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════════

window.navigateTo = function (page) {
  currentPage = page;
  render();
  window.scrollTo(0, 0);
};

window.selectTopic = function (dayNum) {
  currentTopic = dayNum;
  currentPage = 'home';
  render();
};

// Initialize
render();
