/**
 * Model-facing descriptions of the live design tools a host registers.
 *
 * Kept with the runtime for the same reason as the workflow wording: what the
 * model is told about a capability belongs next to the capability, not in a
 * host adapter.
 */

export const LIVE_TOOL_TEXT_VERSION = 1;

export const LIVE_TOOL_TEXT = {
  selection: {
    description:
      "Read the current selection from the live OpenPencil sidebar canvas. Use this before modifying a node. Returns selected node ids, names, types, bounds, the active page, an optional Unicode scalar text range, and visual evidence (glyph ink bounds + cropped image on vision routes). The editable sidebar must already be open. If path is supplied, the tool refuses to target a different canvas.",
    parameters: {
      path:
        "Optional .op path used to assert which live editor is being read.",
    },
  },
  create: {
    description:
      "Apply design operations, variables and themes to the active canvas.",
    parameters: {
      path:
        "Optional active document path.",
      discovery:
        "Confirmed style request handle for an empty document.",
      operations:
        "Optional newline-separated batch_design operations (or script with I/U/M/D/V/T), for example I(\"page-id\", {\"type\":\"frame\",\"id\":\"hero\",\"name\":\"Hero\",\"width\":1200,\"height\":800,\"fill\":[{\"type\":\"solid\",\"color\":\"$--bg-page\"}]}).",
      variables:
        "Optional design variables to create or update in the {} Variables panel, e.g. {\"--primary\":{\"type\":\"color\",\"value\":\"#2563EB\"},\"--radius-md\":{\"type\":\"number\",\"value\":8}} or shorthand {\"--primary\":\"#2563EB\"}.",
      themes:
        "Optional theme axes and variant names to define in the {} Variables panel, e.g. {\"Mode\":[\"Light\",\"Dark\"]}.",
      activeTheme:
        "Optional active theme variant to switch to on the canvas, e.g. {\"Mode\":\"Dark\"}.",
      preset:
        "Optional bundled design-token preset to apply to the {} Variables panel.",
      pageId:
        "Optional page id. Defaults to the live editor active page.",
      canvasWidth:
        "Optional canvas width hint for post-processing.",
      postProcess:
        "Run OpenPencil post-processing after the batch. Default false.",
    },
  },
  edit: {
    description:
      "Modify one node directly on the active OpenPencil canvas. When nodeId is omitted, this tool targets the single node currently selected by the user; it refuses an empty or multi-selection instead of guessing. Pass rich OpenPencil node fields in changes, for example content, name, role, explain, semantics ({label, hint, aiName, aiDescription}), events, screen, x, y, width, height, fill, fontSize, fontWeight, fontStyle, underline, strikethrough, padding, layout, or opacity. If the target node is a single-text wrapper Frame/Group (such as `strong`, `span`, `p`, `h1`-`h6`, or `button`), text fields (`content`, `fontSize`, `fontWeight`, `fontFamily`, etc.) are automatically routed to its inner Text child. The live canvas auto-refreshes and auto-saves automatically, and post-edit visual evidence (glyph ink bounds + cropped image on vision routes) is returned.",
    parameters: {
      path:
        "Optional .op path used to bind this write to the intended live editor. Omit to target the active canvas in this session.",
      nodeId:
        "Explicit target node id. Omit to use the one selected canvas node.",
      pageId:
        "Page containing the target. Supply the frozen target page when the user may have switched pages.",
      changes:
        "Shallow OpenPencil node patch. Rich canonical fields are preserved.",
    },
  },
  new: {
    description:
      "Create a new document with a single transactional design script after a confirmed style selection.",
    parameters: {
      path:
        "New workspace-relative or absolute .op path. Choose a useful filename without asking when the user omitted one. Existing targets are never overwritten.",
      script:
        "A sandboxed runtime design script.",
      discovery:
        "Handle for the confirmed style request.",
      canvasWidth:
        "Optional canvas-width hint for OpenPencil post-processing.",
    },
  },
  import: {
    description:
      "Import an existing HTML file (.html/.htm/.zip), web page URL, Figma file (.fig/.fig.json), Figma design link (https://www.figma.com/design|file/...), SVG file (.svg), or web snapshot (.json) and convert it into a new editable .op design document in the workspace. Always converts the input into a .op file and opens the .op design in the managed OpenPencil editor rather than opening raw HTML or .fig directly. Requires Session Workspace Write permission.",
    parameters: {
      source:
        "Local file path (.html, .htm, .zip, .fig, .svg, .json) or HTTP/HTTPS URL (web page or figma.com design link) to import.",
      path:
        "Optional output .op path in the workspace. Omit to auto-generate <source-name>.op.",
      viewportHeight:
        "Optional CSS viewport height in pixels for HTML imports.",
      figmaToken:
        "Optional Figma Personal Access Token when importing a figma.com URL (falls back to FIGMA_TOKEN).",
    },
  },
  render: {
    description:
      "Render an existing OpenPencil .op design document exactly as the design canvas, then show a PNG and an optional interactive read-only canvas in the conversation. Give the absolute path to a .op file (or a path relative to the current working directory). The image appears directly in the chat; the file path is returned for further use. Set editable=true when the user asks to edit an existing design, and set autoOpen=true only when this render result should open its editor immediately. When rendering a design generated in the current turn, editable=true is mandatory so its production preview always retains the Edit canvas/sidebar action; use autoOpen=true unless the user asked to keep the editor closed. Leave width/height unset for design-accurate output. Width/height are only supported by the lower-fidelity Jian runtime fallback.",
    parameters: {
      path:
        "Path to the .op design document to render.",
      width:
        "Explicit logical viewport width in pixels. Omit to use the document size.",
      height:
        "Explicit logical viewport height in pixels. Omit to use the document size.",
      scale:
        "Pixel scale factor applied to the output (device-pixel ratio). Default 1.",
      editable:
        "Expose an Edit in sidebar action for the original .op source. Default false.",
      autoOpen:
        "Automatically expand the editor once for this live editable render result. Default false.",
    },
  },
  codeContext: {
    description:
      "Extract complete high-fidelity design-to-code context from the active Synapse Design (.op) canvas or a specified .op file. Returns deterministic reference code (`designJsx`, `tailwindJsx`, `htmlCss`), CSS custom properties (`cssVariables`), resolved layout bounds (`layoutBounds`), design tokens (`variables`, `themes`, `designMd`), and the full canonical node subtree (`nodes`) for the currently selected node(s) (or explicit `nodeIds`, or the active page when nothing is selected). ALWAYS call this tool first when the user asks to generate, implement, or restore React, Tailwind CSS, or HTML/CSS code from the current design.",
    parameters: {
      path:
        "Optional .op file path. Omit to read the currently open Synapse Design canvas in this session.",
      nodeIds:
        "Optional comma-separated node IDs or JSON array of node IDs to extract. Omit to automatically use the user's active canvas selection (or the active page roots if nothing is selected).",
      format:
        "Which deterministic reference code formats to include. Defaults to \"all\" (Design JSX + Tailwind JSX + HTML/CSS).",
      pageId:
        "Optional page ID. Defaults to the active page.",
    },
  },
  search: {
    description:
      "Search the active design runtime for capabilities available to this session.",
  },
  call: {
    description:
      "Call an authorized capability supplied by the active design runtime.",
    parameters: {
      discovery:
        "Confirmed style request handle for an empty document.",
    },
  },
};

export const LIVE_NOTE = {
  appliedToCanvas: 'Applied to the active design canvas.',
  // Creating a file is not reviewing it; the note says which of the two happened.
  createdDocument: (path) => `Created and saved ${path}; visual verification was not performed.`,
  importedDocument: ({ source, filename, nodeCount }) =>
    `Imported ${source} into ${filename} (${nodeCount} nodes) and opened the .op design in the Synapse Design editor.`,
  renderedDocument: ({ input, renderer, fidelity }) => `Rendered ${input} with ${renderer} (${fidelity})`,
  awaitStyleChoice: 'Wait for the user to choose a style; continue the existing gallery after confirmation.',
};

/** Guidance sections a design task may load on demand; anything else is outside the workflow. */
export const ALLOWED_PROMPT_SECTIONS = [
  'op-design',
  'op-design-build',
  'op-design-direction',
  'op-design-composition',
  'op-design-review',
  'op-design-judgement',
  'op-design-craft',
  'op-design-feedback',
  'schema',
  'cjk',
  'icons',
];
