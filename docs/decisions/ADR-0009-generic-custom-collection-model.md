# ADR-0009: Generic Dynamic Custom Section Model

## Status
Accepted

## Context
The shop owner needs to create arbitrary seasonal, festive, or promotional collections (e.g. "Onam Special Offers", "New Arrivals", "Clearance Deals", "Wedding Silk Specials") without developer intervention or database schema alterations.

## Decision
We architect a generic, dynamic `CustomSection` entity paired with a many-to-many join entity `CustomSectionItem`.
Each section has its own title, slug, banner image, active toggle, and display order. `CustomSectionItem` contains an explicit `sort_order` integer allowing the owner to manually curate carousel sequences.

## Alternatives Considered
- *Hardcoded boolean columns on products (`is_new_arrival`, `is_onam_special`)*: Rejected because adding a new campaign requires database migrations, code refactoring, and redeployment.
- *Tag-based collections*: Lacks explicit manual item ordering and dedicated banner metadata.

## Consequences
- **Positive**: Complete merchandising autonomy for the shop owner; unlimited promotional campaigns supported without schema changes.
- **Negative**: Requires many-to-many join table indexing (`custom_section_items`).
