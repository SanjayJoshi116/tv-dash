## Purpose

Lets a link or test open the dashboard in a specific theme for one visit, without changing the visitor's saved theme choice.

## ADDED Requirements

### Requirement: Theme from the URL
When the page is opened with a `theme` query parameter whose value matches a theme selector option by name (ignoring case, after URL decoding), the dashboard SHALL use that theme, and the theme selector SHALL show it as selected.

#### Scenario: Named theme
- **WHEN** the user opens `/stats?theme=Dracula` with Default Light saved
- **THEN** the Statistics page renders in Dracula and the selector shows Dracula

#### Scenario: Encoded name, different case
- **WHEN** the user opens `/?theme=default%20light`
- **THEN** Default Light is used

### Requirement: Override is never saved
A theme applied from the URL SHALL NOT change the saved theme preference. Opening the dashboard later without the parameter SHALL use the previously saved (or default) theme.

#### Scenario: Visit without parameter afterwards
- **WHEN** the user opened `/?theme=Dracula` with Default Light saved, then later opens `/`
- **THEN** Default Light is used

### Requirement: Invalid override is ignored
An empty or unknown `theme` value SHALL be ignored, and the saved or default theme SHALL be used as if the parameter were absent. No error SHALL be shown.

#### Scenario: Unknown name
- **WHEN** the user opens `/?theme=Nope`
- **THEN** the saved or default theme is used and the page renders normally

### Requirement: Override lifetime
The override SHALL stay in effect while the user navigates within the dashboard, even after the parameter is no longer in the URL. Choosing a theme in the selector SHALL end the override: the chosen theme is applied and saved as usual.

#### Scenario: Navigate after override
- **WHEN** the user opened `/?theme=Dracula` and then clicks Shows in the navigation
- **THEN** the Shows page still renders in Dracula

#### Scenario: Pick a theme after override
- **WHEN** the user opened `/?theme=Dracula` and then selects Default Dark in the selector
- **THEN** Default Dark is applied and saved

### Requirement: First paint honors the override
Before the application script has loaded, the document SHALL already show the color scheme and background of the theme named by a valid override.

#### Scenario: Screenshot without flash
- **WHEN** the user opens `/?theme=Default+Light` with Default Dark saved and the application script is delayed
- **THEN** the page background is already Default Light's content background before the app mounts
