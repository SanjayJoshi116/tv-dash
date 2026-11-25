## Purpose

Lets the dashboard be installed like an app and keep working without a network connection, while making sure users see fresh data when online and are offered new versions instead of having them swapped in silently.

## ADDED Requirements

### Requirement: Installable app
The production build SHALL provide a web app manifest with the app name, a start URL of the dashboard root, standalone display, and icons including a maskable icon, so that supporting browsers offer installation.

#### Scenario: Install prompt eligibility
- **WHEN** the production build is opened in a supporting browser
- **THEN** the page exposes a valid manifest with name, start URL, standalone display and 192px and 512px icons

### Requirement: App works offline after first visit
After one successful visit, the production build SHALL load and navigate between all pages without a network connection.

#### Scenario: Reload while offline
- **WHEN** the user has visited the dashboard once, goes offline and reloads
- **THEN** the dashboard loads, and Dashboard, Shows, Statistics and Show Detail all open

### Requirement: CSV is network-first with offline fallback
The show data SHALL be fetched from the network when it responds within a short timeout; otherwise the last successfully loaded copy SHALL be used. If no copy has ever been loaded, the existing load-error state SHALL be shown.

#### Scenario: Online
- **WHEN** the network is available and the CSV has changed since the last visit
- **THEN** the dashboard shows the new data

#### Scenario: Offline with a cached copy
- **WHEN** the network is unavailable and a copy was loaded before
- **THEN** the dashboard shows the cached data

#### Scenario: Offline on first visit
- **WHEN** the network is unavailable and no copy was ever loaded
- **THEN** the dashboard shows its load-error state with Retry

### Requirement: Offline notice
While the browser reports being offline, the dashboard SHALL show an unobtrusive notice that saved data is being displayed, and SHALL remove it when the connection returns.

#### Scenario: Going offline and back
- **WHEN** the connection drops while the dashboard is open, then returns
- **THEN** the notice appears while offline and disappears when back online

### Requirement: New versions are offered, not forced
When a newer version of the app becomes available while it is open, the dashboard SHALL keep running the current version and show a "New version available" message with a Reload action that activates the new version.

#### Scenario: Deploy while open
- **WHEN** a new build is deployed while the dashboard is open
- **THEN** a "New version available" message with "Reload" appears, and clicking it loads the new version

### Requirement: Browser UI color follows the theme
The page's theme color (used for browser and installed-app chrome) SHALL match the active theme's header background and update when the theme changes.

#### Scenario: Theme switch
- **WHEN** the user switches from Default Dark to Default Light
- **THEN** the page's theme color changes to Default Light's header background
