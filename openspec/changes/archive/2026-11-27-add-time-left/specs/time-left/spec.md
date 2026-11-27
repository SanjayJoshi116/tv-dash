## Purpose

Tells the viewer how much of a show is left to watch and which season comes next, and lets Continue Watching surface the shows closest to being finished.

## ADDED Requirements

### Requirement: Time left on Show Detail
Show Detail SHALL show the remaining watch time as the number of unwatched episodes (total episodes minus watched, never below zero) times the episode runtime, formatted in hours and minutes, together with the number of unwatched episodes. It SHALL be hidden when the episode runtime is unknown or no episode is left.

#### Scenario: Show in progress
- **WHEN** a show has 10 episodes of 50 minutes and 6 are watched
- **THEN** Show Detail shows a time left of 3h 20m for 4 episodes

#### Scenario: Unknown runtime
- **WHEN** a show's episode runtime is unknown
- **THEN** no time left is shown and nothing reads as zero

#### Scenario: Finished show
- **WHEN** every episode of a show is watched
- **THEN** no time left is shown

### Requirement: Next season on Show Detail
Show Detail SHALL show the lowest season number, from 1 to the show's season count, that is not among the watched seasons. It SHALL be hidden when the season count is unknown or every season is watched.

#### Scenario: Gap in watched seasons
- **WHEN** a show has 5 seasons and seasons 1, 2 and 4 are watched
- **THEN** Show Detail shows Season 3 as the next season

#### Scenario: All seasons watched
- **WHEN** every season of a show is watched
- **THEN** no next season is shown

### Requirement: Time left in Continue Watching
Each Continue Watching entry on the Dashboard SHALL show its remaining watch time when the episode runtime is known. The section SHALL offer two orders: Most watched (highest share of episodes watched first, the default) and Least time left (smallest remaining time first, entries with unknown runtime last). The chosen order SHALL apply to which shows the section lists, not only to their arrangement.

#### Scenario: Least time left
- **WHEN** the user switches Continue Watching to Least time left
- **THEN** the in-progress shows with the smallest remaining time are listed, smallest first, and shows with unknown runtime appear only after all shows with a known time left

#### Scenario: Default order
- **WHEN** the Dashboard is opened
- **THEN** Continue Watching is ordered by Most watched
