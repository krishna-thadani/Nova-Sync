import DebtRecord from "../src/models/DebtRecord.js";
import Task from "../src/models/Task.js";
import Routine from "../src/models/Routine.js";
import User from "../src/models/User.js";
import mongoose from "mongoose";

// Helper to get local date string YYYY-MM-DD
const getLocalDateString = (dateObj) => {
  const d = new Date(dateObj);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
};

const getDayOfWeek = (dateObj) => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[dateObj.getDay()];
};

// Generates textual insights based on user's debt history
const generateInsights = (records, todayTaskDebt, todayTimeDebt) => {
  const insights = [];
  
  if (!records || records.length === 0) {
    insights.push("You're just getting started! Distraction Debt will track your planned vs actual efforts.");
    return insights;
  }

  // Calculate week total
  const weekRecords = records.slice(0, 7);
  const weekTimeDebt = weekRecords.reduce((acc, r) => acc + (r.timeDebt > 0 ? r.timeDebt : 0), 0);
  const weekTaskDebt = weekRecords.reduce((acc, r) => acc + (r.taskDebt > 0 ? r.taskDebt : 0), 0);
  
  if (weekTimeDebt > 0) {
    const hours = Math.floor(weekTimeDebt / 60);
    const mins = weekTimeDebt % 60;
    insights.push(`You accumulated ${hours > 0 ? hours + ' hours ' : ''}${mins > 0 ? mins + ' mins ' : ''}of study debt over the last 7 days.`);
  }

  if (weekTaskDebt > 0) {
    insights.push(`You missed ${weekTaskDebt} planned tasks this week.`);
  }

  // Find worst day of week
  const dayTotals = {};
  records.forEach(r => {
    const d = new Date(r.date);
    const dayName = getDayOfWeek(d);
    if (!dayTotals[dayName]) dayTotals[dayName] = 0;
    dayTotals[dayName] += Math.max(0, r.timeDebt) + Math.max(0, r.taskDebt * 30); // crude weight
  });
  
  let worstDay = null;
  let maxDebt = -1;
  for (const [day, val] of Object.entries(dayTotals)) {
    if (val > maxDebt) {
      maxDebt = val;
      worstDay = day;
    }
  }

  if (worstDay && maxDebt > 0) {
    insights.push(`Your highest debt day tends to be ${worstDay}. Try lightening your load on this day.`);
  }

  // Encouraging
  if (todayTaskDebt <= 0 && todayTimeDebt <= 0 && records.length > 2) {
    insights.push("You are completely on track today! Keep up the momentum.");
  }

  return insights.length ? insights : ["Your debt is looking stable. Great job!"];
};


