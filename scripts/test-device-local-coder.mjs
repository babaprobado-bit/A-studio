import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DEVICE_MODEL_CATALOG, DeviceLocalCoder, assessDeviceModel, chooseRecommendedDeviceModel, estimateMinimumAvailableRamBytes, formatModelBytes, normalizeModelSha256 } from '../src/device-local-coder.js';

const devicePanelMarkup = await readFile(new URL('../src/device-local-coder-panel.html', import.meta.url), 'utf8');
const indexMarkup = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const mainSource = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
const nativeSource = await readFile(new URL('../android-local-runtime/LocalLlmPlugin.kt', import.meta.url), 'utf8');
for (const markup of [devicePanelMarkup,indexMarkup]) {
  assert.match(markup, /id="onDeviceModelLicense"/);
  assert.match(markup, /id="cancelOnDeviceDownload"/);
  assert.match(markup, /id="importOnDeviceModel"/);
  assert.match(markup, /id="cancelOnDeviceImport"/);
  assert.match(markup, /İnternet gerekmez/);
  assert.match(markup, /USB, hafıza kartı/);
}
assert.match(mainSource, /GGUF dosyası doğrulandı ve telefona kaydedildi/);
assert.match(mainSource, /\$\('importOnDeviceModel'\)\.addEventListener\('click',importDeviceModelFile\)/);
assert.match(mainSource, /\$\('cancelOnDeviceImport'\)\.addEventListener\('click',cancelDeviceModelImport\)/);
assert.match(mainSource, /\$\('cancelOnDeviceDownload'\)\.addEventListener\('click',cancelSelectedDeviceModel\)/);
assert.equal((indexMarkup.match(/id="importOnDeviceModel"/g)||[]).length,1,'the actual app screen must contain one GGUF import button');
assert.equal((indexMarkup.match(/id="cancelOnDeviceDownload"/g)||[]).length,1,'the actual app screen must contain one cancel button');

const loadMethodStart=nativeSource.indexOf('fun loadModel(call: PluginCall)');
const loadMethodEnd=nativeSource.indexOf('@PluginMethod',loadMethodStart+10);
assert.ok(loadMethodStart>=0&&loadMethodEnd>loadMethodStart,'native GGUF loader must exist');
const nativeLoadSource=nativeSource.slice(loadMethodStart,loadMethodEnd);
assert.ok(
  nativeLoadSource.indexOf('previous?.free()') < nativeLoadSource.indexOf('activityManager.getMemoryInfo(memoryInfo)'),
  'replacing a loaded GGUF must free the old engine before measuring available RAM for the replacement'
);

assert.equal(DEVICE_MODEL_CATALOG.length, 3);
assert.deepEqual(DEVICE_MODEL_CATALOG.map(model => model.sha256), ["1d9614638d18024d0fbb36575a15f1302a3adf044df10345688ec4f6e1c4ff32","cc324af070c2ecbfd324a30884d2f951a7ff756aba85cb811a6ec436933bb046","724fb256bec1ff062b2f65e4569e871ad2e95ab2a3989723d1769c54294730b7"],
  'all official Qwen2.5-Coder catalogue files must have pinned SHA-256 digests');
assert.ok(DEVICE_MODEL_CATALOG.every(model => /^[a-f0-9]{64}$/.test(model.sha256)),
  'each downloadable catalogue model must have a valid SHA-256 digest');
assert.equal(normalizeModelSha256(DEVICE_MODEL_CATALOG[0].sha256.toUpperCase()), DEVICE_MODEL_CATALOG[0].sha256);
assert.equal(normalizeModelSha256('not-a-sha256'), '');
assert.equal(normalizeModelSha256(''), '');
assert.match(nativeSource, /MessageDigest\.getInstance\("SHA-256"\)/,
  'native Android download verification must use SHA-256');
assert.match(nativeSource, /MessageDigest\.isEqual/,
  'native SHA-256 comparison must use a constant-time digest comparison');
assert.match(nativeSource, /putString\(sha256PreferenceKey\(fileName\), expectedSha256\)/,
  'the expected digest must survive Android process restarts with the download record');
const nativeFinalizerStart = nativeSource.indexOf('private fun finalizeCatalogueDownload(');
const nativeFinalizerEnd = nativeSource.indexOf('private fun finalizeDownloadedModel(', nativeFinalizerStart);
const nativeFinalizer = nativeSource.slice(nativeFinalizerStart, nativeFinalizerEnd);
assert.ok(nativeFinalizer.indexOf('verifyDownloadedModelSha256') >= 0 &&
  nativeFinalizer.indexOf('verifyDownloadedModelSha256') < nativeFinalizer.indexOf('finalizeDownloadedModel(fileName)'),
  'native SHA-256 verification must finish before the .part file is promoted');
