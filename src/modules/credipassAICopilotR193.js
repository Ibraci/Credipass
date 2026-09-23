import {fieldSummary} from './sfdFieldR193.js';
import {askCredipass} from './credipassAssistantR191.js';
const n=v=>Number(v)||0;
const txt=v=>String(v??'');
const lower=s=>txt(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
export function buildCopilotContext(db,d,user){
  if(!d?.application||!d?.member)return null;const field=fieldSummary(db,d.application.id),f=d.productForm?.data||{},allowedAudit=['AUDITEUR','ADMIN_SYSTEME','DIRECTION','CONFORMITE'].includes(user?.role);
  return {
    access:{login:user?.login,role:user?.role,institutionId:user?.institutionId,structureId:user?.structureId},
    member:{id:d.member.id,memberNo:d.member.memberNo,name:d.member.name,type:d.member.type,activity:d.member.activity,city:d.member.city,agency:d.member.agency},
    application:{id:d.application.id,product:d.application.product,purpose:d.application.purpose,requestedAmount:n(d.application.requestedAmount),durationMonths:n(d.application.durationMonths),periodicity:d.application.periodicity,status:d.application.status,policyVersion:d.application.policyVersion,agency:d.application.agency,institutionId:d.application.institutionId,structureId:d.application.structureId,zoneId:d.application.zoneId,ownerLogin:d.application.ownerLogin,assignedAgentLogin:d.application.assignedAgentLogin},
    scores:{incluscore:n(d.incluscore),confidence:n(d.confidence),financialCapacity:n(d.financial?.capacity),recommendationAmount:n(d.recommendation?.amount),installment:n(d.recommendation?.simulation?.installment),margin:n(d.recommendation?.simulation?.margin)},
    productForm:f,
    businessAnalysis:d.businessAnalysis||null,personalBudget:d.personalBudget||null,personalBalance:d.personalBalance||null,
    guarantees:(d.guarantees||[]).map(g=>({type:g.type,description:g.description,declaredValue:n(g.declaredValue),expertValue:n(g.expertValue),retainedValue:n(g.retainedValue),status:g.status})),
    policy:{checks:(d.policy?.items||[]).map(x=>({code:x.code,label:x.label,status:x.status,evidence:x.evidence})),field:field.policy},
    riskDimensions:(d.institutionalRisk||[]).map(x=>({dimension:x.dimension,rating:x.rating,evidence:x.evidence})),
    documents:(d.documents||[]).map(x=>({label:x.label,status:x.status,source:x.source,reference:x.reference})),
    visits:(d.visits||[]).map(x=>({at:x.at,activityObserved:x.activityObserved,observations:x.observations})),
    trust:{level:d.trust?.level,pos:n(d.trust?.pos),warn:n(d.trust?.warn),items:(d.trust?.items||[]).map(x=>({dimension:x.dimension,fact:x.fact,source:x.source,effect:x.effect,verified:x.verified}))},
    decisions:(d.decisions||[]).map(x=>({decision:x.decision,reason:x.reason,approvedAmount:n(x.approvedAmount),at:x.at})),
    field:{gaps:field.gaps,contradictions:field.contradictions,guarantee:field.guarantee},
    audit:allowedAudit?(db.audit||[]).filter(x=>x.applicationId===d.application.id).slice(0,50).map(x=>({at:x.at,action:x.action,actor:x.actor})):undefined
  };
}
function baseSummary(c){if(!c)return 'Ouvrez un dossier pour que je puisse l’expliquer.';const s=c.scores,f=c.field,p=c.application;let out=`Dossier ${p.id} — ${c.member.name}. Produit : ${p.product}. Montant demandé : ${p.requestedAmount.toLocaleString('fr-FR')} FCFA sur ${p.durationMonths} mois. INCLUSCORE : ${s.incluscore}/1000. Confiance des données : ${s.confidence}/100. Capacité calculée : ${s.financialCapacity.toLocaleString('fr-FR')} FCFA.`;if(f.contradictions.length)out+=` Points à vérifier : ${f.contradictions.join(' ')}`;if(f.gaps.length)out+=` Éléments manquants ou non vérifiés : ${f.gaps.slice(0,8).join(', ')}${f.gaps.length>8?'…':''}.`;out+=' Le score aide à l’analyse mais ne constitue pas une décision de crédit.';return out}
export function answerCopilotOffline(question,context){const q=lower(question),c=context;
  if(!q.trim())return 'Posez-moi une question sur CREDIPASS ou ouvrez un dossier pour une explication contextuelle.';
  if(/^(bonjour|bonsoir|salut|hello|hi|coucou)[ !?.]*$/.test(q))return c?`Bonjour 👋 Je suis l’Assistant CREDIPASS. Le dossier ${c.application.id} de ${c.member.name} est ouvert. Je peux expliquer son INCLUSCORE, la confiance des données, la capacité, les garanties, les contrôles, les pièces manquantes et préparer une synthèse pour le comité.`:'Bonjour 👋 Je suis l’Assistant CREDIPASS. Je peux expliquer les concepts du logiciel (INCLUSCORE, confiance des données, capacité, garanties, PAR, BIC, politiques) et, lorsqu’un dossier est ouvert, analyser son contexte sans prendre la décision à la place du comité.';
  if(/^(merci|merci beaucoup|d'accord|ok|okay)[ !?.]*$/.test(q))return 'Avec plaisir. Je peux poursuivre sur le score, la capacité, les garanties, les pièces, les contrôles ou la synthèse comité.';
  if(/qui es[- ]?tu|que peux[- ]?tu faire|aide|help/.test(q))return 'Je suis l’Assistant CREDIPASS. Je peux expliquer les termes métier, analyser le dossier ouvert, signaler les données manquantes ou incohérentes, expliquer le score et préparer une synthèse. Je n’accorde ni ne refuse un crédit : la décision reste humaine.';
  if(!c){const general=askCredipass(question,{dossier:null});return general;}
  if(/resume|résume|explique.*dossier|dossier.*explique|synthese|synthèse/.test(q))return baseSummary(c);
  if(/score|incluscore|pourquoi.*[0-9]|facteur/.test(q)){const s=c.scores,t=c.trust;return `INCLUSCORE ${s.incluscore}/1000. Les éléments visibles dans ce dossier sont : capacité ${s.financialCapacity.toLocaleString('fr-FR')} FCFA, ${t.pos} fait(s) favorable(s) et ${t.warn} vigilance(s), ${c.guarantees.length} garantie(s), ${c.riskDimensions.length} dimension(s) de risque renseignée(s). La confiance ${s.confidence}/100 mesure la solidité des données et doit être lue séparément du risque. Consultez les données source et la politique versionnée pour auditer chaque facteur.`}
  if(/manque|piece|pièce|complet|completer|compléter/.test(q))return c.field.gaps.length?`À compléter : ${c.field.gaps.join(' · ')}.`:'Aucun manque n’est détecté dans les contrôles structurés disponibles.';
  if(/incoher|incohér|contrad|anomal/.test(q))return c.field.contradictions.length?`Contradictions ou vigilances détectées : ${c.field.contradictions.join(' · ')}.`:'Aucune contradiction structurée n’est détectée par le moteur local. Cela ne remplace pas la vérification humaine des pièces et de la visite terrain.';
  if(/garantie|couverture|collateral|collatéral/.test(q)){const g=c.field.guarantee,req=c.application.requestedAmount;return `Garanties retenues : ${g.retained.toLocaleString('fr-FR')} FCFA pour une demande de ${req.toLocaleString('fr-FR')} FCFA, soit ${(g.ratio*100).toFixed(0)} % de couverture. La conformité dépend du minimum paramétré dans la politique institutionnelle.`}
  if(/capacite|capacité|mensual|quotite|quotité|soutenab/.test(q)){const s=c.scores,f=c.productForm;return `Capacité calculée : ${s.financialCapacity.toLocaleString('fr-FR')} FCFA. Échéance simulée : ${s.installment.toLocaleString('fr-FR')} FCFA. Marge après échéance : ${s.margin.toLocaleString('fr-FR')} FCFA.${c.application.product==='Crédit salarié'?` Quotité cessible renseignée : ${n(f.assignableQuota).toLocaleString('fr-FR')} FCFA; remboursement mensuel : ${n(f.monthlyRepayment).toLocaleString('fr-FR')} FCFA.`:''}`}
  if(/politique|regle|règle|conform/.test(q)){const checks=[...(c.policy.checks||[]),...(c.policy.field?.checks||[])];return checks.length?`Contrôles applicables : ${checks.map(x=>`${x.label} = ${x.status}`).join(' · ')}. Version de politique du dossier : ${c.application.policyVersion||'non renseignée'}.`:'Aucun contrôle de politique n’est disponible dans ce contexte.'}
  if(/comite|comité|decision|décision/.test(q))return `${baseSummary(c)} Pour le comité, vérifiez en priorité les contrôles bloquants, les pièces non vérifiées, les contradictions, la capacité et la traçabilité. La décision finale reste humaine.`;
  if(/risque/.test(q))return c.riskDimensions.length?`Dimensions de risque renseignées : ${c.riskDimensions.map(x=>`${x.dimension} : ${x.rating}`).join(' · ')}.`:'La grille institutionnelle de risque n’est pas encore entièrement renseignée.';
  return `${baseSummary(c)} Vous pouvez me demander : « pourquoi ce score ? », « que manque-t-il ? », « quelles incohérences ? », « explique les garanties », « explique la capacité » ou « résume pour le comité ».`;
}
export async function askCopilot(question,{context,preferRemote=true}={}){
  if(preferRemote&&globalThis.navigator?.onLine!==false){try{const r=await fetch('/api/ai/copilot',{method:'POST',headers:{'content-type':'application/json'},credentials:'include',body:JSON.stringify({question,context})});const j=await r.json();if(r.ok&&j.answer)return {answer:j.answer,mode:j.mode||'IA_CONNECTÉE',provider:j.provider||null};}catch{}}
  return {answer:answerCopilotOffline(question,context),mode:'ASSISTANT_LOCAL_SÉCURISÉ',provider:null};
}
