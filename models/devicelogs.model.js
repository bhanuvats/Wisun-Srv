// devicelogs.model.js
const mongoose = require("mongoose");

const DeviceLogSchema = new mongoose.Schema({
  deviceId: String,
  parent: String,
  connected: Boolean,
  disconnected: Boolean,
  connections: Number,
  availability: Number,
  humidity: Number,
  temperature: Number,
  neighbor_info: [{}],
  // timestamp: { type: Date, default: Date.now }
}, { timestamps: true });


module.exports = mongoose.model("DeviceLog", DeviceLogSchema);
