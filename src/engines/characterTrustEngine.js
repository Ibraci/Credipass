const clamp=n=>Math.max(0,Math.min(100,Math.round(Number(n)||0)));
export const CHARACTER_DIMENSIONS=[
 ['relationship','Relation avec l’institution'],['repayment','Historique de crédit'],['commitments','Respect des engagements'],['consistency','Cohérence des déclarations'],['field','Vérification terrain'],['references','Références vérifiables'],['incidents','Incidents et explications'],['transparency','Transparence du dossier']
];
export function assessCharacterTrust(input={}){
 const history=Array.isArray(input.history)?input.history:[], evidence=Array.isArray(input.evidence)?input.evidence:[];
 const contradictions=Number(input.contradictions||0), fieldVerified=Boolean(input.fieldVerified), membershipMonths=Number(input.membershipMonths||0);
 const repaid=history.filter(x=>x.status==='Remboursé').length, late=history.filter(x=>x.lateDays>0).length, regularized=history.filter(x=>x.regularized).length;
 const dimensions={
  relationship:{level:membershipMonths>=24?'Documenté':membershipMonths>0?'À consolider':'À vérifier',facts:[membershipMonths?`Adhésion documentée depuis ${membershipMonths} mois`:'Ancienneté d’adhésion non documentée']},
  repayment:{level:repaid>0&&late===0?'Favorable':history.length?'À examiner':'À vérifier',facts:[history.length?`${history.length} antécédent(s) de crédit disponible(s)`:'Aucun antécédent interne disponible',repaid?`${repaid} financement(s) remboursé(s)`:''] .filter(Boolean)},
  commitments:{level:late===0&&history.length?'Favorable':regularized?'Contextualisé':late?'Vigilance':'À vérifier',facts:[late?`${late} épisode(s) de retard à contextualiser`:'Aucun retard enregistré dans l’historique disponible',regularized?`${regularized} incident(s) régularisé(s)`:''].filter(Boolean)},
  consistency:{level:contradictions===0?'Cohérent':'À clarifier',facts:[contradictions===0?'Aucune contradiction majeure détectée':`${contradictions} contradiction(s) nécessitent une clarification`]},
  field:{level:fieldVerified?'Observé':'À vérifier',facts:[fieldVerified?'Activité vérifiée sur le terrain':'Vérification terrain à réaliser ou confirmer']},
  references:{level:input.referencesVerified>0?'Documenté':'À vérifier',facts:[input.referencesVerified>0?`${input.referencesVerified} référence(s) vérifiée(s)`:'Aucune référence vérifiée enregistrée']},
  incidents:{level:late===0?'Aucun incident majeur identifié':regularized?'Régularisé':'À examiner',facts:[late?`${late} incident(s) enregistré(s); conserver cause, preuve et issue`:'Aucun incident majeur dans les données disponibles']},
  transparency:{level:contradictions===0&&evidence.length>=3?'Suffisant':'À renforcer',facts:[`${evidence.length} élément(s) de preuve exploitable(s)`,contradictions?`${contradictions} écart(s) non résolu(s)`:'Déclarations globalement cohérentes avec les éléments disponibles']}
 };
 const verified=evidence.filter(x=>['documenté','documented','observé','observed','vérifié','verified','reconstitué','reconstructed'].includes(String(x.status||x.sourceType||'').toLowerCase())).length;
 const proofLevel=verified>=4&&fieldVerified?'Élevé':verified>=2?'Moyen':'À renforcer';
 const favorable=[]; const vigilance=[]; const unknown=[];
 Object.values(dimensions).forEach(d=>{const fact=d.facts[0]; if(['Favorable','Documenté','Cohérent','Observé','Suffisant','Aucun incident majeur identifié'].includes(d.level))favorable.push(fact); else if(['À clarifier','Vigilance','À examiner','Contextualisé','Régularisé'].includes(d.level))vigilance.push(fact); else unknown.push(fact);});
 return {proofLevel,dimensions,favorable,vigilance,unknown,humanDecisionRequired:true,automaticMoralJudgment:false};
}
