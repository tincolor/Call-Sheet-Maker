import { useEffect } from 'preact/hooks';

export function HowToUsePanel() {
  const closePanel = () => {
    document.body.classList.remove('how-to-use-open');
  };

  // Listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closePanel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div>
      <div class="how-to-use-backdrop" onClick={closePanel} />
      <div class="how-to-use-drawer">
        <div class="how-to-use-drawer-hd">
          <h3>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
              <path d="M6 6h10M6 10h10"/>
            </svg>
            How To Use
          </h3>
          <button class="close-btn" onClick={closePanel} aria-label="Close panel">×</button>
        </div>
        <div class="how-to-use-drawer-body">
          
          {/* Summary */}
          <div class="how-to-use-section">
            <h4>About Call Sheet Maker</h4>
            <p>
              <strong>Call Sheet Maker</strong> is a production management utility designed to compile, organize, and print film and television call sheets. It balances the convenience of automated parsing with the precision of manual editing, storing all data securely within your browser's local storage.
            </p>
          </div>

          {/* Workflow */}
          <div class="how-to-use-section">
            <h4>Workflow Methods</h4>
            <div class="how-to-use-workflow-container">
              <div class="how-to-use-workflow-card">
                <h5>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--accent);">
                    <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                  </svg>
                  Method A: Direct Editing (Manual)
                </h5>
                <p>
                  Click directly on any text block on the call sheet paper to edit the details in-place. If in editing mode, you can use drag handles to reorder items, hover over lines to add/delete rows, or upload/delete logos.
                </p>
              </div>
              <div class="how-to-use-workflow-card">
                <h5>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--accent);">
                    <path d="m12 3-1.912 5.886L5 10.8l5.088 1.914L12 18.6l1.912-5.886L19 10.8l-5.088-1.914Z"/>
                    <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5Z"/>
                    <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z"/>
                  </svg>
                  Method B: Claude AI Intake
                </h5>
                <p>
                  Open the <strong>Intake</strong> panel on the left and paste raw text (WhatsApp/Slack chats, emails, Excel exports, outline notes). Claude will automatically structure and organize the data. Review the changes, then click <strong>Publish to Sheet</strong> to apply.
                </p>
              </div>
            </div>
          </div>

          {/* Claude API Key Setup */}
          <div class="how-to-use-section">
            <h4>Claude API Key Setup</h4>
            <p>
              The built-in Claude helper is only available when running in supported container environments (like the developer workspace preview). In standalone browser mode, you must provide your own Anthropic API key to use the AI Intake panel:
            </p>
            <ol class="how-to-use-key-steps">
              <li>Visit the <a href="https://console.anthropic.com/" target="_blank" rel="noopener">Anthropic Developer Console</a> and sign up or log in.</li>
              <li>Navigate to the <strong>API Keys</strong> section.</li>
              <li>Click <strong>Create Key</strong>, name it, and copy the key string (starts with <code>sk-ant-</code>).</li>
              <li>In the Intake sidebar, expand the <strong>Claude API key</strong> details block, paste your key, select <strong>Sonnet 4.5</strong> or <strong>Haiku 4.5</strong>, and click <strong>Save</strong>.</li>
            </ol>
            <p style="font-size:11px;color:var(--ink-3);margin-top:4px;">
              Your key is saved locally in this browser only. Usage will be billed to your Anthropic developer account.
            </p>
          </div>

          {/* Functions Grid */}
          <div class="how-to-use-section">
            <h4>Feature Reference</h4>
            <div class="how-to-use-functions-grid">
              
              <div class="how-to-use-function-item">
                <div class="how-to-use-function-name">Day Switcher</div>
                <div class="how-to-use-function-desc">Add new shooting days or switch between days. Stored as distinct pages.</div>
              </div>
              
              <div class="how-to-use-function-item">
                <div class="how-to-use-function-name">Delete Day</div>
                <div class="how-to-use-function-desc">Removes the currently visible shoot day from your database.</div>
              </div>

              <div class="how-to-use-function-item">
                <div class="how-to-use-function-name">Import CSV</div>
                <div class="how-to-use-function-desc">Loads external spreadsheet data or Claude-generated files directly into the sheet.</div>
              </div>

              <div class="how-to-use-function-item">
                <div class="how-to-use-function-name">Export CSV</div>
                <div class="how-to-use-function-desc">Downloads the current day's call sheet details as a CSV file for backup.</div>
              </div>

              <div class="how-to-use-function-item">
                <div class="how-to-use-function-name">Tweaks</div>
                <div class="how-to-use-function-desc">Toggles paper dimensions (US Letter vs. A4) and toggles the header logo display.</div>
              </div>

              <div class="how-to-use-function-item">
                <div class="how-to-use-function-name">Reset All</div>
                <div class="how-to-use-function-desc">Permanently purges all shoot days, configurations, and browser storage, resetting to default.</div>
              </div>

              <div class="how-to-use-function-item">
                <div class="how-to-use-function-name">Print / PDF</div>
                <div class="how-to-use-function-desc">Opens your browser's Print window. Custom print CSS formats sheets beautifully for physical print or saving as PDF.</div>
              </div>

              <div class="how-to-use-function-item">
                <div class="how-to-use-function-name">Page Breaks</div>
                <div class="how-to-use-function-desc">Insert a page break above sections to force them to start on a new page when printing.</div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
