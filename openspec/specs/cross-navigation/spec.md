# cross-navigation Specification

## Purpose

Turns show attributes and Dashboard breakdowns into links to the matching Shows list, so browsing flows from one show or summary to related shows without retyping filters.

## Requirements

### Requirement: Show Detail attributes link to matching shows
On Show Detail, each genre SHALL link to the Shows list filtered to that genre, the status SHALL link to the Shows list filtered to that status, and each network, creator, actor and keyword SHALL link to the Shows list searched for that name. Creators SHALL be individual links, one per name.

#### Scenario: Genre tag
- **WHEN** the user activates the "Crime" genre tag on a show's detail page
- **THEN** the Shows page lists only Crime shows, with no other filter active

#### Scenario: Actor
- **WHEN** the user activates an actor's name on a show's detail page
- **THEN** the Shows page lists the shows matching that name, including the show the user came from

#### Scenario: Status
- **WHEN** the user activates the "Ended" status tag
- **THEN** the Shows page lists only Ended shows

### Requirement: Dashboard breakdowns link to matching shows
Each bar in the Dashboard's Top Genres list SHALL link to the Shows list filtered to that genre, and each bar in the Watch Status list SHALL link to the Shows list filtered to that status. The number of shows listed SHALL equal the count shown on the bar.

#### Scenario: Top Genres bar
- **WHEN** the user activates the "Drama" bar showing 85
- **THEN** the Shows page lists 85 Drama shows

### Requirement: Cross-navigation elements behave as links
Every cross-navigation element SHALL be reachable with the keyboard, show a visible focus indicator, open on Enter, and open in a new tab with the browser's usual new-tab gestures. Its accessible name SHALL say where it leads.

#### Scenario: Keyboard
- **WHEN** the user tabs to a keyword tag and presses Enter
- **THEN** the Shows page opens searched for that keyword

#### Scenario: New tab
- **WHEN** the user Ctrl-clicks or middle-clicks a genre tag
- **THEN** a new tab opens on the filtered Shows list and the current tab stays on the show

### Requirement: Data-derived links stay inside the app
A cross-navigation link SHALL always point to the app's own Shows page; a data value SHALL only appear encoded inside the query string, never in the path, host or scheme. A value containing characters such as `&`, `#`, `?`, `/` or `javascript:` SHALL arrive at the Shows page as the same literal text.

#### Scenario: Special characters
- **WHEN** the user activates the genre tag "Sci-Fi & Fantasy"
- **THEN** the Shows page is filtered to "Sci-Fi & Fantasy" exactly

#### Scenario: Hostile value
- **WHEN** a keyword in the data reads `javascript:alert(1)` and the user activates it
- **THEN** the Shows page opens with that text as the search, and no script runs
