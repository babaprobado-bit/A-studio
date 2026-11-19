import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  normalizeTeamSelection, getTeamStageDetails, selectConfiguredTeam,
  confirmTeamLiveCalls, runParallelTeamCalls, runSequentialTeamCalls, normalizeOllamaEndpoint
} from '../src/ai-team.js';

assert.equal(normalizeOllamaEndpoint('http://192.168.1.20:11434/'), 'http://192.168.1.20:11434');
assert.equal(normalizeOllamaEndpoint('http://10.4.5.6:11434'), 'http://10.4.5.6:11434');
assert.equal(normalizeOllamaEndpoint('http://172.31.9.9:11434'), 'http://172.31.9.9:11434');
assert.equal(normalizeOllamaEndpoint('http://127.2.3.4:11434'), 'http://127.2.3.4:11434');
assert.equal(normalizeOllamaEndpoint('http://localhost:11434'), 'http://localhost:11434');
assert.equal(normalizeOllamaEndpoint('http://[::1]:11434'), 'http://[::1]:11434');
assert.equal(normalizeOllamaEndpoint('https://ollama.example.com:11434/'), 'https://ollama.example.com:11434');
assert.equal(normalizeOllamaEndpoint('https://192.168.1.20:11434'), 'https://192.168.1.20:11434',
  'private IPv4 Ollama hosts may still use HTTPS');
assert.equal(normalizeOllamaEndpoint('https://[::1]:11434'), 'https://[::1]:11434',
  'IPv6 loopback remains available for a local Ollama service');
assert.equal(normalizeOllamaEndpoint('https://[2606:4700:4700::1111]:11434'), 'https://[2606:4700:4700::1111]:11434',
  'public global-unicast IPv6 remains available over HTTPS');
for (const blocked of [
  'http://8.8.8.8:11434', 'http://example.com:11434', 'http://169.254.169.254:11434',
  'http://172.15.0.1:11434', 'http://172.32.0.1:11434', 'http://192.167.1.1:11434',
  'http://100.64.0.1:11434', 'http://[fd00::1]:11434', 'ftp://192.168.1.2:11434',
  'https://169.254.169.254:11434', 'https://100.64.0.1:11434',
  'https://[fd00::1]:11434', 'https://[fe80::1]:11434', 'https://[ff02::1]:11434',
  'https://[::]:11434', 'https://[2001:db8::1]:11434', 'https://[2001:2::1]:11434',
  'https://[2001:10::1]:11434', 'https://[2002:c000:0201::1]:11434',
  'https://[::ffff:192.168.1.20]:11434', 'https://192.0.2.1:11434',
  'https://198.18.0.1:11434', 'https://224.0.0.1:11434', 'https://0.0.0.0:11434',
  'http://user:pass@192.168.1.2:11434', 'http://192.168.1.2:11434?token=example',
  'http://192.168.1.2:11434/#fragment'
]) assert.throws(() => normalizeOllamaEndpoint(blocked), undefined, blocked);

const providerIds=['openai','anthropic','gemini','deepseek','groq','openrouter','huggingface','custom','ollama','device'];
assert.deepEqual(normalizeTeamSelection(providerIds,providerIds),providerIds,
  'all cloud, PC-local and phone-local engines must be selectable');
assert.deepEqual(normalizeTeamSelection([...providerIds,'unknown','device'],providerIds),providerIds,
  'selection must de-duplicate and must not truncate team members');
assert.deepEqual(normalizeTeamSelection(['device','openai'],providerIds),['device','openai']);

const allReady = selectConfiguredTeam(providerIds,providerIds,()=>true);
assert.deepEqual(allReady,{selected:providerIds,skipped:0},
  'all ten configured engines must be retained in the AI Team');
const unavailableDevice = selectConfiguredTeam(providerIds,providerIds,id=>id!=='device');
assert.deepEqual(unavailableDevice.selected,providerIds.filter(id=>id!=='device'),
  'an unloaded or unsupported Android GGUF provider must be skipped without hiding other engines');
assert.equal(unavailableDevice.skipped,1);
assert.deepEqual(selectConfiguredTeam(['openai','openai','unknown','device'],providerIds,id=>id==='openai'),
  {selected:['openai'],skipped:1},
  'provider filtering must deduplicate, ignore unknown IDs and report unconfigured selections');

let consentPromptedFor=0;
assert.equal(confirmTeamLiveCalls(['openai','device'],count=>{consentPromptedFor=count;return false;}),false,
  'a declined live-request confirmation must stop the team');
