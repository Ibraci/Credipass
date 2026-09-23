export const OFFLINE_SYNC_POLICIES = {
  balanced: {
    id:'balanced', version:'2.7.0-BAL',
    maxQueueItems:250, maxAttempts:5, baseRetryMinutes:5, maxPayloadBytes:262144,
    conflictWindowMinutes:30, minimumMissionQuality:70, attachmentReferenceOnly:true,
    resolutions:['keep-local','keep-server','merge-non-sensitive','defer']
  },
  prudent: {
    id:'prudent', version:'2.7.0-PRU',
    maxQueueItems:150, maxAttempts:4, baseRetryMinutes:10, maxPayloadBytes:131072,
    conflictWindowMinutes:20, minimumMissionQuality:80, attachmentReferenceOnly:true,
    resolutions:['keep-local','keep-server','merge-non-sensitive','defer']
  },
  inclusivePilot: {
    id:'inclusivePilot', version:'2.7.0-INC',
    maxQueueItems:300, maxAttempts:6, baseRetryMinutes:5, maxPayloadBytes:262144,
    conflictWindowMinutes:45, minimumMissionQuality:65, attachmentReferenceOnly:true,
    resolutions:['keep-local','keep-server','merge-non-sensitive','defer']
  }
};
export function getOfflineSyncPolicy(id='balanced'){ return OFFLINE_SYNC_POLICIES[id] || OFFLINE_SYNC_POLICIES.balanced; }
export function validateOfflineSyncPolicy(p){
  return Boolean(p?.id&&p?.version&&Number.isInteger(p.maxQueueItems)&&p.maxQueueItems>0&&Number.isInteger(p.maxAttempts)&&p.maxAttempts>0&&p.baseRetryMinutes>0&&p.maxPayloadBytes>0&&p.minimumMissionQuality>=0&&p.minimumMissionQuality<=100&&Array.isArray(p.resolutions)&&p.resolutions.length===4&&p.attachmentReferenceOnly===true);
}
