// devices.model.js
const mongoose = require("mongoose");

const DeviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  chip: String,
  parent: String,
  running: String,
  connected: Boolean,
  disconnected: Boolean,
  connections: Number,
  availability: Number,
  connected_total: Number,
  disconnected_total: Number,
  Wisun_Data: String,
  humidity: Number,
  temperature: Number,
  neighbor_info: [{ id: String, rsl_in: Number, rsl_out: Number }],
  lastSeenAt: Date,
  // updatedAt: Date
}, { timestamps: true });


module.exports = mongoose.model("Device", DeviceSchema);
