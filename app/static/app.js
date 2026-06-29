document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const form = document.getElementById('fetch-form');
    const toggleAdvanced = document.getElementById('toggle-advanced');
    const advancedContent = document.getElementById('advanced-content');
    const submitBtn = document.getElementById('submit-btn');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    const btnText = submitBtn.querySelector('span:not(.btn-loader)');
    
    const emptyState = document.getElementById('empty-state');
    const resultPanel = document.getElementById('result-panel');
    
    // Summary Card Elements
    const statusBadge = document.getElementById('status-badge');
    const finalUrlDisplay = document.getElementById('final-url-display');
    const metaVerdict = document.getElementById('meta-verdict');
    const metaProfile = document.getElementById('meta-profile');
    const metaAttempts = document.getElementById('meta-attempts');
    const metaTime = document.getElementById('meta-time');
    const summaryAlert = document.getElementById('summary-alert');
    
    // Tab Elements
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    // Viewers
    const previewIframe = document.getElementById('preview-iframe');
    const traceTbody = document.getElementById('trace-tbody');
    const rawHtmlViewer = document.getElementById('raw-html-viewer');
    const jsonViewer = document.getElementById('json-viewer');
    const geminiOutputViewer = document.getElementById('gemini-output-viewer');
    const downloadCsvBtn = document.getElementById('download-csv-btn');

    // Advanced Section Toggle
    toggleAdvanced.addEventListener('click', () => {
        toggleAdvanced.classList.toggle('active');
        advancedContent.classList.toggle('active');
    });

    // Tab Navigation
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // Remove active classes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Add active classes
            button.classList.add('active');
            document.getElementById(`tab-${tabName}`).classList.add('active');
        });
    });

    // Form Submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const urlValue = document.getElementById('url').value.trim();
        const selectorsValue = document.getElementById('selectors').value.trim();
        const deviceValue = document.getElementById('device').value;
        const timeoutValue = parseInt(document.getElementById('timeout').value) || 25;
        const refererValue = document.getElementById('hint-referer').value;
        const impersonateValue = document.getElementById('hint-impersonate').value;
        const forcePlaywrightValue = document.getElementById('force-playwright').checked;
        const promptValue = document.getElementById('prompt').value.trim();
        const geminiKeyValue = document.getElementById('gemini-key').value.trim();
        
        if (!urlValue) return;

        // Loading state
        submitBtn.disabled = true;
        btnLoader.classList.remove('hidden');
        btnText.textContent = 'Retrieving...';
        
        // Prepare payload
        const selectors = selectorsValue ? selectorsValue.split(',').map(s => s.trim()).filter(Boolean) : null;
        const user_hint = {};
        if (refererValue) user_hint.referer_strategy = refererValue;
        if (impersonateValue) user_hint.impersonate_first = impersonateValue;
        
        const reqPayload = {
            url: urlValue,
            selectors: selectors,
            device: deviceValue,
            timeout: timeoutValue,
            user_hint: Object.keys(user_hint).length > 0 ? user_hint : null,
            force_playwright: forcePlaywrightValue,
            prompt: promptValue || null,
            gemini_key: geminiKeyValue || null
        };

        try {
            const response = await fetch('/api/fetch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reqPayload)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Fetch failed');
            }

            const data = await response.json();
            renderResults(data);
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            // Restore button state
            submitBtn.disabled = false;
            btnLoader.classList.add('hidden');
            btnText.textContent = 'Fetch Content';
        }
    });

    function renderResults(data) {
        // Hide empty state, show results
        emptyState.classList.add('hidden');
        resultPanel.classList.remove('hidden');

        // Render Summary
        finalUrlDisplay.textContent = data.final_url || document.getElementById('url').value;
        metaVerdict.textContent = data.verdict || '-';
        metaProfile.textContent = data.profile_used || 'None';
        metaAttempts.textContent = data.executed_attempts || (data.trace ? data.trace.length : 0);
        
        // Calculate total elapsed time
        let totalS = 0;
        if (data.trace) {
            data.trace.forEach(att => {
                totalS += att.elapsed_s || 0;
            });
        }
        metaTime.textContent = `${totalS.toFixed(2)}s`;

        // Status Badge classes
        statusBadge.className = 'badge-status';
        if (data.ok) {
            statusBadge.textContent = 'SUCCESS';
            statusBadge.classList.add('success');
        } else {
            statusBadge.textContent = 'BLOCKED / FAIL';
            statusBadge.classList.add('failed');
        }

        // Summary Alerts for R6/R7 or Playwright escalation
        summaryAlert.className = 'alert hidden';
        if (!data.ok) {
            let alertHtml = `<strong>Retrieval failed:</strong> ${data.stop_reason || 'exhausted'}`;
            if (data.must_invoke_playwright_mcp) {
                alertHtml += `<br>⚠️ Action Required: Local execution failed. Real browser escalation (MCP Playwright) required.`;
            }
            if (data.untried_routes && data.untried_routes.length > 0) {
                alertHtml += `<br>Untried strategies: <ul>` + data.untried_routes.map(r => `<li>${r}</li>`).join('') + `</ul>`;
            }
            summaryAlert.innerHTML = alertHtml;
            summaryAlert.classList.add('alert-danger');
            summaryAlert.classList.remove('hidden');
        } else if (data.summary && data.summary.includes('R7 API-first')) {
            summaryAlert.innerHTML = `💡 <strong>R7 Suggestion</strong>: High WAF challenge detected. API-first retrieval is recommended for bulk tasks.`;
            summaryAlert.classList.add('alert-warning');
            summaryAlert.classList.remove('hidden');
        }

        // 1. Render Visual Preview IFrame
        try {
            const doc = previewIframe.contentWindow.document || previewIframe.contentDocument;
            doc.open();
            // If the content is empty or none, print message
            if (data.content) {
                doc.write(data.content);
            } else {
                doc.write(`<html><body style="font-family:sans-serif; color:#777; padding:40px; text-align:center;"><h3>No Renderable Content</h3><p>The server response did not contain HTML body.</p></body></html>`);
            }
            doc.close();
        } catch (iframeErr) {
            console.error('Failed to write to iframe:', iframeErr);
        }

        // 2. Render Trace Table
        traceTbody.innerHTML = '';
        if (data.trace && data.trace.length > 0) {
            data.trace.forEach((att, index) => {
                const tr = document.createElement('tr');
                
                const phaseClass = att.phase === 'probe' ? 'probe' : (att.phase === 'fallback' ? 'fallback' : 'grid');
                const verdictClass = att.verdict === 'strong_ok' || att.verdict === 'weak_ok' ? 'verdict-ok' : (att.verdict === 'challenge' ? 'verdict-challenge' : 'verdict-blocked');
                
                tr.innerHTML = `
                    <td>${index + 1}</td>
                    <td><span class="badge-phase ${phaseClass}">${att.phase}</span></td>
                    <td><code>${att.executor || '-'}</code></td>
                    <td><code>${att.url_transform || 'original'}</code></td>
                    <td><code>${att.impersonate || '-'}</code></td>
                    <td><code>${att.referer || '-'}</code></td>
                    <td><code>${att.status || '0'}</code></td>
                    <td class="${verdictClass}">${att.verdict || 'unknown'}</td>
                    <td>${(att.elapsed_s || 0).toFixed(2)}s</td>
                    <td><span class="err-text" title="${att.error || ''}">${att.error ? att.error.substring(0, 80) : (att.reasons ? att.reasons.join(', ') : '-')}</span></td>
                `;
                traceTbody.appendChild(tr);
            });
        } else {
            traceTbody.innerHTML = `<tr><td colspan="10" style="text-align:center; color:var(--text-secondary);">No attempts made in trace log.</td></tr>`;
        }

        // 3. Render Raw HTML
        rawHtmlViewer.value = data.content || '';

        // 4. Render JSON (exclude massive raw HTML content to keep display readable)
        const cleanJson = { ...data };
        delete cleanJson.content; // Omit huge HTML content string from metadata tab
        jsonViewer.textContent = JSON.stringify(cleanJson, null, 2);

        // 5. Render Gemini Response
        geminiOutputViewer.value = data.llm_output || '';
        
        // Auto-switch tabs based on LLM response availability
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));
        if (data.llm_output) {
            document.querySelector('[data-tab="gemini"]').classList.add('active');
            document.getElementById('tab-gemini').classList.add('active');
        } else {
            document.querySelector('[data-tab="preview"]').classList.add('active');
            document.getElementById('tab-preview').classList.add('active');
        }

        // Show/hide download button for CSV if LLM output contains rows
        if (data.llm_output && (data.llm_output.includes(',') || data.llm_output.includes('\n'))) {
            downloadCsvBtn.classList.remove('hidden');
            downloadCsvBtn.onclick = () => {
                let csvContent = data.llm_output;
                // Strip markdown code fences if Gemini wrapped it in ```csv ... ```
                const match = csvContent.match(/```(?:csv)?([\s\S]*?)```/);
                if (match) {
                    csvContent = match[1].trim();
                }
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", "extracted_data.csv");
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };
        } else {
            downloadCsvBtn.classList.add('hidden');
        }
    }
});
