use std::collections::HashSet;

use op_editor_ui::{Color, Point2D, Rect, RenderBackend, TextLayout};

use crate::widget_host::WidgetHost;

const W: f32 = 1200.0;
const H: f32 = 800.0;

/// Counts marker fills on screen and inside tiles, and emulates retained
/// tile images.
#[derive(Default)]
struct TileBackend {
    in_tile: bool,
    screen_marker_fills: usize,
    tile_marker_fills: usize,
    tiles_rastered: usize,
    next_id: u32,
    live: HashSet<u32>,
    tile_draws: usize,
    texts: Vec<String>,
}

fn is_marker(color: Color) -> bool {
    color.r > 0.9 && color.g < 0.1 && color.b > 0.9
}

impl TileBackend {
    fn fill(&mut self, color: Color) {
        if is_marker(color) {
            if self.in_tile {
                self.tile_marker_fills += 1;
            } else {
                self.screen_marker_fills += 1;
            }
        }
    }
}

impl RenderBackend for TileBackend {
    fn begin_frame(&mut self) {}
    fn end_frame(&mut self) {}
    fn fill_rect(&mut self, _: Rect, color: Color) {
        self.fill(color);
    }
    fn stroke_rect(&mut self, _: Rect, _: Color, _: f32) {}
    fn draw_text(&mut self, layout: &TextLayout, _: Point2D) {
        for run in layout.runs() {
            self.texts.push(run.content.to_string());
        }
    }
    fn clip_rect(&mut self, _: Rect) {}
    fn stroke_line(&mut self, _: Point2D, _: Point2D, _: Color, _: f32) {}
    fn fill_round_rect(&mut self, _: Rect, _: f32, color: Color) {
        self.fill(color);
    }
    fn stroke_round_rect(&mut self, _: Rect, _: f32, _: Color, _: f32) {}
    fn stroke_svg_path(&mut self, _: &str, _: Point2D, _: f32, _: Color, _: f32) {}
    fn save(&mut self) {}
    fn restore(&mut self) {}
    fn translate(&mut self, _: Point2D) {}
    fn resize(&mut self, _: u32, _: u32) {}
    fn dpi_scale(&self) -> f32 {
        1.0
    }
    fn begin_tile(&mut self, _: u32, _: u32) -> bool {
        self.in_tile = true;
        true
    }
    fn end_tile(&mut self) -> u32 {
        self.in_tile = false;
        self.tiles_rastered += 1;
        self.next_id += 1;
        self.live.insert(self.next_id);
        self.next_id
    }
    fn draw_tile(&mut self, id: u32, _: Rect, _: Rect) -> bool {
        self.tile_draws += 1;
        self.live.contains(&id)
    }
    fn drop_tile(&mut self, id: u32) {
        self.live.remove(&id);
    }
}

fn marker_host() -> WidgetHost {
    let mut host = WidgetHost::new();
    let doc = jian_ops_schema::load_str(
        r##"{"version":"1.0.0","children":[
            {"type":"rectangle","id":"marker","x":0,"y":0,"width":200,"height":120,
             "fill":[{"type":"solid","color":"#FF00FF"}]},
            {"type":"rectangle","id":"far","x":5000,"y":0,"width":200,"height":120,
             "fill":[{"type":"solid","color":"#FF00FF"}]}]}"##,
    )
    .expect("fixture parses")
    .value;
    host.editor_state = op_editor_core::EditorState::from_document(doc);
    host.editor_state.viewport.pan_x = 100.0;
    host.editor_state.viewport.pan_y = 100.0;
    host.editor_state_dirty = true;
    host
}

fn frame(host: &mut WidgetHost, backend: &mut TileBackend, now_ms: u64) -> usize {
    host.now_ms = now_ms;
    let before = backend.screen_marker_fills;
    host.paint_editor(backend, W, H);
    backend.screen_marker_fills - before
}

