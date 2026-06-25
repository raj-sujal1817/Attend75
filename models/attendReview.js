const mongoose = require("mongoose");

const dailyMarkSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "userInfo",
    required: true
  },

  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "userSubject",
    required: true,
  },

  subjectName: {
    type: String
  },

  date: {
    type: Date,
    required: true
  },

  startTime: {
    type: String,
    required: true
  },

  endTime: {
    type: String,
    required: true
  },

  status: {
    type: String,
    enum: ["present", "absent", "holiday", "cancel"],
    required: true
  }

},

{
  timestamps: true
}

);

dailyMarkSchema.index(
  {
    user:1,
    subject:1,
    date:1,
    startTime:1
  },

  {
    unique: true  
  }
);


module.exports = new mongoose.model("DailyMark", dailyMarkSchema);