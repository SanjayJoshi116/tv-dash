# navigation-feedback Specification

## Purpose

Defines what users see while moving between pages and when a page fails, so navigation feels continuous and a single broken page never takes down the rest of the app.

## Requirements

### Requirement: Current page stays visible while the next page loads
When the user navigates to a page whose code is not loaded yet, the current page SHALL remain on screen and a progress indicator SHALL be shown at the top of the content area until the new page renders. The very first page load SHALL still show the loading state.

#### Scenario: Navigating to an unloaded page
- **WHEN** the Statistics page code is not loaded and the user clicks "Statistics" on the Dashboard
- **THEN** the Dashboard stays visible with a progress indicator until the Statistics page appears

#### Scenario: Page already loaded
- **WHEN** the user navigates to a page whose code is loaded
- **THEN** the page appears without a progress indicator

### Requirement: Page errors stay inside the layout and clear on navigation
If a page fails to render or its code fails to load, the error SHALL be shown inside the normal layout (navigation still usable), with a Retry action, and SHALL be cleared when the user navigates to another URL.

#### Scenario: Page throws
- **WHEN** the Shows page throws during render
- **THEN** an error message with Retry is shown in the content area and the sidebar / bottom navigation still work

#### Scenario: Navigating away from an error
- **WHEN** an error is shown on one page and the user navigates to another page
- **THEN** the other page renders normally

### Requirement: Switching between shows keeps page state
Navigating from one show's detail page to another's SHALL update the content without remounting the page or showing a loading state, and the content area SHALL scroll to the top.

#### Scenario: Show to show
- **WHEN** the user opens `/shows/1` and then navigates to `/shows/2`
- **THEN** show 2's details appear without a loading state, scrolled to the top
