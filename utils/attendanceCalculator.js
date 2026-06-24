//Attendance Calculator ...//

function calculateTotalClasses(subject, semester) {
  let totalClasses = 0;

  const startDate = new Date(semester.startDate);
  const endDate = new Date(semester.endDate);

  // subject k saare class days se nikaalo...
  const subjectDays = subject.schedule.map(
    item => item.day
  );
  
  // Start date ki copy banao

  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {

    const currentDay = currentDate.toLocaleDateString(
      "en-US",
      {
        weekday: "long"
      }
    );

    //Agar current day subject ke schedule me hai 
    if(subjectDays.includes(currentDay)) {
      totalClasses++;
    }
    //next day

    currentDate.setDate(
      currentDate.getDate() + 1
    );
  }
  return totalClasses;
}

module.exports = calculateTotalClasses;






