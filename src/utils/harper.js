let linterPromise = null;

async function getLinter() {
  if (!linterPromise) {
    linterPromise = (async () => {
      const [{ LocalLinter }, { slimBinary }] = await Promise.all([
        import('harper.js'),
        import('harper.js/slimBinary')
      ]);
      const linter = new LocalLinter({ binary: slimBinary });
      await linter.setup();
      return linter;
    })();
  }
  return linterPromise;
}

export async function lintText(text) {
  if (!text || !text.trim()) return [];
  try {
    const linter = await getLinter();
    const rawLints = await linter.lint(text);
    const results = [];
    for (const lint of rawLints) {
      const span = lint.span();
      const suggestions = lint.suggestions().map((s) => s.get_replacement_text());
      results.push({
        id: `${span.start}-${span.end}-${lint.get_problem_text()}`,
        start: span.start,
        end: span.end,
        problemText: lint.get_problem_text(),
        message: lint.message(),
        kind: lint.lint_kind_pretty(),
        suggestions
      });
      lint.free();
    }
    return results;
  } catch {
    return [];
  }
}

export function applySuggestion(text, issue, replacement) {
  return text.slice(0, issue.start) + replacement + text.slice(issue.end);
}
