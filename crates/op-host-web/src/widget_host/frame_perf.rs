//! Opt-in per-frame paint timing (`?perf=1`). Splits each editor frame into
//! named sections and logs their p50 / max to the console every
//! [`REPORT_EVERY`] frames. Disabled hosts pay one branch per mark.

const REPORT_EVERY: usize = 60;
/// Sparse repaints (hover changes, edits) still report after this long.
const REPORT_AFTER_MS: f64 = 2000.0;
const MIN_SPARSE_FRAMES: usize = 10;
const MAX_SECTIONS: usize = 12;

#[derive(Default)]
pub(crate) struct FramePerf {
    enabled: bool,
    frame_start: f64,
    last_mark: f64,
    current: Vec<(&'static str, f64)>,
    samples: Vec<Vec<(&'static str, f64)>>,
    window_start: Option<f64>,
}

pub(crate) fn clock_ms() -> f64 {
    #[cfg(target_arch = "wasm32")]
    {
        web_sys::window()
            .and_then(|w| w.performance())
            .map(|p| p.now())
            .unwrap_or(0.0)
    }
    #[cfg(not(target_arch = "wasm32"))]
    {
        use std::sync::OnceLock;
        static START: OnceLock<std::time::Instant> = OnceLock::new();
        START
            .get_or_init(std::time::Instant::now)
            .elapsed()
            .as_secs_f64()
            * 1000.0
    }
}

impl FramePerf {
    pub(crate) fn set_enabled(&mut self, enabled: bool) {
        self.enabled = enabled;
        self.samples.clear();
        self.current.clear();
    }

    pub(crate) fn begin_frame(&mut self) {
        if !self.enabled {
            return;
        }
        self.current.clear();
        self.frame_start = clock_ms();
        self.last_mark = self.frame_start;
    }

    /// Closes the section that started at the previous mark.
    pub(crate) fn mark(&mut self, name: &'static str) {
        self.mark_at(name, clock_ms());
    }

    fn mark_at(&mut self, name: &'static str, now: f64) {
        if !self.enabled || self.current.len() >= MAX_SECTIONS {
            return;
        }
        self.current.push((name, now - self.last_mark));
        self.last_mark = now;
    }

    /// Returns the report line when one is due.
    pub(crate) fn end_frame(&mut self) -> Option<String> {
        if !self.enabled {
            return None;
        }
        let now = clock_ms();
        self.end_frame_at(now)
    }

    fn end_frame_at(&mut self, now: f64) -> Option<String> {
        let mut frame = std::mem::take(&mut self.current);
        frame.push(("total", now - self.frame_start));
        self.samples.push(frame);
        let window_start = *self.window_start.get_or_insert(self.frame_start);
        let sparse_due =
            self.samples.len() >= MIN_SPARSE_FRAMES && now - window_start >= REPORT_AFTER_MS;
        if self.samples.len() < REPORT_EVERY && !sparse_due {
            return None;
        }
        let report = summarize(&self.samples);
        self.samples.clear();
        self.window_start = None;
        Some(report)
    }
}

fn summarize(samples: &[Vec<(&'static str, f64)>]) -> String {
    let mut names: Vec<&'static str> = Vec::new();
    for frame in samples {
        for (name, _) in frame {
            if !names.contains(name) {
                names.push(name);
            }
        }
    }
    let mut parts = Vec::with_capacity(names.len());
    for name in names {
        let mut values: Vec<f64> = samples
            .iter()
            .flat_map(|frame| frame.iter().filter(|(n, _)| *n == name).map(|(_, v)| *v))
            .collect();
        values.sort_by(|a, b| a.total_cmp(b));
        let p50 = values[values.len() / 2];
        let max = values[values.len() - 1];
        parts.push(format!("{name}={p50:.1}/{max:.1}"));
    }
    format!(
        "[perf] frames={} p50/max ms {}",
        samples.len(),
        parts.join(" ")
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn disabled_perf_records_nothing() {
        let mut perf = FramePerf::default();
        for _ in 0..REPORT_EVERY {
            perf.begin_frame();
            perf.mark("canvas");
            assert!(perf.end_frame().is_none());
        }
        assert!(perf.samples.is_empty());
    }

    #[test]
    fn sections_accumulate_and_report_every_window() {
        let mut perf = FramePerf::default();
        perf.set_enabled(true);
        let mut report = None;
        for i in 0..REPORT_EVERY {
            perf.frame_start = 0.0;
            perf.last_mark = 0.0;
            perf.current.clear();
            perf.mark_at("scene", 1.0);
            perf.mark_at("canvas", 1.0 + i as f64);
            report = perf.end_frame_at(2.0 + i as f64);
        }
        let report = report.expect("report after a full window");
        assert!(report.contains("frames=60"), "{report}");
        assert!(report.contains("scene=1.0/1.0"), "{report}");
        assert!(report.contains("canvas=30.0/59.0"), "{report}");
        assert!(perf.samples.is_empty());
    }

    #[test]
    fn sparse_repaints_report_after_the_time_window() {
        let mut perf = FramePerf::default();
        perf.set_enabled(true);
        for i in 0..MIN_SPARSE_FRAMES {
            perf.frame_start = i as f64 * 300.0;
            perf.last_mark = perf.frame_start;
            perf.current.clear();
            let report = perf.end_frame_at(perf.frame_start + 20.0);
            assert_eq!(report.is_some(), i + 1 == MIN_SPARSE_FRAMES, "frame {i}");
        }
    }
}
