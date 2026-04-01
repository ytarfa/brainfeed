## ADDED Requirements

### Requirement: FilterProvider manages filter and sort state via URL
The `FilterProvider` component SHALL own all filter and sort state and synchronize it bidirectionally with URL search params via `useSearchParams`. All child components SHALL access state through `useFilterContext()`.

#### Scenario: Initial load with no URL params
- **WHEN** a page with `FilterProvider` loads with no search params in the URL
- **THEN** the filter state SHALL use the defaults provided to `FilterProvider` (no source filter, no tag filter, default sort and order)

#### Scenario: Initial load with URL params
- **WHEN** a page loads with `?source=github&tags=react,typescript&sort=title&order=asc`
- **THEN** `FilterProvider` SHALL initialize state with source type `github`, tags `["react", "typescript"]`, sort `title`, order `asc`

#### Scenario: Updating a filter updates the URL
- **WHEN** a user selects a source type filter (e.g., "github")
- **THEN** the URL search params SHALL update to include `source=github` without a full page reload

#### Scenario: Browser back button restores filter state
- **WHEN** a user changes filters and then presses the browser back button
- **THEN** the filter state SHALL revert to the previous URL's filter values

#### Scenario: Clear all resets URL and state
- **WHEN** a user clicks "Clear all" on active filters
- **THEN** all filter and sort params SHALL be removed from the URL and state SHALL return to defaults

### Requirement: FilterProvider exposes server params and client filter
The `FilterProvider` SHALL expose `serverParams` (an object with `type`, `sort`, `order` suitable for passing to API hooks) and `filterByTags` (a function that filters a bookmark array by the selected tags using AND logic).

#### Scenario: Server params reflect source type and sort
- **WHEN** source type is set to "youtube" and sort is "title" with order "asc"
- **THEN** `serverParams` SHALL equal `{ type: "youtube", sort: "title", order: "asc" }`

#### Scenario: Server params omit type when no source filter
- **WHEN** no source type filter is active
- **THEN** `serverParams` SHALL NOT include the `type` property

#### Scenario: Client-side tag filtering uses AND logic
- **WHEN** tags `["react", "typescript"]` are selected and `filterByTags` is called with a bookmark array
- **THEN** only bookmarks that have BOTH "react" AND "typescript" in their tags SHALL be returned

#### Scenario: No tags selected means no filtering
- **WHEN** no tags are selected and `filterByTags` is called
- **THEN** the full bookmark array SHALL be returned unfiltered

### Requirement: FilterBar.SourcePills renders source type filter
The `FilterBar.SourcePills` sub-component SHALL render horizontal pill-shaped buttons for each source type, plus an "All" option. Only one source type can be selected at a time.

#### Scenario: All sources shown with All option
- **WHEN** `FilterBar.SourcePills` renders
- **THEN** it SHALL display an "All" pill and one pill for each source type: GitHub, YouTube, Article, Instagram, Generic

#### Scenario: Selecting a source type
- **WHEN** a user clicks the "GitHub" pill
- **THEN** the "GitHub" pill SHALL appear selected, "All" SHALL appear deselected, and the source filter SHALL update to "github"

#### Scenario: Selecting All clears source filter
- **WHEN** a user clicks the "All" pill
- **THEN** the source filter SHALL be cleared and "All" SHALL appear selected

#### Scenario: Default state is All
- **WHEN** no source filter is in the URL
- **THEN** the "All" pill SHALL appear selected

### Requirement: FilterBar.TagSelect renders multi-select tag dropdown
The `FilterBar.TagSelect` sub-component SHALL render a dropdown that allows selecting multiple tags. Selected tags SHALL appear as removable chips.

#### Scenario: Dropdown shows available tags
- **WHEN** a user opens the tag dropdown
- **THEN** it SHALL display all tags returned by the `useTags` hook as checkable options

#### Scenario: Selecting a tag
- **WHEN** a user checks a tag in the dropdown
- **THEN** the tag SHALL be added to the selected tags, a chip SHALL appear, and the URL SHALL update

#### Scenario: Removing a tag via chip
- **WHEN** a user clicks the remove button on a tag chip
- **THEN** the tag SHALL be removed from the selected tags and the URL SHALL update

#### Scenario: Hidden when no tags available
- **WHEN** the `useTags` hook returns an empty array
- **THEN** `FilterBar.TagSelect` SHALL NOT render

### Requirement: FilterBar.Sort renders sort dropdown
The `FilterBar.Sort` sub-component SHALL render a dropdown for selecting the sort field and order, replacing the Library page's existing inline sort `<select>`.

#### Scenario: Sort options displayed
- **WHEN** a user opens the sort dropdown
- **THEN** it SHALL display options: "Date saved", "Title", "Source"

#### Scenario: Changing sort
- **WHEN** a user selects "Title" from the sort dropdown
- **THEN** the sort SHALL update to "title" and the URL SHALL reflect `sort=title`

#### Scenario: Default sort
- **WHEN** no sort param is in the URL
- **THEN** the sort SHALL default to "created_at" with order "desc"

### Requirement: FilterBar.ActiveFilters shows summary of active filters
The `FilterBar.ActiveFilters` sub-component SHALL display a summary row of all active filters with a "Clear all" action. It SHALL only render when at least one non-default filter is active.

#### Scenario: Active filters displayed
- **WHEN** source is "github" and tags are ["react"]
- **THEN** the active filters row SHALL show chips for "GitHub" and "react" with a "Clear all" button

#### Scenario: Hidden when no active filters
- **WHEN** all filters are at their default values
- **THEN** `FilterBar.ActiveFilters` SHALL NOT render

#### Scenario: Removing individual filter from active summary
- **WHEN** a user clicks the remove button on the "GitHub" chip in the active filters row
- **THEN** the source filter SHALL be cleared and the chip SHALL disappear

### Requirement: FilterBar is a layout container
The `FilterBar` component SHALL act as a flex-row layout container for its sub-components. It SHALL apply consistent spacing and alignment.

#### Scenario: Renders children in a row
- **WHEN** `FilterBar` contains `SourcePills`, `TagSelect`, and `Sort`
- **THEN** they SHALL render in a horizontal row with consistent gap spacing

### Requirement: Library page uses FilterProvider and FilterBar
The Library page SHALL be refactored to use `FilterProvider` and `FilterBar` instead of its inline sort `<select>`. It SHALL pass `serverParams` to `useBookmarks` and apply `filterByTags` to the results.

#### Scenario: Library renders with filter bar
- **WHEN** a user navigates to `/library`
- **THEN** the FilterBar SHALL appear above the bookmark grid with source pills, tag select (if tags exist), and sort dropdown

#### Scenario: Filtering bookmarks by source type
- **WHEN** a user selects "YouTube" on the Library page
- **THEN** only YouTube bookmarks SHALL be displayed (fetched from API with `type=youtube`)

#### Scenario: Filtering bookmarks by tags
- **WHEN** a user selects tags "react" and "typescript"
- **THEN** only bookmarks that have BOTH tags SHALL be displayed

#### Scenario: Sort replaces old select
- **WHEN** the Library page renders
- **THEN** the old inline `<select>` for sorting SHALL NOT be present; the `FilterBar.Sort` component SHALL handle sorting
