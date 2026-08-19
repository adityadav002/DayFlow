import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateTask, deleteTask } from '../../redux/slices/taskSlice';
import { addTaskToMyDay, removeTaskFromMyDay } from '../../redux/slices/mydaySlice';
import { fetchProjectById } from '../../redux/slices/projectSlice';
import * as commentApi from '../../api/commentApi';
import * as subtaskApi from '../../api/subtaskApi';
import * as activityApi from '../../api/activityApi';
import * as dependencyApi from '../../api/dependencyApi';
import * as attachmentApi from '../../api/attachmentApi';
import * as timeApi from '../../api/timeApi';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { formatDistanceToNow } from 'date-fns';
import {
  MessageSquare, Paperclip, Clock, Trash2, User, AlignLeft, Send,
  Sun, X as SunOff, Plus, CheckSquare, Square, ChevronDown, Tag, Lock,
  Play, Pause, Repeat
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn, smartDueDate } from '../../utils/helpers';

const PRIORITY_COLORS = {
  Urgent: 'bg-red-100 text-red-700 border-red-300',
  High: 'bg-orange-100 text-orange-700 border-orange-300',
  Medium: 'bg-blue-100 text-blue-700 border-blue-300',
  Low: 'bg-green-100 text-green-700 border-green-300',
};

const STATUS_COLORS = {
  Backlog: 'bg-surface-100 text-surface-600',
  Todo: 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-amber-100 text-amber-700',
  Review: 'bg-purple-100 text-purple-700',
  Blocked: 'bg-red-100 text-red-700',
  Done: 'bg-green-100 text-green-700',
};

const AssigneeSelector = ({ task, dispatch }) => {
  const { currentProject } = useSelector((state) => state.projects);
  const members = currentProject?.members || [];

  const handleAssigneeChange = (e) => {
    const newAssignee = e.target.value || null;
    dispatch(updateTask({
      taskId: task._id,
      data: { assignedTo: newAssignee, version: task.version }
    }));
  };

  const currentAssigneeId = task.assignedTo?._id || task.assignedTo || '';

  return (
    <div className="flex items-center space-x-2">
      <User className="h-4 w-4 text-surface-400 shrink-0" />
      <select
        className="w-full rounded bg-surface-100 px-2 py-1.5 text-sm text-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
        value={currentAssigneeId}
        onChange={handleAssigneeChange}
      >
        <option value="">Unassigned</option>
        {members.map((m) => {
          const memberId = m.user?._id || m.user;
          const memberName = m.user?.name || m.user?.email || memberId;
          return (
            <option key={memberId} value={memberId}>
              {memberName}
            </option>
          );
        })}
      </select>
    </div>
  );
};

