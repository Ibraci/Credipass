export const COMMUNICATION_POLICIES = {
  balanced: {
    id:'balanced', version:'2.8.0-BAL', maxExternalMessagesPerRecipientPerDay:3,
    minimumExternalIntervalMinutes:120, deduplicationWindowHours:24,
    quietHours:{ start:20, end:7 }, maximumRetries:3,
    allowedChannels:['inApp','sms','email'], smsMaximumCharacters:160,
    urgentServiceMessagesMayBypassQuietHours:false
  },
  prudent: {
    id:'prudent', version:'2.8.0-PRU', maxExternalMessagesPerRecipientPerDay:2,
    minimumExternalIntervalMinutes:180, deduplicationWindowHours:36,
    quietHours:{ start:19, end:8 }, maximumRetries:2,
    allowedChannels:['inApp','sms','email'], smsMaximumCharacters:150,
    urgentServiceMessagesMayBypassQuietHours:false
  },
  inclusivePilot: {
    id:'inclusivePilot', version:'2.8.0-INC', maxExternalMessagesPerRecipientPerDay:4,
    minimumExternalIntervalMinutes:90, deduplicationWindowHours:18,
    quietHours:{ start:20, end:7 }, maximumRetries:4,
    allowedChannels:['inApp','sms','email'], smsMaximumCharacters:160,
    urgentServiceMessagesMayBypassQuietHours:false
  }
};
export function getCommunicationPolicy(id='balanced'){ return COMMUNICATION_POLICIES[id] || COMMUNICATION_POLICIES.balanced; }
export function validateCommunicationPolicy(p){
  return Boolean(p?.id&&p?.version&&Number.isInteger(p.maxExternalMessagesPerRecipientPerDay)&&p.maxExternalMessagesPerRecipientPerDay>0&&p.minimumExternalIntervalMinutes>0&&p.deduplicationWindowHours>0&&p.quietHours?.start>=0&&p.quietHours?.start<=23&&p.quietHours?.end>=0&&p.quietHours?.end<=23&&Number.isInteger(p.maximumRetries)&&p.maximumRetries>0&&Array.isArray(p.allowedChannels)&&p.allowedChannels.includes('inApp')&&p.allowedChannels.includes('sms')&&p.smsMaximumCharacters>=120);
}
