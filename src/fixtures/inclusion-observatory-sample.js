const sectors=['Commerce','Agriculture','Maraîchage','Élevage','Transformation','Artisanat','Services','Transport'];
const zones=['Bamako','Koutiala','Sikasso','Mopti','Fana','Bougouni'];
const incompleteReasons=['identity-proof','sales-history','debt-reconciliation','consent','seasonal-calendar','supplier-proof'];
export function buildInclusionObservatorySample(){
  const records=[];
  for(let i=1;i<=72;i++){
    const zone=zones[(i*5)%zones.length], sector=sectors[(i*3)%sectors.length];
    const gender=(i%5===0||i%7===0)?'M':'F';
    const age=20+((i*7)%39);
    const requested=120000+((i*37000)%780000);
    const sustainable=Math.round(requested*(0.62+((i%6)*0.05)));
    const complete=(i%9!==0)&&(i%13!==0);
    const financed=complete && i%5!==0;
    const approved=financed?Math.min(requested,sustainable):0;
    const processingMinutes=18+((i*11)%78);
    const offline=(i%3===0)||(zone!=='Bamako'&&i%4===0);
    const improved=i%4===0;
    const appeal=i%11===0;
    const appealResolved=appeal ? i%22!==0 : false;
    const producer=['Agriculture','Maraîchage','Élevage'].includes(sector);
    const repaymentCurrent=financed ? (i%8!==0) : null;
    records.push({
      id:`OBS-${String(i).padStart(3,'0')}`, synthetic:true, zone, sector, gender, age,
      requestedAmount:requested, sustainableAmount:sustainable, approvedAmount:approved,
      complete, financed, processingMinutes, offline, improved, appeal, appealResolved,
      producer, repaymentCurrent,
      incompleteReason:complete?null:incompleteReasons[i%incompleteReasons.length],
      dataConfidence:58+((i*9)%39), incluscore:48+((i*7)%45),
      createdMonth:['2026-05','2026-06','2026-07','2026-08'][i%4]
    });
  }
  return { datasetId:'CREDIPASS-OBS-SAMPLE-72', generatedAt:'2026-08-07T10:45:00.000Z', synthetic:true, records };
}
