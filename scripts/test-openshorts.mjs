import assert from 'node:assert/strict';
import {
  connectOpenShorts,callOpenShortsTool,validateOpenShortsApiKey,
  validateOpenShortsSourceUrl,OPENSHORTS_MCP_ENDPOINT
} from '../src/openshorts-mcp.js';

const key='osk_0123456789abcdefghijklmnop';
assert.equal(validateOpenShortsApiKey(key),key);
assert.throws(()=>validateOpenShortsApiKey('not-a-key'),/osk_/);
assert.equal(validateOpenShortsSourceUrl('https://youtu.be/abc123'),'https://youtu.be/abc123');
assert.equal(validateOpenShortsSourceUrl('https://cdn.example/video.mp4'),'https://cdn.example/video.mp4');
assert.throws(()=>validateOpenShortsSourceUrl('http://youtube.com/watch?v=abc'),/HTTPS/);
assert.throws(()=>validateOpenShortsSourceUrl('https://localhost/video.mp4'),/Yerel ağ/);
assert.throws(()=>validateOpenShortsSourceUrl('https://example.local/video.mp4'),/Yerel ağ/);
assert.throws(()=>validateOpenShortsSourceUrl('https://example.com/page'),/YouTube bağlantısı/);

const calls=[];
function response(value,status=200){return{ok:status>=200&&status<300,status,text:async()=>value===null?'':JSON.stringify(value)};}
const fakeFetch=async(_url,options)=>{
  const body=JSON.parse(options.body);
  calls.push({body,authorization:options.headers.Authorization});
  if(body.method==='initialize')return response({jsonrpc:'2.0',id:body.id,result:{protocolVersion:'2025-06-18',capabilities:{tools:{}},serverInfo:{name:'openshorts',version:'1.0.0'}}});
  if(body.method==='notifications/initialized')return response(null,202);
  if(body.method==='tools/list')return response({jsonrpc:'2.0',id:body.id,result:{tools:['process_video','get_job_status','list_clips','get_quota','add_subtitles','publish_clip'].map(name=>({name}))}});
  if(body.method==='tools/call')return response({jsonrpc:'2.0',id:body.id,result:{structuredContent:{job_id:'job-test-1',status:'queued'},content:[],isError:false}});
  throw new Error('Unexpected MCP method: '+body.method);
};
const connected=await connectOpenShorts({apiKey:key,fetchImpl:fakeFetch});
assert.equal(connected.serverInfo.name,'openshorts');
assert.ok(connected.tools.some(tool=>tool.name==='process_video'));
assert.equal(OPENSHORTS_MCP_ENDPOINT,'https://mcp.openshorts.app/mcp');

const processed=await callOpenShortsTool({
  apiKey:key,name:'process_video',
  arguments:{source_url:'https://youtu.be/abc123',confirm_rights:true,output_format:'vertical',layouts:['auto']},
  fetchImpl:fakeFetch
});
assert.equal(processed.job_id,'job-test-1');
const processCall=calls.find(call=>call.body.method==='tools/call');
assert.equal(processCall.authorization,'Bearer '+key);
assert.equal(processCall.body.params.name,'process_video');
assert.equal(processCall.body.params.arguments.confirm_rights,true);
assert.throws(()=>callOpenShortsTool({apiKey:key,name:'publish_clip',fetchImpl:fakeFetch}),/etkin değil/);

const failedFetch=async()=>response({jsonrpc:'2.0',id:1,error:{code:-32000,message:'bad token '+key}});
await assert.rejects(callOpenShortsTool({apiKey:key,name:'get_quota',fetchImpl:failedFetch}),error=>!error.message.includes(key)&&/API anahtarı gizlendi/.test(error.message));
console.log('OpenShorts MCP tests passed: key validation, HTTPS source validation, MCP handshake, tool calls, publish exclusion and secret redaction.');
