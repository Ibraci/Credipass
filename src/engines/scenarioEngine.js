export const DEMO_SCENARIO_ENGINE_VERSION = '3.1.0';
export const DEMO_SCENARIO_IDS = Object.freeze(['baseline','mamadou','cooperative']);

export const DEMO_OFFLINE_ASSETS = Object.freeze([
  './index.html','./manifest.webmanifest','./sw.js','./src/app.js','./src/i18n.js','./src/styles.css',
  './src/fixtures/sample-aissata.js','./src/fixtures/sample-mamadou.js','./src/fixtures/sample-cooperative.js','./src/data/scenarios.js',
  './src/engines/scenarioEngine.js','./src/engines/winnerScenarioEngine.js','./src/engines/incluscoreEngine.js','./src/engines/creditSimulationEngine.js',
  './src/engines/recommendationOrchestrator.js','./src/engines/financialPassportEngine.js',
  './src/engines/coopScoreEngine.js','./src/config/coopScorePolicies.js',
  './src/engines/groupFinancingEngine.js','./src/config/groupFinancingPolicies.js',
  './src/data/post-financing-scenarios.js','./src/engines/earlyWarningEngine.js','./src/engines/postFinancingMonitoringEngine.js','./src/config/earlyWarningPolicies.js',
  './src/fixtures/portfolio-sample.js','./src/engines/portfolioRiskEngine.js','./src/config/portfolioRiskPolicies.js',
  './src/data/financing-documents.js','./src/engines/documentIntelligenceEngine.js','./src/engines/financingFileEngine.js','./src/config/financingFilePolicies.js',
  './src/fixtures/trust-verification-sample.js','./src/engines/trustVerificationEngine.js','./src/config/trustVerificationPolicies.js',
  './src/fixtures/field-operations-sample.js','./src/engines/offlineSyncEngine.js','./src/engines/fieldOperationsEngine.js','./src/config/offlineSyncPolicies.js',
  './src/fixtures/communication-sample.js','./src/engines/communicationEngine.js','./src/config/communicationPolicies.js',
  './src/fixtures/financial-products-sample.js','./src/config/productMatchingPolicies.js','./src/config/financialLearningCatalog.js',
  './src/engines/productMatchingEngine.js','./src/engines/financialLearningEngine.js'
]);

const clone = value => JSON.parse(JSON.stringify(value));
const unique = values => [...new Set(values.filter(Boolean))];

function stableHash(value) {
  const input = typeof value === 'string' ? value : JSON.stringify(value);
  let hash = 2166136261;
  for (let i=0;i<input.length;i++) { hash ^= input.charCodeAt(i); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0).toString(16).toUpperCase().padStart(8,'0');
}


const WINNER_BASELINE_STEPS = Object.freeze([
  { id:'winner-cashflow', view:'cashflow', titleFr:'1. Réalité économique', titleEn:'1. Economic reality', textFr:'Les flux d’Aïssata sont reconstruits prudemment à partir de preuves locales sans double comptage.', textEn:'Aïssata’s cashflows are prudently reconstructed from local evidence without double counting.' },
  { id:'winner-confidence', view:'confidence', titleFr:'2. Confiance des données', titleEn:'2. Data confidence', textFr:'La confiance dans les données reste séparée du risque et rend les incertitudes visibles.', textEn:'Data confidence remains separate from risk and keeps uncertainty visible.' },
  { id:'winner-score', view:'incluscore', titleFr:'3. INCLUSCORE', titleEn:'3. INCLUSCORE', textFr:'Le score déterministe synthétise les axes autorisés sans prendre la décision à la place du comité.', textEn:'The deterministic score summarizes permitted axes without deciding for the committee.' },
  { id:'winner-why', view:'incluscore', titleFr:'4. Pourquoi ?', titleEn:'4. Why?', textFr:'Sous-scores, facteurs, données utilisées, exclusions et limites expliquent le résultat.', textEn:'Subscores, factors, used data, exclusions and limitations explain the result.' },
  { id:'winner-improve', view:'simulation', titleFr:'5. Améliorer mes chances', titleEn:'5. Improve my chances', textFr:'Un scénario à 300 000 FCFA est recalculé par le moteur de financement responsable, sans promettre une acceptation ni modifier artificiellement INCLUSCORE.', textEn:'A XOF 300,000 scenario is recalculated by the responsible financing engine without promising approval or artificially changing INCLUSCORE.' },
  { id:'winner-recommendation', view:'recommendation', titleFr:'6. Recommandation', titleEn:'6. Recommendation', textFr:'La recommandation institutionnelle expose montant, durée, conditions et éventuelles contradictions.', textEn:'The institutional recommendation exposes amount, duration, conditions and any conflicts.' },
  { id:'winner-human', view:'workflow', titleFr:'7. Décision humaine', titleEn:'7. Human decision', textFr:'L’agent et le comité restent responsables de la décision et de sa justification.', textEn:'The agent and committee remain responsible for the decision and rationale.' },
  { id:'winner-report', view:'reporting', titleFr:'8. Rapport comité', titleEn:'8. Committee report', textFr:'Le rapport restitue les éléments traçables et peut être imprimé ou enregistré en PDF par le navigateur.', textEn:'The report returns traceable elements and can be printed or saved as PDF by the browser.' }
]);

