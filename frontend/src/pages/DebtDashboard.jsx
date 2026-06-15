import React, { useState, useEffect } from "react";
import api from "../api/axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Zap
} from "lucide-react";

const DebtDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [repayModalOpen, setRepayModalOpen] = useState(false);
  const [repayType, setRepayType] = useState("time");
  const [repayAmount, setRepayAmount] = useState("");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/debt/dashboard");
      if (res.data.success) {
        setData(res.data);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch debt dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRepay = async (e) => {
    e.preventDefault();
    if (!repayAmount || isNaN(repayAmount) || Number(repayAmount) <= 0) {
      alert("Please enter a valid amount greater than 0");
      return;
    }

    try {
      const res = await api.post("/debt/repay", {
        type: repayType,
        amount: Number(repayAmount),
      });

      if (res.data.success) {
        alert(res.data.message);
        setRepayModalOpen(false);
        setRepayAmount("");
        fetchDashboardData(); // Refresh data
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to log repayment");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4eb7b3]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <AlertCircle size={48} className="text-red-500" />
        <p className="text-xl font-medium">{error}</p>
        <button onClick={fetchDashboardData} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  const { today, history, totals, insights } = data;

  // Format history for charts
  const chartData = history.slice(0, 7).reverse().map((record) => {
    // Parse Date
    const d = new Date(record.date);
    const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
    return {
      name: dayName,
      timeDebt: record.timeDebt,
      taskDebt: record.taskDebt,
      completedTime: record.completedTime,
    };
  });

  return (
    <div className="min-h-screen w-full px-6 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* Header section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/40 dark:bg-slate-900/40 p-6 rounded-3xl border border-soft shadow-sm backdrop-blur-xl">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">
              Distraction Debt
            </h1>
            <p className="text-muted mt-2">
              Measure your planned vs actual efforts to stay accountable and reduce productivity debt.
            </p>
          </div>
          <button 
            onClick={() => setRepayModalOpen(true)}
            className="btn bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium hover:from-orange-600 hover:to-red-600 shadow-md hover:shadow-lg transition-all"
          >
            <Zap size={18} className="mr-2 inline" />
            Log Repayment
          </button>
        </div>

        {/* Insights Panel */}
        <div className="surface-bg rounded-2xl p-6 border-soft shadow-xs flex flex-col gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="text-[#4eb7b3]" />
            Behavioral Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((insight, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-[#d0f6e3]/30 dark:bg-slate-800/50 border border-[#98e1d7]/30 text-sm font-medium text-slate-700 dark:text-slate-300 flex items-start gap-3">
                <Target size={20} className="text-[#3b8ea0] shrink-0 mt-0.5" />
                <p>{insight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Totals Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="surface-bg p-6 rounded-2xl border border-orange-500/20 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all"></div>
            <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm flex items-center gap-2">
              <Clock size={16} /> Total Unpaid Time Debt
            </h3>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-4xl font-bold text-orange-500">{totals.timeDebt}</span>
              <span className="text-sm font-medium text-slate-500 mb-1">minutes</span>
            </div>
          </div>

          <div className="surface-bg p-6 rounded-2xl border border-red-500/20 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all"></div>
            <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm flex items-center gap-2">
              <CheckCircle size={16} /> Total Unpaid Task Debt
            </h3>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-4xl font-bold text-red-500">{totals.taskDebt}</span>
              <span className="text-sm font-medium text-slate-500 mb-1">tasks</span>
            </div>
          </div>

          <div className="surface-bg p-6 rounded-2xl border border-[#4eb7b3]/20 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#4eb7b3]/10 rounded-full blur-2xl group-hover:bg-[#4eb7b3]/20 transition-all"></div>
            <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm flex items-center gap-2">
              <TrendingUp size={16} /> Today's Performance
            </h3>
            <div className="mt-4 flex flex-col gap-1 text-sm font-medium">
              <p className={today.taskDebt > 0 ? "text-red-500" : "text-[#4eb7b3]"}>
                Tasks: {today.completedTasks} / {today.plannedTasks} {today.taskDebt > 0 && `(-${today.taskDebt})`}
              </p>
              <p className={today.timeDebt > 0 ? "text-orange-500" : "text-[#4eb7b3]"}>
                Time: {today.completedTime}m / {today.plannedTime}m {today.timeDebt > 0 && `(-${today.timeDebt}m)`}
              </p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="surface-bg rounded-2xl p-6 border-soft shadow-xs h-[400px] flex flex-col">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Clock className="text-orange-500" /> Weekly Time Debt Trend
            </h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTimeDebt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#f97316', fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="timeDebt" name="Minutes of Debt" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorTimeDebt)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="surface-bg rounded-2xl p-6 border-soft shadow-xs h-[400px] flex flex-col">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <CheckCircle className="text-red-500" /> Weekly Task Debt Trend
            </h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTaskDebt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#ef4444', fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="taskDebt" name="Missed Tasks" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorTaskDebt)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>

      {/* Repay Modal */}
      {repayModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-soft transform transition-all">
            <h2 className="text-2xl font-bold mb-2">Log Repayment</h2>
            <p className="text-muted text-sm mb-6">
              Did you study extra today? Log your time or completed tasks here to pay down your historical debt.
            </p>
            <form onSubmit={handleRepay} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">What are you repaying?</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="repayType" 
                      value="time" 
                      checked={repayType === "time"} 
                      onChange={() => setRepayType("time")} 
                      className="accent-[#4eb7b3]"
                    />
                    <span>Study Time</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="repayType" 
                      value="task" 
                      checked={repayType === "task"} 
                      onChange={() => setRepayType("task")}
                      className="accent-[#4eb7b3]"
                    />
                    <span>Tasks</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">
                  Amount ({repayType === "time" ? "minutes" : "tasks"})
                </label>
                <input
                  type="number"
                  min="1"
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  placeholder="e.g. 30"
                  className="w-full px-4 py-3 rounded-xl surface-bg border border-soft focus:outline-none focus:ring-2 focus:ring-[#4eb7b3]/50 transition-all"
                  required
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setRepayModalOpen(false)} className="flex-1 py-3 rounded-xl border border-soft hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-medium">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#4eb7b3] to-[#3b8ea0] text-white hover:opacity-90 transition-all font-medium shadow-md">
                  Submit Repayment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtDashboard;
