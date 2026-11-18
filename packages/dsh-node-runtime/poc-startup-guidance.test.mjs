/** POC authoring starts its own development server without an SS service-configuration detour. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,rm,access,realpath} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=fileURLToPath(new URL('../../',import.meta.url));
test('HTML and Cobalt guidance require autonomous startup instead of manual Preview configuration', async()=>{
 const guide=await readFile(join(root,'crates/op-ai-skills/skills/synapse-design-html/references/poc-review.md'),'utf8');
 assert.match(guide,/Start the development server yourself/);
 assert.match(guide,/synapse_design_prototype.*install\/check/);
 assert.match(guide,/native VPN\/network Question/);
 assert.match(guide,/pnpm run dev/);
 assert.match(guide,/Do not stop after scaffolding/);
 assert.match(guide,/preview\.json.*not.*prerequisite/i);
 const cobalt=await readFile(join(root,'packages/talkdesk-cobalt/skill/references/cobalt-workspace.md'),'utf8');
 assert.doesNotMatch(cobalt,/Use SS Preview \*\*Fill with AI\*\*|Preview owns dependency installation/);
 for(const path of ['crates/op-ai-skills/skills/synapse-design-html/SKILL.md','crates/op-ai-skills/skills/synapse-design/SKILL.md']){
  const text=await readFile(join(root,path),'utf8');
  assert.match(text,/start.*development server yourself/i,path);
 }
});
test('scaffold next steps preserve confirmed registry recovery and autonomous startup',async t=>{
 const dir=await realpath(await mkdtemp(join(tmpdir(),'cobalt-direct-start-')));t.after(()=>rm(dir,{recursive:true,force:true}));
 const spec=join(dir,'apps.json'),project=join(dir,'project');
 await writeFile(spec,JSON.stringify({apps:[{id:'admin',title:'Admin',pages:[{id:'users',title:'Users'}]}]}));
 const result=spawnSync(process.execPath,[join(root,'packages/talkdesk-cobalt/tools/cobalt-project.mjs'),'create','--out',project,'--spec',spec],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
 const output=JSON.parse(result.stdout);
 assert.match(output.next,/synapse_design_prototype install\/check/);
 assert.match(output.next,/outside SS install only.*diagnose.*explicit retry/);
 assert.match(output.next,/pnpm run dev/);
 assert.doesNotMatch(output.next,/Fill with AI|configure.*Preview/i);
 assert.equal(output.project,project);
 await assert.rejects(access(join(dir,'.synapse/preview.json')),{code:'ENOENT'});
 await assert.rejects(access(join(project,'.synapse/preview.json')),{code:'ENOENT'});
});