/// Paints and rasterizes until the tile queue drains.
fn settle(host: &mut WidgetHost, backend: &mut TileBackend, mut now_ms: u64) -> u64 {
    for _ in 0..20 {
        frame(host, backend, now_ms);
        now_ms += 16;
        if !host.raster_canvas_tiles(backend) {
            break;
        }
    }
    frame(host, backend, now_ms);
    now_ms
}

#[test]
fn tiles_replace_the_live_walk_once_rastered() {
    let mut host = marker_host();
    let mut backend = TileBackend::default();
    assert!(
        frame(&mut host, &mut backend, 0) > 0,
        "no tiles yet: the first frame paints live"
    );
    assert!(host.raster_canvas_tiles(&mut backend) || backend.tiles_rastered > 0);
    let now = settle(&mut host, &mut backend, 16);
    assert!(backend.tile_marker_fills > 0, "tiles hold the content");
    let draws = backend.tile_draws;
    assert_eq!(
        frame(&mut host, &mut backend, now + 16),
        0,
        "the scene is not walked live"
    );
    assert!(backend.tile_draws > draws);

    host.editor_state.viewport.pan(37.0, -12.0);
    assert_eq!(
        frame(&mut host, &mut backend, now + 32),
        0,
        "panning draws retained tiles"
    );
}

#[test]
fn an_edit_redraws_only_the_tiles_it_touches() {
    let mut host = marker_host();
    let mut backend = TileBackend::default();
    let now = settle(&mut host, &mut backend, 0);
    let rastered = backend.tiles_rastered;
    let owner = host.canvas_tiles.owner().expect("tiles adopted the page");
    assert_eq!(owner.1, host.layout_scene.active_page_index);

    host.editor_state
        .apply(op_editor_core::EditorCommand::SetNodeFillHex {
            node_id: op_editor_core::NodeId::new("marker"),
            hex: "#00FF00".into(),
        });
    host.mark_dirty();
    assert_eq!(
        frame(&mut host, &mut backend, now + 16),
        0,
        "stale tiles keep showing"
    );
    settle(&mut host, &mut backend, now + 32);
    let redrawn = backend.tiles_rastered - rastered;
    assert!(redrawn >= 1, "the edited tile is redrawn");
    // The marker's visible and overview tiles redraw; the far node's do not.
    assert!(
        redrawn < rastered,
        "untouched tiles are kept ({redrawn} of {rastered} redrawn)"
    );
}

#[test]
fn the_status_bar_paints_in_live_and_tiled_frames() {
    let mut host = marker_host();
    let mut backend = TileBackend::default();
    frame(&mut host, &mut backend, 0);
    assert!(
        backend.texts.iter().any(|text| text.ends_with('%')),
        "live frame: {:?}",
        backend.texts
    );
    let now = settle(&mut host, &mut backend, 16);
    backend.texts.clear();
    frame(&mut host, &mut backend, now + 16);
    assert!(
        backend.texts.iter().any(|text| text.ends_with('%')),
        "tiled frame"
    );
}

#[test]
fn text_editing_falls_back_to_the_live_walk() {
    let mut host = marker_host();
    let mut backend = TileBackend::default();
    let now = settle(&mut host, &mut backend, 0);
    host.editor_state.ui.text_editing = Some(op_editor_core::NodeId::new("marker"));
    assert!(frame(&mut host, &mut backend, now + 16) > 0);
}

#[test]
fn tiles_lost_by_the_backend_repaint_live_then_are_redrawn() {
    let mut host = marker_host();
    let mut backend = TileBackend::default();
    let now = settle(&mut host, &mut backend, 0);
    assert_eq!(frame(&mut host, &mut backend, now + 16), 0);
    // A surface rebuild (resize) drops every retained image.
    backend.live.clear();
    assert!(
        frame(&mut host, &mut backend, now + 32) > 0,
        "never blank: the frame paints live"
    );
    let now = settle(&mut host, &mut backend, now + 48);
    assert_eq!(
        frame(&mut host, &mut backend, now + 16),
        0,
        "tiles are back"
    );
}
