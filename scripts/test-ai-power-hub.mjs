import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { normalizeSwarmFilePath, fallbackSwarmTasks, buildSwarmPlanPrompt, parseSwarmPlan, resolveSwarmConcurrency, estimateSwarmCallBudget, isRetryableSwarmError, runAgentSwarm } from '../src/agent-swarm.js';
import { PROMPT_PLUGIN_CATALOG, EXTERNAL_CONNECTOR_CATALOG, normalizeEnabledPluginIds, filterPromptPlugins } from '../src/plugin-catalog.js';
import { OPENROUTER_CHAT_MODEL_LIMIT, isFreeOpenRouterModelId, isZeroPriceOpenRouterModel, normalizeOpenRouterModelSelection, runOpenRouterMultiModelCalls } from '../src/openrouter-chat.js';
import { FREE_API_PROVIDER_CATALOG, CLOUDFLARE_FREE_MODELS } from '../src/free-api-providers.js';
import { APINEX_API_BASE_URL, APINEX_CHAT_ENDPOINT, APINEX_MODELS_ENDPOINT, APINEX_DEFAULT_FREE_MODEL, isFreeApinexModelId, extractApinexFreeModels } from '../src/apinex-provider.js';

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

assert.equal(PROMPT_PLUGIN_CATALOG.length,36);
assert.equal(new Set(PROMPT_PLUGIN_CATALOG.map(item=>item.id)).size,35);
assert.equal(normalizeEnabledPluginIds(null).length,36);
assert.equal(filterPromptPlugins({enabledIds:['babylon'],query:'babylon'}).length,1);
assert.equal(filterPromptPlugins({enabledIds:['babylon'],category:'Oyun Geliştirme'}).length,6);
assert.ok(PROMPT_PLUGIN_CATALOG.some(item=>item.id==='reverse-api'));
assert.ok(PROMPT_PLUGIN_CATALOG.some(item=>item.id==='agent-team'));
assert.ok(PROMPT_PLUGIN_CATALOG.some(item=>item.id==='openshorts'&&item.category==='Video'));
assert.ok(PROMPT_PLUGIN_CATALOG.some(item=>item.id==='vidiq-discovery'&&item.category==='Video'));
assert.equal(filterPromptPlugins({enabledIds:['openshorts'],query:'OpenShorts'}).length,1);
assert.ok(EXTERNAL_CONNECTOR_CATALOG.some(item=>item.id==='openmausbot'&&item.status==='external'));
assert.ok(EXTERNAL_CONNECTOR_CATALOG.some(item=>item.id==='apinex'&&item.status==='integrated'));
assert.ok(EXTERNAL_CONNECTOR_CATALOG.some(item=>item.id==='rea-companion'&&item.status==='contract'));
assert.ok(EXTERNAL_CONNECTOR_CATALOG.some(item=>item.id==='openshorts'&&item.status==='integrated'&&item.url==='https://github.com/mutonby/openshorts-plugin'));
assert.ok(EXTERNAL_CONNECTOR_CATALOG.some(item=>item.id==='vidiq'&&item.status==='external'&&item.desc.includes('OAuth 2.0')));

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
assert.equal(APINEX_API_BASE_URL,'https://api.apinex.bond/v1');
assert.equal(APINEX_CHAT_ENDPOINT,'https://api.apinex.bond/v1/chat/completions');
assert.equal(APINEX_MODELS_ENDPOINT,'https://api.apinex.bond/v1/models');
assert.equal(APINEX_DEFAULT_FREE_MODEL,'free/gemini-3.8-flash');
assert.equal(isFreeApinexModelId('free/gemini-3.8-flash'),true);
assert.equal(isFreeApinexModelId('free/deepseek-v4.1-flash'),true);
assert.equal(isFreeApinexModelId('FREE/paid-model'),false);
assert.equal(isFreeApinexModelId('paid/gpt-6-astra'),false);
assert.equal(isFreeApinexModelId('free//model'),false);
assert.equal(isFreeApinexModelId('free/../secret'),false);
assert.equal(isFreeApinexModelId('free/model/variant'),false);
assert.deepEqual(extractApinexFreeModels({data:[{id:'paid/model'},{id:'free/beta'},{id:'free/alpha'},{id:'free/beta'}]}),['free/alpha','free/beta']);

const main=await readFile(new URL('../src/main.js',import.meta.url),'utf8');
const hub=await readFile(new URL('../src/ai-power-hub.js',import.meta.url),'utf8');
const css=await readFile(new URL('../src/ai-power-hub.css',import.meta.url),'utf8');
const server=await readFile(new URL('../server/server.js',import.meta.url),'utf8');
assert.ok(main.includes('mountAiPowerHub'));
assert.ok(main.includes('modelOverride'));
assert.ok(main.includes('isFreeApinexModelId'));
assert.ok(main.includes('APINEX_CHAT_ENDPOINT'));
assert.ok(main.includes('data-load-apinex-models'));
assert.ok(main.includes("Object.keys(providers).filter(id => id !== 'apinex')"));
assert.ok(main.includes('APInex güvenlik kontrolü'));
assert.ok(main.includes('enabledPromptPluginIds'));
assert.ok(hub.includes('AI Swarm'));
assert.ok(hub.includes('OpenRouter Multi-Chat'));
assert.ok(hub.includes('Cohere Trial'));
assert.ok(hub.includes('Cloudflare Workers AI'));
assert.ok(css.includes('@media(max-width:620px)'));
assert.ok(server.includes("'https://api.apinex.bond'"));
console.log('AI Power Hub regression suite passed: Swarm, prompt catalog, free model filter, API directory and wiring.');
