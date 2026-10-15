import rules from '../../../../locales/quiz_rules.json';
import { evaluateCondition } from './ConditionParser.js';

export class SymptomCheckerEngine {
    constructor() {
        this.answers = {};
        this.activeBranches = new Set();
        this.history = []; // stack of { questionId, previousAnswer }
        this.contradictionResolved = false;
        this._cachedSequence = null;
        this._cachedScheduledSet = null;
    }

    setAnswer(questionId, answer) {
        this.history.push({ questionId, previousAnswer: this.answers[questionId] });
        this.answers[questionId] = answer;
        
        // Pre-populate entry domains into branch main questions (Section 5)
        this.syncEntryDomains(questionId, answer);
        
        this.updateActiveBranches();
        this.cleanupInapplicableAnswers();
    }

    syncEntryDomains(questionId, answer) {
        if (questionId === 'Q_ENTRY_HEAD') {
            if (answer === 'DENTAL') this.answers['Q_L05_MAIN'] = 'DENTAL';
        } else if (questionId === 'Q_ENTRY_BELLY') {
            if (answer === 'BLEED') this.answers['Q_L06_MAIN'] = 'BLEED';
            else if (answer === 'URINARY') this.answers['Q_B05_MAIN'] = 'PAIN';
        } else if (questionId === 'Q_ENTRY_MORE') {
            // Let Q_L05_MAIN be determined naturally
        }
    }

    undo() {
        if (this.history.length === 0) return null;
        const last = this.history.pop();
        if (last.previousAnswer === undefined) {
            delete this.answers[last.questionId];
        } else {
            this.answers[last.questionId] = last.previousAnswer;
        }
        
        this.updateActiveBranches();
        this.cleanupInapplicableAnswers();
        
        return last.questionId;
    }

    cleanupInapplicableAnswers() {
        let changed = true;
        let passes = 0;
        while (changed && passes < 10) {
            passes++;
            changed = false;
            for (let qId in this.answers) {
                if (qId.startsWith('Q_ENTRY')) continue;
                if (!this.isQuestionApplicable(qId)) {
                    delete this.answers[qId];
                    changed = true;
                }
            }
            if (changed) this.updateActiveBranches();
        }
    }

