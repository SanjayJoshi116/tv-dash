## Purpose

Defines how the Shows list can be narrowed — including by watch progress — and how users recover when a filter combination matches nothing.

## ADDED Requirements

### Requirement: Progress filter
The Shows page SHALL offer a progress filter with the options All, Not started, In progress and Completed. A show SHALL count as Not started when no episode is watched, In progress when some but not all episodes are watched, and Completed when at least one episode is watched and watched episodes are not fewer than its total episodes. The progress filter SHALL combine with search, genres and status (all must match), SHALL appear among the active filters with a way to remove it, SHALL be saved with the other filters, and SHALL be cleared by resetting filters. Previously saved filters without a progress value SHALL load as All.

#### Scenario: Only shows in progress
- **WHEN** the user selects "In progress"
- **THEN** only shows with some but not all episodes watched are listed, and an "In progress" chip appears among the active filters

#### Scenario: Combined with a genre
- **WHEN** the user selects "Completed" and the genre "Drama"
- **THEN** only completed Drama shows are listed

#### Scenario: Older saved filters
- **WHEN** saved filters from an earlier version (no progress value) are loaded
- **THEN** the progress filter shows All and the other saved filters still apply

### Requirement: Empty result offers a way out
When the active filters match no show, the Shows page SHALL show a message and a "Clear filters" action that removes search, genre, status and progress filters while keeping the sort order.

#### Scenario: Clearing from the empty state
- **WHEN** the filters match no show and the user activates "Clear filters"
- **THEN** all shows are listed in the same sort order as before

### Requirement: Dashboard "View all" opens the matching list
The Dashboard's Not Started section SHALL link to the Shows page filtered to Not started, and the Continue Watching section SHALL offer a "View all" link to the Shows page filtered to In progress.

#### Scenario: Not Started view all
- **WHEN** the user activates "View all" on the Dashboard's Not Started section
- **THEN** the Shows page lists exactly the not-started shows

#### Scenario: Continue Watching view all
- **WHEN** the user activates "View all" on Continue Watching
- **THEN** the Shows page lists every in-progress show, not only the six shown on the Dashboard
