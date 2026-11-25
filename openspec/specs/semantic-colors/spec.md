# semantic-colors Specification

## Purpose

Keeps value-driven colors (good / medium / poor ratings and completion) consistent with the active theme and readable, so the color meaning survives every theme without sacrificing contrast.

## Requirements

### Requirement: Tier colors come from the active theme
Ratings SHALL be colored good (≥ 8), medium (≥ 6) or poor (< 6), and completion percentages good (≥ 75), medium (≥ 40) or poor (< 40), using the active theme's success, warning and danger colors respectively. Switching theme SHALL recolor them. An unknown rating SHALL have no tier color.

#### Scenario: Rating in Default Light
- **WHEN** Default Light is active and a show rated 8.4 is shown
- **THEN** its rating uses Default Light's success color

#### Scenario: Theme switch
- **WHEN** the user switches from Default Light to Dracula while a rating is visible
- **THEN** the rating's color changes to Dracula's color for the same tier

#### Scenario: Unknown rating
- **WHEN** a show has no rating
- **THEN** no tier color is applied and the rating displays as "–"

### Requirement: Tier colors are readable on the page background
In every theme, the success, warning and danger colors SHALL have a contrast ratio of at least 3:1 against the theme's content background.

#### Scenario: Every theme
- **WHEN** the theme definitions are checked
- **THEN** each tier color meets 3:1 against that theme's content background

### Requirement: Rating badge text is readable
Text displayed on a tier-colored badge (such as the rating badge on show cards and Show Detail) SHALL use the theme's text-on-fill color for that tier, with a contrast ratio of at least 4.5:1 against the fill.

#### Scenario: Medium rating badge in a dark theme
- **WHEN** a show rated 6.8 is shown on a show card in Default Dark
- **THEN** the badge text meets 4.5:1 contrast against the badge's warning fill

#### Scenario: Every theme and tier
- **WHEN** the theme definitions are checked
- **THEN** each tier's text-on-fill color meets 4.5:1 against its fill

### Requirement: Rating star color follows the theme
The small star icon next to ratings in compact lists SHALL use the active theme's star color, which SHALL be the same for every rating (not tier-colored).

#### Scenario: Compact list star
- **WHEN** the Dashboard "Recently Watched" list is shown in Dracula
- **THEN** every rating star uses Dracula's star color
