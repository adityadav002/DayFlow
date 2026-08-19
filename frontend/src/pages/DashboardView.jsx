import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Users, Kanban, ShieldAlert, CheckCircle, Clock, AlertOctagon, 
  ChevronRight, Calendar, ArrowUpDown, ChevronDown, Download, BarChart2, List
} from 'lucide-react';
import * as dashboardApi from '../api/dashboardApi';
import * as analyticsApi from '../api/analyticsApi';
import * as teamApi from '../api/teamApi';
import { getTeams } from '../api/teamApi';
import Loader from '../components/common/Loader';
import Button from '../components/common/Button';
import { cn } from '../utils/helpers';
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';

const DashboardView = () => {
  const { teamId: paramTeamId } = useParams();
  const navigate = useNavigate();
  const { currentWorkspace } = useSelector((state) => state.workspaces);
  
  // Selection States
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(paramTeamId || '');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectsList, setProjectsList] = useState([]);
  const [dateRange, setDateRange] = useState('30_days'); // '7_days' | '30_days' | '90_days'
  
  // Tab State
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'analytics'

  // Data States
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  
  // Table Sort State
  const [sortField, setSortField] = useState('user.name');
  const [sortAsc, setSortAsc] = useState(true);

  // Selected Member Drawer State (Slide-over)
  const [drawerMember, setDrawerMember] = useState(null);
  const [drawerTasks, setDrawerTasks] = useState([]);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Load teams in workspace
  useEffect(() => {
    if (!currentWorkspace) return;
    const loadTeams = async () => {
      try {
        const res = await teamApi.getTeams(currentWorkspace._id);
        setTeams(res.data.data);
        if (res.data.data.length > 0 && !paramTeamId) {
          setSelectedTeamId(res.data.data[0]._id);
          navigate(`/teams/${res.data.data[0]._id}/dashboard`);
        }
      } catch (err) {
        console.error('Failed to load teams', err);
      }
    };
    loadTeams();
  }, [currentWorkspace, paramTeamId]);

  // Load dashboard and project options
  useEffect(() => {
    if (!selectedTeamId) return;
    const loadDashboard = async () => {
      setLoading(true);
      try {
        // Build start/end date query
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
        if (selectedProjectId) {
          params.projectId = selectedProjectId;
        }

        const dbRes = await dashboardApi.getTeamDashboard(selectedTeamId, params);
        setDashboardData(dbRes.data.data);

        // Populate projects selector options from response projects list
        if (dbRes.data.data.projects) {
          setProjectsList(dbRes.data.data.projects.map(p => p.project));
        }

        // Fetch Analytics if on analytics tab
        if (activeTab === 'analytics') {
          const analyticsRes = await analyticsApi.getTeamAnalytics(selectedTeamId, params);
          setAnalyticsData(analyticsRes.data.data);
        }
      } catch (err) {
        console.error('Dashboard failed to load', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, [selectedTeamId, selectedProjectId, dateRange, activeTab]);

  // Load user assignments for slide-over drawer
  const handleOpenDrawer = async (memberRow) => {
    setDrawerMember(memberRow.user);
    setDrawerLoading(true);
    try {
      const res = await dashboardApi.getMemberTasks(selectedTeamId, memberRow.user._id);
      setDrawerTasks(res.data.data);
    } catch (err) {
      console.error('Failed to load member tasks', err);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleCsvExport = async () => {
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
      if (selectedProjectId) {
        params.projectId = selectedProjectId;
      }

      const response = await analyticsApi.exportTeamAnalyticsCsv(selectedTeamId, params);
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `team_${selectedTeamId}_export.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to export CSV', err);
    }
  };

  // Workload table sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedWorkload = useMemo(() => {
    if (!dashboardData?.memberWorkload) return [];
    
    return [...dashboardData.memberWorkload].sort((a, b) => {
      let valA = a;
      let valB = b;
      
      // Resolve deep fields like user.name
      if (sortField.includes('.')) {
        const parts = sortField.split('.');
        valA = a[parts[0]]?.[parts[1]] || '';
        valB = b[parts[0]]?.[parts[1]] || '';
      } else {
        valA = a[sortField];
        valB = b[sortField];
      }

      if (typeof valA === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? valA - valB : valB - valA;
    });
  }, [dashboardData, sortField, sortAsc]);

  if (loading && !dashboardData) {
    return <Loader fullScreen />;
  }

  const overview = dashboardData?.overview || {};

  return (
    <div className="min-h-full bg-slate-50 p-6 space-y-6 flex flex-col relative overflow-hidden">
      {/* Top Header Filter controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-primary-500" />
            Manager Command Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">Operational view and performance indicators across your team.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Team Selector */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
            <Users className="h-4 w-4 text-slate-400" />
            <select
              className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
              value={selectedTeamId}
              onChange={(e) => {
                setSelectedTeamId(e.target.value);
                navigate(`/teams/${e.target.value}/dashboard`);
              }}
            >
              {teams.map(t => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Project Selector */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
            <Kanban className="h-4 w-4 text-slate-400" />
            <select
              className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              <option value="">All Team Projects</option>
              {projectsList.map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Date Selector */}
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

          {/* CSV Export */}
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1.5 text-xs bg-white text-slate-700 hover:text-slate-900 border-slate-200 shadow-sm"
            onClick={handleCsvExport}
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Tabs headers */}
      <div className="flex border-b border-slate-200 shrink-0">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            "px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer",
            activeTab === 'overview' ? "border-primary-500 text-primary-600" : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <List className="h-4 w-4" /> Overview Dashboard
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={cn(
            "px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer",
            activeTab === 'analytics' ? "border-primary-500 text-primary-600" : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <BarChart2 className="h-4 w-4" /> Reports & Analytics
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-6 overflow-y-auto pr-1 flex-1 custom-scrollbar">
          {/* Overview Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-500"><Users className="h-5 w-5" /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Members</p>
                <h3 className="text-lg font-bold text-slate-800 mt-0.5">{overview.memberCount || 0}</h3>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-500"><Kanban className="h-5 w-5" /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Active Tasks</p>
                <h3 className="text-lg font-bold text-slate-800 mt-0.5">{overview.activeTasks || 0}</h3>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-500"><Clock className="h-5 w-5" /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Overdue</p>
                <h3 className="text-lg font-bold text-rose-600 mt-0.5">{overview.overdueTasks || 0}</h3>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-50 text-amber-500"><Calendar className="h-5 w-5" /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Due Today</p>
                <h3 className="text-lg font-bold text-slate-800 mt-0.5">{overview.dueTodayTasks || 0}</h3>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-green-50 text-green-500"><CheckCircle className="h-5 w-5" /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Done (Wk)</p>
                <h3 className="text-lg font-bold text-slate-800 mt-0.5">{overview.completedThisWeek || 0}</h3>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="p-2.5 rounded-lg bg-red-50 text-red-500"><AlertOctagon className="h-5 w-5" /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Blocked</p>
                <h3 className="text-lg font-bold text-red-600 mt-0.5">{overview.blockedTasks || 0}</h3>
              </div>
            </div>
          </div>

          {/* Attention Items & Projects Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Attention Widget */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm lg:col-span-5 flex flex-col min-h-[250px]">
              <h3 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wider">Requires Attention</h3>
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[280px]">
                {dashboardData?.attentionItems?.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400">
                    🎉 All caught up! Nothing needs immediate attention.
                  </div>
                ) : (
                  dashboardData?.attentionItems?.map((item, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => item.taskId && navigate(`/b/${dashboardData?.projects[0]?.project?.boardId}?taskId=${item.taskId}`)}
                      className={cn(
                        "flex items-start gap-2.5 p-3 rounded-lg text-xs transition-colors border cursor-pointer",
                        item.severity === 'critical' 
                          ? "bg-rose-50/50 border-rose-100 text-rose-800" 
                          : "bg-amber-50/50 border-amber-100 text-amber-800"
                      )}
                    >
                      <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
                      <div className="flex-1">
                        <p className="font-semibold leading-relaxed">{item.message}</p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Project Status Cards Grid */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm lg:col-span-7 flex flex-col min-h-[250px]">
              <h3 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wider">Project Status Board</h3>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[280px]">
                {dashboardData?.projects?.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400">No active team projects.</div>
                ) : (
                  dashboardData?.projects?.map((item) => (
                    <div key={item.project._id} className="p-3 rounded-lg border border-slate-100 flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.project.color || '#3b82f6' }} />
                          <h4 className="text-xs font-bold text-slate-800 leading-none">{item.project.name}</h4>
                          <span className={cn(
                            "text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase",
                            item.status === 'at_risk' ? 'bg-rose-100 text-rose-700' :
                            item.status === 'on_hold' ? 'bg-slate-100 text-slate-600' : 'bg-green-100 text-green-700'
                          )}>
                            {item.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {item.taskCount} tasks • {item.overdueCount} overdue {item.project.dueDate && `• Due ${new Date(item.project.dueDate).toLocaleDateString()}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Progress Bar */}
                        <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-primary-500 h-full rounded-full" style={{ width: `${item.progress}%` }} />
                        </div>
                        <span className="text-xs font-bold text-slate-700 w-8 text-right">{item.progress}%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Member Workload Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
            <div className="px-4 py-3.5 border-b border-slate-150 bg-slate-50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Member Workload Details</h3>
              <span className="text-[10px] font-semibold text-slate-400">Click a row to inspect assignments</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-150">
                    <th onClick={() => handleSort('user.name')} className="px-4 py-2.5 cursor-pointer hover:bg-slate-100 select-none">
                      <span className="flex items-center gap-1">Member <ArrowUpDown className="h-3 w-3" /></span>
                    </th>
                    <th onClick={() => handleSort('role')} className="px-4 py-2.5 cursor-pointer hover:bg-slate-100 select-none">
                      <span className="flex items-center gap-1">Role <ArrowUpDown className="h-3 w-3" /></span>
                    </th>
                    <th onClick={() => handleSort('working')} className="px-4 py-2.5 cursor-pointer hover:bg-slate-100 select-none text-center">
                      <span className="flex items-center justify-center gap-1">Working <ArrowUpDown className="h-3 w-3" /></span>
                    </th>
                    <th onClick={() => handleSort('todo')} className="px-4 py-2.5 cursor-pointer hover:bg-slate-100 select-none text-center">
                      <span className="flex items-center justify-center gap-1">Todo <ArrowUpDown className="h-3 w-3" /></span>
                    </th>
                    <th onClick={() => handleSort('overdue')} className="px-4 py-2.5 cursor-pointer hover:bg-slate-100 select-none text-center">
                      <span className="flex items-center justify-center gap-1">Overdue <ArrowUpDown className="h-3 w-3" /></span>
                    </th>
                    <th onClick={() => handleSort('blocked')} className="px-4 py-2.5 cursor-pointer hover:bg-slate-100 select-none text-center">
                      <span className="flex items-center justify-center gap-1">Blocked <ArrowUpDown className="h-3 w-3" /></span>
                    </th>
                    <th onClick={() => handleSort('completedThisWeek')} className="px-4 py-2.5 cursor-pointer hover:bg-slate-100 select-none text-center">
                      <span className="flex items-center justify-center gap-1">Completed <ArrowUpDown className="h-3 w-3" /></span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedWorkload.map((row) => (
                    <tr 
                      key={row.user._id} 
                      onClick={() => handleOpenDrawer(row)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors group"
                    >
                      <td className="px-4 py-3 flex items-center gap-2.5">
                        <div className="relative">
                          <div className="h-7 w-7 rounded-full bg-primary-100 text-xs font-bold text-primary-700 flex items-center justify-center">
                            {row.user.name?.charAt(0).toUpperCase()}
                          </div>
                          {/* Online indicator placeholder */}
                          <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white bg-green-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 group-hover:text-primary-600 transition-colors">{row.user.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">@{row.user.username}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 capitalize">{row.role}</td>
                      <td className="px-4 py-3 text-center font-bold text-slate-700">{row.working}</td>
                      <td className="px-4 py-3 text-center text-slate-500">{row.todo}</td>
                      <td className="px-4 py-3 text-center text-rose-600 font-bold bg-rose-50/20">{row.overdue}</td>
                      <td className="px-4 py-3 text-center text-amber-600 font-bold bg-amber-50/20">{row.blocked}</td>
                      <td className="px-4 py-3 text-center text-green-600 font-bold">{row.completedThisWeek}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Overdue and Blocked Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Overdue list */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex flex-col">
              <h3 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wider">Overdue Tasks</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {dashboardData.overdueTasks.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400">All tasks are currently schedule-compliant.</div>
                ) : (
                  dashboardData.overdueTasks.map(t => (
                    <div 
                      key={t._id} 
                      onClick={() => navigate(`/b/${t.project?.boardId || ''}?taskId=${t._id}`)}
                      className="p-3 rounded-lg border border-slate-100 hover:border-slate-350 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-slate-800">{t.title}</h4>
                        <p className="text-[10px] text-slate-400">
                          {t.project?.name} • Assignee: {t.assignedTo?.name || 'Unassigned'}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-rose-600">
                        Due {new Date(t.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Blocked list */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex flex-col">
              <h3 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wider">Blocked Tasks</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {dashboardData.blockedTasks.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400">No blocked tasks logged.</div>
                ) : (
                  dashboardData.blockedTasks.map(t => (
                    <div 
                      key={t._id} 
                      onClick={() => navigate(`/b/${t.project?.boardId || ''}?taskId=${t._id}`)}
                      className="p-3 rounded-lg border border-slate-100 hover:border-slate-350 transition-colors flex flex-col cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-800">{t.title}</h4>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded uppercase">Blocked</span>
                      </div>
                      {t.blockedReason && (
                        <p className="text-[10px] text-amber-600 bg-amber-50/50 p-1.5 rounded mt-1.5 border border-amber-100 font-semibold italic">
                          " {t.blockedReason} "
                        </p>
                      )}
                      <p className="text-[9px] text-slate-400 mt-1">
                        {t.project?.name} • Assignee: {t.assignedTo?.name || 'Unassigned'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Milestone 16 reports tab view */
        <div className="space-y-6 overflow-y-auto pr-1 flex-1 custom-scrollbar">
          {analyticsData ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Completed tasks chart */}
              <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm min-h-[320px] flex flex-col">
                <h3 className="text-xs font-bold text-slate-800 mb-4 uppercase tracking-wider">Team Throughput (Weekly velocity)</h3>
                <div className="flex-1 w-full h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData.throughput}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="week" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="completed" name="Completed Tasks" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Overdue trend chart */}
              <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm min-h-[320px] flex flex-col">
                <h3 className="text-xs font-bold text-slate-800 mb-4 uppercase tracking-wider">Overdue Tasks Trend (By week)</h3>
                <div className="flex-1 w-full h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.overdueTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="week" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="overdue" name="Overdue Count" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Completion rate by member table */}
              <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm lg:col-span-2">
                <h3 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wider">Completion Rates by Member</h3>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-150">
                      <th className="px-4 py-2.5">Member</th>
                      <th className="px-4 py-2.5 text-center">Assigned Tasks</th>
                      <th className="px-4 py-2.5 text-center">Completed Tasks</th>
                      <th className="px-4 py-2.5 text-center">Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analyticsData.completionByMember?.map((row) => (
                      <tr key={row.user._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-primary-100 text-xs font-bold text-primary-700 flex items-center justify-center">
                            {row.user.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{row.user.name}</p>
                            <p className="text-[10px] text-slate-400">@{row.user.username}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600 font-semibold">{row.assigned}</td>
                        <td className="px-4 py-3 text-center text-green-600 font-semibold">{row.completed}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-bold text-slate-700">{row.rate}%</span>
                            <div className="w-12 bg-slate-100 rounded-full h-1 overflow-hidden">
                              <div className="bg-green-500 h-full rounded-full" style={{ width: `${row.rate}%` }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-sm text-slate-400">Loading analytics indicators...</div>
          )}
        </div>
      )}

      {/* Selected Member slide-over Drawer details */}
      {drawerMember && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={() => setDrawerMember(null)} />
          
          <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-primary-100 text-sm font-bold text-primary-700 flex items-center justify-center">
                    {drawerMember.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{drawerMember.name}</h3>
                    <p className="text-[10px] text-slate-400">@{drawerMember.username}</p>
                  </div>
                </div>
                <button onClick={() => setDrawerMember(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Assigned Tasks</h4>
                
                {drawerLoading ? (
                  <div className="text-center py-10 text-xs text-slate-400">Loading assignments...</div>
                ) : drawerTasks.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400">No tasks assigned within this scope.</div>
                ) : (
                  drawerTasks.map(t => (
                    <div 
                      key={t._id} 
                      onClick={() => { setDrawerMember(null); navigate(`/b/${t.project?.boardId || ''}?taskId=${t._id}`); }}
                      className="p-3 rounded-xl border border-slate-100 hover:border-slate-300 transition-all cursor-pointer flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400">{t.project?.name}</span>
                        <span className={cn(
                          "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide",
                          t.status === 'Done' ? 'bg-green-100 text-green-700' :
                          t.status === 'In Progress' ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600'
                        )}>
                          {t.status}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800">{t.title}</h4>
                      {t.dueDate && (
                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3 shrink-0" /> Due {new Date(t.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardView;
