// ==========================================
// --- API CONFIGURATION & UTILITIES ---
// ==========================================
const API_ENDPOINTS = {
    upload: '/api/upload',
    dashboard: '/api/dashboard',
    analysis: '/api/analysis',
    results: '/api/results'
};

async function fetchJSON(url, options = {}) {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return await response.json();
}

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        obj.innerHTML = Math.floor(easeOutQuart * (end - start) + start).toLocaleString();
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

// ==========================================
// --- CHART RENDERING UTILITIES ---
// ==========================================
if (typeof Chart !== 'undefined') {
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Inter', sans-serif";
}

const gridConfig = { color: 'rgba(148, 163, 184, 0.05)', drawBorder: false };
const tooltipConfig = { backgroundColor: 'rgba(15, 23, 42, 0.9)', titleColor: '#f8fafc', bodyColor: '#cbd5e1', borderColor: 'rgba(148, 163, 184, 0.2)', borderWidth: 1, padding: 12, cornerRadius: 8 };

function renderDoughnut(canvasId, safe, fraud) {
    if (typeof Chart === 'undefined') return;
    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Legitimate Traffic', 'Fraudulent Clicks'],
            datasets: [{ 
                data: [safe, fraud], backgroundColor: ['#10b981', '#ef4444'], borderColor: '#0f172a', borderWidth: 4, hoverOffset: 6
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { tooltip: tooltipConfig, legend: { position: 'bottom' } } }
    });
}

function renderBarChart(canvasId, labels, dataValues) {
    if (typeof Chart === 'undefined') return;
    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{ label: 'Fraud Volume', data: dataValues, backgroundColor: '#3b82f6', borderRadius: 6, hoverBackgroundColor: '#60a5fa' }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { tooltip: tooltipConfig, legend: { display: false } }, scales: { y: { grid: gridConfig, beginAtZero: true }, x: { grid: { display: false } } } }
    });
}

function renderLineChart(canvasId, labels, dataValues) {
    if (typeof Chart === 'undefined') return;
    const ctx = document.getElementById(canvasId).getContext('2d');
    let gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(245, 158, 11, 0.3)');
    gradient.addColorStop(1, 'rgba(245, 158, 11, 0)');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{ label: 'Risk Spikes', data: dataValues, borderColor: '#f59e0b', backgroundColor: gradient, borderWidth: 3, pointBackgroundColor: '#0f172a', pointBorderColor: '#f59e0b', pointBorderWidth: 2, pointRadius: 4, fill: true, tension: 0.4 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { tooltip: tooltipConfig, legend: { display: false } }, scales: { y: { grid: gridConfig }, x: { grid: gridConfig } }, interaction: { intersect: false, mode: 'index' } }
    });
}

