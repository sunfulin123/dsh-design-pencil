//! Bounded, arithmetic-only numeric formulas. No scripting or host callbacks.

use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum VariableResolveError {
    Missing(String),
    Cycle(String),
    TypeMismatch(String),
    InvalidFormula(String),
    NonFinite,
    DepthLimit,
}

impl fmt::Display for VariableResolveError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Missing(name) => write!(f, "variable {name:?} does not exist"),
            Self::Cycle(name) => write!(f, "cyclic variable reference at {name:?}"),
            Self::TypeMismatch(name) => write!(f, "variable {name:?} has an incompatible value"),
            Self::InvalidFormula(reason) => write!(f, "invalid formula: {reason}"),
            Self::NonFinite => write!(f, "formula produced a non-finite number"),
            Self::DepthLimit => write!(f, "variable/formula nesting exceeds 64"),
        }
    }
}
impl std::error::Error for VariableResolveError {}

pub fn is_formula(value: &str) -> bool {
    value.trim_start().starts_with("calc(")
}

pub(crate) fn is_formula_identifier_byte(c: u8) -> bool {
    c.is_ascii_alphanumeric() || matches!(c, b'_' | b'-' | b'.')
}

pub fn evaluate_formula(
    expression: &str,
    resolve: &mut impl FnMut(&str) -> Result<f64, VariableResolveError>,
) -> Result<f64, VariableResolveError> {
    let expression = expression.trim();
    let source = expression
        .strip_prefix("calc(")
        .and_then(|s| s.strip_suffix(')'))
        .ok_or_else(|| VariableResolveError::InvalidFormula("expected calc(...)".into()))?;
    let mut parser = Parser {
        source,
        position: 0,
        depth: 0,
        resolve,
    };
    let value = parser.sum()?;
    parser.space();
    if parser.position != source.len() {
        return Err(VariableResolveError::InvalidFormula(format!(
            "unexpected input at byte {}",
            parser.position
        )));
    }
    finite(value)
}

fn finite(value: f64) -> Result<f64, VariableResolveError> {
    if value.is_finite() {
        Ok(value)
    } else {
        Err(VariableResolveError::NonFinite)
    }
}

struct Parser<'a, F> {
    source: &'a str,
    position: usize,
    depth: usize,
    resolve: &'a mut F,
}

impl<F: FnMut(&str) -> Result<f64, VariableResolveError>> Parser<'_, F> {
    fn space(&mut self) {
        while self
            .source
            .as_bytes()
            .get(self.position)
            .is_some_and(u8::is_ascii_whitespace)
        {
            self.position += 1;
        }
    }
    fn take(&mut self, c: u8) -> bool {
        self.space();
        if self.source.as_bytes().get(self.position) == Some(&c) {
            self.position += 1;
            true
        } else {
            false
        }
    }
    fn sum(&mut self) -> Result<f64, VariableResolveError> {
        let mut value = self.product()?;
        loop {
            if self.take(b'+') {
                value = finite(value + self.product()?)?;
            } else if self.take(b'-') {
                value = finite(value - self.product()?)?;
            } else {
                return Ok(value);
            }
        }
    }
    fn product(&mut self) -> Result<f64, VariableResolveError> {
        let mut value = self.atom()?;
        loop {
            if self.take(b'*') {
                value = finite(value * self.atom()?)?;
            } else if self.take(b'/') {
                value = finite(value / self.atom()?)?;
            } else {
                return Ok(value);
            }
        }
    }
    fn atom(&mut self) -> Result<f64, VariableResolveError> {
        self.depth += 1;
        if self.depth > 64 {
            return Err(VariableResolveError::DepthLimit);
        }
        let result = self.atom_inner();
        self.depth -= 1;
        result
    }
    fn atom_inner(&mut self) -> Result<f64, VariableResolveError> {
        if self.take(b'+') {
            return self.atom();
        }
        if self.take(b'-') {
            return finite(-self.atom()?);
        }
        if self.take(b'(') {
            let value = self.sum()?;
            if !self.take(b')') {
                return Err(VariableResolveError::InvalidFormula(
                    "missing closing parenthesis".into(),
                ));
            }
            return Ok(value);
        }
        self.space();
        let start = self.position;
        if self.take(b'$') {
            while self
                .source
                .as_bytes()
                .get(self.position)
                .is_some_and(|c| is_formula_identifier_byte(*c))
            {
                self.position += 1;
            }
            if self.position == start + 1 {
                return Err(VariableResolveError::InvalidFormula(
                    "empty variable reference".into(),
                ));
            }
            return finite((self.resolve)(&self.source[start..self.position])?);
        }
        while self
            .source
            .as_bytes()
            .get(self.position)
            .is_some_and(|c| c.is_ascii_digit() || *c == b'.')
        {
            self.position += 1;
        }
        if self
            .source
            .as_bytes()
            .get(self.position)
            .is_some_and(|c| matches!(c, b'e' | b'E'))
        {
            self.position += 1;
            if self
                .source
                .as_bytes()
                .get(self.position)
                .is_some_and(|c| matches!(c, b'+' | b'-'))
            {
                self.position += 1;
            }
            while self
                .source
                .as_bytes()
                .get(self.position)
                .is_some_and(u8::is_ascii_digit)
            {
                self.position += 1;
            }
        }
        finite(self.source[start..self.position].parse().map_err(|_| {
            VariableResolveError::InvalidFormula(format!("expected number at byte {start}"))
        })?)
    }
}
