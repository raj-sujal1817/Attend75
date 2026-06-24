// Total workingdays calculator ...

function getWorkingDays(startDate) {
  let start = new Date(startDate);
  start.setHours(0,0,0,0);
  let today = new Date();
  today.setHours(0,0,0,0);
  
  let workingDays = 0;

  while(start <= today) {
    if(start.getDay()!==0) { //sunday = 0
      workingDays++;
    }
    start.setDate(start.getDate() + 1);
  }

  return workingDays;

}

module.exports = getWorkingDays;
