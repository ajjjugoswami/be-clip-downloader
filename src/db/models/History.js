const { Schema, model, Types } = require("mongoose");

const historySchema = new Schema(
  {
    userId:    { type: Types.ObjectId, ref: "User", required: true, index: true },
    title:     { type: String, required: true, maxlength: 500 },
    url:       { type: String, default: "", maxlength: 2000 },
    platform:  { type: String, default: "other", maxlength: 50 },
    quality:   { type: String, default: "", maxlength: 50 },
    thumbnail: { type: String, default: "", maxlength: 2000 },
    type:      { type: String, enum: ["download", "clip"], required: true },
    timestamp: { type: Number, default: () => Date.now() },
  },
  { timestamps: true }
);

module.exports = model("History", historySchema);
