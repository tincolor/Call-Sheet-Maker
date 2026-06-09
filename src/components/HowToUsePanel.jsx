import { useEffect } from 'preact/hooks';
import skillMd from '../../Claude SKILL.md?raw';

function downloadSkillFile() {
  const blob = new Blob([skillMd], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Claude SKILL.md';
  a.click();
  URL.revokeObjectURL(url);
}

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
              Make call sheets the easy way. Use Claude to make sense of all the info that needs to go into a call sheet. It doesn't matter if it's in a long group chat, spread over multiple emails, or if it's in your head. Feed all that data to Claude and it will automatically put it into the call sheet for you. And if Claude makes a mistake, or if you want to adjust something, you can do that too. Or if you hate AI and want to do it all yourself, you can do that, too!
            </p>
            <p><strong>Note:</strong> Works best in Chrome.</p>
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
                  Method A: Do It Yourself
                </h5>
                <p>
                  Click directly on any text block on the call sheet to edit the details in place. You can reorder, add, and delete rows and even add custom logos.
                </p>
              </div>
              <div class="how-to-use-workflow-card">
                <h5>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--accent);">
                    <path d="m12 3-1.912 5.886L5 10.8l5.088 1.914L12 18.6l1.912-5.886L19 10.8l-5.088-1.914Z"/>
                    <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5Z"/>
                    <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z"/>
                  </svg>
                  Method B: Let Claude Do It
                </h5>
                <p>
                  Open the <strong>Intake</strong> panel on the left and paste raw text (WhatsApp/Slack chats, emails, Excel exports, outline notes). Claude will automatically structure and organize the data. Review the changes, then click <strong>Publish to Sheet</strong> to apply.
                </p>
              </div>
            </div>
          </div>

          {/* How to Save */}
          <div class="how-to-use-section">
            <h4>How to Save Your Work</h4>
            <p>
              All your work is saved automatically by your browser. If you delete your browser's cache, your data will be lost. But fear not! You can save your work by downloading either a CSV file or a PDF.
            </p>
            <p><strong>What's the difference?</strong></p>
            <p>
              Download the <strong>CSV file</strong> if you want a local copy that can easily be edited again. The CSV file is just text data, so it doesn't look like a call sheet. To make a CSV file look like a call sheet, just upload it to the website again using the <strong>Import CSV</strong> button.
            </p>
            <p>
              Download a <strong>PDF</strong> if you just want a copy that looks like what you see on the website. Technically you can use this PDF with Claude to create a new editable version of the same call sheet, but it costs a lot more tokens for Claude to do this so best to have a CSV as well.
            </p>
          </div>

          {/* Claude API Key Setup */}
          <div class="how-to-use-section">
            <h4>Claude API Key Setup</h4>
            <p>
              Provide your own Anthropic API key to use the AI Intake panel. Don't know what an API key is or how to get one? Here's what you need to know:
            </p>
            <ol class="how-to-use-key-steps">
              <li>Visit the <a href="https://console.anthropic.com/" target="_blank" rel="noopener">Anthropic Developer Console</a> and sign up or log in.</li>
              <li>Navigate to the <strong>API Keys</strong> section.</li>
              <li>Click <strong>Create Key</strong>, name it, and copy the key string (starts with <code>sk-ant-</code>).</li>
              <li>In the Intake sidebar, expand the <strong>Claude API Key Details</strong> block, paste your key, select <strong>Sonnet 4.5</strong> or <strong>Haiku 4.5</strong>, and click <strong>Save</strong>.</li>
            </ol>
            <p style="font-size:11px;color:var(--ink-3);margin-top:4px;">
              Your key is saved locally in this browser only, so no one can see your data or use your API key. Usage will be billed to your Anthropic developer account.
            </p>
          </div>

          {/* Claude App Skill */}
          <div class="how-to-use-section">
            <h4>Using Claude App Instead?</h4>
            <p>
              If you prefer to use the <strong>Claude desktop or web app</strong> rather than the built-in AI intake, you can teach Claude how to format call sheets correctly by uploading the skill file once at the start of your conversation.
            </p>
            <p>
              <button class="how-to-use-download-btn" onClick={downloadSkillFile}>
                ↓ Download Claude SKILL.md
              </button>
            </p>
            <p style="font-size:11px;color:var(--ink-3);margin-top:4px;">
              Upload this file to Claude at the start of a new conversation and say <em>"Use this skill file to format my notes into a call sheet CSV."</em> Claude will then know exactly how to structure the output for import into this app.
            </p>
          </div>

          {/* Functions Grid */}
          <div class="how-to-use-section">
            <h4>Feature Reference</h4>
            <div class="how-to-use-functions-grid">

              <div class="how-to-use-function-item">
                <div class="how-to-use-function-name">Day Switcher</div>
                <div class="how-to-use-function-desc">The days listed at the top of the page. Add new shooting days or switch between days.</div>
              </div>

              <div class="how-to-use-function-item">
                <div class="how-to-use-function-name">Delete Day</div>
                <div class="how-to-use-function-desc">Removes the currently visible shoot day from your database.</div>
              </div>

              <div class="how-to-use-function-item">
                <div class="how-to-use-function-name">Import CSV</div>
                <div class="how-to-use-function-desc">Loads call sheets saved as CSV files.</div>
              </div>

              <div class="how-to-use-function-item">
                <div class="how-to-use-function-name">Export CSV</div>
                <div class="how-to-use-function-desc">Downloads the current day's call sheet details as a CSV file for backup.</div>
              </div>

              <div class="how-to-use-function-item">
                <div class="how-to-use-function-name">Options</div>
                <div class="how-to-use-function-desc">Toggles paper dimensions (US Letter vs. A4) and toggles the header logo display.</div>
              </div>

              <div class="how-to-use-function-item">
                <div class="how-to-use-function-name">Reset All</div>
                <div class="how-to-use-function-desc">Permanently purges all shoot days, configurations, and browser storage, resetting to default.</div>
              </div>

              <div class="how-to-use-function-item">
                <div class="how-to-use-function-name">Print / PDF</div>
                <div class="how-to-use-function-desc">Opens your browser's print window for physical printing or saving as PDF.</div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
