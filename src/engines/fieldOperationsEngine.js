export const FIELD_OPERATIONS_ENGINE_VERSION='2.7.0';
export function buildFieldOperationsSummary(workspace){
  const missions=workspace?.missions||[];
  const completionRate=missions.length?Math.round(missions.filter(x=>x.status==='completed').length/missions.length*100):0;
  const avgQuality=missions.length?Math.round(missions.reduce((s,x)=>s+Number(x.qualityScore||0),0)/missions.length):0;
  return {engineVersion:FIELD_OPERATIONS_ENGINE_VERSION,totalMissions:missions.length,completed:missions.filter(x=>x.status==='completed').length,inProgress:missions.filter(x=>x.status==='in-progress').length,assigned:missions.filter(x=>x.status==='assigned').length,scheduled:missions.filter(x=>x.status==='scheduled').length,completionRate,averageQuality:avgQuality,unassigned:missions.filter(x=>!x.assignedAgent&&x.status!=='completed').length,humanSupervisionRequired:true,automaticCreditDecisionAllowed:false};
}
