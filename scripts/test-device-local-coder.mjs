import assert from 'node:assert/strict';
import { DEVICE_MODEL_CATALOG, DeviceLocalCoder, chooseRecommendedDeviceModel, formatModelBytes } from '../src/device-local-coder.js';
assert.equal(DEVICE_MODEL_CATALOG.length, 3);
assert.ok(DEVICE_MODEL_CATALOG.every(model => model.url.startsWith('https://huggingface.co/')));
assert.equal(chooseRecommendedDeviceModel({totalMemoryBytes: 4*1024**3,availableMemoryBytes:2*1024**3}).id,'qwen25-coder-05');
assert.equal(chooseRecommendedDeviceModel({totalMemoryBytes: 8*1024**3,availableMemoryBytes:3*1024**3}).id,'qwen25-coder-15');
assert.equal(chooseRecommendedDeviceModel({totalMemoryBytes: 12*1024**3,availableMemoryBytes:4*1024**3}).id,'qwen25-coder-3');
assert.equal(formatModelBytes(491*1024**2),'491 MB');
assert.equal(new DeviceLocalCoder(false).native,false);
let loaded=''; let models=[];
const fake={
  getDeviceInfo:async()=>({supported:true,totalMemoryBytes:8*1024**3,availableMemoryBytes:4*1024**3,freeStorageBytes:10*1024**3,loadedFileName:loaded,abi:'arm64-v8a'}),
  listModels:async()=>({models}),
  downloadModel:async()=>({downloadId:7}),
  downloadStatus:async()=>{models=[{fileName:DEVICE_MODEL_CATALOG[0].fileName,sizeBytes:DEVICE_MODEL_CATALOG[0].sizeBytes,loaded:false}];return {status:'complete',progress:100};},
  addListener:async()=>({remove:async()=>{}}),
  loadModel:async({fileName})=>{loaded=fileName;models=[{fileName,sizeBytes:1,loaded:true}];return {loaded:true,fileName};},
  chat:async()=>({text:'offline result'}),
  unloadModel:async()=>{loaded='';models=[];return {loaded:false};},
  deleteModel:async()=>({deleted:true})
};
const local=new DeviceLocalCoder(true,fake);
await local.refresh();
await local.download(DEVICE_MODEL_CATALOG[0]);
await local.load(DEVICE_MODEL_CATALOG[0].fileName,2048);
assert.equal((await local.generate([{role:'user',content:'test'}])).text,'offline result');
await local.unload();
console.log('Device Local Coder bridge tests passed.');
