const { DateTime } = require("luxon");

// Total working days calculator

function getWorkingDays(startDate) {

  let start = DateTime
    .fromJSDate(startDate)
    .setZone("Asia/Kolkata")
    .startOf("day");

  const today = DateTime
    .now()
    .setZone("Asia/Kolkata")
    .startOf("day");

  let workingDays = 0;

  while (start <= today) {

    if (start.weekday !== 7) {   // Sunday = 7 in Luxon
      workingDays++;
    }

    start = start.plus({ days: 1 });
  }

  return workingDays;
}

module.exports = getWorkingDays;