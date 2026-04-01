import type { EnrichedData } from "@brain-feed/types"
import type { BookmarkForProcessing } from "@brain-feed/worker-core"
import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube"
import { Annotation, StateGraph } from "@langchain/langgraph"

import {
  ArticleService,
  UnsupportedContentError,
  truncateContent as truncateArticleContent,
} from "./services/article-service"
import { GitHubService } from "./services/github-service"
import { enrichContent } from "./services/llm"
import {
  YouTubeService,
  parseDuration,
  type YouTubeChannelResource,
  type YouTubeVideoResource,
} from "./services/youtube-service"

// ---------------------------------------------------------------------------
// Enrichment subgraph state
// ---------------------------------------------------------------------------

export const EnrichmentSubgraphState = Annotation.Root({
  bookmark: Annotation<BookmarkForProcessing>,
  result: Annotation<EnrichedData | null>,
})

export type EnrichmentSubgraphStateType = typeof EnrichmentSubgraphState.State

// ---------------------------------------------------------------------------
// Route keys — the string values returned by the router and used as
// conditional-edge keys.  Exported for testing.
// ---------------------------------------------------------------------------

export type EnrichmentRoute = "github" | "youtube" | "article" | "generic"

// ---------------------------------------------------------------------------
// URL-based source-type detection (fallback when source_type is null)
// ---------------------------------------------------------------------------

const URL_PATTERNS: [RegExp, EnrichmentRoute][] = [
  [/github\.com/i, "github"],
  [/youtube\.com|youtu\.be/i, "youtube"],
]

/**
 * Detect the enrichment route from a URL string.
 * Returns `null` if no pattern matches (caller should fall back to "generic").
 */
