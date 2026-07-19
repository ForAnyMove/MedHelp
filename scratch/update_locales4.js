const fs = require('fs');
const path = require('path');

const ruPath = path.join(__dirname, '../src/locales/ru.json');
const enPath = path.join(__dirname, '../src/locales/en.json');

const ru = JSON.parse(fs.readFileSync(ruPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

ru.doctor_history.title = "История консультаций";
ru.doctor_history.empty_title = "Нет консультаций";
ru.doctor_history.empty_desc = "Здесь будут отображаться ваши консультации.";

en.doctor_history.title = "Consultation History";
en.doctor_history.empty_title = "No consultations yet";
en.doctor_history.empty_desc = "Your consultations will appear here.";

fs.writeFileSync(ruPath, JSON.stringify(ru, null, 2), 'utf8');
fs.writeFileSync(enPath, JSON.stringify(en, null, 2), 'utf8');
console.log('Locales updated!');
