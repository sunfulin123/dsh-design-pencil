//! Collaboration UI strings.

pub fn lookup(key: &str) -> Option<&'static str> {
    Some(match key {
        "variables.libraryUpdates" => "{{count}} library updates · Accept",
        "drafts.title" => "Recovery copies",
        "drafts.notice" => "Restoring replaces the live document as one undoable edit and creates a protective backup. The bound file is not saved.",
        "drafts.create" => "Create checkpoint",
        "drafts.label" => "Checkpoint name",
        "drafts.empty" => "No recovery copies yet.",
        "drafts.restoreConfirm" => "Restore this recovery copy?",
        "drafts.deleteConfirm" => "Delete this recovery copy permanently?",
        "drafts.syncError" => "Wait for local edits to synchronize, then retry.",
        "drafts.refresh" => "Refresh",
        "drafts.failed" => "Recovery request failed: {{message}}",
        "drafts.loading" => "Updating recovery copies…",
        "drafts.autosave" => "Autosave",
        "drafts.checkpoint" => "Checkpoint",
        "drafts.backup" => "Protective backup",
        "colorPicker.sampleError" => "Color sampling failed: {{message}}",
        "statusbar.interfaceScale" => "Interface scale",
        "statusbar.viewOptions" => "View options",
    "preview.emptyPage" => "This page has no visible frames to preview.",
    "preview.noFrame" => "No frame",
    "preview.fit" => "Fit",
    "preview.mode.preview" => "Preview",
    "preview.mode.present" => "Present",
    "preview.list" => "Pages and frames",
    "preview.rotate" => "Rotate device",
    "preview.previous" => "Previous frame",
    "preview.next" => "Next frame",
        "position.alignLeft" => "Align left",
        "position.alignCenterH" => "Align horizontal centers",
        "position.alignRight" => "Align right",
        "position.alignTop" => "Align top",
        "position.alignCenterV" => "Align vertical centers",
        "position.alignBottom" => "Align bottom",
        "position.distributeH" => "Distribute horizontally",
        "position.distributeV" => "Distribute vertically",
        "canvas.pixelGrid" => "Rulers and pixel grid",
        "collab.topbar.collaborate" => "Collaborate",
        "collab.topbar.starting" => "Starting collaboration…",
        "collab.topbar.joining" => "Joining…",
        "collab.topbar.authenticating" => "Authenticating…",
        "collab.topbar.connected" => "Connected",
        "collab.topbar.reconnecting" => "Reconnecting…",
        "collab.topbar.readOnly" => "Read-only",
        "collab.topbar.ended" => "Session ended",
        "collab.topbar.participants" => "{{count}} participants",
        "collab.topbar.unavailable" => "Collaboration is unavailable in this build",
        "collab.action.start" => "Create session",
        "collab.action.join" => "Join session",
        "collab.home.hint" => "Create a new session or join with an invite.",
        "home.connectMoreModels" => "Connect more models…",
        "home.connect.title" => "Connect a model first",
        "home.connect.free" => "Use OpenPencil free credits",
        "home.connect.freeNote" => "20 turns a day after sign-in — start right away",
        "home.connect.apiKey" => "Use my own API key",
        "home.connect.apiKeyNote" => "Zhipu / DeepSeek / OpenAI-compatible",
        "home.connect.cli" => "Connect a local CLI",
        "home.connect.cliNote" => "Claude Code · Codex · ZCode",
        "home.connect.chipEmpty" => "Connect a model first",
        "collab.create.choose" => "Choose how other people can connect.",
        "collab.action.leave" => "Leave session",
        "collab.action.retry" => "Retry",
        "collab.action.cancel" => "Cancel",
        "collab.action.connect" => "Connect",
        "collab.action.copyInviteCode" => "Copy invite code",
        "collab.action.copyInviteLink" => "Copy invite link",
        "collab.action.findNearby" => "Find nearby",
        "collab.join.code" => "Invite code or IP address",
        "collab.join.codePlaceholder" => "A2C4E6G8J0 or 192.168.1.8:43120",
        "collab.join.publicHint" => "Invite codes connect securely over the internet.",
        "collab.join.nearby" => "Nearby sessions",
        "collab.session.invite" => "Public invite code",
        "collab.session.preparingInvite" => "Preparing a secure invite…",
        "collab.session.publicReady" => "Public relay is ready",
        "collab.session.region" => "Home relay region",
        "collab.connection.lan" => "Local network",
        "collab.connection.relay" => "Public relay",
        "collab.region.china" => "China",
        "collab.region.global" => "Global",
        "collab.error.inviteUnavailable" => "This invite is unavailable or has expired.",
        "collab.error.relayUnavailable" => "The public relay is temporarily unavailable.",
        "collab.error.inviteInvalid" => "This invite code is invalid. Check it and try again.",
        "collab.error.inviteExpired" => "This invite code has expired. Ask the owner for a new one.",
        "collab.error.relayNotConfigured" => "No public relay is configured on this device.",
        "collab.error.regionUnavailable" => "The invite's home relay region is unavailable.",
        "collab.error.secureKeyUnavailable" => "The device's secure key is unavailable. Check system keychain access and try again.",
        "collab.error.rateLimited" => "Too many connection attempts. Try again shortly.",
        "collab.action.discardPending" => "Discard pending edit",
        "collab.action.saveAsFork" => "Save as a fork",
        "collab.action.approveEditor" => "Approve editor",
        "collab.action.approveViewer" => "Approve viewer",
        "collab.action.rejectAdmission" => "Reject",
        "collab.admission.request" => "An authenticated peer is requesting access.",
        "collab.join.title" => "Join a collaboration session",
        "collab.join.discovering" => "Looking for sessions on your local network…",
        "collab.join.noSessions" => "No local sessions found",
        "collab.join.address" => "IP address and port",
        "collab.join.addressPlaceholder" => "192.168.1.8:43120",
        "collab.join.authenticating" => "Verifying the secure session…",
        "collab.join.incompatible" => "This session uses an incompatible version",
        "collab.join.signInRequired" => "Sign in to start or join a session",
        "collab.session.title" => "Collaboration",
        "collab.session.name" => "Session: {{name}}",
        "collab.session.shareAddress" => "Share address",
        "collab.session.role.owner" => "Owner",
        "collab.session.role.editor" => "Editor",
        "collab.session.role.viewer" => "Viewer",
        "collab.session.pending" => "Waiting for the owner to confirm your edit…",
        "collab.status.disconnectedReadOnly" => {
            "Connection lost. Editing is paused while OpenPencil reconnects."
        }
        "collab.status.ticketExpired" => "Your collaboration sign-in expired. Sign in again.",
        "collab.status.ownerLeft" => {
            "The owner left, so this session has ended. You can save a separate copy."
        }
        "collab.status.epochChanged" => {
            "The owner started a new session. Your pending edit was not submitted."
        }
        "collab.status.undoConflict" => {
            "That change cannot be undone because someone edited the same field later."
        }
        "collab.status.unsupportedEdit" => {
            "That edit is not supported in collaboration yet and was not applied."
        }
        "collab.status.profileUnavailable" => "Profile image unavailable; showing initials.",
        "collab.reject.staleBase" => "The document changed first. Catching up before retrying.",
        "collab.reject.readOnly" => "You have view-only access to this session.",
        "collab.reject.unsupported" => "The owner does not support that edit.",
        "collab.reject.conflict" => "That edit conflicts with a newer change.",
        "collab.reject.conflictDetail" => "Discarded: {{fields}} on “{{node}}”.",
        "collab.action.reapply" => "Reapply my edit",
        "collab.reject.resourceLimit" => "That edit is too large for this session.",
        "collab.reject.authentication" => "Your collaboration authorization is no longer valid.",
        "collab.reject.unknown" => "The owner rejected that edit.",
        "collab.gate.pages" => "Page changes are not supported in collaboration yet.",
        "collab.gate.pageBackground" => {
            "Page background changes are not supported in collaboration yet."
        }
        "collab.gate.variablesThemes" => {
            "Variables and themes are not supported in collaboration yet."
        }
        "collab.gate.components" => {
            "Component registry changes are not supported in collaboration yet."
        }
        "collab.gate.uikit" => "UIKit changes are not supported in collaboration yet.",
        "collab.gate.externalAssets" => {
            "Images, SVG, HTML, and other external assets cannot be imported in collaboration yet."
        }
        "collab.gate.clipboardPaste" => {
            "Pasting document content is not supported in collaboration yet."
        }
        "collab.gate.duplicate" => "Duplicating nodes is not supported in collaboration yet.",
        "collab.gate.bulkWrite" => "Bulk document changes are disabled during collaboration.",
        "collab.gate.replaceDocument" => {
            "Replacing the whole document is disabled during collaboration."
        }
        "collab.gate.rootMetadata" => {
            "Document metadata changes are not supported in collaboration yet."
        }
        "collab.gate.typography" => {
            "Typography changes are not supported in collaboration yet."
        }
        "collab.gate.effects" => "Effects are not supported in collaboration yet.",
        "collab.gate.visibilityLocking" => {
            "Visibility and locking changes are not supported in collaboration yet."
        }
        "collab.gate.nodeReplacement" => {
            "Replacing a node is not supported in collaboration yet."
        }
        "collab.gate.nodeProperty" => {
            "That node property is not supported in collaboration yet."
        }
        "collab.gate.nodeKind" => "That node type is not supported in collaboration yet.",
        "collab.gate.sessionTransition" => {
            "Editing is paused while the collaboration session is being prepared."
        }
        "collab.gate.readOnly" => "This collaboration session is read-only.",
        "collab.gate.pendingEdit" => {
            "Wait for your pending edit to be confirmed before making another change."
        }
        "collab.gate.aiMcp" => "AI and MCP document writes are disabled during collaboration.",
        "collab.gate.undoUnavailable" => {
            "Global undo is disabled in collaboration. Only confirmed personal changes can be undone."
        }
        "collab.gate.redoUnavailable" => "Redo is not available in collaboration yet.",
        "collab.gate.ownerOnlySave" => "Only the owner can save the shared source file.",
        "collab.gate.leaveSessionFirst" => {
            "Leave the collaboration session before replacing or opening another document."
        }
        "collab.status.localEditPreserved" => {
            "The remote version was applied. Use Undo to restore your local changes."
        }
        "collab.a11y.participant" => "{{name}}, {{role}}",
        "collab.a11y.remoteCursor" => "{{name}}'s cursor",
        "icon.catalogLoading" => "Icon catalog is still loading…",

        "sceneTemplate.deleteFailed" => "That template could not be deleted. Try again.",












































        "account.mcpToken" => "MCP Tokens",



        "assetCenter.template.mine" => "My templates",
        "assetCenter.template.builtIn" => "Built-in templates",
        "ai.designProgress.detail.failureReason" => "Reason: {{reason}}",
        "ai.designProgress.detail.noDiagnostic" => "The agent failed without returning an error description.",
        "ai.designProgress.detail.noResult" => "The agent stopped before returning a result for this section.",
        "ai.designProgress.detail.connectionClosed" => "The agent connection closed before this section returned a result.",
        "ai.designProgress.detail.stoppedByUser" => "Stopped by the user before this section completed.",
        "builtin.modelsOnePerLine" => "Model IDs, one per line",
        "builtin.typeModelManually" => "Failed to fetch the model list. Enter model IDs manually, one per line.",
        "settings.provider.deepSeekHarness" => "DeepSeek Harness models",
        "settings.agents.deleteProvider" => "Delete provider",
        "chat.mcpRequired" => "{cli} needs the OpenPencil MCP integration enabled in Settings",
        "video.title" => "Video",
        "video.url" => "URL",
        "video.posterThisImage" => "poster is this image",
        "video.autoplay" => "Autoplay",
        "video.loop" => "Loop",
        "video.muted" => "Muted",
        "video.holdLastFrame" => "Hold last frame",
        "video.clickToReplay" => "Click to replay",
        "video.add" => "Add video",
        "video.remove" => "Remove video",
        "home.welcome.titleLead" => "Today, ",
        "home.welcome.titleMarked" => "make something?",
        "home.welcome.sub" => "Start with an idea, end with a design you can keep editing.",
        "home.topbar.context" => "Studio",
        "home.topbar.openFile" => "Open file",
        "home.topbar.professional" => "Open pro canvas",
        "home.tabs.more" => "More",
        "home.tabs.moreCaption" => "More creation types",
        "home.segment.mobile" => "Phone",
        "home.segment.desktop" => "Desktop",
        "home.segment.wide" => "16:9",
        "home.segment.classic" => "4:3",
        "home.segment.infoData" => "Data",
        "home.segment.infoFlow" => "Flow",
        "home.segment.infoCompare" => "Compare",
        "home.tools.screenshot" => "Add screenshot",
        "home.tools.link" => "Reference link",
        "home.tools.figma" => "Figma",
        "home.tools.soon" => "Coming soon",
        "home.submit.start" => "Start designing",
        "home.submit.connect" => "Connect a model",
        "home.preview.eyebrow" => "Example preview",
        "home.preview.sticker" => "Example",
        "home.preview.use" => "Use this example",
        "home.replace.title" => "Replace the current brief?",
        "home.replace.keep" => "Keep",
        "home.replace.use" => "Use example",
        "home.explore.title" => "See what else you can make",
        "home.explore.sub" => "Start from a good example, then make it yours.",
        "home.explore.view" => "View example",
        "home.explore.knowledgeDesc" => "Turn complex ideas into clear visuals.",
        "home.explore.tutorialDesc" => "Screenshots that explain each step.",
        "home.explore.posterDesc" => "A full look for your next event.",
        "home.recent.title" => "Recent projects",
        "home.recent.empty" => "No projects yet — start your first design.",
        "home.recent.newCanvas" => "New blank canvas",
        "home.task.app.name" => "App screens",
        "home.task.app.summary" => "Editable screens",
        "home.task.app.label" => "Describe the screens you need",
        "home.task.app.placeholder" => "A coffee-ordering app with a home, menu, and order page.",
        "home.task.app.example" => "A coffee-ordering app with a home, menu, and order page.\nWarm and simple, highlighting coffee photos and the ordering flow.",
        "home.task.app.exampleTitle" => "Coffee Ordering App",
        "home.task.app.exampleDesc" => "3 screens · editable high-fidelity design",
        "home.task.app.examplePages" => "Home / Menu / Orders",
        "home.task.app.desktopPlaceholder" => "A coffee-store desktop app with an order list, order detail, and daily overview.",
        "home.task.app.desktopExample" => "A coffee-store desktop app with an order list, order detail, and daily overview.\nClear information, direct actions, blue highlighting pending orders.",
        "home.task.app.desktopTitle" => "Daybreak · store console",
        "home.task.app.desktopDesc" => "Desktop app · orders and store management",
        "home.task.app.desktopPages" => "Order list / Order detail / Overview",
        "home.task.web.name" => "Web pages",
        "home.task.web.summary" => "Sites & landing pages",
        "home.task.web.label" => "Describe your site or page",
        "home.task.web.placeholder" => "A coffee-brand site with a hero, product intro, brand story, and store info.",
        "home.task.web.example" => "Design a website for Daybreak Coffee.\nHero, signature drinks, brand story, and store info — warm white and forest green, one long scrolling page.",
        "home.task.web.exampleTitle" => "Daybreak Coffee · brand site",
        "home.task.web.exampleDesc" => "Brand site · scrollable web design",
        "home.task.web.examplePages" => "Scroll down for the full page",
        "home.task.presentation.name" => "Presentations",
        "home.task.presentation.summary" => "Multi-slide decks",
        "home.task.presentation.label" => "What is your deck about?",
        "home.task.presentation.placeholder" => "A product-intro deck: value, how it works, and use cases.",
        "home.task.presentation.example" => "A 5-slide intro deck for OpenPencil aimed at creators and small teams.\nCover, value, workflow, use cases, and closing — clean style, blue with a neon-yellow accent.",
        "home.task.presentation.exampleTitle" => "Good ideas deserve to be seen",
        "home.task.presentation.exampleDesc" => "5 slides · editable design",
        "home.task.presentation.examplePages" => "Cover / Value / Flow / Cases / Closing",
        "home.task.knowledge.name" => "Card stories",
        "home.task.knowledge.summary" => "Carousel posts",
        "home.task.knowledge.label" => "Drop in what you want to share",
        "home.task.knowledge.placeholder" => "Turn ideas, stories, or knowledge into image cards — one image or a carousel.",
        "home.task.knowledge.example" => "A “World of Coffee” card set: arabica vs robusta, origins, roasting, and flavour.\n5-card carousel, warm apricot, magazine layout.",
        "home.task.knowledge.exampleTitle" => "The world of coffee",
        "home.task.knowledge.exampleDesc" => "5-card carousel · story cards",
        "home.task.knowledge.examplePages" => "Cover / Varieties / Origins / Roast / Flavour",
        "home.task.tutorial.name" => "Screenshot guides",
        "home.task.tutorial.summary" => "Steps with screenshots",
        "home.task.tutorial.label" => "What does this guide teach?",
        "home.task.tutorial.placeholder" => "Upload screenshots, then describe the steps and what to highlight.",
        "home.task.tutorial.example" => "Explain enabling Focus Mode on iPhone in three steps: open Settings, pick a mode, customize it.\nBlue highlights for the key parts, written for first-timers.",
        "home.task.tutorial.exampleTitle" => "Show the steps clearly",
        "home.task.tutorial.exampleDesc" => "3 steps · screenshots and notes",
        "home.task.tutorial.examplePages" => "Open Settings / Pick a mode / Finish setup",
        "home.task.infographic.name" => "Infographics",
        "home.task.infographic.summary" => "Data, flow, and compare",
        "home.task.infographic.label" => "Add the information to organize",
        "home.task.infographic.placeholder" => "Add data and the takeaway — weekly performance, growth trends, or survey results.",
        "home.task.infographic.example" => "A weekly creative-review data story: 12 posts, 24k reads, 320 new followers (sample data).\nClear numbers, comparison bars, and three takeaways.",
        "home.task.infographic.exampleTitle" => "A clear weekly review",
        "home.task.infographic.exampleDesc" => "Data — numbers, trends, takeaways",
        "home.task.infographic.examplePages" => "Scroll for the full data story",
        "home.task.infographic.flowPlaceholder" => "Describe the steps, their order, and what matters at each one.",
        "home.task.infographic.flowExample" => "A five-step “idea to publish” flow: capture, outline, draft, polish, ship.\nNumbered and connected, one short note per step.",
        "home.task.infographic.flowTitle" => "From idea to publish, step by step",
        "home.task.infographic.flowDesc" => "Flow — steps, order, key points",
        "home.task.infographic.flowPages" => "Scroll for the full flow",
        "home.task.infographic.comparisonPlaceholder" => "What are you comparing? List the differences, dimensions, and best-fit scenarios.",
        "home.task.infographic.comparisonExample" => "Compare starting from blank vs starting from an example.\nSide-by-side on starting point, edits, freedom, and fit — no made-up numbers.",
        "home.task.infographic.comparisonTitle" => "Pick the right starting point",
        "home.task.infographic.comparisonDesc" => "Compare — differences and trade-offs",
        "home.task.infographic.comparisonPages" => "Scroll for the full comparison",
        "home.task.poster.name" => "Event posters",
        "home.task.poster.summary" => "Full event visuals",
        "home.task.poster.label" => "Tell us about the event",
        "home.task.poster.placeholder" => "What is the event called, when and where? Add a style you like.",
        "home.task.poster.example" => "A poster set for City Music Festival, Sept 26 at Riverside Park.\nNeon green and black with big type — main poster plus a social square.",
        "home.task.poster.exampleTitle" => "Music lights up the city",
        "home.task.poster.exampleDesc" => "2 formats · one event system",
        "home.task.poster.examplePages" => "Main poster / Social square",
        "workspace.export" => "Export",
        "workspace.professional" => "Pro editing",
        "workspace.phase.generating" => "Generating",
        "workspace.phase.done" => "Done",
        "workspace.phase.stopped" => "Stopped",
        "workspace.phase.failed" => "Failed",
        "workspace.view.all" => "All",
        "workspace.view.singleScreen" => "One screen",
        "workspace.view.singlePage" => "One page",
        "workspace.view.long" => "Long page",
        "workspace.view.overview" => "Overview",
        "workspace.fit" => "Fit",
        "workspace.present" => "Present",
        "workspace.retry" => "Retry",
        "workspace.returnEdit" => "Back to edit",
        "workspace.backToWorkspace" => "Back to workspace →",
        "workspace.failed.note" => "Generation was interrupted. Your brief and references are kept — you can retry.",
        _ => return None,
    })
}
