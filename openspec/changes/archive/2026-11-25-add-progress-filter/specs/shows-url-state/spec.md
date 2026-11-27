## ADDED Requirements

### Requirement: Progress filter is part of the URL
The Shows URL SHALL carry the progress filter alongside the other filters, omitted when it is All. An unknown progress value SHALL fall back to All and be removed from the URL without adding a history entry.

#### Scenario: Progress in a shared link
- **WHEN** the user opens a Shows URL with the progress filter set to Not started
- **THEN** only not-started shows are listed and the progress filter shows Not started

#### Scenario: Unknown progress value
- **WHEN** the user opens a Shows URL with an unrecognized progress value
- **THEN** all shows are listed and the progress value is removed from the URL
