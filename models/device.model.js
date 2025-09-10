// devices.model.js
const mongoose = require("mongoose");

const DeviceSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // device ID
  chip: String,
  parent: String,
  running: String,
  connected: String,
  disconnected: { type: Boolean, default: false },
  connections: Number,
  availability: Number,
  connected_total: String,
  disconnected_total: String,
  wisun_data: String,
  rsl_in: Number,
  rsl_out: Number,
  is_lfn: Number,
  lastSeenAt: { type: Date, default: Date.now },
  // updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Device", DeviceSchema);
