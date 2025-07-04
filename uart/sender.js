const { SerialPort } = require('serialport');

const port = new SerialPort({
  path: 'COM2', // <-- make sure this matches your virtual COM port
  baudRate: 9600
});

port.on('open', () => {
  console.log('COM2 Opened for sending fake data...');
  setInterval(() => {
    const fakeValue = (Math.random() * 100).toFixed(2);
    port.write(`${fakeValue}\n`, (err) => {
      if (err) {
        console.error('Error writing to COM2:', err.message);
      } else {
        console.log('Sent:', fakeValue);
      }
    });
  }, 1000);
});
