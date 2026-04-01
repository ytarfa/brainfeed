## ADDED Requirement: Instagram URL handler

The system SHALL implement an `InstagramHandler` that:
- Has `sourceType: "instagram"`
- `matches()` returns true when the URL hostname is `instagram.com`, `www.instagram.com`, or `m.instagram.com`
- `resolve()` extracts the `og:image` from OG metadata (if available) and returns `{ thumbnailUrl: og.image }`, or an empty object if OG image is not available
- The handler does NOT need to classify post vs reel — that is done by the enrichment worker

#### Scenario: Instagram post URL
- **WHEN** `matches()` is called with URL `https://www.instagram.com/p/DFnr9wdxJoI/`
- **THEN** it returns true
- **AND WHEN** `resolve()` is called with OG metadata containing `image: "https://scontent-*.cdninstagram.com/..."`
- **THEN** it returns `{ thumbnailUrl: "https://scontent-*.cdninstagram.com/..." }`

#### Scenario: Instagram reel URL
- **WHEN** `matches()` is called with URL `https://www.instagram.com/reel/DWiTx5IgYHE/`
- **THEN** it returns true

#### Scenario: Instagram IGTV URL
- **WHEN** `matches()` is called with URL `https://www.instagram.com/tv/ABC123/`
- **THEN** it returns true

#### Scenario: Instagram mobile URL
- **WHEN** `matches()` is called with URL `https://m.instagram.com/p/DFnr9wdxJoI/`
- **THEN** it returns true

#### Scenario: Instagram profile URL (also matched)
- **WHEN** `matches()` is called with URL `https://www.instagram.com/natgeo/`
- **THEN** it returns true (the handler matches all Instagram hostnames; unsupported sub-types fail at enrichment time)

#### Scenario: Instagram URL with no OG image
- **WHEN** `resolve()` is called and OG metadata has no `image` field (Instagram often returns no OG tags for posts)
- **THEN** it returns `{}` (empty object, no thumbnail override)

#### Scenario: Non-Instagram URL
- **WHEN** `matches()` is called with URL `https://www.example.com/p/something/`
- **THEN** it returns false

## MODIFIED Requirement: First-match-wins handler ordering

The system SHALL evaluate handlers in registration order and use the first handler where `matches()` returns true. Subsequent handlers SHALL NOT be evaluated after a match is found. The registration order SHALL be: YouTube, GitHub, Instagram, Article.

#### Scenario: Instagram handler takes priority over Article handler
- **WHEN** an Instagram URL is processed and the Instagram SSR page has `og:type: "article"`
- **THEN** the Instagram handler matches first and the Article handler is not evaluated
