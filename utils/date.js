const { DateTime } = require("luxon");

// Current IST time
function nowIST() {
    return DateTime.now().setZone("Asia/Kolkata");
}

// JS Date (MongoDB ke liye)
function nowISTDate() {
    return nowIST().toJSDate();
}

// Start of today (IST)
function startOfTodayIST() {
    return nowIST().startOf("day").toJSDate();
}

// End of today (IST)
function endOfTodayIST() {
    return nowIST().endOf("day").toJSDate();
}

// Dashboard ke liye formatted date
function formattedToday() {
    return nowIST().toFormat("cccc, dd LLLL yyyy");
}



function startOfDayIST(date) {
    return DateTime
        .fromJSDate(date)
        .setZone("Asia/Kolkata")
        .startOf("day")
        .toJSDate();
}

function endOfDayIST(date) {
    return DateTime
        .fromJSDate(date)
        .setZone("Asia/Kolkata")
        .endOf("day")
        .toJSDate();
}



module.exports = {
    nowIST,
    nowISTDate,
    startOfTodayIST,
    endOfTodayIST,
    formattedToday,
    startOfDayIST,
    endOfDayIST
};