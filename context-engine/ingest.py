"""
⟡ Mirror Intelligence — Ingestion Engine
Fetches data from high-signal RSS feeds and news APIs.
"""

import asyncio
import feedparser
import httpx
from datetime import datetime
from typing import List, Dict, Optional, AsyncGenerator
from dataclasses import dataclass

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════

RSS_SOURCES = [
    {
        "name": "TechCrunch AI",
        "url": "https://techcrunch.com/category/artificial-intelligence/feed/",
        "tier": 1
    },
    {
        "name": "MIT Tech Review",
        "url": "https://www.technologyreview.com/feed/",
        "tier": 1
    },
    {
        "name": "The Verge AI",
        "url": "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
        "tier": 1
    },
    {
        "name": "Ars Technica",
        "url": "https://feeds.arstechnica.com/arstechnica/technology-lab",
        "tier": 2
    },
    {
        "name": "Hacker News",
        "url": "https://hnrss.org/frontpage?points=100",
        "tier": 2
    }
]


@dataclass
class IngestEvent:
    """An ingestion event for logging/streaming."""
    source: str
    status: str  # "fetching", "parsing", "complete", "error"
    message: str
    timestamp: str = None
    
    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.utcnow().isoformat() + "Z"


@dataclass 
class Article:
    """A fetched article."""
    title: str
    url: str
    source: str
    summary: Optional[str] = None
    published: Optional[str] = None
    tier: int = 1


# ═══════════════════════════════════════════════════════════════
# INGESTION ENGINE
# ═══════════════════════════════════════════════════════════════

class IngestEngine:
    """Fetches and parses content from RSS feeds."""
    
    def __init__(self, event_callback=None):
        """
        Initialize ingestion engine.
        
        Args:
            event_callback: Optional async callback for streaming events
        """
        self.event_callback = event_callback
        self.articles: List[Article] = []
    
    async def _emit(self, event: IngestEvent):
        """Emit an ingestion event."""
        if self.event_callback:
            await self.event_callback(event)
    
    async def fetch_rss(self, source: Dict) -> List[Article]:
        """Fetch articles from a single RSS feed."""
        await self._emit(IngestEvent(
            source=source["name"],
            status="fetching",
            message=f"Connecting to {source['name']}..."
        ))
        
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(source["url"], follow_redirects=True)
                response.raise_for_status()
                
            await self._emit(IngestEvent(
                source=source["name"],
                status="parsing",
                message=f"Parsing feed from {source['name']}..."
            ))
            
            feed = feedparser.parse(response.text)
            articles = []
            
            for entry in feed.entries[:10]:  # Limit to 10 per source
                article = Article(
                    title=entry.get("title", "Untitled"),
                    url=entry.get("link", ""),
                    source=source["name"],
                    summary=entry.get("summary", "")[:500] if entry.get("summary") else None,
                    published=entry.get("published", None),
                    tier=source.get("tier", 1)
                )
                articles.append(article)
            
            await self._emit(IngestEvent(
                source=source["name"],
                status="complete",
                message=f"Fetched {len(articles)} articles from {source['name']}"
            ))
            
            return articles
            
        except Exception as e:
            await self._emit(IngestEvent(
                source=source["name"],
                status="error",
                message=f"Error fetching {source['name']}: {str(e)}"
            ))
            return []
    
    async def ingest_all(self) -> List[Article]:
        """Fetch from all configured sources."""
        tasks = [self.fetch_rss(source) for source in RSS_SOURCES]
        results = await asyncio.gather(*tasks)
        
        self.articles = []
        for article_list in results:
            self.articles.extend(article_list)
        
        # Sort by tier (1 first) then by recency
        self.articles.sort(key=lambda a: (a.tier, a.published or ""), reverse=True)
        
        await self._emit(IngestEvent(
            source="SYSTEM",
            status="complete",
            message=f"Ingestion complete: {len(self.articles)} articles from {len(RSS_SOURCES)} sources"
        ))
        
        return self.articles
    
    def get_context_text(self, max_articles: int = 20) -> str:
        """Get concatenated article summaries for LLM context."""
        context_parts = []
        for article in self.articles[:max_articles]:
            part = f"[{article.source}] {article.title}"
            if article.summary:
                # Clean HTML from summary
                import re
                clean_summary = re.sub(r'<[^>]+>', '', article.summary)
                part += f"\n{clean_summary[:300]}"
            context_parts.append(part)
        
        return "\n\n---\n\n".join(context_parts)


# ═══════════════════════════════════════════════════════════════
# STANDALONE TEST
# ═══════════════════════════════════════════════════════════════

async def main():
    """Test ingestion."""
    async def log_event(event: IngestEvent):
        print(f"[{event.status}] {event.source}: {event.message}")
    
    engine = IngestEngine(event_callback=log_event)
    articles = await engine.ingest_all()
    
    print(f"\n⟡ Total articles: {len(articles)}")
    for article in articles[:5]:
        print(f"  - [{article.source}] {article.title[:60]}...")


if __name__ == "__main__":
    asyncio.run(main())
