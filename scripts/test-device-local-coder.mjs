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


let cancelAttempts = 0;
const retryCancelPlugin = {
  getDeviceInfo: fake.getDeviceInfo,
  listModels: async () => ({ models: [] }),
  downloadModel: async () => ({ downloadId: 101 }),
  downloadStatus: async () => ({ status: 'running', progress: 10 }),
  cancelDownload: async () => {
    cancelAttempts += 1;
    if (cancelAttempts === 1) throw new Error('temporary native cancellation failure');
    return { cancelled: true, completed: false };
  }
};
const retryCancelClient = new DeviceLocalCoder(true, retryCancelPlugin);
const retryCancelPending = retryCancelClient.download(DEVICE_MODEL_CATALOG[0], () => {}, { pollIntervalMs: 1, timeoutMs: 5000 });
while (retryCancelClient.activeDownloadId === null) await new Promise(resolve => setTimeout(resolve, 0));
await assert.rejects(() => retryCancelClient.cancelDownload(), /temporary native cancellation failure/);
assert.equal(retryCancelClient.activeDownloadId, 101, 'failed cancellation must retain the active id for retry');
assert.equal(retryCancelClient.activeDownloadFileName, DEVICE_MODEL_CATALOG[0].fileName, 'failed cancellation must retain its filename');
assert.equal(retryCancelClient.cancelRequested, false, 'failed cancellation must release the cancellation flag');
const retriedCancellation = await retryCancelClient.cancelDownload();
assert.equal(retriedCancellation.cancelled, true, 'a second cancellation attempt should succeed');
await assert.rejects(retryCancelPending, /iptal edildi/i);
assert.equal(retryCancelClient.activeDownloadId, null, 'the download finally block clears state after retry succeeds');

let statusErrorCancelCalls = 0;
const statusErrorPlugin = {
  getDeviceInfo: fake.getDeviceInfo,
  listModels: async () => ({ models: [] }),
  downloadModel: async () => ({ downloadId: 202 }),
  downloadStatus: async () => { throw new Error('temporary status bridge failure'); },
  cancelDownload: async args => {
    statusErrorCancelCalls += 1;
    assert.deepEqual(args,{downloadId:202,fileName:DEVICE_MODEL_CATALOG[0].fileName});
    return {cancelled:true,completed:false};
  }
};
const statusErrorClient = new DeviceLocalCoder(true,statusErrorPlugin);
await assert.rejects(
  () => statusErrorClient.download(DEVICE_MODEL_CATALOG[0],()=>{},{pollIntervalMs:1}),
  /temporary status bridge failure/
);
assert.equal(statusErrorCancelCalls,1,'status bridge errors must attempt native cancellation');
assert.equal(statusErrorClient.activeDownloadId,null,'successful cleanup after status error clears the download id');

let failedCleanupAttempts=0;
const failedCleanupPlugin = {
  getDeviceInfo: fake.getDeviceInfo,
  listModels: async () => ({models:[]}),
  downloadModel: async () => ({downloadId:203}),
  downloadStatus: async () => {throw new Error('temporary download status error');},
  cancelDownload: async () => {
    failedCleanupAttempts += 1;
    if(failedCleanupAttempts===1) throw new Error('native cancel unavailable');
    return {cancelled:true,completed:false};
  }
};
const failedCleanupClient = new DeviceLocalCoder(true,failedCleanupPlugin);
await assert.rejects(
  () => failedCleanupClient.download(DEVICE_MODEL_CATALOG[0]),
  /temporary download status error/
);
assert.equal(failedCleanupClient.activeDownloadId,203,'failed automatic cleanup must retain id for manual retry');
assert.equal(failedCleanupClient.activeDownloadFileName,DEVICE_MODEL_CATALOG[0].fileName);
assert.equal(failedCleanupClient.cancelRequested,false);
assert.equal((await failedCleanupClient.cancelDownload()).cancelled,true);
assert.equal(failedCleanupClient.activeDownloadId,null,'manual cancellation after a stopped poll loop must clear the stale id');
assert.equal(failedCleanupClient.activeDownloadFileName,'');
assert.equal(failedCleanupClient.downloadLoopActive,false);

let importedModels = [];
let importListenerRemoved = false;
const importProgressEvents = [];
const importPlugin = {
  getDeviceInfo: fake.getDeviceInfo,
  listModels: async () => ({ models: importedModels }),
  addListener: async (eventName, callback) => {
    assert.equal(eventName,'localModelImportProgress');
    callback({fileName:'transferred-qwen.gguf',copiedBytes:8*1024**2,totalBytes:24*1024**2,progress:33,complete:false});
    callback({fileName:'transferred-qwen.gguf',copiedBytes:24*1024**2,totalBytes:24*1024**2,progress:100,complete:true});
    return {remove:async()=>{importListenerRemoved=true;}};
  },
  importModel: async () => {
    importedModels = [{ fileName: 'transferred-qwen.gguf', sizeBytes: 24 * 1024 ** 2, loaded: false }];
    return { imported: true, fileName: 'transferred-qwen.gguf', sizeBytes: 24 * 1024 ** 2 };
  }
};
const importClient = new DeviceLocalCoder(true, importPlugin);
const importResult = await importClient.importModel(event=>importProgressEvents.push(event));
assert.equal(importResult.imported, true);
assert.equal(importClient.models[0].fileName, 'transferred-qwen.gguf', 'imported GGUF should appear in the installed model list');
assert.equal(importClient.importStarting, false, 'the import lock must release after success');
assert.equal(importListenerRemoved,true,'import progress listener must be removed after success');
assert.equal(importProgressEvents.length,2,'import progress events must reach the UI callback');
assert.equal(importProgressEvents[0].progress,33);
assert.equal(importProgressEvents[1].complete,true);

let failedImportListenerRemoved=false;
const failedImportClient=new DeviceLocalCoder(true,{
  addListener:async()=>({remove:async()=>{failedImportListenerRemoved=true;}}),
  importModel:async()=>{throw new Error('simulated picker/import failure');}
});
await assert.rejects(()=>failedImportClient.importModel(),/simulated picker\/import failure/);
assert.equal(failedImportClient.importStarting,false,'failed imports must release the import lock');

assert.equal(failedImportListenerRemoved,true,'failed imports must remove their progress listener');

const cleanupFailureClient=new DeviceLocalCoder(true,{
  addListener:async()=>({remove:async()=>{throw new Error('simulated listener cleanup error');}}),
  importModel:async()=>({cancelled:true})
});
const cleanupFailureResult=await cleanupFailureClient.importModel();
assert.equal(cleanupFailureResult.cancelled,true,'listener cleanup errors must not overwrite the import result');
assert.equal(cleanupFailureClient.importStarting,false,'listener cleanup errors must still release the import lock');
const browserImportClient = new DeviceLocalCoder(false);
await assert.rejects(() => browserImportClient.importModel(), /Android APK gerektirir/);

const slowImportClient = new DeviceLocalCoder(true, {
  getDeviceInfo: fake.getDeviceInfo,
  listModels: async () => ({ models: [] }),
  importModel: async () => new Promise(resolve => setTimeout(() => resolve({ imported: false, cancelled: true }), 5))
});
const importing = slowImportClient.importModel();
await assert.rejects(
  () => slowImportClient.download(DEVICE_MODEL_CATALOG[0]),
  /Başka bir model aktarımı sürüyor/
);
await importing;
assert.equal(slowImportClient.importStarting, false, 'the import lock must release after cancel');

console.log('Device Local Coder bridge tests passed.');
