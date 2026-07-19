const fs = require('fs');
const path = require('path');

const ruPath = path.join(__dirname, '../src/locales/ru.json');
const enPath = path.join(__dirname, '../src/locales/en.json');

const ru = JSON.parse(fs.readFileSync(ruPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const updatesRu = {
  "consultation": {
    "notes": "Заметки",
    "timer": "Таймер",
    "calendar_title": "Расписание",
    "select_day_hint": "Выберите день",
    "no_scheduled": "Нет запланированных",
    "summary_title": "Результаты",
    "completed": "Завершена",
    "recommendations": "Рекомендации",
    "view_history": "История",
    "book_next": "Записаться еще"
  }
};

const updatesEn = {
  "consultation": {
    "notes": "Notes",
    "timer": "Timer",
    "calendar_title": "Schedule",
    "select_day_hint": "Select a day",
    "no_scheduled": "No appointments scheduled",
    "summary_title": "Results",
    "completed": "Completed",
    "recommendations": "Recommendations",
    "view_history": "History",
    "book_next": "Book again"
  }
};

function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      Object.assign(source[key], deepMerge(target[key], source[key]));
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

deepMerge(ru, updatesRu);
deepMerge(en, updatesEn);

fs.writeFileSync(ruPath, JSON.stringify(ru, null, 2), 'utf8');
fs.writeFileSync(enPath, JSON.stringify(en, null, 2), 'utf8');
console.log('Locales updated!');
