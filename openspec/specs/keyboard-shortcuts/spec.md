# keyboard-shortcuts Specification

## Purpose

Lets keyboard users move between pages, jump to search, change the theme and discover the available shortcuts without using the mouse.

## Requirements

### Requirement: Navigation shortcuts
The dashboard SHALL navigate to Dashboard on the key sequence `g` then `d`, to Shows on `g` then `s`, and to Statistics on `g` then `t`, from any page. The second key SHALL be pressed within 1 second of `g`; otherwise the sequence is discarded.

#### Scenario: Go to Shows
- **WHEN** the user is on Dashboard and presses `g` then `s`
- **THEN** the Shows page is shown

#### Scenario: Sequence times out
- **WHEN** the user presses `g`, waits more than 1 second, then presses `s`
- **THEN** no navigation happens

#### Scenario: From Show Detail
- **WHEN** the user is on a show's detail page and presses `g` then `t`
- **THEN** the Statistics page is shown

### Requirement: Search shortcut
Pressing `/` SHALL move keyboard focus into the Shows search field, navigating to the Shows page first when another page is shown. The `/` character SHALL NOT be typed into the field.

#### Scenario: On Shows
- **WHEN** the user is on Shows and presses `/`
- **THEN** the search field is focused and empty of a `/` character

#### Scenario: From Dashboard
- **WHEN** the user is on Dashboard and presses `/`
- **THEN** the Shows page is shown with the search field focused

### Requirement: Theme shortcut
Pressing `t` SHALL switch to the next option of the theme selector (wrapping from the last to the first), and the choice SHALL be saved exactly as if chosen in the selector.

#### Scenario: Cycle theme
- **WHEN** Default Dark is active and the user presses `t`
- **THEN** the next theme in the selector's order becomes active and is restored on reload

### Requirement: Shortcut cheat sheet
Pressing `?` SHALL open a dialog listing every global shortcut and its action. The dialog SHALL close on Escape and return focus to where it was. While the dialog is open, other shortcuts SHALL NOT fire.

#### Scenario: Open and close
- **WHEN** the user presses `?` and then Escape
- **THEN** the shortcut list is shown, then closed with focus restored

### Requirement: Shortcuts never interfere with typing or system keys
Global shortcuts SHALL be ignored while focus is in a text input, text area, select / combobox or editable element, and whenever Ctrl, Meta or Alt is held. Existing browser and page keyboard behavior SHALL be unchanged in those cases.

#### Scenario: Typing in search
- **WHEN** focus is in the Shows search field and the user types `g s t`
- **THEN** the text "gst" appears in the field and no navigation or theme change happens

#### Scenario: Modifier held
- **WHEN** the user presses Ctrl+T or Meta+D
- **THEN** no dashboard shortcut fires
