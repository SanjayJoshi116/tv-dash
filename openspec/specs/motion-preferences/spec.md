# motion-preferences Specification

## Purpose

Makes the dashboard honor the operating system's reduced-motion preference, so users sensitive to animation get a static, fully readable interface without losing any information.

## Requirements

### Requirement: Reduced motion disables decorative animation
When the OS reduced-motion preference is set, the dashboard SHALL NOT play chart entry animations, legend fades, UI component transition animations, or the bottom navigation slide. When the preference is not set, existing animations SHALL remain unchanged.

#### Scenario: Charts with reduced motion
- **WHEN** reduced motion is requested and the user opens a Statistics tab or the Dashboard ratings chart
- **THEN** the chart renders in its final state without an entry animation

#### Scenario: No preference
- **WHEN** reduced motion is not requested
- **THEN** charts, legends and the bottom navigation animate as before

### Requirement: No content gated on animation under reduced motion
Content that normally appears after an animation finishes SHALL be shown immediately when reduced motion is requested.

#### Scenario: Pie chart legend
- **WHEN** reduced motion is requested and a pie chart is shown (including after switching back to its tab)
- **THEN** its legend is fully visible immediately

### Requirement: Bottom navigation without sliding
With reduced motion requested, the mobile bottom navigation SHALL still hide on scroll-down and reappear on scroll-up or near the top, but SHALL change state instantly without a sliding transition.

#### Scenario: Scroll on mobile with reduced motion
- **WHEN** reduced motion is requested and the user scrolls down on a mobile-width viewport
- **THEN** the bottom navigation is hidden immediately, without a transition

### Requirement: Follows OS changes live
The dashboard SHALL apply a change to the OS reduced-motion preference without a reload.

#### Scenario: Preference turned on while open
- **WHEN** the OS reduced-motion preference is turned on while the dashboard is open
- **THEN** subsequently shown charts render without entry animation, without reloading
