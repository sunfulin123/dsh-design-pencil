//! Text decoration (italic / underline / strikethrough) and semantics /
//! explain / screen metadata mutators on `EditorState`.

use super::resolve_text_node_mut;
use crate::node_id::NodeId;
use crate::pen_node_ext::PenNodeExt;
use crate::state::EditorState;
use crate::walkers::find_node_mut;
use jian_ops_schema::node::text::FontStyleKind;
use jian_ops_schema::node::PenNode;

impl EditorState {
    /// Toggle italic font style on a Text node (or single-text wrapper).
    pub fn toggle_node_text_italic(&mut self, node_id: &NodeId) -> bool {
        if !node_id.is_real() {
            return false;
        }
        let Some(node) = find_node_mut(self.active_children_mut(), node_id) else {
            return false;
        };
        let Some(t) = resolve_text_node_mut(node) else {
            return false;
        };
        t.font_style = match t.font_style {
            Some(FontStyleKind::Italic) => Some(FontStyleKind::Normal),
            _ => Some(FontStyleKind::Italic),
        };
        self.mark_document_changed();
        true
    }

    /// Toggle underline decoration on a Text node (or single-text wrapper).
    pub fn toggle_node_text_underline(&mut self, node_id: &NodeId) -> bool {
        if !node_id.is_real() {
            return false;
        }
        let Some(node) = find_node_mut(self.active_children_mut(), node_id) else {
            return false;
        };
        let Some(t) = resolve_text_node_mut(node) else {
            return false;
        };
        t.underline = Some(!t.underline.unwrap_or(false));
        self.mark_document_changed();
        true
    }

    /// Toggle strikethrough decoration on a Text node (or single-text wrapper).
    pub fn toggle_node_text_strikethrough(&mut self, node_id: &NodeId) -> bool {
        if !node_id.is_real() {
            return false;
        }
        let Some(node) = find_node_mut(self.active_children_mut(), node_id) else {
            return false;
        };
        let Some(t) = resolve_text_node_mut(node) else {
            return false;
        };
        t.strikethrough = Some(!t.strikethrough.unwrap_or(false));
        self.mark_document_changed();
        true
    }

    /// Set the semantic role (`base.role` and `semantics.role` when matching) on a node.
    pub fn set_node_role_str(&mut self, node_id: &NodeId, role: &str) -> bool {
        if !node_id.is_real() {
            return false;
        }
        let Some(node) = find_node_mut(self.active_children_mut(), node_id) else {
            return false;
        };
        let trimmed = role.trim();
        node.base_mut().role = if trimmed.is_empty() {
            None
        } else {
            Some(trimmed.to_string())
        };
        if let Some(sem_slot) = node_semantics_slot(node) {
            let parsed_role = serde_json::from_value::<jian_ops_schema::semantics::SemanticRole>(
                serde_json::Value::String(trimmed.to_lowercase()),
            )
            .ok();
            if parsed_role.is_some() {
                sem_slot.get_or_insert_with(Default::default).role = parsed_role;
            } else if trimmed.is_empty() {
                if let Some(sem) = sem_slot.as_mut() {
                    sem.role = None;
                }
            }
        }
        self.mark_document_changed();
        true
    }

    /// Set the design explanation / AI description (`base.explain` + `semantics.aiDescription`) on a node.
    pub fn set_node_explain_str(&mut self, node_id: &NodeId, explain: &str) -> bool {
        if !node_id.is_real() {
            return false;
        }
        let Some(node) = find_node_mut(self.active_children_mut(), node_id) else {
            return false;
        };
        let trimmed = explain.trim();
        node.base_mut().explain = if trimmed.is_empty() {
            None
        } else {
            Some(trimmed.to_string())
        };
        if let Some(sem_slot) = node_semantics_slot(node) {
            if trimmed.is_empty() {
                if let Some(sem) = sem_slot.as_mut() {
                    sem.ai_description = None;
                }
            } else {
                sem_slot.get_or_insert_with(Default::default).ai_description =
                    Some(trimmed.to_string());
            }
        }
        self.mark_document_changed();
        true
    }

