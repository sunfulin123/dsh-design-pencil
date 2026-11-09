//! 협업 UI 문자열.

pub fn lookup(key: &str) -> Option<&'static str> {
    Some(match key {
        "variables.libraryUpdates" => "라이브러리 업데이트 {{count}}개 · 수락",
        "drafts.title" => "복구 사본",
        "drafts.notice" => "복원은 현재 문서를 교체하며 한 번에 실행 취소할 수 있습니다. 먼저 보호용 백업을 만듭니다. 연결된 파일은 저장하지 않습니다.",
        "drafts.create" => "체크포인트 만들기",
        "drafts.label" => "체크포인트 이름",
        "drafts.empty" => "복구 사본이 없습니다.",
        "drafts.restoreConfirm" => "이 사본을 복원할까요?",
        "drafts.deleteConfirm" => "이 복구 사본을 영구 삭제할까요?",
        "drafts.syncError" => "로컬 편집의 동기화가 완료된 후 다시 시도하세요.",
        "drafts.refresh" => "새로고침",
        "drafts.failed" => "복구 요청 실패: {{message}}",
        "drafts.loading" => "복구 사본 업데이트 중…",
        "drafts.autosave" => "자동 저장",
        "drafts.checkpoint" => "체크포인트",
        "drafts.backup" => "보호용 백업",
        "colorPicker.sampleError" => "색상 샘플링 실패: {{message}}",
        "statusbar.interfaceScale" => "인터페이스 배율",
        "statusbar.viewOptions" => "보기 옵션",
    "preview.emptyPage" => "이 페이지에는 미리 볼 수 있는 표시된 프레임이 없습니다.",
    "preview.noFrame" => "프레임 없음",
    "preview.fit" => "창에 맞춤",
    "preview.mode.preview" => "미리보기",
    "preview.mode.present" => "발표",
    "preview.list" => "페이지 및 프레임",
    "preview.rotate" => "기기 회전",
    "preview.previous" => "이전 프레임",
    "preview.next" => "다음 프레임",
        "position.alignLeft" => "왼쪽 정렬",
        "position.alignCenterH" => "가로 가운데 정렬",
        "position.alignRight" => "오른쪽 정렬",
        "position.alignTop" => "위쪽 정렬",
        "position.alignCenterV" => "세로 가운데 정렬",
        "position.alignBottom" => "아래쪽 정렬",
        "position.distributeH" => "가로로 분배",
        "position.distributeV" => "세로로 분배",
        "canvas.pixelGrid" => "눈금자와 픽셀 격자",
        "collab.topbar.collaborate" => "협업",
        "collab.topbar.starting" => "협업을 시작하는 중…",
        "collab.topbar.joining" => "참여하는 중…",
        "collab.topbar.authenticating" => "인증하는 중…",
        "collab.topbar.connected" => "연결됨",
        "collab.topbar.reconnecting" => "다시 연결하는 중…",
        "collab.topbar.readOnly" => "읽기 전용",
        "collab.topbar.ended" => "세션 종료됨",
        "collab.topbar.participants" => "참여자 {{count}}명",
        "collab.topbar.unavailable" => "이 빌드에서는 협업을 사용할 수 없습니다",
        "collab.action.start" => "세션 만들기",
        "collab.action.join" => "세션 참여",
        "collab.home.hint" => "새 세션을 만들거나 초대로 참여하세요.",
        "home.connectMoreModels" => "Connect more models…",
        "home.connect.title" => "Connect a model first",
        "home.connect.free" => "Use OpenPencil free credits",
        "home.connect.freeNote" => "20 turns a day after sign-in — start right away",
        "home.connect.apiKey" => "Use my own API key",
        "home.connect.apiKeyNote" => "Zhipu / DeepSeek / OpenAI-compatible",
        "home.connect.cli" => "Connect a local CLI",
        "home.connect.cliNote" => "Claude Code · Codex · ZCode",
        "home.connect.chipEmpty" => "Connect a model first",
        "collab.create.choose" => "다른 사용자의 연결 방식을 선택하세요.",
        "collab.action.leave" => "세션 나가기",
        "collab.action.retry" => "다시 시도",
        "collab.action.cancel" => "취소",
        "collab.action.connect" => "연결",
        "collab.action.copyInviteCode" => "초대 코드 복사",
        "collab.action.copyInviteLink" => "초대 링크 복사",
        "collab.action.findNearby" => "주변 찾기",
        "collab.join.code" => "초대 코드 또는 IP 주소",
        "collab.join.codePlaceholder" => "A2C4E6G8J0 또는 192.168.1.8:43120",
        "collab.join.publicHint" => "초대 코드로 인터넷을 통해 안전하게 연결할 수 있습니다.",
        "collab.join.nearby" => "주변 세션",
        "collab.session.invite" => "공개 초대 코드",
        "collab.session.preparingInvite" => "안전한 초대 준비 중…",
        "collab.session.publicReady" => "공개 릴레이 준비 완료",
        "collab.session.region" => "홈 릴레이 지역",
        "collab.connection.lan" => "로컬 네트워크",
        "collab.connection.relay" => "공개 릴레이",
        "collab.region.china" => "중국",
        "collab.region.global" => "글로벌",
        "collab.error.inviteUnavailable" => "이 초대를 사용할 수 없거나 만료되었습니다.",
        "collab.error.relayUnavailable" => "공개 릴레이를 일시적으로 사용할 수 없습니다.",
        "collab.error.inviteInvalid" => "초대 코드가 유효하지 않습니다. 확인 후 다시 시도하세요.",
        "collab.error.inviteExpired" => {
            "초대 코드가 만료되었습니다. 소유자에게 새 코드를 요청하세요."
        }
        "collab.error.relayNotConfigured" => "이 기기에는 공용 릴레이가 구성되어 있지 않습니다.",
        "collab.error.regionUnavailable" => "초대의 홈 릴레이 지역을 사용할 수 없습니다.",
        "collab.error.secureKeyUnavailable" => {
            "기기 보안 키에 액세스할 수 없습니다. 키체인 접근 권한을 확인한 후 다시 시도하세요."
        }
        "collab.error.rateLimited" => "연결 시도가 너무 많습니다. 잠시 후 다시 시도하세요.",
        "collab.action.discardPending" => "대기 중 편집 버리기",
        "collab.action.saveAsFork" => "분기본으로 저장",
        "collab.action.approveEditor" => "편집자로 승인",
        "collab.action.approveViewer" => "뷰어로 승인",
        "collab.action.rejectAdmission" => "거부",
        "collab.admission.request" => "인증된 참여자가 액세스를 요청하고 있습니다.",
        "collab.join.title" => "협업 세션 참여",
        "collab.join.discovering" => "로컬 네트워크에서 세션을 찾는 중…",
        "collab.join.noSessions" => "로컬 세션을 찾지 못했습니다",
        "collab.join.address" => "IP 주소 및 포트",
        "collab.join.addressPlaceholder" => "192.168.1.8:43120",
        "collab.join.authenticating" => "보안 세션을 확인하는 중…",
        "collab.join.incompatible" => "이 세션은 호환되지 않는 버전을 사용합니다",
        "collab.join.signInRequired" => "세션을 시작하거나 참여하려면 로그인하세요",
        "collab.session.title" => "협업",
        "collab.session.name" => "세션: {{name}}",
        "collab.session.shareAddress" => "공유 주소",
        "collab.session.role.owner" => "소유자",
        "collab.session.role.editor" => "편집자",
        "collab.session.role.viewer" => "뷰어",
        "collab.session.pending" => "소유자가 편집을 확인하기를 기다리는 중…",
        "collab.status.disconnectedReadOnly" => {
            "연결이 끊겼습니다. 다시 연결하는 동안 편집이 일시 중지됩니다."
        }
        "collab.status.ticketExpired" => "협업 로그인이 만료되었습니다. 다시 로그인하세요.",
        "collab.status.ownerLeft" => {
            "소유자가 나가 세션이 종료되었습니다. 별도 사본을 저장할 수 있습니다."
        }
        "collab.status.epochChanged" => {
            "소유자가 새 세션을 시작했습니다. 대기 중인 편집은 제출되지 않았습니다."
        }
        "collab.status.undoConflict" => "나중에 같은 필드가 편집되어 이 변경을 취소할 수 없습니다.",
        "collab.status.unsupportedEdit" => {
            "협업에서 아직 지원하지 않는 편집이므로 적용되지 않았습니다."
        }
        "collab.status.profileUnavailable" => "프로필 이미지를 불러올 수 없어 이니셜을 표시합니다.",
        "collab.reject.staleBase" => "문서가 먼저 변경되었습니다. 동기화 후 다시 시도합니다.",
        "collab.reject.readOnly" => "이 세션에서는 보기 권한만 있습니다.",
        "collab.reject.unsupported" => "소유자가 이 편집을 지원하지 않습니다.",
        "collab.reject.conflict" => "이 편집이 최신 변경과 충돌합니다.",
        "collab.reject.conflictDetail" => "삭제됨: {{node}}의 {{fields}}.",
        "collab.action.reapply" => "내 편집 다시 적용",
        "collab.reject.resourceLimit" => "이 편집이 세션 제한을 초과합니다.",
        "collab.reject.authentication" => "협업 인증이 더 이상 유효하지 않습니다.",
        "collab.reject.unknown" => "소유자가 이 편집을 거부했습니다.",
        "collab.gate.pages" => "페이지 변경은 협업에서 아직 지원되지 않습니다.",
        "collab.gate.pageBackground" => "페이지 배경 변경은 협업에서 아직 지원되지 않습니다.",
        "collab.gate.variablesThemes" => "변수와 테마는 협업에서 아직 지원되지 않습니다.",
        "collab.gate.components" => "컴포넌트 레지스트리 변경은 협업에서 아직 지원되지 않습니다.",
        "collab.gate.uikit" => "UIKit 변경은 협업에서 아직 지원되지 않습니다.",
        "collab.gate.externalAssets" => "이미지, SVG, HTML 및 외부 자산은 아직 가져올 수 없습니다.",
        "collab.gate.clipboardPaste" => "문서 내용 붙여넣기는 협업에서 아직 지원되지 않습니다.",
        "collab.gate.duplicate" => "노드 복제는 협업에서 아직 지원되지 않습니다.",
        "collab.gate.bulkWrite" => "협업 중에는 대량 문서 변경이 비활성화됩니다.",
        "collab.gate.replaceDocument" => "협업 중에는 전체 문서를 바꿀 수 없습니다.",
        "collab.gate.rootMetadata" => "문서 메타데이터 변경은 협업에서 아직 지원되지 않습니다.",
        "collab.gate.typography" => "타이포그래피 변경은 협업에서 아직 지원되지 않습니다.",
        "collab.gate.effects" => "효과는 협업에서 아직 지원되지 않습니다.",
        "collab.gate.visibilityLocking" => "표시 및 잠금 변경은 협업에서 아직 지원되지 않습니다.",
        "collab.gate.nodeReplacement" => "노드 교체는 협업에서 아직 지원되지 않습니다.",
        "collab.gate.nodeProperty" => "이 노드 속성은 협업에서 아직 지원되지 않습니다.",
        "collab.gate.nodeKind" => "이 노드 유형은 협업에서 아직 지원되지 않습니다.",
        "collab.gate.sessionTransition" => "협업 세션을 준비하는 동안 편집이 일시 중지됩니다.",
        "collab.gate.readOnly" => "이 협업 세션은 읽기 전용입니다.",
        "collab.gate.pendingEdit" => "대기 중인 편집이 확인될 때까지 다음 변경을 기다리세요.",
        "collab.gate.aiMcp" => "협업 중에는 AI 및 MCP 문서 쓰기가 비활성화됩니다.",
        "collab.gate.undoUnavailable" => {
            "협업에서는 전체 실행 취소가 비활성화됩니다. 확인된 본인 변경만 취소할 수 있습니다."
        }
        "collab.gate.redoUnavailable" => "협업에서는 다시 실행을 아직 사용할 수 없습니다.",
        "collab.gate.ownerOnlySave" => "공유 원본 파일은 소유자만 저장할 수 있습니다.",
        "collab.gate.leaveSessionFirst" => "다른 문서를 열거나 바꾸기 전에 협업 세션을 나가세요.",
        "collab.status.localEditPreserved" => {
            "원격 버전을 적용했습니다. “실행 취소”로 로컬 변경 사항을 복원할 수 있습니다."
        }
        "collab.a11y.participant" => "{{name}}, {{role}}",
        "collab.a11y.remoteCursor" => "{{name}}의 커서",
        "icon.catalogLoading" => "아이콘 카탈로그를 불러오는 중…",

        "sceneTemplate.deleteFailed" => "해당 템플릿을 삭제하지 못했습니다. 다시 시도해 주세요.",












































        "account.mcpToken" => "MCP 토큰",



        "assetCenter.template.mine" => "내 템플릿",
        "assetCenter.template.builtIn" => "기본 템플릿",
        "ai.designProgress.detail.failureReason" => "실패 원인: {{reason}}",
        "ai.designProgress.detail.noDiagnostic" => "에이전트가 오류 설명을 반환하지 않고 실패했습니다.",
        "ai.designProgress.detail.noResult" => "이 섹션의 결과를 반환하기 전에 에이전트가 중지되었습니다.",
        "ai.designProgress.detail.connectionClosed" => "이 섹션의 결과가 반환되기 전에 에이전트 연결이 끊겼습니다.",
        "ai.designProgress.detail.stoppedByUser" => "사용자가 중지하여 이 섹션이 완료되지 않았습니다.",
        "builtin.modelsOnePerLine" => "모델 ID, 한 줄에 하나씩",
        "builtin.typeModelManually" => "모델 목록을 가져오지 못했습니다. 모델 ID를 한 줄에 하나씩 입력하세요",
        "settings.provider.deepSeekHarness" => "DeepSeek Harness 모델",
        "settings.agents.deleteProvider" => "프로바이더 삭제",
        "chat.mcpRequired" => "{cli}을(를) 사용하려면 설정에서 OpenPencil MCP 연동을 켜세요",
        "video.title" => "비디오",
        "video.url" => "비디오 URL",
        "video.posterThisImage" => "포스터는 이 이미지입니다",
        "video.autoplay" => "자동 재생",
        "video.loop" => "반복 재생",
        "video.muted" => "음소거",
        "video.holdLastFrame" => "마지막 프레임 유지",
        "video.clickToReplay" => "클릭하여 다시 재생",
        "video.add" => "비디오 추가",
        "video.remove" => "비디오 제거",
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
        "workspace.export" => "내보내기",
        "workspace.professional" => "전문 편집",
        "workspace.phase.generating" => "생성 중",
        "workspace.phase.done" => "완료",
        "workspace.phase.stopped" => "중지됨",
        "workspace.phase.failed" => "실패",
        "workspace.view.all" => "전체",
        "workspace.view.singleScreen" => "단일 화면",
        "workspace.view.singlePage" => "단일 페이지",
        "workspace.view.long" => "긴 페이지",
        "workspace.view.overview" => "개요",
        "workspace.fit" => "맞춤",
        "workspace.present" => "재생",
        "workspace.retry" => "다시 시도",
        "workspace.returnEdit" => "편집으로 돌아가기",
        "workspace.backToWorkspace" => "작업 공간으로 돌아가기 →",
        "workspace.failed.note" => "생성이 중단되었습니다. 요청과 참고 자료는 유지되며 다시 시도할 수 있습니다.",
        _ => return None,
    })
}
