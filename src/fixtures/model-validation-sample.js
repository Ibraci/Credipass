export function buildModelValidationSample(){
  const rows=[];
  for(let i=1;i<=144;i++){
    const gender=(i%4===0||i%9===0)?'M':'F';
    const rural=i%3!==0;
    const ageBand=(i%5===0)?'36+':'18-35';
    const score=45+((i*11)%48);
    const confidence=58+((i*13)%41);
    const supported=score>=65&&confidence>=65;
    const repaid=((i*7+score)%17)>3;
    const period=i<=72?'reference':'current';
    rows.push({id:`VAL-${String(i).padStart(3,'0')}`,synthetic:true,gender,rural,ageBand,score,confidence,supported,repaid,period});
  }
  return {datasetId:'INCLUSCORE-SYNTHETIC-VALIDATION-144',synthetic:true,generatedAt:'2026-08-07T10:55:00.000Z',rows};
}
