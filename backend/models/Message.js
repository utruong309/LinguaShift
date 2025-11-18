import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema({
  name: String,
  url: String,
  mimeType: String,
  sizeBytes: Number
}, { _id: false });

const messageSchema = new mongoose.Schema(
  {
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
      required: true
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    textOriginal: { type: String, required: true },
    textSimplified: { type: String },
    usedSimplified: { type: Boolean, default: false },
    jargonScore: { type: Number, default: 0 },
    jargonSpans: [
      {
        start: Number,
        end: Number,
        confidence: Number
      }
    ]
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;