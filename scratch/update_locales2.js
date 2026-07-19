const fs = require('fs');
const path = require('path');

const ruPath = path.join(__dirname, '../src/locales/ru.json');
const enPath = path.join(__dirname, '../src/locales/en.json');

const ru = JSON.parse(fs.readFileSync(ruPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const updatesRu = {
  "history": {
    "vitamins": {
      "vitamin_a": "Витамин A",
      "vitamin_b": "Витамин B",
      "vitamin_d": "Витамин D",
      "vitamin_c": "Витамин C"
    },
    "types": {
      "blood_test": "Анализ крови",
      "consultation": "Консультация"
    },
    "categories": {
      "thyroid": "Щитовидная железа"
    }
  }
};

const updatesEn = {
  "history": {
    "vitamins": {
      "vitamin_a": "Vitamin A",
      "vitamin_b": "Vitamin B",
      "vitamin_d": "Vitamin D",
      "vitamin_c": "Vitamin C"
    },
    "types": {
      "blood_test": "Blood test",
      "consultation": "Consultation"
    },
    "categories": {
      "thyroid": "Thyroid"
    }
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
