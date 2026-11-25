## Purpose

Loads page code ahead of navigation where it makes the next page appear instantly, while respecting users on constrained or metered connections.

## ADDED Requirements

### Requirement: Idle prefetch respects constrained connections
After the app has loaded and the browser is idle, the dashboard SHALL prefetch the code of all pages, unless the browser reports Data Saver enabled or an effective connection type of 2G or slow-2G, in which case it SHALL NOT prefetch at idle. When connection information is unavailable, idle prefetch SHALL proceed.

#### Scenario: Normal connection
- **WHEN** the dashboard loads on a connection without Data Saver
- **THEN** the code for the other pages is fetched once the browser is idle

#### Scenario: Data Saver
- **WHEN** the dashboard loads with Data Saver enabled
- **THEN** no other page's code is fetched until the user shows intent to navigate

### Requirement: Navigation intent prefetches the target page
Hovering or keyboard-focusing a navigation item, or starting a touch on a mobile navigation item, SHALL start loading that page's code if it is not loaded yet, regardless of connection settings.

#### Scenario: Hover the Statistics menu item
- **WHEN** Data Saver is enabled and the user hovers "Statistics" in the sidebar
- **THEN** the Statistics page code is fetched before the user clicks

### Requirement: Show intent prefetches Show Detail
Hovering or keyboard-focusing a show card on the Shows page, or a show entry on the Dashboard, SHALL start loading the Show Detail page code if it is not loaded yet.

#### Scenario: Hover a show card
- **WHEN** the Show Detail code is not loaded and the user hovers a show card
- **THEN** the Show Detail code is fetched, and opening the show shows no loading spinner for the page code

### Requirement: Each page's code is fetched at most once
Repeated prefetch triggers for the same page SHALL NOT cause additional network requests, and a failed prefetch SHALL NOT show an error; the error, if it persists, appears only on actual navigation.

#### Scenario: Hovering many cards
- **WHEN** the user hovers ten different show cards
- **THEN** the Show Detail code is requested at most once

#### Scenario: Prefetch fails
- **WHEN** a prefetch request fails
- **THEN** no error is shown until the user navigates to that page
