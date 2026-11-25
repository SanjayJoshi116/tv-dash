## Purpose

Lets the dashboard be deployed under a sub-path (for example a project page at `/tv-dash/`) as well as at a domain root, with only a build setting changed and no code edits.

## ADDED Requirements

### Requirement: Works under a configured sub-path
When the app is built with a base path (e.g. `/tv-dash/`) and served from it, every page SHALL load its data and render as it does at the domain root, and in-app navigation SHALL keep URLs under the base path.

#### Scenario: Dashboard under sub-path
- **WHEN** the app built with base `/tv-dash/` is opened at `/tv-dash/`
- **THEN** the Dashboard renders with the CSV's shows and no request goes to `/tv_series.csv` at the domain root

#### Scenario: Navigate under sub-path
- **WHEN** the user clicks Shows in the navigation
- **THEN** the URL becomes `/tv-dash/shows`

#### Scenario: Deep link under sub-path
- **WHEN** the user opens `/tv-dash/shows/1` directly on a server that serves the app's entry page for unknown paths
- **THEN** that show's detail page renders

### Requirement: Root deployment unchanged
When built without a base path, the app SHALL behave exactly as before: served at `/`, data fetched from `/tv_series.csv`, routes at `/`, `/shows`, `/shows/:id`, `/stats`.

#### Scenario: Default build
- **WHEN** the app is built with default settings and opened at `/stats`
- **THEN** the Statistics page renders and the CSV is fetched from `/tv_series.csv`

### Requirement: Unknown paths outside the base
Paths under the base path that match no route SHALL show the not-found page, as at the root.

#### Scenario: Unknown route under sub-path
- **WHEN** the user opens `/tv-dash/nope`
- **THEN** the not-found page is shown inside the app shell
