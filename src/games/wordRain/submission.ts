export interface SubmissionGate {
  pendingComposition: boolean
}

export interface SubmissionDecision {
  gate: SubmissionGate
  valueToSubmit: string | null
}

export const INITIAL_SUBMISSION_GATE: SubmissionGate = {
  pendingComposition: false,
}

export function handleEnter(
  gate: SubmissionGate,
  value: string,
  isComposing: boolean,
): SubmissionDecision {
  if (value === '') {
    return { gate: { pendingComposition: false }, valueToSubmit: null }
  }

  if (isComposing) {
    return { gate: { pendingComposition: true }, valueToSubmit: null }
  }

  return { gate: { pendingComposition: false }, valueToSubmit: value }
}

export function handleCompositionEnd(
  gate: SubmissionGate,
  value: string,
): SubmissionDecision {
  if (!gate.pendingComposition || value === '') {
    return { gate: { pendingComposition: false }, valueToSubmit: null }
  }

  return { gate: { pendingComposition: false }, valueToSubmit: value }
}
