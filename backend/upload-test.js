const http = require('http');

const DOCTOR_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjY2Y3ZDMwOC1kYWU4LTRhYWYtODg1NS0wZGQ1NDI3ZTc4NTkiLCJyb2xlIjoiRE9DVE9SIiwiaWF0IjoxNzg0MzY1NDgxLCJleHAiOjE3ODQ0NTE4ODF9.79g_1YHBYGF2kobNgEywPTfQNt51ndUCGerARFnntmg';
const APPOINTMENT_ID = '2de1b1b1-6159-460b-bd3d-90dddd92285b';

const boundary = '----FormBoundary123';

const body = [
  `--${boundary}`,
  'Content-Disposition: form-data; name="appointmentId"',
  '',
  APPOINTMENT_ID,
  `--${boundary}`,
  'Content-Disposition: form-data; name="diagnosis"',
  '',
  'Fever and fatigue',
  `--${boundary}`,
  'Content-Disposition: form-data; name="file"; filename="test.txt"',
  'Content-Type: text/plain',
  '',
  'Patient has fever.',
  `--${boundary}--`,
].join('\r\n');

const bodyBuffer = Buffer.from(body, 'utf8');

console.log('Sending request...');
console.log('Appointment ID:', APPOINTMENT_ID);
console.log('Token starts with:', DOCTOR_TOKEN.substring(0, 20));

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/prescriptions',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${DOCTOR_TOKEN}`,
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': bodyBuffer.length,
  },
};

const req = http.request(options, (res) => {
  console.log('Got response! Status:', res.statusCode);
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
    console.log('Chunk received:', chunk.toString());
  });
  res.on('end', () => {
    console.log('Final response:');
    try {
      console.log(JSON.stringify(JSON.parse(data), null, 2));
    } catch {
      console.log(data);
    }
  });
});

req.setTimeout(10000, () => {
  console.log('❌ Request timed out after 10 seconds');
  console.log('Check if server is running on port 5000');
  req.destroy();
});

req.on('error', (err) => {
  console.error('❌ Request error:', err.message);
});

req.on('socket', () => {
  console.log('Socket connected');
});

req.write(bodyBuffer);
req.end();
console.log('Request sent, waiting for response...');