// Total workingdays calculator ...

function getWorkingDays(startDate) {
  const start = new Date(startDate);
  start.setHours(0,0,0,0);
  console.log("SEM START DATE : ", start);
  const today = new Date();
  today.setHours(0,0,0,0); 

  console.log("NEW DATE : ", today);
  
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