    /// Set the accessibility label (`semantics.label` / `aria-label`) on a node.
    pub fn set_node_a11y_label_str(&mut self, node_id: &NodeId, label: &str) -> bool {
        if !node_id.is_real() {
            return false;
        }
        let Some(node) = find_node_mut(self.active_children_mut(), node_id) else {
            return false;
        };
        let Some(sem_slot) = node_semantics_slot(node) else {
            return false;
        };
        let trimmed = label.trim();
        if trimmed.is_empty() {
            if let Some(sem) = sem_slot.as_mut() {
                sem.label = None;
            }
        } else {
            sem_slot.get_or_insert_with(Default::default).label = Some(trimmed.to_string());
        }
        self.mark_document_changed();
        true
    }

    /// Set the interaction action description (`semantics.hint`) on a node.
    pub fn set_node_interaction_desc_str(&mut self, node_id: &NodeId, desc: &str) -> bool {
        if !node_id.is_real() {
            return false;
        }
        let Some(node) = find_node_mut(self.active_children_mut(), node_id) else {
            return false;
        };
        let Some(sem_slot) = node_semantics_slot(node) else {
            return false;
        };
        let trimmed = desc.trim();
        if trimmed.is_empty() {
            if let Some(sem) = sem_slot.as_mut() {
                sem.hint = None;
            }
        } else {
            sem_slot.get_or_insert_with(Default::default).hint = Some(trimmed.to_string());
        }
        self.mark_document_changed();
        true
    }

    /// Set the component capability / usage description (`semantics.aiDescription` + `base.explain`) on a node.
    pub fn set_node_component_desc_str(&mut self, node_id: &NodeId, desc: &str) -> bool {
        if !node_id.is_real() {
            return false;
        }
        let Some(node) = find_node_mut(self.active_children_mut(), node_id) else {
            return false;
        };
        let trimmed = desc.trim();
        if let Some(sem_slot) = node_semantics_slot(node) {
            if trimmed.is_empty() {
                if let Some(sem) = sem_slot.as_mut() {
                    sem.ai_description = None;
                }
            } else {
                sem_slot.get_or_insert_with(Default::default).ai_description =
                    Some(trimmed.to_string());
            }
        }
        node.base_mut().explain = if trimmed.is_empty() {
            None
        } else {
            Some(trimmed.to_string())
        };
        self.mark_document_changed();
        true
    }

    /// Set the screen route path (`screen`) on a top-level Frame node.
    pub fn set_node_screen_str(&mut self, node_id: &NodeId, screen: &str) -> bool {
        if !node_id.is_real() {
            return false;
        }
        let Some(PenNode::Frame(f)) = find_node_mut(self.active_children_mut(), node_id) else {
            return false;
        };
        let trimmed = screen.trim();
        f.screen = if trimmed.is_empty() {
            None
        } else {
            Some(trimmed.to_string())
        };
        self.mark_document_changed();
        true
    }
}

pub fn node_semantics(node: &PenNode) -> Option<&jian_ops_schema::semantics::SemanticsMeta> {
    match node {
        PenNode::Frame(n) => n.semantics.as_ref(),
        PenNode::Group(n) => n.semantics.as_ref(),
        PenNode::Rectangle(n) => n.semantics.as_ref(),
        PenNode::Ellipse(n) => n.semantics.as_ref(),
        PenNode::Polygon(n) => n.semantics.as_ref(),
        PenNode::Line(n) => n.semantics.as_ref(),
        PenNode::Path(n) => n.semantics.as_ref(),
        PenNode::Text(n) => n.semantics.as_ref(),
        PenNode::Image(n) => n.semantics.as_ref(),
        PenNode::IconFont(n) => n.semantics.as_ref(),
        PenNode::TextInput(n) => n.semantics.as_ref(),
        PenNode::TextArea(n) => n.semantics.as_ref(),
        PenNode::NumberInput(n) => n.semantics.as_ref(),
        PenNode::Select(n) => n.semantics.as_ref(),
        PenNode::RadioGroup(n) => n.semantics.as_ref(),
        PenNode::Switch(n) => n.semantics.as_ref(),
        PenNode::Checkbox(n) => n.semantics.as_ref(),
        PenNode::Slider(n) => n.semantics.as_ref(),
        PenNode::Progress(n) => n.semantics.as_ref(),
        PenNode::Tabs(n) => n.semantics.as_ref(),
        PenNode::Ref(n) => n.semantics.as_ref(),
    }
}

