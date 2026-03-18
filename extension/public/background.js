// Register message listener FIRST, before anything else
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GOOGLE_SIGN_IN') {
    chrome.identity.launchWebAuthFlow({ url: message.oauthUrl, interactive: true })
      .then((responseUrl) => {
        if (!responseUrl) {
          sendResponse({ error: 'Sign-in was cancelled' });
          return;
        }

        const url = new URL(responseUrl);
        const hashParams = new URLSearchParams(url.hash.substring(1));
        const access_token = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token');

        if (!access_token || !refresh_token) {
          sendResponse({ error: 'No tokens received' });
          return;
        }

        sendResponse({ access_token, refresh_token });
      })
      .catch((err) => {
        sendResponse({ error: err.message || 'Google sign-in failed' });
      });

    return true; // keep channel open for async response
  }

  if (message.type === 'GET_REDIRECT_URL') {
    sendResponse({ redirectUrl: chrome.identity.getRedirectURL() });
    return false;
  }

  if (message.type === 'GET_EXISTING_SESSION') {
    chrome.tabs.query({ url: ['https://petek.app/*', 'https://yevgeniyo-ps.github.io/petek/*'] })
      .then((tabs) => {
        if (!tabs || tabs.length === 0) {
          sendResponse({ session: null });
          return;
        }

        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          world: 'MAIN',
          func: () => {
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
                try {
                  return JSON.parse(localStorage.getItem(key));
                } catch {
                  return null;
                }
              }
            }
            return null;
          },
        }).then((results) => {
          sendResponse({ session: results?.[0]?.result ?? null });
        }).catch(() => {
          sendResponse({ session: null });
        });
      })
      .catch(() => {
        sendResponse({ session: null });
      });

    return true; // async
  }
});

// Side panel behavior — wrapped in try/catch to avoid crashing the worker
try {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
} catch (e) {
  console.error('Failed to set side panel behavior:', e);
}
