const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fastFolderSize = require('fast-folder-size');
const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.json());

let runningPrograms = {};

app.get('/status/:program', (req, res) => {
    const program = req.params.program.toLowerCase();
    if (program === 'flaresolverr') {
        exec(`docker ps -a --filter "name=${program}" --format "{{.Status}}"`, (err, stdout, stderr) => {
            if (err) {
                console.error(`Error checking Docker container status: ${err.message}`);
                return res.status(500).json({ error: 'Error checking Docker container status' });
            }
            const isRunning = stdout.toLowerCase().includes('up');
            let uptime = null;
            if (isRunning) {
                const uptimeMatch = stdout.match(/Up (.+)/);
                if (uptimeMatch) {
                    uptime = uptimeMatch[1];
                }
            }
            res.json({ program, isRunning, uptime });
        });
    } else {
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
                    res.json({ program, isRunning, runtime: `${runtime.Days || 0}d ${runtime.Hours || 0}h ${runtime.Minutes || 0}m ${runtime.Seconds || 0}s` });
                });
            } else {
                delete runningPrograms[program];
                res.json({ program, isRunning, runtime: null });
            }
        });
    }
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
    } else if (program === 'docker') {
        batchFilePath = path.join(__dirname, 'bat', 'start_docker.bat'); // Path to the batch file
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

app.post('/docker-container/start', (req, res) => {
    const { containerName } = req.body;
    exec(`docker start ${containerName}`, (err) => {
        if (err) {
            console.error(`Error starting Docker container ${containerName}: ${err.message}`);
            return res.status(500).send(`Error starting Docker container ${containerName}: ${err.message}`);
        }
        res.send(`Started Docker container ${containerName}`);
    });
});

app.post('/docker-container/stop', (req, res) => {
    const { containerName } = req.body;
    exec(`docker stop ${containerName}`, (err) => {
        if (err) {
            console.error(`Error stopping Docker container ${containerName}: ${err.message}`);
            return res.status(500).send(`Error stopping Docker container ${containerName}: ${err.message}`);
        }
        res.send(`Stopped Docker container ${containerName}`);
    });
});

app.post('/stop-all', (req, res) => {
    const programs = ['qbittorrent', 'ombi', 'jellyfin', 'prowlarr', 'radarr', 'sonarr'];
    const stopPromises = programs.map(program => {
        return new Promise((resolve, reject) => {
            exec(`taskkill /IM ${program}.exe /F`, (err) => {
                if (err) {
                    console.error(`Error stopping ${program}: ${err.message}`);
                    return reject(`Error stopping ${program}: ${err.message}`);
                }
                delete runningPrograms[program];
                resolve(`Stopped ${program}`);
            });
        });
    });

    Promise.all(stopPromises)
        .then(results => res.send(results))
        .catch(error => res.status(500).send(error));
});

app.get('/docker-container/status/:containerName', (req, res) => {
    const containerName = req.params.containerName;
    exec(`docker ps -a --filter "name=${containerName}" --format "{{.Status}}"`, (err, stdout, stderr) => {
        if (err) {
            console.error(`Error checking Docker container status: ${err.message}`);
            return res.status(500).json({ error: 'Error checking Docker container status' });
        }
        const isRunning = stdout.toLowerCase().includes('up');
        let uptime = null;
        if (isRunning) {
            const uptimeMatch = stdout.match(/Up (.+)/);
            if (uptimeMatch) {
                uptime = uptimeMatch[1];
            }
        }
        res.json({ containerName, isRunning, uptime });
    });
});

app.get('/folder-size/:folder', (req, res) => {
    const folderMap = {
        movies: 'D:\\Movies',
        series: 'D:\\Series'
    };
    const folderPath = folderMap[req.params.folder.toLowerCase()];
    if (!folderPath) {
        return res.status(400).json({ error: 'Unknown folder' });
    }
    fastFolderSize(folderPath, (err, bytes) => {
        if (err) {
            console.error(`Error getting folder size: ${err.message}`);
            return res.status(500).json({ error: 'Error getting folder size' });
        }
        const sizeInGB = (bytes / (1024 * 1024 * 1024)).toFixed(2); // Convert bytes to GB
        res.json({ folder: req.params.folder, size: `${sizeInGB} GB` });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});