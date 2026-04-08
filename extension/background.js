/* Ágata Transcription – Background Service Worker */

chrome.runtime.onInstalled.addListener(() => {
  console.log('Ágata Transcription extension installed');
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'upload_recording') {
    // TODO: Handle upload to Supabase
    console.log('Ágata: Upload recording request received', message.data);
    sendResponse({ success: true });
  }
  return true;
});
