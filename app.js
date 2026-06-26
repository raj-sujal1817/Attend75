require('dotenv').config();

const express = require("express");
const mongoose = require("mongoose");

const dns = require("dns");

dns.setServers(["1.1.1.1", "8.8.8.8"]);


const bcrypt = require("bcrypt");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;

const path = require("path");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const app = express();

const userInfo = require("./models/loginfo");  // userInfo is a collection of u75 db..
const userSubject = require("./models/subjectsModel")  // userSubject is a collection of u75 db..
const semester = require("./models/semesterSet")  // semester is a collection of u75 db..
const attendanceCalculator = require("./utils/attendanceCalculator");
const calculateTotalClasses = require("./utils/attendanceCalculator");
const dailyMark = require("./models/attendReview");
const getWorkingDays = require("./utils/workingDaysCalci");
const needToGet75 = require("./utils/needClassesCalci");
const { start } = require("repl");
const { Stats } = require("fs");

// MogoDB Connection 

  const dbUrl =  process.env.MONGO_URI;




  try {

    mongoose.connect(dbUrl);
    console.log("CONNECTED");
    }catch(err){
      console.log("NOT CONNECTED");
      console.log(err);
  }
 


  

// console.log(require("connect-mongo"));

//Session 

app.use(
  session({
    secret: "attend75secret",
    resave: false,
    saveUninitialized: false,

    store: MongoStore.create({
      mongoUrl: dbUrl
    }),

    cookie: {
      maxAge: 7*24*60*60*1000
    }

  })

);

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true}));
app.use(express.static(path.join(__dirname, "/piblic")));


// starting ...//




// Globally execute for all .ejs file...//

app.use((req, res, next) => {
  res.locals.formateTime = function(time){
    let [hours, minutes] = time.split(":");
    hours = Number(hours);
    
    let ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    let ABC;

    return `${hours}:${minutes} ${ampm}`;
  };

  next();

});




//home route 


app.get("/", (req, res) => {
  if(req.session.userId) {
    return res.redirect("/dashboard");
  }
  res.redirect("/login");
});

// Sigup page

app.get("/signup", (req, res) => {
  res.render("users/signup.ejs");
});

// Signup Logic

app.post("/signup", async (req, res) => {

  try {

  const {username, email, password} = req.body;
  const existingUser = await userInfo.findOne({email});

  if(existingUser){
    return res.send("User Already Exists");
  }
  
  const hashedPassword = await bcrypt.hash(password,10);

  const newUser = new userInfo({
    username,
    email,
    password: hashedPassword
  });
  await newUser.save();
  res.redirect("/login");

  }catch(err){
    console.log(err);
    res.send("something went wrong.");

  };
  
});

// Login Page

app.get("/login", (req, res) => {
  res.render("users/login.ejs");
});


//login logic 

app.post("/login", async (req, res) =>{
  try {
    const {email, password} = req.body;
    const user = await userInfo.findOne({email});

    if(!user){
      return res.send("User Not Found");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch){
      res.send("Wrong Password");
    }

    req.session.userId = user._id;

    res.redirect("/");
  }catch(err){
    console.log(err);
    res.send("Something went wrong.");
  }
});


//middilware function 

app.use(async (req, res, next) => {
  if(req.session.userId){
    let user = await userInfo.findById(req.session.userId);
    res.locals.user = user;
  }
  next();
});

// Logout

app.get("/logout", (req, res) => {
  req.session.destroy(()=>{
    res.redirect("/login");
  });

});


// semester Setup 

app.get("/semester/setup", async (req, res) => {
  const sem = await semester.findOne({user: req.session.userId});
  console.log("CODING IS THE MONEY............");
  console.log(sem);
  res.render("semester/setup.ejs", {semester: sem});
});


