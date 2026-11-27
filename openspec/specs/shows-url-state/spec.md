# shows-url-state Specification

## Purpose

Makes the Shows list addressable: its filters, sort and page live in the URL, so filtered views can be shared, bookmarked and undone with browser Back, and returning from a show lands where the user left.

## Requirements

### Requirement: Shows filters and page are reflected in the URL
The Shows page SHALL keep its search text, selected genres, status, sort order, page number and page size in the URL query string. Values equal to their default SHALL be omitted, so the unfiltered first page is plain `/shows`.

#### Scenario: Filter appears in the URL
- **WHEN** the user selects the genre "Drama" and sorts by rating on the Shows page
- **THEN** the URL contains the genre "Drama" and the rating sort, and no parameter for search, status, page or page size

#### Scenario: Shared link opens the same view
- **WHEN** a user opens a copied Shows URL containing the genre "Crime" and page 2 in a fresh tab
- **THEN** the Shows page shows page 2 of the Crime shows

### Requirement: URL filters take precedence over saved filters
When the Shows URL contains any filter parameter, the page SHALL show exactly the filters in the URL and ignore saved filters. When it contains none, the page SHALL apply the saved filters and update the URL to match without adding a history entry.

#### Scenario: Link overrides saved filters
- **WHEN** saved filters select "Comedy" and the user opens a Shows URL selecting "Crime"
- **THEN** only "Crime" is selected

#### Scenario: Saved filters fill an empty URL
- **WHEN** saved filters select "Comedy" and the user opens `/shows`
- **THEN** "Comedy" is selected, the URL shows it, and Back returns to the previous page rather than to `/shows` without filters

### Requirement: History follows filter changes
Changing a genre, status, sort, page or page size, or clearing filters, SHALL add a browser history entry, so Back restores the previous view. Typing in the search field SHALL NOT add a history entry per keystroke.

#### Scenario: Back undoes a filter
- **WHEN** the user selects "Drama" and then presses Back
- **THEN** the Shows page shows the list without the "Drama" filter

#### Scenario: Typing doesn't flood history
- **WHEN** the user types "breaking" into the search field and presses Back
- **THEN** the browser leaves the Shows search view as one step, not one letter at a time

### Requirement: Invalid URL values fall back safely
Unknown sort values, non-positive or non-integer pages, unsupported page sizes, and genres or statuses that don't occur in the data SHALL be replaced by their defaults (or dropped), and the URL SHALL be corrected without adding a history entry. URL values SHALL only be displayed as text.

#### Scenario: Stale genre in a bookmark
- **WHEN** the user opens a Shows URL with a genre that no show has
- **THEN** that genre is not selected and is removed from the URL

#### Scenario: Out-of-range page
- **WHEN** the user opens a Shows URL with page 999 for a list that has 3 pages
- **THEN** the last page is shown

### Requirement: Back and Forward restore scroll position
Returning to a page with Back or Forward SHALL restore the scroll position it had in that history entry. Any other navigation SHALL show the new page scrolled to the top.

#### Scenario: Return from a show
- **WHEN** the user scrolls down page 3 of the Shows list, opens a show, and presses Back
- **THEN** page 3 of the Shows list is shown at the same scroll position

#### Scenario: New navigation starts at the top
- **WHEN** the user is scrolled down on Shows and opens Statistics from the navigation
- **THEN** Statistics is shown scrolled to the top

### Requirement: Progress filter is part of the URL
The Shows URL SHALL carry the progress filter alongside the other filters, omitted when it is All. An unknown progress value SHALL fall back to All and be removed from the URL without adding a history entry.

#### Scenario: Progress in a shared link
- **WHEN** the user opens a Shows URL with the progress filter set to Not started
- **THEN** only not-started shows are listed and the progress filter shows Not started

#### Scenario: Unknown progress value
- **WHEN** the user opens a Shows URL with an unrecognized progress value
- **THEN** all shows are listed and the progress value is removed from the URL