const CATALOG = Object.freeze({
  baseline:Object.freeze({
    id:'baseline', actor:'Aïssata Traoré', type:'individual-informal-trade', durationMinutes:6,
    titleFr:'Aïssata — rendre visible une activité informelle',
    titleEn:'Aïssata — make an informal activity visible',
    promiseFr:'Des preuves locales deviennent une recommandation expliquée, jamais une décision automatique.',
    promiseEn:'Local evidence becomes an explained recommendation, never an automatic decision.',
    steps:Object.freeze([
      { id:'problem', view:'profile', titleFr:'1. Le problème', titleEn:'1. The problem', textFr:'Aïssata demande 350 000 FCFA sans bulletin de salaire ni historique bancaire classique.', textEn:'Aïssata requests XOF 350,000 without a payslip or conventional banking history.' },
      { id:'evidence', view:'evidence', titleFr:'2. Les preuves', titleEn:'2. The evidence', textFr:'Carnets de ventes, reçus fournisseurs, cotisations, épargne, Mobile Money consenti et observation terrain sont qualifiés séparément.', textEn:'Sales notebooks, supplier receipts, contributions, savings, consented Mobile Money and field observation are assessed separately.' },
      { id:'field', view:'field', titleFr:'3. Le terrain hors connexion', titleEn:'3. Offline fieldwork', textFr:'L’agent collecte sans réseau. Les opérations sont versionnées, mises en file et synchronisées sans écrasement silencieux.', textEn:'The agent collects without a network. Operations are versioned, queued and synchronized without silent overwrites.' },
      { id:'verification', view:'trust', titleFr:'3. Les contrôles croisés', titleEn:'3. Cross-checks', textFr:'Documents, références, dates, identités et montants sont rapprochés. Chaque anomalie devient une piste de vérification humaine, jamais un verdict de fraude.', textEn:'Documents, references, dates, identities and amounts are cross-checked. Each anomaly becomes a human verification lead, never a fraud verdict.' },
      { id:'cashflow', view:'cashflow', titleFr:'4. La reconstruction', titleEn:'4. Reconstruction', textFr:'Les flux directs sont reconstruits prudemment. Les preuves de corroboration ne sont pas comptées deux fois.', textEn:'Direct cashflows are reconstructed prudently. Corroborating evidence is not double-counted.' },
      { id:'confidence', view:'confidence', titleFr:'5. La confiance', titleEn:'5. Confidence', textFr:'La qualité des données est mesurée séparément du risque et les incertitudes restent visibles.', textEn:'Data quality is measured separately from risk and uncertainty remains visible.' },
      { id:'score', view:'incluscore', titleFr:'6. INCLUSCORE', titleEn:'6. INCLUSCORE', textFr:'Un indice déterministe explique chaque sous-score, les données utilisées et les facteurs exclus.', textEn:'A deterministic index explains every sub-score, used data and excluded factors.' },
      { id:'simulation', view:'simulation', titleFr:'7. Le financement soutenable', titleEn:'7. Sustainable financing', textFr:'Le montant et l’échéancier sont bornés par la capacité réelle et testés sous plusieurs chocs.', textEn:'Principal and repayment schedule are bounded by actual capacity and stress-tested.' },
      { id:'matching', view:'matching', titleFr:'8. Le produit compatible', titleEn:'8. Compatible product', textFr:'CREDIPASS compare plusieurs produits, explique pourquoi ils conviennent ou non et associe un apprentissage ciblé sans créer de décision de crédit.', textEn:'CREDIPASS compares several products, explains why they fit or not and attaches targeted learning without creating a credit decision.' },
      { id:'recommendation', view:'recommendation', titleFr:'8. La recommandation', titleEn:'8. Recommendation', textFr:'Les moteurs convergent ou signalent leurs contradictions avant transmission à l’institution.', textEn:'Engines reconcile their outputs or expose contradictions before institutional review.' },
      { id:'human', view:'workflow', titleFr:'9. La décision humaine', titleEn:'9. Human decision', textFr:'L’analyste et le comité restent responsables de la décision, de la justification et du recours.', textEn:'The analyst and committee remain responsible for the decision, rationale and appeal.' },
      { id:'passport', view:'passport', titleFr:'10. Le passeport', titleEn:'10. Passport', textFr:'Le passeport distingue confiance, score, recommandation et décision humaine, avec partage limité et révocable.', textEn:'The passport separates confidence, score, recommendation and human decision, with limited revocable sharing.' },
      { id:'monitoring', view:'monitoring', titleFr:'11. Le suivi préventif', titleEn:'11. Preventive monitoring', textFr:'Après financement, les baisses de flux, retards, cotisations et réserves déclenchent un accompagnement humain — jamais une sanction automatique.', textEn:'After financing, cashflow declines, arrears, contributions and reserves trigger human support — never an automatic sanction.' },
      { id:'communication', view:'communication', titleFr:'12. La communication responsable', titleEn:'12. Responsible communication', textFr:'Les rappels sont bilingues, consentis, limités et dépourvus de données sensibles sur SMS ou courriel.', textEn:'Reminders are bilingual, consented, rate-limited and stripped of sensitive data on SMS or email.' },
      { id:'portfolio', view:'portfolio', titleFr:'12. La vision portefeuille', titleEn:'12. Portfolio view', textFr:'La direction des risques voit les concentrations, PAR et stress tests sans transformer un indicateur agrégé en sanction individuelle.', textEn:'Risk management sees concentrations, PAR and stress tests without turning an aggregate indicator into an individual sanction.' }
    ])
  }),
  mamadou:Object.freeze({
    id:'mamadou', actor:'Mamadou Sidibé', type:'individual-agriculture', durationMinutes:4,
    titleFr:'Mamadou — financer le cycle agricole',
    titleEn:'Mamadou — finance the agricultural cycle',
    promiseFr:'Un remboursement saisonnier remplace la mensualité uniforme inadaptée.',
    promiseEn:'A seasonal repayment plan replaces an unsuitable flat monthly installment.',
    steps:Object.freeze([
      { id:'problem', view:'profile', titleFr:'1. Le cycle économique', titleEn:'1. Economic cycle', textFr:'Les revenus de Mamadou dépendent des récoltes alors que ses dépenses d’intrants arrivent avant les ventes.', textEn:'Mamadou earns after harvest while input expenses occur before sales.' },
      { id:'proof', view:'evidence', titleFr:'2. Les preuves agricoles', titleEn:'2. Agricultural evidence', textFr:'Les historiques de ventes, équipements observés, cotisations et épargne documentent la continuité de l’activité.', textEn:'Sales history, observed equipment, contributions and savings document business continuity.' },
      { id:'field', view:'field', titleFr:'3. La mission terrain', titleEn:'3. Field mission', textFr:'La visite agricole est affectée, exécutée hors connexion et synchronisée après contrôle de qualité.', textEn:'The agricultural visit is assigned, completed offline and synchronized after quality control.' },
      { id:'season', view:'seasonal', titleFr:'3. La saisonnalité', titleEn:'3. Seasonality', textFr:'Le calendrier agricole versionné identifie les mois creux, les pics et la période de grâce.', textEn:'The versioned agricultural calendar identifies low months, peaks and grace period.' },
      { id:'matching', view:'matching', titleFr:'4. Le produit agricole adapté', titleEn:'4. Suitable agricultural product', textFr:'Le matching privilégie les produits qui acceptent la saisonnalité et explique les écarts avec les autres offres synthétiques.', textEn:'Matching prioritizes products that support seasonality and explains gaps with other synthetic offers.' },
      { id:'stress', view:'simulation', titleFr:'4. Les stress tests', titleEn:'4. Stress tests', textFr:'Une baisse de rendement et un décalage de récolte testent la résistance du financement.', textEn:'A yield decline and delayed harvest test financing resilience.' },
      { id:'decision', view:'recommendation', titleFr:'5. La proposition responsable', titleEn:'5. Responsible proposal', textFr:'CREDIPASS recommande une structure soutenable, soumise à validation de Mamadou et de l’institution.', textEn:'CREDIPASS recommends a sustainable structure subject to validation by Mamadou and the institution.' },
      { id:'monitoring', view:'monitoring', titleFr:'6. Le suivi saisonnier', titleEn:'6. Seasonal monitoring', textFr:'Les revenus réels sont comparés au calendrier agricole attendu afin d’éviter de confondre saison creuse et fragilité anormale.', textEn:'Actual income is compared with the expected agricultural calendar to avoid confusing a low season with abnormal distress.' },
      { id:'communication', view:'communication', titleFr:'7. Les rappels adaptés', titleEn:'7. Adapted reminders', textFr:'Les rappels respectent les préférences, les heures calmes et renvoient vers le calendrier sécurisé.', textEn:'Reminders respect preferences and quiet hours and point to the secure schedule.' }
    ])
  }),
  cooperative:Object.freeze({
    id:'cooperative', actor:'Coopérative Benkadi de Koutiala', type:'collective', durationMinutes:4,
    titleFr:'Benkadi — comprendre un dossier collectif',
    titleEn:'Benkadi — understand a collective file',
    promiseFr:'La capacité du groupe est documentée sans transférer automatiquement le risque à chaque membre.',
    promiseEn:'Group capacity is documented without automatically transferring risk to each member.',
    steps:Object.freeze([
      { id:'identity', view:'profile', titleFr:'1. Le groupement', titleEn:'1. The group', textFr:'La coopérative regroupe 48 membres et sollicite un équipement collectif.', textEn:'The cooperative has 48 members and requests shared equipment financing.' },
      { id:'proof', view:'evidence', titleFr:'2. La preuve collective', titleEn:'2. Collective evidence', textFr:'Ventes collectives, cotisations, épargne, gouvernance et historique de remboursement sont rapprochés.', textEn:'Collective sales, contributions, savings, governance and repayment history are reconciled.' },
      { id:'field', view:'field', titleFr:'3. La vérification terrain', titleEn:'3. Field verification', textFr:'Le registre, les réunions et les cotisations sont vérifiés lors d’une mission tracée, même hors connexion.', textEn:'The register, meetings and contributions are verified through a traceable mission, even offline.' },
      { id:'capacity', view:'health', titleFr:'3. La capacité du groupe', titleEn:'3. Group capacity', textFr:'Les charges, dettes et réserves du groupe sont analysées sans masquer les incertitudes.', textEn:'Group expenses, debts and reserves are analysed without hiding uncertainty.' },
      { id:'coopscore', view:'coopscore', titleFr:'4. Le COOP-SCORE explicable', titleEn:'4. Explainable COOP-SCORE', textFr:'Sept axes séparent gouvernance, cotisations, remboursement, capacité, épargne, stabilité et concentration des risques.', textEn:'Seven axes separate governance, contributions, repayment, capacity, savings, member stability and risk concentration.' },
      { id:'matching', view:'matching', titleFr:'5. Le produit collectif compatible', titleEn:'5. Compatible collective product', textFr:'Le produit collectif vérifie le COOP-SCORE, la capacité, le type de demandeur et l’objet du financement avant toute discussion humaine.', textEn:'The collective product checks COOP-SCORE, capacity, applicant type and financing purpose before any human discussion.' },
      { id:'group-financing', view:'groupfinancing', titleFr:'5. Le financement collectif protégé', titleEn:'5. Protected group financing', textFr:'Les consentements, responsabilités plafonnées, tranches et usages des fonds sont tracés sans dette automatique des membres.', textEn:'Consents, capped responsibilities, tranches and fund use are traced without automatic member debt.' },
      { id:'monitoring', view:'monitoring', titleFr:'6. Le suivi collectif', titleEn:'6. Collective monitoring', textFr:'Après décaissement, les ventes, cotisations, réserves et remboursements collectifs sont suivis sans transférer automatiquement le risque aux membres.', textEn:'After disbursement, collective sales, contributions, reserves and repayments are monitored without automatically transferring risk to members.' },
      { id:'communication', view:'communication', titleFr:'7. La communication du groupe', titleEn:'7. Group communication', textFr:'Les notifications distinguent responsables, agents et membres concernés sans diffuser de données collectives sensibles.', textEn:'Notifications distinguish officers, agents and relevant members without disclosing sensitive group data.' },
      { id:'rules', view:'policy', titleFr:'7. Les règles institutionnelles', titleEn:'7. Institutional rules', textFr:'Les plafonds, pièces requises et circuits de validation sont versionnés par institution.', textEn:'Limits, required evidence and approval workflows are versioned per institution.' },
      { id:'decision', view:'recommendation', titleFr:'8. La décision collective responsable', titleEn:'8. Responsible collective decision', textFr:'La recommandation distingue capacité collective, gouvernance et décision humaine finale.', textEn:'The recommendation separates collective capacity, governance and final human decision.' }
    ])
  })
});