app.post("/semester/setup", async (req, res) => {


  try {

      const {
      semesterName,
      startDate,
      endDate,
    } = req.body;

    const semInfo = await semester.findOneAndUpdate(

      {
        user: req.session.userId
      },

      {
        semesterName,
        startDate,
        endDate,
        user: req.session.userId
      },

      {
        upsert: true,
        new: true
      }
    );

    // const subjects = await userSubject.find({ user: req.session.userId});

    // for(let sub of subjects) {
    //   const totalClasses = await calculateTotalClasses(sub,semInfo);
    //   console.log("HERE is present data of how many classes of each subject by each sub");
    //   // console.log(totalClasses);
    //   sub.totalClasses = totalClasses;

    //   await sub.save();
    // }

    res.redirect("/dashboard");

  }catch(err){
    console.log(err);
    res.send("Something went wrong.");
  }



});




app.get("/time-check", (req, res) => {
  res.json({
    now: new Date(),
    iso: new Date().toISOString(),
    local: new Date().toString(),
    timezoneOffset: new Date().getTimezoneOffset()
  });
});





// dashboard

app.get("/dashboard", async (req, res) => {

  try{

    
    const userId = req.session.userId;

    const subjects = await userSubject.find({user: userId});

    // console.log(subjects);



    let dailySchedule = [];
    let dashboardShow = [];



    for (let subject of subjects) {

    


      // srif Aaj ki classes ko show krana hai dashboard pr ....

      for(let cls of subject.schedule){

        // AAj ka day...

        const todayDay = new Date().toLocaleDateString("en-US", {weekday: "long"});

        // Srif Aaj Waali classes

        if(cls.day === todayDay){

          let room = "apna class";

            dailySchedule.push({
              
            subjectId: subject._id,
            name: subject.name,
            startTime: cls.start,
            // endTime: cls.end,
            apnaClass: room,
            

          });
        } 
      }








      // ye neeche waala concept dono for loop k use ka hai
      // jo each subject k total persent,absent,cancel,holiday ko count kr 
      // each subject ka percentage bta rha....


      const presentCount = await dailyMark.countDocuments({
        user: userId,
        subject: subject._id,
        status: "present"
      });

      const absentCount = await dailyMark.countDocuments({
        user: userId,
        subject: subject._id,
        status: "absent"
      });

      const holidayCount = await dailyMark.countDocuments({
        user: userId,
        subject: subject._id,
        status: "holiday"
      });

      const cancelCount = await dailyMark.countDocuments({
        user: userId,
        subject: subject._id,
        status: "cancel"
      });

      const finalClasses =  subject.totalClasses - holidayCount - cancelCount;

      const finalPercent = finalClasses > 0 ? (presentCount * 100) / finalClasses : 0;



      //push

        dashboardShow.push({

        // subjectId: subject._id,

        subjectName: subject.name,

        // totalClasses: subject.totalClasses,

        // finalClasses : finalClasses,

        presentCount,

        // absentCount,

        // holidayCount,

        // cancelCount,

        finalPercent: finalPercent.toFixed(1)

      });

      // console.log(dashboardShow);


    }




    // Left days in Semester..2

    const semInfo = await semester.findOne({ user: userId});

    if(!semInfo) {
      return res.redirect("/semester/setup");
    }



    let leftDays = 0;
    let passDays = 0;


    const exactDate = new Date();
    exactDate.setHours(0,0,0,0);

    console.log("exactDate : ", exactDate.toString());



      const endDate = new Date(semInfo.endDate);
      endDate.setHours(0,0,0,0);
      const startDate = new Date(semInfo.startDate);
      startDate.setHours(0,0,0,0);

      console.log("SEM START DATE : ", startDate);


    if(semInfo){
      
      const diff = endDate - exactDate;


      leftDays = Math.ceil( diff / (1000*60*60*24));

    }

    











    // BIOMETRIC LOGIC.....


    // finding total workingDays....1

    // const sem = await semester.findOne({
    //   user: userId
    // });

    


    // const startingDate = semInfo.startDate
    // // console.log("Starting date of the semester : ",startingDate);
    // const endingDate = semInfo.endDate;

    // const ttotal = Math.ceil(endDate - startDate)/(1000 * 60 * 60 * 24);
    // console.log("ttotal :", ttotal);

    // const ttoday = Math.ceil((exactDate) - (startDate))/(1000 * 60 * 60 * 24);
    // console.log("ttoday :", ttoday);


    const workingDays = getWorkingDays(startDate);
    console.log("Working Days : ", workingDays);

    // console.log("workingDays:" ,workingDays);

    





    // for total present days finding...

    const presentDates = await dailyMark.distinct("date",
      {
        user: userId,
        status: "present"
      }
    );

    const userPresentDays = presentDates.length;
    console.log("presentdays : ", userPresentDays);

    // for total holidays finding...

    const holidayDates = await dailyMark.distinct("date",
      {
        user: userId,
        status: "holiday"
      }
    );

      const userHolidays = holidayDates.length;
      // console.log("userHolidays : ", userHolidays);

      const actulWorkingDays = workingDays - userHolidays ;

      // console.log("actualWorkingDays : ", actulWorkingDays);

      const biometricPercent = (userPresentDays * 100) / actulWorkingDays ;

      // console.log("bimoetric % : ", biometricPercent );


      const needDays = needToGet75(userPresentDays, actulWorkingDays);  
    

      // console.log("needDaysToget75 : ", needDays);
      // console.log("leftDays : ", leftDays);


      const bioDashInfo = {
        biometric: biometricPercent.toFixed(1),
        needClasses: needDays,
        remainingDays: leftDays,
        semStartDate : startDate
      }

      console.log("bioDashInfo : ", bioDashInfo);



    //   console.log(dashboardShow);
    // console.log(dailySchedule);

    dailySchedule.sort((a,b) => {
      return a.startTime.localeCompare(b.startTime);
    });

    res.render("dashboard/dash_index.ejs", {subjects: dashboardShow , todayClasses: dailySchedule,  stats: bioDashInfo});


  }catch(err){
  console.log(err);
  res.send("Something went wrong.");
}


});











