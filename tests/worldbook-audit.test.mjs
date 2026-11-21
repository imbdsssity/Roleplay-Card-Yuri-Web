import { test } from 'node:test';
import assert from 'node:assert/strict';
import { auditWorldbook } from '../scripts/worldbook-audit.mjs';

function sources() {
  const entries = [0, 1].map((uid) => ({uid, comment:`[CODE] Entry ${uid}`, constant:uid === 0, depth:2, order:100 + uid, vectorized:false, selective:true, selectiveLogic:0, position:0, disable:false}));
  const make = (locale) => `# Sample\n## ${locale === 'en' ? '3. References' : '三、来源'}\n| Code | Source |\n| :--- | :--- |\n| [CODE] | A source \\| title |\n| [ALT] | Another source |\n## ${locale === 'en' ? '4. Complete mapping' : '四、全部条目'}\n| UID | Title | Activation | Function | Source |\n| :---: | :--- | :--- | :--- | :--- |\n${entries.map((e) => `| \`${e.uid}\` | **${e.comment}** | ${e.constant ? '🔵' : '🟢'} @D2 ${locale === 'en' ? 'Order' : '顺序'} \`${e.order}\` | A full function ${e.uid} | Source ${e.uid} |`).join('\n')}\n`;
  return {en:{jsonText:JSON.stringify({entries}),readmeText:make('en')},zh:{jsonText:JSON.stringify({entries}),readmeText:make('zh')}};
}

test('extracts every row, source mapping and full function without granting approval', () => {
  const output = auditWorldbook(sources());
  assert.deepEqual(output.localeCounts.en, {json:2,readme:2});
  assert.equal(output.mapping.length, 2); assert.match(output.mapping[1].entry.en, /A full function 1/);
  assert.equal(output.referenceMappings.en.length, 2); assert.equal(output.references.en[0], 'A source \\| title');
  assert.equal(output.publicationStatus,'draft'); assert.equal(output.requiresHumanReview,true); assert.deepEqual(output.issues,[]);
});
test('detects incomplete README and missing locale UID without fabricating rows', () => {
  const input = sources(); input.zh.readmeText = input.zh.readmeText.split('\n').filter((s)=>!s.startsWith('| `1`')).join('\n');
  const result=auditWorldbook(input); assert.equal(result.mapping.length,1);
  assert(result.issues.some((x)=>x.locale==='zh' && x.uid===1 && x.issue.includes('missing from README')));
  const another = sources(); const json=JSON.parse(another.zh.jsonText); json.entries.pop(); another.zh.jsonText=JSON.stringify(json);
  assert(auditWorldbook(another).issues.some((x)=>x.issue.includes('English UID missing from Chinese')));
});
test('detects differing locale settings and code prefix', () => {
  const input=sources(), zh=JSON.parse(input.zh.jsonText); zh.entries[0].depth=4; zh.entries[1].comment='[OTHER] Entry 1'; input.zh.jsonText=JSON.stringify(zh);
  const result=auditWorldbook(input);
  assert(result.issues.some((x)=>x.issue.includes('JSON setting differs by locale: depth')));
  assert(result.issues.some((x)=>x.issue.includes('code prefix differs')));
  assert.deepEqual(result.mapping.find((x)=>x.uid===1).codePrefix, {en:'[CODE]',zh:'[OTHER]'});
  assert(result.issues.some((x)=>x.issue.includes('README title differs')));
});
test('detects README activation mismatches and duplicate IDs', () => {
  const input=sources(); input.en.readmeText=input.en.readmeText.replace('Order `100`','Order `999`');
  assert(auditWorldbook(input).issues.some((x)=>x.issue.includes('order differs')));
  const duplicate=sources(), data=JSON.parse(duplicate.en.jsonText); data.entries.push(data.entries[0]); duplicate.en.jsonText=JSON.stringify(data);
  assert.throws(()=>auditWorldbook(duplicate), /duplicate JSON UID/);
});
test('fails closed on malformed, incomplete or ambiguous tables', () => {
  const input=sources(); input.en.readmeText=input.en.readmeText.replace('| Source 0 |','| Source | Extra |');
  assert.throws(()=>auditWorldbook(input), /must have 5 columns/);
  const noTable=sources(); noTable.zh.readmeText='# No tables';
  assert.throws(()=>auditWorldbook(noTable), /section not found/);
});