const TaskDetailModal = ({ isOpen, onClose, task }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { currentProject } = useSelector((state) => state.projects);

  useEffect(() => {
    const projectId = task?.project?._id || task?.project;
    if (isOpen && projectId) {
      if (!currentProject || currentProject._id !== projectId) {
        dispatch(fetchProjectById(projectId));
      }
    }
  }, [isOpen, task?.project, currentProject?._id, dispatch]);

  const [description, setDescription] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState('comments'); // 'comments' | 'activity'

  // Comments
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsPage, setCommentsPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(false);

  // Comment edit state
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  // Mentions Autocomplete state
  const [showMentionsDropdown, setShowMentionsDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionTriggerIdx, setMentionTriggerIdx] = useState(-1);

  // Activities state
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const [hasMoreActivities, setHasMoreActivities] = useState(false);

  // Redux tasks selector
  const { items: allTasks } = useSelector((state) => state.tasks);

  // Dependencies state
  const [dependencies, setDependencies] = useState({ blockedBy: [], blocking: [] });
  const [loadingDependencies, setLoadingDependencies] = useState(false);
  const [dependencyQuery, setDependencyQuery] = useState('');
  const [filteredTasksForDep, setFilteredTasksForDep] = useState([]);

  // Attachments state
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');

  // Time Entries & Timer state
  const [timeEntries, setTimeEntries] = useState([]);
  const [loadingTimeEntries, setLoadingTimeEntries] = useState(false);
  const [timerStatus, setTimerStatus] = useState({ status: 'idle', elapsedSeconds: 0 });
  const [manualDuration, setManualDuration] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);

  // Recurrence rule config state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState({
    frequency: 'weekly',
    interval: 1,
    daysOfWeek: [],
    dayOfMonth: 1
  });

  // Subtasks
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [loadingSubtasks, setLoadingSubtasks] = useState(false);
  const [addingSubtask, setAddingSubtask] = useState(false);

  // Tags
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);

  const [hasConflict, setHasConflict] = useState(false);
  const initialTaskVersionRef = useRef();

  useEffect(() => {
    if (isOpen && task) {
      setDescription(task.description || '');
      setIsEditingDesc(false);
      setNewComment('');
      setNewSubtaskTitle('');
      setActiveTab('comments');
      setCommentsPage(1);
      setActivitiesPage(1);
      setActivities([]);
      fetchComments(1, false);
      fetchSubtasks();

      fetchDependencies();
      fetchAttachments();
      fetchTimeEntries();
      fetchTimerStatus();
      
      setIsRecurring(task.isRecurring || false);
      if (task.recurrenceRule) {
        setRecurrenceRule({
          frequency: task.recurrenceRule.frequency || 'weekly',
          interval: task.recurrenceRule.interval || 1,
          daysOfWeek: task.recurrenceRule.daysOfWeek || [],
          dayOfMonth: task.recurrenceRule.dayOfMonth || 1
        });
      }

      if (initialTaskVersionRef.current === undefined) {
        initialTaskVersionRef.current = task.version;
      }
    }
  }, [isOpen, task?._id]);

  useEffect(() => {
    if (isOpen && activeTab === 'activity') {
      fetchActivities(1, false);
    }
  }, [activeTab, isOpen]);

  useEffect(() => {
    const handleCommentCreated = (e) => {
      const { comment, taskId } = e.detail;
      if (taskId === task._id) {
        setComments(prev => {
          if (prev.some(c => c._id === comment._id)) return prev;
          return [...prev, comment];
        });
      }
    };

    const handleCommentUpdated = (e) => {
      const { comment, taskId } = e.detail;
      if (taskId === task._id) {
        setComments(prev => prev.map(c => c._id === comment._id ? comment : c));
      }
    };

    const handleCommentDeleted = (e) => {
      const { commentId, taskId } = e.detail;
      if (taskId === task._id) {
        setComments(prev => prev.filter(c => c._id !== commentId));
      }
    };

    window.addEventListener('comment:created', handleCommentCreated);
    window.addEventListener('comment:updated', handleCommentUpdated);
    window.addEventListener('comment:deleted', handleCommentDeleted);

    return () => {
      window.removeEventListener('comment:created', handleCommentCreated);
      window.removeEventListener('comment:updated', handleCommentUpdated);
      window.removeEventListener('comment:deleted', handleCommentDeleted);
    };
  }, [task?._id]);

  useEffect(() => {
    if (!isOpen) {
      initialTaskVersionRef.current = undefined;
      setHasConflict(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleExternalUpdate = (e) => {
      const { task: updatedTask, updatedBy } = e.detail;
      if (updatedBy === user?._id) {
        return;
      }
      if (isOpen && task && updatedTask._id === task._id) {
        const baseVersion = initialTaskVersionRef.current ?? task.version;
        if (updatedTask.version > baseVersion) {
          setHasConflict(true);
        }
      }
    };
    window.addEventListener('task:external-update', handleExternalUpdate);
    return () => {
      window.removeEventListener('task:external-update', handleExternalUpdate);
    };
  }, [isOpen, task, user?._id]);

  const fetchComments = async (page = 1, append = false) => {
    try {
      setLoadingComments(true);
      const res = await commentApi.getComments(task._id, { page, limit: 10 });
      const newComments = res.data.data;
      const meta = res.data.meta || { page, pages: 1 };
      setComments(prev => append ? [...prev, ...newComments] : newComments);
      setCommentsPage(meta.page);
      setHasMoreComments(meta.page < meta.pages);
    } catch (err) {
      console.error('Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  };

  const fetchActivities = async (page = 1, append = false) => {
    try {
      setLoadingActivities(true);
      const res = await activityApi.getTaskActivity(task._id, { page, limit: 15 });
      const newActivities = res.data.data;
      const meta = res.data.meta || { page, pages: 1 };
      setActivities(prev => append ? [...prev, ...newActivities] : newActivities);
      setActivitiesPage(meta.page);
      setHasMoreActivities(meta.page < meta.pages);
    } catch (err) {
      console.error('Failed to load activities');
    } finally {
      setLoadingActivities(false);
    }
  };
  const fetchDependencies = async () => {
    try {
      setLoadingDependencies(true);
      const res = await dependencyApi.getDependencies(task._id);
      setDependencies(res.data.data);
    } catch (err) {
      console.error('Failed to load dependencies');
    } finally {
      setLoadingDependencies(false);
    }
  };

  const fetchAttachments = async () => {
    try {
      setLoadingAttachments(true);
      const res = await attachmentApi.getAttachments('task', task._id);
      setAttachments(res.data.data);
    } catch (err) {
      console.error('Failed to load attachments');
    } finally {
      setLoadingAttachments(false);
    }
  };

  const fetchTimeEntries = async () => {
    try {
      setLoadingTimeEntries(true);
      const res = await timeApi.getTimeEntries(task._id);
      setTimeEntries(res.data.data);
    } catch (err) {
      console.error('Failed to load time entries');
    } finally {
      setLoadingTimeEntries(false);
    }
  };

  const fetchTimerStatus = async () => {
    try {
      const res = await timeApi.getTimerStatus(task._id);
      setTimerStatus(res.data.data);
    } catch (err) {
      console.error('Failed to get timer status');
    }
  };

  const timerIntervalRef = useRef(null);
  
  useEffect(() => {
    if (timerStatus.status === 'running') {
      timerIntervalRef.current = setInterval(() => {
        setTimerStatus(prev => ({
          ...prev,
          elapsedSeconds: (prev.elapsedSeconds || 0) + 1
        }));
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timerStatus.status]);
  const fetchSubtasks = async () => {
    try {
      setLoadingSubtasks(true);
      const res = await subtaskApi.getSubtasks(task._id);
      setSubtasks(res.data.data);
    } catch (err) {
      console.error('Failed to load subtasks');
    } finally {
      setLoadingSubtasks(false);
    }
  };

  const handleUpdateDescription = () => {
    if (description !== task.description) {
      dispatch(updateTask({ taskId: task._id, data: { description, version: task.version } }));
    }
    setIsEditingDesc(false);
  };

  const handleStatusChange = (e) => {
    dispatch(updateTask({ taskId: task._id, data: { status: e.target.value, version: task.version } }));
  };

  const handlePriorityChange = (e) => {
    dispatch(updateTask({ taskId: task._id, data: { priority: e.target.value, version: task.version } }));
  };

  const handleContextChange = (e) => {
    dispatch(updateTask({ taskId: task._id, data: { context: e.target.value, version: task.version } }));
  };

  const handleStartDateChange = (e) => {
    const val = e.target.value === '' ? null : e.target.value;
    dispatch(updateTask({ taskId: task._id, data: { startDate: val, version: task.version } }));
  };

  const handleDueDateChange = (e) => {
    const val = e.target.value === '' ? null : e.target.value;
    dispatch(updateTask({ taskId: task._id, data: { dueDate: val, version: task.version } }));
  };

  const handleEstimatedDurationChange = (e) => {
    const val = e.target.value === '' ? null : Number(e.target.value);
    dispatch(updateTask({ taskId: task._id, data: { estimatedDuration: val, version: task.version } }));
  };

  const handleDeleteTask = () => {
    if (task.parentRecurringTask) {
      const option = window.confirm("This task is part of a recurring series. Click [OK] to delete the entire series (and all future occurrences), or click [Cancel] to delete this single occurrence only.");
      if (option) {
        dispatch(deleteTask({ taskId: task._id, deleteScope: 'all' }));
      } else {
        dispatch(deleteTask({ taskId: task._id, deleteScope: 'this' }));
      }
      onClose();
    } else {
      if (window.confirm('Are you sure you want to delete this task? All subtasks will also be deleted.')) {
        dispatch(deleteTask(task._id));
        onClose();
      }
    }
  };

  // Tags
  const handleAddTag = () => {
    const trimmed = newTag.trim();
    if (!trimmed) return;
    const currentTags = task.tags || [];
    if (currentTags.includes(trimmed)) { setNewTag(''); return; }
    dispatch(updateTask({ taskId: task._id, data: { tags: [...currentTags, trimmed], version: task.version } }));
    setNewTag('');
    setShowTagInput(false);
  };

  const handleRemoveTag = (tag) => {
    const updated = (task.tags || []).filter(t => t !== tag);
    dispatch(updateTask({ taskId: task._id, data: { tags: updated, version: task.version } }));
  };

  // Comments
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await commentApi.addComment(task._id, { content: newComment });
      setComments(prev => {
        if (prev.some(c => c._id === res.data.data._id)) return prev;
        return [...prev, res.data.data];
      });
      setNewComment('');
      dispatch(updateTask({ taskId: task._id, data: { version: task.version } }));
    } catch (err) {
      toast.error('Failed to add comment');
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editingCommentText.trim()) return;
    try {
      const res = await commentApi.editComment(task._id, commentId, { content: editingCommentText });
      setComments(comments.map(c => c._id === commentId ? res.data.data : c));
      setEditingCommentId(null);
      setEditingCommentText('');
      toast.success('Comment updated successfully');
    } catch (err) {
      toast.error('Failed to edit comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await commentApi.deleteComment(task._id, commentId);
        setComments(comments.filter(c => c._id !== commentId));
        dispatch(updateTask({ taskId: task._id, data: { version: task.version } }));
      } catch (err) {
        toast.error('Failed to delete comment');
      }
    }
  };

  const handleCommentChange = (e) => {
    const text = e.target.value;
    setNewComment(text);

    const cursor = e.target.selectionStart;
    const textBeforeCursor = text.slice(0, cursor);
    const lastAtIdx = textBeforeCursor.lastIndexOf('@');

    if (lastAtIdx !== -1) {
      const charBeforeAt = lastAtIdx > 0 ? textBeforeCursor[lastAtIdx - 1] : ' ';
      if (charBeforeAt === ' ' || charBeforeAt === '\n') {
        const query = textBeforeCursor.slice(lastAtIdx + 1);
        if (!query.includes(' ')) {
          setShowMentionsDropdown(true);
          setMentionSearch(query);
          setMentionTriggerIdx(lastAtIdx);
          setMentionIndex(0);
          return;
        }
      }
    }
    setShowMentionsDropdown(false);
  };

  const handleSelectMention = (member) => {
    const username = member.user?.username || member.user?.name?.toLowerCase().replace(/[^a-z0-9]/g, '_') || '';
    const beforeAt = newComment.slice(0, mentionTriggerIdx);
    const afterCursor = newComment.slice(mentionTriggerIdx + mentionSearch.length + 1);
    
    setNewComment(`${beforeAt}@${username} ${afterCursor}`);
    setShowMentionsDropdown(false);
  };

  const handleKeyDown = (e) => {
    if (showMentionsDropdown && filteredMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => (prev + 1) % filteredMembers.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => (prev - 1 + filteredMembers.length) % filteredMembers.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSelectMention(filteredMembers[mentionIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentionsDropdown(false);
      }
    }
  };

  // Time Tracking handlers
  const handleStartTimer = async () => {
    try {
      const res = await timeApi.startTimer(task._id);
      setTimerStatus({
        status: 'running',
        elapsedSeconds: 0,
        startedAt: res.data.data.startedAt
      });
      toast.success('Timer started');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start timer');
    }
  };

  const handlePauseTimer = async () => {
    try {
      await timeApi.pauseTimer(task._id);
      setTimerStatus(prev => ({
        ...prev,
        status: 'paused'
      }));
      toast.success('Timer paused');
    } catch (err) {
      toast.error('Failed to pause timer');
    }
  };

  const handleResumeTimer = async () => {
    try {
      const res = await timeApi.resumeTimer(task._id);
      setTimerStatus(prev => ({
        ...prev,
        status: 'running',
        startedAt: res.data.data.startedAt
      }));
      toast.success('Timer resumed');
    } catch (err) {
      toast.error('Failed to resume timer');
    }
  };

  const handleStopTimer = async () => {
    const note = window.prompt('Enter a note for this time entry:', 'Logged via timer');
    if (note === null) return;
    try {
      await timeApi.stopTimer(task._id, { note });
      setTimerStatus({ status: 'idle', elapsedSeconds: 0 });
      fetchTimeEntries();
      dispatch(updateTask({ taskId: task._id, data: { version: task.version } }));
      toast.success('Time entry logged');
    } catch (err) {
      toast.error('Failed to stop timer');
    }
  };

  const parseDurationStringToMinutes = (str) => {
    if (!str) return 0;
    const clean = str.trim().toLowerCase();
    const hourMinRegex = /^(\d+(?:\.\d+)?)\s*h\s*(\d+)?\s*m?$/;
    const matchHM = clean.match(hourMinRegex);
    if (matchHM) {
      const h = parseFloat(matchHM[1]) || 0;
      const m = parseInt(matchHM[2]) || 0;
      return Math.round(h * 60 + m);
    }
    const hourRegex = /^(\d+(?:\.\d+)?)\s*h$/;
    const matchH = clean.match(hourRegex);
    if (matchH) {
      return Math.round(parseFloat(matchH[1]) * 60);
    }
    const minRegex = /^(\d+)\s*m?$/;
    const matchM = clean.match(minRegex);
    if (matchM) {
      return parseInt(matchM[1]);
    }
    const colonRegex = /^(\d+):(\d{2})$/;
    const matchColon = clean.match(colonRegex);
    if (matchColon) {
      return parseInt(matchColon[1]) * 60 + parseInt(matchColon[2]);
    }
    return null;
  };

  const formatElapsedTimer = (seconds) => {
    const s = seconds || 0;
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  const handleLogManualTime = async () => {
    const parsedMinutes = parseDurationStringToMinutes(manualDuration);
    if (!parsedMinutes || parsedMinutes <= 0) {
      toast.error('Please enter a valid duration (e.g. 2h 30m, 120, 1.5h)');
      return;
    }
    try {
      await timeApi.logManualTime(task._id, {
        duration: parsedMinutes,
        note: manualNote,
        date: manualDate
      });
      setManualDuration('');
      setManualNote('');
      fetchTimeEntries();
      dispatch(updateTask({ taskId: task._id, data: { version: task.version } }));
      toast.success('Time entry created');
    } catch (err) {
      toast.error('Failed to log time');
    }
  };

  const handleDeleteTimeEntry = async (entryId) => {
    if (window.confirm('Are you sure you want to delete this time entry?')) {
      try {
        await timeApi.deleteTimeEntry(task._id, entryId);
        fetchTimeEntries();
        dispatch(updateTask({ taskId: task._id, data: { version: task.version } }));
        toast.success('Time entry deleted');
      } catch (err) {
        toast.error('Failed to delete time entry');
      }
    }
  };

  // Dependencies handlers
  const handleAddDependency = async (blockingTaskId) => {
    try {
      await dependencyApi.addDependency(task._id, { blockingTaskId });
      fetchDependencies();
      setDependencyQuery('');
      setFilteredTasksForDep([]);
      dispatch(updateTask({ taskId: task._id, data: { version: task.version } }));
      toast.success('Dependency added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add dependency');
    }
  };

  const handleRemoveDependency = async (depId) => {
    try {
      await dependencyApi.removeDependency(task._id, depId);
      fetchDependencies();
      dispatch(updateTask({ taskId: task._id, data: { version: task.version } }));
      toast.success('Dependency removed');
    } catch (err) {
      toast.error('Failed to remove dependency');
    }
  };

  const handleBlockedReasonChange = (e) => {
    dispatch(updateTask({ taskId: task._id, data: { blockedReason: e.target.value, version: task.version } }));
  };

  // Attachments handlers
  const handleUploadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      toast.error('File size exceeds 25 MB limit');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('label', file.name);
    try {
      setUploadingFile(true);
      await attachmentApi.uploadAttachment('task', task._id, formData);
      fetchAttachments();
      dispatch(updateTask({ taskId: task._id, data: { version: task.version } }));
      toast.success('File uploaded successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleAddLinkAttachment = async () => {
    if (!linkUrl.trim()) return;
    try {
      await attachmentApi.addLinkAttachment('task', task._id, {
        url: linkUrl,
        label: linkLabel || linkUrl
      });
      setLinkUrl('');
      setLinkLabel('');
      fetchAttachments();
      dispatch(updateTask({ taskId: task._id, data: { version: task.version } }));
      toast.success('Link added successfully');
    } catch (err) {
      toast.error('Failed to add link');
    }
  };

  const handleDeleteAttachment = async (aid) => {
    if (window.confirm('Are you sure you want to delete this attachment?')) {
      try {
        await attachmentApi.deleteAttachment('task', task._id, aid);
        fetchAttachments();
        dispatch(updateTask({ taskId: task._id, data: { version: task.version } }));
        toast.success('Attachment deleted');
      } catch (err) {
        toast.error('Failed to delete attachment');
      }
    }
  };

  // Recurrence configuration handlers
  const handleRecurrenceToggle = (e) => {
    const checked = e.target.checked;
    setIsRecurring(checked);
    if (!checked) {
      dispatch(updateTask({
        taskId: task._id,
        data: {
          isRecurring: false,
          recurrenceRule: null,
          isRecurringTemplate: false,
          nextOccurrenceDate: null,
          recurrenceActive: false,
          version: task.version
        }
      }));
    } else {
      const rule = {
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [new Date().getDay()],
        dayOfMonth: new Date().getDate(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
      dispatch(updateTask({
        taskId: task._id,
        data: {
          isRecurring: true,
          recurrenceRule: rule,
          isRecurringTemplate: true,
          recurrenceActive: true,
          version: task.version
        }
      }));
      setRecurrenceRule(rule);
    }
  };

  const handleRecurrenceRuleChange = (updates) => {
    const newRule = { ...recurrenceRule, ...updates };
    setRecurrenceRule(newRule);
    dispatch(updateTask({
      taskId: task._id,
      data: {
        isRecurring: true,
        recurrenceRule: newRule,
        isRecurringTemplate: true,
        recurrenceActive: true,
        version: task.version
      }
    }));
  };

  useEffect(() => {
    if (dependencyQuery.trim().length < 2) {
      setFilteredTasksForDep([]);
      return;
    }
    const filtered = allTasks.filter(t => {
      if (t._id === task._id) return false;
      if (dependencies.blockedBy.some(b => b._id === t._id)) return false;
      if (dependencies.blocking.some(b => b._id === t._id)) return false;
      return t.title.toLowerCase().includes(dependencyQuery.toLowerCase());
    });
    setFilteredTasksForDep(filtered);
  }, [dependencyQuery, allTasks, dependencies.blockedBy, dependencies.blocking, task?._id]);

  // Subtasks
  const handleAddSubtask = async () => {
    const trimmed = newSubtaskTitle.trim();
    if (!trimmed) return;
    setAddingSubtask(true);
    try {
      const res = await subtaskApi.createSubtask(task._id, { title: trimmed });
      setSubtasks(prev => [...prev, res.data.data]);
      setNewSubtaskTitle('');
      // Update parent progress in store
      dispatch(updateTask({ taskId: task._id, data: { version: task.version } }));
    } catch (err) {
      toast.error('Failed to add subtask');
    } finally {
      setAddingSubtask(false);
    }
  };

  const handleToggleSubtask = async (subtask) => {
    try {
      const res = await subtaskApi.completeSubtask(task._id, subtask._id);
      const { subtask: updated } = res.data.data;
      setSubtasks(prev => prev.map(s => s._id === updated._id ? updated : s));
    } catch (err) {
      toast.error('Failed to update subtask');
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    try {
      await subtaskApi.deleteSubtask(task._id, subtaskId);
      setSubtasks(prev => prev.filter(s => s._id !== subtaskId));
    } catch (err) {
      toast.error('Failed to delete subtask');
    }
  };

  // My Day pin/unpin
  const handlePinToMyDay = async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const res = await dispatch(addTaskToMyDay({ taskId: task._id, date: todayStr }));
    if (addTaskToMyDay.fulfilled.match(res)) toast.success('Task pinned to My Day!');
    else toast.error(res.payload || 'Failed to pin task');
  };

  const handleUnpinFromMyDay = async () => {
    const res = await dispatch(removeTaskFromMyDay({ taskId: task._id }));
    if (removeTaskFromMyDay.fulfilled.match(res)) toast.success('Task removed from My Day');
    else toast.error(res.payload || 'Failed to unpin task');
  };

  // Subtask stats
  const totalSubtasks = subtasks.length;
  const completedSubtasks = subtasks.filter(s => s.status === 'Done').length;
  const progressPct = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  // Smart due date
  const { text: dueDateLabel, isOverdue } = smartDueDate(task.dueDate);

  const filteredMembers = (currentProject?.members || []).filter(m => {
    const memberName = m.user?.name || '';
    const memberUsername = m.user?.username || m.user?.name?.toLowerCase().replace(/[^a-z0-9]/g, '_') || '';
    const email = m.user?.email || '';
    return (
      memberName.toLowerCase().includes(mentionSearch.toLowerCase()) ||
      memberUsername.toLowerCase().includes(mentionSearch.toLowerCase()) ||
      email.toLowerCase().includes(mentionSearch.toLowerCase())
    );
  });

  const getActivityDescription = (activity) => {
    const actorName = activity.actor?.name || 'Someone';
    const { action, metadata } = activity;

    switch (action) {
      case 'created':
        return 'created this task';
      case 'assigned':
        return `assigned task to ${metadata?.toName || 'someone'}`;
      case 'unassigned':
        return 'unassigned this task';
      case 'status_changed':
        return `changed status: ${metadata?.from || 'Unknown'} → ${metadata?.to || 'Unknown'}`;
      case 'due_date_changed': {
        const fromD = metadata?.from ? new Date(metadata.from).toLocaleDateString() : 'none';
        const toD = metadata?.to ? new Date(metadata.to).toLocaleDateString() : 'none';
        return `changed due date: ${fromD} → ${toD}`;
      }
      case 'priority_changed':
        return `changed priority: ${metadata?.from || 'Medium'} → ${metadata?.to || 'Medium'}`;
      case 'member_added':
        return 'added member to task';
      case 'member_removed':
        return 'removed member from task';
      case 'subtask_added':
        return `added subtask: "${metadata?.title || 'untitled'}"`;
      case 'subtask_completed':
        return `completed subtask: "${metadata?.title || 'untitled'}"`;
      case 'completed':
        return 'completed this task';
      case 'reopened':
        return 'reopened this task';
      case 'description_changed':
        return 'updated the task description';
      case 'title_changed':
        return `changed title: "${metadata?.from || ''}" → "${metadata?.to || ''}"`;
      case 'attachment_added':
        return `uploaded ${metadata?.filename || 'a file'}`;
      default:
        return `${action} this task`;
    }
  };

  const isBlocked = task.status === 'Blocked';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task.title}>
      {hasConflict && (
        <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800 flex items-center justify-between shadow-sm">
          <span>This task was updated by another user. Sync to load the latest changes.</span>
          <Button size="sm" variant="ghost" onClick={() => {
            setDescription(task.description || '');
            initialTaskVersionRef.current = task.version;
            setHasConflict(false);
          }}>
            Sync Now
          </Button>
        </div>
      )}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Column: Details & Comments */}
        <div className="flex-1 space-y-5 min-w-0">

          {/* Blocked Banner */}
          {isBlocked && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 font-medium">
              <Lock className="h-4 w-4 shrink-0" />
              This task is blocked — update the status to resume progress.
            </div>
          )}

          {/* Description */}
          <div>
            <div className="flex items-center space-x-2 mb-2 font-medium text-surface-800">
              <AlignLeft className="h-5 w-5 text-surface-500" />
              <h3>Description</h3>
            </div>
            {isEditingDesc ? (
              <div className="space-y-2">
                <textarea
                  autoFocus
                  className="w-full rounded-md border border-surface-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px] custom-scrollbar"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a more detailed description..."
                />
                <div className="flex space-x-2">
                  <Button size="sm" onClick={handleUpdateDescription}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingDesc(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setIsEditingDesc(true)}
                className="min-h-[60px] cursor-pointer rounded-md bg-surface-50 p-3 text-sm text-surface-700 hover:bg-surface-100 transition-colors"
              >
                {description || <span className="italic text-surface-400">Click to add a description...</span>}
              </div>
            )}
          </div>

          {/* Subtasks Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 font-medium text-surface-800">
                <CheckSquare className="h-5 w-5 text-surface-500" />
                <h3>Subtasks</h3>
                {totalSubtasks > 0 && (
                  <span className="text-xs font-bold text-surface-500 bg-surface-100 rounded-full px-2 py-0.5">
                    {completedSubtasks}/{totalSubtasks}
                  </span>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {totalSubtasks > 0 && (
              <div className="mb-3 space-y-1">
                <div className="flex justify-between text-[10px] text-surface-500 font-medium">
                  <span>{progressPct}% complete</span>
                  <span>{completedSubtasks} of {totalSubtasks}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-200 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", progressPct === 100 ? "bg-green-500" : "bg-primary-500")}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                {progressPct === 100 && (
                  <p className="text-xs text-green-600 font-semibold">🎉 All subtasks complete!</p>
                )}
              </div>
            )}

            {/* Subtask List */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
              {loadingSubtasks ? (
                <div className="text-xs text-surface-400 py-2">Loading subtasks...</div>
              ) : subtasks.length === 0 ? (
                <div className="text-xs text-surface-400 italic py-1">No subtasks yet. Add one below.</div>
              ) : (
                subtasks.map(subtask => (
                  <div
                    key={subtask._id}
                    className={cn(
                      "group flex items-center gap-2 rounded-md p-2 hover:bg-surface-50 transition-colors",
                      subtask.status === 'Done' && "opacity-60"
                    )}
                  >
                    <button
                      onClick={() => handleToggleSubtask(subtask)}
                      className="text-surface-400 hover:text-green-500 transition-colors shrink-0"
                    >
                      {subtask.status === 'Done'
                        ? <CheckSquare className="h-4 w-4 text-green-500" />
                        : <Square className="h-4 w-4" />
                      }
                    </button>
                    <span className={cn("flex-1 text-sm", subtask.status === 'Done' && "line-through text-surface-400")}>
                      {subtask.title}
                    </span>
                    <button
                      onClick={() => handleDeleteSubtask(subtask._id)}
                      className="opacity-0 group-hover:opacity-100 text-surface-400 hover:text-red-500 transition-opacity p-0.5"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Subtask Input */}
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                className="flex-1 rounded-md border border-surface-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Add a subtask..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
              />
              <Button size="sm" onClick={handleAddSubtask} disabled={addingSubtask || !newSubtaskTitle.trim()}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center gap-2 mb-2 font-medium text-surface-800">
              <Tag className="h-5 w-5 text-surface-500" />
              <h3>Tags</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(task.tags || []).map(tag => (
                <span
                  key={tag}
                  className="flex items-center gap-1 rounded-full bg-primary-100 text-primary-700 px-2.5 py-0.5 text-xs font-semibold"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-primary-500 hover:text-primary-800 ml-0.5"
                  >
                    <SunOff className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {showTagInput ? (
                <input
                  autoFocus
                  type="text"
                  className="rounded-full border border-surface-300 px-3 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 w-28"
                  placeholder="Tag name..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddTag(); if (e.key === 'Escape') setShowTagInput(false); }}
                  onBlur={() => { handleAddTag(); setShowTagInput(false); }}
                />
              ) : (
                <button
                  onClick={() => setShowTagInput(true)}
                  className="flex items-center gap-1 rounded-full border border-dashed border-surface-300 px-2.5 py-0.5 text-xs text-surface-500 hover:border-primary-400 hover:text-primary-600 transition-colors"
                >
                  <Plus className="h-3 w-3" /> Add tag
                </button>
              )}
            </div>
          </div>

          {/* Tabs Container */}
          {/* Tabs Container */}
          <div className="border-t border-surface-200 pt-4 mt-6">
            <div className="flex border-b border-surface-200 mb-4 overflow-x-auto scrollbar-none gap-2">
              {[
                { id: 'comments', label: `Comments (${comments.length})` },
                { id: 'activity', label: 'Activity' },
                { id: 'attachments', label: `Attachments (${attachments.length})` },
                { id: 'time', label: 'Time Tracking' },
                { id: 'dependencies', label: 'Dependencies' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  className={cn(
                    "pb-2 px-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer focus:outline-none whitespace-nowrap",
                    activeTab === tab.id
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-surface-500 hover:text-surface-800"
                  )}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === 'attachments') fetchAttachments();
                    if (tab.id === 'time') {
                      fetchTimeEntries();
                      fetchTimerStatus();
                    }
                    if (tab.id === 'dependencies') fetchDependencies();
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'comments' && (
              <div className="space-y-4">
                {/* Comments List */}
                <div className="max-h-60 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                  {comments.length === 0 && !loadingComments ? (
                    <p className="text-sm text-surface-400 italic">No comments yet. Be the first!</p>
                  ) : (
                    comments.map(comment => {
                      const isAuthor = comment.author?._id === user?._id;
                      const authorName = comment.author?.name || 'User';
                      const authorUsername = comment.author?.username || comment.author?.name?.toLowerCase().replace(/[^a-z0-9]/g, '_') || '';
                      
                      return (
                        <div key={comment._id} className="flex items-start gap-3 group">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                            {authorName.charAt(0).toUpperCase()}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs font-semibold text-surface-800">{authorName}</span>
                              <span className="text-[10px] text-surface-400">@{authorUsername}</span>
                              <span className="text-[10px] text-surface-400">•</span>
                              <span className="text-[10px] text-surface-400">
                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                              </span>
                            </div>

                            {editingCommentId === comment._id ? (
                              <div className="mt-2 space-y-2">
                                <textarea
                                  className="w-full rounded border border-surface-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[60px] resize-none"
                                  value={editingCommentText}
                                  onChange={(e) => setEditingCommentText(e.target.value)}
                                />
                                <div className="flex space-x-2">
                                  <Button size="sm" onClick={() => handleEditComment(comment._id)}>Save</Button>
                                  <Button size="sm" variant="ghost" onClick={() => setEditingCommentId(null)}>Cancel</Button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-surface-700 mt-1 break-words">
                                {comment.content || comment.message}
                                {comment.isEdited && (
                                  <span className="text-[10px] text-surface-400 ml-1.5 italic" title={`Edited at ${new Date(comment.editedAt).toLocaleString()}`}>(edited)</span>
                                )}
                              </p>
                            )}
                          </div>

                          {/* Comment Actions (Edit / Delete) */}
                          <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity shrink-0">
                            {isAuthor && editingCommentId !== comment._id && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCommentId(comment._id);
                                  setEditingCommentText(comment.content || comment.message);
                                }}
                                className="p-1 text-surface-400 hover:text-primary-600 transition-colors"
                                title="Edit comment"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </button>
                            )}
                            {(isAuthor || (currentProject?.members || []).some(m => m.user?._id === user?._id && (m.role === 'admin' || m.role === 'owner'))) && (
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(comment._id)}
                                className="p-1 text-surface-400 hover:text-red-500 transition-colors"
                                title="Delete comment"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {hasMoreComments && (
                    <div className="text-center pt-2">
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => fetchComments(commentsPage + 1, true)}
                        disabled={loadingComments}
                      >
                        {loadingComments ? 'Loading...' : 'Load more comments'}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Comment Input Box with Autocomplete Mentions */}
                <div className="relative flex gap-2 pt-2">
                  <textarea
                    rows="2"
                    className="flex-1 rounded-md border border-surface-300 px-3 py-1.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none custom-scrollbar"
                    placeholder="Write a comment... (use @ to mention teammates)"
                    value={newComment}
                    onChange={handleCommentChange}
                    onKeyDown={handleKeyDown}
                  />
                  <Button className="self-end" size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
                    <Send className="h-3.5 w-3.5" />
                  </Button>

                  {/* Mentions Dropdown list overlay */}
                  {showMentionsDropdown && filteredMembers.length > 0 && (
                    <div className="absolute bottom-full left-0 mb-1.5 w-56 rounded-md border border-surface-200 bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50 max-h-36 overflow-y-auto custom-scrollbar">
                      {filteredMembers.map((m, idx) => {
                        const memberId = m.user?._id || m.user;
                        const memberName = m.user?.name || '';
                        const memberUsername = m.user?.username || m.user?.name?.toLowerCase().replace(/[^a-z0-9]/g, '_') || '';
                        
                        return (
                          <button
                            key={memberId}
                            type="button"
                            onClick={() => handleSelectMention(m)}
                            className={cn(
                              "w-full text-left px-3 py-2 text-xs hover:bg-primary-50 transition-colors flex items-center gap-2 border-b border-surface-50 last:border-0",
                              idx === mentionIndex && "bg-primary-50 text-primary-600 font-semibold"
                            )}
                          >
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-[10px] font-bold text-primary-700">
                              {memberName.charAt(0).toUpperCase()}
                            </div>
                            <div className="truncate">
                              <p className="font-semibold text-surface-800">{memberName}</p>
                              <p className="text-[10px] text-surface-400">@{memberUsername}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4">
                <div className="max-h-60 overflow-y-auto space-y-4 custom-scrollbar pr-1">
                  {activities.length === 0 && !loadingActivities ? (
                    <p className="text-sm text-surface-400 italic">No activity recorded for this task.</p>
                  ) : (
                    activities.map(activity => {
                      const actorName = activity.actor?.name || 'Someone';
                      return (
                        <div key={activity._id} className="flex items-start gap-3 border-l-2 border-surface-150 pl-3 relative left-1 last:border-transparent">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-100 text-[10px] font-bold text-surface-600">
                            {actorName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 text-xs text-surface-600">
                            <span className="font-semibold text-surface-800">{actorName}</span>{' '}
                            {getActivityDescription(activity)}
                            <span className="block text-[10px] text-surface-400 mt-0.5">
                              {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {hasMoreActivities && (
                    <div className="text-center pt-2">
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => fetchActivities(activitiesPage + 1, true)}
                        disabled={loadingActivities}
                      >
                        {loadingActivities ? 'Loading...' : 'Load more activity'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'attachments' && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-surface-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors relative">
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleUploadFile}
                    disabled={uploadingFile}
                  />
                  <div className="space-y-1">
                    <Paperclip className="mx-auto h-8 w-8 text-surface-400" />
                    <p className="text-sm font-medium text-surface-700">
                      {uploadingFile ? 'Uploading file...' : 'Drag & drop a file here, or click to browse'}
                    </p>
                    <p className="text-xs text-surface-400">Max size: 25 MB. Executables rejected.</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 bg-surface-50 p-3 rounded-lg border border-surface-200">
                  <input
                    type="url"
                    placeholder="Paste external link (e.g. Google Doc)"
                    className="flex-1 rounded-md border border-surface-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Link label"
                    className="flex-1 rounded-md border border-surface-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                    value={linkLabel}
                    onChange={(e) => setLinkLabel(e.target.value)}
                  />
                  <Button size="sm" onClick={handleAddLinkAttachment} disabled={!linkUrl.trim()}>
                    Add Link
                  </Button>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                  {loadingAttachments ? (
                    <div className="text-xs text-surface-400 py-2">Loading attachments...</div>
                  ) : attachments.length === 0 ? (
                    <p className="text-sm text-surface-400 italic">No attachments logged yet.</p>
                  ) : (
                    attachments.map(att => {
                      const isUpload = att.type === 'upload';
                      const formattedSize = isUpload ? `${(att.size / (1024 * 1024)).toFixed(2)} MB` : 'Link';
                      const uploaderName = att.uploadedBy?.name || 'Someone';

                      return (
                        <div key={att._id} className="flex items-center justify-between p-2.5 rounded-lg border border-surface-200 bg-white hover:shadow-sm transition-shadow">
                          <div className="flex items-center gap-3 min-w-0">
                            {isUpload ? (
                              <Paperclip className="h-5 w-5 text-primary-500 shrink-0" />
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                            )}
                            <div className="min-w-0 flex-1">
                              {isUpload ? (
                                <a
                                  href={`/api/v1/files/${att.storedName}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-semibold text-primary-600 hover:underline block truncate"
                                >
                                  {att.originalName}
                                </a>
                              ) : (
                                <a
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-semibold text-green-600 hover:underline block truncate"
                                >
                                  {att.label || att.url}
                                </a>
                              )}
                              <p className="text-[10px] text-surface-400 mt-0.5">
                                {formattedSize} • Added by {uploaderName} • {formatDistanceToNow(new Date(att.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteAttachment(att._id)}
                            className="p-1 text-surface-400 hover:text-red-500 transition-colors"
                            title="Delete attachment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {activeTab === 'time' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 bg-surface-50 p-4 rounded-lg border border-surface-200">
                  <div>
                    <p className="text-xs text-surface-500 uppercase tracking-wide font-medium">Estimated Time</p>
                    <p className="text-lg font-bold text-surface-800">{task.estimatedDuration ? `${(task.estimatedDuration / 60).toFixed(1)}h` : 'None'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-500 uppercase tracking-wide font-medium">Actual Spent</p>
                    <p className="text-lg font-bold text-surface-800">
                      {task.actualDuration ? `${(task.actualDuration / 60).toFixed(1)}h` : '0h'}
                      {task.estimatedDuration && task.actualDuration ? (
                        <span className={cn(
                          "text-xs font-semibold ml-2",
                          task.actualDuration > task.estimatedDuration ? "text-red-600" : "text-green-600"
                        )}>
                          ({Math.round((task.actualDuration / task.estimatedDuration) * 100)}%)
                        </span>
                      ) : null}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-primary-50/50 p-4 rounded-lg border border-primary-100">
                  <div className="flex items-center gap-3">
                    {timerStatus.status === 'running' ? (
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                    ) : (
                      <Clock className="h-5 w-5 text-primary-500" />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-primary-900">
                        {timerStatus.status === 'running' ? 'Timer is running' : timerStatus.status === 'paused' ? 'Timer is paused' : 'Time tracker'}
                      </p>
                      <p className="text-xs text-primary-700 mt-0.5 flex items-center gap-1">
                        Elapsed: <span className="font-mono font-bold">{formatElapsedTimer(timerStatus.elapsedSeconds)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {timerStatus.status === 'idle' && (
                      <Button size="sm" onClick={handleStartTimer}>
                        <Play className="h-3.5 w-3.5 mr-1" /> Start
                      </Button>
                    )}
                    {timerStatus.status === 'running' && (
                      <>
                        <Button size="sm" variant="ghost" onClick={handlePauseTimer}>
                          <Pause className="h-3.5 w-3.5 mr-1" /> Pause
                        </Button>
                        <Button size="sm" variant="danger" onClick={handleStopTimer}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="4" y="4" width="16" height="16" rx="2" strokeWidth={2} /></svg> Stop
                        </Button>
                      </>
                    )}
                    {timerStatus.status === 'paused' && (
                      <>
                        <Button size="sm" onClick={handleResumeTimer}>
                          <Play className="h-3.5 w-3.5 mr-1" /> Resume
                        </Button>
                        <Button size="sm" variant="danger" onClick={handleStopTimer}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="4" y="4" width="16" height="16" rx="2" strokeWidth={2} /></svg> Stop
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-surface-50 p-4 rounded-lg border border-surface-200 space-y-3">
                  <h4 className="text-xs font-bold text-surface-800 uppercase tracking-wide">Log Time Manually</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Duration (e.g. 1h 30m, 2h, 45m)"
                      className="rounded-md border border-surface-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                      value={manualDuration}
                      onChange={(e) => setManualDuration(e.target.value)}
                    />
                    <input
                      type="date"
                      className="rounded-md border border-surface-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                    />
                    <Button size="sm" className="sm:self-center" onClick={handleLogManualTime} disabled={!manualDuration.trim()}>
                      Log Time
                    </Button>
                  </div>
                  <input
                    type="text"
                    placeholder="Short description note"
                    className="w-full rounded-md border border-surface-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                    value={manualNote}
                    onChange={(e) => setManualNote(e.target.value)}
                  />
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                  <h4 className="text-xs font-bold text-surface-800 uppercase tracking-wide mb-2">Time Entries Log</h4>
                  {loadingTimeEntries ? (
                    <div className="text-xs text-surface-400 py-2">Loading time entries...</div>
                  ) : timeEntries.length === 0 ? (
                    <p className="text-sm text-surface-400 italic">No time entries recorded.</p>
                  ) : (
                    timeEntries.map(entry => {
                      const dateStr = new Date(entry.startTime || entry.createdAt).toLocaleDateString();
                      const entryUserName = entry.user?.name || 'Someone';

                      return (
                        <div key={entry._id} className="flex items-center justify-between p-2.5 rounded-lg border border-surface-200 bg-white">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-surface-800">
                              {entry.duration}m spent
                              <span className="text-xs font-normal text-surface-500 ml-2">by {entryUserName}</span>
                            </p>
                            {entry.note && (
                              <p className="text-xs text-surface-600 mt-1 italic font-light">"{entry.note}"</p>
                            )}
                            <p className="text-[10px] text-surface-400 mt-0.5">{dateStr} {entry.isManual && '• Manual'}</p>
                          </div>

                          {(entry.user?._id === user?._id || user?.role === 'admin' || user?.role === 'owner') && (
                            <button
                              type="button"
                              onClick={() => handleDeleteTimeEntry(entry._id)}
                              className="p-1 text-surface-400 hover:text-red-500 transition-colors"
                              title="Delete entry"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {activeTab === 'dependencies' && (
              <div className="space-y-4">
                <div className="bg-surface-50 p-4 rounded-lg border border-surface-200 space-y-2">
                  <label className="text-xs font-bold text-surface-700 uppercase tracking-wide">Blocked Reason</label>
                  <textarea
                    rows="2"
                    placeholder="Enter reason if this task is blocked (e.g. waiting on assets)"
                    className="w-full rounded border border-surface-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
                    value={task.blockedReason || ''}
                    onChange={handleBlockedReasonChange}
                  />
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-surface-800 uppercase tracking-wide">Blocked By (Blockers)</h4>
                  {dependencies.blockedBy.length === 0 ? (
                    <p className="text-xs text-surface-400 italic">No blockers linked. This task is not blocked by other tasks.</p>
                  ) : (
                    dependencies.blockedBy.map(b => (
                      <div key={b._id} className="flex items-center justify-between p-2 rounded-lg border border-surface-200 bg-white">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-surface-800 truncate">{b.title}</p>
                          <p className="text-[10px] text-surface-400 mt-0.5">Status: {b.status}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleRemoveDependency(b._id)}
                            className="p-1 text-surface-400 hover:text-red-500 transition-colors"
                            title="Remove blocker"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-surface-800 uppercase tracking-wide">Blocking (Dependents)</h4>
                  {dependencies.blocking.length === 0 ? (
                    <p className="text-xs text-surface-400 italic">This task is not blocking any other tasks.</p>
                  ) : (
                    dependencies.blocking.map(b => (
                      <div key={b._id} className="flex items-center justify-between p-2 rounded-lg border border-surface-200 bg-white">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-surface-800 truncate">{b.title}</p>
                          <p className="text-[10px] text-surface-400 mt-0.5">Status: {b.status}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleRemoveDependency(b._id)}
                            className="p-1 text-surface-400 hover:text-red-500 transition-colors"
                            title="Remove dependency"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-surface-200 pt-3 space-y-2 relative">
                  <label className="text-xs font-bold text-surface-800 uppercase tracking-wide block">Add Blocker Task</label>
                  <input
                    type="text"
                    placeholder="Search tasks in this project to add as blocker..."
                    className="w-full rounded border border-surface-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                    value={dependencyQuery}
                    onChange={(e) => setDependencyQuery(e.target.value)}
                  />

                  {filteredTasksForDep.length > 0 && (
                    <div className="absolute bottom-full mb-1 left-0 right-0 rounded-md border border-surface-200 bg-white shadow-lg z-50 max-h-36 overflow-y-auto custom-scrollbar">
                      {filteredTasksForDep.map(t => (
                        <button
                          key={t._id}
                          type="button"
                          onClick={() => handleAddDependency(t._id)}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-primary-50 transition-colors flex justify-between items-center border-b border-surface-50 last:border-0"
                        >
                          <span className="font-medium text-surface-800 truncate pr-2">{t.title}</span>
                          <span className="text-[10px] text-surface-400 shrink-0 font-semibold">{t.status}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Actions & Metadata */}
        <div className="w-full md:w-52 space-y-4 shrink-0">

          {/* Status */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Status</label>
            <select
              className={cn(
                "w-full rounded px-2 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500",
                STATUS_COLORS[task.status] || 'bg-surface-100 text-surface-600'
              )}
              value={task.status}
              onChange={handleStatusChange}
            >
              {['Backlog', 'Todo', 'In Progress', 'Review', 'Blocked', 'Done'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Priority</label>
            <select
              className={cn(
                "w-full rounded px-2 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500",
                PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.Medium
              )}
              value={task.priority}
              onChange={handlePriorityChange}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          {/* Context */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Context</label>
            <select
              className="w-full rounded bg-surface-100 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={task.context || 'work'}
              onChange={handleContextChange}
            >
              {['work', 'personal', 'study', 'health', 'finance', 'family', 'other'].map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Assignee */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Assignee</label>
            <AssigneeSelector task={task} dispatch={dispatch} />
          </div>

          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Start Date</label>
            <input
              type="date"
              className="w-full rounded bg-surface-100 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : ''}
              onChange={handleStartDateChange}
            />
          </div>

          {/* Due Date */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Due Date</label>
            <input
              type="date"
              className="w-full rounded bg-surface-100 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
              onChange={handleDueDateChange}
            />
            {task.dueDate && (
              <p className={cn("text-[11px] font-semibold mt-0.5", isOverdue ? "text-red-600" : "text-surface-500")}>
                {dueDateLabel}
              </p>
            )}
          </div>

          {/* Est. Duration */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Est. Duration (min)</label>
            <input
              type="number"
              placeholder="Minutes"
              min="0"
              className="w-full rounded bg-surface-100 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={task.estimatedDuration || ''}
              onChange={handleEstimatedDurationChange}
            />
          </div>

          {/* Recurrence Configuration */}
          <div className="space-y-2 pt-2 border-t border-surface-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Repeat Task</label>
              <input
                type="checkbox"
                className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer"
                checked={isRecurring}
                onChange={handleRecurrenceToggle}
              />
            </div>
            {isRecurring && (
              <div className="bg-surface-50 p-2 rounded-lg border border-surface-200 space-y-2 text-xs">
                <div>
                  <label className="text-surface-500 font-medium block mb-1">Frequency</label>
                  <select
                    className="w-full rounded bg-white border border-surface-300 px-2 py-1 text-xs"
                    value={recurrenceRule.frequency}
                    onChange={(e) => handleRecurrenceRuleChange({ frequency: e.target.value })}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="text-surface-500 font-medium block mb-1">Interval (every N)</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full rounded bg-white border border-surface-300 px-2 py-1 text-xs"
                    value={recurrenceRule.interval}
                    onChange={(e) => handleRecurrenceRuleChange({ interval: parseInt(e.target.value) || 1 })}
                  />
                </div>

                {recurrenceRule.frequency === 'weekly' && (
                  <div>
                    <label className="text-surface-500 font-medium block mb-1">Days of Week</label>
                    <div className="flex flex-wrap gap-1">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => {
                        const active = recurrenceRule.daysOfWeek.includes(idx);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              const current = [...recurrenceRule.daysOfWeek];
                              const newDays = current.includes(idx)
                                ? current.filter(d => d !== idx)
                                : [...current, idx];
                              handleRecurrenceRuleChange({ daysOfWeek: newDays });
                            }}
                            className={cn(
                              "h-5 w-5 rounded-full flex items-center justify-center font-bold text-[9px] cursor-pointer",
                              active ? "bg-primary-500 text-white" : "bg-white border border-surface-300 text-surface-500"
                            )}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-surface-400 italic mt-1 leading-normal">
                  Repeats every {recurrenceRule.interval > 1 ? `${recurrenceRule.interval} ` : ''}{recurrenceRule.frequency}.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-surface-200 space-y-2">
            {task.myDayDate ? (
              <Button
                variant="ghost"
                className="w-full justify-start text-amber-600 hover:bg-amber-50"
                size="sm"
                onClick={handleUnpinFromMyDay}
              >
                <SunOff className="mr-2 h-4 w-4" />
                Remove from My Day
              </Button>
            ) : (
              <Button
                variant="ghost"
                className="w-full justify-start text-amber-600 hover:bg-amber-50"
                size="sm"
                onClick={handlePinToMyDay}
              >
                <Sun className="mr-2 h-4 w-4" />
                Add to My Day
              </Button>
            )}
            <Button
              variant="danger"
              className="w-full justify-start"
              size="sm"
              onClick={handleDeleteTask}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Task
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TaskDetailModal;
