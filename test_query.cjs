const { getPresentesByDate } = require('./server/attendance.ts');

try {
  const result = getPresentesByDate('2026-06-09');
  console.log("Success, length:", result.length);
} catch(e) {
  console.error("Error executing query:", e);
}