// Subjects

app.get("/subjects", async (req, res) => {

  try {


    const userId = req.session.userId;


    const subjects = await userSubject.find({user: userId});



    let subjectsList = [];



    for (let subject of subjects) {

      // ye neeche waala concept dono for loop k use ka hai
      // jo each subject k total persent,absent,cancel,holiday ko count kr 
      // each subject ka percentage bta rha....


      const presentCount = await dailyMark.countDocuments({
        user: userId,
        subject: subject._id,
        status: "present"
      });

      const absentCount = await dailyMark.countDocuments({
        user: userId,
        subject: subject._id,
        status: "absent"
      });

      const holidayCount = await dailyMark.countDocuments({
        user: userId,
        subject: subject._id,
        status: "holiday"
      });

      const cancelCount = await dailyMark.countDocuments({
        user: userId,
        subject: subject._id,
        status: "cancel"
      });

      const finalClasses =  subject.totalClasses - holidayCount - cancelCount;

      const finalPercent = finalClasses > 0 ? (presentCount * 100) / finalClasses : 0;



      //push

        subjectsList.push({

        ...subject.toObject(),

        finalClasses : finalClasses,

        attendClasses: presentCount,

        missedClasses: absentCount,

        finalPercent: finalPercent.toFixed(1)

      });




      console.log(subjectsList);

    }

    
    res.render("subjects/sub_index.ejs", {subjectsList: subjectsList});


  }catch(err){
    console.log(err);
    res.send("Something went wrong.");
  }

  
});




app.post("/subjects", async (req, res) => {

  try {

    const subject = new userSubject({
      name: req.body.subjectName,
      classesPerWeek: req.body.classesPerWeek,
      schedule: req.body.schedule,
      user: req.session.userId
    });

    // Semester Dhundo...

    const Semester = await semester.findOne({ user: req.session.userId});

    console.log(Semester);

     const totalClasses =  calculateTotalClasses(subject, Semester);
     console.log("HELLO WORLD");
     console.log(totalClasses);
     subject.totalClasses = totalClasses;
     

     console.log("pinting specific subject data which by calculating totalclasses of that subject ");
    // console.log(subject);
    await subject.save();   // subject ka data save in userSubject collection...//



    res.redirect("/subjects");
  }catch(err){
    console.log(err);
    res.send("ERROR WHILE SAVING SUBJECT.");
  }
  
});

// Adding new subjects...


