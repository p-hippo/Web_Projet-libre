const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const youtubedl = require('youtube-dl-exec');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');

function getWritableCookiesPath() {
  const possiblePaths = [
    '/etc/secrets/cookies.txt',
    path.join(__dirname, 'cookies.txt')
  ];

  for (const secretPath of possiblePaths) {
    if (fs.existsSync(secretPath)) {
      const tempCookiesPath = '/tmp/cookies.txt';
      try {
        fs.copyFileSync(secretPath, tempCookiesPath);
        return tempCookiesPath;
      } catch (e) {
        return secretPath;
      }
    }
  }
  return null;
}

function getYtDlpBinary() {
  const linuxStandalone = path.join(__dirname, 'yt-dlp_linux');
  if (fs.existsSync(linuxStandalone)) {
    return linuxStandalone;
  }
  return youtubedl.constants.YOUTUBE_DL_PATH;
}

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

  const ytDlpPath = getYtDlpBinary();
  const cookiesPath = getWritableCookiesPath();

  const args = [
    '--js-runtimes', 'node',
    '--remote-components', 'ejs:github',
    '--cache-dir', '/tmp/yt-dlp-cache',
    '--extractor-args', 'youtube:player_client=tv,web_safari,default',
    '--ffmpeg-location', ffmpegPath,
    '-f', 'bestaudio[ext=webm]/bestaudio/best',
    '-o', '-',
    '--quiet',
    '--no-playlist'
  ];

  if (cookiesPath) {
    args.push('--cookies', cookiesPath);
  } else {
    console.warn('Aucun fichier cookies.txt trouvé !');
  }
  args.push(videoUrl);

  const ytProcess = spawn(ytDlpPath, args);

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