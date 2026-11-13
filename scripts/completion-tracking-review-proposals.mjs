// Read pending owner proposals and expose blockers. Never author public changes.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { ROOT, readJson, relative, sha, fresh, IMMUTABLE_FIELDS, STATUSES } from './completion-tracking-common.mjs';
const args=process.argv.slice(2),paths=[],options={};
for(let index=0;index<args.length;index+=2) {
  assert.ok(args[index+1]); if(args[index]==='--proposal') paths.push(args[index+1]);
  else { assert.ok(['--baseline','--output'].includes(args[index]));options[args[index].slice(2)]=args[index+1]; }
}
assert.ok(paths.length && options.output);await fresh(path.resolve(ROOT,options.output));
const baseline=await readJson(options.baseline || 'docs/qa/completion-tracking-baseline-02.json'), originals=new Map();
for(const catalogue of baseline.data.catalogues) {
  const raw=await fs.readFile(path.join(baseline.data.snapshotDir,catalogue.catalogPath));assert.equal(sha(raw),baseline.data.publicInputHashes[catalogue.catalogPath]);
  for(const entry of JSON.parse(raw).entries) originals.set(entry.id,{...entry,catalogId:catalogue.id});
}
const records=[],proposals=[],byId=new Map();
for(const filename of paths) {
  const proposal=await readJson(filename), list=proposal.data.records || proposal.data.proposals;assert.ok(Array.isArray(list));
  proposals.push({path:proposal.path,sha256:proposal.sha256,records:list.length});
  for(const item of list) {
    const before=originals.get(item.id);assert.ok(before,item.id);
    const fields=item.proposedFields || item.proposed || item.fields || {}, review=item.acceptanceReview || fields.acceptanceReview || {};
    const target=item.statusCandidateAfterFreshPublicGates || item.targetStatusAfterGates || item.statusCandidateAfterGates || item.statusCandidate || fields.status || before.status;
    assert.ok(STATUSES.includes(target),item.id);
    const issues=[],pending=[],evidence=[];
    if(review.exactCriterion!==before.acceptance) issues.push('Acceptance review does not quote the exact original criterion.');
    if(before.status==='Validé') issues.push('Historical Validé record is protected.');
    for(const field of IMMUTABLE_FIELDS) if(Object.hasOwn(fields,field) && JSON.stringify(fields[field])!==JSON.stringify(before[field])) issues.push(`Immutable field differs: ${field}`);
    if(Object.hasOwn(fields,'assetStatus') && fields.assetStatus!==before.assetStatus) issues.push('Asset status change is outside this functional lot.');
    if(target==='Validé' && review.complete!==true) pending.push('Owner acceptance review is still incomplete.');
    for(const proof of [...new Set([...(item.evidence || fields.evidence || []),...(review.evidence || [])])]) {
      const name=relative(proof);let record={path:name,exists:false};
      try {
        const raw=await fs.readFile(path.join(ROOT,name));record={...record,exists:true,sha256:sha(raw)};
        if(name.endsWith('.json')) {
          const result=JSON.parse(raw);record.declaredPassed=result.passed;
          if(result.passed===false) pending.push(`Evidence currently failed: ${name}`);
          if(result.historicalExecution===true || result.currentProductGate===false || result.selfcheckOnly===true) pending.push(`Evidence is historical/private, not a current product gate: ${name}`);
          const stale=[];
          for(const [source,expected] of Object.entries(result.sourceHashes || {})) {
            try { if(sha(await fs.readFile(path.join(ROOT,relative(source))))!==expected) stale.push(source); }
            catch(error) { if(error.code==='ENOENT') stale.push(source); else throw error; }
          }
          record.staleSources=stale;if(stale.length)pending.push(`Evidence has ${stale.length} superseded source hashes: ${name}`);
        }
      } catch(error) { if(error.code!=='ENOENT') throw error;pending.push(`Evidence pending: ${name}`); }
      evidence.push(record);
    }
    const record={id:item.id,catalogId:before.catalogId,proposal:proposal.path,priority:before.priority,beforeStatus:before.status,
      targetAfterFreshGates:target,provisionalProposedStatus:fields.status || before.status,exactCriterion:before.acceptance,
      dependencies:before.dependencies,ownerComplete:review.complete===true,kind:review.kind || null,coveredClauses:review.coveredClauses || [],
      limitations:review.limitations || [],issues,pending,evidence};
    records.push(record);if(!byId.has(item.id))byId.set(item.id,[]);byId.get(item.id).push(record);
  }
}
for(const record of records) if(record.targetAfterFreshGates==='Validé') {
  record.unresolvedDependencies=[];
  for(const dependency of record.dependencies) {
    if(originals.get(dependency)?.status==='Validé')continue;
    const entries=byId.get(dependency)||[];
    if(!entries.some(entry=>entry.targetAfterFreshGates==='Validé'))record.unresolvedDependencies.push(dependency);
    else if(!entries.some(entry=>entry.targetAfterFreshGates==='Validé'&&entry.ownerComplete))record.pending.push(`Dependency candidate still awaits complete acceptance review: ${dependency}`);
  }
  if(record.unresolvedDependencies.length)record.issues.push(`Unproposed validation dependencies: ${record.unresolvedDependencies.join(', ')}`);
}
const overlaps=[...byId].filter(([,entries])=>entries.length>1).map(([id,entries])=>({id,proposals:entries.map(entry=>entry.proposal),targets:[...new Set(entries.map(entry=>entry.targetAfterFreshGates))]}));
const report={passed:true,planningOnly:true,publicationAllowed:false,generatedAt:new Date().toISOString(),baseCommit:baseline.data.baseCommit,
  baseline:{path:baseline.path,sha256:baseline.sha256},proposals,proposalRecords:records.length,uniqueIds:byId.size,
  targetValidatedUniqueIds:new Set(records.filter(record=>record.targetAfterFreshGates==='Validé').map(record=>record.id)).size,
  ownerCompleteUniqueIds:new Set(records.filter(record=>record.ownerComplete).map(record=>record.id)).size,
  recordsWithIssues:records.filter(record=>record.issues.length).length,recordsAwaitingEvidence:records.filter(record=>record.pending.length).length,
  sourceTool:{path:'scripts/completion-tracking-review-proposals.mjs',sha256:sha(await fs.readFile(new URL(import.meta.url)))},
  overlaps,records,limits:['Read-only advisory map of owner declarations and currently available files. No acceptance is adjudicated, no test is executed, and no status or public data is changed.','Passed means that this inventory completed, not that any proposed criterion or product gate passed.']};
await fs.writeFile(path.resolve(ROOT,options.output),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:true,planningOnly:true,uniqueIds:report.uniqueIds,targetValidated:report.targetValidatedUniqueIds,ownerComplete:report.ownerCompleteUniqueIds,issues:report.recordsWithIssues,pending:report.recordsAwaitingEvidence,overlaps:overlaps.length,output:options.output}));
