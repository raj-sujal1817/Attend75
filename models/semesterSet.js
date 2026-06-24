const mongoose = require("mongoose");

const semesterSet = new mongoose.Schema({

  semesterName: {
    type: String,
    required: true
  },

  startDate: {
    type: Date,
    required: true
  },

  endDate: {
    type: Date,
    required: true
  },

  // holidays: [
  //   {
  //     date: Date,
  //     reason: Sring
  //   }
  // ],

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "userInfo",
    required: true,
    unique: true
  }

});

module.exports = new mongoose.model("semester",semesterSet);