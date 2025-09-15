const dgram = require("dgram");
const client = dgram.createSocket("udp4");

// Build the raw string with the prefix
const message = `Node Online #26{
"device":"2459",
"chip":"xG28",
"parent":"24a6",
"running":"0-00:20:20",
"connected":"0-00:12:59",
"disconnected":"no",
"connections":"1",
"availability":"100.00",
"connected_total":"0-00:12:59",
"disconnected_total":"0-00:00:00",
"Wisun_Data":"WiSUN-Board-1",
"neighbor_info":{"rsl_in":-19,"rsl_out":-20,"is_lfn":0}
}`;

client.send(
  Buffer.from(message),
  41234,
  // "0.0.0.0",
  "ec2-65-0-18-67.ap-south-1.compute.amazonaws.com", // your server
  (err) => {
    console.log("this packet data", message);
    if (err) console.error("Send error:", err);
    else console.log("✅ Test packet sent successfully");
    client.close();
  }
);