pub(crate) fn node_semantics_slot(
    node: &mut PenNode,
) -> Option<&mut Option<jian_ops_schema::semantics::SemanticsMeta>> {
    match node {
        PenNode::Frame(n) => Some(&mut n.semantics),
        PenNode::Group(n) => Some(&mut n.semantics),
        PenNode::Rectangle(n) => Some(&mut n.semantics),
        PenNode::Ellipse(n) => Some(&mut n.semantics),
        PenNode::Polygon(n) => Some(&mut n.semantics),
        PenNode::Line(n) => Some(&mut n.semantics),
        PenNode::Path(n) => Some(&mut n.semantics),
        PenNode::Text(n) => Some(&mut n.semantics),
        PenNode::Image(n) => Some(&mut n.semantics),
        PenNode::IconFont(n) => Some(&mut n.semantics),
        PenNode::TextInput(n) => Some(&mut n.semantics),
        PenNode::TextArea(n) => Some(&mut n.semantics),
        PenNode::NumberInput(n) => Some(&mut n.semantics),
        PenNode::Select(n) => Some(&mut n.semantics),
        PenNode::RadioGroup(n) => Some(&mut n.semantics),
        PenNode::Switch(n) => Some(&mut n.semantics),
        PenNode::Checkbox(n) => Some(&mut n.semantics),
        PenNode::Slider(n) => Some(&mut n.semantics),
        PenNode::Progress(n) => Some(&mut n.semantics),
        PenNode::Tabs(n) => Some(&mut n.semantics),
        PenNode::Ref(n) => Some(&mut n.semantics),
    }
}

/// Resolve the node's semantic role: returns the authored `base.role` or
/// `semantics.role` when present, otherwise deterministically infers a semantic
/// role from the node's type, name, layout, dimensions, and children.
pub fn effective_node_role(node: &PenNode, is_top_level: bool) -> String {
    let base = node.base();
    if let Some(role) = base
        .role
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
    {
        return role.to_string();
    }
    if let Some(role) = node_semantics(node)
        .and_then(|s| s.role)
        .and_then(|r| serde_json::to_value(r).ok())
        .and_then(|v| v.as_str().map(str::to_string))
        .filter(|s| !s.is_empty())
    {
        return role;
    }

    let name_lower = base.name.as_deref().unwrap_or("").to_lowercase();
    match node {
        PenNode::Frame(_) | PenNode::Group(_) => {
            if is_top_level {
                return "page".to_string();
            }
            if contains_any(
                &name_lower,
                &[
                    "header",
                    "topbar",
                    "navbar",
                    "nav bar",
                    "顶栏",
                    "顶部",
                    "导航栏",
                    "页眉",
                ],
            ) {
                return "navbar".to_string();
            }
            if contains_any(
                &name_lower,
                &["nav-links", "nav links", "menu", "导航菜单", "导航列表"],
            ) {
                return "nav-links".to_string();
            }
            if contains_any(
                &name_lower,
                &["nav-link", "nav item", "menu item", "导航项"],
            ) {
                return "nav-link".to_string();
            }
            if contains_any(&name_lower, &["footer", "页脚", "底部栏"]) {
                return "footer".to_string();
            }
            if contains_any(&name_lower, &["hero", "banner", "主视觉", "横幅", "首屏"]) {
                return "hero".to_string();
            }
            if contains_any(&name_lower, &["sidebar", "aside", "rail", "侧边栏", "侧栏"]) {
                return "sidebar".to_string();
            }
            if contains_any(
                &name_lower,
                &["toolbar", "actions", "action bar", "工具栏", "操作栏"],
            ) {
                return "toolbar".to_string();
            }
            if contains_any(&name_lower, &["icon-button", "icon btn", "图标按钮"]) {
                return "icon-button".to_string();
            }
            if node.on_tap().is_some_and(|a| !a.is_empty())
                || contains_any(
                    &name_lower,
                    &[
                        "button", "btn", "cta", "submit", "按钮", "立即", "购买", "提交", "确认",
                        "登录", "注册",
                    ],
                )
            {
                return "button".to_string();
            }
            if contains_any(&name_lower, &["search", "搜索"]) {
                return "searchbox".to_string();
            }
            if contains_any(&name_lower, &["input", "field", "输入框", "表单"]) {
                return "input".to_string();
            }
            if contains_any(&name_lower, &["tab", "标签页", "选项卡"]) {
                return "tab".to_string();
            }
            if contains_any(
                &name_lower,
                &[
                    "badge", "tag", "chip", "pill", "status", "徽标", "标签", "状态",
                ],
            ) {
                return "badge".to_string();
            }
            if contains_any(
                &name_lower,
                &[
                    "card",
                    "tile",
                    "product",
                    "feature",
                    "item",
                    "卡片",
                    "商品",
                    "推荐项",
                ],
            ) {
                return "card".to_string();
            }
            if contains_any(
                &name_lower,
                &["grid", "list", "columns", "列表", "网格", "货架"],
            ) {
                return "list".to_string();
            }
            if contains_any(
                &name_lower,
                &[
                    "media",
                    "image",
                    "photo",
                    "visual",
                    "art",
                    "thumbnail",
                    "图片",
                    "封面",
                    "缩略图",
                    "媒体",
                ],
            ) {
                return "media".to_string();
            }
            if contains_any(
                &name_lower,
                &[
                    "section", "panel", "module", "block", "area", "区块", "模块", "区域", "专区",
                    "面板",
                ],
            ) {
                return "section".to_string();
            }
            if super::resolve_text_node(node).is_some() {
                return "text-container".to_string();
            }
            if node.width_px().is_some_and(|w| w >= 600.0) {
                "section".to_string()
            } else if matches!(
                node,
                PenNode::Frame(f)
                    if matches!(
                        f.container.layout,
                        Some(jian_ops_schema::node::LayoutMode::Horizontal)
                    )
            ) {
                "row".to_string()
            } else {
                "container".to_string()
            }
        }
        PenNode::Text(t) => {
            if t.font_size.unwrap_or(14.0) >= 20.0 {
                "heading".to_string()
            } else {
                "text".to_string()
            }
        }
        PenNode::Image(_) => "image".to_string(),
        PenNode::IconFont(_) | PenNode::Path(_) => "icon".to_string(),
        PenNode::TextInput(_) | PenNode::TextArea(_) | PenNode::NumberInput(_) => {
            "input".to_string()
        }
        PenNode::Select(_) => "select".to_string(),
        PenNode::RadioGroup(_) => "radiogroup".to_string(),
        PenNode::Switch(_) => "switch".to_string(),
        PenNode::Checkbox(_) => "checkbox".to_string(),
        PenNode::Slider(_) => "slider".to_string(),
        PenNode::Progress(_) => "progressbar".to_string(),
        PenNode::Tabs(_) => "tablist".to_string(),
        PenNode::Ref(_) => "component".to_string(),
        PenNode::Rectangle(_) | PenNode::Ellipse(_) | PenNode::Polygon(_) | PenNode::Line(_) => {
            "graphic".to_string()
        }
    }
}

