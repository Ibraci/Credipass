const G=[
['INCLUSCORE','Score de risque CREDIPASS sur 1000. Il synthétise des facteurs de crédit explicables; il ne prend jamais la décision à la place du comité.'],
['Confiance des données','Indicateur séparé du risque, sur 100. Il mesure la qualité, la provenance, la cohérence et le niveau de vérification des données utilisées.'],
['Soutenabilité','Capacité du membre à supporter une échéance sans déséquilibrer durablement son activité ou son ménage.'],
['Capacité de remboursement','Marge financière disponible pour honorer les échéances après charges et engagements existants.'],
['5C','Cadre d’analyse : Caractère, Capacité, Capital, Collatéraux et Conditions.'],
['Caractère & confiance','Appréciation fondée sur des faits vérifiables : historique, engagements, cohérence, terrain, références, incidents et coopération. Ce n’est pas une note de moralité.'],
['Collatéral','Garantie proposée pour sécuriser le crédit. Valeur déclarée, valeur expertisée et valeur retenue doivent rester distinctes.'],
['Provenance','Origine d’une donnée : Déclaré, Documenté, Observé, Historique institutionnel, Source externe autorisée ou Reconstitué.'],
['BIC','Information de bureau d’information sur le crédit. Dans CREDIPASS V1, la consultation peut être renseignée/importée avec date, source et preuve.'],
['PAR','Portefeuille à risque : encours associé aux échéances en retard selon la politique de l’institution.'],
['Ajourné','Décision qui reporte le dossier en attendant un complément, une vérification ou une condition définie.'],
['Passeport financier','Historique longitudinal du membre : demandes, décisions, crédits, paiements, incidents, régularisations, restructurations et clôtures.'],
['Politique de crédit','Ensemble versionné des règles applicables à un produit : éligibilité, limites, pièces, capacité, workflow et délégations.'],
['Produit de crédit','Configuration institutionnelle qui détermine notamment profil éligible, objet, montant, durée, périodicité, garanties, pièces, formulaire et politique.'],
['Structure','Unité organisationnelle de rattachement : siège, région/délégation, agence ou point de service.'],
['Zone','Périmètre territorial d’intervention autorisé. La zone est distincte de la structure administrative.'],
['Décentralisation','Organisation où agence et terminal peuvent poursuivre les opérations autorisées localement puis synchroniser de façon traçable avec le niveau central.'],
['Décision humaine','Principe CREDIPASS : les moteurs calculent, expliquent, simulent et recommandent; l’autorité habilitée décide.']
];
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
export function glossary(){return G.map(([term,definition])=>({term,definition}))}
export function explainDossier(d){if(!d)return 'Ouvrez un dossier pour que je puisse expliquer ses résultats.';const score=d.incluscore??'non calculé',conf=d.confidence??'non calculée',f=d.financial||{},disp=Number(f.disposableIncome??f.availableIncome??0);return `Ce dossier présente un INCLUSCORE de ${score}/1000 et une confiance des données de ${conf}/100. Ces deux indicateurs sont volontairement séparés : le premier décrit le risque de crédit selon la politique appliquée, le second la solidité des données utilisées. ${disp?`Le revenu disponible calculé est de ${Math.round(disp).toLocaleString('fr-FR')} FCFA. `:''}La décision finale appartient à l’autorité humaine habilitée. Pour auditer le résultat, consultez les données, leur provenance, les preuves, la version de politique et les facteurs favorables ou de vigilance du dossier.`}
export function askCredipass(question,{dossier=null}={}){const q=norm(question);if(!q.trim())return 'Posez-moi une question sur CREDIPASS, un terme métier, un score ou le dossier ouvert.';if(/score|incluscore|resultat|résultat|pourquoi/.test(q)&&dossier)return explainDossier(dossier);const hits=G.filter(([t,d])=>q.includes(norm(t))||norm(t).split(/\s+/).some(w=>w.length>4&&q.includes(w)));if(hits.length)return hits.slice(0,3).map(([t,d])=>`${t} — ${d}`).join('\n\n');if(/confiance/.test(q))return G.find(x=>x[0]==='Confiance des données')[1];if(/decision|decide|comite/.test(q))return G.find(x=>x[0]==='Décision humaine')[1];return `Je n’ai pas identifié précisément ce terme dans mon référentiel CREDIPASS. Reformulez avec le nom du concept, ou demandez par exemple : « Qu’est-ce que l’INCLUSCORE ? », « Explique la confiance des données », « Pourquoi ce score ? », « Qu’est-ce que le PAR ? ». Je n’invente pas de règle institutionnelle absente du référentiel.`}
