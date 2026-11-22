import { test } from 'node:test';
import assert from 'node:assert/strict';
import { draftFromAudit } from '../scripts/worldbook-draft.mjs';
import { selectPublished } from '../src/lib/content-schema.mjs';

function sample() {
  const audit = {
    publicationStatus:'draft', requiresHumanReview:true, issues:[{issue:'JSON code prefix differs by locale'}],
    localeCounts:{en:{json:1,readme:1},zh:{json:1,readme:1}},
    checksums:{en:{jsonSha256:'a'.repeat(64)},zh:{jsonSha256:'b'.repeat(64)}},
    referenceMappings:{en:[{code:'[EN]',source:'English source'}],zh:[{code:'[中]',source:'中文来源'}]},
    mapping:[{uid:7,codePrefix:{en:'[EN]',zh:'[中]'},entry:{en:'Full English entry',zh:'完整中文条目'},activation:{en:'Always',zh:'常驻'},source:{en:'English source',zh:'中文来源'}}],
  };
  const metadata = {id:'example',slug:'example',updated:'2026-11-22',title:{en:'Example',zh:'示例'},
    json:{en:{objectKey:'worldbooks/example/en.json',filename:'en.json',version:'1'},zh:{objectKey:'worldbooks/example/zh.json',filename:'zh.json',version:'1'}}};
  return {audit,metadata};
}
test('builds a schema-valid unpublished draft without losing localized mapping or references', () => {
  const {audit,metadata}=sample(), record=draftFromAudit(audit,metadata);
  assert.equal(record.status,'draft'); assert.equal(record.rights,'unknown');
  assert.deepEqual(record.mapping, audit.mapping); assert.deepEqual(record.references.en,['[EN]: English source']);
  assert.deepEqual(record.references.zh,['[中]: 中文来源']); assert.equal(record.json.en.sha256,'a'.repeat(64));
  assert.equal(record.mappingReview.en.checkedAgainst,null); assert.equal(record.detailPath.zh,null);
  assert.deepEqual(selectPublished([record]),[]);
});
test('rejects incomplete paired mappings and invalid identities rather than inventing data', () => {
  const {audit,metadata}=sample(); audit.localeCounts.zh.readme=2;
  assert.throws(()=>draftFromAudit(audit,metadata), /counts must agree/);
  audit.localeCounts.zh.readme=1; metadata.slug='../unsafe';
  assert.throws(()=>draftFromAudit(audit,metadata));
});
test('cannot claim a review, override checksums, or set publication status through metadata', () => {
  const {audit,metadata}=sample(); metadata.status='published';
  assert.throws(()=>draftFromAudit(audit,metadata),/Unknown metadata field/);
  delete metadata.status; metadata.json.en.sha256='c'.repeat(64);
  assert.throws(()=>draftFromAudit(audit,metadata),/invalid JSON file metadata/);
  delete metadata.json.en.sha256; audit.checksums.zh.jsonSha256='';
  assert.throws(()=>draftFromAudit(audit,metadata),/checksum missing/);
});
