const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true
    },
    storedName: {
      type: String
    },
    mimeType: {
      type: String
    },
    size: {
      type: Number
    },
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['upload', 'link'],
      required: true
    },
    label: {
      type: String,
      default: ''
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    entityType: {
      type: String,
      enum: ['task', 'project'],
      required: true
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    }
  },
  {
    timestamps: true
  }
);

attachmentSchema.index({ entityType: 1, entityId: 1 });

const Attachment = mongoose.model('Attachment', attachmentSchema);
module.exports = Attachment;
