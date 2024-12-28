document.addEventListener('DOMContentLoaded', () => {
    const programRuntimes = {};

    function logError(message) {
        const errorLogs = document.getElementById('error-logs');
        errorLogs.innerHTML += `<p>${message}</p>`;
    }

    function formatRuntime(runtime) {
        const days = runtime.Days;
        const hours = runtime.Hours;
        const minutes = runtime.Minutes;
        const seconds = runtime.Seconds;
        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
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

    function checkProgramStatus(programId) {
        fetch(`/status/${programId}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }
                const statusElement = document.getElementById(`${programId}-status`);
                const button = document.querySelector(`button[onclick="toggleProgram('${programId}')"]`);
                const runtimeElement = document.getElementById(`${programId}-runtime`);
                if (!statusElement || !button || !runtimeElement) {
                    throw new Error(`Elements for ${programId} not found`);
                }
                if (data.isRunning) {
                    statusElement.classList.remove('status-not-running');
                    statusElement.classList.add('status-running');
                    button.innerText = `Stop ${programId}`;
                    runtimeElement.innerText = `Runtime: ${formatRuntime(data.runtime)}`;
                } else {
                    statusElement.classList.remove('status-running');
                    statusElement.classList.add('status-not-running');
                    button.innerText = `Start ${programId}`;
                    clearInterval(programRuntimes[programId]);
                    runtimeElement.innerText = '';
                }
            })
            .catch(error => logError(`Error checking status of ${programId}: ${error.message}`));
    }

    // Initial check of program status
    checkProgramStatus('qBittorrent');
    checkProgramStatus('Ombi');
    checkProgramStatus('Jellyfin');
    checkProgramStatus('Prowlarr');
    checkProgramStatus('Radarr');
    checkProgramStatus('Sonarr');
    setInterval(() => {
        checkProgramStatus('qBittorrent');
        checkProgramStatus('Ombi');
        checkProgramStatus('Jellyfin');
        checkProgramStatus('Prowlarr');
        checkProgramStatus('Radarr');
        checkProgramStatus('Sonarr');
    }, 10000); // Check every 10 seconds
});