/// Resolve the node's accessibility label (`aria-label`): returns the authored
/// `semantics.label` when present, otherwise synthesizes a concise, meaningful
/// screen-reader / AI label from the node's role, name, and primary text content.
pub fn effective_node_a11y_label(node: &PenNode, is_top_level: bool) -> String {
    if let Some(label) = node_semantics(node)
        .and_then(|s| s.label.as_deref())
        .map(str::trim)
        .filter(|s| !s.is_empty())
    {
        return label.to_string();
    }
    let role = effective_node_role(node, is_top_level);
    let role_cn = role_chinese_label(&role);
    let name = node
        .base()
        .name
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .unwrap_or("");
    let mut texts = Vec::new();
    collect_visible_text_snippets(node, &mut texts, 2);
    let primary_text = texts.first().map(String::as_str).unwrap_or("");

    match node {
        PenNode::Text(_) => {
            if !primary_text.is_empty() {
                truncate_chars(primary_text, 42)
            } else if !name.is_empty() {
                name.to_string()
            } else {
                role_cn.to_string()
            }
        }
        PenNode::IconFont(icon) => {
            if !name.is_empty() {
                format!("图标：{name}")
            } else if !icon.icon_font_name.is_empty() {
                format!("图标：{}", icon.icon_font_name)
            } else {
                "装饰与功能图标".to_string()
            }
        }
        PenNode::Image(_) => {
            if !name.is_empty() {
                format!("图片：{name}")
            } else {
                "视觉配图".to_string()
            }
        }
        _ => {
            if !name.is_empty()
                && !primary_text.is_empty()
                && !name.eq_ignore_ascii_case(primary_text)
            {
                format!("{role_cn} ({name}) · 可读内容：「{primary_text}」")
            } else if !name.is_empty() {
                format!("{role_cn}：{name}")
            } else if !primary_text.is_empty() {
                format!("{role_cn}：「{primary_text}」")
            } else {
                role_cn.to_string()
            }
        }
    }
}

