/**
 * Helper to map symptom-checker specialty codes to doctor profession_codes
 * and validate specialty matching.
 */

export function mapQuizSpecialtyToProfession(quizSpec) {
  switch (quizSpec) {
    case 'SP_FAMILY_MEDICINE': return 'general_practitioner';
    case 'SP_INTERNAL_MEDICINE': return 'general_practitioner';
    case 'SP_ENT': return 'ent';
    case 'SP_NEUROLOGY': return 'neurologist';
    case 'SP_GASTROENTEROLOGY': return 'gastroenterologist';
    case 'SP_DERMATOLOGY': return 'dermatologist';
    case 'SP_UROLOGY': return 'urologist';
    case 'SP_OBSTETRICS_GYNECOLOGY': return 'gynaecologist';
    case 'SP_ORTHOPEDICS': return 'orthopedist';
    case 'SP_RHEUMATOLOGY': return 'rheumatologist';
    case 'SP_CARDIOLOGY': return 'cardiologist';
    case 'SP_PULMONOLOGY': return 'pulmonologist';
    case 'SP_OPHTHALMOLOGY': return 'ophthalmologist';
    case 'SP_DENTISTRY': return 'dentist';
    case 'SP_PSYCHIATRY': return 'psychiatrist';
    case 'SP_EMERGENCY_MEDICINE': return 'general_practitioner';
    default: return null;
  }
}

/**
 * Validates if the selected doctor is clinically appropriate for the checkup's recommendation.
 * - General practitioners / family doctors can receive any general assessment.
 * - If no specialty recommendation is set, any doctor is allowed.
 * - If a specific specialty is recommended, it must match the doctor's profession_code.
 *
 * @param {string|null} checkupSpec - e.g. 'neurologist', 'cardiologist'
 * @param {string|null} doctorSpec - e.g. 'dentist', 'neurologist', 'general_practitioner'
 * @returns {boolean}
 */
export function isSpecialtyMatching(checkupSpec, doctorSpec) {
  if (!checkupSpec) return true;
  if (!doctorSpec) return false;
  
  const normDoctor = String(doctorSpec).toLowerCase().trim();
  const normCheckup = String(checkupSpec).toLowerCase().trim();

  // General practitioners / family doctors are universal triage physicians
  if (normDoctor === 'general_practitioner' || normDoctor === 'family_doctor' || normDoctor === 'general') {
    return true;
  }

  return normDoctor === normCheckup;
}
