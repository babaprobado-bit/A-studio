import assert from 'node:assert/strict';
import { DEVICE_MODEL_CATALOG, DeviceLocalCoder, assessDeviceModel, chooseRecommendedDeviceModel, formatModelBytes } from '../src/device-local-coder.js';
assert.equal(DEVICE_MODEL_CATALOG.length, 3);
assert.ok(DEVICE_MODEL_CATALOG.every(model => model.url.startsWith('https://huggingface.co/')));
assert.ok(DEVICE_MODEL_CATALOG.every(model => model.licenseUrl.startsWith('https://huggingface.co/')));
assert.equal(DEVICE_MODEL_CATALOG[0].licenseName,'Apache-2.0');
assert.equal(DEVICE_MODEL_CATALOG[1].licenseName,'Apache-2.0');
assert.equal(DEVICE_MODEL_CATALOG[2].licenseName,'Qwen Research License');
assert.match(DEVICE_MODEL_CATALOG[2].licenseNotice,/ticari olmayan/i);
assert.equal(chooseRecommendedDeviceModel({supported:true,totalMemoryBytes:4*1024**3,availableMemoryBytes:2*1024**3,freeStorageBytes:2*1024**3,processorCount:4}).id,'qwen25-coder-05');
assert.equal(chooseRecommendedDeviceModel({supported:true,totalMemoryBytes:8*1024**3,availableMemoryBytes:3*1024**3,freeStorageBytes:3*1024**3,processorCount:6}).id,'qwen25-coder-15');
assert.equal(chooseRecommendedDeviceModel({supported:true,totalMemoryBytes:12*1024**3,availableMemoryBytes:4*1024**3,freeStorageBytes:4*1024**3,processorCount:8}).id,'qwen25-coder-3');
assert.equal(chooseRecommendedDeviceModel({supported:true,totalMemoryBytes:12*1024**3,availableMemoryBytes:4*1024**3,freeStorageBytes:4*1024**3,processorCount:4}).id,'qwen25-coder-05');
const tooSmall=chooseRecommendedDeviceModel({supported:true,totalMemoryBytes:3*1024**3,availableMemoryBytes:2*1024**3,freeStorageBytes:2*1024**3,processorCount:8});
assert.equal(tooSmall.isUnderpowered,true);
assert.equal(tooSmall.canLoad,false);
assert.equal(chooseRecommendedDeviceModel({supported:true,totalMemoryBytes:8*1024**3,availableMemoryBytes:3*1024**3,freeStorageBytes:3*1024**3,processorCount:8,lowMemory:true}).canLoad,false);
const noSpace=chooseRecommendedDeviceModel({supported:true,totalMemoryBytes:4*1024**3,availableMemoryBytes:2*1024**3,freeStorageBytes:300*1024**2,processorCount:8});
assert.equal(noSpace.canDownload,false);
assert.equal(chooseRecommendedDeviceModel({supported:false,totalMemoryBytes:8*1024**3,availableMemoryBytes:4*1024**3,freeStorageBytes:4*1024**3,processorCount:8}).canLoad,false);
assert.equal(assessDeviceModel(DEVICE_MODEL_CATALOG[2],{supported:true,totalMemoryBytes:12*1024**3,availableMemoryBytes:4*1024**3,freeStorageBytes:4*1024**3,processorCount:8}).fitsRecommended,true);
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

let failDownload = true;
const retryPlugin = {
  getDeviceInfo: fake.getDeviceInfo,
  listModels: fake.listModels,
  downloadModel: async () => ({ downloadId: 88 }),
  downloadStatus: async () => failDownload
    ? { status: 'failed', reason: 'test network failure' }
    : { status: 'complete', progress: 100 }
};
const retryClient = new DeviceLocalCoder(true, retryPlugin);
await assert.rejects(() => retryClient.download(DEVICE_MODEL_CATALOG[0]), /test network failure/);
assert.equal(retryClient.activeDownloadId, null, 'failed downloads must clear the active id');
failDownload = false;
await retryClient.download(DEVICE_MODEL_CATALOG[0]);
assert.equal(retryClient.activeDownloadId, null, 'successful downloads must clear the active id');

let cancelArgs = null;
const cancelPlugin = {
  getDeviceInfo: fake.getDeviceInfo,
  listModels: async () => ({ models: [] }),
  downloadModel: async () => ({ downloadId: 99 }),
  downloadStatus: async () => ({ status: 'running', progress: 20 }),
  cancelDownload: async args => { cancelArgs = args; return { cancelled: true, completed: false }; }
};
const cancelClient = new DeviceLocalCoder(true, cancelPlugin);
const pendingDownload = cancelClient.download(DEVICE_MODEL_CATALOG[0], () => {}, { pollIntervalMs: 1, timeoutMs: 5000 });
while (cancelClient.activeDownloadId === null) await new Promise(resolve => setTimeout(resolve, 0));
await cancelClient.cancelDownload();
await assert.rejects(pendingDownload, /iptal edildi/i);
assert.deepEqual(cancelArgs, { downloadId: 99, fileName: DEVICE_MODEL_CATALOG[0].fileName });
assert.equal(cancelClient.activeDownloadId, null, 'cancelled downloads must clear the active id');
assert.equal(cancelClient.activeDownloadFileName, '', 'cancelled downloads must clear the active filename');

let timeoutCancelCalled = false;
const timeoutPlugin = {
  getDeviceInfo: fake.getDeviceInfo,
  listModels: async () => ({ models: [] }),
  downloadModel: async () => ({ downloadId: 100 }),
  downloadStatus: async () => ({ status: 'running', progress: 1 }),
  cancelDownload: async () => { timeoutCancelCalled = true; return { cancelled: true, completed: false }; }
};
const timeoutClient = new DeviceLocalCoder(true, timeoutPlugin);
await assert.rejects(
  () => timeoutClient.download(DEVICE_MODEL_CATALOG[0], () => {}, { pollIntervalMs: 1, timeoutMs: 1 }),
  /zaman aşımına uğradı/i
);
assert.equal(timeoutCancelCalled, true, 'timed-out downloads must cancel the native DownloadManager task');
assert.equal(timeoutClient.activeDownloadId, null, 'timed-out downloads must clear the active id');

console.log('Device Local Coder bridge tests passed.');