    updateActiveBranches() {
        const prevBranches = Array.from(this.activeBranches).sort().join(',');
        this.activeBranches.clear();
        const ans = this.answers;

        // Entry questions branch activation
        if (ans['Q_ENTRY_GROUP'] === 'SKIN') this.activeBranches.add('B06');
        if (ans['Q_ENTRY_GROUP'] === 'OTHER' || ans['Q_ENTRY_GROUP'] === 'UNKNOWN') this.activeBranches.add('L10');

        if (ans['Q_ENTRY_PAIN'] === 'CHEST') this.activeBranches.add('L01');
        if (ans['Q_ENTRY_PAIN'] === 'BACK') this.activeBranches.add('B07');
        if (ans['Q_ENTRY_PAIN'] === 'LIMB') this.activeBranches.add('B08');
        if (ans['Q_ENTRY_PAIN'] === 'UNKNOWN') this.activeBranches.add('L10');

        if (ans['Q_ENTRY_HEAD'] === 'HEADACHE') this.activeBranches.add('B02');
        if (ans['Q_ENTRY_HEAD'] === 'EYE') this.activeBranches.add('L04');
        if (ans['Q_ENTRY_HEAD'] === 'EAR' || ans['Q_ENTRY_HEAD'] === 'DENTAL') this.activeBranches.add('L05');
        if (ans['Q_ENTRY_HEAD'] === 'UNKNOWN') this.activeBranches.add('L10');

        if (ans['Q_ENTRY_BELLY'] === 'ABDOMEN') this.activeBranches.add('B03');
        if (ans['Q_ENTRY_BELLY'] === 'PELVIC' || ans['Q_ENTRY_BELLY'] === 'BLEED') this.activeBranches.add('L06');
        if (ans['Q_ENTRY_BELLY'] === 'URINARY') this.activeBranches.add('B05');
        if (ans['Q_ENTRY_BELLY'] === 'UNKNOWN') this.activeBranches.add('L10');

        if (ans['Q_ENTRY_ILL'] === 'AIRWAY') this.activeBranches.add('B01');
        if (ans['Q_ENTRY_ILL'] === 'DIGESTIVE') this.activeBranches.add('B04');
        if (ans['Q_ENTRY_ILL'] === 'URINARY') this.activeBranches.add('B05');
        if (ans['Q_ENTRY_ILL'] === 'FEVER') this.activeBranches.add('L03');

        if (ans['Q_ENTRY_MORE'] === 'HEART') this.activeBranches.add('L01');
        if (ans['Q_ENTRY_MORE'] === 'NEURO') this.activeBranches.add('L02');
        if (ans['Q_ENTRY_MORE'] === 'EYE') this.activeBranches.add('L04');
        if (ans['Q_ENTRY_MORE'] === 'EAR') this.activeBranches.add('L05');
        if (ans['Q_ENTRY_MORE'] === 'OTHER' || ans['Q_ENTRY_MORE'] === 'UNKNOWN') this.activeBranches.add('L10');

        if (ans['Q_ENTRY_EVENT'] === 'INJURY') this.activeBranches.add('L08');
        if (ans['Q_ENTRY_EVENT'] === 'EXPOSURE') this.activeBranches.add('L07');
        if (ans['Q_ENTRY_EVENT'] === 'MENTAL') this.activeBranches.add('L09');
        if (ans['Q_ENTRY_EVENT'] === 'OTHER' || ans['Q_ENTRY_EVENT'] === 'UNKNOWN') this.activeBranches.add('L10');

        // Finite merges from rule register
        for (let rule of rules.branchActivation) {
            const effectHead = rule.effect.split(';')[0].trim();
            const pairMatch = rule.condition.match(/^(Q_[A-Z0-9_]+)\s*=\s*(.+)$/);
            const effectList = effectHead.replace(/\s*respectively.*$/, '').split(/\s*\/\s*/).map(s => s.trim().split(' ')[0]);
            
            if (pairMatch && effectList.length > 1) {
                const vals = pairMatch[2].split(/\s*\/\s*/);
                const a = this.answers[pairMatch[1]];
                const selected = Array.isArray(a) ? a : [a];
                vals.forEach((v, i) => {
                    const target = effectList[Math.min(i, effectList.length - 1)];
                    if (target && selected.includes(v.trim()) && /^[A-Z][0-9]{2}$/.test(target)) {
                        this.activeBranches.add(target);
                    }
                });
                continue;
            }

            if (evaluateCondition(rule.condition, this.getEnvironment()) === true) {
                let branch = effectHead.split(' ')[0];
                if (branch && branch.match(/^[A-Z][0-9]{2}$/)) {
                    this.activeBranches.add(branch);
                }
            }
        }

        const newBranches = Array.from(this.activeBranches).sort().join(',');
        if (prevBranches !== newBranches) {
            this._cachedSequence = null;
            this._cachedScheduledSet = null;
        }
    }

    getEnvironment() {
        if (!this._cachedScheduledSet) {
            this.getBranchQuestionSequence();
        }
        return {
            answers: this.answers,
            activeBranches: this.activeBranches,
            macros: rules.macros,
            isQuestionApplicable: (qId) => this.isQuestionApplicable(qId),
            isQuestionScheduled: (qId) => this._cachedScheduledSet ? this._cachedScheduledSet.has(qId) : false,
            isBranchSafe: (branch) => this.isBranchSafe(branch)
        };
    }

    isQuestionApplicable(qId) {
        if (qId === 'Q_UNCERTAIN') {
            return this.checkContradiction() !== null && !this.contradictionResolved;
        }
        let condition = rules.applicability[qId];
        if (!condition) return true;
        const res = evaluateCondition(condition, this.getEnvironment());
        // An unknown parent answer activates dependencies (Section 2, п. 4 & Section 5)
        return res === true || res === null;
    }

