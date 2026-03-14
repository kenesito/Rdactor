const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  }
);

const contentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'El título es requerido'],
      trim: true,
    },
    body: {
      type: String,
      required: [true, 'El contenido es requerido'],
    },
    type: {
      type: String,
      enum: ['social', 'blog', 'email', 'script'],
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'pending_review', 'changes_requested', 'approved', 'published'],
      default: 'draft',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedEditor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    comments: [commentSchema],
    publishedAt: {
      type: Date,
      default: null,
    },
    tags: [{ type: String, trim: true }],
    platform: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Index para búsquedas frecuentes
contentSchema.index({ status: 1, author: 1 });
contentSchema.index({ assignedEditor: 1, status: 1 });

module.exports = mongoose.model('Content', contentSchema);