app.get("/subjects/new", (req, res) => {
  res.render("subjects/sub_new.ejs");
});




//===========================================================
// Edit your subjects....by using subject Id...
//==========================================================


app.get("/subjects/:id/edit", async (req, res) => {

  try {

  

    const {id} = req.params;

    // console.log(id);
    const editSub = await userSubject.findOne(
      {
        _id: id,
        user: req.session.userId
      }
    );
    console.log("HERE, IM HERE");
    console.log(editSub);

    const userId = req.session.userId;


    // const subjects = await userSubject.find({user: userId});

    let subjectsList = [];

    if(editSub) {

      const presentCount = await dailyMark.countDocuments({
        user: userId,
        subject: editSub._id,
        status: "present"
      });

      const absentCount = await dailyMark.countDocuments({
        user: userId,
        subject: editSub._id,
        status: "absent"
      });

      const holidayCount = await dailyMark.countDocuments({
        user: userId,
        subject: editSub._id,
        status: "holiday"
      });

      const cancelCount = await dailyMark.countDocuments({
        user: userId,
        subject: editSub._id,
        status: "cancel"
      });

      const finalClasses =  editSub.totalClasses - holidayCount - cancelCount;

      const finalPercent = finalClasses > 0 ? (presentCount * 100) / finalClasses : 0;



      //push

        subjectsList.push({

        ...editSub.toObject(),

        finalClasses : finalClasses,

        attendClasses: presentCount,

        missedClasses: absentCount,

        finalPercent: finalPercent.toFixed(1)

      });




      console.log(subjectsList);

    }


    res.render("subjects/edit.ejs", {subject: editSub, stats: subjectsList});



  }catch(err){
    console.log(err);
    res.send("Something went wrong.");
  }


});


// Updat(edit) you subject ....

app.post("/subjects/:id", async (req, res) => {

  try {
    // const {id} = req.params;

    const updateData = {
      name: req.body.subjectName,
      classesPerWeek: req.body.classesPerWeek,
      schedule: req.body.schedule
    };


    const semInfo = await semester.findOne({user: req.session.userId});

    const totalClasses = await attendanceCalculator(updateData, semInfo);
    console.log(totalClasses);

    updateData.totalClasses = totalClasses;

    console.log(updateData);

    console.log(updateData.name);



    await userSubject.findOneAndUpdate(
      {
        _id: req.params.id,  // yhaa .id bhi hoga kuki right  side {id} nhi hai simple variable hai....//
        user: req.session.userId
      },

      updateData,

      {
        runValidators: true,
        new: true,
      }
    );





    await dailyMark.updateMany(
      {
        subject: req.params.id,  // yhaa .id bhi hoga kuki right  side {id} nhi hai simple variable hai....//
        user: req.session.userId
      },

      {
        subjectName: updateData.name
      },

    );




    res.redirect("/subjects");

  }catch(err){
    console.log(err);
    res.send("Something went wrong.");
  }
  

});


// delete subject .....//

app.post("/subjects/:id/delete", async (req, res) => {

  try {
    // const {id} = req.body;

    await userSubject.findOneAndDelete(

      {
        _id: req.params.id,
        user: req.session.userId
      }

    );

    await dailyMark.deleteMany({
      subject : req.params.id,
      user: req.session.userId
    });



    res.redirect("/subjects");

  }catch(err){
    console.log(err);
    res.send("ERROR WHILE DELETING SUBJECT..");
  }
  
});





// Mark Attendance page..... //