    isBranchSafe(branch) {
        // SAFE(branch) = every applicable safety question answered, all active U1/U2 predicates FALSE or NOT_APPLICABLE
        const env = this.getEnvironment();
        
        // Cause-only question suffixes (Section 6)
        const causeOnlyList = [
            'Q_B01_ITCH', 'Q_B01_TRIGGER', 'Q_B01_CONTROL', 'Q_B01_COLD', 'Q_B01_COMBO',
            'Q_B02_SIDE', 'Q_B02_FEEL', 'Q_B02_ACTIVITY', 'Q_B02_SENSE', 'Q_B02_DIAG', 'Q_B02_FREQUENCY',
            'Q_B03_STOOL', 'Q_B03_CONST_COURSE', 'Q_B03_REFLUX', 'Q_B03_REFLUX_FREQ',
            'Q_B06_CONTACT', 'Q_B06_AVOID',
            'Q_BACK_RADIATION',
            'Q_B08_STIFF', 'Q_B08_SMALL',
            'Q_URINARY_DISCHARGE'
        ];

        const schedule = rules.schedules[branch] || [];
        for (let qId of schedule) {
            if (!qId.startsWith('Q_')) continue;
            if (causeOnlyList.includes(qId)) continue;
            if (this.isQuestionApplicable(qId) && this.answers[qId] === undefined) {
                return false; // Safety question unanswered
            }
        }

        // Shared urgent check for questions applicable to active branches
        const branchSeq = this.getBranchQuestionSequence();
        for (let rule of rules.sharedUrgent) {
            const ruleQuestions = rule.condition.match(/Q_[A-Z0-9_]+/g) || [];
            const hasApplicableQuestion = ruleQuestions.some(q => branchSeq.includes(q) && this.isQuestionApplicable(q));
            if (hasApplicableQuestion) {
                let res = evaluateCondition(rule.condition, env);
                if (res === true || res === null) return false;
            }
        }

        // Branch urgent check
        if (rules.branchUrgent[branch]) {
            for (let condition of rules.branchUrgent[branch]) {
                let res = evaluateCondition(condition, env);
                if (res === true || res === null) return false;
            }
        }

        return true;
    }

    checkContradiction() {
        if (this.contradictionResolved) return null;
        const ans = this.answers;

        const neuro = ans['Q_NEURO'] || [];
        const hasNewNeuro = Array.isArray(neuro) && (neuro.includes('WEAKNESS') || neuro.includes('SPEECH') || neuro.includes('NUMB') || neuro.includes('BALANCE'));
        if (hasNewNeuro && ans['Q_NEURO_TIME'] === 'BASELINE') return 'Q_NEURO';
        if (ans['Q_ALERT'] === 'SPEECH' && ans['Q_NEURO_TIME'] === 'BASELINE') return 'Q_ALERT';

        const legs = ans['Q_B07_LEGS'];
        if ((legs === 'ONE' || legs === 'BOTH' || legs === 'WEAK') && ans['Q_BACK_LEG_WEAK'] === 'NO') return 'Q_B07_LEGS';

        const palpAssoc = ans['Q_L01_PALP_ASSOC'] || [];
        if (ans['Q_CHEST'] === 'NONE' && Array.isArray(palpAssoc) && palpAssoc.includes('CHEST')) return 'Q_CHEST';
        if (ans['Q_BREATH'] === 'NORMAL' && Array.isArray(palpAssoc) && palpAssoc.includes('BREATH')) return 'Q_BREATH';

        if ((ans['Q_PREGNANCY'] === 'NO' || ans['Q_PREGNANCY'] === 'NA') && ans['Q_L06_BLEED_CONTEXT'] === 'PREGNANCY') return 'Q_PREGNANCY';

        return null;
    }