/// Resolve the node's design & implementation note (`explain`): returns the
/// authored `base.explain` or `semantics.aiDescription` when present, otherwise
/// synthesizes a concrete layout + restoration specification for AI codegen.
pub fn effective_node_explain(node: &PenNode, is_top_level: bool) -> String {
    if let Some(explain) = node
        .base()
        .explain
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
    {
        return explain.to_string();
    }
    if let Some(desc) = node_semantics(node)
        .and_then(|s| s.ai_description.as_deref())
        .map(str::trim)
        .filter(|s| !s.is_empty())
    {
        return desc.to_string();
    }

    let role = effective_node_role(node, is_top_level);
    let role_cn = role_chinese_label(&role);
    let html_tag = recommended_html_tag(&role);
    let mut texts = Vec::new();
    collect_visible_text_snippets(node, &mut texts, 2);
    let text_suffix = if texts.is_empty() {
        String::new()
    } else {
        format!(" · 包含文案「{}」", texts.join(" / "))
    };
    match node {
        PenNode::Frame(f) => {
            let layout_desc = match f.container.layout {
                Some(jian_ops_schema::node::LayoutMode::Horizontal) => "横向弹性布局 (flex-row)",
                Some(jian_ops_schema::node::LayoutMode::Vertical) => "纵向弹性布局 (flex-col)",
                _ => "自由定位容器",
            };
            let child_count = f.children.as_ref().map_or(0, Vec::len);
            let interaction_hint = if is_interactive_role(&role) {
                "支持悬停态与点击交互响应"
            } else {
                "保持内边距、间距与子元素对齐还原"
            };
            if child_count > 0 {
                format!("{role_cn} (<{html_tag}>) · {layout_desc}，含 {child_count} 个子节点{text_suffix}，{interaction_hint}")
            } else {
                format!("{role_cn} (<{html_tag}>) · {layout_desc}{text_suffix}，{interaction_hint}")
            }
        }
        PenNode::Group(g) => {
            let child_count = g.children.as_ref().map_or(0, Vec::len);
            format!("{role_cn} (<{html_tag}>) · 组合容器（含 {child_count} 个子节点）{text_suffix}，按相对坐标或弹性结构还原")
        }
        PenNode::Text(t) => {
            let fs = t.font_size.unwrap_or(14.0).round() as i32;
            format!("{role_cn} (<{html_tag}>) · 字号 {fs}px{text_suffix}，保持精确字重、行高与颜色变量还原")
        }
        PenNode::Image(_) => {
            "图片媒体节点 (<img>) · 保持宽高比、圆角裁切与对象填充模式 (object-cover) 还原"
                .to_string()
        }
        PenNode::IconFont(icon) => {
            format!(
                "矢量图标 ({}) · 保持尺寸与颜色对齐还原",
                icon.icon_font_name
            )
        }
        _ => format!("{role_cn} (<{html_tag}>){text_suffix} · 保持视觉尺寸、圆角与配色还原"),
    }
}

