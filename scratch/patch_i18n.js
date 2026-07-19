const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const ruPath = path.join(srcDir, 'locales', 'ru.json');
const enPath = path.join(srcDir, 'locales', 'en.json');

const ruData = JSON.parse(fs.readFileSync(ruPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Keys explicitly provided by user and known Cyrillic strings
const explicitTranslations = {
  'auth.invalid_format': { ru: 'Невалидный формат', en: 'Invalid format' },
  'errors.general': { ru: 'Произошла ошибка', en: 'General error' },
  'common.confirm': { ru: 'Подтвердить', en: 'Confirm' },
  'consultation.call_error_msg': { ru: 'Что-то пошло не так со звонком', en: 'Something with call was wrong' },
  'common.unknown_date': { ru: 'Неизвестная дата', en: 'Unknown date' },
  'consultation.finding_monitoring': { ru: 'Мониторинг', en: 'Monitoring' },
  'consultation.finding_cholesterol': { ru: 'Холестерин', en: 'Cholesterol' },
  'consultation.finding_ferritin': { ru: 'Ферритин', en: 'Fetritin' },
  'common.no_results': { ru: 'Нет результатов', en: 'No results' },
  'notifications.consultation_completed': { ru: 'Консультация завершена', en: 'Consultation completed' },
  'notifications.consultation_completed_body': { ru: 'Доктор завершил консультацию', en: 'Doctor has completed the consultation' },
  'notifications.booking_rescheduled': { ru: 'Перенос консультации', en: 'Booking rescheduled' },
  'notifications.booking_rescheduled_patient': { ru: 'Пациент перенес дату консультации', en: 'Patient rescheduled the consultation date' },
  'notifications.booking_rescheduled_doctor': { ru: 'Врач перенес дату консультации', en: 'Doctor rescheduled the consultation date' },
  'notifications.consultation_resumed': { ru: 'Консультация возобновлена', en: 'Doctor resumed the consultation' },
  'actions.messages': { ru: 'Сообщения', en: 'Messages' },
  'chat.connecting_call': { ru: 'Подключение к звонку...', en: 'Connecting to call...' },
  'common.cancel': { ru: 'Отмена', en: 'Cancel' },
  'actions.chat': { ru: 'Чат', en: 'Chat' },
  'doctor_dashboard.break_between_sessions': { ru: 'Перерыв между сеансами', en: 'Break between sessions' },
  'consultation.waiting_for_results': { ru: 'Необходимо дождаться результатов консультации от доктора', en: 'You need to wait for the consultation results from the doctor' },
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
  if (!current[keys[keys.length - 1]]) {
    current[keys[keys.length - 1]] = value;
  }
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const tRegex = /\bt\(\s*['"`]([^'"`]+)['"`](?:\s*,\s*['"`]([^'"`]+)['"`])?\s*\)/g;
  
  let match;
  while ((match = tRegex.exec(content)) !== null) {
    const key = match[1];
    const defaultValue = match[2] || '';
    
    // Ignore common.time keys as they are dynamic with pluralization
    if (key.startsWith('common.time.minutes_ago') || 
        key.startsWith('common.time.hours_ago') || 
        key.startsWith('common.time.days_ago') ||
        key.includes('${')) {
      continue;
    }

    if (explicitTranslations[key]) {
      setNestedValue(ruData, key, explicitTranslations[key].ru);
      setNestedValue(enData, key, explicitTranslations[key].en);
    } else {
      // If we don't have it explicitly, use default if present. 
      // Default in codebase is usually Russian, so for EN we might just put the default or key if no default.
      setNestedValue(ruData, key, defaultValue || key);
      setNestedValue(enData, key, defaultValue || key); // The user can fix English later if defaults are in Russian
    }
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
      processFile(filePath);
    }
  }
}

walkDir(srcDir);

// Apply explicit ones even if they are not in t() yet
for (const [key, trans] of Object.entries(explicitTranslations)) {
  setNestedValue(ruData, key, trans.ru);
  setNestedValue(enData, key, trans.en);
}

fs.writeFileSync(ruPath, JSON.stringify(ruData, null, 2) + '\n', 'utf8');
fs.writeFileSync(enPath, JSON.stringify(enData, null, 2) + '\n', 'utf8');

console.log('JSON files updated.');
