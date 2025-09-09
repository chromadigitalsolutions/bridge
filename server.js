const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;
const ELEVEN_REALTIME_URL = process.env.ELEVEN_REALTIME_URL;
const PUBLIC_URL = process.env.PUBLIC_URL;

const app = express();
app.use(express.json());

// TwiML endpoint for Twilio
app.post('/twiml', (req, res) => {
  const twiml = `
    <Response>
      <Start>
        <Stream url="${PUBLIC_URL.replace('https','wss')}/twilio-media" />
      </Start>
      <Say>Hi, you’re connected to our AI receptionist.</Say>
      <Pause length="60"/>
    </Response>`;
  res.type('text/xml').send(twiml.trim());
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/twilio-media' });

wss.on('connection', (twilioWs) => {
  console.log('Twilio stream connected');

  const elevenWs = new WebSocket(ELEVEN_REALTIME_URL, {
    headers: { 'xi-api-key': ELEVEN_API_KEY }
  });

  elevenWs.on('open', () => {
    console.log('Connected to ElevenLabs realtime');
  });

  // Twilio → ElevenLabs
  twilioWs.on('message', (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      if (data.event === 'media') {
        elevenWs.send(JSON.stringify({
          type: 'input_audio',
          audio: data.media.payload,
          encoding: 'mulaw',
          sampleRate: 8000
        }));
      }
    } catch (err) {
      console.error(err);
    }
  });

  // ElevenLabs → Twilio
  elevenWs.on('message', (msg) => {
    try {
      const frame = JSON.parse(msg.toString());
      if (frame.type === 'output_audio') {
        twilioWs.send(JSON.stringify({
          event: 'media',
          media: { payload: frame.audio }
        }));
      }
    } catch (err) {
      console.error(err);
    }
  });

  const cleanUp = () => {
    try { elevenWs.close(); } catch {}
    try { twilioWs.close(); } catch {}
  };
  twilioWs.on('close', cleanUp);
  elevenWs.on('close', cleanUp);
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
