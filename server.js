const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const youtubedl = require('youtube-dl-exec');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/stream', (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) {
    return res.status(400).send('URL YouTube manquante');
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'audio/webm');

  const ytDlpPath = youtubedl.constants.YOUTUBE_DL_PATH;

  const ytProcess = spawn(ytDlpPath, [
    '--extractor-args', 'youtube:player_client=android_vr,tv_embedded,ios',
    '-f', 'bestaudio/best',
    '-o', '-',
    '--quiet',
    '--no-playlist',
    '--no-check-certificates',
    videoUrl
  ]);

  ytProcess.stdout.pipe(res);

  ytProcess.stderr.on('data', (data) => {
    console.error(`Erreur yt-dlp : ${data}`);
  });

  req.on('close', () => {
    ytProcess.kill();
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur démarré et en écoute sur le port ${PORT}`);
});