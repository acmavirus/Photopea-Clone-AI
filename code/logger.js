(function() {
    // 1. Initialize Log Storage
    var maxLogs = 100;
    var storageKey = 'photopea_debug_logs';

    function getStoredLogs() {
        try {
            var raw = localStorage.getItem(storageKey);
            return raw ? JSON.parse(raw) : [];
        } catch(e) {
            return [];
        }
    }

    function saveLogs(logs) {
        try {
            localStorage.setItem(storageKey, JSON.stringify(logs.slice(-maxLogs)));
        } catch(e) {}
    }

    function addLog(type, message, stack) {
        var logs = getStoredLogs();
        var timestamp = new Date().toLocaleTimeString();
        logs.push({
            type: type,
            message: message,
            stack: stack || '',
            time: timestamp
        });
        saveLogs(logs);
        updateUI();
    }

    // 2. Intercept Errors
    window.addEventListener('error', function(event) {
        var msg = event.message || 'Unknown Error';
        var file = event.filename ? event.filename.split('/').pop() : '';
        var line = event.lineno || 0;
        var col = event.colno || 0;
        var details = file ? (' at ' + file + ':' + line + ':' + col) : '';
        var stack = event.error ? event.error.stack : '';
        addLog('error', 'Exception: ' + msg + details, stack);
    });

    window.addEventListener('unhandledrejection', function(event) {
        var reason = event.reason;
        var msg = reason ? (reason.message || String(reason)) : 'Unhandled Promise Rejection';
        var stack = (reason && reason.stack) ? reason.stack : '';
        addLog('error', 'Promise Rejection: ' + msg, stack);
    });

    // 3. Intercept Console
    var originalError = console.error;
    var originalWarn = console.warn;

    console.error = function() {
        var args = Array.prototype.slice.call(arguments);
        var msg = args.map(function(arg) {
            return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
        }).join(' ');
        addLog('error', msg);
        originalError.apply(console, arguments);
    };

    console.warn = function() {
        var args = Array.prototype.slice.call(arguments);
        var msg = args.map(function(arg) {
            return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
        }).join(' ');
        addLog('warn', msg);
        originalWarn.apply(console, arguments);
    };

    // 4. Inject UI Logger Panel
    var panel, toggleBtn, logContainer;

    function createUI() {
        if (document.getElementById('debug-logger-root')) return;

        // Container element
        var root = document.createElement('div');
        root.id = 'debug-logger-root';
        root.style.cssText = 'position: fixed; bottom: 15px; right: 15px; z-index: 999999; font-family: "Open Sans", system-ui, sans-serif;';

        // Toggle Button
        toggleBtn = document.createElement('button');
        toggleBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>';
        toggleBtn.style.cssText = 'width: 42px; height: 42px; border-radius: 50%; background: rgba(30, 30, 30, 0.85); color: #ccc; border: 1px solid rgba(255,255,255,0.15); cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.5); backdrop-filter: blur(10px); transition: all 0.3s ease; outline: none;';
        toggleBtn.title = 'View Debug Logs';
        toggleBtn.onmouseover = function() {
            toggleBtn.style.background = 'rgba(50, 50, 50, 0.95)';
            toggleBtn.style.color = '#fff';
            toggleBtn.style.transform = 'scale(1.05)';
        };
        toggleBtn.onmouseout = function() {
            toggleBtn.style.background = 'rgba(30, 30, 30, 0.85)';
            toggleBtn.style.color = '#ccc';
            toggleBtn.style.transform = 'scale(1)';
        };
        toggleBtn.onclick = togglePanel;

        // Panel Panel
        panel = document.createElement('div');
        panel.style.cssText = 'position: fixed; bottom: 70px; right: 15px; width: 420px; max-width: calc(100vw - 30px); height: 500px; max-height: calc(100vh - 100px); background: rgba(22, 22, 22, 0.92); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; box-shadow: 0 12px 40px rgba(0,0,0,0.7); display: none; flex-direction: column; overflow: hidden; backdrop-filter: blur(20px); transition: opacity 0.25s ease, transform 0.25s ease; transform: translateY(10px); opacity: 0;';

        // Panel Header
        var header = document.createElement('div');
        header.style.cssText = 'padding: 12px 16px; background: rgba(30, 30, 30, 0.5); border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: space-between;';
        
        var title = document.createElement('span');
        title.innerText = 'Debug Logs';
        title.style.cssText = 'color: #eee; font-weight: 600; font-size: 14px;';
        header.appendChild(title);

        var actions = document.createElement('div');
        actions.style.cssText = 'display: flex; gap: 8px;';

        // Copy Button
        var copyBtn = document.createElement('button');
        copyBtn.innerText = 'Copy';
        copyBtn.style.cssText = 'padding: 4px 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #ddd; font-size: 11px; cursor: pointer; transition: all 0.2s; outline: none;';
        copyBtn.onclick = function() {
            var rawLogs = getStoredLogs();
            var text = rawLogs.map(function(l) {
                return '[' + l.time + '] [' + l.type.toUpperCase() + '] ' + l.message + (l.stack ? ('\n' + l.stack) : '');
            }).join('\n');
            navigator.clipboard.writeText(text).then(function() {
                copyBtn.innerText = 'Copied!';
                setTimeout(function() { copyBtn.innerText = 'Copy'; }, 1500);
            }).catch(function() {
                alert('Failed to copy. Please copy manually.');
            });
        };
        copyBtn.onmouseover = function() { copyBtn.style.background = 'rgba(255,255,255,0.2)'; };
        copyBtn.onmouseout = function() { copyBtn.style.background = 'rgba(255,255,255,0.1)'; };
        actions.appendChild(copyBtn);

        // Clear Button
        var clearBtn = document.createElement('button');
        clearBtn.innerText = 'Clear';
        clearBtn.style.cssText = 'padding: 4px 8px; background: rgba(231, 76, 60, 0.2); border: 1px solid rgba(231, 76, 60, 0.3); border-radius: 4px; color: #e74c3c; font-size: 11px; cursor: pointer; transition: all 0.2s; outline: none;';
        clearBtn.onclick = function() {
            if (confirm('Clear all stored debug logs?')) {
                saveLogs([]);
                updateUI();
            }
        };
        clearBtn.onmouseover = function() { clearBtn.style.background = 'rgba(231, 76, 60, 0.35)'; };
        clearBtn.onmouseout = function() { clearBtn.style.background = 'rgba(231, 76, 60, 0.2)'; };
        actions.appendChild(clearBtn);

        // Trigger Test Error Button (Handy for debugging)
        var testBtn = document.createElement('button');
        testBtn.innerText = 'Test Error';
        testBtn.style.cssText = 'padding: 4px 8px; background: rgba(243, 156, 18, 0.15); border: 1px solid rgba(243, 156, 18, 0.3); border-radius: 4px; color: #f39c12; font-size: 11px; cursor: pointer; transition: all 0.2s; outline: none;';
        testBtn.onclick = function() {
            console.error("Test error triggered: This is a diagnostic error message.");
        };
        testBtn.onmouseover = function() { testBtn.style.background = 'rgba(243, 156, 18, 0.3)'; };
        testBtn.onmouseout = function() { testBtn.style.background = 'rgba(243, 156, 18, 0.15)'; };
        actions.appendChild(testBtn);

        header.appendChild(actions);
        panel.appendChild(header);

        // Log Container
        logContainer = document.createElement('div');
        logContainer.style.cssText = 'flex: 1; padding: 12px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; background: rgba(18, 18, 18, 0.6);';
        panel.appendChild(logContainer);

        root.appendChild(panel);
        root.appendChild(toggleBtn);
        document.body.appendChild(root);

        updateUI();
    }

    function togglePanel() {
        if (panel.style.display === 'none' || panel.style.display === '') {
            panel.style.display = 'flex';
            setTimeout(function() {
                panel.style.transform = 'translateY(0)';
                panel.style.opacity = '1';
            }, 10);
            toggleBtn.style.background = 'rgba(255,255,255,0.1)';
            toggleBtn.style.color = '#fff';
            // Scroll to bottom
            logContainer.scrollTop = logContainer.scrollHeight;
        } else {
            panel.style.transform = 'translateY(10px)';
            panel.style.opacity = '0';
            setTimeout(function() {
                panel.style.display = 'none';
            }, 250);
            toggleBtn.style.background = 'rgba(30, 30, 30, 0.85)';
            toggleBtn.style.color = '#ccc';
        }
    }

    function updateUI() {
        if (!logContainer) return;
        
        logContainer.innerHTML = '';
        var logs = getStoredLogs();

        if (logs.length === 0) {
            var empty = document.createElement('div');
            empty.innerText = 'No logs recorded.';
            empty.style.cssText = 'color: #666; font-size: 12px; text-align: center; padding-top: 40px; font-style: italic;';
            logContainer.appendChild(empty);
            
            // Reset button indicator
            toggleBtn.style.borderColor = 'rgba(255,255,255,0.15)';
            return;
        }

        // Highlight button if there are errors
        var hasErrors = logs.some(function(l) { return l.type === 'error'; });
        if (hasErrors) {
            toggleBtn.style.borderColor = '#e74c3c';
        } else {
            toggleBtn.style.borderColor = 'rgba(255,255,255,0.15)';
        }

        logs.forEach(function(l) {
            var item = document.createElement('div');
            item.style.cssText = 'padding: 8px 10px; border-radius: 6px; font-size: 11px; line-height: 1.4; word-break: break-all; font-family: monospace; border: 1px solid;';
            
            var meta = document.createElement('div');
            meta.style.cssText = 'font-weight: bold; margin-bottom: 3px; font-size: 9px; opacity: 0.8; display: flex; justify-content: space-between;';
            
            var timeSpan = document.createElement('span');
            timeSpan.innerText = l.time;
            meta.appendChild(timeSpan);
            
            var typeSpan = document.createElement('span');
            typeSpan.innerText = l.type.toUpperCase();
            meta.appendChild(typeSpan);
            item.appendChild(meta);

            var contentSpan = document.createElement('div');
            contentSpan.innerText = l.message;
            item.appendChild(contentSpan);

            if (l.stack) {
                var stackDiv = document.createElement('pre');
                stackDiv.innerText = l.stack;
                stackDiv.style.cssText = 'margin-top: 5px; padding-top: 5px; border-top: 1px solid rgba(255,255,255,0.05); font-size: 9px; color: #888; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; max-height: 120px;';
                item.appendChild(stackDiv);
            }

            if (l.type === 'error') {
                item.style.backgroundColor = 'rgba(231, 76, 60, 0.1)';
                item.style.borderColor = 'rgba(231, 76, 60, 0.25)';
                item.style.color = '#ff8a80';
            } else if (l.type === 'warn') {
                item.style.backgroundColor = 'rgba(243, 156, 18, 0.08)';
                item.style.borderColor = 'rgba(243, 156, 18, 0.2)';
                item.style.color = '#ffe082';
            } else {
                item.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                item.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                item.style.color = '#e0e0e0';
            }

            logContainer.appendChild(item);
        });

        // Auto scroll to bottom
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    // 5. Initialize UI when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createUI);
    } else {
        createUI();
    }
})();
