use super::*;

/// Rewrite an authored alias or a formula operand using canonical resolution.
/// Formula token boundaries are identical to the arithmetic parser's names.
pub fn rewrite_variable_scalar(
    value: &VariableScalar,
    old: &str,
    new: Option<&str>,
    vars: Option<&Vars>,
    theme: &Theme,
) -> Option<VariableScalar> {
    let VariableScalar::Str(text) = value else {
        return None;
    };
    let token = format!("${old}");
    if text == &token {
        return match new {
            Some(name) => Some(VariableScalar::Str(format!("${name}"))),
            None => resolve_variable_ref(&token, vars, theme),
        };
    }
    if !is_formula(text) {
        return None;
    }
    let replacement = match new {
        Some(name) => format!("${name}"),
        None => resolve_numeric_ref(&token, vars, theme)?.to_string(),
    };
    let mut output = String::with_capacity(text.len());
    let mut position = 0;
    let mut changed = false;
    while position < text.len() {
        if text.as_bytes()[position] == b'$' {
            let start = position;
            position += 1;
            while text
                .as_bytes()
                .get(position)
                .is_some_and(|c| is_formula_identifier_byte(*c))
            {
                position += 1;
            }
            let reference = &text[start..position];
            if reference == token {
                output.push_str(&replacement);
                changed = true;
            } else {
                output.push_str(reference);
            }
        } else {
            let c = text[position..].chars().next()?;
            output.push(c);
            position += c.len_utf8();
        }
    }
    changed.then_some(VariableScalar::Str(output))
}
