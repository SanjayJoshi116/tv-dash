# settings-sync Specification

## Purpose

Keeps preferences consistent between several open dashboard tabs, without letting one tab overwrite work in progress in another.

## Requirements

### Requirement: Theme choice propagates to other tabs
When the theme choice is changed in one dashboard tab, every other open dashboard tab of the same site SHALL switch to that choice without a reload.

#### Scenario: Two tabs open
- **WHEN** the user selects Dracula in tab A while tab B is open
- **THEN** tab B switches to Dracula and its theme selector shows Dracula, without reloading

#### Scenario: System choice
- **WHEN** the user selects System in tab A
- **THEN** tab B also follows the OS preference

### Requirement: Invalid synced values are ignored
A theme value received from another tab that is not a valid choice, or settings that cannot be parsed, SHALL be ignored, leaving the receiving tab's current theme unchanged.

#### Scenario: Corrupt settings written externally
- **WHEN** another tab or tool writes unparseable dashboard settings
- **THEN** open tabs keep their current theme and show no error

### Requirement: Shows filters are not overwritten live
Saved Shows filters changed in one tab SHALL NOT change the filters of a Shows page already open in another tab; the other tab SHALL use the latest saved filters the next time its Shows page is opened without filter parameters in the URL. A Shows URL that contains filter parameters SHALL show those filters instead.

#### Scenario: Filtering in two tabs
- **WHEN** tab A and tab B both show the Shows page and the user filters by "Drama" in tab A
- **THEN** tab B's filters are unchanged until its Shows page is opened again at `/shows`, which then shows "Drama"

#### Scenario: Filtered link in the other tab
- **WHEN** the user filters by "Drama" in tab A and tab B then opens a Shows URL selecting "Crime"
- **THEN** tab B shows "Crime"

### Requirement: Saves in one tab don't revert another tab's changes
Saving one preference SHALL NOT revert a different preference saved meanwhile by another tab.

#### Scenario: Filter save after a theme change elsewhere
- **WHEN** tab B changes the theme and tab A then saves a filter change
- **THEN** the saved settings contain both tab B's theme and tab A's filters
