const dgram = require("dgram");
const client = dgram.createSocket("udp4");

const message = JSON.stringify({
  device: "ab96",
  chip: "xG28",
  parent: "ab48",
  running: "0-00:10:21",
  connected: "0-00:09:13",
  disconnected: "no",
  connections: 1,
  availability: 100.0,
  connected_total: "0-00:09:13",
  disconnected_total: "0-00:00:00",
  Wisun_Data: "WiSUN-Board-1",
  Humidity: 56.78,
  Temp: 27.45,
  neighbor_info: [
    { id: "node-1", rsl_in: -32, rsl_out: -40 },
    { id: "node-2", rsl_in: -36, rsl_out: -42 }
  ]
});

client.send(
  message,
  41234,
  "0.0.0.0",
  // "ec2-65-0-18-67.ap-south-1.compute.amazonaws.com",
  (err) => {
    if (err) console.error("Send error:", err);
    else console.log("✅ Test packet sent successfully");
    client.close();
  }
);