export function getDemoScenarioCatalog() { return clone(CATALOG); }

function buildCustomDefinition(data) {
  const name = data?.person?.name || 'Demandeur';
  const amount = Number(data?.creditRequest?.amount || data?.profile?.requestedAmount || 0);
  const amountFr = new Intl.NumberFormat('fr-FR').format(amount);
  const base = clone(CATALOG.baseline);
  return {
    ...base,
    id:'custom', actor:name,
    titleFr:`${name} — analyse du dossier`, titleEn:`${name} — case analysis`,
    promiseFr:'Un dossier saisi est analysé avec les mêmes moteurs, règles et garde-fous que les scénarios de référence.',
    promiseEn:'An entered case is analysed with the same engines, rules and safeguards as reference scenarios.',
    steps:base.steps.map((step,index) => index === 0 ? {
      ...step,
      textFr:`${name} demande ${amountFr} FCFA. Le dossier est analysé à partir des informations et preuves saisies, sans supposer un historique bancaire classique.`,
      textEn:`${name} requests XOF ${amount}. The case is analysed from entered information and evidence without assuming conventional banking history.`
    } : step)
  };
}

export function createScenarioJourney(inputs, options={}) {
  if (!inputs?.data || !inputs?.quality || !inputs?.incluscore || !inputs?.health || !inputs?.debt || !inputs?.simulation || !inputs?.recommendation) throw new TypeError('complete engine results are required');
  const scenarioId = options.scenarioId || inputs.data.scenarioId || 'baseline';
  const definition = scenarioId === 'custom' ? buildCustomDefinition(inputs.data) : (CATALOG[scenarioId] || CATALOG.baseline);
  const policyId = options.policyId || inputs.policyEvaluation?.policy?.id || inputs.simulation?.policy?.id || 'balanced';
  const stepIndex = Math.max(0, Math.min(definition.steps.length - 1, Number(options.stepIndex || 0)));
  const engineVersions = {
    confidence:inputs.quality.engineVersion,
    incluscore:inputs.incluscore.engineVersion,
    health:inputs.health.engineVersion,
    debt:inputs.debt.engineVersion,
    simulation:inputs.simulation.engineVersion,
    policy:inputs.policyEvaluation?.engineVersion || null,
    orchestrator:inputs.recommendation.engineVersion || inputs.recommendation.versions?.orchestrator || null,
    coopScore:inputs.coopScore?.engineVersion || null,
    groupFinancing:inputs.groupFinancing?.engineVersion || null,
    monitoring:inputs.monitoring?.engineVersion || null,
    earlyWarning:inputs.monitoring?.earlyWarning?.engineVersion || null
  };
  const metrics = {
    dataConfidence:inputs.quality.confidence,
    incluscore:inputs.incluscore.score,
    financialHealth:inputs.health.score,
    overIndebtednessRisk:inputs.debt.overIndebtedness.riskScore,
    requestedAmount:inputs.data.creditRequest?.amount || inputs.data.profile.requestedAmount,
    proposedPrincipal:inputs.recommendation.proposedFinancing.principal,
    recommendationCode:inputs.recommendation.recommendationCode,
    scheduleType:inputs.simulation.recommended.scheduleType,
    coopScore:inputs.coopScore?.score ?? null,
    coopScoreBand:inputs.coopScore?.publishedBand ?? null,
    groupFinancingStatus:inputs.groupFinancing?.status ?? null,
    consentCoverage:inputs.groupFinancing?.consent?.coverage ?? null,
    earlyWarningRisk:inputs.monitoring?.earlyWarning?.riskScore ?? null,
    earlyWarningBand:inputs.monitoring?.earlyWarning?.band ?? null
  };
  const fingerprintPayload = { scenarioId, policyId, personId:inputs.data.person.id, metrics, engineVersions, steps:definition.steps.map(x=>[x.id,x.view]) };
  const fingerprint = stableHash(fingerprintPayload);
  const journeyId = `DEMO-${scenarioId.toUpperCase()}-${fingerprint}`;
  const issues = [];
  if (inputs.quality.confidence < 50) issues.push('limited-data-confidence');
  if (!inputs.data.evidence?.length) issues.push('no-evidence');
  if (!inputs.simulation.selectedSchedule?.length && inputs.recommendation.proposedFinancing.principal > 0) issues.push('missing-repayment-schedule');
  const coop = inputs.data.cooperativeProfile || null;
  return {
    engineVersion:DEMO_SCENARIO_ENGINE_VERSION,
    journeyId,
    scenarioId,
    policyId,
    actor:definition.actor,
    type:definition.type,
    title:{ fr:definition.titleFr, en:definition.titleEn },
    promise:{ fr:definition.promiseFr, en:definition.promiseEn },
    durationMinutes:definition.durationMinutes,
    steps:clone(definition.steps),
    currentStepIndex:stepIndex,
    currentStep:clone(definition.steps[stepIndex]),
    progressPercent:Math.round(((stepIndex + 1) / definition.steps.length) * 100),
    metrics,
    cooperative:coop ? {
      memberCount:coop.memberCount,
      womenShare:coop.womenShare,
      youthShare:coop.youthShare,
      contributionDiscipline:coop.monthlyContributionDiscipline,
      governanceDocumentsCurrent:coop.governanceDocumentsCurrent,
      internalLoanRepaymentRate:coop.internalLoanRepaymentRate,
      concentrationRisk:coop.concentrationRisk,
      coopScore:inputs.coopScore?.score ?? null,
      coopScoreBand:inputs.coopScore?.publishedBand ?? null,
      coopScoreConfidence:inputs.coopScore?.confidence?.confidence ?? null,
      memberProtection:inputs.coopScore?.safeguards || null,
      groupFinancingStatus:inputs.groupFinancing?.status ?? null,
      consentCoverage:inputs.groupFinancing?.consent?.coverage ?? null,
      guaranteeCoverage:inputs.groupFinancing?.guarantee?.coverage ?? null,
      earlyWarningRisk:inputs.monitoring?.earlyWarning?.riskScore ?? null,
      earlyWarningBand:inputs.monitoring?.earlyWarning?.band ?? null
    } : null,
    offline:{ requiredAssets:[...DEMO_OFFLINE_ASSETS], packagedAssetCount:DEMO_OFFLINE_ASSETS.length, externalDependencyRequired:false, resetAvailable:true },
    reproducibility:{ deterministic:true, fingerprint, sourceDate:'2026-08-06', sameInputsSameReference:true, policyVersion:inputs.policyEvaluation?.policy?.version || inputs.simulation?.policy?.version || null },
    validation:{ ready:issues.length===0, issues, humanDecisionRequired:true, automaticDecisionAllowed:false, syntheticData:true },
    versions:engineVersions,
    safeguards:[
      'synthetic-demo-data-clearly-labelled',
      'same-inputs-same-output',
      'no-external-ai-required',
      'offline-assets-packaged',
      'human-decision-remains-final',
      'reset-does-not-alter-engine-rules'
    ]
  };
}

