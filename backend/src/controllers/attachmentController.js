const Attachment = require('../models/Attachment');
const Task = require('../models/Task');
const Project = require('../models/Project');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const activityService = require('../services/activityService');
const path = require('path');
const fs = require('fs');

const downloadFile = asyncHandler(async (req, res) => {
  const { storedName } = req.params;
  const attachment = await Attachment.findOne({ storedName });
  if (!attachment) {
    throw new ApiError(404, 'File not found');
  }

  let project = null;
  if (attachment.entityType === 'task') {
    const task = await Task.findById(attachment.entityId);
    if (!task) {
      throw new ApiError(404, 'Associated task not found');
    }
    project = await Project.findById(task.project);
  } else {
    project = await Project.findById(attachment.entityId);
  }

  if (!project) {
    throw new ApiError(404, 'Associated project not found');
  }

  const isMember = project.members.some(m => m.user.toString() === req.user._id.toString());
  if (!isMember) {
    throw new ApiError(403, 'You do not have access to this file');
  }

  const filePath = path.join(
    __dirname,
    '..',
    '..',
    'uploads',
    attachment.entityType === 'task' ? 'tasks' : 'projects',
    attachment.entityId.toString(),
    storedName
  );

  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, 'File not found on disk');
  }

  res.setHeader('Content-Type', attachment.mimeType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
  res.sendFile(filePath);
});

const getAttachments = asyncHandler(async (req, res) => {
  const entityId = req.params.id;
  const entityType = req.baseUrl.includes('projects') ? 'project' : 'task';

  const attachments = await Attachment.find({ entityId, entityType })
    .populate('uploadedBy', 'name avatar');

  res.status(200).json(new ApiResponse(200, attachments, 'Attachments fetched successfully'));
});

const uploadAttachment = asyncHandler(async (req, res) => {
  const entityId = req.params.id;
  const entityType = req.baseUrl.includes('projects') ? 'project' : 'task';
  const label = req.body.label || '';

  if (!req.file) {
    throw new ApiError(400, 'File is required');
  }

  const attachment = await Attachment.create({
    originalName: req.file.originalname,
    storedName: req.file.filename,
    mimeType: req.file.mimetype,
    size: req.file.size,
    url: `/api/files/${req.file.filename}`,
    type: 'upload',
    label,
    uploadedBy: req.user._id,
    entityType,
    entityId
  });

  if (entityType === 'task') {
    const task = await Task.findById(entityId);
    if (task) {
      task.attachments.push(attachment._id);
      task.version += 1;
      await task.save();
    }
  } else {
    const project = await Project.findById(entityId);
    if (project) {
      project.attachments.push(attachment._id);
      await project.save();
    }
  }

  if (entityType === 'task') {
    await activityService.recordActivity(entityId, req.user._id, 'attachment_added', {
      filename: req.file.originalname,
      type: 'upload'
    });
  }

  res.status(201).json(new ApiResponse(201, attachment, 'File uploaded successfully'));
});

const addLinkAttachment = asyncHandler(async (req, res) => {
  const entityId = req.params.id;
  const entityType = req.baseUrl.includes('projects') ? 'project' : 'task';
  const { url, label } = req.body;

  if (!url) {
    throw new ApiError(400, 'URL is required');
  }

  const attachment = await Attachment.create({
    originalName: label || url,
    url,
    type: 'link',
    label: label || url,
    uploadedBy: req.user._id,
    entityType,
    entityId
  });

  if (entityType === 'task') {
    const task = await Task.findById(entityId);
    if (task) {
      task.attachments.push(attachment._id);
      task.version += 1;
      await task.save();
    }
  } else {
    const project = await Project.findById(entityId);
    if (project) {
      project.attachments.push(attachment._id);
      await project.save();
    }
  }

  if (entityType === 'task') {
    await activityService.recordActivity(entityId, req.user._id, 'attachment_added', {
      filename: label || url,
      type: 'link'
    });
  }

  res.status(201).json(new ApiResponse(201, attachment, 'Link attachment added successfully'));
});

const deleteAttachment = asyncHandler(async (req, res) => {
  const { aid } = req.params;
  const entityId = req.params.id;
  const entityType = req.baseUrl.includes('projects') ? 'project' : 'task';

  const attachment = await Attachment.findById(aid);
  if (!attachment) {
    throw new ApiError(404, 'Attachment not found');
  }

  let project = null;
  if (entityType === 'task') {
    const task = await Task.findById(entityId);
    if (task) {
      project = await Project.findById(task.project);
    }
  } else {
    project = await Project.findById(entityId);
  }

  const isUploader = attachment.uploadedBy.toString() === req.user._id.toString();
  const isAdmin = project && project.members.some(m => m.user.toString() === req.user._id.toString() && (m.role === 'admin' || m.role === 'owner'));

  if (!isUploader && !isAdmin) {
    throw new ApiError(403, 'You are not authorized to delete this attachment');
  }

  if (attachment.type === 'upload' && attachment.storedName) {
    const filePath = path.join(
      __dirname,
      '..',
      '..',
      'uploads',
      attachment.entityType === 'task' ? 'tasks' : 'projects',
      attachment.entityId.toString(),
      attachment.storedName
    );
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  if (entityType === 'task') {
    const task = await Task.findById(entityId);
    if (task) {
      task.attachments = task.attachments.filter(id => id.toString() !== aid.toString());
      task.version += 1;
      await task.save();
    }
  } else {
    const project = await Project.findById(entityId);
    if (project) {
      project.attachments = project.attachments.filter(id => id.toString() !== aid.toString());
      await project.save();
    }
  }

  await Attachment.deleteOne({ _id: aid });

  if (entityType === 'task') {
    await activityService.recordActivity(entityId, req.user._id, 'attachment_removed', {
      filename: attachment.originalName
    });
  }

  res.status(200).json(new ApiResponse(200, {}, 'Attachment deleted successfully'));
});

module.exports = {
  downloadFile,
  getAttachments,
  uploadAttachment,
  addLinkAttachment,
  deleteAttachment
};
