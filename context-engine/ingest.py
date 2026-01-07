"""
⟡ Mirror Intelligence — Ingestion Engine
Fetches data from high-signal RSS feeds and news APIs.
"""

import asyncio
import feedparser
import httpx
from datetime import datetime
from typing import List, Dict, Optional, AsyncGenerator, Any
from dataclasses import dataclass

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════

def load_feeds(path: str = "feeds.txt") -> List[Dict]:
    import os
    # Resolve relative to this file
    base_dir = os.path.dirname(os.path.abspath(__file__))
    full_path = os.path.join(base_dir, path)
    feeds = []
    try:
        with open(full_path, "r") as f:
            lines = f.readlines()
        
        current_category = "General"
        for line in lines:
            line = line.strip()
            if not line or line.startswith("#"):
                if line.startswith("#"):
                    current_category = line.lstrip("# ").strip()
                continue
            
            # Simple deduplication by URL logic could happen here
            feeds.append({
                "name": f"{current_category} Feed", 
                "url": line,
                "tier": 1
            })
    except FileNotFoundError:
        print("Warning: feeds.txt not found, using defaults.")
        return [
            {"name": "TechCrunch AI", "url": "https://techcrunch.com/category/artificial-intelligence/feed/", "tier": 1},
            {"name": "MIT Tech Review", "url": "https://www.technologyreview.com/feed/", "tier": 1},
            {"name": "The Verge AI", "url": "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", "tier": 1},
            {"name": "Ars Technica", "url": "https://feeds.arstechnica.com/arstechnica/technology-lab", "tier": 2},
            {"name": "Hacker News", "url": "https://hnrss.org/frontpage?points=100", "tier": 2}
        ]
    return feeds

RSS_SOURCES = load_feeds()


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





# ═══════════════════════════════════════════════════════════════
# INGESTION ENGINE
# ═══════════════════════════════════════════════════════════════

from data_schema import Source

# ═══════════════════════════════════════════════════════════════
# INGESTION ENGINE
# ═══════════════════════════════════════════════════════════════

class IngestEngine:
    """Fetches and parses content from RSS feeds."""
    
    def __init__(self, event_callback=None):
        self.event_callback = event_callback
        self.sources: List[Source] = []
    
    async def _emit(self, event: IngestEvent):
        if self.event_callback:
            await self.event_callback(event)
    
    async def fetch_rss(self, feed_config: Dict) -> List[Source]:
        """Fetch articles from a single RSS feed."""
        await self._emit(IngestEvent(
            source=feed_config["name"],
            status="fetching",
            message=f"Connecting to {feed_config['name']}..."
        ))
        
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(feed_config["url"], follow_redirects=True)
                response.raise_for_status()
                
            await self._emit(IngestEvent(
                source=feed_config["name"],
                status="parsing",
                message=f"Parsing feed from {feed_config['name']}..."
            ))
            
            feed = feedparser.parse(response.text)
            sources = []
            
            for entry in feed.entries[:10]:
                try:
                    source = Source.from_feed_entry(entry, source_name=feed_config["name"])
                    # Add domain/source metadata manually if needed, generic Source logic does domain parsing
                    sources.append(source)
                except Exception as e:
                    continue

            await self._emit(IngestEvent(
                source=feed_config["name"],
                status="complete",
                message=f"Fetched {len(sources)} items from {feed_config['name']}"
            ))
            
            return sources
            
        except Exception as e:
            await self._emit(IngestEvent(
                source=feed_config["name"],
                status="error",
                message=f"Error fetching {feed_config['name']}: {str(e)}"
            ))
            return []
    
    async def ingest_all(self) -> Dict[str, Any]:
        """Fetch from all configured sources and return data + stats."""
        tasks = [self.fetch_rss(src) for src in RSS_SOURCES]
        results = await asyncio.gather(*tasks)
        
        self.sources = []
        seen_ids = set()
        
        total_fetched = 0
        failed_feeds = 0
        
        for i, source_list in enumerate(results):
            if not source_list and RSS_SOURCES[i]["url"]: # Simple check for empty/failed
                 # This is inexact because empty feeds exist, but fetch_rss catches errors returning []
                 # We can improve by returning status tuple from fetch_rss
                 pass
            
            total_fetched += len(source_list)
            if len(source_list) == 0:
                 pass # Could verify error state if fetch_rss returned it
            
            for s in source_list:
                if s.id not in seen_ids:
                    self.sources.append(s)
                    seen_ids.add(s.id)
        
        # Sort by timestamp
        self.sources.sort(key=lambda s: s.timestamp, reverse=True)
        
        unique_count = len(self.sources)
        failed_count = sum(1 for r in results if len(r) == 0) # Rough proxy for now
        
        stats = {
            "total_fetched": total_fetched,
            "unique_sources": unique_count,
            "failed_feeds": failed_count,
            "sources": self.sources
        }

        await self._emit(IngestEvent(
            source="SYSTEM",
            status="complete",
            message=f"Ingestion complete: {unique_count} unique items from {total_fetched} raw"
        ))
        
        return stats
    
    def get_context_text(self, max_items: int = 30) -> str:
        """Get concatenated summaries for LLM context."""
        parts = []
        for s in self.sources[:max_items]:
            # Clean text
            import re
            clean_text = re.sub(r'<[^>]+>', '', s.text)
            # Remove whitespace
            clean_text = " ".join(clean_text.split())
            parts.append(f"SOURCE: {s.title}\nURL: {s.url}\nCONTENT: {clean_text[:500]}...")
        
        return "\n\n---\n\n".join(parts)


# ═══════════════════════════════════════════════════════════════
# STANDALONE TEST
# ═══════════════════════════════════════════════════════════════

async def main():
    """Test ingestion."""
    async def log_event(event: IngestEvent):
        print(f"[{event.status}] {event.source}: {event.message}")
    
    engine = IngestEngine(event_callback=log_event)
    result = await engine.ingest_all()
    articles = result["sources"]
    
    print(f"\n⟡ Total articles: {len(articles)}")
    for article in articles[:5]:
        print(f"  - [{article.source}] {article.title[:60]}...")


if __name__ == "__main__":
    asyncio.run(main())
