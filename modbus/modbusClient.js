// modbusClient.js
const Modbus = require('jsmodbus');
const net = require('net');

async function readModbusData({ host, port, unitId, address, count, multipleAddresses }) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    const client = new Modbus.client.TCP(socket, unitId);

    socket.on('connect', async () => {
      try {
        if (multipleAddresses && multipleAddresses.length > 0) {
          const results = [];
          for (let addr of multipleAddresses) {
            const response = await client.readHoldingRegisters(parseInt(addr), 1);
            results.push(response.response._body._valuesAsArray[0]);
          }
          socket.end();
          resolve(results);
        } else {
          const response = await client.readHoldingRegisters(address, count);
          socket.end();
          resolve(response.response._body._valuesAsArray);
        }
      } catch (err) {
        socket.end();
        reject(err);
      }
    });

    socket.on('error', reject);
    socket.connect({ host, port });
  });
}

module.exports = { readModbusData };