export const getDashboardData = async (req, res) => {
  try {
    const userId = req.userId;
    const todayDateObj = new Date();
    const todayStr = getLocalDateString(todayDateObj);

    // 1. Calculate Today's Dynamics
    const startOfDay = new Date(todayDateObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(todayDateObj);
    endOfDay.setHours(23, 59, 59, 999);

    // Today's Tasks
    const todayTasks = await Task.find({
      userId,
      dueDate: { $gte: startOfDay, $lte: endOfDay }
    });

    let todayPlannedTasks = todayTasks.length;
    let todayCompletedTasks = 0;
    let todayCompletedTimeFromTasks = 0;

    todayTasks.forEach(t => {
      if (t.status === "Completed") {
        todayCompletedTasks++;
      }
      if (t.actualDuration) {
        todayCompletedTimeFromTasks += t.actualDuration;
      }
    });

    // Any tasks completed today that were due on other days (Paying off debt)
    const extraCompletedToday = await Task.find({
      userId,
      completedAt: { $gte: startOfDay, $lte: endOfDay },
      dueDate: { $lt: startOfDay } // was due in the past
    });

    extraCompletedToday.forEach(t => {
      // These count towards today's completed effort without adding to today's planned
      todayCompletedTasks++;
      if (t.actualDuration) {
        todayCompletedTimeFromTasks += t.actualDuration;
      }
    });

    // Today's Routine (Time)
    const routines = await Routine.find({ userId });
    const todayDayOfWeek = getDayOfWeek(todayDateObj);
    let todayPlannedTime = 0;

    routines.forEach(routine => {
      routine.items.forEach(item => {
        if (item.day === todayDayOfWeek) {
          todayPlannedTime += item.duration; // in minutes
        }
      });
    });

    // For today, we haven't locked the record yet, so we just calculate debt dynamically
    const todayTaskDebt = Math.max(0, todayPlannedTasks - todayCompletedTasks);
    // It's possible completed time is greater than planned if they studied extra
    const todayTimeDebt = Math.max(0, todayPlannedTime - todayCompletedTimeFromTasks);
    
    // 2. Fetch Historical Debt (Last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = getLocalDateString(thirtyDaysAgo);

    let historicalRecords = await DebtRecord.find({
      userId,
      date: { $gte: thirtyDaysAgoStr, $lt: todayStr }
    }).sort({ date: -1 });

    // 3. Sync missing past days for tasks (Retroactive capture)
    // To avoid heavy computation on every load, we only sync if the most recent record isn't yesterday
    const yesterdayObj = new Date(todayDateObj);
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterdayObj);

    if (historicalRecords.length === 0 || historicalRecords[0].date !== yesterdayStr) {
      // Create missing record for yesterday (simple version: we just look at tasks due yesterday)
      const exist = await DebtRecord.findOne({ userId, date: yesterdayStr });
      if (!exist) {
        const yStart = new Date(yesterdayObj); yStart.setHours(0,0,0,0);
        const yEnd = new Date(yesterdayObj); yEnd.setHours(23,59,59,999);
        
        const yTasks = await Task.find({ userId, dueDate: { $gte: yStart, $lte: yEnd } });
        let yPlannedT = yTasks.length;
        let yCompT = yTasks.filter(t => t.status === "Completed" && t.completedAt && t.completedAt <= yEnd).length;
        
        await DebtRecord.create({
          userId,
          date: yesterdayStr,
          plannedTasks: yPlannedT,
          completedTasks: yCompT,
          taskDebt: Math.max(0, yPlannedT - yCompT),
          plannedTime: 0, // Impossible to know past routine perfectly, default 0
          completedTime: 0,
          timeDebt: 0
        });
        
        // Refetch after sync
        historicalRecords = await DebtRecord.find({
          userId,
          date: { $gte: thirtyDaysAgoStr, $lt: todayStr }
        }).sort({ date: -1 });
      }
    }

    // 4. Calculate Totals
    // Get ALL outstanding unpaid debt across all time
    const allRecords = await DebtRecord.find({ userId });
    let totalTaskDebt = 0;
    let totalTimeDebt = 0;
    
    allRecords.forEach(r => {
      totalTaskDebt += Math.max(0, r.taskDebt - r.repaidTasks);
      totalTimeDebt += Math.max(0, r.timeDebt - r.repaidTime);
    });

    // Add today's dynamic debt if positive
    totalTaskDebt += todayTaskDebt;
    totalTimeDebt += todayTimeDebt;

    // Build the today object
    const today = {
      date: todayStr,
      plannedTasks: todayPlannedTasks,
      completedTasks: todayCompletedTasks,
      taskDebt: todayTaskDebt,
      plannedTime: todayPlannedTime,
      completedTime: todayCompletedTimeFromTasks,
      timeDebt: todayTimeDebt
    };

    // Construct response
    return res.status(200).json({
      success: true,
      today,
      history: historicalRecords, // past 30 days
      totals: {
        taskDebt: Math.max(0, totalTaskDebt),
        timeDebt: Math.max(0, totalTimeDebt)
      },
      insights: generateInsights(historicalRecords, todayTaskDebt, todayTimeDebt)
    });

  } catch (error) {
    console.error("Error fetching debt dashboard data:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Log extra study time or tasks specifically to pay down accumulated debt
export const repayDebt = async (req, res) => {
  try {
    const userId = req.userId;
    const { type, amount } = req.body; // type: 'time' | 'task', amount: Number

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Amount must be greater than 0" });
    }

    // Find the oldest unsettled debt record that has unpaid debt of this type
    const query = { userId, isSettled: false };
    if (type === 'time') {
      query.$expr = { $lt: ["$repaidTime", "$timeDebt"] };
    } else {
      query.$expr = { $lt: ["$repaidTasks", "$taskDebt"] };
    }

    const oldestDebt = await DebtRecord.findOne(query).sort({ date: 1 });

    if (!oldestDebt) {
      return res.status(400).json({ success: false, message: "You don't have any outstanding debt of this type in your history!" });
    }

    // Apply repayment
    if (type === 'time') {
      const remainingDebt = oldestDebt.timeDebt - oldestDebt.repaidTime;
      const payment = Math.min(amount, remainingDebt);
      oldestDebt.repaidTime += payment;
      
      // If we overpaid, theoretically we should cascade to the next oldest record, 
      // but keeping it simple: just pay up to the max of this record.
    } else {
      const remainingDebt = oldestDebt.taskDebt - oldestDebt.repaidTasks;
      const payment = Math.min(amount, remainingDebt);
      oldestDebt.repaidTasks += payment;
    }

    // Check if fully settled
    if (oldestDebt.repaidTasks >= oldestDebt.taskDebt && oldestDebt.repaidTime >= oldestDebt.timeDebt) {
      oldestDebt.isSettled = true;
    }

    await oldestDebt.save();

    return res.status(200).json({
      success: true,
      message: `Successfully repaid ${amount} ${type === 'time' ? 'minutes' : 'tasks'} of debt from ${oldestDebt.date}.`,
      record: oldestDebt
    });

  } catch (error) {
    console.error("Error repaying debt:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
