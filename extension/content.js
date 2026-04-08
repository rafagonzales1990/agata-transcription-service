/* ========================================
   Ágata Transcription – Content Script
   Injected on Meet, Zoom, Teams pages
   ======================================== */

(function () {
  'use strict';

  // Detect platform
  const url = window.location.href;
  let AGATA_PLATFORM = 'unknown';
  if (url.includes('meet.google.com')) AGATA_PLATFORM = 'meet';
  else if (url.includes('zoom.us')) AGATA_PLATFORM = 'zoom';
  else if (url.includes('teams.microsoft.com') || url.includes('teams.live.com')) AGATA_PLATFORM = 'teams';

  let isRecording = false;
  let mediaRecorder = null;
  let audioChunks = [];
  let recordingStartTime = null;
  let timerInterval = null;

  // ─── Main FAB ───
  function injectFAB() {
    if (document.getElementById('agata-fab-container')) return;

    const container = document.createElement('div');
    container.id = 'agata-fab-container';
    container.innerHTML = `
      <div id="agata-fab" title="Ágata Transcription – Gravar reunião">
        <div class="agata-fab-icon">
          <svg width="18" height="18" viewBox="0 0 100 100" fill="none">
            <path d="M50 8C62 8 88 30 88 52C88 74 68 92 50 92C32 92 12 74 12 52C12 30 38 8 50 8Z" fill="#10B981"/>
            <path d="M50 18C58 18 76 34 76 52C76 68 62 82 50 82C38 82 24 68 24 52C24 34 42 18 50 18Z" fill="#059669"/>
          </svg>
        </div>
        <span class="agata-fab-label">Gravar reunião</span>
      </div>
    `;
    document.body.appendChild(container);

    document.getElementById('agata-fab').addEventListener('click', toggleRecording);
  }

  // ─── Notify Button ───
  function injectNotifyButton() {
    if (document.getElementById('agata-notify-btn')) return;

    const notifyBtn = document.createElement('div');
    notifyBtn.id = 'agata-notify-btn';
    notifyBtn.innerHTML = `
      <div id="agata-notify-fab">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <span>Avisar sobre gravação</span>
      </div>
    `;
    document.body.appendChild(notifyBtn);
    document.getElementById('agata-notify-fab').addEventListener('click', handleNotify);
  }

  function removeNotifyButton() {
    const btn = document.getElementById('agata-notify-btn');
    if (btn) btn.remove();
  }

  // ─── Notify Handler ───
  function handleNotify() {
    const message = '🔴 Esta reunião está sendo gravada e transcrita com o Ágata Transcription para fins de documentação.';
    let sent = false;

    if (AGATA_PLATFORM === 'meet') {
      const chatInput = document.querySelector('[aria-label="Enviar uma mensagem para todos"]')
        || document.querySelector('[data-message-text]')
        || document.querySelector('textarea[placeholder]');

      if (chatInput) {
        chatInput.focus();
        const el = chatInput;
        el.value = message;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        setTimeout(() => {
          el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
        }, 100);
        sent = true;
      }
    }

    if (AGATA_PLATFORM === 'zoom') {
      const chatInput = document.querySelector('.chat-box__chat-textarea')
        || document.querySelector('[placeholder*="Enviar mensagem"]')
        || document.querySelector('[placeholder*="Type message"]');

      if (chatInput) {
        chatInput.value = message;
        chatInput.dispatchEvent(new Event('input', { bubbles: true }));
        setTimeout(() => {
          chatInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
        }, 100);
        sent = true;
      }
    }

    if (AGATA_PLATFORM === 'teams') {
      const chatInput = document.querySelector('[data-tid="ckeditor-replyTextArea"]')
        || document.querySelector('[role="textbox"][contenteditable="true"]');

      if (chatInput) {
        chatInput.focus();
        chatInput.textContent = message;
        chatInput.dispatchEvent(new Event('input', { bubbles: true }));
        setTimeout(() => {
          chatInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
        }, 100);
        sent = true;
      }
    }

    if (!sent) {
      navigator.clipboard.writeText(message).then(() => {
        showNotifyFeedback('Mensagem copiada! Cole no chat da reunião (Ctrl+V)');
      }).catch(() => {
        showNotifyFeedback('Não foi possível acessar o chat. Copie manualmente.');
      });
      return;
    }

    showNotifyFeedback('Participantes avisados sobre a gravação ✓');

    setTimeout(() => {
      removeNotifyButton();
    }, 3000);
  }

  function showNotifyFeedback(msg) {
    const fab = document.getElementById('agata-notify-fab');
    if (!fab) return;
    const original = fab.innerHTML;
    fab.innerHTML = `<span style="font-size:11px">${msg}</span>`;
    setTimeout(() => { fab.innerHTML = original; }, 4000);
  }

  // ─── Recording ───
  function toggleRecording() {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      audioChunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start(1000);
      isRecording = true;
      recordingStartTime = Date.now();
      updateFABState();
      injectNotifyButton();
      startTimer();
    } catch (err) {
      console.error('Ágata: Failed to start recording', err);
      alert('Não foi possível acessar o microfone. Verifique as permissões do navegador.');
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    isRecording = false;
    stopTimer();
    updateFABState();
    removeNotifyButton();

    // TODO: Upload audioChunks to Supabase
    const blob = new Blob(audioChunks, { type: 'audio/webm' });
    console.log('Ágata: Recording stopped, blob size:', blob.size);
  }

  function updateFABState() {
    const fab = document.getElementById('agata-fab');
    if (!fab) return;

    if (isRecording) {
      fab.classList.add('agata-recording');
      fab.querySelector('.agata-fab-label').textContent = 'Parar gravação';
    } else {
      fab.classList.remove('agata-recording');
      fab.querySelector('.agata-fab-label').textContent = 'Gravar reunião';
    }
  }

  function startTimer() {
    const timerEl = document.createElement('div');
    timerEl.id = 'agata-timer';
    timerEl.innerHTML = '<span class="agata-rec-dot"></span><span id="agata-timer-text">00:00</span>';
    document.body.appendChild(timerEl);

    timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
      const min = String(Math.floor(elapsed / 60)).padStart(2, '0');
      const sec = String(elapsed % 60).padStart(2, '0');
      const text = document.getElementById('agata-timer-text');
      if (text) text.textContent = `${min}:${sec}`;
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    const timer = document.getElementById('agata-timer');
    if (timer) timer.remove();
  }

  // ─── Init ───
  if (AGATA_PLATFORM !== 'unknown') {
    // Wait for page to stabilize then inject FAB
    setTimeout(injectFAB, 2000);
  }
})();
