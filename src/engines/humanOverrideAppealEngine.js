export const HUMAN_OVERRIDE_APPEAL_ENGINE_VERSION = '1.6.0';

const clone = value => JSON.parse(JSON.stringify(value));
const now = value => value || new Date().toISOString();
const stableId = parts => {
  const text = parts.map(value => String(value ?? '')).join('|');
  let hash = 5381;
  for (let i = 0; i < text.length; i += 1) hash = ((hash << 5) + hash) ^ text.charCodeAt(i);
  return `CPD-${(hash >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;
};

export const DECISION_OPTIONS = [
  'approve-proposal',
  'approve-with-conditions',
  'reduce-amount',
  'request-more-evidence',
  'defer-for-improvement',
  'decline-with-reason'
];

function expectedOptions(recommendationCode) {
  const map = {
    supported: ['approve-proposal', 'approve-with-conditions'],
    conditional: ['approve-with-conditions', 'reduce-amount'],
    reduced: ['reduce-amount', 'approve-with-conditions'],
    toComplete: ['request-more-evidence'],
    improvement: ['defer-for-improvement'],
    humanReview: ['request-more-evidence', 'defer-for-improvement', 'decline-with-reason']
  };
  return map[recommendationCode] || [];
}

function requireText(value, label, min) {
  const text = String(value || '').trim();
  if (text.length < min) throw new Error(`${label} must contain at least ${min} characters`);
  return text;
}

export function createHumanDecision(inputs = {}, decisionInput = {}, options = {}) {
  const { recommendation, workflow } = inputs;
  if (!recommendation?.referenceId) throw new TypeError('recommendation.referenceId is required');
  if (!workflow?.caseId) throw new TypeError('workflow.caseId is required');
  if (workflow.currentStage !== 'committeeReview') throw new Error('The case must be in committee review');
  if (!DECISION_OPTIONS.includes(decisionInput.option)) throw new Error('Unsupported decision option');
  const actor = decisionInput.actor;
  if (!actor?.id || !['committeeMember', 'committeeChair'].includes(actor.role)) throw new Error('A committee actor is required');

  const proposed = Number(recommendation.proposedFinancing?.principal || 0);
  const requested = Number(recommendation.proposedFinancing?.requestedAmount || 0);
  let approvedAmount = Number(decisionInput.approvedAmount ?? proposed);
  if (['request-more-evidence', 'defer-for-improvement', 'decline-with-reason'].includes(decisionInput.option)) approvedAmount = 0;
  if (!Number.isFinite(approvedAmount) || approvedAmount < 0 || approvedAmount > requested) throw new Error('Approved amount is outside the permitted range');
  if (decisionInput.option === 'reduce-amount' && !(approvedAmount > 0 && approvedAmount < requested)) throw new Error('A reduced amount must be positive and below the requested amount');
  if (decisionInput.option === 'approve-proposal' && approvedAmount !== proposed) throw new Error('Approved amount must match the proposed amount');

  const aligned = expectedOptions(recommendation.recommendationCode).includes(decisionInput.option) &&
    (decisionInput.option !== 'approve-proposal' || approvedAmount === proposed) &&
    (decisionInput.option !== 'reduce-amount' || approvedAmount <= Math.max(proposed, 0));
  const override = !aligned || approvedAmount > proposed;
  const reason = requireText(decisionInput.reason, 'Decision reason', override ? 40 : 20);
  const conditions = Array.isArray(decisionInput.conditions) ? decisionInput.conditions.filter(Boolean).map(String) : [];
  if (decisionInput.option === 'approve-with-conditions' && conditions.length === 0) throw new Error('At least one condition is required');

  const secondReviewRequired = Boolean(
    recommendation.humanReview?.secondReviewRequired ||
    override ||
    decisionInput.option === 'decline-with-reason'
  );
  const decidedAt = now(options.at);
  const decisionId = stableId([workflow.caseId, recommendation.referenceId, decisionInput.option, approvedAmount, actor.id, decidedAt]);

  return {
    decisionId,
    engineVersion: HUMAN_OVERRIDE_APPEAL_ENGINE_VERSION,
    caseId: workflow.caseId,
    workflowRevision: workflow.revision,
    recommendationReference: recommendation.referenceId,
    recommendationSnapshot: {
      code: recommendation.recommendationCode,
      proposedPrincipal: proposed,
      requestedAmount: requested,
      conditions: clone(recommendation.conditions || []),
      blockingIssues: clone(recommendation.blockingIssues || []),
      versions: clone(recommendation.versions || {})
    },
    option: decisionInput.option,
    approvedAmount,
    reason,
    conditions,
    override: {
      isOverride: override,
      type: override ? (approvedAmount > proposed ? 'upward-financial-override' : 'recommendation-override') : 'none',
      reasonRequired: override,
      originalRecommendationPreserved: true
    },
    status: secondReviewRequired ? 'pending-second-review' : 'final',
    secondReviewRequired,
    secondReview: null,
    actor: clone(actor),
    decidedAt,
    communicatedAt: null,
    history: [{
      id: `${decisionId}-H01`,
      type: 'human-decision-recorded',
      at: decidedAt,
      actor: clone(actor),
      payload: { option: decisionInput.option, approvedAmount, override }
    }],
    safeguards: {
      automaticDecision: false,
      reasonCaptured: true,
      recommendationPreserved: true,
      upwardOverrideRequiresSecondReview: true,
      independentSecondReviewerRequired: secondReviewRequired,
      appealAllowed: true
    }
  };
}

export function reviewHumanDecision(decision, reviewInput = {}, options = {}) {
  if (!decision?.decisionId) throw new TypeError('decision.decisionId is required');
  if (decision.status !== 'pending-second-review') throw new Error('Decision is not awaiting second review');
  const actor = reviewInput.actor;
  if (!actor?.id || !['seniorReviewer', 'committeeChair', 'supervisor'].includes(actor.role)) throw new Error('An authorised second reviewer is required');
  if (actor.id === decision.actor.id) throw new Error('The second reviewer must be independent');
  if (!['confirm', 'return'].includes(reviewInput.outcome)) throw new Error('Unsupported review outcome');
  const reason = requireText(reviewInput.reason, 'Second review reason', 20);
  const reviewedAt = now(options.at);
  const next = clone(decision);
  next.secondReview = { outcome: reviewInput.outcome, reason, actor: clone(actor), reviewedAt };
  next.status = reviewInput.outcome === 'confirm' ? 'final' : 'returned-for-reconsideration';
  next.history.push({
    id: `${decision.decisionId}-H${String(next.history.length + 1).padStart(2, '0')}`,
    type: reviewInput.outcome === 'confirm' ? 'second-review-confirmed' : 'second-review-returned',
    at: reviewedAt,
    actor: clone(actor),
    payload: { reason }
  });
  return next;
}

export function markDecisionCommunicated(decision, actor, options = {}) {
  if (!decision?.decisionId || decision.status !== 'final') throw new Error('Only a final decision can be communicated');
  if (!actor?.id) throw new Error('Actor is required');
  const communicatedAt = now(options.at);
  const next = clone(decision);
  next.communicatedAt = communicatedAt;
  next.history.push({
    id: `${decision.decisionId}-H${String(next.history.length + 1).padStart(2, '0')}`,
    type: 'decision-communicated',
    at: communicatedAt,
    actor: clone(actor),
    payload: {}
  });
  return next;
}

export function createAppeal(decision, appealInput = {}, options = {}) {
  if (!decision?.decisionId) throw new TypeError('decision.decisionId is required');
  if (decision.status !== 'final' || !decision.communicatedAt) throw new Error('Appeal requires a final communicated decision');
  const submittedBy = appealInput.submittedBy;
  if (!submittedBy?.id) throw new Error('Appeal submitter is required');
  const reason = requireText(appealInput.reason, 'Appeal reason', 30);
  const contestedItems = Array.isArray(appealInput.contestedItems) ? appealInput.contestedItems.filter(Boolean).map(String) : [];
  if (contestedItems.length === 0) throw new Error('At least one contested item is required');
  const submittedAt = now(options.at);
  const appealId = stableId([decision.decisionId, submittedBy.id, submittedAt, contestedItems.join(',')]);

  return {
    appealId,
    engineVersion: HUMAN_OVERRIDE_APPEAL_ENGINE_VERSION,
    decisionId: decision.decisionId,
    caseId: decision.caseId,
    originalDecisionSnapshot: {
      option: decision.option,
      approvedAmount: decision.approvedAmount,
      reason: decision.reason,
      decidedAt: decision.decidedAt,
      actor: clone(decision.actor)
    },
    submittedBy: clone(submittedBy),
    reason,
    contestedItems,
    supportingEvidenceIds: Array.isArray(appealInput.supportingEvidenceIds) ? appealInput.supportingEvidenceIds.filter(Boolean).map(String) : [],
    status: 'submitted',
    submittedAt,
    reviewedAt: null,
    review: null,
    reassessmentRequired: false,
    history: [{
      id: `${appealId}-H01`,
      type: 'appeal-submitted',
      at: submittedAt,
      actor: clone(submittedBy),
      payload: { contestedItems: clone(contestedItems) }
    }],
    safeguards: {
      originalDecisionPreserved: true,
      appealDoesNotAutoReverseDecision: true,
      humanReviewRequired: true,
      correctionRequiresReassessment: true
    }
  };
}

export function reviewAppeal(appeal, reviewInput = {}, options = {}) {
  if (!appeal?.appealId) throw new TypeError('appeal.appealId is required');
  if (appeal.status !== 'submitted') throw new Error('Appeal is not awaiting review');
  const actor = reviewInput.actor;
  if (!actor?.id || !['appealOfficer', 'committeeChair', 'supervisor'].includes(actor.role)) throw new Error('An authorised appeal reviewer is required');
  if (!['uphold', 'accept-correction', 'reopen-case'].includes(reviewInput.outcome)) throw new Error('Unsupported appeal outcome');
  const reason = requireText(reviewInput.reason, 'Appeal review reason', 25);
  const reviewedAt = now(options.at);
  const next = clone(appeal);
  next.status = reviewInput.outcome === 'uphold' ? 'closed-upheld' : 'closed-reassessment';
  next.reviewedAt = reviewedAt;
  next.reassessmentRequired = reviewInput.outcome !== 'uphold';
  next.review = {
    outcome: reviewInput.outcome,
    reason,
    actor: clone(actor),
    corrections: Array.isArray(reviewInput.corrections) ? reviewInput.corrections.filter(Boolean).map(String) : [],
    reviewedAt
  };
  next.history.push({
    id: `${appeal.appealId}-H${String(next.history.length + 1).padStart(2, '0')}`,
    type: `appeal-${reviewInput.outcome}`,
    at: reviewedAt,
    actor: clone(actor),
    payload: { reason, reassessmentRequired: next.reassessmentRequired }
  });
  return next;
}
