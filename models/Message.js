const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderName: { type: String, required: true },
    senderUsername: { type: String },
    text: { type: String, required: true },
    mentions: [{ type: String }],
    room: { type: String, default: 'general' },

    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null = public chat
    },
    type: {
      type: String,
      enum: ['message', 'dm', 'connection', 'event_invite'],
      default: 'message',
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    media: {
      type: String,
      default: null,
    },
    reactions: {
      type: Map,
      of: [mongoose.Schema.Types.ObjectId],
      default: {},
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