app.get("/attendance/mark", async (req, res) => {

  // user k saare subject...

  const subjects = await userSubject.find({user: req.session.userId});




  // console.log("user k saare subjects ka data....");
  // console.log(subjects); 

  const startOfDay = new Date();
  startOfDay.setHours(0,0,0,0);

  const endOfDay = new Date();
  endOfDay.setHours(23,59,59,999);

  const todayMark = await dailyMark.find({
    
  user: req.session.userId,

  date: {
    $gte: startOfDay,
    $lte: endOfDay
  }

});

  

  // console.log(today);

  let todayClasses = [];

  for(let subject of subjects){

    for(let cls of subject.schedule){

      // AAj ka day...

      const todayDay = new Date().toLocaleDateString("en-US", {weekday: "long"});

      // Srif Aaj Waali classes

      if(cls.day === todayDay){

        // Is class ka attendance record dhoondo...

        const mark = todayMark.find(m =>
          m.subject.toString() === subject._id.toString() && m.startTime === cls.start
        );


        todayClasses.push({
          subjectId: subject._id,
          name: subject.name,
          startTime: cls.start,
          endTime: cls.end,
          
          status: mark ? mark.status : null

        });
      } 
    }
  }

  todayClasses.sort((a,b) => {
    return a.startTime.localeCompare(b.startTime);
  });

  // console.log(todayClasses);
  res.render("attendance/mark.ejs", {classes: todayClasses});
});


// post request ....////

app.post("/attendance/mark", async (req, res) => {
  try{

    const {
      subjectId,
      subjectName,
      startTime,
      endTime,
      status
    } = req.body;


    console.log("HolidAY BUTOON :", req.body.status);

    const today = new Date();
    today.setHours(
      0,0,0,0
    );

    console.log("today:", today);

    // =========================================
    //   <<<<< SPECIAL CASE IF HOLIDAY >>>>>
    // =========================================
    if (status === "holiday") {
      const subjects = await userSubject.find({ user: req.session.userId});

      const todayDay = new Date().toLocaleDateString("en-US",{ weekday: "long"});
      console.log("today :" , todayDay);

    //   const startofDay = new Date();
    // startofDay.setHours(
    //   0,0,0,0
    // );

    // const endofDay = new Date();
    // endofDay.setHours(
    //   23,59,59,999
    // );

      for(let subject of subjects) {
        for(let cls of subject.schedule){
          console.log("CLS.DAY", cls.day);
          console.log("CLS.STARTtime: ", cls.start);
          if(cls.day === todayDay){
            const result = await dailyMark.findOneAndUpdate(
              {
                user: req.session.userId,
                subject: subject._id,
                date: today,
                startTime: cls.start
              },

              {
                user: req.session.userId,

                subject: subject._id,
                subjectName: subject.subjectName,
                date: today,
                startTime: cls.start,
                endTime: cls.end,
                status: "holiday"
              },

              {
                upsert: true,
                new: true
              }

            );
              console.log("RESULT: ",result)

          }
        }
      }

      return res.redirect("/attendance/mark");

    }    



    // =======================
    // NORMAL FLOW 
    // =======================



    const existingRecord = await dailyMark.findOne(
      {
        user: req.session.userId,

        subject: subjectId,

        date: today,

        startTime: startTime
      }
    );

    console.log(existingRecord);

    // Record already exiist HAi 

    if(existingRecord) {

      // Same status Hai 
      if(existingRecord.status === status) {
        console.log("NO UPDATE");
        existingRecord.subjectName = subjectName;

        return res.redirect("/attendance/mark");
      }

      //status update kro ydi different ho ...
      existingRecord.status = status;
      existingRecord.subjectName = subjectName;

      console.log("UPDATED");

      await existingRecord.save();
    }

    // Ydi record nhi mila ....

    else {
      console.log("created");

      await dailyMark.create({

        user: req.session.userId,

        subject: subjectId,

        subjectName: subjectName,

        date: today,

        startTime: startTime,

        endTime: endTime,

        status: status

      });
      

    }
    console.log("HERE, existingRecord DATA IS PRESENT");
    console.log(existingRecord);
    res.redirect("/attendance/mark");


  }catch(err){
    console.log(err);
    res.send("Error");
  }
});






// Attendance History ....//


app.get("/attendance/history", async (req, res) => {

  const history = await dailyMark.find({
     user: req.session.userId
    })
    .sort({date: -1 })
    .limit(10);

  res.render("attendance/history.ejs", {attendanceHistory: history});

  console.log("AttendanceHistory : ", history);
});





app.get("/pyq", (req, res) => {
  res.render("pyq/pyq_index.ejs");
});

const PORT = process.env.PORT || 9010;

app.listen(PORT, () => {
  console.log(`app is listen on port ${PORT}`);
});     

     