    getBranchQuestionSequence() {
        if (this._cachedSequence) {
            return this._cachedSequence;
        }
        const sortedBranches = Array.from(this.activeBranches).sort();
        const sequence = [];

        // 1. Add questions from each active branch schedule
        for (let branch of sortedBranches) {
            const sched = rules.schedules[branch] || [];
            for (let qId of sched) {
                if (!sequence.includes(qId)) {
                    sequence.push(qId);
                }
            }
            // Also include any branch-specific questions explicitly defined for this branch
            for (let qId in rules.applicability) {
                const cond = rules.applicability[qId] || '';
                if (cond === `active(${branch})` && !sequence.includes(qId)) {
                    sequence.push(qId);
                }
            }
        }

        // 2. Insert dependencies immediately after their parent question
        let inserted = true;
        while (inserted) {
            inserted = false;
            for (let i = 0; i < sequence.length; i++) {
                const parentId = sequence[i];
                for (let depId in rules.applicability) {
                    const cond = rules.applicability[depId] || '';
                    const belongsToActiveBranch = sortedBranches.some(b => cond.includes(b)) || !cond.includes('active(');
                    if (belongsToActiveBranch && cond.includes(parentId) && !sequence.includes(depId)) {
                        sequence.splice(i + 1, 0, depId);
                        inserted = true;
                        break;
                    }
                }
                if (inserted) break;
            }
        }

        this._cachedSequence = sequence;
        this._cachedScheduledSet = new Set(sequence);
        return sequence;
    }

    getNextQuestion() {
        const entryQuestions = [
            'Q_ENTRY_WHO', 'Q_ENTRY_AGE', 'Q_ENTRY_GROUP', 
            'Q_ENTRY_PAIN', 'Q_ENTRY_HEAD', 'Q_ENTRY_BELLY', 
            'Q_ENTRY_ILL', 'Q_ENTRY_MORE', 'Q_ENTRY_EVENT'
        ];

        for (let qId of entryQuestions) {
            if (qId !== 'Q_ENTRY_WHO' && qId !== 'Q_ENTRY_AGE') {
                if (this.answers['Q_ENTRY_AGE'] === 'UNDER18' || this.answers['Q_ENTRY_AGE'] === 'UNKNOWN') {
                    return null; // Exit early for unsupported age
                }
            }

            if (qId === 'Q_ENTRY_PAIN' && this.answers['Q_ENTRY_GROUP'] !== 'PAIN') continue;
            if (qId === 'Q_ENTRY_HEAD' && this.answers['Q_ENTRY_PAIN'] !== 'HEAD') continue;
            if (qId === 'Q_ENTRY_BELLY' && this.answers['Q_ENTRY_PAIN'] !== 'BELLY') continue;
            if (qId === 'Q_ENTRY_ILL' && this.answers['Q_ENTRY_GROUP'] !== 'ILLNESS') continue;
            if (qId === 'Q_ENTRY_MORE' && !(this.answers['Q_ENTRY_ILL'] === 'MORE' || this.answers['Q_ENTRY_ILL'] === 'UNKNOWN')) continue;
            if (qId === 'Q_ENTRY_EVENT' && this.answers['Q_ENTRY_GROUP'] !== 'EVENT') continue;

            if (this.answers[qId] === undefined) return qId;
        }

        // Check for contradiction
        const conflictingQ = this.checkContradiction();
        if (conflictingQ && this.answers['Q_UNCERTAIN'] === undefined) {
            return 'Q_UNCERTAIN';
        }

        // Check if known U1 shortcut is active (Section 2, item 5)
        const u1 = this.checkEmergency();
        if (u1 && u1.type === 'U1') {
            return null; // Ready to show View result transition
        }

        // Deterministic ordered question pipeline
        const sequence = this.getBranchQuestionSequence();

        // Find the first unanswered question that is currently applicable
        for (let qId of sequence) {
            if (this.answers[qId] === undefined && this.isQuestionApplicable(qId)) {
                return qId;
            }
        }

        return null;
    }

