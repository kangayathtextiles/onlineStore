# ADR-0008: Variation-Based Inventory and Availability Model

## Status
Accepted

## Context
Physical clothing items exist in combinatorial variations of Size (e.g. S, M, L, 38, 40) and Color (e.g. Maroon, Navy). Retail inventory sells out at the individual size/color level, not uniformly across the entire garment design.

## Decision
We model inventory availability strictly at the `ProductVariant` entity level using a boolean `is_available` flag.
Product-level availability is a derived aggregate property:
$$\text{Product.is\_available} = (\neg \text{Product.manual\_sold\_out}) \land (\exists v \in \text{Variants} : v.\text{is\_available} = \text{true})$$
A master `manual_sold_out: boolean` flag is attached to the `Product` entity to allow 1-click full-design sold-out overrides.

## Alternatives Considered
- *Product-level only availability*: Unacceptable because a store cannot indicate that Size M is out while Size L is in stock.
- *Numeric stock counting (e.g. count = 7)*: Explicitly rejected as out-of-scope for MVP because manual count entry during physical retail rushes causes severe inventory count drift without automated barcode scanner POS integration.

## Consequences
- **Positive**: Accurately reflects boutique retail floor reality, eliminates customer travel frustration, and requires zero complex inventory decrement locking.
- **Negative**: Admin must toggle availability per variant when a size sells out.
