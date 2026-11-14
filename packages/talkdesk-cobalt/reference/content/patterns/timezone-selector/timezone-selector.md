# Timezone selector

## Guidance

:::note
This page doesn't map to the spec's Interaction Patterns categories (Forms & Validation, Search/
Filtering/Sorting, Empty States & Loading, System Notifications & Alerts, Onboarding & Wizards, Data
Visualization) — flagged for review. Sourced from the live Cobalt DS's Timezone selector pattern page.
:::

The timezone selector lets the user choose a timezone — used in multiple places in the product when the
user needs to associate a timezone with an object or define a view, like a schedule.

## Anatomy

The selector, a search field, a "recent timezones" group title, the 3 most recently selected
timezones, a divider between recent and all options (only shown when recent timezones are present), a
country name group title, and individual timezone options.

## Behavior

### Opening the selector

Multiple components can trigger the timezone selector — a Dropdown, or a button.

### Search

Given the number of timezones, search is necessary to reduce the effort of finding the right one. It
must support searching by country, city, timezone name, and UTC offset.

### Ordering

1. The 3 most recent timezones (if any), most recent first.
2. Then all options grouped alphabetically by country.
3. Within each country group, options are ordered alphabetically by city.

### Timezone code

Each option shows the abbreviated timezone name and its Universal Time Coordinated (UTC) offset.
