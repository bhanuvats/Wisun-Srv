const dgram = require("dgram");
const client = dgram.createSocket("udp4");

const message = JSON.stringify({
  device: "123",
  parent: "ab96",
  rsl_in: -70,
  rsl_out: -65,
  connections: 5,
  availability: 99
});

client.send(message, 41234, "127.0.0.1", (err) => {
  if (err) console.error(err);
  else console.log("Message sent");
  client.close();
});