/// Resolve the node's interaction action description: returns `semantics.hint`
/// when authored, or formats `events.onTap` actions ("跳转至 /path" / "返回上一页"),
/// or infers a concrete action description (e.g. "点击进入详情页", "返回上一页",
/// "点击跳转新页面", "输入关键词触发搜索") from the node's role and name.
pub fn effective_node_interaction_desc(node: &PenNode, is_top_level: bool) -> String {
    if let Some(hint) = node_semantics(node)
        .and_then(|s| s.hint.as_deref())
        .map(str::trim)
        .filter(|s| !s.is_empty())
    {
        return hint.to_string();
    }
    if let Some(actions) = node.on_tap().filter(|a| !a.is_empty()) {
        let mut parts = Vec::new();
        for action in actions {
            if let Some((key, body)) = action.single() {
                match key {
                    "push" | "replace" => {
                        let path = body
                            .as_str()
                            .and_then(|s| s.strip_prefix('"').and_then(|r| r.strip_suffix('"')))
                            .or_else(|| body.as_str())
                            .unwrap_or("/");
                        parts.push(format!("点击跳转至页面 {path}"));
                    }
                    "pop" => parts.push("点击返回上一页 (后退)".to_string()),
                    other => parts.push(format!("点击触发动作 ({other})")),
                }
            }
        }
        if !parts.is_empty() {
            return parts.join("；");
        }
    }

    let role = effective_node_role(node, is_top_level);
    let name_lower = node.base().name.as_deref().unwrap_or("").to_lowercase();
    if contains_any(
        &name_lower,
        &["back", "prev", "return", "返回", "后退", "上一步"],
    ) {
        return "点击返回上一页（后退）".to_string();
    }
    if contains_any(
        &name_lower,
        &["next", "forward", "continue", "前进", "下一步", "继续"],
    ) {
        return "点击前进至下一步页面".to_string();
    }
    if contains_any(&name_lower, &["close", "cancel", "dismiss", "关闭", "取消"]) {
        return "点击关闭当前弹窗或返回".to_string();
    }
    if contains_any(
        &name_lower,
        &["detail", "more", "view", "详情", "查看更多", "查看全部"],
    ) {
        return "点击进入详情页面查看完整内容".to_string();
    }
    match role.as_str() {
        "button" | "cta" => "点击触发当前主操作或跳转至目标页面".to_string(),
        "icon-button" => "点击触发工具栏快捷操作或打开弹窗".to_string(),
        "nav-link" => "点击跳转至对应导航栏目页面".to_string(),
        "tab" | "tablist" => "点击切换当前激活的选项卡视图".to_string(),
        "searchbox" => "输入关键词实时过滤或回车跳转搜索结果页".to_string(),
        "input" | "select" | "checkbox" | "switch" | "slider" | "radiogroup" => {
            "聚焦录入或点击切换表单选中状态".to_string()
        }
        "card" => "悬停高亮卡片，点击进入对应条目详情页".to_string(),
        "navbar" | "nav-links" | "toolbar" => {
            "承载顶部导航与快捷操作入口，子项响应点击跳转".to_string()
        }
        "hero" => "首屏核心视觉引导区，引导用户点击主按钮进入核心流程".to_string(),
        "section" | "list" => "浏览区块内容，支持点击内部卡片或按钮进入详情".to_string(),
        "footer" => "底部辅助导航区，点击链接跳转对应说明页面".to_string(),
        "page" => "顶层页面画板，支持纵向滚动浏览与跨页面路由跳转".to_string(),
        _ => "静态展示元素，可根据业务需要绑定点击跳转或状态交互".to_string(),
    }
}

/// Resolve the component capability / usage description shown in the top
/// component area: explains to AI and users what this component/block does and
/// how it can be reused.
pub fn effective_component_description(node: &PenNode, is_top_level: bool) -> String {
    if let Some(desc) = node_semantics(node)
        .and_then(|s| s.ai_description.as_deref())
        .map(str::trim)
        .filter(|s| !s.is_empty())
    {
        return desc.to_string();
    }

    let role = effective_node_role(node, is_top_level);
    let role_cn = role_chinese_label(&role);
    let name = node
        .base()
        .name
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .unwrap_or(role_cn);
    let mut texts = Vec::new();
    collect_visible_text_snippets(node, &mut texts, 3);
    let text_preview = if texts.is_empty() {
        String::new()
    } else {
        format!("（含「{}」等内容）", texts.join(" / "))
    };
    let child_count = node.children().map_or(0, Vec::len);
    match role.as_str() {
        "navbar" => format!("【{name}】顶部导航栏组件{text_preview}：提供品牌标识、主导航菜单与快捷工具入口，可在多页面顶部复用。"),
        "hero" => format!("【{name}】首屏主视觉组件{text_preview}：展示核心价值主张、主行动按钮 (CTA) 与主视觉配图，用于吸引用户转化。"),
        "card" => format!("【{name}】信息/商品卡片组件{text_preview}：封装配图、标题与核心指标（共 {child_count} 个子元素），可在列表或网格中重复调用。"),
        "button" | "icon-button" => format!("【{name}】可复用交互按钮组件{text_preview}：用于触发核心业务动作或页面路由跳转。"),
        "section" | "list" => format!("【{name}】业务内容区块组件{text_preview}：包含 {child_count} 个子模块，用于组织同类业务信息流与卡片列表。"),
        "footer" => format!("【{name}】底部页脚组件{text_preview}：汇总站点导航链接、版权与品牌说明，供全站页面底部复用。"),
        "searchbox" | "input" => format!("【{name}】表单输入组件{text_preview}：供用户输入搜索词或业务数据，支持占位提示与状态反馈。"),
        _ => format!("【{name}】{role_cn}组件{text_preview}：包含 {child_count} 个子元素，可作为独立 UI 单元供 AI 识别与跨页面复用。"),
    }
}

