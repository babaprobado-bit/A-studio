import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { normalizeSwarmFilePath, fallbackSwarmTasks, buildSwarmPlanPrompt, parseSwarmPlan, resolveSwarmConcurrency, estimateSwarmCallBudget, isRetryableSwarmError, runAgentSwarm } from '../src/agent-swarm.js';
import { PROMPT_PLUGIN_CATALOG, EXTERNAL_CONNECTOR_CATALOG, normalizeEnabledPluginIds, filterPromptPlugins } from '../src/plugin-catalog.js';
import { OPENROUTER_CHAT_MODEL_LIMIT, isFreeOpenRouterModelId, isZeroPriceOpenRouterModel, normalizeOpenRouterModelSelection, runOpenRouterMultiModelCalls } from '../src/openrouter-chat.js';
import { FREE_API_PROVIDER_CATALOG, CLOUDFLARE_FREE_MODELS } from '../src/free-api-providers.js';

assert.equal(normalizeSwarmFilePath('src/main.js'),'src/main.js');
assert.equal(normalizeSwarmFilePath('../outside.js'),'');
assert.equal(normalizeSwarmFilePath('/absolute/file.js'),'');
assert.equal(fallbackSwarmTasks('test',10).length,10);
assert.match(buildSwarmPlanPrompt('test',3),/JSON/);
const parsed=parseSwarmPlan(JSON.stringify({tasks:[{id:'a',title:'Plan',objective:'Plan',files:['src/main.js']},{id:'b',title:'Test',objective:'Test',files:['../bad.js']}]}),{task:'test',maxTasks:3});
assert.equal(parsed.usedFallback,false);
assert.equal(parsed.tasks.length,2);
assert.deepEqual(parsed.tasks[0].files,['src/main.js']);
assert.deepEqual(parsed.tasks[1].files,[]);
assert.equal(parseSwarmPlan('not json',{task:'x',maxTasks:2}).usedFallback,true);
assert.equal(resolveSwarmConcurrency({requested:4,isNative:true}),2);
assert.equal(resolveSwarmConcurrency({requested:4,isNative:true,deviceInfo:{availableMemoryBytes:300*1024**2}}),1);
assert.equal(resolveSwarmConcurrency({requested:4,isNative:false}),4);
assert.deepEqual(estimateSwarmCallBudget(3),{expected:5,maximumWithRetries:8,retryAllowance:3});
assert.equal(isRetryableSwarmError(new Error('HTTP 503')),true);
assert.equal(isRetryableSwarmError(new Error('HTTP 401 invalid API key')),false);

let coordinatorCalls=0,workerCalls=0,retryOnce=true;
const plan={tasks:[
{id:'one',title:'One',role:'Architect',objective:'First worker task',acceptance:['result'],files:['src/shared.js']},
{id:'two',title:'Two',role:'Reviewer',objective:'Second worker task',acceptance:['result'],files:['src/shared.js']},
{id:'three',title:'Three',role:'Tester',objective:'Third worker task',acceptance:['result'],files:['src/test.js']}
]};
const result=await runAgentSwarm({
providerIds:['planner','worker-a','worker-b'],task:'Build a safe feature',maxAgents:3,maxConcurrency:2,
callProvider:async(providerId,prompt)=>{
 if(providerId==='planner'){coordinatorCalls++;return prompt.includes('Yalnızca JSON döndür')?JSON.stringify(plan):'Synthesis complete.';}
 workerCalls++;
 if(prompt.includes('First worker task')&&retryOnce){retryOnce=false;throw new Error('HTTP 503 temporary failure');}
 await new Promise(resolve=>setTimeout(resolve,5));
 return 'Finding for worker task. CONFIDENCE: 90';
}
});
assert.equal(result.planFallback,false);
assert.equal(result.results.length,3);
assert.equal(result.metrics.completed,3);
assert.equal(result.metrics.failed,0);
assert.equal(result.metrics.retryCount,1);
assert.equal(coordinatorCalls,2);
assert.equal(workerCalls,4);
assert.equal(result.metrics.fileConflictCount,1);
assert.match(result.summary,/Synthesis complete/);

