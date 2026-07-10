const axios = require("axios");
const NodeCache = require("node-cache");

// Initialize cache (TTL: 1 hour)
const searchCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

/**
 * Web Search Service - Provides real-time information using multiple search APIs
 * Supports: Brave Search (recommended), SerpAPI fallback, and local cache
 */

const BRAVE_API_KEY = process.env.BRAVE_SEARCH_API_KEY;
const SERPAPI_KEY = process.env.SERPAPI_API_KEY;

/**
 * Search using Brave Search API (faster, more privacy-focused)
 */
const searchBrave = async (query, count = 5) => {
  if (!BRAVE_API_KEY) {
    throw new Error("Brave Search API key not configured");
  }

  try {
    const response = await axios.get(
      "https://api.search.brave.com/res/v1/web/search",
      {
        params: {
          q: query,
          count,
        },
        headers: {
          Accept: "application/json",
          "X-Subscription-Token": BRAVE_API_KEY,
        },
        timeout: 10000,
      },
    );

    return {
      results:
        response.data.web?.map((item) => ({
          title: item.title,
          url: item.url,
          description: item.description,
          favicon: item.favicon,
        })) || [],
      source: "brave",
    };
  } catch (error) {
    console.error("[SearchService] Brave Search error:", error.message);
    throw error;
  }
};

/**
 * Search using SerpAPI (fallback option)
 */
const searchSerpAPI = async (query, count = 5) => {
  if (!SERPAPI_KEY) {
    throw new Error("SerpAPI key not configured");
  }

  try {
    const response = await axios.get("https://serpapi.com/search", {
      params: {
        q: query,
        api_key: SERPAPI_KEY,
        num: count,
        engine: "google",
      },
      timeout: 10000,
    });

    return {
      results:
        response.data.organic_results?.slice(0, count).map((item) => ({
          title: item.title,
          url: item.link,
          description: item.snippet,
        })) || [],
      source: "serpapi",
    };
  } catch (error) {
    console.error("[SearchService] SerpAPI error:", error.message);
    throw error;
  }
};

/**
 * Perform web search with fallback logic
 */
const webSearch = async (query, options = {}) => {
  const { count = 5, useCache = true, source = "auto" } = options;

  // Check cache first
  if (useCache) {
    const cached = searchCache.get(query);
    if (cached) {
      console.log(`[SearchService] Cache hit for: "${query}"`);
      return cached;
    }
  }

  console.log(`[SearchService] Searching for: "${query}"`);

  try {
    let searchResult;

    if (source === "brave" || (source === "auto" && BRAVE_API_KEY)) {
      try {
        searchResult = await searchBrave(query, count);
      } catch (error) {
        if (source === "brave") throw error;
        console.log("[SearchService] Brave failed, trying SerpAPI...");
        searchResult = await searchSerpAPI(query, count);
      }
    } else if (source === "serpapi" || (source === "auto" && SERPAPI_KEY)) {
      try {
        searchResult = await searchSerpAPI(query, count);
      } catch (error) {
        if (source === "serpapi") throw error;
        console.log("[SearchService] SerpAPI failed, trying Brave...");
        searchResult = await searchBrave(query, count);
      }
    } else {
      throw new Error(
        "No search API configured. Please set BRAVE_SEARCH_API_KEY or SERPAPI_API_KEY",
      );
    }

    // Cache the result
    if (useCache) {
      searchCache.set(query, searchResult);
    }

    return searchResult;
  } catch (error) {
    console.error("[SearchService] Search failed:", error.message);
    throw new Error(`Search failed: ${error.message}`);
  }
};

/**
 * Format search results for AI context
 */
const formatSearchResults = (results) => {
  if (!results || !results.results) return "";

  return results.results
    .map(
      (item, idx) =>
        `${idx + 1}. **${item.title}**\n   ${item.description}\n   Source: ${item.url}`,
    )
    .join("\n\n");
};

/**
 * Clear search cache
 */
const clearCache = () => {
  searchCache.flushAll();
  console.log("[SearchService] Cache cleared");
};

/**
 * Get cache stats
 */
const getCacheStats = () => {
  return {
    keys: searchCache.keys().length,
    keys: searchCache.keys(),
  };
};

module.exports = {
  webSearch,
  formatSearchResults,
  clearCache,
  getCacheStats,
  searchBrave,
  searchSerpAPI,
};