const nativeImportStart = nativeSource.indexOf('private fun importModelFromUri(');
const nativeImportEnd = nativeSource.indexOf('@PluginMethod', nativeImportStart);
const nativeImportSource = nativeSource.slice(nativeImportStart, nativeImportEnd);
assert.ok(!nativeImportSource.includes('verifyDownloadedModelSha256'),
  'user-selected offline GGUF imports must not require a catalogue checksum');
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
assert.equal(
  estimateMinimumAvailableRamBytes({fileName:DEVICE_MODEL_CATALOG[0].fileName,sizeBytes:DEVICE_MODEL_CATALOG[0].sizeBytes}),
  DEVICE_MODEL_CATALOG[0].requiredFreeRamBytes,
  'catalogue models should use their reviewed RAM threshold'
);
assert.equal(
  estimateMinimumAvailableRamBytes({fileName:'imported-community-model.gguf',sizeBytes:2*1024**3}),
  Math.ceil(2*1024**3*1.4+750*1024**2),
  'imported GGUF files should receive a conservative size-based RAM estimate'
);
let sameModelLoadCalls = 0;
const alreadyLoadedPlugin = {
  getDeviceInfo:async()=>({
    supported:true,totalMemoryBytes:8*1024**3,availableMemoryBytes:512*1024**2,
    freeStorageBytes:8*1024**3,processorCount:8,lowMemory:false,loadedFileName:'already-loaded.gguf'
  }),
  listModels:async()=>({models:[{fileName:'already-loaded.gguf',sizeBytes:500*1024**2,loaded:true}]}),
  addListener:async()=>{throw new Error('already-loaded model must not create a load listener');},
  loadModel:async()=>{sameModelLoadCalls++;throw new Error('already-loaded model must not be loaded again');}
};
const alreadyLoadedClient = new DeviceLocalCoder(true,alreadyLoadedPlugin);
const alreadyLoadedResult = await alreadyLoadedClient.load('already-loaded.gguf',4096);
assert.equal(alreadyLoadedResult.alreadyLoaded,true,'loading the currently active model should be idempotent');
assert.equal(alreadyLoadedResult.contextSize,4096);

assert.equal(sameModelLoadCalls,0,'already-loaded GGUF should not hit native load or need additional free RAM');

let nativeLoadedName = 'previous-model.gguf';
const stateSyncPlugin = {
  getDeviceInfo:async()=>({
    supported:true,totalMemoryBytes:8*1024**3,availableMemoryBytes:4*1024**3,
    freeStorageBytes:8*1024**3,processorCount:8,lowMemory:false,loadedFileName:nativeLoadedName
  }),
  listModels:async()=>({models:[
    {fileName:'previous-model.gguf',sizeBytes:200*1024**2,loaded:nativeLoadedName==='previous-model.gguf'},
    {fileName:'candidate-model.gguf',sizeBytes:200*1024**2,loaded:nativeLoadedName==='candidate-model.gguf'}
  ]}),
  addListener:async()=>({remove:async()=>{}}),
  loadModel:async()=>{nativeLoadedName='';throw new Error('simulated native initialization failure after freeing previous engine');},
  unloadModel:async()=>{nativeLoadedName='';throw new Error('simulated native cleanup failure after clearing engine');}
};
const stateSyncClient = new DeviceLocalCoder(true,stateSyncPlugin);
await stateSyncClient.refresh();
assert.equal(stateSyncClient.loadedFileName,'previous-model.gguf');
await assert.rejects(
  () => stateSyncClient.load('candidate-model.gguf',2048),
  /simulated native initialization failure/
);
assert.equal(stateSyncClient.loadedFileName,'','failed replacement loads must clear stale JavaScript readiness');
await stateSyncClient.refresh();
nativeLoadedName='previous-model.gguf';
await stateSyncClient.refresh();
await assert.rejects(() => stateSyncClient.unload(),/simulated native cleanup failure/);
assert.equal(stateSyncClient.loadedFileName,'','failed unloads must reconcile the native engine state');