/// Populate `base.explain` on any node in `root`'s subtree that does not
/// already carry an authored explanation.
pub fn enrich_subtree_explain(node: &mut PenNode, is_top_level: bool) {
    if node
        .base()
        .explain
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .is_none()
    {
        let explain = effective_node_explain(node, is_top_level);
        node.base_mut().explain = Some(explain);
    }
    if let Some(children) = node.children_mut() {
        for child in children {
            enrich_subtree_explain(child, false);
        }
    }
}

fn contains_any(haystack: &str, needles: &[&str]) -> bool {
    needles.iter().any(|n| haystack.contains(n))
}

fn is_interactive_role(role: &str) -> bool {
    matches!(
        role,
        "button"
            | "icon-button"
            | "nav-link"
            | "tab"
            | "input"
            | "searchbox"
            | "select"
            | "checkbox"
            | "switch"
            | "slider"
            | "card"
    )
}

fn role_chinese_label(role: &str) -> &'static str {
    match role {
        "page" => "页面画板",
        "navbar" => "顶部导航栏",
        "nav-links" => "导航链接组",
        "nav-link" => "导航链接项",
        "footer" => "底部页脚",
        "hero" => "首屏主视觉区",
        "sidebar" => "侧边导航栏",
        "toolbar" => "工具操作栏",
        "icon-button" => "图标按钮",
        "button" => "交互按钮",
        "searchbox" => "搜索输入框",
        "input" => "表单输入框",
        "tab" => "选项卡标签",
        "tablist" => "选项卡切换栏",
        "badge" => "状态徽标",
        "card" => "信息卡片",
        "list" => "列表网格容器",
        "media" => "媒体展示容器",
        "section" => "内容区块",
        "row" => "横向排列容器",
        "text-container" => "文本标签容器",
        "heading" => "标题文本",
        "text" => "正文文本",
        "image" => "图片元素",
        "icon" => "矢量图标",
        "graphic" => "图形装饰元素",
        _ => "布局容器",
    }
}

fn recommended_html_tag(role: &str) -> &'static str {
    match role {
        "page" => "main",
        "navbar" => "header",
        "nav-links" => "nav",
        "nav-link" => "a",
        "footer" => "footer",
        "hero" | "section" => "section",
        "sidebar" => "aside",
        "toolbar" => "div",
        "button" | "icon-button" | "tab" => "button",
        "searchbox" | "input" => "input",
        "badge" | "text-container" => "span",
        "card" => "article",
        "list" => "div",
        "heading" => "h2",
        "text" => "p",
        "image" => "img",
        "icon" | "graphic" => "svg",
        _ => "div",
    }
}

fn collect_visible_text_snippets(node: &PenNode, out: &mut Vec<String>, limit: usize) {
    if out.len() >= limit {
        return;
    }
    if let PenNode::Text(t) = node {
        let s = match &t.content {
            jian_ops_schema::node::text::TextContent::Plain(s) => s.trim().to_string(),
            jian_ops_schema::node::text::TextContent::Styled(segs) => segs
                .iter()
                .map(|seg| seg.text.as_str())
                .collect::<Vec<_>>()
                .join("")
                .trim()
                .to_string(),
        };
        if !s.is_empty() && !out.contains(&s) {
            out.push(s);
        }
        return;
    }
    if let Some(children) = node.children() {
        for child in children {
            collect_visible_text_snippets(child, out, limit);
            if out.len() >= limit {
                break;
            }
        }
    }
}

fn truncate_chars(s: &str, max_chars: usize) -> String {
    let mut chars = s.chars();
    let prefix: String = chars.by_ref().take(max_chars).collect();
    if chars.next().is_some() {
        format!("{prefix}…")
    } else {
        prefix
    }
}
