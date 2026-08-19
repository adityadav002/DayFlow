import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, Cell 
} from 'recharts';
import { 
  Calendar, Download, TrendingUp, CheckSquare, Clock, BarChart2, AlertCircle
} from 'lucide-react';
import * as analyticsApi from '../../api/analyticsApi';
import Loader from '../common/Loader';
import Button from '../common/Button';
import { cn } from '../../utils/helpers';

const ProjectAnalytics = ({ projectId }) => {
  const [dateRange, setDateRange] = useState('30_days');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const now = new Date();
        let startDateStr = '';
        if (dateRange === '7_days') {
          startDateStr = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        } else if (dateRange === '30_days') {
          startDateStr = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        } else {
          startDateStr = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
        }

        const params = {
          startDate: startDateStr,
          endDate: now.toISOString()
        };

        const res = await analyticsApi.getProjectAnalytics(projectId, params);
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to load project analytics', err);
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, [projectId, dateRange]);

  const handleExportCsv = async () => {
    try {
      const now = new Date();
      let startDateStr = '';
      if (dateRange === '7_days') {
        startDateStr = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (dateRange === '30_days') {
        startDateStr = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      } else {
        startDateStr = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      }

      const params = {
        startDate: startDateStr,
        endDate: now.toISOString()
      };

      const res = await analyticsApi.exportProjectAnalyticsCsv(projectId, params);
      
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `project_${projectId}_tasks.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to export CSV', err);
    }
  };

  if (loading && !data) {
    return <Loader />;
  }

  const { overview, statusDistribution, completionTrend, timeTracking } = data || {};

  // Formatted status distribution for Recharts
  const statusData = [
    { name: 'Backlog', count: statusDistribution?.backlog || 0, fill: '#64748b' },
    { name: 'Todo', count: statusDistribution?.todo || 0, fill: '#94a3b8' },
    { name: 'In Progress', count: statusDistribution?.in_progress || 0, fill: '#3b82f6' },
    { name: 'Review', count: statusDistribution?.review || 0, fill: '#8b5cf6' },
    { name: 'Blocked', count: statusDistribution?.blocked || 0, fill: '#ef4444' },
    { name: 'Done', count: statusDistribution?.done || 0, fill: '#10b981' }
  ];

  return (
    <div className="space-y-6">
      {/* Filters & Actions Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 shrink-0">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Project Reports</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
            <Calendar className="h-4 w-4 text-slate-400" />
            <select
              className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="7_days">Last 7 Days</option>
              <option value="30_days">Last 30 Days</option>
              <option value="90_days">Last 90 Days</option>
            </select>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1.5 text-xs bg-white text-slate-700 border-slate-200 shadow-sm"
            onClick={handleExportCsv}
          >
            <Download className="h-3.5 w-3.5" /> Export tasks to CSV
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tasks Created</p>
          <h3 className="text-xl font-bold text-slate-850 mt-1">{overview?.created || 0}</h3>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tasks Completed</p>
          <h3 className="text-xl font-bold text-green-600 mt-1">{overview?.completed || 0}</h3>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Completion Rate</p>
          <h3 className="text-xl font-bold text-slate-850 mt-1">{overview?.completionRate || 0}%</h3>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Avg Completion</p>
          <h3 className="text-xl font-bold text-slate-850 mt-1">{overview?.avgCompletionDays || 0} days</h3>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tasks Overdue</p>
          <h3 className="text-xl font-bold text-rose-600 mt-1">{overview?.overdue || 0}</h3>
        </div>
      </div>

      {/* Recharts Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion trend line */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm min-h-[300px] flex flex-col">
          <h4 className="text-xs font-bold text-slate-800 mb-4 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-blue-500" /> Completion Velocity Trend
          </h4>
          <div className="w-full h-[220px]">
            {completionTrend?.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-450 italic">No completion history in range.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={completionTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} />
                  <YAxis stroke="#94a3b8" fontSize={9} />
                  <Tooltip />
                  <Line type="monotone" dataKey="completed" name="Completed" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Status Distribution Bar */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm min-h-[300px] flex flex-col">
          <h4 className="text-xs font-bold text-slate-800 mb-4 uppercase tracking-wider flex items-center gap-1">
            <BarChart2 className="h-4 w-4 text-indigo-500" /> Tasks Status Distribution
          </h4>
          <div className="w-full h-[220px]">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={9} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={9} />
                <Tooltip />
                <Bar dataKey="count" name="Tasks Count">
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Time Tracking Accuracy Section */}
      {timeTracking && (timeTracking.totalEstimated > 0 || timeTracking.totalActual > 0) && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1 border-b border-slate-100 pb-2">
            <CheckSquare className="h-4 w-4 text-green-500" /> Time Estimation Accuracy
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Variance indicator widget */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Variance Performance</span>
              <h3 className={cn(
                "text-2xl font-black mt-1",
                timeTracking.variancePercent > 0 ? "text-rose-600" : "text-green-600"
              )}>
                {timeTracking.variancePercent > 0 ? `+${timeTracking.variancePercent}%` : `${timeTracking.variancePercent}%`}
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">
                {timeTracking.variancePercent > 0 
                  ? "Over budget (tasks took longer than estimated)." 
                  : "Under budget (tasks completed faster than estimated)."}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Estimated Duration</span>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{timeTracking.totalEstimated} hrs</h3>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Actual Time Logged</span>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{parseFloat(timeTracking.totalActual.toFixed(1))} hrs</h3>
            </div>
          </div>

          {/* Variance by Priority Table */}
          <div className="border border-slate-150 rounded-xl overflow-hidden mt-4">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-150">
                  <th className="px-4 py-2">Task Priority</th>
                  <th className="px-4 py-2 text-center">Hours Estimated</th>
                  <th className="px-4 py-2 text-center">Actual Time Spent</th>
                  <th className="px-4 py-2 text-center">Accuracy Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.keys(timeTracking.byPriority || {}).map(pri => {
                  const val = timeTracking.byPriority[pri];
                  return (
                    <tr key={pri} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 capitalize font-semibold text-slate-700">{pri}</td>
                      <td className="px-4 py-2.5 text-center text-slate-650">{val.estimated}h</td>
                      <td className="px-4 py-2.5 text-center text-slate-650">{parseFloat(val.actual.toFixed(1))}h</td>
                      <td className={cn(
                        "px-4 py-2.5 text-center font-bold",
                        val.variancePercent > 0 ? "text-rose-600" : "text-green-600"
                      )}>
                        {val.variancePercent > 0 ? `+${val.variancePercent}%` : `${val.variancePercent}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectAnalytics;
