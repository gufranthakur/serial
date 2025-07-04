// dashboard.js

window.addEventListener('DOMContentLoaded', () => {
  const chartCtx = document.getElementById('chart').getContext('2d');
  const connectBtn = document.getElementById('connect');
  const disconnectBtn = document.getElementById('disconnect');
  const status = document.getElementById('status');
  const fetchBtn = document.getElementById('fetch');
  const pollingBtn = document.getElementById('toggle-polling');
  const exportBtn = document.getElementById('export');
  const themeBtn = document.getElementById('toggle-theme');
  const modeRadios = document.querySelectorAll('input[name="mode"]');
  const rangeInputs = document.getElementById('range-inputs');
  const multipleInputs = document.getElementById('multiple-inputs');

const chart = new Chart(chartCtx, {
  type: 'line',
  data: {
    labels: [],
    datasets: []
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        bottom: 30 // Makes room for labels
      }
    },
    scales: {
      x: {
        ticks: {
          maxTicksLimit: 6,
          autoSkip: false,          // <-- Show all ticks even if space is tight
          maxRotation: 45,          // <-- Angle the text if needed
          minRotation: 45,
          color: '#333',
          font: {
            size: 12
          }
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#333',
          font: {
            size: 12
          }
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: '#333',
          font: {
            size: 14
          }
        }
      }
    }
  }
});


  

  let polling = false;
  let pollInterval;
  let connected = false;
  let dataLog = [];

  function updateStatus(state) {
    status.textContent = state;
    status.style.color = state === 'Connected' ? 'green' : 'red';
  }

  function getParams() {
    const host = document.getElementById('host').value;
    const port = parseInt(document.getElementById('port').value);
    const unitId = parseInt(document.getElementById('unitId').value);
    const mode = document.querySelector('input[name="mode"]:checked').value;
    let address = 0;
    let count = 0;
    let multipleAddresses = [];

    if (mode === 'single') {
      address = parseInt(document.getElementById('address').value);
      count = parseInt(document.getElementById('count').value);
    } else {
      multipleAddresses = document.getElementById('registerList').value
        .split(',')
        .map(str => str.trim())
        .filter(val => val !== '');
    }

    return { host, port, unitId, address, count, multipleAddresses };
  }

  function addToChart(values) {
    const timestamp = new Date().toLocaleTimeString();
    chart.data.labels.push(timestamp);
    values.forEach((val, i) => {
      if (!chart.data.datasets[i]) {
        chart.data.datasets[i] = {
          label: `Register ${i}`,
          data: [],
          borderColor: `hsl(${i * 50}, 70%, 50%)`,
          fill: false
        };
      }
      chart.data.datasets[i].data.push(val);
      if (chart.data.datasets[i].data.length > 50) {
        chart.data.datasets[i].data.shift();
      }
    });
    if (chart.data.labels.length > 50) {
      chart.data.labels.shift();
    }
    chart.update();
    dataLog.push([timestamp, ...values]);
    updateLiveValues(values);
  }

  function updateLiveValues(values) {
    const container = document.getElementById('liveValues');
    container.innerHTML = '';
    values.forEach((val, i) => {
      const card = document.createElement('div');
      card.className = 'register-card';
      card.textContent = `R${i}: ${val}`;
      container.appendChild(card);
    });
  }

  async function fetchData() {
    try {
      const params = getParams();
      const result = await window.electronAPI.fetchData(params);
      addToChart(result);
    } catch (err) {
      alert('Error: ' + err.message);
      if (polling) togglePolling();
    }
  }

  function togglePolling() {
    polling = !polling;
    pollingBtn.textContent = polling ? 'Stop Polling' : 'Start Polling';
    if (polling) {
      fetchData();
      pollInterval = setInterval(fetchData, 1000);
    } else {
      clearInterval(pollInterval);
    }
  }

  function exportCSV() {
    window.electronAPI.saveCSV(dataLog);
  }

  function toggleTheme() {
    document.body.classList.toggle('dark');
  }

  connectBtn.addEventListener('click', async () => {
  try {
    const params = getParams();
    // Test with dummy fetch (1 register)
    const testParams = { ...params };

    if (params.multipleAddresses?.length > 0) {
      testParams.multipleAddresses = [params.multipleAddresses[0]];
    } else {
      testParams.count = 1;
    }

    await window.electronAPI.fetchData(testParams);

    connected = true;
    connectBtn.disabled = true;
    disconnectBtn.disabled = false;
    updateStatus('Connected');
  } catch (err) {
    alert('Connection failed: ' + err.message);
    updateStatus('Disconnected');
  }
});


  disconnectBtn.addEventListener('click', () => {
    connected = false;
    connectBtn.disabled = false;
    disconnectBtn.disabled = true;
    updateStatus('Disconnected');
    if (polling) togglePolling();
  });

  fetchBtn.addEventListener('click', fetchData);
  pollingBtn.addEventListener('click', togglePolling);
  exportBtn.addEventListener('click', exportCSV);
  themeBtn.addEventListener('click', toggleTheme);

  modeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'single') {
        rangeInputs.style.display = 'flex';
        multipleInputs.style.display = 'none';
      } else {
        rangeInputs.style.display = 'none';
        multipleInputs.style.display = 'flex';
      }
    });
  });

  updateStatus('Disconnected');
});
