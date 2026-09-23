export const INCLUSION_OBSERVATORY_POLICIES = {
  balanced: { id:'balanced', version:'3.3.0', minimumPublicCellSize:5, minimumInstitutionCellSize:5, youthMaxAge:35, ruralZones:['Koutiala','Sikasso','Mopti','Fana','Bougouni'], targetProcessingMinutes:30, targetCompletionRate:85, targetOfflineShare:25, targetWomenShare:60, targetYouthShare:40 },
  prudent: { id:'prudent', version:'3.3.0', minimumPublicCellSize:7, minimumInstitutionCellSize:5, youthMaxAge:35, ruralZones:['Koutiala','Sikasso','Mopti','Fana','Bougouni'], targetProcessingMinutes:35, targetCompletionRate:88, targetOfflineShare:25, targetWomenShare:60, targetYouthShare:40 },
  inclusivePilot: { id:'inclusivePilot', version:'3.3.0', minimumPublicCellSize:5, minimumInstitutionCellSize:5, youthMaxAge:35, ruralZones:['Koutiala','Sikasso','Mopti','Fana','Bougouni'], targetProcessingMinutes:30, targetCompletionRate:82, targetOfflineShare:30, targetWomenShare:60, targetYouthShare:40 }
};
export function validateInclusionObservatoryPolicy(p){return Boolean(p?.id&&p?.version&&Number.isInteger(p.minimumPublicCellSize)&&p.minimumPublicCellSize>=5&&Number.isInteger(p.youthMaxAge)&&p.youthMaxAge>=18&&Array.isArray(p.ruralZones));}
