# 📱 QB-Phone — Ücretsiz & Açık Kaynak FiveM Telefon Scripti

**QBCore** için tam özellikli, iOS tarzı telefon scripti. Tamamen ücretsiz!

---

## ✨ Özellikler

| Özellik | Açıklama |
|---------|----------|
| 📞 **Arama & SMS** | Gerçek zamanlı çağrı sistemi, mesajlaşma, arama geçmişi |
| 👤 **Rehber** | Kişi ekleme, silme, güncelleme |
| 🐦 **Squeak (Sosyal Medya)** | Gönderi paylaşma, beğenme, yorum |
| 🏦 **Banka** | Bakiye görüntüleme, para transferi, işlem geçmişi |
| 🗺️ **GPS / Harita** | Waypoint koyma, hızlı yerler, koordinat girişi |
| 🎵 **Müzik Çalar** | Çalma listesi oluşturma, şarkı ekleme |
| 📷 **Galeri** | URL ile fotoğraf ekleme, silme, sosyal medyada paylaşma |
| 💼 **WorkHub (İş İlanları)** | İlan verme, başvurma, iletişim kurma |
| ⚙️ **Ayarlar** | 6 farklı tema, 6 duvar kağıdı, bildirim ayarları |

---

## 📦 Kurulum

### 1. Klasörü kopyala
```
resources/
  └── qb-phone/   ← buraya koy
```

### 2. SQL tablolarını oluştur
`qb_phone.sql` dosyasını phpMyAdmin veya HeidiSQL ile veritabanına import et.

### 3. server.cfg'ye ekle
```cfg
ensure qb-phone
```

### 4. Bağımlılıkları kontrol et
Şunların yüklü olduğundan emin ol:
- `qb-core`
- `oxmysql`

---

## ⌨️ Kullanım

| Tuş | Eylem |
|-----|-------|
| `F1` | Telefonu aç / kapat |
| `ESC` | Telefonu kapat |
| Kilidi kaydır/tıkla | Kilidi aç |

---

## ⚙️ Konfigürasyon

`config.lua` dosyasını düzenle:

```lua
Config.PhoneKey = 'F1'          -- Telefon açma tuşu
Config.SocialAppName = 'Squeak' -- Sosyal medya adı
Config.MaxJobAdDays = 7         -- İlan süresi (gün)
Config.MaxTransferAmount = 1000000 -- Max transfer limiti
```

---

## 📁 Dosya Yapısı

```
qb-phone/
├── fxmanifest.lua
├── config.lua
├── qb_phone.sql
├── client/
│   ├── main.lua       -- Telefon açma/kapama, NUI
│   ├── calls.lua      -- Arama sistemi
│   └── apps.lua       -- Uygulama NUI callbackleri
├── server/
│   ├── main.lua       -- Telefon numarası, rehber, mesaj, galeri, ayarlar
│   ├── calls.lua      -- Sunucu taraflı arama sistemi
│   ├── social.lua     -- Sosyal medya
│   ├── bank.lua       -- Banka & transferler
│   └── jobs.lua       -- İş ilanları & müzik
└── html/
    ├── index.html     -- Ana UI
    └── js/
        ├── nui.js     -- FiveM NUI köprüsü
        ├── main.js    -- Telefon durumu & navigasyon
        └── apps.js    -- Tüm uygulama UI'ları
```

---

## 🔧 Diğer Telefon Scriptleriyle Entegrasyon

Başka bir scriptten telefon numarası almak için:
```lua
-- Server tarafında
exports['qb-phone']:GetPhoneNumberByCitizenid(citizenid, function(number)
    print('Numara: ' .. tostring(number))
end)
```

---

## 📜 Lisans

Bu script tamamen ücretsiz ve açık kaynaklıdır. İstediğin gibi kullanabilir, değiştirebilirsin.

Leaklemeden önce iki kez düşün 😊
