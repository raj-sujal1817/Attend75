const { DateTime } = require("luxon");

// Attendance Calculator

function calculateTotalClasses(subject, semester) {

  let totalClasses = 0;

  let currentDate = DateTime
    .fromJSDate(semester.startDate)
    .setZone("Asia/Kolkata")
    .startOf("day");

  const endDate = DateTime
    .fromJSDate(semester.endDate)
    .setZone("Asia/Kolkata")
    .startOf("day");

  const subjectDays = subject.schedule.map(item => item.day);

  while (currentDate <= endDate) {

    const currentDay = currentDate.toFormat("cccc");

    if (subjectDays.includes(currentDay)) {
      totalClasses++;
    }

    currentDate = currentDate.plus({ days: 1 });
  }

  return totalClasses;
}

module.exports = calculateTotalClasses;