export function createShowcaseJourney(inputs, options={}) {
  const base = createScenarioJourney(inputs, options);
  if (base.scenarioId !== 'baseline') return base;
  const stepIndex = Math.max(0, Math.min(WINNER_BASELINE_STEPS.length - 1, Number(options.stepIndex || 0)));
  const steps = clone(WINNER_BASELINE_STEPS);
  const fingerprint = stableHash({ base:base.reproducibility.fingerprint, mode:'winner-p0d2', steps:steps.map(x=>[x.id,x.view]) });
  return {
    ...base,
    engineVersion:`${DEMO_SCENARIO_ENGINE_VERSION}+winner.1`,
    journeyId:`DEMO-WINNER-BASELINE-${fingerprint}`,
    durationMinutes:4,
    title:{ fr:'Aïssata — analyse du dossier', en:'Aïssata — case analysis' },
    promise:{ fr:'De la réalité économique à une décision humaine explicable en moins de quatre minutes.', en:'From economic reality to an explainable human decision in under four minutes.' },
    steps,
    currentStepIndex:stepIndex,
    currentStep:clone(steps[stepIndex]),
    progressPercent:Math.round(((stepIndex + 1) / steps.length) * 100),
    reproducibility:{ ...base.reproducibility, fingerprint, winnerLayerVersion:'P0-D2-R1' }
  };
}

