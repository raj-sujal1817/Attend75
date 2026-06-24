// find how many classes need to get 75% 


function needDaysFor75( PresentDays, actulWorkingDays){
    let x=0;

    while((PresentDays + x)/(actulWorkingDays + x ) < 0.75 ){
      x++;
    }

    return x;

  }

  
module.exports = needDaysFor75;
