// udp-server.js
const dgram = require("dgram");
const mongoose = require("mongoose");
const Device = require("./models/device.model");
const DeviceLog = require("./models/devicelogs.model");
const WebSocket = require("ws");
require('dotenv').config();

const PORT = 41234; // Example UDP port
const HOST = "0.0.0.0"; // Listen on all interfaces

// Create UDP socket
const server = dgram.createSocket("udp4");

// Create WebSocket server for frontend updates
const wss = new WebSocket.Server({ port: 8080 });

function broadcastUpdate(data) {
    const message = JSON.stringify(data);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// Handle incoming UDP messages
server.on("message", async (msg, rinfo) => {
    try {
        const packet = JSON.parse(msg.toString()); // assuming gateway sends JSON
        console.log("Received packet:", packet);

        // 1. Update latest device state
        await Device.findByIdAndUpdate(
            packet.device,
            { ...packet, lastSeenAt: new Date(), updatedAt: new Date() },
            { upsert: true }
        );

        // 2. Insert into history logs
        await DeviceLog.create({
            device: packet.device,
            parent: packet.parent,
            status: packet.disconnected ? "disconnected" : "connected",
            rsl_in: packet.rsl_in,
            rsl_out: packet.rsl_out,
            connections: packet.connections,
            availability: packet.availability,
            timestamp: new Date()
        });

        // 3. Broadcast to frontend
        broadcastUpdate({ event: "node_update", data: packet });

    } catch (err) {
        console.error("Error handling packet:", err);
    }
});

// Start UDP server
server.bind(PORT, HOST, () => {
    console.log(`UDP Server listening on ${HOST}:${PORT}`);
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
 