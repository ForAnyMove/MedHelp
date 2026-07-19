const consultations = [
  { date: "2026-07-11T12:00:00.000Z" },
  { date: "2026-07-11T23:00:00.000Z" },
  { date: "2026-07-10T23:00:00.000Z" }
];

const toLocalDateString = (d) => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const today = new Date(); // local time 2026-07-11 19:46 +0200
const todayStr = toLocalDateString(today);

console.log("todayStr:", todayStr);

consultations.forEach(c => {
  const d = new Date(c.date);
  console.log(c.date, "=>", toLocalDateString(d));
});
