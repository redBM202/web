const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.static('public'));

let runningPrograms = {};

app.get('/status/:program', (req, res) => {
    const program = req.params.program.toLowerCase();
    exec(`tasklist /FI "IMAGENAME eq ${program}.exe"`, (err, stdout, stderr) => {
        if (err) {
            console.error(`Error checking program status: ${err.message}`);
            return res.status(500).json({ error: 'Error checking program status' });
        }
        const isRunning = stdout.toLowerCase().includes(`${program}.exe`);
        if (isRunning) {
            const psCommand = `powershell -command "(Get-Date) - (Get-Process ${program}).StartTime | Select-Object -Property Days,Hours,Minutes,Seconds | ConvertTo-Json"`;
            exec(psCommand, (err, stdout, stderr) => {
                if (err) {
                    console.error(`Error getting program runtime: ${err.message}`);
                    return res.status(500).json({ error: 'Error getting program runtime' });
                }
                const runtime = JSON.parse(stdout.trim());
                res.json({ program, isRunning, runtime });
            });
        } else {
            delete runningPrograms[program];
            res.json({ program, isRunning, runtime: null });
        }
    });
});

app.post('/start/:program', (req, res) => {
    const program = req.params.program.toLowerCase();
    let batchFilePath;
    if (program === 'qbittorrent') {
        batchFilePath = path.join(__dirname, 'bat', 'start_qbittorrent.bat'); // Path to the batch file
    } else if (program === 'ombi') {
        batchFilePath = path.join(__dirname, 'bat', 'start_ombi.bat'); // Path to the batch file
    } else if (program === 'jellyfin') {
        batchFilePath = path.join(__dirname, 'bat', 'start_jellyfin.bat'); // Path to the batch file
    } else if (program === 'prowlarr') {
        batchFilePath = path.join(__dirname, 'bat', 'start_prowlarr.bat'); // Path to the batch file
    } else if (program === 'radarr') {
        batchFilePath = path.join(__dirname, 'bat', 'start_radarr.bat'); // Path to the batch file
    } else if (program === 'sonarr') {
        batchFilePath = path.join(__dirname, 'bat', 'start_sonarr.bat'); // Path to the batch file
    } else {
        return res.status(400).send('Unknown program');
    }
    if (runningPrograms[program]) {
        return res.status(400).send('Program is already running');
    }
    exec(batchFilePath, (err) => {
        if (err) {
            console.error(`Error starting ${program}: ${err.message}`);
            return res.status(500).send(`Error starting ${program}: ${err.message}`);
        }
        runningPrograms[program] = true;
        res.send(`Started ${program}`);
    });
});

app.post('/stop/:program', (req, res) => {
    const program = req.params.program.toLowerCase();
    exec(`taskkill /IM ${program}.exe /F`, (err) => {
        if (err) {
            console.error(`Error stopping ${program}: ${err.message}`);
            return res.status(500).send(`Error stopping ${program}: ${err.message}`);
        }
        delete runningPrograms[program];
        res.send(`Stopped ${program}`);
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});