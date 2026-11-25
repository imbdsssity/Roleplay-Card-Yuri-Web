// World Book mapping strings come from Markdown table cells. Recognize only
// bold, inline code, line breaks, and table escapes. Everything else stays text.
export function worldbookCellRuns(value) {
  const syntax = /(?<escape>\\[\\*|<>\x60])|(?<code>(?<!\x60)(?<ticks>\x60+)(?!\x60)(?<codeText>[^\r\n]*?)(?<!\x60)\k<ticks>(?!\x60))|\x60+|(?<tag><[^<>\r\n]*>)|(?<strong>\*\*)|(?<lineBreak>\r\n?|\n)/g;
  const runs = [];
  let plain = [];
  let bold = null;
  let offset = 0;

  function append(kind, text = '') {
    if (kind !== 'text' || text) (bold ?? plain).push({ kind, text });
  }

  function flushPlain() {
    if (plain.length) runs.push({ strong: false, parts: plain });
    plain = [];
  }

  for (const match of value.matchAll(syntax)) {
    append('text', value.slice(offset, match.index));
    const { escape, code, codeText, tag, strong, lineBreak } = match.groups;
    if (escape) {
      append('text', escape.slice(1));
    } else if (code) {
      append('code', codeText);
    } else if (lineBreak || (tag && /^<br[ \t]*\/?>$/i.test(tag))) {
      append('break');
    } else if (strong) {
      if (bold === null) {
        bold = [];
      } else {
        if (bold.length) {
          flushPlain();
          runs.push({ strong: true, parts: bold });
        } else {
          plain.push({ kind: 'text', text: '****' });
        }
        bold = null;
      }
    } else {
      append('text', match[0]);
    }
    offset = match.index + match[0].length;
  }

  append('text', value.slice(offset));
  if (bold !== null) plain = plain.concat({ kind: 'text', text: '**' }, bold);
  flushPlain();
  return runs;
}
