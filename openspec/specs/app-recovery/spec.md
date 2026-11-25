# app-recovery Specification

## Purpose

Ensures a failure in the app shell never leaves a blank page: the user always sees what went wrong and has a way to recover, including clearing saved state that may be causing the failure.

## Requirements

### Requirement: Shell failures show a recovery screen
If rendering fails outside a page (in the app shell, its providers or the router), the dashboard SHALL replace the whole app with a recovery screen instead of a blank page. The screen SHALL show a short explanation and the error message as plain text, SHALL be legible in both light and dark OS color schemes, and SHALL NOT depend on the app's theme or component library.

#### Scenario: Shell component throws
- **WHEN** a component above the page level throws during render
- **THEN** a recovery screen with the error message, a "Reload" button and a "Reset saved settings" button is shown

#### Scenario: Page component throws
- **WHEN** a page throws during render
- **THEN** the existing in-page error message is shown inside the normal layout (the recovery screen is not used)

### Requirement: Reload from the recovery screen
The recovery screen's "Reload" action SHALL reload the current URL without changing saved settings.

#### Scenario: Reload
- **WHEN** the user clicks "Reload"
- **THEN** the page reloads at the same URL and saved settings are unchanged

### Requirement: Reset saved settings
The "Reset saved settings" action SHALL clear all dashboard settings stored in the browser (theme, Shows filters, sidebar state) and then reload the app.

#### Scenario: Reset from the recovery screen
- **WHEN** the user clicks "Reset saved settings"
- **THEN** saved settings are cleared and the app reloads with default settings

### Requirement: URL reset escape hatch
When the app is opened with a `reset` query parameter, it SHALL clear all saved dashboard settings before rendering, then remove the `reset` parameter from the address bar while keeping the rest of the URL, without adding a history entry. Clearing SHALL NOT fail the load when browser storage is unavailable.

#### Scenario: Opening a reset link
- **WHEN** the user opens `/shows?reset`
- **THEN** the Shows page loads with default filters and theme, and the address bar shows `/shows`

#### Scenario: Other query parameters are kept
- **WHEN** the user opens `/shows?reset&foo=1`
- **THEN** the address bar afterwards shows `/shows?foo=1`

#### Scenario: Storage blocked
- **WHEN** the app is opened with `?reset` and browser storage access throws
- **THEN** the app still loads normally
