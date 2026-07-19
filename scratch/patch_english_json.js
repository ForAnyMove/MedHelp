const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const ruPath = path.join(srcDir, 'locales', 'ru.json');
const enPath = path.join(srcDir, 'locales', 'en.json');

const ruData = JSON.parse(fs.readFileSync(ruPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const translations = {
  // ErrorState
  'common.oops': { en: 'Oops!', ru: 'Ой!' },
  'common.try_again': { en: 'Try again', ru: 'Попробовать снова' },
  
  // HealthOverview / Patient Dashboard
  'dashboard.results_ready': { en: 'Results ready', ru: 'Результаты готовы' },
  'dashboard.results_ready_desc': { en: 'The doctor has finished your summary & recommendations. You can view them now.', ru: 'Доктор подготовил заключение и рекомендации. Вы можете посмотреть их сейчас.' },
  'dashboard.view_results': { en: 'View Results', ru: 'Посмотреть результаты' },
  'dashboard.lab_results_ready': { en: 'Lab Results Ready', ru: 'Результаты анализов готовы' },
  'dashboard.lab_results_ready_desc': { en: 'Your lab test results are ready for your review.', ru: 'Результаты ваших анализов готовы к просмотру.' },
  'dashboard.view_lab_results': { en: 'View Lab Results', ru: 'Посмотреть анализы' },
  'dashboard.preparing_results': { en: 'Preparing results', ru: 'Подготовка результатов' },
  'dashboard.preparing_results_desc': { en: 'Your consultation has ended. The doctor is writing your summary & recommendations.', ru: 'Консультация завершена. Доктор пишет заключение и рекомендации.' },
  'dashboard.ready_within_30': { en: 'Usually ready within 30 min', ru: 'Обычно готово в течение 30 минут' },
  'dashboard.notify_when_ready': { en: "We'll notify you when ready", ru: 'Мы уведомим вас о готовности' },
  'dashboard.waiting_for_labs': { en: 'Waiting for Labs', ru: 'Ожидание анализов' },
  'dashboard.waiting_for_labs_desc': { en: "Your lab test is being processed. We will notify you when it's ready.", ru: 'Ваш анализ обрабатывается. Мы уведомим вас о готовности.' },
  
  // LabResultsBanner
  'dashboard.ready_for_review': { en: 'Ready for your review', ru: 'Готово к просмотру' },

  // CallScreen
  'call.you_are_muted_tap': { en: 'You are muted. Tap to unmute', ru: 'Звук выключен. Нажмите, чтобы включить' },
  'call.waiting_for_others': { en: 'Waiting for others...', ru: 'Ожидание участников...' },
  'call.muted': { en: 'Muted', ru: 'Без звука' },
  'call.minimize': { en: 'Minimize', ru: 'Свернуть' },
  'call.mute': { en: 'Mute', ru: 'Выкл. звук' },
  'call.camera': { en: 'Camera', ru: 'Камера' },
  'call.end': { en: 'End', ru: 'Завершить' },
  'call.notes': { en: 'Notes', ru: 'Заметки' },
  'call.record': { en: 'Record', ru: 'Запись' },
  'call.more': { en: 'More', ru: 'Еще' },
  'call.type_note_here': { en: 'Type your note here...', ru: 'Введите вашу заметку здесь...' },
  'call.camera_issue': { en: 'Camera Issue', ru: 'Проблема с камерой' },
  'call.camera_failed': { en: 'Failed to access video. Camera might be in use by another application.', ru: 'Не удалось получить доступ к видео. Камера может использоваться другим приложением.' },

  // RequestPayout
  'doctor_dashboard.privat_bank': { en: 'Privat Bank', ru: 'Приват Банк' },

  // DoctorConsultationForm & Summary
  'consultation.editing_sent_summary': { en: 'Editing a sent summary — the patient will receive a notification about the update.', ru: 'Редактирование отправленного заключения — пациент получит уведомление об обновлении.' },
  'consultation.private_notes_prefilled': { en: 'Your private notes have been pre-filled below. Please adjust any formatting if needed before saving.', ru: 'Ваши личные заметки были предварительно заполнены ниже. Пожалуйста, откорректируйте форматирование перед сохранением, если необходимо.' },
  'consultation.overview': { en: 'Overview', ru: 'Обзор' },
  'consultation.required': { en: 'Required', ru: 'Обязательно' },
  'consultation.optional': { en: 'Optional', ru: 'Необязательно' },
  'consultation.patient_has': { en: 'Patient has', ru: 'У пациента' },
  'consultation.add_finding': { en: 'Add finding', ru: 'Добавить симптом/находку' },
  'consultation.diagnosis': { en: 'Diagnosis', ru: 'Диагноз' },
  'consultation.add_recommendation': { en: 'Add recommendation', ru: 'Добавить рекомендацию' },
  'consultation.next_steps': { en: 'Next steps', ru: 'Следующие шаги' },
  'consultation.add_step': { en: 'Add step', ru: 'Добавить шаг' },
  'consultation.prescription': { en: 'Prescription', ru: 'Назначения (Рецепт)' },
  'consultation.eg_discussed': { en: 'e.g. During the consultation we discussed your test results.', ru: 'напр. Во время консультации мы обсудили результаты ваших анализов.' },
  'consultation.eg_ferritin': { en: 'e.g. Low ferritin', ru: 'напр. Низкий ферритин' },
  'consultation.icd10': { en: 'ICD-10 code', ru: 'Код МКБ-10' },
  'consultation.eg_d50': { en: 'e.g. D50', ru: 'напр. D50' },
  'consultation.diagnosis_name': { en: 'Diagnosis name', ru: 'Название диагноза' },
  'consultation.eg_anemia': { en: 'e.g. Iron deficiency anemia', ru: 'напр. Железодефицитная анемия' },
  'consultation.eg_supplements': { en: 'e.g. Consider taking iron supplements', ru: 'напр. Рассмотрите прием препаратов железа' },
  'consultation.eg_repeat_tests': { en: 'e.g. Repeat tests in 4-6 weeks', ru: 'напр. Повторите анализы через 4-6 недель' },
  'consultation.eg_vitamin': { en: 'e.g. Vitamin D 5000 IU', ru: 'напр. Витамин D 5000 МЕ' },
  
  'consultation.no_result_data': { en: 'No result data found.', ru: 'Данные результатов не найдены.' },
  'consultation.summary': { en: 'Summary', ru: 'Заключение' },
  'consultation.sent': { en: 'Sent', ru: 'Отправлено' },
  'consultation.you_have': { en: 'You have:', ru: 'У вас:' },
  'consultation.prescriptions': { en: 'Prescriptions', ru: 'Рецепты / Назначения' },
  'consultation.fill_results': { en: 'Fill results', ru: 'Заполнить результаты' },
  'consultation.files_from_visit': { en: 'Files from this visit', ru: 'Файлы с этого визита' },
  'consultation.reason_for_visit': { en: 'Reason for visit', ru: 'Причина визита' },
  'consultation.reason': { en: 'Reason:', ru: 'Причина:' },
  
  // History Screens
  'history.all_consultations': { en: 'All Consultations', ru: 'Все консультации' },
  'history.search_by_patient': { en: 'Search by patient', ru: 'Поиск по пациенту' },
  'history.search_by_doctor': { en: 'Search by doctor', ru: 'Поиск по доктору' },
  
  'history.patient_profile': { en: 'Patient profile', ru: 'Профиль пациента' },
  'history.doctor_profile': { en: 'Doctor profile', ru: 'Профиль доктора' },
  'history.doctor_not_found': { en: 'Doctor not found.', ru: 'Доктор не найден.' },
  'history.personal_info': { en: 'Personal info', ru: 'Личная информация' },
  'history.medical_data': { en: 'Medical data', ru: 'Медицинские данные' },
  'history.visit_history': { en: 'Visit history with you', ru: 'История визитов к вам' },
  'history.visit_history_general': { en: 'Visit history', ru: 'История визитов' },
  'history.no_lab_results': { en: 'No lab results found.', ru: 'Результаты анализов не найдены.' },
  'history.no_documents': { en: 'No documents found.', ru: 'Документы не найдены.' },
  'history.no_previous_visits': { en: 'No previous visits.', ru: 'Нет предыдущих визитов.' },
  'history.no_reviews_yet': { en: 'No reviews yet.', ru: 'Пока нет отзывов.' },
  'history.no_documents_uploaded': { en: 'No documents uploaded.', ru: 'Документы не загружены.' },
  'history.uploaded_from_labs': { en: 'Uploaded from Labs', ru: 'Загружено из анализов' },
  'history.from_consultations': { en: 'From consultations', ru: 'Из консультаций' },
  'history.about': { en: 'About', ru: 'О враче' },
  'history.details': { en: 'Details', ru: 'Детали' },

  // Profile Edit
  'common.email': { en: 'Email', ru: 'Email' },
  'common.error': { en: 'Error', ru: 'Ошибка' },
  'common.success': { en: 'Success', ru: 'Успешно' },
  
  // Consultation
  'consultation.rating_submitted': { en: 'Rating submitted successfully!', ru: 'Отзыв успешно отправлен!' },
  'consultation.summary_desc': { en: "Doctor's diagnosis, conclusion, recommendations & next steps.", ru: 'Диагноз врача, заключение, рекомендации и дальнейшие шаги.' }
};

function setNestedValue(obj, keyPath, value) {
  const keys = keyPath.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

for (const [key, trans] of Object.entries(translations)) {
  setNestedValue(ruData, key, trans.ru);
  setNestedValue(enData, key, trans.en);
}

fs.writeFileSync(ruPath, JSON.stringify(ruData, null, 2) + '\n', 'utf8');
fs.writeFileSync(enPath, JSON.stringify(enData, null, 2) + '\n', 'utf8');

console.log('JSON files updated with English translations.');
