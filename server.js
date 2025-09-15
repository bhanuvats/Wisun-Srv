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

// Track deviceIds seen in current batch
let currentDeviceIds = new Set();
let cleanupTimer = null;

// Handle incoming UDP messages
server.on("message", async (msg, rinfo) => {
    try {
        console.log("messsage received", msg);
        
        // Clean incoming message: remove "Node Online #xx" before parsing
        const cleanMsg = msg.toString().replace(/^Node Online #[0-9]+\s*/, "");
        const packet = JSON.parse(cleanMsg);

        console.log("Received packet:", packet);

        const deviceId = packet.device;
        currentDeviceIds.add(deviceId);

        // Normalize numeric fields
        const connections = parseInt(packet.connections) || 0;
        const availability = parseFloat(packet.availability) || 0;
        const humidity = parseFloat(packet.Humidity) || null;
        const temperature = parseFloat(packet.Temp) || null;

        // 1. Update latest device state (real-time table)
        await Device.findOneAndUpdate(
            { deviceId },
            {
                chip: packet.chip,
                parent: packet.parent,
                running: packet.running,
                connected: packet.connected === "true",
                disconnected: packet.disconnected === "true",
                connections,
                availability,
                connected_total: parseInt(packet.connected_total) || 0,
                disconnected_total: parseInt(packet.disconnected_total) || 0,
                Wisun_Data: packet.Wisun_Data,
                humidity,
                temperature,
                neighbor_info: packet.neighbor_info,
                lastSeenAt: new Date(),
                updatedAt: new Date()
            },
            { upsert: true, new: true }
        );

        // 2. Store history logs
        await DeviceLog.create({
            deviceId: packet.device,
            parent: packet.parent,
            connected: packet.connected === "true",
            disconnected: packet.disconnected === "true",
            connections,
            availability,
            humidity,
            temperature,
            neighbor_info: packet.neighbor_info,
            timestamp: new Date()
        });

        // 3. Broadcast to frontend
        broadcastUpdate({ event: "node_update", data: packet });

        // --- Cleanup devices not in buffer ---
        // Reset cleanup timer (wait 2s after last packet in buffer)
        if (cleanupTimer) clearTimeout(cleanupTimer);
        cleanupTimer = setTimeout(async () => {
            try {
                const activeIds = Array.from(currentDeviceIds);
                console.log("Active deviceIds this round:", activeIds);

                // Delete docs with deviceId not in current batch
                await Device.deleteMany({ deviceId: { $nin: activeIds } });

                console.log("Cleanup done ✅");
                currentDeviceIds.clear();
            } catch (err) {
                console.error("Error during cleanup:", err);
            }
        }, 10); // adjust timeout as per buffer batch frequency

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
