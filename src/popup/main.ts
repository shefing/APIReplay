// @ts-nocheck

import '../styles.css';
import { normalizeRecording } from '../shared/schema';
import { migrateStorageIfNeeded, upsertRecordingByName } from '../shared/storage';
import {
    clearRecordings,
    duplicateRecording as duplicateRecordingByName,
    deleteRecording as deleteRecordingByName,
    ensureMigratedStorage,
    getRecording,
    getLastUsedRecordingName,
    listRecordingNames,
    renameRecording as renameRecordingByName,
    setLastUsedRecording,
    saveRecording,
    updateRecordingRequestResponse,
    deletePreset,
    getSettings,
    ensureDefaultPresets,
    setLastUsedPreset,
    updateRecordingRequestSettings,
    updateReplayOptions,
    upsertPreset
} from './services/storage';
import { downloadJson, importSingleRecordingFromText } from './services/import-export';
import { initRecordingSelect, renderRecordingOptions } from './components/RecordingsList';
import { renderApiPaths } from './components/ApiPreview';
import { formatResponseBody, renderApiCallDetails } from './components/ResponseEditor';

document.addEventListener('DOMContentLoaded', () => {
    void ensureMigratedStorage();
    const recordButton = document.getElementById('recordButton');
    const replayButton = document.getElementById('replayButton');
    const exportRecordingBtn = document.getElementById('exportRecording');
    const importRecordingInput = document.getElementById('importRecordingInput');
    const importAllRecordingsInput = document.getElementById('importAllRecordingsInput'); // Added
    const recordingNameInput = document.getElementById('recordingName');
    const filterInput = document.getElementById('filter');
    const requestSearchInput = document.getElementById('requestSearch');
    const presetSelect = document.getElementById('presetSelect');
    const managePresetsBtn = document.getElementById('managePresets');
    const presetsDialog = document.getElementById('presetsDialog');
    const presetNameInput = document.getElementById('presetName');
    const presetFilterInput = document.getElementById('presetFilter');
    const presetsList = document.getElementById('presetsList');
    const savePresetBtn = document.getElementById('savePreset');
    const closePresetsBtn = document.getElementById('closePresets');
    const replayStatsPanel = document.getElementById('replayStatsPanel');
    const latencyMsInput = document.getElementById('latencyMs');
    const latencyRangeInput = document.getElementById('latencyRange');
    const urlMappingsInput = document.getElementById('urlMappings') as HTMLTextAreaElement | null;
    const recordingSelect = document.getElementById('recordingSelect');
    const deleteRecordBtn = document.getElementById('deleteRecord');
    const removeAllRecordingsBtn = document.getElementById('removeAllRecordings');
    const apiPreviewDiv = document.getElementById('apiPreview');
    const recordApiPreviewDiv = document.getElementById('recordApiPreview');
    const statusIndicator = document.getElementById('statusIndicator');
    const fallbackMatchingCheckbox = document.getElementById('fallbackMatching');
    const apiCallModal = document.getElementById('apiCallModal');
    const apiCallDetails = document.getElementById('apiCallDetails');
    const closeModalBtn = document.getElementById('closeModal');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const exportImportDropdown = document.getElementById('exportImportDropdown');
    const exportImportMenu = document.getElementById('exportImportMenu');
    const exportAllRecordingsBtn = document.getElementById('exportAllRecordings');
    const deleteDropdown = document.getElementById('deleteDropdown');
    const deleteMenu = document.getElementById('deleteMenu');
    const duplicateRecordingBtn = document.getElementById('duplicateRecording'); // Added
    const renameRecordingBtn = document.getElementById('renameRecording');
    const renameDialog = document.getElementById('renameDialog');
    const newRecordingNameInput = document.getElementById('newRecordingName');
    const cancelRenameBtn = document.getElementById('cancelRename');
    const confirmRenameBtn = document.getElementById('confirmRename');
    const recordTabButton = document.getElementById('recordTabButton');
    const replayTabButton = document.getElementById('replayTabButton');
    const recordTabPanel = document.getElementById('recordTabPanel');
    const replayTabPanel = document.getElementById('replayTabPanel');


    let isRecording = false;
    let isReplaying = false;
    let allRecordings = [];
    let presets = [];
    let lastPresetId = '';
    let isUpdating = false;

    function setActiveTab(tab: 'record' | 'replay') {
        const isRecordTab = tab === 'record';
        recordTabButton?.classList.toggle('tab-button-active', isRecordTab);
        replayTabButton?.classList.toggle('tab-button-active', !isRecordTab);
        recordTabPanel?.classList.toggle('hidden', !isRecordTab);
        replayTabPanel?.classList.toggle('hidden', isRecordTab);
    }

    recordTabButton?.addEventListener('click', () => setActiveTab('record'));
    replayTabButton?.addEventListener('click', () => setActiveTab('replay'));
    setActiveTab('record');

    // Set default filter
    filterInput.value = '/api';

    // Get the current tab's title and set it as the default recording name along with the current date and time
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        const now = new Date();
        const dateString = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
        const timeString = now.toTimeString().split(' ')[0].slice(0, 5); // Format: HH:MM
        const dateTimeString = `${dateString} ${timeString}`;

        if (tabs[0] && tabs[0].title) {
            recordingNameInput.value = `${tabs[0].title} - ${dateTimeString}`;
        } else {
            recordingNameInput.value = `Unnamed Recording - ${dateTimeString}`;
        }
    });

    // Retrieve the current state from the background script
    chrome.runtime.sendMessage({ action: 'getState' }, (response) => {
        isRecording = response.isRecording;
        isReplaying = response.isReplaying;
        updateButtonStates();
        updateStatusIndicator();

        if (isRecording) {
            recordingNameInput.value = response.currentRecordingName || 'Unnamed Recording';
            filterInput.value = response.currentFilter ? response.currentFilter.join(', ') : '/api';
        }

        if (isReplaying) {
            recordingSelect.value = response.currentRecordingName;
        }
    });

    loadRecordings();
    void loadPresets();
    setInterval(() => {
        if (isReplaying) {
            void refreshReplayStats();
        }
    }, 1000);

    recordButton.addEventListener('click', () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    });

    replayButton.addEventListener('click', () => {
        if (isReplaying) {
            stopReplaying();
        } else {
            startReplaying();
        }
    });

    removeAllRecordingsBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to remove all recordings? This action cannot be undone.')) {
            void clearRecordings()
                .then(() => {
                    loadRecordings();
                    recordingSelect.value = '';
                    updateButtonStates();
                    alert('All recordings have been removed successfully.');
                })
                .catch((error) => {
                    console.error('Clear storage error:', error);
                    alert('Failed to remove all recordings. Please check the console for errors.');
                });
        }
    });

    function startRecording() {
        const now = new Date();
        const dateString = now.toISOString().split('T')[0];
        const timeString = now.toTimeString().split(' ')[0].slice(0, 5);
        const dateTimeString = `${dateString} ${timeString}`;
        const name = recordingNameInput.value || `Unnamed Recording - ${dateTimeString}`;
        const filter = filterInput.value.split(',').map(f => f.trim()).filter(f => f);
        if (filter.length === 0) {
            filter.push('/api');
        }
        chrome.runtime.sendMessage({ action: 'startRecording', name, filter }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Start recording error:', chrome.runtime.lastError);
                alert('Failed to start recording. Please check the console for errors.');
            } else if (response && response.success) {
                isRecording = true;
                updateButtonStates();
                updateStatusIndicator();
                recordingSelect.value = name;
                void setLastUsedRecording(name);
                updateApiPreview();
                alert('Recording started. The page will refresh to begin capturing network traffic.');
            } else {
                alert('Failed to start recording: ' + (response ? response.error : 'Unknown error'));
            }
        });
    }

    function stopRecording() {
        chrome.runtime.sendMessage({ action: 'stopRecording' }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Stop recording error:', chrome.runtime.lastError);
                alert('Failed to stop recording. Please check the console for errors.');
            } else if (response && response.success) {
                isRecording = false;
                updateButtonStates();
                updateStatusIndicator();
                const finishedRecordingName = response.currentRecordingName || recordingNameInput.value;
                void loadRecordings().then(() => {
                    if (finishedRecordingName && allRecordings.includes(finishedRecordingName)) {
                        recordingSelect.value = finishedRecordingName;
                        void setLastUsedRecording(finishedRecordingName);
                    }
                    updateApiPreview();
                });
            } else {
                alert('Failed to stop recording: ' + (response ? response.error : 'Unknown error'));
            }
        });
    }

    function startReplaying() {
        const name = recordingSelect.value;
        if (!name) {
            alert('Please select a recording to replay.');
            return;
        }
        const fallbackMatching = fallbackMatchingCheckbox.checked;
        const latencyMsValue = Number(latencyMsInput.value || '0');
        const latencyRangeValue = latencyRangeInput.value
          .split(',')
          .map((entry) => Number(entry.trim()))
          .filter((entry) => Number.isFinite(entry));
        const urlMappings = (urlMappingsInput?.value || '')
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.includes('->'))
          .map((line) => {
            const [from, to] = line.split('->').map((s) => s.trim());
            return { from, to };
          })
          .filter((m) => m.from && m.to);
        const options = {
          latencyMs: latencyMsValue > 0 ? latencyMsValue : undefined,
          latencyRange: latencyRangeValue.length === 2 ? [latencyRangeValue[0], latencyRangeValue[1]] : undefined,
          urlMappings: urlMappings.length > 0 ? urlMappings : undefined
        };
        void updateReplayOptions(name, options);
        chrome.runtime.sendMessage({ action: 'startReplaying', name, fallbackMatching, options }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Start replaying error:', chrome.runtime.lastError);
                alert('Failed to start replaying. Please check the console for errors.');
            } else if (response && response.success) {
                isReplaying = true;
                updateButtonStates();
                updateStatusIndicator();
                replayStatsPanel.classList.remove('hidden');
                void refreshReplayStats();
            } else {
                alert('Failed to start replaying: ' + (response ? response.error : 'Unknown error'));
            }
        });
    }

    function stopReplaying() {
        chrome.runtime.sendMessage({ action: 'stopReplaying' }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Stop replaying error:', chrome.runtime.lastError);
                alert('Failed to stop replaying. Please check the console for errors.');
            } else if (response && response.success) {
                isReplaying = false;
                updateButtonStates();
                updateStatusIndicator();
                replayStatsPanel.classList.add('hidden');
                console.log('Replaying stopped successfully');
            } else {
                const errorMessage = response && typeof response.error === 'string' ? response.error : 'Unknown error';
                console.error('Failed to stop replaying:', response);
                alert('Failed to stop replaying: ' + errorMessage);
            }
        });
    }

    function updateButtonStates() {
        const isRecordingSelected = recordingSelect.value !== '';

        recordButton.textContent = isRecording ? 'Stop Recording' : 'Start Recording';
        recordButton.className = isRecording ? 'bg-red-500 text-white px-4 py-1 rounded text-sm' : 'bg-blue-500 text-white px-4 py-1 rounded text-sm';
        replayButton.textContent = isReplaying ? 'Stop Replaying' : 'Replay';
        replayButton.className = isReplaying ? 'bg-red-500 text-white px-2 py-1 rounded text-xs animate-pulse' : 'bg-blue-500 text-white px-2 py-1 rounded text-xs';

        recordButton.disabled = isReplaying;
        replayButton.disabled = isRecording || !isRecordingSelected;
        recordingSelect.disabled = isRecording || isReplaying;
        exportRecordingBtn.disabled = !isRecordingSelected || isRecording || isReplaying;
        deleteRecordBtn.disabled = !isRecordingSelected || isRecording || isReplaying;
        importRecordingInput.disabled = isRecording || isReplaying;
        importAllRecordingsInput.disabled = isRecording || isReplaying; // Added
        removeAllRecordingsBtn.disabled = isRecording || isReplaying;
        duplicateRecordingBtn.disabled = !isRecordingSelected || isRecording || isReplaying; // Added
        renameRecordingBtn.disabled = !isRecordingSelected || isRecording || isReplaying; // Added

        exportImportDropdown.disabled = isRecording || isReplaying;
        exportAllRecordingsBtn.disabled = isRecording || isReplaying;
        importAllRecordingsInput.disabled = isRecording || isReplaying; // Updated
        deleteDropdown.disabled = !isRecordingSelected || isRecording || isReplaying;

        [recordingSelect, exportImportDropdown, deleteDropdown, deleteRecordBtn, removeAllRecordingsBtn, replayButton, duplicateRecordingBtn, renameRecordingBtn].forEach(el => { // Updated
            if (el.disabled) {
                el.classList.add('disabled');
            } else {
                el.classList.remove('disabled');
            }
        });
    }

    recordingSelect.addEventListener('input', () => {
        updateButtonStates();
        updateApiPreview();
        loadReplayOptionsIntoUI(recordingSelect.value);
        chrome.storage.local.set({ 'lastUsedRecord': recordingSelect.value });
    });

    function updateStatusIndicator() {
        if (isRecording) {
            statusIndicator.textContent = 'Recording in progress';
            statusIndicator.className = 'mb-2 p-1 bg-red-200 dark:bg-red-800 rounded text-center text-sm font-semibold animate-pulse';
        } else if (isReplaying) {
            statusIndicator.textContent = 'Replaying in progress';
            statusIndicator.className = 'mb-2 p-1 bg-blue-200 dark:bg-blue-800 rounded text-center text-sm font-semibold animate-pulse';
        } else {
            statusIndicator.textContent = 'Idle';
            statusIndicator.className = 'mb-2 p-1 bg-gray-200 dark:bg-gray-700 rounded text-center text-sm font-semibold';
        }
    }

    exportRecordingBtn.addEventListener('click', () => {
        const name = recordingSelect.value;
        chrome.storage.local.get(name, (result) => {
            if (chrome.runtime.lastError) {
                console.error('Export recording error:', chrome.runtime.lastError);
                alert('Failed to export recording. Please check the console for errors.');
            } else if (result[name]) {
                const blob = new Blob([JSON.stringify(result[name])], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${name}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } else {
                alert('No recording found with the name: ' + name);
            }
        });
    });

    importRecordingInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    const normalized = normalizeRecording(data);
                    if (!normalized) {
                        alert('Imported file has an invalid recording schema.');
                        return;
                    }

                    void (async () => {
                        const all = await chrome.storage.local.get(null);
                        let counter = 1;
                        let newName = normalized.name;
                        while (all[newName]) {
                            counter++;
                            newName = `${normalized.name} (${counter})`;
                        }

                        await upsertRecordingByName(newName, {
                            filter: normalized.filter,
                            requests: normalized.requests,
                            metadata: normalized.metadata
                        });

                        loadRecordings();
                        recordingSelect.value = newName;
                        updateApiPreview();
                        chrome.storage.local.set({ 'lastUsedRecord': newName });
                        alert(`Recording imported successfully as "${newName}"`);
                    })().catch((error) => {
                        console.error('Import recording error:', error);
                        alert('Failed to import recording. Please check the console for errors.');
                    });
                } catch (error) {
                    console.error('Import recording parse error:', error);
                    alert('Failed to parse the imported file. Please make sure it\'s a valid JSON file.');
                }
            };
            reader.readAsText(file);
        }
    });

    deleteRecordBtn.addEventListener('click', () => {
        const name = recordingSelect.value;
        if (name) {
            if (confirm(`Are you sure you want to delete the recording "${name}"?`)) {
                void deleteRecordingByName(name)
                    .then(() => {
                        loadRecordings();
                        alert(`Recording "${name}" deleted successfully`);
                    })
                    .catch((error) => {
                        console.error('Delete recording error:', error);
                        alert('Failed to delete recording. Please check the console for errors.');
                    });
            }
        } else {
            alert('Please select a recording to delete.');
        }
    });

    function loadRecordings() {
        void Promise.all([listRecordingNames(), getLastUsedRecordingName()])
            .then(([names, lastUsedRecord]) => {
                allRecordings = names;
                updateRecordingOptions(lastUsedRecord);
                updateButtonStates();
            })
            .catch((error) => {
                console.error('Load recordings error:', error);
                alert('Failed to load recordings. Please check the console for errors.');
            });
    }

    function updateRecordingOptions(lastUsedRecord = '') {
        const selectItems = document.querySelector('.select-items');
        renderRecordingOptions(selectItems, allRecordings, (recordingName) => {
            recordingSelect.value = recordingName;
            selectItems.classList.add('select-hide');
            updateApiPreview();
            void setLastUsedRecording(recordingName);
        });

        if (lastUsedRecord && allRecordings.includes(lastUsedRecord)) {
            recordingSelect.value = lastUsedRecord;
        } else if (allRecordings.length > 0) {
            recordingSelect.value = allRecordings[0];
        }

        updateApiPreview();
    }

    recordingSelect.addEventListener('input', () => {
        updateApiPreview();
        void setLastUsedRecording(recordingSelect.value);
    });

    function getRequestSearchTerm() {
        return (requestSearchInput?.value || '').trim().toLowerCase();
    }

    function renderPreviewList(container, recordingName, requests, requestHitCounts) {
        if (!container) {
            return;
        }

        renderApiPaths(
            container,
            requests,
            requestHitCounts,
            (path) => showApiCallDetails(recordingName, path),
            (requestKey, enabled) => {
                void updateRecordingRequestSettings(recordingName, requestKey, { enabled }).then((updated) => {
                    if (!updated) {
                        alert('Failed to update request replay settings.');
                        return;
                    }
                    updateApiPreview();
                });
            },
            (requestKey, status) => {
                void updateRecordingRequestSettings(recordingName, requestKey, { status }).then((updated) => {
                    if (!updated) {
                        alert('Failed to update request status.');
                        return;
                    }
                    updateApiPreview();
                });
            }
        );
    }

    function loadReplayOptionsIntoUI(name: string) {
        if (!name) return;
        void getRecording(name).then((recording) => {
            if (!recording) return;
            const opts = recording.replayOptions;
            if (latencyMsInput) (latencyMsInput as HTMLInputElement).value = opts?.latencyMs != null ? String(opts.latencyMs) : '';
            if (latencyRangeInput) (latencyRangeInput as HTMLInputElement).value = opts?.latencyRange ? opts.latencyRange.join(',') : '';
            if (fallbackMatchingCheckbox) (fallbackMatchingCheckbox as HTMLInputElement).checked = opts?.fallbackMatching ?? false;
            if (urlMappingsInput) urlMappingsInput.value = opts?.urlMappings ? opts.urlMappings.map((m) => `${m.from} -> ${m.to}`).join('\n') : '';
        });
    }

    function updateApiPreview() {
        const name = recordingSelect.value;
        if (name) {
            setUpdatingState(true);
            void Promise.all([
                getRecording(name),
                chrome.storage.local.get(['replayedRequests']),
                chrome.storage.session.get(['replayStats'])
            ])
                .then(([recording, replayData, replaySessionData]) => {
                    if (!recording?.requests) {
                        apiPreviewDiv.textContent = 'No recording found or invalid recording format';
                        if (recordApiPreviewDiv) {
                            recordApiPreviewDiv.textContent = 'No recording found or invalid recording format';
                        }
                        return;
                    }

                    const searchTerm = getRequestSearchTerm();
                    const allRequests = recording.requests;
                    const filteredRequests = searchTerm
                        ? Object.fromEntries(
                            Object.entries(allRequests).filter(([key, req]) => {
                                const statusText = typeof req.status === 'number' ? String(req.status) : '';
                                return (
                                    key.toLowerCase().includes(searchTerm) ||
                                    req.url.toLowerCase().includes(searchTerm) ||
                                    req.method.toLowerCase().includes(searchTerm) ||
                                    statusText.includes(searchTerm)
                                );
                            })
                        )
                        : allRequests;

                    const replayStatsHitCount = replaySessionData.replayStats?.hitCount || {};
                    const replayedRequests = replayData.replayedRequests || {};
                    const requestHitCounts = {
                        ...replayedRequests,
                        ...replayStatsHitCount
                    };

                    renderPreviewList(apiPreviewDiv, name, filteredRequests, requestHitCounts);
                    renderPreviewList(recordApiPreviewDiv, name, allRequests, requestHitCounts);
                })
                .catch((error) => {
                    console.error('Load recording error:', error);
                    apiPreviewDiv.textContent = 'Error loading API preview';
                    if (recordApiPreviewDiv) {
                        recordApiPreviewDiv.textContent = 'Error loading API preview';
                    }
                })
                .finally(() => {
                    setUpdatingState(false);
                });
        } else {
            apiPreviewDiv.textContent = 'No recording selected';
            if (recordApiPreviewDiv) {
                recordApiPreviewDiv.textContent = 'No recording selected';
            }
        }
    }

    function showApiCallDetails(recordingName, path) {
        void getRecording(recordingName)
            .then((recording) => {
                if (!recording) {
                    alert('No recording found with the name: ' + recordingName);
                    return;
                }

                const requests = recording.requests;
                const matchingRequest = Object.values(requests).find(req => {
                    const url = new URL(req.url);
                    return url.pathname + url.search === path;
                });

                if (!matchingRequest) {
                    alert('No matching API call found for the selected path.');
                    return;
                }

                renderApiCallDetails(apiCallDetails, matchingRequest);

                const responseBodyTextarea = document.getElementById('responseBody');
                responseBodyTextarea.value = formatResponseBody(matchingRequest);
                responseBodyTextarea.style.height = 'auto';
                responseBodyTextarea.style.height = `${responseBodyTextarea.scrollHeight}px`;

                const saveChangesBtn = document.getElementById('saveChanges');
                const requestKey = Object.keys(requests).find((key) => requests[key] === matchingRequest);
                saveChangesBtn.onclick = () => saveApiCallChanges(recordingName, requestKey);

                apiCallModal.classList.remove('hidden');
            })
            .catch((error) => {
                console.error('Load API call details error:', error);
                alert('Failed to load API call details. Please check the console for errors.');
            });
    }

    function saveApiCallChanges(recordingName, requestKey) {
        const updatedResponse = document.getElementById('responseBody').value;

        void updateRecordingRequestResponse(recordingName, requestKey, updatedResponse)
            .then((updated) => {
                if (!updated) {
                    alert('Failed to save changes. The specified request was not found.');
                    return;
                }
                alert('Changes saved successfully.');
                apiCallModal.classList.add('hidden');
                updateApiPreview();
            })
            .catch((error) => {
                console.error('Save changes error:', error);
                alert('Failed to save changes. Please check the console for errors.');
            });
    }

    closeModalBtn.addEventListener('click', () => {
        apiCallModal.classList.add('hidden');
    });

    const recordingSelectItems = document.querySelector('.select-items');

    const popupLayers = [
        {
            isOpen: () => !apiCallModal.classList.contains('hidden'),
            close: () => apiCallModal.classList.add('hidden')
        },
        {
            isOpen: () => !renameDialog.classList.contains('hidden'),
            close: () => renameDialog.classList.add('hidden')
        },
        {
            isOpen: () => !presetsDialog.classList.contains('hidden'),
            close: () => presetsDialog.classList.add('hidden')
        },
        {
            isOpen: () => !exportImportMenu.classList.contains('hidden'),
            close: () => exportImportMenu.classList.add('hidden')
        },
        {
            isOpen: () => !deleteMenu.classList.contains('hidden'),
            close: () => deleteMenu.classList.add('hidden')
        },
        {
            isOpen: () => recordingSelectItems && !recordingSelectItems.classList.contains('select-hide'),
            close: () => recordingSelectItems && recordingSelectItems.classList.add('select-hide')
        }
    ];

    function getActiveLayer() {
        return popupLayers.find((layer) => layer.isOpen());
    }

    document.addEventListener(
        'keydown',
        (event) => {
            if (event.key !== 'Escape') {
                return;
            }

            const activeLayer = getActiveLayer();
            if (!activeLayer) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            activeLayer.close();
        },
        true
    );

    // Close modal when clicking outside
    apiCallModal.addEventListener('click', (e) => {
        if (e.target === apiCallModal) {
            apiCallModal.classList.add('hidden');
        }
    });

    // Dark mode toggle
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        document.getElementById('apiCallModal').classList.toggle('dark');
        localStorage.setItem('darkMode', document.body.classList.contains('dark') ? 'enabled' : 'disabled');
    });

    // Initialize dark mode
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark');
        document.getElementById('apiCallModal').classList.add('dark');
    }

    // Listen for messages from the background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'recordingSaved') {
            loadRecordings();
            recordingSelect.value = request.name;
            updateApiPreview();
        } else if (request.action === 'newApiCall') {
            if (isRecording) {
                const url = new URL(request.data.url);
                currentRecordingApis.add(url.pathname + url.search);
                updateApiPreview();
            }
        } else if (request.action === 'recordingUpdated') {
            if (request.name === recordingSelect.value) {
                updateApiPreview();
            }
        }
    });

    initRecordingSelect(recordingSelect, document.querySelector('.select-items'), updateApiPreview);

    requestSearchInput?.addEventListener('input', () => {
        updateApiPreview();
    });

    async function loadPresets() {
        const settings = await ensureDefaultPresets();
        presets = settings.presets || [];
        lastPresetId = settings.lastPresetId || '';
        presetSelect.innerHTML = '<option value="">No preset</option>';
        presets.forEach((preset) => {
            const option = document.createElement('option');
            option.value = preset.id;
            option.textContent = preset.name;
            presetSelect.appendChild(option);
        });
        if (lastPresetId) {
            presetSelect.value = lastPresetId;
        }
        renderPresetsList();
    }

    function renderPresetsList() {
        presetsList.innerHTML = '';
        presets.forEach((preset) => {
            const row = document.createElement('div');
            row.className = 'flex items-center justify-between mb-1';
            row.innerHTML = `<span>${preset.name} <span class="opacity-70">(${preset.filter.join(', ')})</span></span>`;

            const actions = document.createElement('div');
            const useBtn = document.createElement('button');
            useBtn.className = 'bg-blue-500 text-white px-2 py-1 rounded text-xs mr-1';
            useBtn.textContent = 'Use';
            useBtn.onclick = () => {
                presetSelect.value = preset.id;
                filterInput.value = preset.filter.join(', ');
                void setLastUsedPreset(preset.id);
                presetsDialog.classList.add('hidden');
            };
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'bg-red-500 text-white px-2 py-1 rounded text-xs';
            deleteBtn.textContent = 'Delete';
            deleteBtn.onclick = async () => {
                await deletePreset(preset.id);
                await loadPresets();
            };

            actions.appendChild(useBtn);
            actions.appendChild(deleteBtn);
            row.appendChild(actions);
            presetsList.appendChild(row);
        });
    }

    presetSelect?.addEventListener('change', async () => {
        const selectedId = presetSelect.value;
        const selectedPreset = presets.find((entry) => entry.id === selectedId);
        if (selectedPreset) {
            filterInput.value = selectedPreset.filter.join(', ');
        }
        await setLastUsedPreset(selectedId);
    });

    managePresetsBtn?.addEventListener('click', () => {
        presetsDialog.classList.remove('hidden');
    });

    closePresetsBtn?.addEventListener('click', () => {
        presetsDialog.classList.add('hidden');
    });

    savePresetBtn?.addEventListener('click', async () => {
        const name = presetNameInput.value.trim();
        const filter = presetFilterInput.value.split(',').map((entry) => entry.trim()).filter(Boolean);
        if (!name || filter.length === 0) {
            alert('Preset name and filter are required.');
            return;
        }
        await upsertPreset({ name, filter });
        presetNameInput.value = '';
        presetFilterInput.value = '';
        await loadPresets();
    });

    async function refreshReplayStats() {
        chrome.runtime.sendMessage({ action: 'getReplayStats' }, (response) => {
            if (!response?.success || !response.replayStats) {
                return;
            }
            const stats = response.replayStats;
            replayStatsPanel.innerHTML = `
              <div><strong>Replay stats</strong></div>
              <div>Matched: ${stats.matched || 0}</div>
              <div>Unmatched: ${stats.unmatched || 0}</div>
              <div>Recent unmatched: ${(stats.unmatchedUrls || []).slice(-5).join(' | ') || 'None'}</div>
            `;
        });
    }


    exportImportDropdown.addEventListener('click', () => {
        exportImportMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', (event) => {
        if (!exportImportDropdown.contains(event.target) && !exportImportMenu.contains(event.target)) {
            exportImportMenu.classList.add('hidden');
        }
    });

    exportAllRecordingsBtn.addEventListener('click', exportAllRecordings);
    importAllRecordingsInput.addEventListener('change', importAllRecordings);

    // Update import button click handlers
    document.getElementById('importRecording').addEventListener('click', () => {
        document.getElementById('importRecordingInput').click();
    });

    document.getElementById('importAllRecordings').addEventListener('click', () => {
        document.getElementById('importAllRecordingsInput').click();
    });


    function exportAllRecordings() {
        void listRecordingNames()
            .then(async (names) => {
                const recordings: Record<string, unknown> = {};
                for (const name of names) {
                    const recording = await getRecording(name);
                    if (recording) {
                        recordings[name] = recording;
                    }
                }

                const blob = new Blob([JSON.stringify(recordings)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'all_recordings.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            })
            .catch((error) => {
                console.error('Export all recordings error:', error);
                alert('Failed to export recordings. Please check the console for errors.');
            });
    }

    function importAllRecordings(event) {
        const files = event.target.files;
        if (files.length > 0) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedRecordings = JSON.parse(e.target.result);
                    void (async () => {
                        const existingData = await chrome.storage.local.get(null);
                        const reserved = new Set([
                            'schemaVersion',
                            'recordings',
                            'lastUsedRecordId',
                            'lastUsedRecord',
                            'isRecording',
                            'isReplaying',
                            'currentRecordingName',
                            'currentFilter',
                            'replayTabId',
                            'runtimeState',
                            'replayedRequests'
                        ]);

                        const usedNames = new Set(
                            Object.keys(existingData).filter((key) => !reserved.has(key))
                        );

                        for (const [name, data] of Object.entries(importedRecordings)) {
                            const normalized = normalizeRecording({ ...(data || {}), name });
                            if (!normalized) {
                                continue;
                            }

                            let newName = normalized.name;
                            let counter = 1;
                            while (usedNames.has(newName)) {
                                counter++;
                                newName = `${normalized.name} (${counter})`;
                            }
                            usedNames.add(newName);

                            await upsertRecordingByName(newName, {
                                filter: normalized.filter,
                                requests: normalized.requests,
                                metadata: normalized.metadata
                            });
                        }

                        console.log('All recordings imported');
                        loadRecordings();
                        alert('All recordings imported successfully');
                    })().catch((error) => {
                        console.error('Import all recordings error:', error);
                        alert('Failed to import recordings. Please check the console for errors.');
                    });
                } catch (error) {
                    console.error('Import all recordings parse error:', error);
                    alert('Failed to parse the imported file. Please make sure it\'s a valid JSON file.');
                }
            };
            reader.readAsText(files[0]);
        }
    }

    // Add this new event listener for the delete dropdown
    deleteDropdown.addEventListener('click', () => {
        deleteMenu.classList.toggle('hidden');
    });

    // Close delete menu when clicking outside
    document.addEventListener('click', (event) => {
        if (!deleteDropdown.contains(event.target) && !deleteMenu.contains(event.target)) {
            deleteMenu.classList.add('hidden');
        }
    });

    // Add this new event listener for the duplicate button
    duplicateRecordingBtn.addEventListener('click', () => {
        const currentRecording = recordingSelect.value;
        if (currentRecording) {
            void duplicateRecording(currentRecording);
        } else {
            alert('Please select a recording to duplicate.');
        }
    });

    async function duplicateRecording(recordingName) {
        try {
            const newName = await duplicateRecordingByName(recordingName);
            if (!newName) {
                alert('No recording found with the name: ' + recordingName);
                return;
            }

            loadRecordings();
            recordingSelect.value = newName;
            updateApiPreview();
            await setLastUsedRecording(newName);
            alert(`Recording duplicated successfully as "${newName}"`);
            exportImportMenu.classList.add('hidden');
        } catch (error) {
            console.error('Duplicate recording error:', error);
            alert('Failed to duplicate recording. Please check the console for errors.');
        }
    }

    // Add this new function to handle the renaming process
    async function renameRecording(oldName, newName) {
        try {
            const renamed = await renameRecordingByName(oldName, newName);
            if (!renamed) {
                alert('No recording found with the name: ' + oldName);
                return;
            }

            loadRecordings();
            recordingSelect.value = newName;
            updateApiPreview();
            await setLastUsedRecording(newName);
            alert(`Recording renamed successfully to "${newName}"`);
            renameDialog.classList.add('hidden');
            exportImportMenu.classList.add('hidden');
        } catch (error) {
            console.error('Rename recording error:', error);
            alert('Failed to rename recording. Please check the console for errors.');
        }
    }

    // Add event listener for the rename button
    renameRecordingBtn.addEventListener('click', () => {
        const currentRecording = recordingSelect.value;
        if (currentRecording) {
            newRecordingNameInput.value = currentRecording;
            renameDialog.classList.remove('hidden');
        } else {
            alert('Please select a recording to rename.');
        }
    });

    // Add event listeners for the rename dialog buttons
    cancelRenameBtn.addEventListener('click', () => {
        renameDialog.classList.add('hidden');
    });

    confirmRenameBtn.addEventListener('click', () => {
        const oldName = recordingSelect.value;
        const newName = newRecordingNameInput.value.trim();
        if (newName && newName !== oldName) {
            void renameRecording(oldName, newName);
        } else {
            alert('Please enter a new name for the recording.');
        }
    });

    // Close rename dialog when clicking outside
    renameDialog.addEventListener('click', (e) => {
        if (e.target === renameDialog) {
            renameDialog.classList.add('hidden');
        }
    });

    function setUpdatingState(updating) {
        isUpdating = updating;
        if (updating) {
            apiPreviewDiv.classList.add('updating');
        } else {
            apiPreviewDiv.classList.remove('updating');
        }
    }
});

