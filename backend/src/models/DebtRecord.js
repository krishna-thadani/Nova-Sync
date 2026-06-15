import mongoose from "mongoose";

const debtRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: String, // format: "YYYY-MM-DD"
      required: true,
    },
    // Task-based debt
    plannedTasks: {
      type: Number,
      default: 0,
    },
    completedTasks: {
      type: Number,
      default: 0,
    },
    taskDebt: {
      type: Number,
      default: 0, // plannedTasks - completedTasks
    },
    repaidTasks: {
      type: Number,
      default: 0,
    },

    // Time-based debt (in minutes)
    plannedTime: {
      type: Number,
      default: 0,
    },
    completedTime: {
      type: Number,
      default: 0,
    },
    timeDebt: {
      type: Number,
      default: 0, // plannedTime - completedTime
    },
    repaidTime: {
      type: Number,
      default: 0,
    },
    
    // Status flag if this particular day's debt is fully settled
    isSettled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Ensure a user only has one debt record per day
debtRecordSchema.index({ userId: 1, date: 1 }, { unique: true });

const DebtRecord = mongoose.model("DebtRecord", debtRecordSchema);

export default DebtRecord;
