const fs = require('fs');
const path = require('path');

const ruPath = path.join(__dirname, '../src/locales/ru.json');
const enPath = path.join(__dirname, '../src/locales/en.json');

const ru = JSON.parse(fs.readFileSync(ruPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const updatesRu = {
  "doctor_consultation": {
    "patient_fallback": "Пациент",
    "no_result_data": "Нет данных о результатах",
    "fill_results": "Заполнить результаты",
    "notes": "Заметки",
    "summary": "Сводка",
    "sent": "Отправлено",
    "you_have": "У вас есть",
    "diagnosis": "Диагноз",
    "prescriptions": "Рецепты",
    "patient_access_desc": "Пациент имеет доступ к этой информации."
  },
  "history": {
    "patients_count": "Пациентов",
    "upcoming_consultations_count": "Предстоящие",
    "comments_count": "Отзывы",
    "metrics": {
      "hemoglobin": "Гемоглобин",
      "ferritin": "Ферритин",
      "cholesterol": "Холестерин"
    }
  },
  "doctor_history": {
    "fill_results": "Заполнить результаты",
    "overview": "Обзор",
    "next_steps": "Следующие шаги",
    "prescription": "Рецепт",
    "reviews_count": "{{count}} отзывов"
  },
  "doctor_dashboard": {
    "booked": "Забронировано"
  },
  "consultation": {
    "duration_val": "{{duration}} мин",
    "no_consultations_day": "Нет консультаций в этот день"
  },
  "common": {
    "years_old": "{{count}} лет",
    "other": "Другое"
  },
  "profile": {
    "hidden_count": "Скрыто: {{count}}"
  },
  "auth": {
    "email": "Электронная почта"
  }
};

const updatesEn = {
  "doctor_consultation": {
    "patient_fallback": "Patient",
    "no_result_data": "No result data",
    "fill_results": "Fill results",
    "notes": "Notes",
    "summary": "Summary",
    "sent": "Sent",
    "you_have": "You have",
    "diagnosis": "Diagnosis",
    "prescriptions": "Prescriptions",
    "patient_access_desc": "The patient has access to this information."
  },
  "history": {
    "patients_count": "Patients",
    "upcoming_consultations_count": "Upcoming",
    "comments_count": "Reviews",
    "metrics": {
      "hemoglobin": "Hemoglobin",
      "ferritin": "Ferritin",
      "cholesterol": "Cholesterol"
    }
  },
  "doctor_history": {
    "fill_results": "Fill results",
    "overview": "Overview",
    "next_steps": "Next steps",
    "prescription": "Prescription",
    "reviews_count": "{{count}} reviews"
  },
  "doctor_dashboard": {
    "booked": "Booked"
  },
  "consultation": {
    "duration_val": "{{duration}} min",
    "no_consultations_day": "No consultations on this day"
  },
  "common": {
    "years_old": "{{count}} y.o.",
    "other": "Other"
  },
  "profile": {
    "hidden_count": "Hidden: {{count}}"
  },
  "auth": {
    "email": "Email"
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
