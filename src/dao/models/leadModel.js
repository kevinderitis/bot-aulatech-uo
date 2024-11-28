import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  name: {
    type: String
  },
  chatId: {
    type: String,
    unique: true,
  },
  status: {
    type: String,
    default: 'pending'
  },
  threadId: {
    type: String
  },
  stage: {
    type: String,
    default: 'welcome'
  },
  lastMessageSentAt: {
    type: Date,
    default: () => new Date(),
  },
}, { timestamps: true });

const Lead = mongoose.model('Lead', leadSchema);

export default Lead;
