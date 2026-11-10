//! Preserve styled runs when an inline text input changes its content.
use jian_core::text_input::TextInputState;
use jian_ops_schema::node::TextContent;
use jian_ops_schema::style::StyledTextSegment;
use unicode_segmentation::UnicodeSegmentation;

pub(super) fn floor_boundary(text: &str, offset: usize) -> usize {
    if offset >= text.len() {
        return text.len();
    }
    text.grapheme_indices(true)
        .map(|(index, _)| index)
        .take_while(|index| *index <= offset)
        .last()
        .unwrap_or(0)
}

pub(super) fn previous_boundary(text: &str, offset: usize) -> usize {
    text.grapheme_indices(true)
        .map(|(index, _)| index)
        .take_while(|index| *index < offset)
        .last()
        .unwrap_or(0)
}

pub(super) fn next_boundary(text: &str, offset: usize) -> usize {
    text.grapheme_indices(true)
        .map(|(index, _)| index)
        .find(|index| *index > offset)
        .unwrap_or(text.len())
}

pub(super) fn selected_run(content: &TextContent, offset: usize) -> Option<StyledTextSegment> {
    let TextContent::Styled(runs) = content else {
        return None;
    };
    let mut end = 0;
    runs.iter()
        .find(|run| {
            end += run.text.len();
            offset < end
        })
        .cloned()
}

pub(super) fn replace_input(
    content: &TextContent,
    before: &TextInputState,
    after: &TextInputState,
    seed: Option<&StyledTextSegment>,
) -> Option<TextContent> {
    let old = before.text();
    let new = after.text();
    if crate::text_design::plain_text(content) != old {
        return None;
    }
    let (start, end) = if let Some(range) = before.highlight_range().filter(|(a, b)| a != b) {
        range
    } else if new.len() >= old.len() {
        (before.caret(), before.caret())
    } else if after.caret() < before.caret() {
        (after.caret(), before.caret())
    } else {
        (
            before.caret(),
            before.caret().checked_add(old.len() - new.len())?,
        )
    };
    let new_end = new.len().checked_sub(old.len().checked_sub(end)?)?;
    if start > end
        || start > new_end
        || old.get(..start)? != new.get(..start)?
        || old.get(end..)? != new.get(new_end..)?
    {
        return None;
    }
    if matches!(content, TextContent::Plain(_)) {
        return Some(TextContent::Plain(new.to_owned()));
    }
    let TextContent::Styled(runs) = content else {
        unreachable!()
    };
    let inserted = new.get(start..new_end)?;
    let mut result = Vec::new();
    copy_range(runs, 0, start, &mut result)?;
    if !inserted.is_empty() {
        let probe = if start < end || start == 0 {
            start
        } else {
            start - 1
        };
        let mut offset = 0;
        let mut insertion = seed
            .cloned()
            .or_else(|| {
                runs.iter()
                    .find(|run| {
                        offset += run.text.len();
                        probe < offset
                    })
                    .cloned()
            })
            .unwrap_or_else(|| crate::text_design::segment(""));
        insertion.text = inserted.to_owned();
        crate::text_design::push_segment(&mut result, insertion);
    }
    copy_range(runs, end, old.len(), &mut result)?;
    Some(TextContent::Styled(result))
}

fn copy_range(
    runs: &[StyledTextSegment],
    start: usize,
    end: usize,
    out: &mut Vec<StyledTextSegment>,
) -> Option<()> {
    let mut offset = 0usize;
    for run in runs {
        let next = offset + run.text.len();
        let from = start.max(offset);
        let to = end.min(next);
        if from < to {
            let mut piece = run.clone();
            piece.text = run.text.get(from - offset..to - offset)?.to_owned();
            crate::text_design::push_segment(out, piece);
        }
        offset = next;
    }
    Some(())
}
