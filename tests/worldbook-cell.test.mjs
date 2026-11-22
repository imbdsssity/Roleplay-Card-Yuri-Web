import assert from 'node:assert/strict';
import test from 'node:test';
import { worldbookCellRuns } from '../src/lib/worldbook-cell.mjs';

const text = (value) => ({ kind: 'text', text: value });
const code = (value) => ({ kind: 'code', text: value });
const br = { kind: 'break', text: '' };
const plain = (...parts) => ({ strong: false, parts });
const bold = (...parts) => ({ strong: true, parts });

test('renders source labels, code, paragraph separators, and explicit breaks in both locales', () => {
  assert.deepEqual(worldbookCellRuns('**Entry \x60code\x60**\n\nFirst<br />Second'), [
    bold(text('Entry '), code('code')),
    plain(br, br, text('First'), br, text('Second')),
  ]);
  assert.deepEqual(worldbookCellRuns('**条目**\r\n\x60@D3\x60<br>顺序 12'), [
    bold(text('条目')),
    plain(br, code('@D3'), br, text('顺序 12')),
  ]);
});

test('keeps angle brackets and formatting markers in code literal', () => {
  assert.deepEqual(worldbookCellRuns('\x60\x60<br> **x** \x60 \x60\x60'), [
    plain(code('<br> **x** \x60 ')),
  ]);
  assert.deepEqual(worldbookCellRuns('x\\|y\\*z **open'), [
    plain(text('x'), text('|'), text('y'), text('*'), text('z '), text('**'), text('open')),
  ]);
});

test('provides only text for other HTML, attributed line breaks and URL syntax', () => {
  const source = '<img src=x onerror=example> <br class=x> [link](example)';
  const parts = worldbookCellRuns(source).flatMap((run) => run.parts);
  assert(parts.every((part) => part.kind === 'text'));
  assert.equal(parts.map((part) => part.text).join(''), source);
});