export function detectRouteFromUrl(url: string): EnrichmentRoute | null {
  for (const [pattern, route] of URL_PATTERNS) {
    if (pattern.test(url)) {
      return route
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Source-type → route mapping (for bookmarks that already have a source_type)
// ---------------------------------------------------------------------------

const SOURCE_TYPE_TO_ROUTE: Record<string, EnrichmentRoute> = {
  github: "github",
  youtube: "youtube",
  article: "article",
  generic: "generic",
}

/**
 * Determine the enrichment route for a bookmark.
 *
 * Priority:
 *  1. `source_type` if present and mapped
 *  2. URL pattern matching (GitHub, YouTube)
 *  3. HTTP/HTTPS URLs → "article" (most web pages are articles)
 *  4. "generic" fallback (non-HTTP URLs, unknown schemes)
 */
export function resolveRoute(bookmark: BookmarkForProcessing): EnrichmentRoute {
  // 1. Explicit source_type
  if (bookmark.source_type) {
    const mapped = SOURCE_TYPE_TO_ROUTE[bookmark.source_type]
    if (mapped) {
      return mapped
    }
  }

  // 2. URL pattern detection (GitHub, YouTube, etc.)
  if (bookmark.url) {
    const detected = detectRouteFromUrl(bookmark.url)
    if (detected) {
      return detected
    }

    // 3. HTTP/HTTPS URLs default to article enrichment
    try {
      const parsed = new URL(bookmark.url)
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return "article"
      }
    } catch {
      // Invalid URL — fall through to generic
    }
  }

  // 4. Fallback (non-HTTP URLs, missing URLs)
  return "generic"
}

// ---------------------------------------------------------------------------
// Router node — reads state, returns route key via resolveRoute
// ---------------------------------------------------------------------------

function routeNode(state: EnrichmentSubgraphStateType): EnrichmentRoute {
  return resolveRoute(state.bookmark)
}

// ---------------------------------------------------------------------------
// Source-specific enrichment nodes (placeholders)
//
// Each node receives the full state and returns a partial update with the
// enriched result. Replace the body with real logic (API calls, LLM prompts,
// page fetching, etc.) as each source type is implemented.
// ---------------------------------------------------------------------------

function emptyEnrichedData(): EnrichedData {
  return {
    summary: null,
    entities: [],
    topics: [],
    tags: [],
    metadata: null,
    processedAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// GitHub enrichment — configuration
// ---------------------------------------------------------------------------

/**
 * Maximum README length (in characters) sent to the LLM.
 * Configurable via README_MAX_CHARS env var. Defaults to 80 000.
 */
const README_MAX_CHARS = parseInt(
  process.env.README_MAX_CHARS ?? "80000",
  10,
)

// ---------------------------------------------------------------------------
// GitHub enrichment — helper: truncate README at word boundary
// ---------------------------------------------------------------------------

function truncateReadme(text: string, maxChars: number): string {
  if (text.length <= maxChars) {
    return text
  }
  const truncated = text.slice(0, maxChars)
  const lastSpace = truncated.lastIndexOf(" ")
  const cutPoint = lastSpace > maxChars * 0.8 ? lastSpace : maxChars
  return text.slice(0, cutPoint) + "\n[Content truncated]"
}

// ---------------------------------------------------------------------------
// GitHub enrichment — helper: create GitHubService instance
// ---------------------------------------------------------------------------

function createGitHubService(): GitHubService {
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    throw new Error(
      "githubNode: GITHUB_TOKEN environment variable is required.",
    )
  }
  return new GitHubService(token)
}

// ---------------------------------------------------------------------------
// GitHub enrichment — repo path
// ---------------------------------------------------------------------------

async function enrichRepo(
  owner: string,
  repo: string,
): Promise<EnrichedData> {
  const gh = createGitHubService()

  // Fetch repo metadata and README in parallel (README failure is graceful)
  const [repoData, readme] = await Promise.all([
    gh.getRepo(owner, repo),
    gh.getReadme(owner, repo).catch(() => null),
  ])

  const readmeAvailable = readme !== null
  const truncatedReadme = readme
    ? truncateReadme(readme, README_MAX_CHARS)
    : null

  // Build content for LLM
  const contentParts: string[] = [
    `Repository: ${repoData.full_name}`,
  ]
  if (repoData.description) {
    contentParts.push(`Description: ${repoData.description}`)
  }
  if (repoData.language) {
    contentParts.push(`Primary Language: ${repoData.language}`)
  }
  contentParts.push(
    `Stars: ${repoData.stargazers_count}`,
    `Forks: ${repoData.forks_count}`,
  )
  if (repoData.topics.length > 0) {
    contentParts.push(`Topics: ${repoData.topics.join(", ")}`)
  }
  if (repoData.license?.spdx_id) {
    contentParts.push(`License: ${repoData.license.spdx_id}`)
  }
  if (truncatedReadme) {
    contentParts.push("", "README:", truncatedReadme)
  }
  const content = contentParts.join("\n")

  // Call LLM for enrichment
  const llmResult = await enrichContent(content, "GitHub repository")

  // Build metadata
  const metadata: Record<string, string | number> = {
    githubType: "repo",
    owner,
    repo,
    stars: repoData.stargazers_count,
    forks: repoData.forks_count,
    openIssues: repoData.open_issues_count,
    createdAt: repoData.created_at,
    pushedAt: repoData.pushed_at,
    readmeAvailable: readmeAvailable ? "true" : "false",
  }
  if (repoData.language) metadata.language = repoData.language
  if (repoData.license?.spdx_id) metadata.license = repoData.license.spdx_id
  if (repoData.topics.length > 0) {
    metadata.topics = repoData.topics.join(",")
  }
  if (repoData.homepage) metadata.homepage = repoData.homepage

  return {
    summary: llmResult.summary || null,
    entities: llmResult.entities,
    topics: llmResult.topics,
    tags: llmResult.tags,
    metadata,
    processedAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// GitHub enrichment — issue path
// ---------------------------------------------------------------------------

async function enrichIssue(
  owner: string,
  repo: string,
  issueNumber: number,
): Promise<EnrichedData> {
  const gh = createGitHubService()
  const issue = await gh.getIssue(owner, repo, issueNumber)

  const labels = issue.labels.map((l) => l.name)
  const author = issue.user?.login ?? "unknown"

  // Build content for LLM
  const contentParts: string[] = [
    `Issue: ${issue.title}`,
    `Repository: ${owner}/${repo}`,
    `State: ${issue.state}`,
    `Author: ${author}`,
  ]
  if (labels.length > 0) {
    contentParts.push(`Labels: ${labels.join(", ")}`)
  }
  contentParts.push(`Created: ${issue.created_at}`)
  if (issue.body) {
    contentParts.push("", "Body:", issue.body)
  }
  const content = contentParts.join("\n")

  // Call LLM for enrichment
  const llmResult = await enrichContent(content, "GitHub issue")

  // Build metadata
  const metadata: Record<string, string | number> = {
    githubType: "issue",
    owner,
    repo,
    issueNumber,
    state: issue.state,
    author,
    createdAt: issue.created_at,
    commentsCount: issue.comments,
  }
  if (labels.length > 0) {
    metadata.labels = labels.join(",")
  }

  return {
    summary: llmResult.summary || null,
    entities: llmResult.entities,
    topics: llmResult.topics,
    tags: llmResult.tags,
    metadata,
    processedAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// GitHub enrichment — pull request path
// ---------------------------------------------------------------------------

async function enrichPR(
  owner: string,
  repo: string,
  prNumber: number,
): Promise<EnrichedData> {
  const gh = createGitHubService()
  const pr = await gh.getPull(owner, repo, prNumber)

  const labels = pr.labels.map((l) => l.name)
  const author = pr.user?.login ?? "unknown"

  // Build content for LLM
  const contentParts: string[] = [
    `Pull Request: ${pr.title}`,
    `Repository: ${owner}/${repo}`,
    `State: ${pr.state}`,
    `Merged: ${pr.merged ? "yes" : "no"}`,
    `Author: ${author}`,
  ]
  if (labels.length > 0) {
    contentParts.push(`Labels: ${labels.join(", ")}`)
  }
  contentParts.push(
    `Changes: +${pr.additions} -${pr.deletions} in ${pr.changed_files} files`,
  )
  if (pr.body) {
    contentParts.push("", "Body:", pr.body)
  }
  const content = contentParts.join("\n")

  // Call LLM for enrichment
  const llmResult = await enrichContent(content, "GitHub pull request")

  // Build metadata
  const metadata: Record<string, string | number> = {
    githubType: "pr",
    owner,
    repo,
    prNumber,
    state: pr.state,
    merged: pr.merged ? "true" : "false",
    author,
    additions: pr.additions,
    deletions: pr.deletions,
    changedFiles: pr.changed_files,
    createdAt: pr.created_at,
  }
  if (labels.length > 0) {
    metadata.labels = labels.join(",")
  }

  return {
    summary: llmResult.summary || null,
    entities: llmResult.entities,
    topics: llmResult.topics,
    tags: llmResult.tags,
    metadata,
    processedAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// GitHub enrichment node
// ---------------------------------------------------------------------------

async function githubNode(
  state: EnrichmentSubgraphStateType,
): Promise<Partial<EnrichmentSubgraphStateType>> {
  const { bookmark } = state

  // Classify the GitHub URL to determine which enrichment path to use
  const classification = GitHubService.classifyGitHubUrl(bookmark.url)

  if (!classification) {
    // URL didn't match a classifiable pattern (bare github.com, user profile, etc.)
    return { result: emptyEnrichedData() }
  }

  let result: EnrichedData
  switch (classification.type) {
    case "repo":
      result = await enrichRepo(classification.owner, classification.repo)
      break

    case "issue":
      result = await enrichIssue(
        classification.owner,
        classification.repo,
        classification.number!,
      )
      break

    case "pr":
      result = await enrichPR(
        classification.owner,
        classification.repo,
        classification.number!,
      )
      break

    default:
      result = emptyEnrichedData()
  }

  return { result }
}

// ---------------------------------------------------------------------------
// YouTube enrichment — configuration
// ---------------------------------------------------------------------------

/**
 * Maximum transcript length (in characters) sent to the LLM.
 * Configurable via TRANSCRIPT_MAX_CHARS env var. Defaults to 80 000
 * (~20K tokens for most tokenizers), well within common context windows.
 */
const TRANSCRIPT_MAX_CHARS = parseInt(
  process.env.TRANSCRIPT_MAX_CHARS ?? "80000",
  10,
)

// ---------------------------------------------------------------------------
// YouTube enrichment — helper: create YouTubeService instance
// ---------------------------------------------------------------------------

function createYouTubeService(): YouTubeService {
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) {
    throw new Error(
      "youtubeNode: GOOGLE_API_KEY environment variable is required.",
    )
  }
  return new YouTubeService(apiKey)
}

// ---------------------------------------------------------------------------
// YouTube enrichment — helper: truncate transcript
// ---------------------------------------------------------------------------

function truncateTranscript(text: string, maxChars: number): string {
  if (text.length <= maxChars) {
    return text
  }
  return text.slice(0, maxChars) + "\n\n[Transcript truncated]"
}

// ---------------------------------------------------------------------------
// YouTube enrichment — video path
// ---------------------------------------------------------------------------

async function enrichVideo(
  url: string,
  videoId: string,
  bookmarkTitle: string | null,
): Promise<EnrichedData> {
  const yt = createYouTubeService()

  // Fetch video metadata from YouTube Data API (graceful — null on failure)
  let video: YouTubeVideoResource | null = null
  try {
    video = await yt.getVideo(videoId)
  } catch {
    // YouTube Data API may be disabled, quota exceeded, etc.
    // Continue with transcript-only or title-only enrichment.
  }
  const snippet = video?.snippet
  const stats = video?.statistics
  const contentDetails = video?.contentDetails

  const title = snippet?.title ?? bookmarkTitle ?? "Unknown video"
  const description = snippet?.description ?? ""

  // Attempt to load transcript
  let transcript: string | null = null
  let transcriptAvailable = false

  try {
    const loader = YoutubeLoader.createFromUrl(url, {
      language: "en",
      addVideoInfo: false,
    })
    const docs = await loader.load()
    const rawTranscript = docs.map((d) => d.pageContent).join("\n")
    if (rawTranscript.trim()) {
      transcript = truncateTranscript(rawTranscript, TRANSCRIPT_MAX_CHARS)
      transcriptAvailable = true
    }
  } catch {
    // Transcript loading failed (disabled captions, private video, etc.)
    // Fall back to title + description enrichment
  }

  // Build content string for LLM
  const contentParts: string[] = [`Title: ${title}`]
  if (transcript) {
    contentParts.push("", "Transcript:", transcript)
  } else {
    // Fallback: enrich from title + description only
    if (description) {
      contentParts.push("", "Description:", description)
    }
  }
  const content = contentParts.join("\n")

  // Call LLM for enrichment
  const llmResult = await enrichContent(content, "YouTube video transcript")

  // Build metadata
  const metadata: Record<string, string | number> = {
    videoId,
    title,
    transcriptAvailable: transcriptAvailable ? "true" : "false",
  }

  if (snippet?.channelTitle) {
    metadata.channelTitle = snippet.channelTitle
  }
  if (snippet?.publishedAt) {
    metadata.publishedAt = snippet.publishedAt
  }
  if (stats?.viewCount) {
    metadata.viewCount = stats.viewCount
  }
  if (stats?.likeCount) {
    metadata.likeCount = stats.likeCount
  }
  if (contentDetails?.duration) {
    const { totalSeconds, formatted } = parseDuration(contentDetails.duration)
    metadata.duration = formatted
    metadata.durationSeconds = totalSeconds
  }

  return {
    summary: llmResult.summary || null,
    entities: llmResult.entities,
    topics: llmResult.topics,
    tags: llmResult.tags,
    metadata,
    processedAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// YouTube enrichment — channel path
// ---------------------------------------------------------------------------

async function enrichChannel(channelIdentifier: string): Promise<EnrichedData> {
  const yt = createYouTubeService()

  // Resolve channel — by handle or by ID
  let channel: YouTubeChannelResource | null = null
  if (channelIdentifier.startsWith("@")) {
    channel = await yt.getChannelByHandle(channelIdentifier)
  } else {
    channel = await yt.getChannel(channelIdentifier)
  }

  const snippet = channel?.snippet
  const stats = channel?.statistics

  const title = snippet?.title ?? channelIdentifier
  const description = snippet?.description ?? ""

  // Build content for LLM
  const contentParts: string[] = [`Channel: ${title}`]
  if (description) {
    contentParts.push("", "Description:", description)
  }
  if (stats?.subscriberCount) {
    contentParts.push("", `Subscribers: ${stats.subscriberCount}`)
  }
  if (stats?.videoCount) {
    contentParts.push(`Videos: ${stats.videoCount}`)
  }
  const content = contentParts.join("\n")

  // Call LLM for enrichment
  const llmResult = await enrichContent(content, "YouTube channel")

  // Build metadata
  const metadata: Record<string, string | number> = {
    channelTitle: title,
  }

  if (channel?.id) {
    metadata.channelId = channel.id
  }
  if (snippet?.customUrl) {
    metadata.customUrl = snippet.customUrl
  }
  if (snippet?.publishedAt) {
    metadata.publishedAt = snippet.publishedAt
  }
  if (snippet?.country) {
    metadata.country = snippet.country
  }
  if (stats?.subscriberCount) {
    metadata.subscriberCount = stats.subscriberCount
  }
  if (stats?.videoCount) {
    metadata.videoCount = stats.videoCount
  }
  if (stats?.viewCount) {
    metadata.viewCount = stats.viewCount
  }

  return {
    summary: llmResult.summary || null,
    entities: llmResult.entities,
    topics: llmResult.topics,
    tags: llmResult.tags,
    metadata,
    processedAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// YouTube enrichment — playlist path
// ---------------------------------------------------------------------------

async function enrichPlaylist(playlistId: string): Promise<EnrichedData> {
  const yt = createYouTubeService()

  // Fetch playlist metadata and first batch of items
  const [playlist, itemsResponse] = await Promise.all([
    yt.getPlaylist(playlistId),
    yt.getPlaylistItems(playlistId, 25),
  ])

  const snippet = playlist?.snippet
  const itemCount = playlist?.contentDetails?.itemCount ?? 0

  const title = snippet?.title ?? "Unknown playlist"
  const description = snippet?.description ?? ""

  // Collect video titles from playlist items
  const videoTitles = itemsResponse.items
    .map((item) => item.snippet?.title)
    .filter((t): t is string => !!t)

  // Build content for LLM
  const contentParts: string[] = [`Playlist: ${title}`]
  if (description) {
    contentParts.push("", "Description:", description)
  }
  if (videoTitles.length > 0) {
    contentParts.push("", "Videos in playlist:")
    videoTitles.forEach((vt, i) => {
      contentParts.push(`${i + 1}. ${vt}`)
    })
  }
  const content = contentParts.join("\n")

  // Call LLM for enrichment
  const llmResult = await enrichContent(content, "YouTube playlist")

  // Build metadata
  const metadata: Record<string, string | number> = {
    playlistId,
    title,
    itemCount,
  }

  if (snippet?.channelTitle) {
    metadata.channelTitle = snippet.channelTitle
  }
  if (snippet?.publishedAt) {
    metadata.publishedAt = snippet.publishedAt
  }

  return {
    summary: llmResult.summary || null,
    entities: llmResult.entities,
    topics: llmResult.topics,
    tags: llmResult.tags,
    metadata,
    processedAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// YouTube enrichment node
// ---------------------------------------------------------------------------

async function youtubeNode(
  state: EnrichmentSubgraphStateType,
): Promise<Partial<EnrichmentSubgraphStateType>> {
  const { bookmark } = state

  // Classify the YouTube URL to determine which enrichment path to use
  const classification = YouTubeService.classifyYouTubeUrl(bookmark.url)

  if (!classification) {
    // URL didn't match any known YouTube pattern — return empty result
    return { result: emptyEnrichedData() }
  }

  let result: EnrichedData
  switch (classification.type) {
    case "video":
      result = await enrichVideo(
        bookmark.url,
        classification.id,
        bookmark.title,
      )
      break

    case "channel":
      result = await enrichChannel(classification.id)
      break

    case "playlist":
      result = await enrichPlaylist(classification.id)
      break

    default:
      result = emptyEnrichedData()
  }

  return { result }
}

// ---------------------------------------------------------------------------
// Article enrichment node
// ---------------------------------------------------------------------------

async function articleNode(
  state: EnrichmentSubgraphStateType,
): Promise<Partial<EnrichmentSubgraphStateType>> {
  const { bookmark } = state

  try {
    const extracted = await ArticleService.extract(bookmark.url)

    // Build metadata
    const metadata: Record<string, string | number> = {}
    if (extracted.title) metadata.title = extracted.title
    if (extracted.byline) metadata.author = extracted.byline
    if (extracted.siteName) metadata.siteName = extracted.siteName
    if (extracted.publishedTime) metadata.publishedAt = extracted.publishedTime
    if (extracted.lang) metadata.language = extracted.lang
    if (extracted.ogImage) metadata.ogImage = extracted.ogImage
    metadata.wordCount = extracted.wordCount
    metadata.readingTimeMinutes = extracted.readingTimeMinutes

    // If no content was extracted, return thin metadata-only enrichment
    if (!extracted.content || !extracted.content.trim()) {
      return {
        result: {
          summary: extracted.excerpt || null,
          entities: [],
          topics: [],
          tags: [],
          metadata,
          processedAt: new Date().toISOString(),
        },
      }
    }

    // Full LLM enrichment
    try {
      const llmResult = await enrichContent(extracted.content, "article")

      return {
        result: {
          summary: llmResult.summary || null,
          entities: llmResult.entities,
          topics: llmResult.topics,
          tags: llmResult.tags,
          metadata,
          processedAt: new Date().toISOString(),
        },
      }
    } catch {
      // LLM failed — return metadata + Readability excerpt
      return {
        result: {
          summary: extracted.excerpt || null,
          entities: [],
          topics: [],
          tags: [],
          metadata,
          processedAt: new Date().toISOString(),
        },
      }
    }
  } catch (err) {
    if (err instanceof UnsupportedContentError) {
      // Non-HTML content — return unsupported marker
      return {
        result: {
          summary: null,
          entities: [],
          topics: [],
          tags: [],
          metadata: { unsupported: "true" },
          processedAt: new Date().toISOString(),
        },
      }
    }

    // Fetch errors and other failures — re-throw for processor to handle
    throw err
  }
}

async function genericNode(
  _state: EnrichmentSubgraphStateType,
): Promise<Partial<EnrichmentSubgraphStateType>> {
  // TODO: Generic web page enrichment (fetch, extract, summarize)
  return { result: emptyEnrichedData() }
}

// ---------------------------------------------------------------------------
// Compile the enrichment subgraph with conditional routing
// ---------------------------------------------------------------------------

const ROUTE_MAP = {
  github: "github",
  youtube: "youtube",
  article: "article",
  generic: "generic",
} as const

export const enrichmentGraph = new StateGraph(EnrichmentSubgraphState)
  // Source-specific nodes
  .addNode("github", githubNode)
  .addNode("youtube", youtubeNode)
  .addNode("article", articleNode)
  .addNode("generic", genericNode)
  // Route from __start__ to the correct node
  .addConditionalEdges("__start__", routeNode, ROUTE_MAP)
  // All enrichment nodes flow to __end__
  .addEdge("github", "__end__")
  .addEdge("youtube", "__end__")
  .addEdge("article", "__end__")
  .addEdge("generic", "__end__")
  .compile()

// ---------------------------------------------------------------------------
// Exports for testing
// ---------------------------------------------------------------------------

export {
  README_MAX_CHARS as _README_MAX_CHARS,
  TRANSCRIPT_MAX_CHARS as _TRANSCRIPT_MAX_CHARS,
  articleNode as _articleNode,
  enrichChannel as _enrichChannel,
  enrichIssue as _enrichIssue,
  enrichPR as _enrichPR,
  enrichPlaylist as _enrichPlaylist,
  enrichRepo as _enrichRepo,
  enrichVideo as _enrichVideo,
  githubNode as _githubNode,
  truncateReadme as _truncateReadme,
  truncateTranscript as _truncateTranscript,
}
