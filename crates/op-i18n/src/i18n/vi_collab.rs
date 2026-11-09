//! Chuỗi giao diện cộng tác.

pub fn lookup(key: &str) -> Option<&'static str> {
    Some(match key {
        "variables.libraryUpdates" => "{{count}} bản cập nhật thư viện · Chấp nhận",
        "drafts.title" => "Bản sao khôi phục",
        "drafts.notice" => "Khôi phục thay thế tài liệu hiện tại và có thể hoàn tác trong một bước. Bản sao lưu bảo vệ được tạo trước. Tệp liên kết không được lưu.",
        "drafts.create" => "Tạo điểm kiểm tra",
        "drafts.label" => "Tên điểm kiểm tra",
        "drafts.empty" => "Chưa có bản sao khôi phục.",
        "drafts.restoreConfirm" => "Khôi phục bản sao này?",
        "drafts.deleteConfirm" => "Xóa vĩnh viễn bản sao khôi phục này?",
        "drafts.syncError" => "Chờ các chỉnh sửa cục bộ đồng bộ xong rồi thử lại.",
        "drafts.refresh" => "Làm mới",
        "drafts.failed" => "Yêu cầu khôi phục thất bại: {{message}}",
        "drafts.loading" => "Đang cập nhật bản sao khôi phục…",
        "drafts.autosave" => "Lưu tự động",
        "drafts.checkpoint" => "Điểm kiểm tra",
        "drafts.backup" => "Bản sao lưu bảo vệ",
        "colorPicker.sampleError" => "Không thể lấy mẫu màu: {{message}}",
        "statusbar.interfaceScale" => "Tỷ lệ giao diện",
        "statusbar.viewOptions" => "Tùy chọn chế độ xem",
    "preview.emptyPage" => "Trang này không có khung hiển thị để xem trước.",
    "preview.noFrame" => "Không viền",
    "preview.fit" => "Vừa cửa sổ",
    "preview.mode.preview" => "Xem trước",
    "preview.mode.present" => "Trình chiếu",
    "preview.list" => "Trang và khung",
    "preview.rotate" => "Xoay thiết bị",
    "preview.previous" => "Khung trước",
    "preview.next" => "Khung tiếp",
        "position.alignLeft" => "Căn trái",
        "position.alignCenterH" => "Căn giữa theo chiều ngang",
        "position.alignRight" => "Căn phải",
        "position.alignTop" => "Căn trên",
        "position.alignCenterV" => "Căn giữa theo chiều dọc",
        "position.alignBottom" => "Căn dưới",
        "position.distributeH" => "Phân bố theo chiều ngang",
        "position.distributeV" => "Phân bố theo chiều dọc",
        "canvas.pixelGrid" => "Thước và lưới pixel",
        "collab.topbar.collaborate" => "Cộng tác",
        "collab.topbar.starting" => "Đang bắt đầu cộng tác…",
        "collab.topbar.joining" => "Đang tham gia…",
        "collab.topbar.authenticating" => "Đang xác thực…",
        "collab.topbar.connected" => "Đã kết nối",
        "collab.topbar.reconnecting" => "Đang kết nối lại…",
        "collab.topbar.readOnly" => "Chỉ đọc",
        "collab.topbar.ended" => "Phiên đã kết thúc",
        "collab.topbar.participants" => "{{count}} người tham gia",
        "collab.topbar.unavailable" => "Bản dựng này chưa hỗ trợ cộng tác",
        "collab.action.start" => "Tạo phiên",
        "collab.action.join" => "Tham gia phiên",
        "collab.home.hint" => "Tạo phiên mới hoặc tham gia bằng lời mời.",
        "home.connectMoreModels" => "Connect more models…",
        "home.connect.title" => "Connect a model first",
        "home.connect.free" => "Use OpenPencil free credits",
        "home.connect.freeNote" => "20 turns a day after sign-in — start right away",
        "home.connect.apiKey" => "Use my own API key",
        "home.connect.apiKeyNote" => "Zhipu / DeepSeek / OpenAI-compatible",
        "home.connect.cli" => "Connect a local CLI",
        "home.connect.cliNote" => "Claude Code · Codex · ZCode",
        "home.connect.chipEmpty" => "Connect a model first",
        "collab.create.choose" => "Chọn cách người khác có thể kết nối.",
        "collab.action.leave" => "Rời phiên",
        "collab.action.retry" => "Thử lại",
        "collab.action.cancel" => "Hủy",
        "collab.action.connect" => "Kết nối",
        "collab.action.copyInviteCode" => "Sao chép mã mời",
        "collab.action.copyInviteLink" => "Sao chép liên kết mời",
        "collab.action.findNearby" => "Tìm ở gần",
        "collab.join.code" => "Mã mời hoặc địa chỉ IP",
        "collab.join.codePlaceholder" => "A2C4E6G8J0 hoặc 192.168.1.8:43120",
        "collab.join.publicHint" => "Mã mời kết nối an toàn qua Internet.",
        "collab.join.nearby" => "Phiên ở gần",
        "collab.session.invite" => "Mã mời công khai",
        "collab.session.preparingInvite" => "Đang chuẩn bị lời mời an toàn…",
        "collab.session.publicReady" => "Relay công khai đã sẵn sàng",
        "collab.session.region" => "Khu vực relay chính",
        "collab.connection.lan" => "Mạng cục bộ",
        "collab.connection.relay" => "Relay công khai",
        "collab.region.china" => "Trung Quốc",
        "collab.region.global" => "Toàn cầu",
        "collab.error.inviteUnavailable" => "Lời mời này không khả dụng hoặc đã hết hạn.",
        "collab.error.relayUnavailable" => "Relay công khai tạm thời không khả dụng.",
        "collab.error.inviteInvalid" => "Mã mời không hợp lệ. Hãy kiểm tra và thử lại.",
        "collab.error.inviteExpired" => "Mã mời đã hết hạn. Hãy xin chủ phiên một mã mới.",
        "collab.error.relayNotConfigured" => "Thiết bị này chưa cấu hình relay công cộng.",
        "collab.error.regionUnavailable" => "Khu vực relay chính của lời mời không khả dụng.",
        "collab.error.secureKeyUnavailable" => "Không thể truy cập khóa bảo mật của thiết bị. Hãy kiểm tra quyền truy cập chuỗi khóa rồi thử lại.",
        "collab.error.rateLimited" => "Có quá nhiều lần thử kết nối. Hãy thử lại sau.",
        "collab.action.discardPending" => "Bỏ chỉnh sửa đang chờ",
        "collab.action.saveAsFork" => "Lưu thành bản phân nhánh",
        "collab.action.approveEditor" => "Duyệt quyền chỉnh sửa",
        "collab.action.approveViewer" => "Duyệt quyền xem",
        "collab.action.rejectAdmission" => "Từ chối",
        "collab.admission.request" => "Một người tham gia đã xác thực đang yêu cầu quyền truy cập.",
        "collab.join.title" => "Tham gia phiên cộng tác",
        "collab.join.discovering" => "Đang tìm phiên trong mạng cục bộ…",
        "collab.join.noSessions" => "Không tìm thấy phiên cục bộ",
        "collab.join.address" => "Địa chỉ IP và cổng",
        "collab.join.addressPlaceholder" => "192.168.1.8:43120",
        "collab.join.authenticating" => "Đang xác minh phiên bảo mật…",
        "collab.join.incompatible" => "Phiên này dùng phiên bản không tương thích",
        "collab.join.signInRequired" => "Đăng nhập để bắt đầu hoặc tham gia phiên",
        "collab.session.title" => "Cộng tác",
        "collab.session.name" => "Phiên: {{name}}",
        "collab.session.shareAddress" => "Địa chỉ chia sẻ",
        "collab.session.role.owner" => "Chủ sở hữu",
        "collab.session.role.editor" => "Người chỉnh sửa",
        "collab.session.role.viewer" => "Người xem",
        "collab.session.pending" => "Đang chờ chủ sở hữu xác nhận chỉnh sửa của bạn…",
        "collab.status.disconnectedReadOnly" => {
            "Mất kết nối. Chỉnh sửa tạm dừng trong khi kết nối lại."
        }
        "collab.status.ticketExpired" => "Đăng nhập cộng tác đã hết hạn. Hãy đăng nhập lại.",
        "collab.status.ownerLeft" => {
            "Chủ sở hữu đã rời nên phiên kết thúc. Bạn có thể lưu một bản riêng."
        }
        "collab.status.epochChanged" => {
            "Chủ sở hữu đã bắt đầu phiên mới. Chỉnh sửa đang chờ chưa được gửi."
        }
        "collab.status.undoConflict" => {
            "Không thể hoàn tác vì cùng trường đã được người khác sửa sau đó."
        }
        "collab.status.unsupportedEdit" => "Chỉnh sửa này chưa được hỗ trợ và không được áp dụng.",
        "collab.status.profileUnavailable" => {
            "Không tải được ảnh hồ sơ; đang hiển thị chữ viết tắt."
        }
        "collab.reject.staleBase" => "Tài liệu đã thay đổi trước. Đang đồng bộ rồi thử lại.",
        "collab.reject.readOnly" => "Bạn chỉ có quyền xem trong phiên này.",
        "collab.reject.unsupported" => "Chủ sở hữu không hỗ trợ chỉnh sửa đó.",
        "collab.reject.conflict" => "Chỉnh sửa đó xung đột với thay đổi mới hơn.",
        "collab.reject.conflictDetail" => "Đã loại bỏ: {{fields}} trên “{{node}}”.",
        "collab.action.reapply" => "Áp dụng lại chỉnh sửa của tôi",
        "collab.reject.resourceLimit" => "Chỉnh sửa đó vượt giới hạn của phiên.",
        "collab.reject.authentication" => "Quyền cộng tác của bạn không còn hợp lệ.",
        "collab.reject.unknown" => "Chủ sở hữu đã từ chối chỉnh sửa đó.",
        "collab.gate.pages" => "Thay đổi trang chưa được hỗ trợ khi cộng tác.",
        "collab.gate.pageBackground" => "Thay đổi nền trang chưa được hỗ trợ.",
        "collab.gate.variablesThemes" => "Biến và chủ đề chưa được hỗ trợ.",
        "collab.gate.components" => "Thay đổi sổ đăng ký thành phần chưa được hỗ trợ.",
        "collab.gate.uikit" => "Thay đổi UIKit chưa được hỗ trợ.",
        "collab.gate.externalAssets" => "Chưa thể nhập ảnh, SVG, HTML và tài nguyên bên ngoài.",
        "collab.gate.clipboardPaste" => "Dán nội dung tài liệu chưa được hỗ trợ.",
        "collab.gate.duplicate" => "Nhân đôi nút chưa được hỗ trợ.",
        "collab.gate.bulkWrite" => "Thay đổi hàng loạt bị tắt khi cộng tác.",
        "collab.gate.replaceDocument" => "Thay toàn bộ tài liệu bị tắt khi cộng tác.",
        "collab.gate.rootMetadata" => "Thay đổi siêu dữ liệu tài liệu chưa được hỗ trợ.",
        "collab.gate.typography" => "Thay đổi kiểu chữ chưa được hỗ trợ.",
        "collab.gate.effects" => "Hiệu ứng chưa được hỗ trợ.",
        "collab.gate.visibilityLocking" => "Thay đổi hiển thị và khóa chưa được hỗ trợ.",
        "collab.gate.nodeReplacement" => "Thay thế nút chưa được hỗ trợ.",
        "collab.gate.nodeProperty" => "Thuộc tính nút này chưa được hỗ trợ.",
        "collab.gate.nodeKind" => "Loại nút này chưa được hỗ trợ.",
        "collab.gate.sessionTransition" => "Chỉnh sửa tạm dừng trong khi chuẩn bị phiên.",
        "collab.gate.readOnly" => "Phiên cộng tác này chỉ đọc.",
        "collab.gate.pendingEdit" => "Hãy chờ chỉnh sửa đang chờ được xác nhận.",
        "collab.gate.aiMcp" => "Ghi tài liệu bằng AI và MCP bị tắt khi cộng tác.",
        "collab.gate.undoUnavailable" => {
            "Hoàn tác toàn cục bị tắt. Chỉ có thể hoàn tác thay đổi đã xác nhận của bạn."
        }
        "collab.gate.redoUnavailable" => "Làm lại chưa khả dụng khi cộng tác.",
        "collab.gate.ownerOnlySave" => "Chỉ chủ sở hữu mới có thể lưu tệp nguồn dùng chung.",
        "collab.gate.leaveSessionFirst" => "Rời phiên trước khi mở hoặc thay thế tài liệu khác.",
        "collab.status.localEditPreserved" => {
            "Đã áp dụng phiên bản từ xa. Dùng “Hoàn tác” để khôi phục các thay đổi cục bộ của bạn."
        }
        "collab.a11y.participant" => "{{name}}, {{role}}",
        "collab.a11y.remoteCursor" => "Con trỏ của {{name}}",
        "icon.catalogLoading" => "Đang tải danh mục biểu tượng…",

        "sceneTemplate.deleteFailed" => "Không thể xóa mẫu đó. Hãy thử lại.",












































        "account.mcpToken" => "Token MCP",



        "assetCenter.template.mine" => "Mẫu của tôi",
        "assetCenter.template.builtIn" => "Mẫu tích hợp",
        "ai.designProgress.detail.failureReason" => "Lý do: {{reason}}",
        "ai.designProgress.detail.noDiagnostic" => "Agent thất bại mà không trả về mô tả lỗi.",
        "ai.designProgress.detail.noResult" => "Agent đã dừng trước khi trả về kết quả cho phần này.",
        "ai.designProgress.detail.connectionClosed" => "Kết nối agent đã đóng trước khi phần này trả về kết quả.",
        "ai.designProgress.detail.stoppedByUser" => "Người dùng đã dừng trước khi phần này hoàn tất.",
        "builtin.modelsOnePerLine" => "ID model, mỗi dòng một mã",
        "builtin.typeModelManually" => "Không lấy được danh sách model. Nhập ID thủ công, mỗi dòng một mã.",
        "settings.provider.deepSeekHarness" => "Mô hình DeepSeek Harness",
        "settings.agents.deleteProvider" => "Xóa nhà cung cấp",
        "chat.mcpRequired" => "{cli} cần bật tích hợp OpenPencil MCP trong Cài đặt",
        "video.title" => "Video",
        "video.url" => "URL video",
        "video.posterThisImage" => "poster là hình ảnh này",
        "video.autoplay" => "Tự động phát",
        "video.loop" => "Lặp lại",
        "video.muted" => "Tắt tiếng",
        "video.holdLastFrame" => "Giữ khung hình cuối",
        "video.clickToReplay" => "Nhấp để phát lại",
        "video.add" => "Thêm video",
        "video.remove" => "Xóa video",
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
        "workspace.export" => "Xuất",
        "workspace.professional" => "Chỉnh sửa pro",
        "workspace.phase.generating" => "Đang tạo",
        "workspace.phase.done" => "Hoàn tất",
        "workspace.phase.stopped" => "Đã dừng",
        "workspace.phase.failed" => "Lỗi",
        "workspace.view.all" => "Tất cả",
        "workspace.view.singleScreen" => "Một màn hình",
        "workspace.view.singlePage" => "Một trang",
        "workspace.view.long" => "Trang dài",
        "workspace.view.overview" => "Tổng quan",
        "workspace.fit" => "Vừa khung",
        "workspace.present" => "Trình chiếu",
        "workspace.retry" => "Thử lại",
        "workspace.returnEdit" => "Quay lại chỉnh sửa",
        "workspace.backToWorkspace" => "Về vùng làm việc →",
        "workspace.failed.note" => "Quá trình tạo bị gián đoạn. Yêu cầu và tài liệu tham khảo vẫn được giữ — bạn có thể thử lại.",
        _ => return None,
    })
}