assert.equal(PROMPT_PLUGIN_CATALOG.length,34);
assert.equal(new Set(PROMPT_PLUGIN_CATALOG.map(item=>item.id)).size,34);
assert.equal(normalizeEnabledPluginIds(null).length,34);
assert.equal(filterPromptPlugins({enabledIds:['babylon'],query:'babylon'}).length,1);
assert.equal(filterPromptPlugins({enabledIds:['babylon'],category:'Oyun Geliştirme'}).length,6);
assert.ok(PROMPT_PLUGIN_CATALOG.some(item=>item.id==='reverse-api'));
assert.ok(PROMPT_PLUGIN_CATALOG.some(item=>item.id==='agent-team'));
assert.ok(EXTERNAL_CONNECTOR_CATALOG.some(item=>item.id==='openmausbot'&&item.status==='external'));
assert.ok(EXTERNAL_CONNECTOR_CATALOG.some(item=>item.id==='rea-companion'&&item.status==='contract'));

assert.equal(OPENROUTER_CHAT_MODEL_LIMIT,4);
assert.equal(isFreeOpenRouterModelId('openrouter/free'),true);
assert.equal(isFreeOpenRouterModelId('vendor/model:free'),true);
assert.equal(isFreeOpenRouterModelId('vendor/model'),false);
assert.equal(isZeroPriceOpenRouterModel({id:'vendor/model:free',pricing:{prompt:'0',completion:'0'}}),true);
assert.equal(isZeroPriceOpenRouterModel({id:'vendor/model:free',pricing:{prompt:'0.1',completion:'0'}}),false);
assert.deepEqual(normalizeOpenRouterModelSelection(['vendor/a:free','vendor/a:free','paid/model','vendor/b:free','vendor/c:free','vendor/d:free','vendor/e:free']),['vendor/a:free','vendor/b:free','vendor/c:free','vendor/d:free']);
let compared=0;
const multi=await runOpenRouterMultiModelCalls({modelIds:['vendor/a:free','vendor/b:free'],prompt:'same task',callModel:async model=>{compared++;return 'response '+model;}});
assert.equal(compared,2);
assert.equal(multi.length,2);
assert.equal(multi.every(item=>item.answer.startsWith('response ')),true);

assert.equal(FREE_API_PROVIDER_CATALOG.length,13);
assert.deepEqual(FREE_API_PROVIDER_CATALOG.map(item=>item.rank),Array.from({length:13},(_,i)=>i+1));
assert.equal(FREE_API_PROVIDER_CATALOG.find(item=>item.id==='mistral').access,'no-free-api');
assert.equal(CLOUDFLARE_FREE_MODELS.length,3);
assert.ok(CLOUDFLARE_FREE_MODELS.every(id=>id.startsWith('@cf/')));

const main=await readFile(new URL('../src/main.js',import.meta.url),'utf8');
const hub=await readFile(new URL('../src/ai-power-hub.js',import.meta.url),'utf8');
const css=await readFile(new URL('../src/ai-power-hub.css',import.meta.url),'utf8');
assert.ok(main.includes('mountAiPowerHub'));
assert.ok(main.includes('modelOverride'));
assert.ok(main.includes('enabledPromptPluginIds'));
assert.ok(hub.includes('AI Swarm'));
assert.ok(hub.includes('OpenRouter Multi-Chat'));
assert.ok(hub.includes('Cohere Trial'));
assert.ok(hub.includes('Cloudflare Workers AI'));
assert.ok(css.includes('@media(max-width:620px)'));
console.log('AI Power Hub regression suite passed: Swarm, prompt catalog, free model filter, API directory and wiring.');
