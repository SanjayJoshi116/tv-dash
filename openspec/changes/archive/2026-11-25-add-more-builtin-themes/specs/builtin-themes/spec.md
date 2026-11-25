## Purpose

Defines which named themes the dashboard offers and the minimum readability every named theme guarantees, so new themes can be added without hurting legibility.

## ADDED Requirements

### Requirement: Available named themes
The theme selector SHALL offer the named themes Default Dark, Default Light, Dracula, High Contrast, OLED Black, Nord and Solarized Light, in that order (after "System" when that option exists). Each SHALL be selectable, applied to the whole dashboard immediately, and restored on the next visit.

#### Scenario: Choose Nord
- **WHEN** the user selects Nord
- **THEN** the dashboard uses Nord's colors and Nord is active after a reload

#### Scenario: Existing saved theme
- **WHEN** a user had Dracula saved before this change
- **THEN** Dracula is still active

### Requirement: Readability of every named theme
Every named theme SHALL have 10 distinct chart colors, body text with a contrast ratio of at least 4.5:1 against its content background, and every chart color at least 3:1 against its content background.

#### Scenario: New theme fails contrast
- **WHEN** a named theme's chart color has less than 3:1 contrast against its content background
- **THEN** the automated theme check fails

### Requirement: High Contrast theme
The High Contrast theme SHALL use body text with at least 7:1 contrast and chart colors and borders with at least 4.5:1 contrast against its content background.

#### Scenario: High Contrast check
- **WHEN** the automated theme check runs on High Contrast
- **THEN** text is ≥ 7:1 and every chart color and the border color are ≥ 4.5:1 against the content background

### Requirement: OLED Black uses true black surfaces
The OLED Black theme SHALL use pure black (`#000000`) for the page content and header backgrounds.

#### Scenario: OLED surfaces
- **WHEN** OLED Black is active
- **THEN** the content and header backgrounds are `#000000`

### Requirement: System option unaffected
When "System" is selected, the resolved theme SHALL remain Default Dark or Default Light; the new themes SHALL be used only when chosen explicitly.

#### Scenario: System on a dark OS
- **WHEN** "System" is selected and the OS prefers dark
- **THEN** Default Dark is used, not OLED Black or High Contrast
