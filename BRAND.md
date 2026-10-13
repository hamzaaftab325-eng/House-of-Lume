# DWELLUNE — Brand System

**Status:** Active brand source of truth  
**Version:** 1.0  
**Supersedes:** legacy `House of Lume` naming and legacy color values wherever they conflict

## Brand identity

- Brand name: **DWELLUNE**
- Primary logo: `/public/logo.svg`
- Logo alt text: `DWELLUNE Home Décor`
- Brand character: warm, refined, botanical, architectural, tactile, calm

Do not recreate the wordmark in plain text where the primary logo is appropriate. Preserve the SVG proportions and do not recolor the logo artwork with CSS filters.

## Core palette

The production UI palette is derived from the approved DWELLUNE logo artwork.

- Warm canvas: `#F7F0E5`
- Paper cream: `#FFF8EE`
- Soft chalk: `#EADCC8`
- Deep brown ink: `#281103`
- Dark bronze brown: `#502A0D`
- Antique bronze: `#A97034`
- Soft bronze highlight: `#D09653`
- Sage: `#8FA984`
- Deep sage: `#637D57`
- Muted warm ash: `#75634E`

Use semantic tokens from `src/app/globals.css`; do not scatter these hex values through components.

## Brand usage

- Header and footer use the approved SVG logo.
- Metadata, structured data, accessible labels, search UI and editorial brand mentions use `DWELLUNE`.
- Existing product, category and collection names remain data-driven and must not be fabricated during rebranding.
- The established editorial layout, typography, motion and component principles in `design.md` remain active unless this file explicitly overrides them.

## Migration rule

Legacy `House of Lume` references are considered cleanup debt after the DWELLUNE rebrand and should not be introduced in new production code. Internal technical component names such as `LumeButton` may remain temporarily when renaming them would create unnecessary churn; they should be addressed only in an explicit cleanup/refactor pass.
