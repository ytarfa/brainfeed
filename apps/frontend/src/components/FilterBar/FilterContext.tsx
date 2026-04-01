import React, { createContext, useContext, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import type { Bookmark } from "../../data/mock";

// --- Types ---

type SourceType = "github" | "youtube" | "article" | "instagram" | "generic";
type SortField = "created_at" | "title" | "source_type";
type SortOrder = "asc" | "desc";

interface FilterState {
  source: SourceType | null;
  tags: string[];
  sort: SortField;
  order: SortOrder;
}

interface FilterContextValue extends FilterState {
  setSource: (source: SourceType | null) => void;
  toggleTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  setSort: (sort: SortField) => void;
  setOrder: (order: SortOrder) => void;
  clearAll: () => void;
  hasActiveFilters: boolean;
  serverParams: { type?: string; sort: string; order: string };
  filterByTags: (bookmarks: Bookmark[]) => Bookmark[];
}

interface FilterProviderProps {
  defaultSort?: SortField;
  defaultOrder?: SortOrder;
  children: React.ReactNode;
}

// --- URL param names ---

const PARAM_SOURCE = "source";
const PARAM_TAGS = "tags";
const PARAM_SORT = "sort";
const PARAM_ORDER = "order";

// --- Defaults ---

const DEFAULT_SORT: SortField = "created_at";
const DEFAULT_ORDER: SortOrder = "desc";

const VALID_SOURCES = new Set<string>(["github", "youtube", "article", "instagram", "generic"]);
const VALID_SORTS = new Set<string>(["created_at", "title", "source_type"]);
const VALID_ORDERS = new Set<string>(["asc", "desc"]);

// --- Context ---

const FilterContext = createContext<FilterContextValue | null>(null);

export function useFilterContext(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) {
    throw new Error("useFilterContext must be used within a FilterProvider");
  }
  return ctx;
}

// --- Helpers ---

function parseSource(value: string | null): SourceType | null {
  if (value && VALID_SOURCES.has(value)) return value as SourceType;
  return null;
}

function parseTags(value: string | null): string[] {
  if (!value) return [];
  return value.split(",").map((t) => t.trim()).filter(Boolean);
}

function parseSort(value: string | null, fallback: SortField): SortField {
  if (value && VALID_SORTS.has(value)) return value as SortField;
  return fallback;
}

function parseOrder(value: string | null, fallback: SortOrder): SortOrder {
  if (value && VALID_ORDERS.has(value)) return value as SortOrder;
  return fallback;
}

// --- Provider ---

export default function FilterProvider({
  defaultSort = DEFAULT_SORT,
  defaultOrder = DEFAULT_ORDER,
  children,
}: FilterProviderProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Derive state from URL
  const source = parseSource(searchParams.get(PARAM_SOURCE));
  const tags = useMemo(() => parseTags(searchParams.get(PARAM_TAGS)), [searchParams]);
  const sort = parseSort(searchParams.get(PARAM_SORT), defaultSort);
  const order = parseOrder(searchParams.get(PARAM_ORDER), defaultOrder);

  // --- Setters (update URL) ---

  const setSource = useCallback((newSource: SourceType | null) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newSource) {
        next.set(PARAM_SOURCE, newSource);
      } else {
        next.delete(PARAM_SOURCE);
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const toggleTag = useCallback((tag: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      const current = parseTags(prev.get(PARAM_TAGS));
      const idx = current.indexOf(tag);
      if (idx >= 0) {
        current.splice(idx, 1);
      } else {
        current.push(tag);
      }
      if (current.length > 0) {
        next.set(PARAM_TAGS, current.join(","));
      } else {
        next.delete(PARAM_TAGS);
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const removeTag = useCallback((tag: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      const current = parseTags(prev.get(PARAM_TAGS)).filter((t) => t !== tag);
      if (current.length > 0) {
        next.set(PARAM_TAGS, current.join(","));
      } else {
        next.delete(PARAM_TAGS);
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const setSort = useCallback((newSort: SortField) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newSort === defaultSort) {
        next.delete(PARAM_SORT);
      } else {
        next.set(PARAM_SORT, newSort);
      }
      return next;
    }, { replace: true });
  }, [setSearchParams, defaultSort]);

  const setOrder = useCallback((newOrder: SortOrder) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newOrder === defaultOrder) {
        next.delete(PARAM_ORDER);
      } else {
        next.set(PARAM_ORDER, newOrder);
      }
      return next;
    }, { replace: true });
  }, [setSearchParams, defaultOrder]);

  const clearAll = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  // --- Derived values ---

  const hasActiveFilters = source !== null || tags.length > 0 || sort !== defaultSort || order !== defaultOrder;

  const serverParams = useMemo(() => {
    const params: { type?: string; sort: string; order: string } = {
      sort,
      order,
    };
    if (source) {
      params.type = source;
    }
    return params;
  }, [source, sort, order]);

  const filterByTags = useCallback(
    (bookmarks: Bookmark[]): Bookmark[] => {
      if (tags.length === 0) return bookmarks;
      return bookmarks.filter((b) =>
        tags.every((t) => b.tags.some((bt) => bt.label === t)),
      );
    },
    [tags],
  );

  const value = useMemo<FilterContextValue>(
    () => ({
      source,
      tags,
      sort,
      order,
      setSource,
      toggleTag,
      removeTag,
      setSort,
      setOrder,
      clearAll,
      hasActiveFilters,
      serverParams,
      filterByTags,
    }),
    [source, tags, sort, order, setSource, toggleTag, removeTag, setSort, setOrder, clearAll, hasActiveFilters, serverParams, filterByTags],
  );

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}

export type { SourceType, SortField, SortOrder, FilterState, FilterContextValue };
