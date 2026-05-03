Config = {}

-- General
Config.PhoneKey = 'F1'          -- Telefonu açma/kapama tuşu
Config.MaxContacts = 100        -- Maksimum rehber kişi sayısı
Config.MaxMessages = 200        -- Kişi başına max mesaj
Config.MaxSocialPosts = 50      -- Sosyal medya gönderi limiti
Config.MaxJobAds = 30           -- İş ilanı limiti

-- Phone number
Config.PhoneNumberLength = 9    -- Telefon numarası uzunluğu (karakter)

-- Bank
Config.BankAccount = 'bank'     -- QBCore banka hesap tipi ('bank' veya 'money')
Config.MaxTransferAmount = 1000000



-- Music
Config.MaxPlaylistSongs = 50

-- Social Media
Config.SocialAppName = 'Twitter'     -- Sosyal medya adı
Config.SocialCharLimit = 280        -- Gönderi karakter limiti

-- Jobs
Config.JobsAppName = 'WorkHub'
Config.MaxJobAdDays = 7            -- İlanın kaç gün aktif kalacağı

-- GPS / Map
Config.DefaultMapZoom = 0          -- 0-3 arası (yakınlık)

-- Themes
Config.Themes = {
    {name = 'Midnight', primary = '#1c1c1e', accent = '#0a84ff', bg = '#000000'},
    {name = 'Rose Gold', primary = '#2c2c2e', accent = '#ff6b6b', bg = '#1a1a1a'},
    {name = 'Forest', primary = '#1c2c1e', accent = '#30d158', bg = '#0d1f0f'},
    {name = 'Ocean', primary = '#1c1e2c', accent = '#64d2ff', bg = '#0a0f1a'},
    {name = 'Sunset', primary = '#2c1e1c', accent = '#ff9f0a', bg = '#1a0f0a'},
    {name = 'Purple', primary = '#1e1c2c', accent = '#bf5af2', bg = '#0f0a1a'},
}

-- Wallpapers (renkli gradient wallpaperlar)
Config.Wallpapers = {
    'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
    'linear-gradient(135deg, #0d1117, #161b22, #21262d)',
    'linear-gradient(135deg, #1a0533, #2d1b69, #11998e)',
    'linear-gradient(135deg, #200122, #6f0000)',
    'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
    'linear-gradient(135deg, #134e5e, #71b280)',
}

-- Notification sounds (NUI oynatmak için)
Config.NotificationSound = true

-- Emergency numbers (çağrılamaz ama görünsün)
Config.EmergencyContacts = {
    {name = '🚔 Polis', number = '911'},
    {name = '🚑 Ambulans', number = '912'},
    {name = '🚒 İtfaiye', number = '913'},
}
