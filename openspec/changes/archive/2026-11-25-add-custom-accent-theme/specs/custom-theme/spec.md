## Purpose

Lets a user make the dashboard their own by choosing an accent color on a dark or light base, while keeping charts and text readable and remembering the choice.

## ADDED Requirements

### Requirement: Custom theme selection
The theme selector SHALL offer a "Custom" option. While Custom is selected, an accent color picker and a Dark / Light base switch SHALL be shown next to the selector; they SHALL be hidden for every other option. Changes in the picker or switch SHALL apply to the whole dashboard immediately.

#### Scenario: Pick an accent
- **WHEN** the user selects Custom and picks `#e11d48` as the accent
- **THEN** primary buttons, selected menu items, progress bars and the first chart series use that accent without a reload

#### Scenario: Switch base
- **WHEN** Custom is active on the Dark base and the user switches to Light
- **THEN** the page surfaces, text and native color scheme become those of Default Light while the accent stays the same

#### Scenario: Other theme selected
- **WHEN** Dracula is selected
- **THEN** no accent picker or base switch is shown

### Requirement: Derived chart palette stays readable
The Custom theme SHALL provide 10 distinct chart colors derived from the accent, and each SHALL have a contrast ratio of at least 3:1 against the base's content background. Any accent, including very light, very dark or grey colors, SHALL produce such a palette.

#### Scenario: Pale accent on light base
- **WHEN** the accent is `#fef08a` on the Light base
- **THEN** all 10 chart colors are distinct and each has ≥ 3:1 contrast against the content background

#### Scenario: Grey accent
- **WHEN** the accent is `#808080`
- **THEN** the chart colors are still 10 distinct colors

### Requirement: Custom settings persist
The accent and base SHALL be saved and restored on the next visit. Choosing another theme SHALL NOT discard them: returning to Custom restores the last accent and base. A missing or invalid saved accent SHALL fall back to the base theme's default primary color, and an invalid base to Dark.

#### Scenario: Reload
- **WHEN** the user set Custom with accent `#e11d48` on Light and reloads
- **THEN** Custom is active with the same accent and base

#### Scenario: Return to Custom
- **WHEN** the user switches from Custom to Dracula and back to Custom
- **THEN** the previous accent and base are restored

#### Scenario: Corrupt saved accent
- **WHEN** the saved accent is not a `#rrggbb` color
- **THEN** Custom uses the base theme's default primary color and the dashboard renders normally