    checkEmergency() {
        const env = this.getEnvironment();

        // 1. Mental health crisis triggers
        if (env.answers['Q_L09_SAFETY'] === 'UNSAFE' || env.answers['Q_L09_HARM'] === 'SERIOUS') {
            return { type: 'U1', result: 'R_EMERGENCY_ASSESSMENT_U1', cause: 'Q_L09_CRISIS' };
        }
        if (env.answers['Q_L09_SAFETY'] === 'UNKNOWN' || env.answers['Q_L09_HARM'] === 'UNKNOWN') {
            return { type: 'U1', result: 'R_IMMEDIATE_UNCERTAINTY', cause: 'Q_L09_CRISIS' };
        }

        // 2. Shared Urgent U1
        for (let rule of rules.sharedUrgent) {
            if (rule.effect.startsWith('U1')) {
                if (evaluateCondition(rule.condition, env) === true) {
                    return { type: 'U1', result: 'R_EMERGENCY_ASSESSMENT_U1', cause: rule.id };
                }
            }
        }

        // 3. Branch Emergency U1
        for (let branch of this.activeBranches) {
            if (rules.branchUrgent[branch]) {
                for (let condition of rules.branchUrgent[branch]) {
                    if (evaluateCondition(condition, env) === true) {
                        return { type: 'U1', result: 'R_EMERGENCY_ASSESSMENT_U1', cause: branch };
                    }
                }
            }
        }

        return null;
    }

