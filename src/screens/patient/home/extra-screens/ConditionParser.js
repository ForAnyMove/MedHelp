// Three-valued logic parser for Symptom Checker conditions

export function evaluateCondition(conditionStr, env) {
    if (!conditionStr) return true;

    // Normalise natural English fallbacks and branch urgent text from authoring spec
    conditionStr = conditionStr.replace(/^No U1 AND\s+/i, '');
    conditionStr = conditionStr.replace(/\s*AND\s+no more specific pelvic selector/gi, '');

    if (conditionStr.startsWith('Fallback after no specific')) {
        const match = conditionStr.match(/specific ([A-Z0-9]{3}) row/);
        if (match) {
            conditionStr = `active(${match[1]})`;
        }
    } else if (conditionStr === 'positive L07 exposure emergency') {
        conditionStr = 'active(L07) AND (Q_L07_EXPOSURE = OVERDOSE OR Q_L07_HARM = HARMFUL/SYMPTOMS)';
    } else if (conditionStr === 'retention under SH13') {
        conditionStr = 'Q_URINE_OUTPUT = RETENTION';
    } else if (conditionStr === 'shared predicates' || conditionStr === 'shared neurological predicates' || conditionStr === 'shared sudden neurological predicate') {
        return false;
    } else if (conditionStr.includes('positive L08 emergency predicate')) {
        conditionStr = 'active(L08) AND HEAD_INJURY AND (Q_L08_EVENT = MAJOR/PENETRATING OR Q_L08_BLEED = NO)';
    }

    // Normalise loose notation: separators, lowercase operators, "A / B" value lists
    conditionStr = conditionStr
        .replace(/\s*\/\s*/g, '/')
        .replace(/\s*;\s*/g, ' AND ')
        .replace(/,\s*or\s+/gi, ' OR ')
        .replace(/\bor\b/g, 'OR')
        .replace(/\band\b/g, 'AND');

    const tokens = tokenize(conditionStr);
    let pos = 0;

    function parseExpression() {
        let left = parseTerm();
        while (pos < tokens.length && tokens[pos] === 'OR') {
            pos++;
            let right = parseTerm();
            left = logicOr(left, right);
        }
        return left;
    }

    function parseTerm() {
        let left = parseFactor();
        while (pos < tokens.length && tokens[pos] === 'AND') {
            pos++;
            let right = parseFactor();
            left = logicAnd(left, right);
        }
        return left;
    }

    function parseFactor() {
        if (pos >= tokens.length) return null;

        if (tokens[pos] === 'NOT') {
            pos++;
            return logicNot(parseFactor());
        }

        if (tokens[pos] === '(') {
            pos++;
            let val = parseExpression();
            if (tokens[pos] === ')') pos++;
            return val;
        }

        return parsePredicate();
    }

    function parsePredicate() {
        let ident = tokens[pos++];

        // Handle active(...)
        if (ident === 'active' && tokens[pos] === '(') {
            pos++;
            let branchArg = tokens[pos++];
            if (tokens[pos] === ')') pos++;
            
            const branches = branchArg.split('/');
            for (let b of branches) {
                if (env.activeBranches && env.activeBranches.has(b)) return true;
            }
            return false;
        }

        // Handle SAFE(...)
        if (ident === 'SAFE' && tokens[pos] === '(') {
            pos++;
            let branchArg = tokens[pos++];
            if (tokens[pos] === ')') pos++;
            if (env.isBranchSafe) {
                return env.isBranchSafe(branchArg);
            }
            return true;
        }

        // Handle direct macro definitions
        const hardcodedMacros = {
            'physical': 'active(B01/B02/B03/B04/B05/B06/B07/B08/L01/L02/L03/L04/L05/L06/L08)',
            'infection_domains': 'active(B01/B03/B04/B05/B06/B07/B08/L03/L05/L06/L08)',
            'INF': 'active(B01/B04/B05/L03) OR Q_FEVER = MILD/HIGH/RIGORS OR Q_ILLNESS = MARKED/DECLINING OR Q_B06_INFECTION_FEATURES contains all PAIN/HOT/SWOLLEN OR (Q_B08_SWELL = JOINT/MULTIPLE AND Q_B08_HEAT = YES) OR Q_RECOVERY = WOUND/DECLINE',
            'PREG': 'Q_PREGNANCY = PREGNANT/POSSIBLE',
            'POST6': 'Q_PREGNANCY = RECENT AND Q_POSTPARTUM = LE6',
            'NEW_NEURO': 'Q_NEURO contains WEAKNESS/SPEECH/NUMB/BALANCE OR Q_ALERT = SPEECH OR Q_B08_SENSE = WEAK OR Q_BACK_LEG_WEAK = ONE/BOTH',
            'WELL': 'Q_ILLNESS = WELL/TIRED AND Q_FUNCTION = MILD/MODERATE AND Q_COURSE = IMPROVING/STABLE/RECURRENT',
            'DIARRHOEA': 'Q_B04_MAIN = DIARRHOEA/BOTH',
            'URINARY_SYMPTOMS': 'Q_B05_MAIN = PAIN/FREQUENCY/RETENTION OR Q_B05_KEY contains DYSURIA/NOCTURIA/CLOUDY OR Q_B05_LOOK = CLOUDY/FREQUENCY OR Q_B05_FLANK = YES OR Q_B05_BLOOD = YES OR Q_B05_LOWER_PAIN = YES',
            'CHEST_ASSOC': 'Q_CHEST_ASSOC contains SPREAD/SWEAT_NAUSEA/BREATH_FAINT',
            'PALP_ASSOC': 'Q_L01_PALP_ASSOC contains CHEST/BREATH/FAINT',
            'PELVIC': 'Q_L06_MAIN = PELVIC OR Q_B03_SITE = PELVIC',
            'VAGINAL_BLEED': 'Q_L06_MAIN = BLEED OR Q_GENITAL_ASSOC contains BLEED',
            'SKIN_INF': 'Q_B06_INFECTION_FEATURES contains all PAIN/HOT/SWOLLEN',
            'HEAD_INJURY': 'Q_L08_SITE = HEAD OR Q_B02_INJURY = YES',
            'EYE_INJURY': 'Q_L04_INJURY = CHEMICAL/IRRITANT/HIGH_SPEED/PENETRATING/OTHER',
            'DURATION48': 'Q_B06_TIME = GE48 OR (Q_B06_TIME = RECURRENT AND Q_B06_EPISODE_DURATION = GE48)',
            'ALLERGY': '(Q_B01_MAIN = NOSE OR Q_B01_COMBO contains NOSE) AND Q_B01_ITCH = YES AND Q_B01_TRIGGER = EXPOSURE/SEASON AND Q_FEVER = NO AND Q_ILLNESS = WELL AND Q_IMMUNE = NO',
            'TENSION': 'Q_B02_PATTERN = FAMILIAR AND Q_B02_ONSET = GRADUAL AND Q_B02_SIDE = BOTH AND Q_B02_FEEL = PRESS AND Q_PAIN_SEVERITY = MILD/MODERATE AND Q_B02_LENGTH = M30_H4/H4_72 AND Q_B02_ACTIVITY = NO AND Q_B02_SENSE contains NONE AND Q_VOMIT = NO AND Q_NEURO contains NONE AND Q_VISION = NONE AND Q_B02_AURA = NO AND Q_PREGNANCY != PREGNANT/POSSIBLE AND Q_B02_INJURY = NO AND Q_B02_RISK contains NONE AND Q_IMMUNE = NO AND Q_FEVER = NO',
            'PREG_MILD_HEAD': 'Q_PREGNANCY = PREGNANT/POSSIBLE/RECENT AND Q_PAIN_SEVERITY = MILD AND Q_COURSE = IMPROVING AND Q_B02_LENGTH = LT30/M30_H4 AND Q_B02_AURA = NO AND Q_VISION = NONE AND Q_NEURO contains NONE AND Q_MATERNITY contains NONE AND Q_FEVER = NO AND Q_VOMIT = NO AND NOT MIGRAINE',
            'CONSTIPATION': 'Q_B03_MAIN = CONSTIPATION AND (Q_B03_STOOL contains STRAIN AND (Q_B03_STOOL contains HARD OR Q_B03_STOOL contains LESS)) AND Q_B03_PASSAGE = BOTH/WIND AND Q_B03_PAIN = NONE/MILD AND Q_VOMIT = NO AND Q_BLEED_STOOL = NONE AND Q_B03_WEIGHT = NO',
            'REFLUX': 'Q_B03_MAIN = BURN AND Q_B03_REFLUX = YES AND Q_B03_PAIN = NONE/MILD AND Q_CHEST = NONE AND Q_B03_SWALLOW = NO AND Q_VOMIT = NO AND Q_BLEED_STOOL = NONE AND Q_B03_WEIGHT = NO AND Q_PREGNANCY != PREGNANT/POSSIBLE',
            'ISOLATED_URINE': 'Q_B05_MAIN = LOOK AND Q_B05_LOOK = ONLY AND Q_B05_KEY contains NONE AND Q_B05_LOWER_PAIN = NO AND Q_B05_FLANK = NO AND Q_B05_BLOOD = NO AND Q_GENITAL_ASSOC contains NONE AND Q_FEVER = NO AND Q_ILLNESS = WELL AND Q_URINE_OUTPUT = NORMAL',
            'DERMATITIS': 'Q_B06_LOOK = DRY AND Q_B06_CONTACT = YES AND Q_B06_INFECTION_FEATURES contains NONE AND Q_B06_SURFACE = NO AND Q_B06_SWELL = NO AND Q_B06_MED = NO AND Q_B06_SYSTEMIC = NO AND Q_FEVER = NO AND Q_B06_SPREAD = LOCAL',
            'CHRONIC_SKIN': 'Q_B06_CHRONIC = UNCHANGED AND Q_PLAN = ASSESSED AND Q_B06_MED = NO AND (Q_B06_LOOK != DRY OR Q_B06_CONTACT = NO) AND Q_B06_SWELL = NO AND Q_B06_SURFACE = NO AND Q_B06_SYSTEMIC = NO AND Q_B06_INFECTION_FEATURES contains NONE AND Q_FEVER = NO AND Q_ILLNESS = WELL AND Q_B06_SPREAD = LOCAL/MOVING AND Q_COURSE = STABLE/RECURRENT AND Q_FUNCTION = MILD/MODERATE',
            'SH11': 'PREG AND ((active(B03) AND Q_B03_PAIN = MILD/MODERATE/SEVERE) OR PELVIC OR VAGINAL_BLEED)',
            'SH12': 'Q_PREGNANCY = PREGNANT/POSSIBLE/RECENT AND (Q_PAIN_SEVERITY = SEVERE AND active(B02) OR Q_MATERNITY contains VISION/UPPER/SWELL)'
        };

        if (hardcodedMacros[ident]) {
            return evaluateCondition(hardcodedMacros[ident], env);
        }

        // Custom JS macro: LOW (Section 6.2 - only require components when scheduled)
        if (ident === 'LOW') {
            const ans = env.answers;
            if (env.isQuestionScheduled && env.isQuestionScheduled('Q_ILLNESS')) {
                if (ans['Q_ILLNESS'] && ans['Q_ILLNESS'] !== 'WELL' && ans['Q_ILLNESS'] !== 'TIRED') return false;
            }
            if (ans['Q_COURSE'] && ans['Q_COURSE'] !== 'IMPROVING' && ans['Q_COURSE'] !== 'STABLE') return false;
            if (ans['Q_FUNCTION'] && ans['Q_FUNCTION'] !== 'MILD') return false;
            if (ans['Q_PLAN'] === 'CHANGED') return false;
            return true;
        }

        // Custom JS macro: MIGRAINE
        if (ident === 'MIGRAINE') {
            const ans = env.answers;
            if (!ans['Q_B02_PATTERN'] || ans['Q_B02_PATTERN'] !== 'FAMILIAR') return false;
            if (!ans['Q_B02_ONSET'] || ans['Q_B02_ONSET'] !== 'GRADUAL') return false;
            if (!ans['Q_B02_LENGTH'] || ans['Q_B02_LENGTH'] !== 'H4_72') return false;
            
            let c = 0;
            if (ans['Q_B02_SIDE'] === 'ONE') c++;
            if (ans['Q_B02_FEEL'] === 'PULSE') c++;
            if (ans['Q_PAIN_SEVERITY'] === 'MODERATE' || ans['Q_PAIN_SEVERITY'] === 'SEVERE') c++;
            if (ans['Q_B02_ACTIVITY'] === 'YES') c++;
            if (c < 2) return false;

            const sense = Array.isArray(ans['Q_B02_SENSE']) ? ans['Q_B02_SENSE'] : [ans['Q_B02_SENSE']];
            if (!sense.includes('NAUSEA') && !(sense.includes('LIGHT') && sense.includes('SOUND'))) return false;

            if (ans['Q_B02_AURA'] !== 'NO' && ans['Q_B02_AURA'] !== 'USUAL') return false;
            if (ans['Q_PREGNANCY'] === 'PREGNANT' || ans['Q_PREGNANCY'] === 'POSSIBLE') return false;
            
            const neuro = ans['Q_NEURO'] || [];
            if (Array.isArray(neuro) && !neuro.includes('NONE')) return false;

            return evaluateCondition('Q_VISION = NONE/OLD AND Q_B02_NECK = NO AND Q_B02_JAW = NONE AND Q_B02_TRIGGER = NO AND Q_B02_INJURY = NO AND Q_B02_RISK contains NONE AND Q_IMMUNE = NO AND Q_FEVER = NO', env);
        }

        // Custom JS macro: UTI
        if (ident === 'UTI') {
            const basic = evaluateCondition('Q_ENTRY_AGE = A18_49/A50_64 AND Q_B05_ANATOMY = FEMALE AND Q_PREGNANCY != PREGNANT/POSSIBLE/RECENT AND Q_B05_CATHETER = NO AND Q_DIABETES = NO AND Q_IMMUNE = NO AND Q_FEVER = NO AND Q_B05_FLANK = NO AND Q_B05_LOWER_PAIN = NO AND Q_B05_BLOOD = NO AND Q_B05_RECUR = NO AND Q_B05_RESPONSE = EARLY/BETTER AND Q_GENITAL_ASSOC contains NONE', env);
            if (!basic) return basic;
            const key = env.answers['Q_B05_KEY'];
            if (!Array.isArray(key)) return false;
            const matchCount = key.filter(x => ['DYSURIA', 'NOCTURIA', 'CLOUDY'].includes(x)).length;
            return matchCount >= 2;
        }

        if (env.macros && env.macros[ident]) {
            return evaluateCondition(env.macros[ident], env);
        }

        // Standard comparison predicate: IDENT = VAL, IDENT != VAL, IDENT contains VAL
        let op = tokens[pos];
        if (op === '=' || op === '!=' || op === 'contains') {
            pos++;
            let valStr = tokens[pos++];
            let vals = valStr.split('/');
            let allVals = null;
            if (op === 'contains' && valStr === 'all') {
                allVals = (tokens[pos++] || '').split('/');
            }

            let ans = env.answers[ident];
            if (ans === undefined) {
                // If question belongs to a specific branch that is not active, it is definitively NOT_APPLICABLE (Section 6, line 3741)
                const branchMatch = ident.match(/^Q_([A-Z][0-9]{2})/);
                if (branchMatch && env.activeBranches && !env.activeBranches.has(branchMatch[1])) {
                    return false;
                }

                // If question is not in active branches' question schedule/dependencies, it is not applicable here
                if (env.isQuestionScheduled && !env.isQuestionScheduled(ident)) {
                    return op === '!=';
                }

                // If question has been definitively ruled inapplicable
                if (env.isQuestionApplicable && env.isQuestionApplicable(ident) === false) {
                    return op === '!=';
                }
                return null; // Unresolved / pending question
            }

            // Treat DECLINE in Q_RECOVERY as deterioration
            if (ident === 'Q_RECOVERY' && ans === 'DECLINE' && (vals.includes('DECLINE') || vals.includes('WOUND'))) {
                return true;
            }

            // User uncertainty
            if (ans === 'UNKNOWN' || (Array.isArray(ans) && ans.includes('UNKNOWN'))) {
                if (vals.includes('UNKNOWN')) return true;
                if (ident === 'Q_L07_HARM') return false;
                return null;
            }

            if (op === '=') {
                if (Array.isArray(ans)) {
                    if (ans.length === 1) return vals.includes(ans[0]);
                    return false;
                }
                return vals.includes(ans);
            } else if (op === '!=') {
                if (Array.isArray(ans)) {
                    for (let v of vals) {
                        if (ans.includes(v)) return false;
                    }
                    return true;
                }
                return !vals.includes(ans);
            } else if (op === 'contains') {
                if (allVals) {
                    if (!Array.isArray(ans)) return false;
                    for (let v of allVals) {
                        if (!ans.includes(v)) return false;
                    }
                    return true;
                }
                if (!Array.isArray(ans)) return vals.includes(ans);
                for (let v of vals) {
                    if (ans.includes(v)) return true;
                }
                return false;
            }
        }

        // Implicit boolean check
        let ans = env.answers[ident];
        if (ans !== undefined) return (ans === 'YES' || ans === true);

        return null;
    }

    return parseExpression();
}

function tokenize(str) {
    const tokens = [];
    let i = 0;
    while (i < str.length) {
        if (/\s/.test(str[i])) {
            i++;
            continue;
        }
        if (str[i] === '(' || str[i] === ')') {
            tokens.push(str[i]);
            i++;
            continue;
        }
        if (str[i] === '=' || str.startsWith('!=', i)) {
            if (str[i] === '=') {
                tokens.push('=');
                i++;
            } else {
                tokens.push('!=');
                i += 2;
            }
            continue;
        }

        let word = '';
        while (i < str.length && /[a-zA-Z0-9_/\.]/.test(str[i])) {
            word += str[i];
            i++;
        }
        if (word) {
            tokens.push(word);
        } else {
            i++;
        }
    }
    return tokens;
}

function logicAnd(a, b) {
    if (a === false || b === false) return false;
    if (a === true && b === true) return true;
    return null;
}

function logicOr(a, b) {
    if (a === true || b === true) return true;
    if (a === false && b === false) return false;
    return null;
}

function logicNot(a) {
    if (a === null) return null;
    return !a;
}
