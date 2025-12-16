"""
Redis Cache Wrapper - Works with both Redis Cloud and local Redis
"""

import redis.asyncio as redis
import json
import logging
from typing import Any, Optional
from app.config import settings

logger = logging.getLogger(__name__)

class CacheManager:
    def __init__(self):
        self.client: Optional[redis.Redis] = None
        self.connected = False
    
    async def connect(self):
        """Connect to Redis (Cloud or Local)"""
        if not settings.CACHE_ENABLED:
            logger.info("Cache is disabled")
            return
        
        try:
            # Redis Cloud or Local
            if settings.REDIS_PASSWORD:
                # Redis Cloud (with password)
                self.client = redis.Redis(
                    host=settings.REDIS_HOST,
                    port=settings.REDIS_PORT,
                    password=settings.REDIS_PASSWORD,
                    db=settings.REDIS_DB,
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_keepalive=True
                )
                logger.info(f"🌐 Connecting to Redis Cloud: {settings.REDIS_HOST}:{settings.REDIS_PORT}")
            else:
                # Local Redis (no password)
                self.client = redis.Redis(
                    host=settings.REDIS_HOST,
                    port=settings.REDIS_PORT,
                    db=settings.REDIS_DB,
                    decode_responses=True,
                    socket_connect_timeout=5
                )
                logger.info(f"💻 Connecting to Local Redis: {settings.REDIS_HOST}:{settings.REDIS_PORT}")
            
            # Test connection
            await self.client.ping()
            self.connected = True
            logger.info("✅ Redis connected successfully")
            
        except Exception as e:
            logger.warning(f"⚠️  Redis connection failed: {str(e)}")
            logger.warning("Continuing without cache...")
            self.connected = False
            self.client = None
    
    async def disconnect(self):
        """Disconnect from Redis"""
        if self.client:
            await self.client.close()
            logger.info("Redis disconnected")
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if not self.connected or not self.client:
            return None
        
        try:
            value = await self.client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Cache get error: {str(e)}")
            return None
    
    async def set(self, key: str, value: Any, ttl: Optional[int] = None):
        """Set value in cache with optional TTL"""
        if not self.connected or not self.client:
            return False
        
        try:
            ttl = ttl or settings.CACHE_TTL
            serialized = json.dumps(value)
            await self.client.setex(key, ttl, serialized)
            return True
        except Exception as e:
            logger.error(f"Cache set error: {str(e)}")
            return False
    
    async def delete(self, key: str):
        """Delete key from cache"""
        if not self.connected or not self.client:
            return False
        
        try:
            await self.client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Cache delete error: {str(e)}")
            return False
    
    async def clear_pattern(self, pattern: str):
        """Clear all keys matching pattern"""
        if not self.connected or not self.client:
            return False
        
        try:
            keys = []
            async for key in self.client.scan_iter(match=pattern):
                keys.append(key)
            
            if keys:
                await self.client.delete(*keys)
                logger.info(f"Cleared {len(keys)} keys matching {pattern}")
            return True
        except Exception as e:
            logger.error(f"Cache clear error: {str(e)}")
            return False
    
    async def ping(self) -> bool:
        """Check if Redis is connected"""
        if not self.client:
            return False
        
        try:
            await self.client.ping()
            return True
        except:
            return False
    
    async def get_stats(self) -> dict:
        """Get cache statistics"""
        if not self.connected or not self.client:
            return {"connected": False}
        
        try:
            info = await self.client.info()
            return {
                "connected": True,
                "used_memory": info.get("used_memory_human", "N/A"),
                "keys": await self.client.dbsize(),
                "hits": info.get("keyspace_hits", 0),
                "misses": info.get("keyspace_misses", 0),
                "hit_rate": self._calculate_hit_rate(info)
            }
        except Exception as e:
            logger.error(f"Stats error: {str(e)}")
            return {"connected": False, "error": str(e)}
    
    def _calculate_hit_rate(self, info: dict) -> str:
        """Calculate cache hit rate"""
        hits = info.get("keyspace_hits", 0)
        misses = info.get("keyspace_misses", 0)
        total = hits + misses
        
        if total == 0:
            return "0%"
        
        rate = (hits / total) * 100
        return f"{rate:.2f}%"

# Global cache instance
cache = CacheManager()