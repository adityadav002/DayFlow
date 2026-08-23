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
import { Edit2 } from 'lucide-react';

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

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
      setIsEditModalOpen(false);
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
      <header className="shrink-0 bg-white border-b border-surface-200 px-4 md:px-6 pt-4 md:pt-5" style={{ borderTopWidth: '4px', ...borderStyle }}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4">
          <div>
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg text-white font-bold uppercase shadow-sm" style={{ backgroundColor: currentProject.color || '#0ea5e9' }}>
                <FolderOpen className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-surface-900">{currentProject.name}</h1>
                <p className="text-xs text-surface-500">
                  Status:{' '}
                  <span className="font-semibold uppercase tracking-wide text-primary-600">
                    {currentProject.status}
                  </span>
                </p>
              </div>
            </div>
          </div>
          {canManageMembers && (
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                className="h-9 px-3 text-sm"
                onClick={() => {
                  setEditProjectName(currentProject.name);
                  setEditProjectDesc(currentProject.description);
                  setIsEditModalOpen(true);
                }}
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button 
                variant="outline" 
                className="h-9 px-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          )}
        </div>

        {/* Tab Controls */}
        <div className="flex space-x-6 border-t border-surface-100 overflow-x-auto custom-scrollbar">
          {[
            { id: 'overview', label: 'Overview', icon: Info },
            { id: 'board', label: 'Kanban Board', icon: Layout },
            { id: 'members', label: 'Members', icon: Users },
            { id: 'analytics', label: 'Analytics', icon: BarChart2 },
            { id: 'meetings', label: 'Meetings', icon: Video },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-surface-500 hover:text-surface-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Tab Contents */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'overview' && (
          <div className="p-4 md:p-6 max-w-4xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {/* Project Metadata Card */}
              <div className="md:col-span-2 bg-white rounded-xl border border-surface-200 p-4 md:p-6 shadow-sm space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider">Description</h3>
                  <p className="text-sm text-surface-700 mt-1 whitespace-pre-wrap">
                    {currentProject.description || <span className="italic">No description provided for this project.</span>}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
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
              </div>

              {/* Roles / Creator Card */}
              <div className="bg-white rounded-xl border border-surface-200 p-4 md:p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider">Project Owner</h3>
                  <div className="flex items-center space-x-3 mt-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold uppercase text-sm">
                      {currentProject.createdBy?.name?.charAt(0) || 'O'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-900">{currentProject.createdBy?.name}</p>
                      <p className="text-xs text-surface-500">{currentProject.createdBy?.email}</p>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-surface-100 text-xs text-surface-500">
                  Created {format(new Date(currentProject.createdAt), 'PP')}
                </div>
              </div>
            </div>

            {/* Quick Task List Summary */}
            <div className="bg-white rounded-xl border border-surface-200 p-4 md:p-6 shadow-sm">
              <h3 className="text-md font-semibold text-surface-800 mb-4">Project Tasks</h3>
              {loadingTasks ? (
                <div className="py-4 text-sm text-surface-400">Loading tasks...</div>
              ) : projectTasks.length === 0 ? (
                <div className="py-6 text-center text-sm text-surface-400 italic">No tasks created in this project yet. Open the Kanban Board tab to add tasks.</div>
              ) : (
                <div className="divide-y divide-surface-100">
                  {projectTasks.map(task => {
                    const { text: dueDateText, isOverdue } = smartDueDate(task.dueDate);
                    return (
                      <div key={task._id} className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                        <div className="flex items-center space-x-3 min-w-0">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                            task.priority === 'Urgent' ? 'bg-red-100 text-red-700' :
                            task.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                            task.priority === 'Medium' ? 'bg-blue-100 text-blue-700' :
                            'bg-green-100 text-green-700'
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
                            Comments: {task.commentsCount || 0}
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
            </div>
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
              <div className="bg-white rounded-xl border border-surface-200 p-4 md:p-6 shadow-sm">
                <h3 className="text-md font-semibold text-surface-800 mb-3 flex items-center">
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
              </div>
            )}

            {/* Members List */}
            <div className="bg-white rounded-xl border border-surface-200 p-4 md:p-6 shadow-sm">
              <h3 className="text-md font-semibold text-surface-800 mb-4">Project Members ({currentProject.members?.length || 0})</h3>
              <div className="divide-y divide-surface-100">
                {currentProject.members?.map((member) => {
                  const mUser = member.user;
                  if (!mUser) return null;
                  const isMemOwner = member.role === 'owner';
                  return (
                    <div key={mUser._id} className="py-3.5 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold uppercase text-sm">
                            {mUser.name?.charAt(0) || 'U'}
                          </div>
                          <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white ${
                            onlineUsers.includes(mUser._id) ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
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
                            isMemOwner ? 'bg-purple-100 text-purple-700' :
                            member.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                            member.role === 'manager' ? 'bg-amber-100 text-amber-700' :
                            'bg-surface-100 text-surface-600'
                          }`}>
                            {isMemOwner && <Shield className="h-3 w-3" />}
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
            </div>
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

      {/* Edit Project Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => !isSubmittingEdit && setIsEditModalOpen(false)} title="Edit Project">
        <form onSubmit={handleUpdateProject} className="space-y-4 mt-4">
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
              rows={4}
              value={editProjectDesc}
              onChange={e => setEditProjectDesc(e.target.value)}
              className="w-full rounded-md border border-surface-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-surface-200 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isSubmittingEdit}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmittingEdit || !editProjectName.trim()}>
              {isSubmittingEdit ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
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
