import{commonBankPins}from'./commonBankPins.js';
// @ts-ignore Existing native scope comparator, also used by the portal bridge.
import { sameChoices } from './sq-learning/cafe-policy.mjs';
export const QB3_CONTINUITY_PIN = '2947f91645686b9fc3b13bae9aa4c7f26e6180e1c623c91da5f935efe4a361fb';
export function isContinuousCheckpoint(prior) { return !!(prior?.version === 1 && prior.subject === 'math' && (prior.manifestSHA256 === QB3_CONTINUITY_PIN || commonBankPins.some(p=>p.subject==='math' && p.manifestSHA256===prior.manifestSHA256))); }
export function sameContinuousStudy(prior, pool) { const choice = pool?.[0]?.commonChoice; return !!(isContinuousCheckpoint(prior) && choice?.subject === prior.subject && sameChoices(prior.choices, choice.choices)); }