assert.equal(consentPromptedFor,2,'live confirmation must disclose the exact number of selected requests');
assert.equal(confirmTeamLiveCalls([],()=>{throw new Error('empty team must not prompt');}),false);
assert.equal(confirmTeamLiveCalls(['openai','device'],count=>count===2),true);

const parallelCalls=[];
let releaseParallel;
const parallelGate=new Promise(resolve=>{releaseParallel=resolve;});
const pendingParallel=runParallelTeamCalls({
  providerIds:['openai','anthropic','device'],
  task:'shared task',
  history:[{role:'user',content:'prior'}],
  callProvider:async(id,task,history)=>{
    parallelCalls.push({id,task,history});
    await parallelGate;
    if(id==='anthropic')throw new Error('provider temporarily unavailable');
    return id+' answer';
  }
});
await Promise.resolve();
assert.deepEqual(parallelCalls.map(call=>call.id),['openai','anthropic','device'],
  'parallel AI Team calls must fan out to every configured provider before any completes');
releaseParallel();
const parallelResults=await pendingParallel;
assert.deepEqual(parallelResults,[
  {id:'openai',answer:'openai answer'},
  {id:'anthropic',error:'provider temporarily unavailable'},
  {id:'device',answer:'device answer'}
],'one provider failure must be isolated while successful team replies are retained');
assert.ok(parallelCalls.every(call=>call.task==='shared task'&&call.history[0].content==='prior'),
  'parallel providers must receive the same task and shared conversation history');

const pipelineTrace=[];
const completedPipelineStages=[];
const pipelineResults=await runSequentialTeamCalls({
  providerIds:['openai','anthropic','gemini','groq','custom'],
  task:'implement a reliable feature',
  runStage:async(context,history)=>{
    pipelineTrace.push({id:context.id,index:context.index,role:context.stage.role,prompt:context.prompt,history});
    assert.equal(pipelineTrace.length,context.index+1,
      'the next pipeline provider must not start before the previous stage resolves');
    return 'stage-'+(context.index+1)+' output';
  },
  getHistory:context=>[{role:'assistant',content:'history for '+context.index}],
  onStageComplete:async result=>completedPipelineStages.push(result.id)
});
assert.deepEqual(pipelineTrace.map(item=>item.id),['openai','anthropic','gemini','groq','custom']);
assert.deepEqual(pipelineTrace.map(item=>item.role),[
  'Mimar / planlayıcı','Uygulayıcı / kodlayıcı','Bağımsız gözden geçirici',
  'Testçi / son kontrol','Ek bağımsız uzman 1 / 5'
],'the sequential pipeline must assign its four core roles and expert roles to remaining engines');
assert.ok(!pipelineTrace[0].prompt.includes('Önceki ajanın çıktısı'));
assert.ok(pipelineTrace[1].prompt.includes('stage-1 output'));
assert.ok(pipelineTrace[2].prompt.includes('stage-2 output'));
assert.ok(pipelineTrace.every(item=>item.history[0].content.startsWith('history for ')),
  'each live sequential stage must receive the current chat context');
assert.deepEqual(completedPipelineStages,['openai','anthropic','gemini','groq','custom']);
assert.equal(pipelineResults[4].answer,'stage-5 output');

const failedPipelineTrace=[];
await assert.rejects(
  () => runSequentialTeamCalls({
    providerIds:['openai','anthropic','gemini'],
    task:'failure cleanup',
    runStage:async({id})=>{
      failedPipelineTrace.push(id);
      if(id==='anthropic')throw new Error('stage two failed');
      return 'completed '+id;
    }
  }),
  error=>{
    assert.equal(error.message,'stage two failed');
    assert.deepEqual(error.completedStages.map(stage=>stage.id),['openai'],
      'a failed pipeline must retain earlier completed stages for the UI');
    return true;
  }
);
assert.deepEqual(failedPipelineTrace,['openai','anthropic'],
  'a failed sequential stage must stop before later providers are called');


const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
assert.ok(main.includes('normalizeOllamaEndpoint(settings.ollamaUrl)'),
  'Ollama endpoints must be normalized before any prompt or shared context is sent');
assert.ok(main.includes("fetchJson(url+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},redirect:'error',body:JSON.stringify"),
  'Ollama requests must reject redirects so an allowed HTTPS host cannot redirect to an unvalidated IP target');
const ollamaBlockStart=main.indexOf("if(id==='ollama'){");
const ollamaGuardIndex=main.indexOf('normalizeOllamaEndpoint(settings.ollamaUrl)',ollamaBlockStart);
const ollamaRequestIndex=main.indexOf("fetchJson(url+'/api/chat'",ollamaBlockStart);
assert.ok(ollamaBlockStart>=0&&ollamaGuardIndex>ollamaBlockStart&&ollamaRequestIndex>ollamaGuardIndex,
  'the Ollama HTTP policy must run before the provider request');
