document.addEventListener('DOMContentLoaded', () => {
    const programRuntimes = {};

    function logError(message) {
        const errorLogs = document.getElementById('error-logs');
        errorLogs.innerHTML += `<p>${message}</p>`;
    }

    function formatRuntime(runtime) {
        return runtime;
    }

    function startProgram(programId) {
        fetch(`/start/${programId}`, { method: 'POST' })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(message => {
                const statusElement = document.getElementById(`${programId}-status`);
                const runtimeElement = document.getElementById(`${programId}-runtime`);
                const button = document.querySelector(`button[onclick="toggleProgram('${programId}')"]`);
                if (!statusElement || !runtimeElement || !button) {
                    throw new Error(`Elements for ${programId} not found`);
                }
                statusElement.classList.remove('status-not-running');
                statusElement.classList.add('status-running');
                button.innerText = `Stop ${programId}`;
                const startTime = new Date();
                programRuntimes[programId] = setInterval(() => {
                    const elapsedTime = Math.floor((new Date() - startTime) / 1000);
                    const days = Math.floor(elapsedTime / (3600 * 24));
                    const hours = Math.floor((elapsedTime % (3600 * 24)) / 3600);
                    const minutes = Math.floor((elapsedTime % 3600) / 60);
                    const seconds = elapsedTime % 60;
                    runtimeElement.innerText = `Runtime: ${days}d ${hours}h ${minutes}m ${seconds}s`;
                }, 1000);
            })
            .catch(error => logError(`Error starting ${programId}: ${error.message}`));
    }

    function stopProgram(programId) {
        fetch(`/stop/${programId}`, { method: 'POST' })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(message => {
                const statusElement = document.getElementById(`${programId}-status`);
                const runtimeElement = document.getElementById(`${programId}-runtime`);
                const button = document.querySelector(`button[onclick="toggleProgram('${programId}')"]`);
                if (!statusElement || !runtimeElement || !button) {
                    throw new Error(`Elements for ${programId} not found`);
                }
                statusElement.classList.remove('status-running');
                statusElement.classList.add('status-not-running');
                button.innerText = `Start ${programId}`;
                clearInterval(programRuntimes[programId]);
                runtimeElement.innerText = '';
            })
            .catch(error => logError(`Error stopping ${programId}: ${error.message}`));
    }

    window.toggleProgram = function(programId) {
        const statusElement = document.getElementById(`${programId}-status`);
        if (statusElement.classList.contains('status-running')) {
            stopProgram(programId);
        } else {
            startProgram(programId);
        }
    }

    function startDockerContainer(containerName) {
        fetch('/docker-container/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ containerName })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(message => {
            const statusElement = document.getElementById(`${containerName}-status`);
            const runtimeElement = document.getElementById(`${containerName}-runtime`);
            const button = document.querySelector(`button[onclick="toggleDockerContainer('${containerName}')"]`);
            if (!statusElement || !runtimeElement || !button) {
                throw new Error(`Elements for ${containerName} not found`);
            }
            statusElement.classList.remove('status-not-running');
            statusElement.classList.add('status-running');
            button.innerText = `Stop ${containerName}`;
        })
        .catch(error => logError(`Error starting Docker container ${containerName}: ${error.message}`));
    }

    function stopDockerContainer(containerName) {
        fetch('/docker-container/stop', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ containerName })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(message => {
            const statusElement = document.getElementById(`${containerName}-status`);
            const runtimeElement = document.getElementById(`${containerName}-runtime`);
            const button = document.querySelector(`button[onclick="toggleDockerContainer('${containerName}')"]`);
            if (!statusElement || !runtimeElement || !button) {
                throw new Error(`Elements for ${containerName} not found`);
            }
            statusElement.classList.remove('status-running');
            statusElement.classList.add('status-not-running');
            button.innerText = `Start ${containerName}`;
            runtimeElement.innerText = '';
        })
        .catch(error => logError(`Error stopping Docker container ${containerName}: ${error.message}`));
    }

    window.toggleDockerContainer = function(containerName) {
        const statusElement = document.getElementById(`${containerName}-status`);
        if (statusElement.classList.contains('status-running')) {
            stopDockerContainer(containerName);
        } else {
            startDockerContainer(containerName);
        }
    }

    function checkProgramStatus(programId) {
        fetch(`/status/${programId}`)
            .then(response => response.json())
            .then(data => {
                const statusElement = document.getElementById(`${programId}-status`);
                const runtimeElement = document.getElementById(`${programId}-runtime`);
                const button = document.querySelector(`button[onclick="toggleProgram('${programId}')"]`);
                if (!statusElement || !runtimeElement || !button) {
                    throw new Error(`Elements for ${programId} not found`);
                }
                if (data.isRunning) {
                    statusElement.classList.remove('status-not-running');
                    statusElement.classList.add('status-running');
                    button.innerText = `Stop ${programId}`;
                    if (data.runtime) {
                        runtimeElement.innerText = `Runtime: ${data.runtime}`;
                    }
                } else {
                    statusElement.classList.remove('status-running');
                    statusElement.classList.add('status-not-running');
                    button.innerText = `Start ${programId}`;
                    runtimeElement.innerText = '';
                }
            })
            .catch(error => logError(`Error checking status of ${programId}: ${error.message}`));
    }

    function checkDockerContainerStatus(containerName) {
        fetch(`/docker-container/status/${containerName}`)
            .then(response => response.json())
            .then(data => {
                const statusElement = document.getElementById(`${containerName}-status`);
                const runtimeElement = document.getElementById(`${containerName}-runtime`);
                const button = document.querySelector(`button[onclick="toggleDockerContainer('${containerName}')"]`);
                if (!statusElement || !runtimeElement || !button) {
                    throw new Error(`Elements for ${containerName} not found`);
                }
                if (data.isRunning) {
                    statusElement.classList.remove('status-not-running');
                    statusElement.classList.add('status-running');
                    button.innerText = `Stop ${containerName}`;
                    if (data.uptime) {
                        runtimeElement.innerText = `Uptime: ${data.uptime}`;
                    }
                } else {
                    statusElement.classList.remove('status-running');
                    statusElement.classList.add('status-not-running');
                    button.innerText = `Start ${containerName}`;
                    runtimeElement.innerText = '';
                }
            })
            .catch(error => logError(`Error checking status of Docker container ${containerName}: ${error.message}`));
    }

    window.stopAll = function() {
        fetch('/stop-all', { method: 'POST' })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(message => {
                document.querySelectorAll('.status-box').forEach(statusElement => {
                    statusElement.classList.remove('status-running');
                    statusElement.classList.add('status-not-running');
                });
                document.querySelectorAll('.runtime').forEach(runtimeElement => {
                    runtimeElement.innerText = '';
                });
                document.querySelectorAll('button[onclick^="toggleProgram"]').forEach(button => {
                    button.innerText = `Start ${button.getAttribute('onclick').match(/'([^']+)'/)[1]}`;
                });
                document.querySelectorAll('button[onclick^="toggleDockerContainer"]').forEach(button => {
                    button.innerText = `Start ${button.getAttribute('onclick').match(/'([^']+)'/)[1]}`;
                });
            })
            .catch(error => logError(`Error stopping all programs: ${error.message}`));
    }

    // Initial check of program status
    checkProgramStatus('qBittorrent');
    checkProgramStatus('Ombi');
    checkProgramStatus('Jellyfin');
    checkProgramStatus('Prowlarr');
    checkProgramStatus('Radarr');
    checkProgramStatus('Sonarr');
    checkDockerContainerStatus('flaresolverr');
    setInterval(() => {
        checkProgramStatus('qBittorrent');
        checkProgramStatus('Ombi');
        checkProgramStatus('Jellyfin');
        checkProgramStatus('Prowlarr');
        checkProgramStatus('Radarr');
        checkProgramStatus('Sonarr');
        checkDockerContainerStatus('flaresolverr');
    }, 10000); // Check every 10 seconds
});