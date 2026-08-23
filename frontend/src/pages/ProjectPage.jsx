import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjectById, addMemberToProject, removeMemberFromProject, updateProjectMemberRole } from '../redux/slices/projectSlice';
import * as projectApi from '../api/projectApi';
import BoardPage from './BoardPage';
import Loader from '../components/common/Loader';
import Button from '../components/common/Button';
import { Calendar, Users, Layout, Info, UserPlus, Trash2, Shield, FolderOpen, MessageSquare, Clock, BarChart2, Video } from 'lucide-react';
import { joinMeeting } from '../redux/slices/meetingSlice';
import * as eventApi from '../api/eventApi';
import ProjectAnalytics from '../components/projects/ProjectAnalytics';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { smartDueDate } from '../utils/helpers';
import Modal from '../components/common/Modal';
import { fetchProjects } from '../redux/slices/projectSlice';
import { Edit2, Settings, Crown } from 'lucide-react';
import Avatar from '../components/common/Avatar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/common/Card';
import { cn } from '../utils/helpers';

const ProjectPage = () => {
  const { projectId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { currentProject, currentProjectStatus } = useSelector((state) => state.projects);
  const { user: currentUser } = useSelector((state) => state.auth);
  const { onlineUsers } = useSelector((state) => state.ui);

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'board' | 'members'
  const [emailInput, setEmailInput] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [projectTasks, setProjectTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [projectMeetings, setProjectMeetings] = useState([]);
  const [loadingMeetings, setLoadingMeetings] = useState(false);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [schedulingMeeting, setSchedulingMeeting] = useState(false);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectDesc, setEditProjectDesc] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  useEffect(() => {
    if (projectId) {
      dispatch(fetchProjectById(projectId));
      if (activeTab === 'overview') {
        fetchTasks();
      }
      if (activeTab === 'meetings') {
        fetchMeetings();
      }
    }
  }, [dispatch, projectId, activeTab]);

  const fetchMeetings = async () => {
    try {
      setLoadingMeetings(true);
      const res = await eventApi.getEvents({ projectId });
      const events = res.data.data;
      setProjectMeetings(events.filter(e => e.meetingId));
    } catch (err) {
      console.error('Failed to load project meetings', err);
    } finally {
      setLoadingMeetings(false);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoadingTasks(true);
      const res = await projectApi.getProjectTasks(projectId);
      setProjectTasks(res.data.data);
    } catch (err) {
      console.error('Failed to load project tasks');
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    const email = emailInput.trim();
    if (!email) return;

    setAddingMember(true);
    try {
      await dispatch(addMemberToProject({ projectId, email })).unwrap();
      toast.success('Member added to project successfully!');
      setEmailInput('');
    } catch (err) {
      toast.error(err || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (window.confirm('Are you sure you want to remove this member from the project?')) {
      try {
        await dispatch(removeMemberFromProject({ projectId, userId })).unwrap();
        toast.success('Member removed successfully!');
      } catch (err) {
        toast.error(err || 'Failed to remove member');
      }
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await dispatch(updateProjectMemberRole({ projectId, userId, role: newRole })).unwrap();
      toast.success('Member role updated successfully!');
    } catch (err) {
      toast.error(err || 'Failed to update member role');
    }
  };

  const handleScheduleMeeting = async (e) => {
    e.preventDefault();
    if (!meetingTitle.trim() || !meetingDate) return;
    
    setSchedulingMeeting(true);
    try {
      const startDateTime = new Date(meetingDate);
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour later
      
      const participants = currentProject.members
        .map(m => m.user._id || m.user)
        .filter(id => id !== currentUser?._id);
        
      await eventApi.createEvent({
        title: meetingTitle,
        startDateTime,
        endDateTime,
        isMeeting: true,
        meetingType: 'video',
        participants,
        project: projectId
      });
      
      toast.success('Meeting scheduled successfully!');
      setShowScheduleModal(false);
      setMeetingTitle('');
      setMeetingDate('');
      fetchMeetings();
    } catch (err) {
      toast.error('Failed to schedule meeting');
      console.error(err);
    } finally {
      setSchedulingMeeting(false);
    }
  };

  const handleDeleteMeeting = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this meeting?')) {
      try {
        await eventApi.deleteEvent(eventId);
        toast.success('Meeting deleted successfully!');
        fetchMeetings();
      } catch (err) {
        toast.error('Failed to delete meeting');
        console.error(err);
      }
    }
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    if (!editProjectName.trim()) return;

    setIsSubmittingEdit(true);
    try {
      await projectApi.updateProject(projectId, {
        name: editProjectName,
        description: editProjectDesc
      });
      toast.success('Project updated successfully');
      setIsSettingsModalOpen(false);
      dispatch(fetchProjectById(projectId));
      if (currentProject.workspace) {
        dispatch(fetchProjects({ workspace: currentProject.workspace }));
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update project');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteProject = async () => {
    setIsSubmittingDelete(true);
    try {
      await projectApi.deleteProject(projectId);
      toast.success('Project deleted successfully');
      setIsDeleteModalOpen(false);
      if (currentProject.workspace) {
        dispatch(fetchProjects({ workspace: currentProject.workspace }));
      }
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete project');
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  if (currentProjectStatus === 'loading' || !currentProject) {
    return <Loader fullScreen />;
  }

  const currentUserMember = currentProject.members?.find(m => m.user?._id === currentUser?._id || m.user === currentUser?._id);
  const currentUserRole = currentUserMember?.role || 'member';
  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'admin';
  
  const boardId = currentProject.boardId?._id || currentProject.boardId;

  // Context colors styling helper
  const borderStyle = { borderTopColor: currentProject.color || '#0ea5e9' };

  return (
    <div className="flex h-full flex-col bg-surface-50">
      {/* Project Header Banner */}
      <header className="shrink-0 bg-white border-b border-surface-200 px-6 md:px-8 pt-6 relative overflow-hidden" style={{ ...borderStyle, borderTopWidth: '4px' }}>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 relative z-10">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-[12px] text-white font-bold uppercase shadow-sm" style={{ backgroundColor: currentProject.color || '#397D68' }}>
                <FolderOpen className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="text-[28px] font-medium text-surface-900 tracking-tight leading-tight">{currentProject.name}</h1>
                <p className="text-[14px] text-surface-500 mt-0.5">
                  Status:{' '}
                  <span className="font-medium tracking-wide" style={{ color: currentProject.color || '#397D68' }}>
                    {currentProject.status}
                  </span>
                </p>
              </div>
            </div>
          </div>
          {canManageMembers && (
            <div className="flex items-center space-x-2">
              <Button 
                variant="secondary" 
                className="h-9 px-4 text-[13px]"
                onClick={() => {
                  setEditProjectName(currentProject.name);
                  setEditProjectDesc(currentProject.description);
                  setIsSettingsModalOpen(true);
                }}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </div>
          )}
        </div>

        {/* Tab Controls */}
        <div className="flex space-x-8 overflow-x-auto custom-scrollbar relative z-10 px-2 -mx-2">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'board', label: 'Kanban Board' },
            { id: 'members', label: 'Members' },
            { id: 'analytics', label: 'Analytics' },
            { id: 'meetings', label: 'Meetings' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'py-3 text-[14px] font-medium transition-all whitespace-nowrap shrink-0 relative',
                  isActive ? 'text-primary-600' : 'text-surface-500 hover:text-surface-900'
                )}
              >
                {tab.label}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary-600 rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Tab Contents */}
      <div className="flex-1 overflow-auto bg-surface-50">
        {activeTab === 'overview' && (
          <div className="p-4 md:p-6 max-w-4xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {/* Project Metadata Card */}
              <Card className="md:col-span-2">
                <CardContent className="p-4 md:p-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider">Description</h3>
                    <p className="text-sm text-surface-700 mt-1 whitespace-pre-wrap">
                      {currentProject.description || <span className="italic">No description provided for this project.</span>}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-surface-100">
                    <div>
                      <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider flex items-center">
                        <Calendar className="mr-1 h-3.5 w-3.5" /> Start Date
                      </h3>
                      <p className="text-sm font-medium text-surface-800 mt-0.5">
                        {currentProject.startDate ? format(new Date(currentProject.startDate), 'PP') : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider flex items-center">
                        <Calendar className="mr-1 h-3.5 w-3.5" /> Due Date
                      </h3>
                      <p className="text-sm font-medium text-surface-800 mt-0.5">
                        {currentProject.dueDate ? format(new Date(currentProject.dueDate), 'PP') : 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Roles / Creator Card */}
              <Card className="flex flex-col justify-between">
                <CardContent className="p-4 md:p-6 h-full flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider">Project Owner</h3>
                    <div className="flex items-center space-x-3 mt-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-600 font-bold uppercase text-sm">
                        {currentProject.createdBy?.name?.charAt(0) || 'O'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-surface-900">{currentProject.createdBy?.name}</p>
                        <p className="text-xs text-surface-500">{currentProject.createdBy?.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 mt-4 border-t border-surface-100 text-xs text-surface-500">
                    Created {format(new Date(currentProject.createdAt), 'PP')}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Task List Summary */}
            <Card>
              <CardContent className="p-4 md:p-6">
                <h3 className="text-md font-bold text-surface-800 mb-4 border-b border-surface-100 pb-2">Project Tasks</h3>
                {loadingTasks ? (
                  <div className="py-4 text-sm text-surface-400">Loading tasks...</div>
                ) : projectTasks.length === 0 ? (
                  <div className="py-6 text-center text-sm text-surface-400 italic">No tasks created in this project yet. Open the Kanban Board tab to add tasks.</div>
                ) : (
                  <div className="divide-y divide-surface-100">
                    {projectTasks.map(task => {
                      const { text: dueDateText, isOverdue } = smartDueDate(task.dueDate);
                      return (
                        <div key={task._id} className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm hover:bg-surface-50 px-2 -mx-2 rounded-lg transition-colors">
                          <div className="flex items-center space-x-3 min-w-0">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                              task.priority === 'Urgent' ? 'bg-red-50 text-red-700 border border-red-200' :
                              task.priority === 'High' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              task.priority === 'Medium' ? 'bg-primary-50 text-primary-700 border border-primary-200' :
                              'bg-surface-50 text-surface-700 border border-surface-200'
                            }`}>
                              {task.priority || 'Medium'}
                            </span>
                            <span className="font-semibold text-surface-900 truncate">{task.title}</span>
                          </div>
                          <div className="flex items-center space-x-4 shrink-0 text-xs text-surface-500">
                            {task.dueDate && (
                              <span className={`flex items-center ${isOverdue ? 'text-red-600 font-semibold' : ''}`}>
                                <Clock className="mr-1 h-3.5 w-3.5" />
                                {dueDateText}
                              </span>
                            )}
                            <span className="flex items-center">
                              <MessageSquare className="mr-1 h-3.5 w-3.5" />
                              {task.commentsCount || 0}
                            </span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-surface-100 text-surface-600 uppercase tracking-wider">
                              {task.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'board' && (
          <div className="h-full">
            {boardId ? (
              <BoardPage boardId={boardId} />
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-surface-500 italic">
                No Kanban board linked to this project.
              </div>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div className="p-4 md:p-6 max-w-2xl space-y-6">
            {/* Add member form */}
            {canManageMembers && (
              <Card>
                <CardContent className="p-4 md:p-6">
                  <h3 className="text-md font-bold text-surface-800 mb-4 flex items-center border-b border-surface-100 pb-2">
                    <UserPlus className="mr-2 h-5 w-5 text-primary-500" />
                    Add Team Member
                  </h3>
                  <form onSubmit={handleAddMember} className="flex gap-2">
                    <input
                      type="email"
                      required
                      placeholder="Enter teammate's email..."
                      className="flex-1 rounded-md border border-surface-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                    />
                    <Button type="submit" disabled={addingMember || !emailInput.trim()}>
                      {addingMember ? 'Adding...' : 'Add'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Members List */}
            <Card>
              <CardContent className="p-4 md:p-6">
                <h3 className="text-md font-bold text-surface-800 mb-4 border-b border-surface-100 pb-2">Project Members ({currentProject.members?.length || 0})</h3>
                <div className="divide-y divide-surface-100">
                  {currentProject.members?.map((member) => {
                    const mUser = member.user;
                    if (!mUser) return null;
                    const isMemOwner = member.role === 'owner';
                    return (
                      <div key={mUser._id} className="py-3.5 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <Avatar user={{...mUser, isOnline: onlineUsers.includes(mUser._id)}} size="md" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-surface-900">{mUser.name}</p>
                            <p className="text-xs text-surface-500">{mUser.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          {canManageMembers && mUser._id !== currentUser?._id && member.role !== 'owner' ? (
                            <select
                              value={member.role}
                              onChange={(e) => handleRoleChange(mUser._id, e.target.value)}
                              className="text-xs font-semibold px-2 py-1 rounded border border-surface-300 bg-white text-surface-700 focus:border-primary-500 focus:outline-none"
                            >
                              <option value="admin">Admin</option>
                              <option value="manager">Manager</option>
                              <option value="member">Member</option>
                            </select>
                          ) : (
                            <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded ${
                              isMemOwner ? 'bg-accent-50 text-accent-700 border border-accent-200' :
                              member.role === 'admin' ? 'bg-primary-50 text-primary-700 border border-primary-200' :
                              member.role === 'manager' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              'bg-surface-50 text-surface-600 border border-surface-200'
                            }`}>
                              {isMemOwner && <Crown className="h-3 w-3" />}
                              {member.role}
                            </span>
                          )}
                          {canManageMembers && mUser._id !== currentUser?._id && member.role !== 'owner' && (
                            <button
                              onClick={() => handleRemoveMember(mUser._id)}
                              className="p-1 text-surface-400 hover:text-red-600 transition-colors"
                              title="Remove member"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="p-4 md:p-6 overflow-auto">
            <ProjectAnalytics projectId={projectId} />
          </div>
        )}

        {activeTab === 'meetings' && (
          <div className="p-4 md:p-6 max-w-4xl space-y-6">
            <div className="bg-white rounded-xl border border-surface-200 p-4 md:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-md font-semibold text-surface-800">Project Meetings</h3>
                <Button onClick={() => setShowScheduleModal(true)}>
                  Schedule Meeting
                </Button>
              </div>
              
              {loadingMeetings ? (
                <div className="py-4 text-sm text-surface-400">Loading meetings...</div>
              ) : projectMeetings.length === 0 ? (
                <div className="py-6 text-center text-sm text-surface-400 italic">
                  <Video className="h-10 w-10 text-surface-300 mx-auto mb-2" />
                  No meetings scheduled for this project.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projectMeetings.map(event => (
                    <div key={event._id} className="p-4 border border-surface-200 rounded-lg bg-surface-50">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-surface-900">{event.title}</h4>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-primary-100 text-primary-700 uppercase">
                            {event.meetingId?.status || 'Scheduled'}
                          </span>
                          {(canManageMembers || event.creator?._id === currentUser?._id) && (
                            <button
                              onClick={() => handleDeleteMeeting(event._id)}
                              className="text-surface-400 hover:text-red-600 transition-colors"
                              title="Delete meeting"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-surface-600 mb-4">{format(new Date(event.startDateTime), 'PPp')}</p>
                      
                      <button 
                        onClick={() => dispatch(joinMeeting({ meeting: event.meetingId }))}
                        className="w-full flex items-center justify-center space-x-2 py-2 bg-primary-600 text-white rounded-md text-sm font-semibold hover:bg-primary-500 transition-colors"
                      >
                        <Video className="h-4 w-4" />
                        <span>Join Video Call</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Schedule Meeting Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-surface-900 mb-4">Schedule a Meeting</h2>
            <form onSubmit={handleScheduleMeeting} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">
                  Meeting Title
                </label>
                <input
                  type="text"
                  required
                  value={meetingTitle}
                  onChange={e => setMeetingTitle(e.target.value)}
                  className="w-full rounded-md border border-surface-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  placeholder="e.g. Project Sync"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={meetingDate}
                  onChange={e => setMeetingDate(e.target.value)}
                  className="w-full rounded-md border border-surface-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowScheduleModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={schedulingMeeting}>
                  {schedulingMeeting ? 'Scheduling...' : 'Schedule Meeting'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <Modal isOpen={isSettingsModalOpen} onClose={() => !isSubmittingEdit && setIsSettingsModalOpen(false)} title="Project Settings">
        <div className="mt-4 space-y-6">
          <form onSubmit={handleUpdateProject} className="space-y-4">
            <h3 className="text-sm font-semibold text-surface-800 mb-3">General</h3>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Project Name</label>
              <input
                type="text"
                required
                value={editProjectName}
                onChange={e => setEditProjectName(e.target.value)}
                className="w-full rounded-md border border-surface-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Description</label>
              <textarea
                rows={3}
                value={editProjectDesc}
                onChange={e => setEditProjectDesc(e.target.value)}
                className="w-full rounded-md border border-surface-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsSettingsModalOpen(false)} disabled={isSubmittingEdit}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingEdit || !editProjectName.trim()}>
                {isSubmittingEdit ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>

          {/* Ownership Information */}
          <div className="border-t border-surface-200 pt-4">
            <h3 className="text-sm font-semibold text-surface-800 mb-3">Ownership</h3>
            <div className="flex items-center space-x-3 p-3 bg-surface-50 rounded-lg border border-surface-200">
              <Avatar user={currentProject.createdBy} size="md" />
              <div>
                <p className="text-sm font-medium text-surface-900 flex items-center">
                  {currentProject.createdBy?.name || 'Unknown User'}
                  <Crown className="ml-1.5 h-3.5 w-3.5 text-amber-500" />
                </p>
                <p className="text-xs text-surface-500">Project Creator & Owner</p>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          {currentUserRole === 'admin' || currentUserRole === 'owner' ? (
            <div className="border-t border-surface-200 pt-4">
              <h3 className="text-sm font-semibold text-red-600 mb-2">Danger Zone</h3>
              <p className="text-xs text-surface-500 mb-4">
                Once you delete a project, it is archived and permanently removed from active workspaces.
              </p>
              <Button 
                variant="outline" 
                className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                onClick={() => {
                  setIsSettingsModalOpen(false);
                  setIsDeleteModalOpen(true);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete this project
              </Button>
            </div>
          ) : null}
        </div>
      </Modal>

      {/* Delete Project Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => !isSubmittingDelete && setIsDeleteModalOpen(false)} title="Delete Project">
        <div className="mt-4 space-y-4">
          <p className="text-sm text-surface-600">
            Are you sure you want to delete this project? This will archive the project and it will no longer be visible in your workspace.
          </p>
          <div className="flex justify-end space-x-3 pt-4 border-t border-surface-200">
            <Button type="button" variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isSubmittingDelete}>
              Cancel
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white" 
              onClick={handleDeleteProject} 
              disabled={isSubmittingDelete}
            >
              {isSubmittingDelete ? 'Deleting...' : 'Delete Project'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProjectPage;