export function createScenarioResetCertificate(journey, options={}) {
  if (!journey?.journeyId) throw new TypeError('demo journey is required');
  const resetAt = options.resetAt || '2026-08-06T18:00:00.000Z';
  const resetSequence = Math.max(1, Number(options.resetSequence || 1));
  const payload = { journeyId:journey.journeyId, scenarioId:journey.scenarioId, policyId:journey.policyId, fingerprint:journey.reproducibility.fingerprint, resetAt, resetSequence, engineVersion:DEMO_SCENARIO_ENGINE_VERSION };
  return {
    certificateId:`RESET-${stableHash(payload)}`,
    ...payload,
    status:'certified-reset',
    clearedScopes:['workflow','decision','appeal','passport-share','progression-tracking','post-financing-monitoring','trust-verification-dispositions','field-operations','sync-queue','communication-outbox','notification-state','audit'],
    retainedScopes:['scenario-master-data','engine-rules','policy-version','reproducibility-fingerprint'],
    deterministic:true
  };
}

export function validateDemoJourney(journey) {
  if (!journey || typeof journey !== 'object') throw new TypeError('journey is required');
  if (!journey.journeyId || !journey.scenarioId) throw new TypeError('journey identity is required');
  if (!Array.isArray(journey.steps) || journey.steps.length < 3) throw new RangeError('a jury journey must contain at least three steps');
  if (!journey.steps.every(step => step.id && step.view && step.titleFr && step.titleEn)) throw new TypeError('every step must be bilingual and linked to a view');
  if (journey.validation.automaticDecisionAllowed !== false || journey.validation.humanDecisionRequired !== true) throw new Error('human control safeguards are invalid');
  if (journey.offline.externalDependencyRequired !== false) throw new Error('demo requires an external dependency');
  return true;
}

export function nextDemoStep(journey, direction=1) {
  validateDemoJourney(journey);
  const nextIndex = Math.max(0, Math.min(journey.steps.length - 1, journey.currentStepIndex + Number(direction || 0)));
  return { ...journey, currentStepIndex:nextIndex, currentStep:clone(journey.steps[nextIndex]), progressPercent:Math.round(((nextIndex+1)/journey.steps.length)*100) };
}
