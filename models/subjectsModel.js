const mongoose = require("mongoose");

const subjectsScehma = new mongoose.Schema(
  
  {
    name: {
      type: String,
      required: true,
    },

    classesPerWeek: {
      type: Number,
      required: true,
    },

    schedule: [
      {
        day: {
          type: String,
          enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          required: true,
        },

        start: {
          type: String,
          required: true,
        },

        end: {
          type: String,
          required: true,
        }
      }
    ],

    totalClasses: {
      type: Number,
      default: 0,
    },

    attendClasses: {
      type: Number,
      default: 0,
    },

    //Missed Classes or holidayClasses //

    absentClasses: {
      type: Number,
      default: 0,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userInfo",
      required: true,
    }

  },

  {
    // this is the 2nd object (Schema Option)...

    timestamps: true

  }


);


module.exports = new mongoose.model("userSubject", subjectsScehma);

