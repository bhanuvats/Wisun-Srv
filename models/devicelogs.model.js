// devicelogs.model.js
const mongoose = require("mongoose");

const DeviceLogSchema = new mongoose.Schema({
  device: { type: String, required: true },
  parent: String,
  status: { type: String, enum: ["connected", "disconnected", "switched_parent"] },
  rsl_in: Number,
  rsl_out: Number,
  connections: Number,
  availability: Number,
  // timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("DeviceLog", DeviceLogSchema);
