export const CREDIT_WORKFLOW_ENGINE_VERSION = '1.6.0';

const STAGES = [
  'submitted', 'assigned', 'analystReview', 'committeeReview',
  'waitingEvidence', 'secondReview', 'decisionReady', 'communicated', 'closed'
];

const clone = value => JSON.parse(JSON.stringify(value));
const now = value => value || new Date().toISOString();
const stableId = parts => {
  const text = parts.map(value => String(value ?? '')).join('|');
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `CPW-${(hash >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;
};

function stageRows(currentStage) {
  const currentIndex = STAGES.indexOf(currentStage);
  return STAGES.map((id, index) => ({
    id,
    status: index < currentIndex ? 'completed' : index === currentIndex ? 'current' : 'pending'
  }));
}

function priorityFrom({ recommendation, debt, policyEvaluation }) {
  if (debt?.overIndebtedness?.band === 'critical' || policyEvaluation?.summary?.blockingFailures > 0) return 'critical';
  if (['humanReview', 'toComplete', 'improvement'].includes(recommendation?.recommendationCode)) return 'high';
  if (recommendation?.conflicts?.length || recommendation?.recommendationCode === 'conditional') return 'medium';
  return 'normal';
}

export function createCreditWorkflow(inputs = {}, options = {}) {
  const { data, recommendation, debt, policyEvaluation } = inputs;
  if (!data?.person?.id) throw new TypeError('data.person.id is required');
  if (!recommendation?.referenceId) throw new TypeError('recommendation.referenceId is required');

  const createdAt = now(options.createdAt || '2026-08-06T16:00:00.000Z');
  const priority = priorityFrom({ recommendation, debt, policyEvaluation });
  const secondReviewRequired = Boolean(
    recommendation.humanReview?.secondReviewRequired ||
    priority === 'critical' ||
    recommendation.blockingIssues?.length
  );
  const caseId = stableId([data.person.id, recommendation.referenceId, policyEvaluation?.policy?.version]);
  const currentStage = 'submitted';

  return {
    caseId,
    engineVersion: CREDIT_WORKFLOW_ENGINE_VERSION,
    recommendationReference: recommendation.referenceId,
    personId: data.person.id,
    personName: data.person.name,
    institutionId: policyEvaluation?.policy?.institutionId || 'DEMO-INSTITUTION',
    policyVersion: policyEvaluation?.policy?.version || 'unknown',
    status: 'open',
    priority,
    currentStage,
    stages: stageRows(currentStage),
    assignedTo: null,
    assignedRole: priority === 'critical' ? 'seniorAnalyst' : 'creditAnalyst',
    secondReviewRequired,
    sla: {
      totalHours: priority === 'critical' ? 24 : priority === 'high' ? 36 : 48,
      analystHours: priority === 'critical' ? 6 : 12,
      committeeHours: priority === 'critical' ? 8 : 16
    },
    prerequisites: {
      recommendationRead: false,
      evidenceReviewed: false,
      debtReviewed: false,
      policyReviewed: false
    },
    latestDecisionId: null,
    latestAppealId: null,
    revision: 1,
    createdAt,
    updatedAt: createdAt,
    events: [{
      id: `${caseId}-EV-001`,
      type: 'case-submitted',
      actor: { id: 'system', name: 'CREDIPASS', role: 'system' },
      at: createdAt,
      fromStage: null,
      toStage: 'submitted',
      reason: 'Initial case created from an orchestrated recommendation.'
    }],
    safeguards: {
      automaticDecisionAllowed: false,
      assignmentRequired: true,
      analystReviewRequired: true,
      committeeReviewRequired: true,
      secondReviewRequired,
      reasonRequiredForReturn: true,
      immutableHistory: true
    }
  };
}

const roleAllowed = (role, allowed) => allowed.includes(role);

function appendEvent(workflow, type, actor, fromStage, toStage, payload = {}, at) {
  const next = clone(workflow);
  const eventAt = now(at);
  next.events.push({
    id: `${next.caseId}-EV-${String(next.events.length + 1).padStart(3, '0')}`,
    type,
    actor: clone(actor),
    at: eventAt,
    fromStage,
    toStage,
    reason: payload.reason || null,
    payload: clone(payload)
  });
  next.currentStage = toStage;
  next.stages = stageRows(toStage);
  next.updatedAt = eventAt;
  return next;
}

function requireReason(payload, min = 15) {
  const reason = String(payload?.reason || '').trim();
  if (reason.length < min) throw new Error(`A reason of at least ${min} characters is required`);
  return reason;
}

export function applyWorkflowAction(workflow, action, actor, payload = {}, options = {}) {
  if (!workflow?.caseId) throw new TypeError('workflow.caseId is required');
  if (!actor?.id || !actor?.role) throw new TypeError('actor.id and actor.role are required');
  const from = workflow.currentStage;
  let next;

  switch (action) {
    case 'assign-case': {
      if (from !== 'submitted') throw new Error('Case can only be assigned from submitted stage');
      if (!roleAllowed(actor.role, ['supervisor', 'admin'])) throw new Error('Only a supervisor or administrator can assign a case');
      if (!payload.assigneeId || !payload.assigneeName) throw new Error('Assignee is required');
      next = appendEvent(workflow, action, actor, from, 'assigned', payload, options.at);
      next.assignedTo = { id: payload.assigneeId, name: payload.assigneeName, role: payload.assigneeRole || workflow.assignedRole };
      break;
    }
    case 'start-analysis': {
      if (from !== 'assigned') throw new Error('Analysis can only start after assignment');
      if (!roleAllowed(actor.role, ['creditAnalyst', 'seniorAnalyst'])) throw new Error('Only an analyst can start analysis');
      next = appendEvent(workflow, action, actor, from, 'analystReview', payload, options.at);
      next.prerequisites.recommendationRead = true;
      break;
    }
    case 'mark-evidence-reviewed': {
      if (from !== 'analystReview') throw new Error('Evidence review is only available during analyst review');
      if (!roleAllowed(actor.role, ['creditAnalyst', 'seniorAnalyst'])) throw new Error('Only an analyst can review evidence');
      next = appendEvent(workflow, action, actor, from, 'analystReview', payload, options.at);
      next.prerequisites.evidenceReviewed = true;
      next.prerequisites.debtReviewed = true;
      next.prerequisites.policyReviewed = true;
      break;
    }
    case 'submit-to-committee': {
      if (from !== 'analystReview') throw new Error('Case must be in analyst review');
      if (!roleAllowed(actor.role, ['creditAnalyst', 'seniorAnalyst'])) throw new Error('Only an analyst can submit to committee');
      requireReason(payload, 20);
      if (!Object.values(workflow.prerequisites).every(Boolean)) throw new Error('All review prerequisites must be completed');
      next = appendEvent(workflow, action, actor, from, 'committeeReview', payload, options.at);
      break;
    }
    case 'request-additional-evidence': {
      if (!['analystReview', 'committeeReview'].includes(from)) throw new Error('Additional evidence can only be requested during review');
      if (!roleAllowed(actor.role, ['creditAnalyst', 'seniorAnalyst', 'committeeMember', 'committeeChair'])) throw new Error('Actor role cannot request evidence');
      requireReason(payload, 20);
      next = appendEvent(workflow, action, actor, from, 'waitingEvidence', payload, options.at);
      break;
    }
    case 'resume-analysis': {
      if (from !== 'waitingEvidence') throw new Error('Case is not waiting for evidence');
      if (!roleAllowed(actor.role, ['creditAnalyst', 'seniorAnalyst'])) throw new Error('Only an analyst can resume analysis');
      next = appendEvent(workflow, action, actor, from, 'analystReview', payload, options.at);
      break;
    }
    case 'attach-decision': {
      if (from !== 'committeeReview') throw new Error('Decision can only be attached during committee review');
      if (!payload.decisionId || !payload.decisionStatus) throw new Error('Decision reference is required');
      if (!roleAllowed(actor.role, ['committeeMember', 'committeeChair'])) throw new Error('Only the committee can attach a decision');
      const to = payload.decisionStatus === 'pending-second-review' ? 'secondReview' : 'decisionReady';
      next = appendEvent(workflow, action, actor, from, to, payload, options.at);
      next.latestDecisionId = payload.decisionId;
      break;
    }
    case 'complete-second-review': {
      if (from !== 'secondReview') throw new Error('Case is not awaiting second review');
      if (!roleAllowed(actor.role, ['seniorReviewer', 'committeeChair', 'supervisor'])) throw new Error('Actor cannot complete second review');
      requireReason(payload, 20);
      next = appendEvent(workflow, action, actor, from, payload.outcome === 'return' ? 'committeeReview' : 'decisionReady', payload, options.at);
      break;
    }
    case 'communicate-decision': {
      if (from !== 'decisionReady') throw new Error('Decision is not ready for communication');
      if (!roleAllowed(actor.role, ['creditAnalyst', 'seniorAnalyst', 'supervisor'])) throw new Error('Actor cannot communicate the decision');
      next = appendEvent(workflow, action, actor, from, 'communicated', payload, options.at);
      break;
    }
    case 'open-appeal': {
      if (!['communicated', 'closed'].includes(from)) throw new Error('Appeal can only be opened after communication');
      if (!payload.appealId) throw new Error('Appeal reference is required');
      next = appendEvent(workflow, action, actor, from, 'committeeReview', payload, options.at);
      next.latestAppealId = payload.appealId;
      next.status = 'reopened';
      next.revision = Number(next.revision || 1) + 1;
      break;
    }
    case 'close-case': {
      if (from !== 'communicated') throw new Error('Only a communicated case can be closed');
      if (!roleAllowed(actor.role, ['supervisor', 'admin'])) throw new Error('Only a supervisor or administrator can close a case');
      requireReason(payload, 15);
      next = appendEvent(workflow, action, actor, from, 'closed', payload, options.at);
      next.status = 'closed';
      break;
    }
    default:
      throw new Error(`Unsupported workflow action: ${action}`);
  }

  return next;
}

export function availableWorkflowActions(workflow, role) {
  const stage = workflow?.currentStage;
  const actions = [];
  if (stage === 'submitted' && ['supervisor', 'admin'].includes(role)) actions.push('assign-case');
  if (stage === 'assigned' && ['creditAnalyst', 'seniorAnalyst'].includes(role)) actions.push('start-analysis');
  if (stage === 'analystReview' && ['creditAnalyst', 'seniorAnalyst'].includes(role)) actions.push('mark-evidence-reviewed', 'submit-to-committee', 'request-additional-evidence');
  if (stage === 'committeeReview' && ['committeeMember', 'committeeChair'].includes(role)) actions.push('request-additional-evidence', 'attach-decision');
  if (stage === 'waitingEvidence' && ['creditAnalyst', 'seniorAnalyst'].includes(role)) actions.push('resume-analysis');
  if (stage === 'secondReview' && ['seniorReviewer', 'committeeChair', 'supervisor'].includes(role)) actions.push('complete-second-review');
  if (stage === 'decisionReady' && ['creditAnalyst', 'seniorAnalyst', 'supervisor'].includes(role)) actions.push('communicate-decision');
  if (stage === 'communicated' && ['supervisor', 'admin'].includes(role)) actions.push('close-case');
  return actions;
}
