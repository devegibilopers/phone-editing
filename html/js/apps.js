// ===== APPS.JS - All App UIs (Mesaj silme desteği eklendi) =====

const Apps = {
  load(appName) {
    const titles = {
      phone: '📞 Telefon', messages: '💬 Mesajlar', contacts: '👤 Rehber',
      social: '🐦 Squeak', bank: '🏦 Banka', maps: '🗺️ Haritalar',
      music: '🎵 Müzik', camera: '📷 Galeri', jobs: '💼 WorkHub',
      settings: '⚙️ Ayarlar', garage: '🚗 Vale'
    };
    document.getElementById('app-header-title').textContent = titles[appName] || appName;
    document.getElementById('app-content').innerHTML = `
      <div class="empty-state"><div class="empty-icon">⏳</div><p>Yükleniyor...</p></div>`;
    this[appName]?.();
  },

  // ===== PHONE =====
  phone() {
    NUI.callback('getCallHistory').then(calls => {
      const btn = document.getElementById('app-header-action');
      btn.textContent = '⌨️ Tuş Takımı';
      btn.style.display = 'block';
      btn.onclick = () => this.showDialer();

      let html = '<div class="app-padded">';
      if (!calls || !calls.length) {
        html += `<div class="empty-state"><div class="empty-icon">📞</div><p>Arama geçmişi yok</p></div>`;
      } else {
        html += '<div class="section-header">Son Aramalar</div>';
        calls.forEach(c => {
          const icon = c.direction === 'outgoing' ? '↗️' : c.status === 'missed' ? '↙️' : '↙️';
          const color = c.status === 'missed' ? 'var(--danger)' : c.direction === 'outgoing' ? 'var(--success)' : 'var(--accent)';
          const name = c.contact_name || (c.direction === 'outgoing' ? c.receiver_number : c.caller_number);
          const duration = c.duration ? Math.floor(c.duration/60) + 'd ' + (c.duration%60) + 's' : '';
          html += `
            <div class="list-item" onclick="Apps.makeCall('${escHtml(name)}', '${c.direction === 'outgoing' ? c.receiver_number : c.caller_number}')">
              <div class="list-avatar" style="background:transparent;font-size:28px">${icon}</div>
              <div class="list-info">
                <div class="list-name" style="color:${c.status==='missed'?'var(--danger)':'var(--text)'}">${escHtml(name)}</div>
                <div class="list-sub">${c.status === 'missed' ? 'Cevapsız' : duration}</div>
              </div>
              <div class="list-right">
                <span>${timeAgo(c.created_at)}</span>
                <span style="font-size:18px;cursor:pointer" onclick="event.stopPropagation();Apps.makeCall('${escHtml(name)}','${c.direction==='outgoing'?c.receiver_number:c.caller_number}')">📞</span>
              </div>
            </div>`;
        });
      }
      html += '</div>';
      document.getElementById('app-content').innerHTML = html;
    });
  },

  showDialer() {
    let dialNumber = '';
    showModal('Numarayı Ara', `
      <div style="padding:0 20px 20px">
        <div id="dial-display" style="font-size:32px;font-weight:300;color:var(--text);text-align:center;letter-spacing:4px;min-height:50px;margin-bottom:20px">
          <span style="color:var(--text3)">Numara gir</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">
          ${[1,2,3,4,5,6,7,8,9,'*',0,'#'].map(n => `
            <button class="btn btn-ghost" style="font-size:24px;font-weight:300;" onclick="dialPress('${n}')">${n}</button>
          `).join('')}
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-ghost" style="flex:1" onclick="dialBackspace()">⌫</button>
          <button class="btn btn-success" style="flex:2" onclick="dialCall()">📞 Ara</button>
        </div>
      </div>
    `);
    window.dialPress = (n) => {
      dialNumber += n;
      const d = document.getElementById('dial-display');
      if (d) d.innerHTML = `<span>${dialNumber}</span>`;
    };
    window.dialBackspace = () => {
      dialNumber = dialNumber.slice(0,-1);
      const d = document.getElementById('dial-display');
      if (d) d.innerHTML = dialNumber ? `<span>${dialNumber}</span>` : `<span style="color:var(--text3)">Numara gir</span>`;
    };
    window.dialCall = () => {
      if (dialNumber) {
        closeModal();
        this.makeCall(dialNumber, dialNumber);
      }
    };
  },

  makeCall(name, number) {
    Phone.showOutgoingCall(name, number);
    NUI.post('makeCall', { number });
  },

  // ===== MESSAGES (silme eklendi) =====
  messages() {
    NUI.callback('getMessages').then(msgs => {
      const btn = document.getElementById('app-header-action');
      btn.textContent = '✏️ Yeni';
      btn.style.display = 'block';
      btn.onclick = () => this.newMessage();

      if (!msgs || !msgs.length) {
        document.getElementById('app-content').innerHTML = `
          <div class="empty-state"><div class="empty-icon">💬</div><p>Henüz mesaj yok</p></div>`;
        return;
      }

      // Group by conversation
      const convMap = {};
      msgs.forEach(m => {
        const key = m.sender_number === Phone.playerData?.number ? m.receiver_number : m.sender_number;
        if (!convMap[key]) convMap[key] = m;
      });

      let html = '<div class="app-padded">';
      Object.values(convMap).forEach(m => {
        const number = m.sender_number === Phone.playerData?.number ? m.receiver_number : m.sender_number;
        const name = m.sender_name || number;
        const initials = name.charAt(0).toUpperCase();
        html += `
          <div class="list-item" 
               onclick="Apps.openConversation('${escHtml(number)}','${escHtml(name)}')"
               oncontextmenu="event.preventDefault(); Apps.deleteConversation('${escHtml(number)}')"
               style="cursor: pointer;">
            <div class="list-avatar">${initials}</div>
            <div class="list-info">
              <div class="list-name">${escHtml(name)}</div>
              <div class="list-sub">${escHtml((m.message||'').substring(0,40))}</div>
            </div>
            <div class="list-right">
              <span>${timeAgo(m.created_at)}</span>
              ${!m.is_read ? '<span style="width:10px;height:10px;border-radius:50%;background:var(--accent);display:inline-block"></span>' : ''}
            </div>
          </div>`;
      });
      html += '</div>';
      document.getElementById('app-content').innerHTML = html;
    });
  },

  // Konuşma silme
 
deleteConversation(number) {
    showModal('', `
        <div class="delete-modal">
            <div class="delete-icon">🗑️</div>
            <div class="delete-title">Konuşmayı Sil</div>
            <div class="delete-message">Bu konuşma kalıcı olarak silinecek. Geri alamazsınız.</div>
            <div class="delete-buttons">
                <button class="btn delete-cancel" onclick="closeModal()">İptal</button>
                <button class="btn delete-confirm" onclick="Apps.confirmDeleteConversation('${number}')">Evet, Sil</button>
            </div>
        </div>
    `);
},

confirmDeleteConversation(number) {
    closeModal();
    NUI.callback('deleteConversation', { number }).then(() => {
        this.messages(); // Listeyi yenile
        if (typeof Phone !== 'undefined' && Phone.showNotification) {
            Phone.showNotification({ icon: '🗑️', title: 'Silindi', message: 'Konuşma silindi' });
        }
    }).catch(err => {
        console.warn('deleteConversation hatası:', err);
        Phone.showNotification({ icon: '❌', title: 'Hata', message: 'Silme başarısız' });
    });
},

  // Tek mesaj silme - onay modalı ile (sadece gelen mesajlar için)
deleteMessage(id, isMine) {
    if (isMine) {
        Phone.showNotification({ icon: '⚠️', title: 'Uyarı', message: 'Sadece başkasının mesajlarını silebilirsiniz.' });
        return;
    }
    showModal('', `
        <div class="delete-modal">
            <div class="delete-icon">🗑️</div>
            <div class="delete-title">Mesajı Sil</div>
            <div class="delete-message">Bu mesajı silmek istediğinize emin misiniz?</div>
            <div class="delete-buttons">
                <button class="btn delete-cancel" onclick="closeModal()">İptal</button>
                <button class="btn delete-confirm" onclick="Apps.confirmDeleteMessage(${id})">Evet, Sil</button>
            </div>
        </div>
    `);
},

confirmDeleteMessage(id) {
    closeModal();
    NUI.callback('deleteMessage', { id }).then(() => {
        // Mevcut konuşmayı yeniden aç
        if (Phone.currentConversation) {
            this.openConversation(Phone.currentConversation.number, Phone.currentConversation.name);
        }
        Phone.showNotification({ icon: '🗑️', title: 'Silindi', message: 'Mesaj silindi' });
    }).catch(err => {
        console.warn('deleteMessage hatası:', err);
        Phone.showNotification({ icon: '❌', title: 'Hata', message: 'Silme başarısız' });
    });
},

  openConversation(number, name) {
    document.getElementById('app-header-title').textContent = name || number;
    Phone.currentConversation = { number, name };

    const btn = document.getElementById('app-header-action');
    btn.textContent = '📞';
    btn.style.display = 'block';
    btn.onclick = () => Apps.makeCall(name, number);

    NUI.callback('getConversation', { number }).then(msgs => {
      let html = '<div style="padding:16px 0">';
      if (!msgs || !msgs.length) {
        html += `<div class="empty-state"><div class="empty-icon">💬</div><p>Sohbete başla!</p></div>`;
      } else {
        msgs.forEach(m => {
          const isMine = m.sender_number !== number;
          html += `
            <div class="msg-bubble ${isMine?'sent':'received'}" 
                 oncontextmenu="event.preventDefault(); Apps.deleteMessage(${m.id}, ${isMine})"
                 style="cursor: pointer;">
              ${escHtml(m.message)}
            </div>
            <div class="msg-time" style="text-align:${isMine?'right':'left'};padding:${isMine?'0 16px 8px':'0 16px 8px'}">${timeAgo(m.created_at)}</div>`;
        });
      }
      html += `</div>
        <div style="padding:12px 16px 24px;border-top:1px solid var(--border);background:rgba(0,0,0,0.3);position:sticky;bottom:0;backdrop-filter:blur(20px)">
          <div style="display:flex;gap:10px">
            <input class="styled" id="msg-input" placeholder="Mesaj yaz..." style="flex:1" onkeydown="if(event.key==='Enter')Apps.sendMsg()">
            <button class="btn btn-primary btn-sm" onclick="Apps.sendMsg()">Gönder</button>
          </div>
        </div>`;
      document.getElementById('app-content').innerHTML = html;
      document.getElementById('app-content').scrollTop = 99999;
    });
  },

  sendMsg() {
    const input = document.getElementById('msg-input');
    const msg = input?.value?.trim();
    if (!msg || !Phone.currentConversation) return;
    input.value = '';
    NUI.post('sendMessage', {
      number: Phone.currentConversation.number,
      message: msg,
      contactName: Phone.currentConversation.name
    }).then(() => {
      this.openConversation(Phone.currentConversation.number, Phone.currentConversation.name);
    });
  },

  newMessage() {
    showModal('Yeni Mesaj', `
      <div style="padding:0 20px 20px;display:flex;flex-direction:column;gap:12px">
        <div class="input-group">
          <label>Numara</label>
          <input class="styled" id="new-msg-number" placeholder="555-123-456">
        </div>
        <div class="input-group">
          <label>Mesaj</label>
          <textarea class="styled" id="new-msg-text" rows="4" placeholder="Mesajınız..."></textarea>
        </div>
        <button class="btn btn-primary" onclick="Apps.sendNewMessage()">📤 Gönder</button>
      </div>
    `);
  },

  sendNewMessage() {
    const number = document.getElementById('new-msg-number')?.value?.trim();
    const message = document.getElementById('new-msg-text')?.value?.trim();
    if (!number || !message) return;
    NUI.post('sendMessage', { number, message });
    closeModal();
    setTimeout(() => this.messages(), 500);
  },

  // ===== CONTACTS =====
  contacts() {
    NUI.callback('getContacts').then(contacts => {
      const btn = document.getElementById('app-header-action');
      btn.textContent = '+ Ekle';
      btn.style.display = 'block';
      btn.onclick = () => this.addContact();

      if (!contacts || !contacts.length) {
        document.getElementById('app-content').innerHTML = `
          <div class="empty-state"><div class="empty-icon">👤</div><p>Rehberiniz boş</p></div>`;
        return;
      }

      let html = '<div class="app-padded">';
      let lastLetter = '';
      contacts.sort((a,b) => a.name.localeCompare(b.name, 'tr')).forEach(c => {
        const letter = c.name.charAt(0).toUpperCase();
        if (letter !== lastLetter) {
          lastLetter = letter;
          html += `<div class="section-header">${letter}</div>`;
        }
        const initials = c.name.charAt(0).toUpperCase();
        html += `
          <div class="list-item" onclick="Apps.viewContact(${c.id}, '${escHtml(c.name)}', '${escHtml(c.number)}')">
            <div class="list-avatar">${initials}</div>
            <div class="list-info">
              <div class="list-name">${escHtml(c.name)}</div>
              <div class="list-sub">${escHtml(c.number)}</div>
            </div>
          </div>`;
      });
      html += '</div>';
      document.getElementById('app-content').innerHTML = html;
    });
  },

  viewContact(id, name, number) {
    showModal(name, `
      <div style="padding:0 20px 20px">
        <div style="text-align:center;margin-bottom:24px">
          <div style="width:80px;height:80px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:700;margin:0 auto 12px">${name.charAt(0)}</div>
          <div style="font-size:20px;color:var(--text);font-weight:500">${escHtml(name)}</div>
          <div style="font-size:15px;color:var(--text2);margin-top:4px">${escHtml(number)}</div>
        </div>
        <div style="display:flex;gap:10px;margin-bottom:16px">
          <button class="btn btn-success" style="flex:1" onclick="closeModal();Apps.makeCall('${escHtml(name)}','${escHtml(number)}')">📞 Ara</button>
          <button class="btn btn-primary" style="flex:1" onclick="closeModal();Apps.openConversation('${escHtml(number)}','${escHtml(name)}')">💬 Mesaj</button>
        </div>
        <button class="btn btn-danger" style="width:100%" onclick="Apps.deleteContact(${id})">🗑️ Sil</button>
      </div>
    `);
  },

  addContact() {
    showModal('Yeni Kişi', `
      <div style="padding:0 20px 20px;display:flex;flex-direction:column;gap:12px">
        <div class="input-group"><label>Ad Soyad</label><input class="styled" id="nc-name" placeholder="Ali Veli"></div>
        <div class="input-group"><label>Telefon Numarası</label><input class="styled" id="nc-number" placeholder="555-000-000"></div>
        <button class="btn btn-primary" onclick="Apps.saveContact()">💾 Kaydet</button>
      </div>
    `);
  },

  saveContact() {
    const name = document.getElementById('nc-name')?.value?.trim();
    const number = document.getElementById('nc-number')?.value?.trim();
    if (!name || !number) return;
    NUI.post('addContact', { name, number });
    closeModal();
    setTimeout(() => this.contacts(), 500);
  },

  deleteContact(id) {
    NUI.post('deleteContact', { id });
    closeModal();
    setTimeout(() => this.contacts(), 300);
  },

  // ===== SOCIAL MEDIA =====
  social() {
    NUI.callback('getSocialPosts').then(posts => {
      const btn = document.getElementById('app-header-action');
      btn.textContent = '✏️ Paylaş';
      btn.style.display = 'block';
      btn.onclick = () => this.newSocialPost();

      if (!posts || !posts.length) {
        document.getElementById('app-content').innerHTML = `
          <div class="empty-state"><div class="empty-icon">🐦</div><p>Henüz gönderi yok. İlk tweeti sen at!</p></div>`;
        return;
      }

      let html = '';
      posts.forEach(p => {
        const initials = (p.author_name||'?').charAt(0).toUpperCase();
        html += `
          <div class="social-post">
            <div class="social-post-header">
              <div class="social-post-avatar">${initials}</div>
              <div>
                <div class="social-post-name">${escHtml(p.author_name)}</div>
                <div class="social-post-time">${timeAgo(p.created_at)}</div>
              </div>
            </div>
            ${p.image ? `<img class="social-post-image" src="${escHtml(p.image)}" onerror="this.style.display='none'">` : ''}
            <div class="social-post-content">${escHtml(p.content)}</div>
            <div class="social-post-actions">
              <button class="social-action ${p.liked?'liked':''}" onclick="Apps.likePost(${p.id},this)">
                ${p.liked?'❤️':'🤍'} <span>${p.likes||0}</span>
              </button>
              <button class="social-action" onclick="Apps.replyToPost('${escHtml(p.author_name)}')">💬 Yanıt</button>
              ${p.is_mine ? `<button class="social-action" style="color:var(--danger)" onclick="Apps.deletePost(${p.id})">🗑️</button>` : ''}
            </div>
          </div>`;
      });
      document.getElementById('app-content').innerHTML = html;
    });
  },

  likePost(id, btn) {
    NUI.post('likeSocialPost', { id });
    const icon = btn.querySelector('span') ? btn : btn;
    const countEl = btn.querySelector('span');
    const isLiked = btn.classList.contains('liked');
    btn.classList.toggle('liked');
    btn.innerHTML = (isLiked ? '🤍' : '❤️') + ' <span>' + (parseInt(countEl?.textContent||0) + (isLiked?-1:1)) + '</span>';
  },

  deletePost(id) {
    NUI.post('deleteSocialPost', { id });
    setTimeout(() => this.social(), 300);
  },

  newSocialPost() {
    showModal('Yeni Gönderi', `
      <div style="padding:0 20px 20px;display:flex;flex-direction:column;gap:12px">
        <textarea class="styled" id="sp-content" rows="5" placeholder="Şu an ne düşünüyorsun? (Maks 280 karakter)" maxlength="280"></textarea>
        <div class="input-group">
          <label>Görsel URL (isteğe bağlı)</label>
          <input class="styled" id="sp-image" placeholder="https://...">
        </div>
        <button class="btn btn-primary" onclick="Apps.submitSocialPost()">🐦 Paylaş</button>
      </div>
    `);
  },

  submitSocialPost() {
    const content = document.getElementById('sp-content')?.value?.trim();
    const image = document.getElementById('sp-image')?.value?.trim();
    if (!content) return;
    NUI.post('createSocialPost', { content, image });
    closeModal();
    setTimeout(() => this.social(), 500);
  },

  replyToPost(name) {
    showModal('Yanıtla', `
      <div style="padding:0 20px 20px;display:flex;flex-direction:column;gap:12px">
        <textarea class="styled" id="reply-content" rows="4" placeholder="@${name} yanıtla..." maxlength="280"></textarea>
        <button class="btn btn-primary" onclick="Apps.submitReply('@${name}')">Yanıtla</button>
      </div>
    `);
  },

  submitReply(mention) {
    const content = document.getElementById('reply-content')?.value?.trim();
    if (!content) return;
    NUI.post('createSocialPost', { content: mention + ' ' + content });
    closeModal();
    setTimeout(() => this.social(), 500);
  },

  // ===== BANK =====
  bank() {
    NUI.callback('getBankData').then(data => {
      const btn = document.getElementById('app-header-action');
      btn.textContent = '💸 Transfer';
      btn.style.display = 'block';
      btn.onclick = () => this.bankTransferModal();

      let html = `
        <div class="bank-balance-card">
          <div class="bank-card-label">Banka Bakiyesi</div>
          <div class="bank-card-amount">${formatMoney(data?.balance)}</div>
          <div class="bank-card-number">Nakit: ${formatMoney(data?.cash)}</div>
        </div>
        <div class="section-header">Son İşlemler</div>`;

      if (!data?.transactions?.length) {
        html += `<div class="empty-state" style="padding:30px"><div class="empty-icon">💳</div><p>Henüz işlem yok</p></div>`;
      } else {
        data.transactions.forEach(t => {
          const isIncome = t.amount > 0;
          html += `
            <div class="transaction-item">
              <div class="transaction-icon ${isIncome?'tx-income':'tx-expense'}">${isIncome?'⬇️':'⬆️'}</div>
              <div class="list-info">
                <div class="list-name">${escHtml(t.description||t.type)}</div>
                <div class="list-sub">${escHtml(t.other_party||'')} · ${timeAgo(t.created_at)}</div>
              </div>
              <div class="tx-amount">${isIncome?'+':''}${formatMoney(t.amount)}</div>
            </div>`;
        });
      }
      document.getElementById('app-content').innerHTML = html;
    });
  },

  bankTransferModal() {
    showModal('Para Transferi', `
      <div style="padding:0 20px 20px;display:flex;flex-direction:column;gap:12px">
        <div class="input-group"><label>Alıcı Telefon Numarası</label><input class="styled" id="tr-number" placeholder="555-000-000"></div>
        <div class="input-group"><label>Miktar ($)</label><input class="styled" id="tr-amount" type="number" placeholder="1000" min="1"></div>
        <div class="input-group"><label>Açıklama (isteğe bağlı)</label><input class="styled" id="tr-desc" placeholder="Kira ödemesi"></div>
        <button class="btn btn-primary" onclick="Apps.doTransfer()">💸 Gönder</button>
      </div>
    `);
  },

  doTransfer() {
    const toNumber = document.getElementById('tr-number')?.value?.trim();
    const amount = document.getElementById('tr-amount')?.value;
    const description = document.getElementById('tr-desc')?.value?.trim();
    if (!toNumber || !amount) return;
    NUI.callback('bankTransfer', { toNumber, amount: parseFloat(amount), description }).then(result => {
      closeModal();
      if (result?.success) {
        Phone.showNotification({ icon:'✅', title:'Transfer', message: result.message });
        setTimeout(() => this.bank(), 500);
      } else {
        Phone.showNotification({ icon:'❌', title:'Hata', message: result?.message || 'Transfer başarısız' });
      }
    });
  },

  // ===== MAPS =====
  maps() {
    document.getElementById('app-content').innerHTML = `
      <div id="gps-map">
        <div class="map-placeholder">
          <div class="map-emoji">🗺️</div>
          <p>GPS modülü aktif.<br>Waypoint belirlemek için aşağıyı kullan.</p>
        </div>
      </div>
      <div class="map-controls">
        <div class="section-header">Hızlı Yerler</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 16px">
          ${[
            {name:'🏥 Hastane', x:-327.72, y:-543.49},
            {name:'🚔 Polis', x:448.4, y:-996.5},
            {name:'🏦 Banka', x:142.9, y:-1044.0},
            {name:'⛽ Benzin', x:265.2, y:-1261.4},
            {name:'🔫 Silah', x:22.7, y:-1113.8},
            {name:'🏪 Market', x:24.47, y:-1347.53},
          ].map(p => `
            <button class="btn btn-ghost" style="font-size:13px;justify-content:flex-start;gap:8px" 
              onclick="NUI.post('setWaypoint',{x:${p.x},y:${p.y}});Phone.showNotification({icon:'📍',title:'GPS',message:'${p.name} işaretlendi'})">
              ${p.name}
            </button>
          `).join('')}
        </div>
        <div style="padding:16px">
          <div class="input-group">
            <label>Koordinatlarla Git</label>
            <div style="display:flex;gap:10px">
              <input class="styled" id="map-x" placeholder="X koordinatı" type="number">
              <input class="styled" id="map-y" placeholder="Y koordinatı" type="number">
            </div>
          </div>
          <button class="btn btn-primary" style="width:100%;margin-top:10px" onclick="Apps.setCustomWaypoint()">📍 Waypoint Koy</button>
          <button class="btn btn-ghost" style="width:100%;margin-top:8px" onclick="NUI.post('clearWaypoint',{})">🗑️ İşareti Kaldır</button>
        </div>
      </div>
    `;
  },

  setCustomWaypoint() {
    const x = parseFloat(document.getElementById('map-x')?.value);
    const y = parseFloat(document.getElementById('map-y')?.value);
    if (isNaN(x) || isNaN(y)) return;
    NUI.post('setWaypoint', { x, y });
    Phone.showNotification({ icon:'📍', title:'GPS', message:`X:${x} Y:${y} işaretlendi` });
  },

  // ===== MUSIC =====
  currentSong: null,
  isPlaying: false,
  ytPlayer: null,
  currentPlaylist: [],
  currentSongIndex: -1,
  musicProgressInterval: null,

  music() {
    NUI.callback('getMusicPlaylists').then(playlists => {
      const btn = document.getElementById('app-header-action');
      btn.textContent = '+ Çalma Listesi';
      btn.style.display = 'block';
      btn.onclick = () => this.newPlaylist();

      let html = `
        <div class="music-player-card">
          <div id="yt-player-wrap" style="display:${this.currentSong?.videoId ? 'block' : 'none'};border-radius:12px;overflow:hidden;margin-bottom:16px;">
            <iframe id="yt-iframe"
              width="100%" height="160"
              src="${this.currentSong?.videoId ? `https://www.youtube.com/embed/${this.currentSong.videoId}?autoplay=1&enablejsapi=1` : ''}"
              frameborder="0"
              allow="autoplay; encrypted-media"
              allowfullscreen
              style="border-radius:12px;display:block;">
            </iframe>
          </div>
          <div id="yt-placeholder" style="display:${this.currentSong?.videoId ? 'none' : 'flex'}">
            <div class="music-album-art" id="music-album-art" style="background:${this.currentSong?.thumb ? `url('${this.currentSong.thumb}') center/cover` : 'var(--surface2)'}">
              ${this.currentSong?.thumb ? '' : '🎵'}
            </div>
          </div>
          <div class="music-title" id="music-title">${this.currentSong ? escHtml(this.currentSong.title) : 'Şarkı Seçilmedi'}</div>
          <div class="music-artist" id="music-artist">${this.currentSong ? escHtml(this.currentSong.artist||'') : 'Bir çalma listesinden şarkı seç'}</div>
          <div class="music-controls" style="margin-top:16px">
            <button class="music-btn" onclick="Apps.prevSong()">⏮</button>
            <button class="music-btn music-btn-main" id="music-play-btn" onclick="Apps.togglePlay()">${this.isPlaying ? '⏸' : '▶️'}</button>
            <button class="music-btn" onclick="Apps.nextSong()">⏭</button>
          </div>
        </div>
        <div class="section-header">Çalma Listeleri</div>`;

      if (!playlists || !playlists.length) {
        html += `<div class="empty-state" style="padding:20px"><div class="empty-icon">🎵</div><p>Çalma listesi yok</p></div>`;
      } else {
        playlists.forEach(pl => {
          html += `
            <div class="list-item" onclick="Apps.openPlaylist(${pl.id},'${escHtml(pl.name)}',${JSON.stringify(JSON.stringify(pl.songs||[]))})">
              <div class="list-avatar" style="font-size:28px;background:linear-gradient(135deg,#ff2d55,#ff375f)">🎵</div>
              <div class="list-info">
                <div class="list-name">${escHtml(pl.name)}</div>
                <div class="list-sub">${(pl.songs||[]).length} şarkı</div>
              </div>
              <div style="display:flex;gap:6px;align-items:center">
                <button class="btn btn-sm" style="background:#ff0000;color:#fff;font-size:11px;padding:6px 10px" onclick="event.stopPropagation();Apps.importYouTubePlaylist(${pl.id},'${escHtml(pl.name)}')">▶ YT</button>
                <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();NUI.post('deleteMusicPlaylist',{id:${pl.id}});setTimeout(()=>Apps.music(),300)">🗑️</button>
              </div>
            </div>`;
        });
      }
      document.getElementById('app-content').innerHTML = html;
    });
  },

  togglePlay() {
    if (!this.currentSong) return;
    this.isPlaying = !this.isPlaying;
    const btn = document.getElementById('music-play-btn');
    if (btn) btn.textContent = this.isPlaying ? '⏸' : '▶️';
    // iframe src toggle
    const iframe = document.getElementById('yt-iframe');
    if (iframe && this.currentSong.videoId) {
      const base = `https://www.youtube.com/embed/${this.currentSong.videoId}`;
      iframe.src = this.isPlaying ? `${base}?autoplay=1&enablejsapi=1` : `${base}?autoplay=0`;
    }
  },

  prevSong() {
    if (this.currentPlaylist.length === 0) return;
    this.currentSongIndex = (this.currentSongIndex - 1 + this.currentPlaylist.length) % this.currentPlaylist.length;
    this._playSongFromQueue(this.currentSongIndex);
  },

  nextSong() {
    if (this.currentPlaylist.length === 0) return;
    this.currentSongIndex = (this.currentSongIndex + 1) % this.currentPlaylist.length;
    this._playSongFromQueue(this.currentSongIndex);
  },

  _playSongFromQueue(index) {
    const song = this.currentPlaylist[index];
    if (!song) return;
    this.currentSong = song;
    this.isPlaying = true;
    this.music();
  },

  openPlaylist(id, name, songsJson) {
    let songs = [];
    try { songs = JSON.parse(JSON.parse(songsJson)); } catch(e) {}

    showModal('🎵 ' + name, `
      <div style="padding:0 0 20px">
        ${songs.length ? songs.map((s, i) => `
          <div class="list-item${this.currentSong?.videoId === s.videoId && s.videoId ? ' music-active-song' : ''}"
               onclick="Apps.playSongFromPlaylist(${i},${JSON.stringify(JSON.stringify(songs))})">
            <div class="list-avatar" style="background:${s.thumb ? `url('${s.thumb}') center/cover` : 'linear-gradient(135deg,#ff2d55,#ff375f)'};font-size:20px;background-size:cover;border-radius:8px">
              ${s.thumb ? '' : '🎵'}
            </div>
            <div class="list-info">
              <div class="list-name">${escHtml(s.title||'Şarkı '+(i+1))}</div>
              <div class="list-sub">${escHtml(s.artist||'')}</div>
            </div>
            <span style="color:${this.currentSong?.videoId === s.videoId && s.videoId ? '#ff2d55' : 'var(--text3)'}">
              ${this.currentSong?.videoId === s.videoId && s.videoId ? '🔊' : '▶'}
            </span>
          </div>`).join('') :
          '<div class="empty-state"><div class="empty-icon">🎵</div><p>Bu listede şarkı yok</p><p style="font-size:12px;color:var(--text3);margin-top:8px">YT butonuyla YouTube\'dan ekle</p></div>'
        }
        <div style="padding:16px;display:flex;flex-direction:column;gap:8px">
          <button class="btn btn-primary" style="width:100%" onclick="Apps.addSongToPlaylist(${id},'${escHtml(name)}')">+ Şarkı Ekle</button>
          <button class="btn" style="width:100%;background:#ff0000;color:#fff" onclick="Apps.importYouTubePlaylist(${id},'${escHtml(name)}')">▶ YouTube Playlist Yükle</button>
        </div>
      </div>
    `);
  },

  playSongFromPlaylist(index, songsJson) {
    let songs = [];
    try { songs = JSON.parse(JSON.parse(songsJson)); } catch(e) {}
    this.currentPlaylist = songs;
    this.currentSongIndex = index;
    const song = songs[index];
    if (!song) return;
    this.currentSong = song;
    this.isPlaying = true;
    closeModal();
    this.music();
  },

  newPlaylist() {
    showModal('Yeni Çalma Listesi', `
      <div style="padding:0 20px 20px;display:flex;flex-direction:column;gap:12px">
        <div class="input-group"><label>Liste Adı</label><input class="styled" id="pl-name" placeholder="Benim Listem"></div>
        <button class="btn btn-primary" onclick="Apps.savePlaylist()">💾 Oluştur</button>
      </div>
    `);
  },

  savePlaylist() {
    const name = document.getElementById('pl-name')?.value?.trim();
    if (!name) return;
    NUI.post('saveMusicPlaylist', { name, songs: [] });
    closeModal();
    setTimeout(() => this.music(), 400);
  },

  importYouTubePlaylist(playlistId, playlistName) {
    closeModal();
    showModal('▶ YouTube Playlist Yükle', `
      <div style="padding:0 20px 20px;display:flex;flex-direction:column;gap:14px">
        <div style="background:rgba(255,0,0,0.1);border:1px solid rgba(255,0,0,0.3);border-radius:12px;padding:12px;font-size:13px;color:var(--text2)">
          🎵 YouTube playlist veya video URL'lerini yapıştır.<br>
          <span style="color:var(--text3);font-size:11px">Playlist URL, tek video URL veya video ID'leri (her satıra bir tane)</span>
        </div>
        <div class="input-group">
          <label>YouTube URL / ID'leri</label>
          <textarea class="styled" id="yt-urls-input" rows="5" placeholder="https://youtube.com/watch?v=dQw4w9WgXcQ&#10;https://youtube.com/watch?v=...&#10;veya sadece: dQw4w9WgXcQ" style="resize:vertical;font-size:12px;min-height:100px"></textarea>
        </div>
        <button class="btn" style="background:#ff0000;color:#fff;width:100%;font-weight:600" onclick="Apps.fetchYouTubeVideos(${playlistId},'${escHtml(playlistName)}')">
          ▶ Ekle
        </button>
        <div id="yt-import-status" style="display:none;text-align:center;padding:8px;font-size:13px;color:var(--text2)"></div>
      </div>
    `);
  },

  _extractVideoIds(rawText) {
    const ids = [];
    const seen = new Set();
    const lines = rawText.split(/[\n,]+/);
    for (const line of lines) {
      const t = line.trim();
      if (!t) continue;
      // youtube.com/watch?v=ID or youtu.be/ID
      let m = t.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (m) { if (!seen.has(m[1])) { seen.add(m[1]); ids.push(m[1]); } continue; }
      // bare 11-char ID
      if (/^[a-zA-Z0-9_-]{11}$/.test(t)) {
        if (!seen.has(t)) { seen.add(t); ids.push(t); }
      }
    }
    return ids;
  },

  async fetchYouTubeVideos(localPlaylistId, playlistName) {
    const raw = document.getElementById('yt-urls-input')?.value?.trim();
    const status = document.getElementById('yt-import-status');
    if (!raw) { alert('En az bir URL veya ID gir!'); return; }

    const videoIds = this._extractVideoIds(raw);
    if (!videoIds.length) { alert('Geçerli YouTube URL veya ID bulunamadı!'); return; }

    status.style.display = 'block';
    status.innerHTML = `<span style="color:#ff9500">⏳ ${videoIds.length} video bilgisi alınıyor...</span>`;

    // Fetch title/thumb for each video via noembed (no API key needed)
    const songs = [];
    for (const vid of videoIds) {
      try {
        const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${vid}`);
        const data = await res.json();
        songs.push({
          title: data.title || vid,
          artist: data.author_name || '',
          videoId: vid,
          thumb: `https://i.ytimg.com/vi/${vid}/mqdefault.jpg`,
          url: `https://www.youtube.com/watch?v=${vid}`
        });
      } catch(e) {
        // Fallback: add with just ID if noembed fails
        songs.push({
          title: vid,
          artist: '',
          videoId: vid,
          thumb: `https://i.ytimg.com/vi/${vid}/mqdefault.jpg`,
          url: `https://www.youtube.com/watch?v=${vid}`
        });
      }
    }

    status.innerHTML = `<span style="color:#30d158">✅ ${songs.length} şarkı hazır, kaydediliyor...</span>`;

    NUI.callback('getMusicPlaylists').then(pls => {
      const pl = pls?.find(p => p.id === localPlaylistId);
      const existing = pl?.songs || [];
      const existingIds = new Set(existing.map(s => s.videoId).filter(Boolean));
      const newSongs = songs.filter(s => !existingIds.has(s.videoId));
      const merged = [...existing, ...newSongs];

      NUI.post('saveMusicPlaylist', { id: localPlaylistId, name: playlistName, songs: merged });

      setTimeout(() => {
        closeModal();
        Phone.showNotification({ icon:'🎵', title:'YouTube Import', message:`${newSongs.length} şarkı eklendi!` });
        Apps.music();
      }, 500);
    });
  },

  addSongToPlaylist(id, playlistName) {
    closeModal();
    showModal('Şarkı Ekle', `
      <div style="padding:0 20px 20px;display:flex;flex-direction:column;gap:12px">
        <div class="input-group"><label>Şarkı Adı</label><input class="styled" id="song-title" placeholder="Şarkı Adı"></div>
        <div class="input-group"><label>Sanatçı</label><input class="styled" id="song-artist" placeholder="Sanatçı Adı"></div>
        <div class="input-group"><label>YouTube/URL (opsiyonel)</label><input class="styled" id="song-url" placeholder="https://..."></div>
        <button class="btn btn-primary" onclick="Apps.saveSong(${id},'${escHtml(playlistName)}')">+ Ekle</button>
      </div>
    `);
  },

  saveSong(playlistId, playlistName) {
    const title = document.getElementById('song-title')?.value?.trim();
    const artist = document.getElementById('song-artist')?.value?.trim();
    const url = document.getElementById('song-url')?.value?.trim();
    if (!title) return;
    NUI.callback('getMusicPlaylists').then(pls => {
      const pl = pls?.find(p => p.id === playlistId);
      const songs = pl?.songs || [];
      songs.push({ title, artist, url });
      NUI.post('saveMusicPlaylist', { id: playlistId, name: playlistName, songs });
      closeModal();
      Phone.showNotification({ icon:'🎵', title:'Müzik', message: title + ' eklendi!' });
    });
  },

  // ===== CAMERA / GALLERY =====
  camera() {
    NUI.callback('getGallery').then(photos => {
      const btn = document.getElementById('app-header-action');
      btn.textContent = '+ Fotoğraf';
      btn.style.display = 'block';
      btn.onclick = () => this.addPhoto();

      let html = '';
      if (!photos || !photos.length) {
        html = `<div class="empty-state"><div class="empty-icon">📷</div><p>Galeri boş. URL ile fotoğraf ekle!</p></div>`;
      } else {
        html = '<div class="gallery-grid">';
        photos.forEach(p => {
          html += `
            <div class="gallery-item" onclick="Apps.viewPhoto(${p.id},'${escHtml(p.url)}','${escHtml(p.caption)}')">
              <img src="${escHtml(p.url)}" onerror="this.style.display='none';this.nextSibling.style.display='flex'">
              <div class="gallery-emoji" style="display:none">📷</div>
            </div>`;
        });
        html += '</div>';
      }
      document.getElementById('app-content').innerHTML = html;
    });
  },

  addPhoto() {
    showModal('Fotoğraf Ekle', `
      <div style="padding:0 20px 20px;display:flex;flex-direction:column;gap:12px">
        <div class="input-group"><label>Fotoğraf URL</label><input class="styled" id="ph-url" placeholder="https://i.imgur.com/..."></div>
        <div class="input-group"><label>Açıklama</label><input class="styled" id="ph-caption" placeholder="Bir açıklama yaz..."></div>
        <button class="btn btn-primary" onclick="Apps.savePhoto()">💾 Kaydet</button>
      </div>
    `);
  },

  savePhoto() {
    const url = document.getElementById('ph-url')?.value?.trim();
    const caption = document.getElementById('ph-caption')?.value?.trim();
    if (!url) return;
    NUI.post('savePhoto', { url, caption });
    closeModal();
    setTimeout(() => this.camera(), 400);
  },

  viewPhoto(id, url, caption) {
    showModal(caption || 'Fotoğraf', `
      <div style="padding:0 0 20px">
        <img src="${escHtml(url)}" style="width:100%;max-height:300px;object-fit:contain">
        <div style="padding:12px 20px;display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="Apps.sharePhoto('${escHtml(url)}','${escHtml(caption)}')">📤 Paylaş</button>
          <button class="btn btn-danger" onclick="NUI.post('deletePhoto',{id:${id}});closeModal();setTimeout(()=>Apps.camera(),300)">🗑️</button>
        </div>
      </div>
    `);
  },

  sharePhoto(url, caption) {
    NUI.post('sharePhotoToSocial', { url, caption });
    closeModal();
    Phone.showNotification({ icon:'📤', title:'Paylaşıldı', message:'Fotoğraf Squeak\'te paylaşıldı!' });
  },

  // ===== JOBS =====
  jobs() {
    NUI.callback('getJobAds').then(ads => {
      const btn = document.getElementById('app-header-action');
      btn.textContent = '+ İlan Ver';
      btn.style.display = 'block';
      btn.onclick = () => this.newJobAd();

      let html = '<div class="app-padded">';
      if (!ads || !ads.length) {
        html += `<div class="empty-state"><div class="empty-icon">💼</div><p>Henüz aktif iş ilanı yok</p></div>`;
      } else {
        ads.forEach(a => {
          html += `
            <div class="job-card">
              <div class="job-card-title">${escHtml(a.title)}</div>
              <div class="job-card-company">👤 ${escHtml(a.author_name)}</div>
              <div class="job-card-desc">${escHtml((a.description||'').substring(0,120))}${a.description?.length>120?'...':''}</div>
              <div class="job-card-footer">
                <div class="job-salary">${a.salary ? formatMoney(a.salary) + '/saat' : 'Maaş belirtilmedi'}</div>
                <div style="display:flex;gap:8px">
                  <button class="btn btn-primary btn-sm" onclick="Apps.applyJob(${a.id},'${escHtml(a.title)}')">Başvur</button>
                  <button class="btn btn-ghost btn-sm" onclick="Apps.contactJobPoster('${escHtml(a.contact_number||'')}')">📞</button>
                </div>
              </div>
            </div>`;
        });
      }
      html += '</div>';
      document.getElementById('app-content').innerHTML = html;
    });
  },

  applyJob(id, title) {
    if (confirm('Bu ilana başvurmak istiyor musun: ' + title + '?') || true) {
      showModal('Başvur: ' + title, `
        <div style="padding:0 20px 20px">
          <p style="color:var(--text2);margin-bottom:20px">İlan sahibine otomatik mesaj gönderilecek.</p>
          <button class="btn btn-primary" style="width:100%" onclick="NUI.post('applyJob',{id:${id}});closeModal();Phone.showNotification({icon:'✅',title:'Başvuru',message:'Başvurunuz iletildi!'})">✅ Başvur</button>
        </div>
      `);
    }
  },

  contactJobPoster(number) {
    if (!number) return;
    closeModal();
    Apps.openConversation(number, 'İşveren');
  },

  newJobAd() {
    NUI.callback('getPlayerData').then(pd => {
      showModal('İş İlanı Ver', `
        <div style="padding:0 20px 20px;display:flex;flex-direction:column;gap:12px">
          <div class="input-group"><label>Pozisyon Adı</label><input class="styled" id="job-title" placeholder="Güvenlik Görevlisi"></div>
          <div class="input-group"><label>Açıklama</label><textarea class="styled" id="job-desc" rows="4" placeholder="İş tanımı..."></textarea></div>
          <div class="input-group"><label>Saatlik Maaş ($)</label><input class="styled" id="job-salary" type="number" placeholder="500"></div>
          <div class="input-group"><label>İletişim Numarası</label><input class="styled" id="job-contact" value="${escHtml(pd?.number||'')}" placeholder="555-000-000"></div>
          <button class="btn btn-primary" onclick="Apps.submitJobAd()">📋 Yayınla</button>
        </div>
      `);
    });
  },

  submitJobAd() {
    const title = document.getElementById('job-title')?.value?.trim();
    const description = document.getElementById('job-desc')?.value?.trim();
    const salary = document.getElementById('job-salary')?.value;
    const contactNumber = document.getElementById('job-contact')?.value?.trim();
    if (!title || !description) return;
    NUI.post('createJobAd', { title, description, salary: parseFloat(salary)||0, contactNumber });
    closeModal();
    Phone.showNotification({ icon:'💼', title:'WorkHub', message:'İlanınız yayınlandı!' });
    setTimeout(() => this.jobs(), 500);
  },

  // ===== GARAGE (VALE) - FOTOĞRAFLI, GÜVENLİ VE HARİTALI =====
  garage() {
    NUI.callback('getGarageVehicles').then(vehicles => {
      const btn = document.getElementById('app-header-action');
      if (btn) btn.style.display = 'none';

      const content = document.getElementById('app-content');
      if (!content) return;

      if (!vehicles || !vehicles.length) {
        content.innerHTML = `<div class="empty-state"><div class="empty-icon">🚗</div><p>Garajınızda araç yok</p></div>`;
        return;
      }

      let html = `
        <div class="garage-header">
          <div class="garage-stats">
            <div class="garage-stat">
              <span class="garage-stat-num">${vehicles.length}</span>
              <span class="garage-stat-label">Araç</span>
            </div>
            <div class="garage-stat">
              <span class="garage-stat-num">${vehicles.filter(v => v.state === 0).length}</span>
              <span class="garage-stat-label">Dışarıda</span>
            </div>
            <div class="garage-stat">
              <span class="garage-stat-num">${vehicles.filter(v => v.state === 1).length}</span>
              <span class="garage-stat-label">Garajda</span>
            </div>
          </div>
        </div>
        <div class="garage-list">`;

      vehicles.forEach(v => {
        const stateLabel = v.state === 0 ? 'Dışarıda' : v.state === 1 ? 'Garajda' : 'El Konuldu';
        const stateColor = v.state === 0 ? 'var(--warning)' : v.state === 1 ? 'var(--success)' : 'var(--danger)';
        const stateDot   = v.state === 0 ? '🟡' : v.state === 1 ? '🟢' : '🔴';
        const plateClean = (v.plate || 'PLAKA').toUpperCase().trim();
        const modelName  = (v.label || v.model || v.vehicle || 'Araç').toUpperCase();
        const modelForUrl = (v.model || v.vehicle || '').toLowerCase();
        const imgUrl     = modelForUrl ? `https://docs.fivem.net/vehicles/${modelForUrl}.webp` : '';
        const coordsJson = escHtml(JSON.stringify(v.coords || null));

        html += `
          <div class="garage-vehicle-card" id="vcard-${plateClean.replace(/[^a-zA-Z0-9]/g, '')}">
            <div class="garage-vehicle-img-wrap">
              ${imgUrl
                ? `<img class="garage-vehicle-img" src="${imgUrl}"
                     onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'garage-vehicle-placeholder\\'>🚗</div>';"
                     alt="${modelName}">`
                : `<div class="garage-vehicle-placeholder">🚗</div>`
              }
            </div>
            <div class="garage-vehicle-info">
              <div class="garage-vehicle-name">${escHtml(v.label || modelName)}</div>
              <div class="garage-plate-badge">${escHtml(plateClean)}</div>
              <div class="garage-vehicle-meta">
                <span style="color:${stateColor}">${stateDot} ${stateLabel}</span>
                ${v.fuel   !== undefined ? `<span>⛽ ${v.fuel}%</span>` : ''}
                ${v.engine !== undefined ? `<span>🔧 ${Math.round(v.engine / 10)}%</span>` : ''}
              </div>
            </div>
            <div class="garage-vehicle-actions">
              ${v.state === 1
                ? `<button class="btn btn-primary btn-sm garage-spawn-btn"
                     data-plate="${escHtml(plateClean)}"
                     data-label="${escHtml(v.label || modelName)}">
                     🚗 Getir
                   </button>`
                : v.state === 0
                  ? `<button class="btn btn-ghost btn-sm" style="font-size:11px;color:var(--text3)" disabled>
                       ⚡ Kullanımda
                     </button>
                     <button class="btn btn-secondary btn-sm garage-map-btn"
                       data-plate="${escHtml(plateClean)}"
                       data-label="${escHtml(v.label || modelName)}"
                       data-coords="${coordsJson}">
                       🗺️ Haritada Gör
                     </button>`
                  : `<button class="btn btn-ghost btn-sm" style="font-size:11px;color:var(--text3)" disabled>
                       🚔 El Konuldu
                     </button>`
              }
            </div>
          </div>`;
      });

      html += `</div>`;
      content.innerHTML = html;

      // Spawn butonları
      document.querySelectorAll('.garage-spawn-btn').forEach(btn => {
        btn.removeEventListener('click', this.spawnVehicleHandler);
        btn.addEventListener('click', this.spawnVehicleHandler.bind(this));
      });

      // Harita butonları
      document.querySelectorAll('.garage-map-btn').forEach(btn => {
        btn.removeEventListener('click', this.mapVehicleHandler);
        btn.addEventListener('click', this.mapVehicleHandler.bind(this));
      });

    }).catch(err => {
      console.warn('getGarageVehicles hatası:', err);
      const content = document.getElementById('app-content');
      if (content) {
        content.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p>Garaj verileri alınamadı</p></div>`;
      }
    });
  },

  spawnVehicleHandler(event) {
    const btn   = event.currentTarget;
    const plate = btn.getAttribute('data-plate');
    const label = btn.getAttribute('data-label');
    this.spawnVehicle(plate, label, btn);
  },

  spawnVehicle(plate, label, btn) {
    if (!btn) return;
    btn.textContent = '⏳ Getiriliyor...';
    btn.disabled    = true;
    btn.style.opacity = '0.6';

    NUI.callback('spawnGarageVehicle', { plate }).then(result => {
      if (result?.success) {
        if (typeof Phone !== 'undefined' && Phone.showNotification) {
          Phone.showNotification({ icon: '🚗', title: 'Vale', message: label + ' önünüze getirildi!' });
        }
        const card = btn.closest('.garage-vehicle-card');
        if (card) {
          const actionsDiv = card.querySelector('.garage-vehicle-actions');
          if (actionsDiv) {
            actionsDiv.innerHTML = `
              <button class="btn btn-ghost btn-sm" style="font-size:11px;color:var(--text3)" disabled>
                ⚡ Kullanımda
              </button>
              <button class="btn btn-secondary btn-sm garage-map-btn"
                data-plate="${btn.getAttribute('data-plate')}"
                data-label="${btn.getAttribute('data-label')}"
                data-coords="null">
                🗺️ Haritada Gör
              </button>`;
            const mapBtn = actionsDiv.querySelector('.garage-map-btn');
            if (mapBtn) mapBtn.addEventListener('click', this.mapVehicleHandler.bind(this));
          }
          const metaSpan = card.querySelector('.garage-vehicle-meta span');
          if (metaSpan) {
            metaSpan.style.color = 'var(--warning)';
            metaSpan.textContent = '🟡 Dışarıda';
          }
        }
      } else {
        if (typeof Phone !== 'undefined' && Phone.showNotification) {
          Phone.showNotification({ icon: '❌', title: 'Vale', message: result?.message || 'Araç getirilemedi!' });
        }
        btn.textContent   = '🚗 Getir';
        btn.disabled      = false;
        btn.style.opacity = '1';
      }
    }).catch(err => {
      console.warn('spawnVehicle hatası:', err);
      if (typeof Phone !== 'undefined' && Phone.showNotification) {
        Phone.showNotification({ icon: '❌', title: 'Vale', message: 'Bir hata oluştu!' });
      }
      btn.textContent   = '🚗 Getir';
      btn.disabled      = false;
      btn.style.opacity = '1';
    });
  },

  mapVehicleHandler(event) {
    const btn   = event.currentTarget;
    const plate = btn.getAttribute('data-plate');
    const label = btn.getAttribute('data-label');
    let coords  = null;
    try { coords = JSON.parse(btn.getAttribute('data-coords')); } catch (_) {}
    this.showVehicleOnMap(plate, label, coords);
  },

  showVehicleOnMap(plate, label, coords) {
    if (coords) {
      NUI.callback('openMapMarker', { plate, label, coords })
        .then(() => {})
        .catch(err => console.warn('openMapMarker hatası:', err));
      return;
    }

    NUI.callback('getVehicleLocation', { plate }).then(result => {
      if (result?.coords) {
        NUI.callback('openMapMarker', { plate, label, coords: result.coords })
          .then(() => {})
          .catch(err => console.warn('openMapMarker hatası:', err));
      } else {
        if (typeof Phone !== 'undefined' && Phone.showNotification) {
          Phone.showNotification({
            icon: '🗺️',
            title: 'Harita',
            message: label + ' konumu bulunamadı.'
          });
        }
      }
    }).catch(err => {
      console.warn('getVehicleLocation hatası:', err);
      if (typeof Phone !== 'undefined' && Phone.showNotification) {
        Phone.showNotification({ icon: '❌', title: 'Harita', message: 'Konum alınamadı!' });
      }
    });
  },
  

  // ===== SETTINGS =====
  settings() {
    NUI.callback('getSettings').then(settings => {
      Phone.settings = { ...Phone.settings, ...settings };
      const themes = Phone.themes;
      const wallpapers = Phone.wallpapers;
      const ringtones = Phone.ringtones;
      const notifSounds = Phone.notifSounds;

      let html = `
        <div class="section-header">Kişiselleştirme</div>
        <div class="settings-row">
          <div><div class="settings-label">Bildirimler</div><div class="settings-sub">Uygulama bildirimlerini göster</div></div>
          <button class="toggle ${Phone.settings.notifications?'on':''}" id="toggle-notif" onclick="Apps.toggleNotifications()"></button>
        </div>

        <div class="section-header" style="margin-top:8px">Tema</div>
        <div class="theme-grid">
          ${themes.map((t,i) => `
            <div class="theme-option ${Phone.settings.theme===i?'active':''}" 
              style="background:linear-gradient(135deg,${t.primary},${t.bg})"
              onclick="Apps.setTheme(${i})">
              <div class="theme-name" style="width:100%;text-align:center">${t.name}</div>
              <div style="width:16px;height:16px;border-radius:50%;background:${t.accent};margin-left:auto"></div>
            </div>
          `).join('')}
        </div>

        <div class="section-header">Duvar Kağıdı</div>
        <div class="wallpaper-grid">
          ${wallpapers.map((w,i) => `
            <div class="wallpaper-option ${Phone.settings.wallpaper===i?'active':''}"
              style="background:${w}"
              onclick="Apps.setWallpaper(${i})">
            </div>
          `).join('')}
        </div>

        <div class="section-header" style="margin-top:8px">🔔 Zil Sesi</div>
        <div class="sound-list">
          ${ringtones.map((r,i) => `
            <div class="sound-option ${(Phone.settings.ringtone||0)===i?'active':''}" onclick="Apps.setRingtone(${i})">
              <div class="sound-option-inner">
                <span class="sound-name">${r.name}</span>
                ${(Phone.settings.ringtone||0)===i ? '<span class="sound-check">✓</span>' : ''}
              </div>
              ${r.file ? `<button class="sound-preview-btn" onclick="event.stopPropagation();Apps.previewSound('${r.file}')">▶</button>` : ''}
            </div>
          `).join('')}
        </div>

        <div class="section-header" style="margin-top:8px">💬 Bildirim Sesi</div>
        <div class="sound-list">
          ${notifSounds.map((s,i) => `
            <div class="sound-option ${(Phone.settings.notifSound||0)===i?'active':''}" onclick="Apps.setNotifSound(${i})">
              <div class="sound-option-inner">
                <span class="sound-name">${s.name}</span>
                ${(Phone.settings.notifSound||0)===i ? '<span class="sound-check">✓</span>' : ''}
              </div>
              ${s.file ? `<button class="sound-preview-btn" onclick="event.stopPropagation();Apps.previewSound('${s.file}')">▶</button>` : ''}
            </div>
          `).join('')}
        </div>

        <div class="section-header">Hesap Bilgileri</div>`;

      NUI.callback('getPlayerData').then(pd => {
        html += `
          <div class="settings-row"><div class="settings-label">Ad Soyad</div><div style="color:var(--text2)">${escHtml(pd?.name||'-')}</div></div>
          <div class="settings-row"><div class="settings-label">Telefon Numarası</div><div style="color:var(--text2)">${escHtml(pd?.number||'-')}</div></div>
          <div class="settings-row"><div class="settings-label">Meslek</div><div style="color:var(--text2)">${escHtml(pd?.job||'-')}</div></div>
          <div style="padding:16px 16px 30px">
            <button class="btn btn-danger" style="width:100%" onclick="NUI.post('closePhone',{})">❌ Telefonu Kapat</button>
          </div>`;
        document.getElementById('app-content').innerHTML = html;
      });
    });
  },

  _previewAudio: null,
  previewSound(file) {
    if (this._previewAudio) {
      this._previewAudio.pause();
      this._previewAudio = null;
    }
    const audio = new Audio(file);
    audio.volume = 0.6;
    audio.play().catch(() => {});
    this._previewAudio = audio;
    setTimeout(() => {
      if (this._previewAudio) {
        this._previewAudio.pause();
        this._previewAudio = null;
      }
    }, 3000);
  },

  setRingtone(index) {
    Phone.settings.ringtone = index;
    NUI.post('saveSettings', Phone.settings);
    this.settings();
  },

  setNotifSound(index) {
    Phone.settings.notifSound = index;
    NUI.post('saveSettings', Phone.settings);
    this.settings();
  },

  setTheme(index) {
    Phone.settings.theme = index;
    Phone.applySettings();
    NUI.post('saveSettings', Phone.settings);
    this.settings();
  },

  setWallpaper(index) {
    Phone.settings.wallpaper = index;
    Phone.applySettings();
    NUI.post('saveSettings', Phone.settings);
    this.settings();
  },

  toggleNotifications() {
    Phone.settings.notifications = !Phone.settings.notifications;
    NUI.post('saveSettings', Phone.settings);
    const btn = document.getElementById('toggle-notif');
    if (btn) btn.classList.toggle('on', Phone.settings.notifications);
  }
};