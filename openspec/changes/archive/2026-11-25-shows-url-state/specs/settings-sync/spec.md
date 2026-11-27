## MODIFIED Requirements

### Requirement: Shows filters are not overwritten live
Saved Shows filters changed in one tab SHALL NOT change the filters of a Shows page already open in another tab; the other tab SHALL use the latest saved filters the next time its Shows page is opened without filter parameters in the URL. A Shows URL that contains filter parameters SHALL show those filters instead.

#### Scenario: Filtering in two tabs
- **WHEN** tab A and tab B both show the Shows page and the user filters by "Drama" in tab A
- **THEN** tab B's filters are unchanged until its Shows page is opened again at `/shows`, which then shows "Drama"

#### Scenario: Filtered link in the other tab
- **WHEN** the user filters by "Drama" in tab A and tab B then opens a Shows URL selecting "Crime"
- **THEN** tab B shows "Crime"
