// ===== NUI.JS - FiveM NUI Bridge =====

// ===== DEV MODE MOCK DATA (sadece FiveM dışında aktif) =====
const DEV_MOCK = {
  getGarageVehicles: [
    { plate: '34ABC123', model: 'adder',      label: 'Adder',        fuel: 87, engine: 950, state: 1, garage: 'pillboxgarage' },
    { plate: '06XY9900', model: 'zentorno',   label: 'Zentorno',     fuel: 45, engine: 820, state: 1, garage: 'pillboxgarage' },
    { plate: '35TT4421', model: 'sultan',     label: 'Sultan RS',    fuel: 100, engine: 1000, state: 0, garage: 'pillboxgarage' },
    { plate: '01KL5577', model: 'police',     label: 'Police Cruiser', fuel: 60, engine: 780, state: 2, garage: 'pillboxgarage' },
    { plate: '34PQ8812', model: 'elegy2',     label: 'Elegy Retro',  fuel: 72, engine: 900, state: 1, garage: 'pillboxgarage' },
  ],
  spawnGarageVehicle: { success: true },
  getCallHistory: [],
  getMessages: [],
  getContacts: [],
  getSocialPosts: [],
  getBankData: { balance: 25000, cash: 3500, transactions: [] },
  getMusicPlaylists: [],
  getGallery: [],
  getJobAds: [],
  getPlayerData: { name: 'Ahmet Yılmaz', number: '555-123-456', job: 'Polis', money: 25000, cash: 3500 },
  getSettings: { theme: 0, wallpaper: 0, notifications: true },
};

const IS_DEV = !window.invokeNative;

const NUI = {
  post(name, data) {
    if (IS_DEV) return Promise.resolve(DEV_MOCK[name] ?? 'ok');
    return fetch(`https://qb-phone/${name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data || {})
    }).then(r => r.json()).catch(() => null);
  },

  callback(name, data) {
    if (IS_DEV) return Promise.resolve(DEV_MOCK[name] ?? null);
    return new Promise(resolve => {
      fetch(`https://qb-phone/${name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data || {})
      }).then(r => r.json()).then(resolve).catch(() => resolve(null));
    });
  }
};


