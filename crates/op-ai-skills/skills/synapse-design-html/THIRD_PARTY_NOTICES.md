# Third-party notices

`templates/cobalt/vendor/workspace-shell/` contains the unmodified published Workspace prototype shell from Talkdesk/cobalt-docs, `ai-docs` revision `6605872cd112c71226fe6df921baac1d6f1f50d8`. `templates/cobalt/source.json` records source paths and SHA-256 hashes. Original source comments and the upstream README are retained. This snapshot is Talkdesk material; this notice does not grant a license to it or to Talkdesk trademarks. Owned adapters apply only when copying into a prototype project; the source checkout and bundled upstream snapshot stay unchanged.

The HTML design skill adapts resources from the user's existing
`synapse-design-html` skill. The individual references retain their original
source notes. Their guidance is subject to the active Synapse skill, the user
request, and the selected product DESIGN.

The following upstream projects are cited by those resources. Their upstream
license texts are included under `third-party-licenses/`:

| Project | Upstream | License text |
| --- | --- | --- |
| design-taste-frontend / taste-skill | https://github.com/Leonxlnx/taste-skill | `taste.txt` (MIT) |
| Impeccable | https://github.com/pbakaus/impeccable | `impeccable.txt` (Apache-2.0) |
| Hallmark | https://github.com/Nutlope/hallmark | `hallmark.txt` (MIT) |
| Everything Claude Code | https://github.com/affaan-m/everything-claude-code | `ecc.txt` (MIT) |
| 3dviz-pro-max | https://github.com/viettranx/3dviz-pro-max | `3dviz.txt` (MIT) |
| open-3d-skills | https://github.com/Moh4696/open-3d-skills | `open3d.txt` (MIT) |
| auteur | https://github.com/agiwhitelist/auteur | `auteur.txt` (MIT) |
| threejs-skills | https://github.com/CloudAI-X/threejs-skills | `threejs.txt` (MIT) |
| ui-ux-pro-max | https://github.com/nextlevelbuilder/ui-ux-pro-max-skill | `uiux.txt` (MIT) |

`assets/icons/index.json` restores the index required by the migrated
`icons.mjs` from the locally installed design-taste-frontend skill. The original
and installed scripts are byte-identical. The index contains metadata, not the
icon artwork; the script records sources and licensing when icons are fetched.
Trademarks remain their owners' property.

`data/sources.json` preserves the original detailed research-source and asset
provenance, including separate terms for referenced third-party assets. This
notice does not claim that all external resources or trademarks share the
upstream code licenses. The user's original composite skill did not supply a
single top-level license or a complete provenance map; retain its source notes
and review further third-party material before redistributing it.

The runtime `cobalt-reference/` directory contains Talkdesk component and design reference text from the same pinned ai-docs revision, and the referenced documentation images from source revision `589b433ee00187a62e0da360b7215c2699eedac7`. Its `source.json` records hashes, original repository provenance and the owned local workflow entry that replaces upstream checkout instructions. Original reference text and image rights remain with their owners.

## Atlas title-bar primitives

`templates/cobalt/vendor/atlas-titlebar/` contains pinned Talkdesk/atlas stateless title-bar primitive and helper sources, plus original button/status/timer CSS. `templates/cobalt/chrome/source.json` records the Atlas revision, source hashes and copied-file hashes. Original files remain unchanged; the helper declaration is an owned TypeScript companion. Talkdesk source and trademark rights remain with their owners. Official Cobalt packages are declared runtime dependencies.
