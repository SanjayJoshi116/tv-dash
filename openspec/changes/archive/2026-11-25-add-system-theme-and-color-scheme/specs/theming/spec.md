## Purpose

Defines how the dashboard chooses its active theme (following the operating system or an explicit user choice), remembers that choice, and applies it to the whole document from the very first paint.

## ADDED Requirements

### Requirement: System theme option
The theme selector SHALL offer a "System" option, listed first, alongside the named themes. While "System" is selected, the active theme SHALL be Default Dark when the operating system prefers a dark color scheme and Default Light otherwise.

#### Scenario: OS prefers dark
- **WHEN** "System" is selected and the OS color-scheme preference is dark
- **THEN** the dashboard renders with the Default Dark theme

#### Scenario: OS prefers light
- **WHEN** "System" is selected and the OS color-scheme preference is light
- **THEN** the dashboard renders with the Default Light theme

### Requirement: System theme follows OS changes live
While "System" is selected, the dashboard SHALL switch between Default Dark and Default Light when the OS color-scheme preference changes, without a reload. While a named theme is selected, OS changes SHALL have no effect.

#### Scenario: OS switches while System is selected
- **WHEN** "System" is selected and the OS preference changes from light to dark
- **THEN** the dashboard switches to Default Dark without reloading

#### Scenario: OS switches while a named theme is selected
- **WHEN** "Dracula" is selected and the OS preference changes
- **THEN** the dashboard stays on Dracula

### Requirement: Default and persisted theme choice
When no theme choice is saved, or the saved value is not "System" or a known theme name, the dashboard SHALL use "System". A choice made in the theme selector (including "System") SHALL be saved and restored on the next visit.

#### Scenario: First visit
- **WHEN** a user opens the dashboard with no saved settings
- **THEN** "System" is selected and the theme matches the OS preference

#### Scenario: Saved named theme
- **WHEN** a user previously chose "Dracula" and reopens the dashboard
- **THEN** Dracula is active regardless of the OS preference

#### Scenario: Corrupt saved value
- **WHEN** the saved theme value is an unknown name or not a string
- **THEN** "System" is used

### Requirement: Document uses the theme's native color scheme and background
The document root SHALL declare the active theme's native color scheme (dark for dark themes, light otherwise) and use the theme's content background color, and SHALL update both whenever the active theme changes.

#### Scenario: Dark theme
- **WHEN** Default Dark or Dracula is active
- **THEN** the document's computed color scheme is dark and its background is that theme's content background

#### Scenario: Theme change
- **WHEN** the user switches from Dracula to Default Light
- **THEN** the document's color scheme becomes light and its background becomes Default Light's content background

### Requirement: First paint matches the theme
Before the application script has loaded, the document SHALL already show the color scheme and background of the theme that will be active (the saved theme, or the OS-resolved theme for "System"). Unreadable or invalid saved settings SHALL fall back to the "System" resolution rather than failing.

#### Scenario: Saved light theme with slow app load
- **WHEN** Default Light is saved and the application script is delayed
- **THEN** the page background is already Default Light's content background before the app mounts

#### Scenario: Storage unavailable
- **WHEN** reading saved settings throws (storage blocked)
- **THEN** the page still loads, using the OS-resolved theme for first paint