// ==========================================
// --- MAIN APPLICATION LOGIC ---
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Navigation Highlighting
    let currentPath = window.location.pathname;
    if (currentPath === '/') currentPath = '/index.html';
    document.querySelectorAll('nav ul li a').forEach(link => {
        if (link.getAttribute('href') === currentPath || link.getAttribute('href') + '.html' === currentPath) {
            link.classList.add('active');
        }
    });

    // 2. Upload Page Logic
    const dropZone = document.getElementById('drop-zone');
    if (dropZone) {
        const fileInput = document.getElementById('csv-file');
        const fileDetails = document.getElementById('file-details');
        const fileNameEl = document.getElementById('file-name');
        const fileSizeEl = document.getElementById('file-size');
        const startScanBtn = document.getElementById('start-scan-btn');
        const terminalOutput = document.getElementById('terminal-output');
        const terminalLines = document.getElementById('terminal-lines');
        
        let selectedFile = null;

        const processFileSelection = (file) => {
            if (!file.name.endsWith('.csv')) {
                alert('Security Policy: Only standard .CSV telemetry logs are permitted.');
                return;
            }
            selectedFile = file;
            fileNameEl.innerText = file.name;
            fileSizeEl.innerText = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
            dropZone.style.display = 'none';
            fileDetails.style.display = 'flex';
        };

        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.borderColor = 'var(--brand-accent)'; });
        dropZone.addEventListener('dragleave', () => { dropZone.style.borderColor = 'rgba(59, 130, 246, 0.4)'; });
        dropZone.addEventListener('drop', (e) => { 
            e.preventDefault(); 
            dropZone.style.borderColor = 'rgba(59, 130, 246, 0.4)';
            if (e.dataTransfer.files.length) processFileSelection(e.dataTransfer.files[0]); 
        });
        fileInput.addEventListener('change', (e) => { 
            if (e.target.files.length) processFileSelection(e.target.files[0]); 
        });

        startScanBtn.addEventListener('click', async () => {
            if (!selectedFile) return;
            
            fileDetails.style.display = 'none';
            terminalOutput.style.display = 'block';

            const pipelineSteps = [
                "> Allocating secure memory enclave...",
                "> Validating CSV schema mapping...",
                "> Normalizing timestamp sequences...",
                "> Pre-loading LSTM (.h5) tensor weights...",
                "> Executing behavioral inference...",
                "> Compiling threat matrix..."
            ];

            for (let i = 0; i < pipelineSteps.length; i++) {
                const line = document.createElement('div');
                line.innerText = pipelineSteps[i];
                line.style.opacity = '0';
                line.style.animation = 'fadeIn 0.3s forwards';
                terminalLines.appendChild(line);
                await new Promise(r => setTimeout(r, 600)); 
            }

            const formData = new FormData(); 
            formData.append('dataset', selectedFile);

            try {
                const result = await fetchJSON(API_ENDPOINTS.upload, { method: 'POST', body: formData });
                if (result.success) {
                    const finalLine = document.createElement('div');
                    finalLine.innerText = "> INFERENCE COMPLETE. Redirecting...";
                    finalLine.style.color = "var(--brand-accent)";
                    terminalLines.appendChild(finalLine);
                    setTimeout(() => { window.location.href = '/dashboard.html'; }, 800);
                }
                else throw new Error(result.message);
            } catch (error) {
                const errLine = document.createElement('div');
                errLine.innerText = `> CRITICAL ERROR: ${error.message}`;
                errLine.style.color = "var(--danger-red)";
                terminalLines.appendChild(errLine);
            }
        });
    }

    // 3. Dashboard Page Logic
    if (document.getElementById('dashboard-view')) {
        try {
            const data = await fetchJSON(API_ENDPOINTS.dashboard);
            document.querySelectorAll('.skeleton').forEach(el => el.classList.remove('skeleton', 'skeleton-text', 'skeleton-chart'));
            
            animateValue(document.getElementById('total-clicks'), 0, data.total_clicks, 1500);
            animateValue(document.getElementById('fraud-detected'), 0, data.fraud_count, 1500);
            
            const riskEl = document.getElementById('risk-level');
            riskEl.innerText = data.risk_level;
            if (data.risk_level === 'HIGH') {
                riskEl.style.color = 'var(--danger-red)';
                riskEl.style.textShadow = '0 0 20px rgba(239, 68, 68, 0.5)';
                document.getElementById('alert-banner').style.display = 'flex';
            } else if (data.risk_level === 'MEDIUM') {
                riskEl.style.color = 'var(--warning-yellow)';
            } else {
                riskEl.style.color = 'var(--safe-green)';
            }
            
            const fraudPct = ((data.fraud_count / data.total_clicks) * 100).toFixed(1);
            document.getElementById('insight-pct').innerText = `${fraudPct}%`;
            document.getElementById('insight-category').innerText = data.top_attack_category || "Social_Ad";
            document.getElementById('insight-peak').innerText = data.peak_fraud_time || "14:00 UTC";

            document.getElementById('fraudChart').style.opacity = '1';
            renderDoughnut('fraudChart', data.total_clicks - data.fraud_count, data.fraud_count);

            const feedContainer = document.getElementById('live-feed-container');
            if (feedContainer) {
                const vectors = ["Botnet_DDoS", "Click_Farm", "Script_Injection", "Geo_Spoof"];
                setInterval(() => {
                    const ip = `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.x`;
                    const vector = vectors[Math.floor(Math.random() * vectors.length)];
                    const conf = (90 + Math.random() * 9).toFixed(1);
                    
                    const row = document.createElement('div');
                    row.style.display = 'flex';
                    row.style.justifyContent = 'space-between';
                    row.style.color = '#94a3b8';
                    row.style.animation = 'slideDown 0.3s ease-out forwards';
                    
                    row.innerHTML = `
                        <span style="color: var(--danger-red);">[BLOCKED]</span>
                        <span style="color: var(--text-main);">${ip}</span>
                        <span>${vector}</span>
                        <span style="color: var(--accent-cyan);">Conf: ${conf}%</span>
                    `;
                    feedContainer.prepend(row);
                    if (feedContainer.children.length > 6) feedContainer.removeChild(feedContainer.lastChild);
                }, 2500); 
            }

        } catch (e) { console.error("Dashboard Fetch Error:", e); }
    }

    // 4. Analysis Page Logic
    if (document.getElementById('analysis-view')) {
        try {
            const data = await fetchJSON(API_ENDPOINTS.analysis);
            document.getElementById('campaignChart').style.opacity = '1';
            document.getElementById('timeSeriesChart').style.opacity = '1';
            
            renderLineChart('timeSeriesChart', data.timeseries.timestamps, data.timeseries.fraud_counts);
            renderBarChart('campaignChart', data.campaigns.labels, data.campaigns.values);

            const exportBtn = document.getElementById('export-btn');
            if (exportBtn) {
                exportBtn.addEventListener('click', () => {
                    const originalHTML = exportBtn.innerHTML;
                    exportBtn.innerHTML = `⏳ Compiling Logs...`;
                    exportBtn.style.opacity = '0.7';
                    exportBtn.style.pointerEvents = 'none';

                    setTimeout(() => {
                        let csvContent = "data:text/csv;charset=utf-8,Timestamp,Detected_Anomalies\n";
                        for (let i = 0; i < data.timeseries.timestamps.length; i++) {
                            csvContent += `${data.timeseries.timestamps[i]},${data.timeseries.fraud_counts[i]}\n`;
                        }
                        csvContent += "\nCampaign_Name,Total_Threats\n";
                        for (let i = 0; i < data.campaigns.labels.length; i++) {
                            csvContent += `${data.campaigns.labels[i]},${data.campaigns.values[i]}\n`;
                        }
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", "Threat_Forensics_Report.csv");
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        
                        exportBtn.innerHTML = originalHTML;
                        exportBtn.style.opacity = '1';
                        exportBtn.style.pointerEvents = 'auto';
                    }, 1500);
                });
            }
        } catch (e) { console.error("Analysis Fetch Error:", e); }
    }

    // 5. Results Page Logic
    const tbody = document.getElementById('results-table-body');
    if (tbody) {
        let globalRecords = [];

        const renderTable = (records) => {
            tbody.innerHTML = '';
            if (records.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem; color: var(--text-muted);">No matching telemetry found.</td></tr>`;
                return;
            }
            
            records.forEach((record, index) => {
                const confPercent = (record.confidence * 100).toFixed(1);
                
                // Visual logic based on threat severity
                let badgeClass = confPercent > 90 ? 'badge-danger' : 'badge-warning'; 
                let progressColor = confPercent > 90 ? 'var(--danger-red)' : 'var(--warning-yellow)';
                let actionBadge = confPercent > 90 
                    ? `<span style="color: var(--danger-red); font-weight: 600; display: flex; align-items: center; gap: 0.25rem;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg> BLOCKED</span>`
                    : `<span style="color: var(--warning-yellow); font-weight: 600; display: flex; align-items: center; gap: 0.25rem;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> FLAGGED</span>`;

                const row = document.createElement('tr');
                row.className = 'fade-in';
                row.style.animationDelay = `${index * 0.05}s`;
                
                // Safely format the JSON data to store inside the HTML attribute
                const safeRecordData = JSON.stringify(record).replace(/'/g, "&#39;");

                row.innerHTML = `
                    <td style="font-family: monospace; color: var(--accent-cyan); font-weight: 500;">${record.user_id}</td>
                    <td style="color: var(--text-muted); font-size: 0.9rem;">${record.timestamp}</td>
                    <td>${record.campaign}</td>
                    <td><span class="badge ${badgeClass}">${record.pattern}</span></td>
                    <td>
                        <div class="confidence-cell">
                            <span style="width: 45px; font-weight: 600;">${confPercent}%</span>
                            <div class="progress-bg">
                                <div class="progress-fill" style="width: 0%; background: ${progressColor}; box-shadow: 0 0 8px ${progressColor};"></div>
                            </div>
                        </div>
                    </td>
                    <td>${actionBadge}</td>
                    <td class="details-btn" data-record='${safeRecordData}' style="text-align: center; cursor: pointer; color: var(--text-muted); transition: color 0.2s;">
                        <svg class="details-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" onmouseover="this.style.color='var(--accent-cyan)'" onmouseout="this.style.color='var(--text-muted)'"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                    </td>
                `;
                tbody.appendChild(row);
                
                // Animate progress bar slightly after render
                setTimeout(() => { row.querySelector('.progress-fill').style.width = `${confPercent}%`; }, 100);
            });
        };

        try {
            const data = await fetchJSON(API_ENDPOINTS.results);
            globalRecords = data.fraud_records;
            renderTable(globalRecords);

            // --- SEARCH & FILTER LOGIC ---
            const searchInput = document.getElementById('search-ip');
            const filterCampaign = document.getElementById('filter-campaign');
            
            const applyFilters = () => {
                const term = searchInput.value.toLowerCase();
                const camp = filterCampaign.value;
                const filtered = globalRecords.filter(r => {
                    const matchIP = r.user_id.toLowerCase().includes(term);
                    const matchCamp = camp === 'ALL' || r.campaign === camp;
                    return matchIP && matchCamp;
                });
                renderTable(filtered);
            };

            if(searchInput) searchInput.addEventListener('input', applyFilters);
            if(filterCampaign) filterCampaign.addEventListener('change', applyFilters);

            // --- EXPORT CSV LOGIC ---
            const exportLogsBtn = document.getElementById('export-logs-btn');
            if(exportLogsBtn) {
                exportLogsBtn.addEventListener('click', () => {
                    const originalHTML = exportLogsBtn.innerHTML;
                    exportLogsBtn.innerHTML = `⏳ Extracting...`;
                    exportLogsBtn.style.opacity = '0.7';
                    exportLogsBtn.style.pointerEvents = 'none';

                    setTimeout(() => {
                        let csvContent = "data:text/csv;charset=utf-8,Source_IP,Timestamp,Campaign,Threat_Signature,Confidence_Score\n";
                        
                        // Export currently filtered records
                        const currentRecords = searchInput.value || filterCampaign.value !== 'ALL' 
                            ? globalRecords.filter(r => r.user_id.toLowerCase().includes(searchInput.value.toLowerCase()) && (filterCampaign.value === 'ALL' || r.campaign === filterCampaign.value))
                            : globalRecords;

                        currentRecords.forEach(r => {
                            csvContent += `${r.user_id},${r.timestamp},${r.campaign},${r.pattern},${r.confidence}\n`;
                        });

                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", "Security_Logs_Export.csv");
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);

                        exportLogsBtn.innerHTML = originalHTML;
                        exportLogsBtn.style.opacity = '1';
                        exportLogsBtn.style.pointerEvents = 'auto';
                    }, 1000);
                });
            }

            // --- MODAL POPUP LOGIC ---
            const modal = document.getElementById('details-modal');
            const closeModalBtn = document.getElementById('close-modal');
            const modalJson = document.getElementById('modal-json');

            if (modal && modalJson) {
                // Open Modal when 3 dots are clicked
                tbody.addEventListener('click', (e) => {
                    const btn = e.target.closest('.details-btn');
                    if (btn) {
                        const recordData = JSON.parse(btn.getAttribute('data-record'));
                        // Format the JSON beautifully
                        modalJson.textContent = JSON.stringify(recordData, null, 4);
                        modal.style.display = 'flex';
                    }
                });

                // Close Modal logic
                if (closeModalBtn) closeModalBtn.addEventListener('click', () => modal.style.display = 'none');
                
                // Close if user clicks outside the modal box
                window.addEventListener('click', (e) => {
                    if (e.target === modal) modal.style.display = 'none';
                });
            }

        } catch (err) { 
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--danger-red); padding: 2rem;">System Error fetching security logs. Ensure backend API is active.</td></tr>`; 
            console.error(err);
        }
    }
    // 6. Architecture Page Logic (Carousel)
    const track = document.getElementById('carousel-track');
    if (track) {
        const slides = Array.from(track.children);
        const nextButton = document.getElementById('carousel-next');
        const prevButton = document.getElementById('carousel-prev');
        const dotsNav = document.getElementById('carousel-nav');
        const dots = Array.from(dotsNav.children);
        let currentIndex = 0;

        const updateCarousel = (index) => {
            track.style.transform = 'translateX(-' + index * 100 + '%)';
            dots.forEach(dot => dot.classList.remove('active'));
            dots[index].classList.add('active');
        };

        nextButton.addEventListener('click', () => {
            currentIndex = currentIndex === slides.length - 1 ? 0 : currentIndex + 1;
            updateCarousel(currentIndex);
        });

        prevButton.addEventListener('click', () => {
            currentIndex = currentIndex === 0 ? slides.length - 1 : currentIndex - 1;
            updateCarousel(currentIndex);
        });

        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                currentIndex = index;
                updateCarousel(currentIndex);
            });
        });

        // Auto-play carousel every 5 seconds
        setInterval(() => {
            currentIndex = currentIndex === slides.length - 1 ? 0 : currentIndex + 1;
            updateCarousel(currentIndex);
        }, 5000);
    }
});