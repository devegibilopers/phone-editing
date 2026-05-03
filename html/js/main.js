// ===== QB-PHONE MAIN.JS =====
const Phone = {
  isOpen: false,
  isLocked: true,
  currentApp: null,
  playerData: {},
  settings: { theme: 0, wallpaper: 0, notifications: true, ringtone: 0, notifSound: 0 },
  badgeCounts: { messages: 0 },
  callState: null,
  callTimer: null,
  callSeconds: 0,

  themes: [
    { name: 'Midnight', primary: '#1c1c1e', accent: '#0a84ff', bg: '#000000' },
    { name: 'Rose Gold', primary: '#2c2c2e', accent: '#ff6b6b', bg: '#1a1a1a' },
    { name: 'Forest', primary: '#1c2c1e', accent: '#30d158', bg: '#0d1f0f' },
    { name: 'Ocean', primary: '#1c1e2c', accent: '#64d2ff', bg: '#0a0f1a' },
    { name: 'Sunset', primary: '#2c1e1c', accent: '#ff9f0a', bg: '#1a0f0a' },
    { name: 'Purple', primary: '#1e1c2c', accent: '#bf5af2', bg: '#0f0a1a' },
  ],

  wallpapers: [
    'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
    'linear-gradient(135deg, #0d1117, #161b22, #21262d)',
    'linear-gradient(135deg, #1a0533, #2d1b69, #11998e)',
    'linear-gradient(135deg, #200122, #6f0000)',
    'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
    'linear-gradient(135deg, #134e5e, #71b280)',
  ],

  // ===== ZİL SESLERİ =====
  ringtones: [
    { name: '🎵 Klasik', file: 'sounds/ringtone_classic.mp3' },
    { name: '🎶 Modern', file: 'sounds/ringtone_modern.mp3' },
    { name: '📳 Titreşim', file: null },
    { name: '🔔 Zil', file: 'sounds/ringtone_bell.mp3' },
    { name: '🎹 Piyano', file: 'sounds/ringtone_piano.mp3' },
  ],

  // ===== BİLDİRİM SESLERİ =====
  notifSounds: [
    { name: '💬 Ping', file: 'sounds/notif_ping.mp3' },
    { name: '✉️ Mesaj', file: 'sounds/notif_message.mp3' },
    { name: '🔔 Tık', file: 'sounds/notif_tick.mp3' },
    { name: '🎵 Melodi', file: 'sounds/notif_melody.mp3' },
    { name: '🔕 Sessiz', file: null },
  ],

  _ringtoneAudio: null,

  // Zil sesini çal (döngülü)
  playRingtone() {
    this.stopRingtone();
    const tone = this.ringtones[this.settings.ringtone || 0];
    if (!tone || !tone.file) return; // Titreşim seçiliyse ses çalma
    const audio = new Audio(tone.file);
    audio.loop = true;
    audio.volume = 0.8;
    audio.play().catch(() => {});
    this._ringtoneAudio = audio;
  },

  // Zil sesini durdur
  stopRingtone() {
    if (this._ringtoneAudio) {
      this._ringtoneAudio.pause();
      this._ringtoneAudio.currentTime = 0;
      this._ringtoneAudio = null;
    }
  },

  // Bildirim sesi çal (tek seferlik)
  playNotifSound() {
    const sound = this.notifSounds[this.settings.notifSound || 0];
    if (!sound || !sound.file) return; // Sessiz seçiliyse çalma
    const audio = new Audio(sound.file);
    audio.volume = 0.6;
    audio.play().catch(() => {});
  },

  open(data) {
    this.isOpen = true;
    this.playerData = data.playerData || {};
    document.getElementById('phone-container').classList.add('visible');
    this.applySettings();
    this.updateClock();
    this.showLockScreen();
  },

  close() {
    this.isOpen = false;
    this.stopRingtone();
    const container = document.getElementById('phone-container');
    container.style.animation = 'none';
    container.style.transform = 'scale(0.85) translateY(30px)';
    container.style.opacity = '0';
    container.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      container.classList.remove('visible');
      container.style = '';
      this.goHome();
      this.isLocked = true;
    }, 300);
  },

  applySettings() {
    const theme = this.themes[this.settings.theme] || this.themes[0];
    const root = document.documentElement;
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--bg', theme.bg);

    const wallpaper = this.wallpapers[this.settings.wallpaper] || this.wallpapers[0];
    document.getElementById('wallpaper').style.background = wallpaper;
  },

  showLockScreen() {
    document.getElementById('lock-screen').style.display = 'flex';
    document.getElementById('home-screen').classList.remove('active');
    document.getElementById('app-view').classList.remove('active');
    this.isLocked = true;
    this.updateLockDate();
  },

  unlock() {
    document.getElementById('lock-screen').style.display = 'none';
    document.getElementById('home-screen').classList.add('active');
    this.isLocked = false;
  },

  updateClock() {
    const update = () => {
      if (!this.isOpen) return;
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${h}:${m}`;
      document.getElementById('status-time').textContent = timeStr;
      document.getElementById('lock-time').textContent = timeStr;
    };
    update();
    setInterval(update, 10000);
  },

  updateLockDate() {
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const months = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
    const now = new Date();
    document.getElementById('lock-date').textContent =
      `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
  },

  showNotification(data) {
    if (!this.settings.notifications) return;

    // Bildirim sesi çal
    this.playNotifSound();

    // Lock screen notification
    if (this.isLocked) {
      const lockNotifs = document.getElementById('lock-notifications');
      const notif = document.createElement('div');
      notif.className = 'lock-notif';
      notif.innerHTML = `
        <div class="lock-notif-icon">${data.icon || '📱'}</div>
        <div class="lock-notif-text">
          <div class="lock-notif-title">${escHtml(data.title)}</div>
          <div class="lock-notif-msg">${escHtml(data.message)}</div>
        </div>
        <div class="lock-notif-time">Şimdi</div>
      `;
      lockNotifs.insertBefore(notif, lockNotifs.firstChild);
      if (lockNotifs.children.length > 3) lockNotifs.removeChild(lockNotifs.lastChild);
    }

    // Toast notification
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <div class="toast-icon">${data.icon || '📱'}</div>
      <div class="toast-text">
        <div class="toast-title">${escHtml(data.title)}</div>
        <div class="toast-msg">${escHtml(data.message)}</div>
      </div>
      <div class="toast-time">Şimdi</div>
    `;
    const container = document.getElementById('notification-toast');
    container.appendChild(toast);

    // Update badge
    if (data.app === 'messages') {
      this.badgeCounts.messages++;
      const badge = document.getElementById('msg-badge');
      badge.textContent = this.badgeCounts.messages;
      badge.style.display = 'flex';
    }

    setTimeout(() => {
      toast.classList.add('hiding');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  // Call UI
  showIncomingCall(data) {
    this.callState = { ...data, status: 'incoming' };
    const screen = document.getElementById('call-screen');
    document.getElementById('call-avatar').textContent = '👤';
    document.getElementById('call-name').textContent = data.callerName || data.callerNumber;
    document.getElementById('call-status').textContent = 'Arıyor...';
    document.getElementById('call-timer').style.display = 'none';
    document.getElementById('call-actions').innerHTML = `
      <button class="call-btn call-btn-decline" onclick="Phone.declineCall()">📵</button>
      <button class="call-btn call-btn-answer" onclick="Phone.answerCall()">📞</button>
    `;
    screen.classList.add('active');
    // Zil sesini başlat
    this.playRingtone();
  },

  answerCall() {
    if (!this.callState) return;
    // Zil sesini durdur
    this.stopRingtone();
    NUI.post('answerCall', { callId: this.callState.callId });
    document.getElementById('call-status').textContent = 'Bağlandı';
    document.getElementById('call-timer').style.display = 'block';
    document.getElementById('call-actions').innerHTML = `
      <button class="call-btn call-btn-mute" onclick="this.classList.toggle('active')" title="Sessiz">🔇</button>
      <button class="call-btn call-btn-end" onclick="Phone.endCall()">📵</button>
      <button class="call-btn call-btn-speaker" title="Hoparlör">🔊</button>
    `;
    this.callSeconds = 0;
    this.callTimer = setInterval(() => {
      this.callSeconds++;
      const m = String(Math.floor(this.callSeconds / 60)).padStart(2,'0');
      const s = String(this.callSeconds % 60).padStart(2,'0');
      document.getElementById('call-timer').textContent = `${m}:${s}`;
    }, 1000);
    this.callState.status = 'active';
  },

  declineCall() {
    this.stopRingtone();
    NUI.post('declineCall', { callId: this.callState?.callId });
    this.endCallUI();
  },

  endCall() {
    this.stopRingtone();
    NUI.post('endCall', { callId: this.callState?.callId });
    this.endCallUI();
  },

  endCallUI() {
    this.stopRingtone();
    clearInterval(this.callTimer);
    this.callTimer = null;
    this.callState = null;
    document.getElementById('call-screen').classList.remove('active');
  },

  // Outgoing call UI
  showOutgoingCall(name, number) {
    this.callState = { status: 'outgoing', callerName: name };
    document.getElementById('call-avatar').textContent = '👤';
    document.getElementById('call-name').textContent = name || number;
    document.getElementById('call-status').textContent = 'Aranıyor...';
    document.getElementById('call-timer').style.display = 'none';
    document.getElementById('call-actions').innerHTML = `
      <button class="call-btn call-btn-end" onclick="Phone.endCall()">📵</button>
    `;
    document.getElementById('call-screen').classList.add('active');
  }
};

// ===== HELPERS =====
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const then = new Date(dateStr);
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'Şimdi';
  if (diff < 3600) return Math.floor(diff/60) + 'd önce';
  if (diff < 86400) return Math.floor(diff/3600) + 's önce';
  return Math.floor(diff/86400) + 'g önce';
}

function formatMoney(n) {
  return '$' + Number(n||0).toLocaleString('tr-TR');
}

// ===== NAVIGATION =====
function openApp(appName) {
  Phone.currentApp = appName;
  document.getElementById('home-screen').classList.remove('active');
  document.getElementById('app-view').classList.add('active');
  const actionBtn = document.getElementById('app-header-action');
  actionBtn.style.display = 'none';
  actionBtn.onclick = null;
  Apps.load(appName);
}

function goHome() {
  Phone.currentApp = null;
  document.getElementById('app-view').classList.remove('active');
  document.getElementById('home-screen').classList.add('active');
  Phone.badgeCounts.messages = 0;
  document.getElementById('msg-badge').style.display = 'none';
}

// ===== MODAL =====
function showModal(title, content) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-content').innerHTML = content;
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

document.getElementById('modal-overlay').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// ===== LOCK SCREEN SWIPE =====
let touchStartY = 0;
document.getElementById('lock-screen').addEventListener('touchstart', e => {
  touchStartY = e.touches[0].clientY;
});
document.getElementById('lock-screen').addEventListener('touchend', e => {
  const diff = touchStartY - e.changedTouches[0].clientY;
  if (diff > 50) Phone.unlock();
});
document.getElementById('lock-screen').addEventListener('click', () => Phone.unlock());

// ===== NUI MESSAGE HANDLER =====
window.addEventListener('message', function(event) {
  const data = event.data;
  if (!data || !data.action) return;

  switch(data.action) {
    case 'openPhone':
      Phone.open(data);
      break;
    case 'closePhone':
      Phone.close();
      break;
    case 'notification':
      Phone.showNotification(data);
      break;
    case 'incomingCall':
      Phone.showIncomingCall(data);
      break;
    case 'callAnswered':
      if (Phone.callState && Phone.callState.status === 'outgoing') {
        Phone.answerCall();
      }
      break;
    case 'callDeclined':
      Phone.stopRingtone();
      Phone.endCallUI();
      break;
    case 'callEnded':
      Phone.stopRingtone();
      Phone.endCallUI();
      break;
    case 'settingsUpdated':
      Phone.settings = { ...Phone.settings, ...data.settings };
      Phone.applySettings();
      break;
    case 'refreshSocial':
      if (Phone.currentApp === 'social') Apps.load('social');
      break;
  }
});

// ESC key to close
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    NUI.post('closePhone', {});
  }
});

// Dev mode
if (!window.invokeNative) {
  setTimeout(() => {
    Phone.open({
      playerData: {
        name: 'Ahmet Yılmaz',
        number: '555-123-456',
        job: 'Polis',
        money: 25000,
        cash: 3500
      }
    });
  }, 500);
}