assert.match(main,/async function testOllama\(\)\{if\(!await saveOllama\(\)\)return;/,
  'the Ollama connection test must stop when an unsafe endpoint is rejected');
assert.match(main,/async function saveOllama\(\)\{const rawUrl=\$\('ollamaUrl'\)\.value\.trim\(\);try\{settings\.ollamaUrl=rawUrl\?normalizeOllamaEndpoint\(rawUrl\):'';/,
  'unsafe Ollama endpoints must not be persisted as valid connection settings');


assert.ok(!main.includes('slice(0,4)')&&!main.includes('slice(0, 4)'),
  'no four-member team cap may remain');
assert.ok(main.includes("device: { name:'Telefon içi GGUF'"),
  'the phone GGUF engine must be registered as a provider');
assert.ok(main.includes("if(id==='device')return Boolean(nativeApp&&deviceLocalCoder.loadedFileName)"),
  'phone GGUF must only be ready while loaded in the Android runtime');
assert.ok(main.includes("generateWithDeviceModel(devicePrompt,384,'all')"),
  'AI Team calls must route to the on-device inference engine');
assert.ok(main.includes('const selected=configuredTeam()'),
  'live team execution must select only configured providers');
assert.ok(main.includes('selectConfiguredTeam(selectedTeam(),Object.keys(providers),providerIsReady)'),
  'configured provider filtering must use the tested readiness selector');
assert.ok(main.includes('confirmTeamLiveCalls(selected,count=>confirm('),
  'parallel team, pipeline and model comparison must use the tested live-consent guard');
assert.ok(main.includes('runParallelTeamCalls({providerIds:selected,task,history,callProvider})'),
  'parallel AI Team execution must use the tested provider fan-out helper');
assert.ok(main.includes('runSequentialTeamCalls({')&&main.includes('getHistory:()=>chatContext().slice(0,-1)'),
  'sequential pipeline UI must use the tested stage runner and refresh context between stages');
assert.ok(main.includes('runParallelTeamCalls({')&&main.includes('providerIds:selected,task:prompt,history:[],\n      callProvider\n    });'),
  'model comparison must call only configured real providers through the shared fan-out helper');
assert.ok(html.includes('id="selectAllTeam"'));
assert.ok(html.includes('Tüm AI sağlayıcılarını takıma ekle'));
assert.ok(pkg.scripts['test:ai-team']);
assert.equal(main.split('function renderCompareResults(').length-1,1,
  'model comparison renderer must be declared only once');
assert.equal(main.split('async function runCompare(').length-1,1,
  'model comparison runner must be declared only once');
assert.ok(main.includes('function currentGeneralSkillContext(maxChars=6000)'),
  'general Skills must be composed into the shared live-provider system context');
assert.ok(main.includes("const skillContext=options.includeGeneralSkills===false?'':currentGeneralSkillContext(6000).promptText"),
  'normal provider paths must receive selected general Skills');
assert.ok(main.includes('const fittedContext=fitModelContext({')
  && main.includes('systemPrompt:systemFor(id,prompt,options)')
  && main.includes('const systemPrompt=fittedContext.systemPrompt'),
  'provider adapters must share the system-context builder and fit it to the model context window');
assert.ok(main.includes("callProvider:(id,prompt,history)=>callProvider(id,prompt,history,{includeGeneralSkills:false})"),
  'API Local Coder must avoid duplicating its stage-specific Skills');
assert.ok(main.includes("callProvider('ollama',prompt,[],{includeGeneralSkills:false})"),
  'Ollama Local Coder must avoid duplicating its stage-specific Skills');
assert.ok(main.includes("systemFor('device',basePrompt,{includeGeneralSkills:false})"),
  'device Local Coder must avoid duplicating its stage-specific Skills');
assert.ok(main.includes("content:$('codePad')?.value??file.content"),
  'the latest unsaved editor content must be included in opt-in shared project context');
assert.ok(html.includes('gerçek tekli sohbet, paralel AI Team, sıralı zincir ve model karşılaştırma'),
  'the Skills screen must explain the agent-wide binding');

assert.equal(getTeamStageDetails(0,10).role,'Mimar / planlayıcı');
assert.equal(getTeamStageDetails(3,10).role,'Testçi / son kontrol');
assert.ok(getTeamStageDetails(9,10).instruction.includes('yeni katkı sun'));
console.log('AI Team tests passed: unlimited selection, all 10 engines, phone GGUF readiness/routing and unique comparison functions.');