    evaluateResults() {
        const env = this.getEnvironment();

        // 1. Known Emergency U1
        const emergency = this.checkEmergency();
        if (emergency) return emergency;

        // Age unsupported check (Section 6, line 3934: Age UNDER18/UNKNOWN -> R_UNSUPPORTED_AGE unless emergency)
        if (env.answers['Q_ENTRY_AGE'] === 'UNDER18' || env.answers['Q_ENTRY_AGE'] === 'UNKNOWN') {
            return { type: 'UNKNOWN', result: 'R_UNSUPPORTED_AGE' };
        }

        let hasUnresolvedU1 = false;
        let hasUnresolvedU2 = false;
        const sequence = this.getBranchQuestionSequence();

        // Check unresolved U1s
        for (let rule of rules.sharedUrgent) {
            if (rule.effect.startsWith('U1')) {
                const ruleQuestions = rule.condition.match(/Q_[A-Z0-9_]+/g) || [];
                const hasApplicableQuestion = ruleQuestions.some(q => sequence.includes(q) && this.isQuestionApplicable(q));
                if (hasApplicableQuestion) {
                    let res = evaluateCondition(rule.condition, env);
                    if (res === null) hasUnresolvedU1 = true;
                }
            }
        }
        for (let branch of this.activeBranches) {
            if (rules.branchUrgent[branch]) {
                for (let cond of rules.branchUrgent[branch]) {
                    let res = evaluateCondition(cond, env);
                    if (res === null) hasUnresolvedU1 = true;
                }
            }
        }

        if (hasUnresolvedU1) {
            return { type: 'U1', result: 'R_IMMEDIATE_UNCERTAINTY', cause: 'UNRESOLVED_U1' };
        }

        // 2. Collect all candidate results across active branches
        const candidates = [];

        // Check shared U2 rules
        for (let rule of rules.sharedUrgent) {
            if (rule.effect.startsWith('U2') || rule.effect.startsWith('Maternity U2')) {
                const ruleQuestions = rule.condition.match(/Q_[A-Z0-9_]+/g) || [];
                const hasApplicableQuestion = ruleQuestions.some(q => sequence.includes(q) && this.isQuestionApplicable(q));
                if (hasApplicableQuestion) {
                    let res = evaluateCondition(rule.condition, env);
                    if (res === true) {
                        candidates.push({ type: 'U2', result: 'R_URGENT_ASSESSMENT_U2', deadline: 'NOW', cause: rule.id });
                    } else if (res === null) {
                        hasUnresolvedU2 = true;
                    }
                }
            }
        }

        // Check specific rules for active branches
        const deadlineRanks = { 'NOW': 1, '24H': 2, '48H': 3, '24_48H': 4, 'DEFAULT': 5, 'ENT14D': 6, 'GYN14D': 7 };
        const urgencyRanks = { 'U1': 1, 'U2': 2, 'U3': 3, 'U4': 4, 'U5': 5 };

        const specificCandidates = [];
        const fallbackCandidates = [];
        const matchedBranches = new Set();

        for (let rule of rules.nonEmergency) {
            // Only check rule if its branch is active
            const ruleBranchMatch = rule.id.match(/^R_([A-Z][0-9]{2})/);
            const ruleBranch = ruleBranchMatch ? ruleBranchMatch[1] : null;
            if (ruleBranch && !this.activeBranches.has(ruleBranch)) {
                continue;
            }

            const isFallback = ((rule.condition && rule.condition.startsWith('Fallback after no specific')) || 
                               (rule.condition && rule.condition.includes('no specific')) ||
                               rule.id === 'R_B03_UNCLEAR_U3' ||
                               rule.id === 'R_B05_UNCLEAR_U3_24H') && rule.id !== 'R_B06_UNCLEAR_U4';

            const match = rule.id.match(/_U([1-5])/);
            const urgency = match ? 'U' + match[1] : 'U3';

            // U3/U4/U5 require SAFE(branch)
            if (urgency === 'U3' || urgency === 'U4' || urgency === 'U5') {
                if (ruleBranch && !this.isBranchSafe(ruleBranch)) {
                    continue;
                }
            }

            // U5 additionally requires LOW
            if (urgency === 'U5') {
                if (evaluateCondition('LOW', env) !== true) {
                    continue;
                }
            }

            let res = evaluateCondition(rule.condition, env);
            if (res === true) {
                // Determine deadline override from ID (e.g. 24H, 48H)
                const parts = rule.id.split('_');
                const suffix = parts[parts.length - 1];
                let deadline = 'DEFAULT';
                if (/^[0-9]+H$/.test(suffix) || /^[0-9]+_[0-9]+H$/.test(suffix) || suffix.includes('14D')) {
                    deadline = suffix;
                }

                if (isFallback) {
                    fallbackCandidates.push({ type: urgency, result: rule.id, deadline, branch: ruleBranch });
                } else {
                    specificCandidates.push({ type: urgency, result: rule.id, deadline, branch: ruleBranch });
                    if (ruleBranch) matchedBranches.add(ruleBranch);
                }
            }
        }

        // Fallbacks are used only if no specific rule applies in its branch (Section 2, item 7)
        const eligibleFallbacks = fallbackCandidates.filter(f => !f.branch || !matchedBranches.has(f.branch));
        const allCandidates = [...candidates, ...specificCandidates, ...eligibleFallbacks];

        // If candidates found, sort by Urgency (U1 > U2 > U3 > U4 > U5), then by Deadline
        if (allCandidates.length > 0) {
            allCandidates.sort((a, b) => {
                const uDiff = (urgencyRanks[a.type] || 99) - (urgencyRanks[b.type] || 99);
                if (uDiff !== 0) return uDiff;
                const dDiff = (deadlineRanks[a.deadline] || 99) - (deadlineRanks[b.deadline] || 99);
                return dDiff;
            });
            return allCandidates[0];
        }

        // Unresolved U2 fallback
        if (hasUnresolvedU2) {
            return { type: 'U2', result: 'R_CRITICAL_UNCERTAINTY_U2', cause: 'UNRESOLVED_U2' };
        }

        // Age unsupported check
        if (env.answers['Q_ENTRY_AGE'] === 'UNDER18' || env.answers['Q_ENTRY_AGE'] === 'UNKNOWN') {
            return { type: 'UNKNOWN', result: 'R_UNSUPPORTED_AGE' };
        }

        return { type: 'UNKNOWN', result: 'R_UNSUPPORTED_COMPLAINT' };
    }
}
