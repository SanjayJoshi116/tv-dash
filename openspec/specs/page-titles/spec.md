# page-titles Specification

## Purpose

Gives every route a meaningful title in both the app header and the browser tab, so history, bookmarks and open tabs identify the page (and the show) the user is looking at.

## Requirements

### Requirement: Route-specific browser tab title
The browser tab title SHALL be `<page title> · TV Dashboard`, where the page title is "Dashboard" for `/`, "Shows" for `/shows`, "Statistics" for `/stats` and "Page not found" for any URL that matches no route. Trailing slashes SHALL NOT change the title.

#### Scenario: Navigating between pages
- **WHEN** the user navigates from `/` to `/stats`
- **THEN** the tab title changes from "Dashboard · TV Dashboard" to "Statistics · TV Dashboard"

#### Scenario: Trailing slash
- **WHEN** the user opens `/shows/`
- **THEN** the tab title is "Shows · TV Dashboard"

#### Scenario: Unknown URL
- **WHEN** the user opens `/does-not-exist`
- **THEN** the tab title is "Page not found · TV Dashboard"

### Requirement: Show Detail title uses the show name
On `/shows/:id`, the page title SHALL be the series name once data has loaded and the ID matches a show; "Show Detail" while data is loading; and "Show not found" when data has loaded (or failed) and no show matches the ID.

#### Scenario: Known show
- **WHEN** the user opens the detail page of a show named "Severance"
- **THEN** the tab title is "Severance · TV Dashboard" and the header reads "Severance"

#### Scenario: Navigating between shows
- **WHEN** the user goes from one show's detail page to another's
- **THEN** both the tab title and the header update to the new show's name

#### Scenario: Unknown show ID
- **WHEN** the user opens `/shows/999999` and no show has that ID
- **THEN** the tab title is "Show not found · TV Dashboard"

#### Scenario: Data still loading
- **WHEN** the detail page is opened and data has not loaded yet
- **THEN** the tab title is "Show Detail · TV Dashboard"

### Requirement: Header and tab title agree
The header title SHALL always equal the page title used in the browser tab title (without the " · TV Dashboard" suffix).

#### Scenario: Any route
- **WHEN** any page is displayed
- **THEN** the header text equals the tab title minus " · TV Dashboard"
