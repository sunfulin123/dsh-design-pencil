# Component inventory

## Guidance

Talkdesk has two component libraries. **Cobalt core** (`@talkdesk/cobalt-react-*`) is the base design system. **Cobalt Marketplace** (`@talkdesk/cobalt-marketplace-react-*`) holds higher-level components built with Cobalt core. Both are listed here from their source code, so this page updates whenever either library changes.

## Names in both libraries

These names exist as two separate packages with different APIs. Check which package the code you are working on already imports before using either.

The full inventory, grouped by library, is the index of [llms.txt](/ai-docs/llms.txt).

## Cobalt core

## Cobalt Marketplace

Every marketplace component has a page under **Components → Marketplace**. Ten carry full design guidance migrated from ZeroHeight; the rest are code reference (props, examples and Storybook, from the package source) with a pointer to wherever their design guidance lives.

### Utilities

Helper packages the marketplace components share. You rarely import these directly.