assert.equal(new DeviceLocalCoder(false).native,false);
let loaded=''; let models=[]; let firstDownloadArgs=null;
const fake={
  getDeviceInfo:async()=>({supported:true,totalMemoryBytes:8*1024**3,availableMemoryBytes:4*1024**3,freeStorageBytes:10*1024**3,loadedFileName:loaded,abi:'arm64-v8a'}),
  listModels:async()=>({models}),
  downloadModel:async(args)=>{firstDownloadArgs=args;return {downloadId:7};},
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
assert.equal(firstDownloadArgs.sha256, DEVICE_MODEL_CATALOG[0].sha256,
  'the pinned catalogue digest must be forwarded to the Android plugin');
await local.load(DEVICE_MODEL_CATALOG[0].fileName,2048);
assert.equal((await local.generate([{role:'user',content:'test'}])).text,'offline result');
await local.unload();

let customModelLoadCalls = 0;
let customAvailableRam = 3 * 1024**3;
const customModelPlugin = {
  getDeviceInfo:async()=>({
    supported:true,totalMemoryBytes:8*1024**3,availableMemoryBytes:customAvailableRam,
    freeStorageBytes:8*1024**3,processorCount:8,lowMemory:false,loadedFileName:''
  }),
  listModels:async()=>({models:[{fileName:'imported-community-model.gguf',sizeBytes:2*1024**3,loaded:false}]}),
  addListener:async()=>({remove:async()=>{}}),
  loadModel:async({fileName})=>{customModelLoadCalls++;return {loaded:true,fileName};}
};
const customModelClient = new DeviceLocalCoder(true,customModelPlugin);
await assert.rejects(
  () => customModelClient.load('imported-community-model.gguf',2048),
  /Yetersiz boş RAM/,
  'custom imported models must be checked before native load'
);
assert.equal(customModelLoadCalls,0,'low-memory custom models must not reach the native loader');
customAvailableRam = 4 * 1024**3;
await customModelClient.load('imported-community-model.gguf',2048);

assert.equal(customModelLoadCalls,1,'custom model should load through the bridge when the estimate is met');

let replacementNativeName='previous-model.gguf';
let replacementLoadCalls=0;
const replacementPlugin={
  getDeviceInfo:async()=>({
    supported:true,totalMemoryBytes:8*1024**3,availableMemoryBytes:512*1024**2,
    freeStorageBytes:8*1024**3,processorCount:8,lowMemory:false,loadedFileName:replacementNativeName
  }),
  listModels:async()=>({models:[
    {fileName:'previous-model.gguf',sizeBytes:700*1024**2,loaded:replacementNativeName==='previous-model.gguf'},
    {fileName:'candidate-model.gguf',sizeBytes:700*1024**2,loaded:replacementNativeName==='candidate-model.gguf'}
  ]}),
  addListener:async()=>({remove:async()=>{}}),
  loadModel:async({fileName})=>{replacementLoadCalls++;replacementNativeName=fileName;return {loaded:true,fileName};}
};
const replacementClient=new DeviceLocalCoder(true,replacementPlugin);
await replacementClient.refresh();
assert.equal(replacementClient.loadedFileName,'previous-model.gguf');
await replacementClient.load('candidate-model.gguf',2048);
assert.equal(replacementLoadCalls,1,'a replacement model must reach native RAM preflight even when current free RAM is below its threshold');
assert.equal(replacementClient.loadedFileName,'candidate-model.gguf','successful replacement loads must update the active model name');


let guardedDownloadCalls = 0;
let guardedDownloadArgs = null;
const guardedDownloadClient = new DeviceLocalCoder(true, {
  getDeviceInfo: fake.getDeviceInfo,
  listModels: async () => ({ models: [] }),
  downloadModel: async args => {
    guardedDownloadCalls += 1;
    guardedDownloadArgs = args;
    return { downloadId: 501 };
  },
  downloadStatus: async () => ({ status: 'complete', progress: 100 })
});
await guardedDownloadClient.download({ ...DEVICE_MODEL_CATALOG[0], sha256: '' });
assert.equal(guardedDownloadArgs.sha256, DEVICE_MODEL_CATALOG[0].sha256,
  'a caller-supplied empty digest must never override the pinned catalogue checksum');
assert.equal(guardedDownloadCalls, 1,
  'a valid catalogue entry remains downloadable even if an untrusted caller omits its digest');
await assert.rejects(
  () => guardedDownloadClient.download({
    ...DEVICE_MODEL_CATALOG[0],
    url: DEVICE_MODEL_CATALOG[0].url + '?untrusted=1'
  }),
  /katalog/,
  'a URL that does not exactly match a pinned catalogue entry must be rejected'
);
assert.equal(guardedDownloadCalls, 1,
  'a modified catalogue URL must never reach Android DownloadManager');

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
let nativeImportId = '';
let resolveNativeImport;
let nativeCancelArgs = null;
const cancelImportClient = new DeviceLocalCoder(true,{
  addListener:async()=>({remove:async()=>{}}),
  importModel:async({importId})=>{
    nativeImportId=importId;
    return new Promise(resolve=>{resolveNativeImport=resolve;});
  },
  cancelImport:async({importId})=>{
    nativeCancelArgs={importId};
    resolveNativeImport({cancelled:true});
    return {cancelRequested:true};
  }
});
const pendingLocalImport = cancelImportClient.importModel();
while(nativeImportId==='') await new Promise(resolve=>setTimeout(resolve,0));
assert.match(nativeImportId,/^gguf-import-/);
const cancelImportResult=await cancelImportClient.cancelImport();
assert.equal(cancelImportResult.cancelRequested,true);
assert.deepEqual(nativeCancelArgs,{importId:nativeImportId});
assert.deepEqual(await pendingLocalImport,{cancelled:true});
assert.equal(cancelImportClient.activeImportId,null,'cancelled file imports must release their id');
assert.equal(cancelImportClient.importStarting,false,'cancelled file imports must release the import lock');
assert.equal(cancelImportClient.cancelImportRequested,false,'cancel flag must clear after result resolution');

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
