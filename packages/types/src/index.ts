// Database types (auto-generated — do not edit manually)
export type {
  Database,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
  CompositeTypes,
} from "./database.types";

// App-layer types (extend DB rows with UI/computed fields)
export type {
  ContentType,
  SourceType,
  DigestStatus,
  EnrichmentStatus,
  Tag,
  Collaborator,
  CategorizationRule,
  Space,
  Bookmark,
  ActivityEntry,
  Profile,
  DigestCandidate,
  DigestCandidateStatus,
} from "./app.types";

// Enriched-data types (enrichment pipeline output)
export type { EnrichedData } from "./enriched-data.types";
