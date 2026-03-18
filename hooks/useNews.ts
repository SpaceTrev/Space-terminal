"use client";

import { useState, useEffect, useCallback } from "react";
import { MOCK_NEWS } from "@/lib/mockData";
import type { NewsItem } from "@/lib/types";

const POLL_INTERVAL = 60_000; // 60 seconds

export function useNews(): NewsItem[] {
  const [news, setNews] = useState<NewsItem[]>(MOCK_NEWS);

  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch("/api/news");
      if (!res.ok) return;
      const data: NewsItem[] = await res.json();
      if (data.length > 0) setNews(data);
    } catch {
      // silently keep current state
    }
  }, []);

  useEffect(() => {
    fetchNews();
    const id = setInterval(fetchNews, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchNews]);

  return news;
}
