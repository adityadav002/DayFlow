import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjectById, addMemberToProject, removeMemberFromProject, updateProjectMemberRole } from '../redux/slices/projectSlice';
import * as projectApi from '../api/projectApi';
import BoardPage from './BoardPage';
import Loader from '../components/common/Loader';
import Button from '../components/common/Button';
import { Calendar, Users, Layout, Info, UserPlus, Trash2, Shield, FolderOpen, MessageSquare, Clock, BarChart2 } from 'lucide-react';
import ProjectAnalytics from '../components/projects/ProjectAnalytics';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { smartDueDate } from '../utils/helpers';

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

  useEffect(() => {
    if (projectId) {
      dispatch(fetchProjectById(projectId));
      if (activeTab === 'overview') {
        fetchTasks();
      }
    }
  }, [dispatch, projectId, activeTab]);

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
      <header className="shrink-0 bg-white border-b border-surface-200 px-6 pt-5" style={{ borderTopWidth: '4px', ...borderStyle }}>
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
        </div>

        {/* Tab Controls */}
        <div className="flex space-x-6 border-t border-surface-100">
          {[
            { id: 'overview', label: 'Overview', icon: Info },
            { id: 'board', label: 'Kanban Board', icon: Layout },
            { id: 'members', label: 'Members', icon: Users },
            { id: 'analytics', label: 'Analytics', icon: BarChart2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-3 text-sm font-medium border-b-2 transition-all ${
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
          <div className="p-6 max-w-4xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Project Metadata Card */}
              <div className="md:col-span-2 bg-white rounded-xl border border-surface-200 p-6 shadow-sm space-y-4">
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
              <div className="bg-white rounded-xl border border-surface-200 p-6 shadow-sm flex flex-col justify-between">
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
            <div className="bg-white rounded-xl border border-surface-200 p-6 shadow-sm">
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
          <div className="p-6 max-w-2xl space-y-6">
            {/* Add member form */}
            {canManageMembers && (
              <div className="bg-white rounded-xl border border-surface-200 p-6 shadow-sm">
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
            <div className="bg-white rounded-xl border border-surface-200 p-6 shadow-sm">
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
          <div className="p-6 overflow-auto">
            <ProjectAnalytics projectId={projectId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectPage;
