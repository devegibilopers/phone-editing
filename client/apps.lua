local QBCore = exports['qb-core']:GetCoreObject()

-- ==================== CONTACTS ====================
RegisterNUICallback('getContacts', function(data, cb)
    QBCore.Functions.TriggerCallback('qb-phone:getContacts', function(contacts)
        cb(contacts or {})
    end)
end)

RegisterNUICallback('addContact', function(data, cb)
    TriggerServerEvent('qb-phone:server:addContact', data)
    cb('ok')
end)

RegisterNUICallback('deleteContact', function(data, cb)
    TriggerServerEvent('qb-phone:server:deleteContact', data.id)
    cb('ok')
end)

RegisterNUICallback('updateContact', function(data, cb)
    TriggerServerEvent('qb-phone:server:updateContact', data)
    cb('ok')
end)

-- ==================== MESSAGES ====================
RegisterNUICallback('getMessages', function(data, cb)
    QBCore.Functions.TriggerCallback('qb-phone:getMessages', function(msgs)
        cb(msgs or {})
    end)
end)

RegisterNUICallback('getConversation', function(data, cb)
    QBCore.Functions.TriggerCallback('qb-phone:getConversation', function(msgs)
        cb(msgs or {})
    end, data.number)
end)

RegisterNUICallback('sendMessage', function(data, cb)
    TriggerServerEvent('qb-phone:server:sendMessage', data)
    cb('ok')
end)

RegisterNUICallback('deleteConversation', function(data, cb)
    TriggerServerEvent('qb-phone:server:deleteConversation', data.number)
    cb('ok')
end)

-- ==================== CALLS ====================
RegisterNUICallback('makeCall', function(data, cb)
    TriggerServerEvent('qb-phone:server:makeCall', data.number)
    cb('ok')
end)

RegisterNUICallback('getCallHistory', function(data, cb)
    QBCore.Functions.TriggerCallback('qb-phone:getCallHistory', function(calls)
        cb(calls or {})
    end)
end)

-- ==================== SOCIAL MEDIA ====================
RegisterNUICallback('getSocialPosts', function(data, cb)
    QBCore.Functions.TriggerCallback('qb-phone:getSocialPosts', function(posts)
        cb(posts or {})
    end)
end)

RegisterNUICallback('createSocialPost', function(data, cb)
    TriggerServerEvent('qb-phone:server:createSocialPost', data)
    cb('ok')
end)

RegisterNUICallback('likeSocialPost', function(data, cb)
    TriggerServerEvent('qb-phone:server:likePost', data.id)
    cb('ok')
end)

RegisterNUICallback('deleteSocialPost', function(data, cb)
    TriggerServerEvent('qb-phone:server:deletePost', data.id)
    cb('ok')
end)

-- ==================== BANK ====================
RegisterNUICallback('getBankData', function(data, cb)
    QBCore.Functions.TriggerCallback('qb-phone:getBankData', function(bankData)
        cb(bankData or {balance = 0, transactions = {}})
    end)
end)

RegisterNUICallback('bankTransfer', function(data, cb)
    QBCore.Functions.TriggerCallback('qb-phone:bankTransfer', function(result)
        cb(result)
    end, data)
end)

-- ==================== JOBS ====================
RegisterNUICallback('getJobAds', function(data, cb)
    QBCore.Functions.TriggerCallback('qb-phone:getJobAds', function(ads)
        cb(ads or {})
    end)
end)

RegisterNUICallback('createJobAd', function(data, cb)
    TriggerServerEvent('qb-phone:server:createJobAd', data)
    cb('ok')
end)

RegisterNUICallback('deleteJobAd', function(data, cb)
    TriggerServerEvent('qb-phone:server:deleteJobAd', data.id)
    cb('ok')
end)

RegisterNUICallback('applyJob', function(data, cb)
    TriggerServerEvent('qb-phone:server:applyJob', data.id)
    cb('ok')
end)

-- ==================== MUSIC ====================
RegisterNUICallback('getMusicPlaylists', function(data, cb)
    QBCore.Functions.TriggerCallback('qb-phone:getMusicPlaylists', function(pl)
        cb(pl or {})
    end)
end)

RegisterNUICallback('saveMusicPlaylist', function(data, cb)
    TriggerServerEvent('qb-phone:server:saveMusicPlaylist', data)
    cb('ok')
end)

RegisterNUICallback('deleteMusicPlaylist', function(data, cb)
    TriggerServerEvent('qb-phone:server:deleteMusicPlaylist', data.id)
    cb('ok')
end)

-- ==================== CAMERA / GALLERY ====================
RegisterNUICallback('getGallery', function(data, cb)
    QBCore.Functions.TriggerCallback('qb-phone:getGallery', function(photos)
        cb(photos or {})
    end)
end)

RegisterNUICallback('savePhoto', function(data, cb)
    TriggerServerEvent('qb-phone:server:savePhoto', data.url, data.caption)
    cb('ok')
end)

RegisterNUICallback('deletePhoto', function(data, cb)
    TriggerServerEvent('qb-phone:server:deletePhoto', data.id)
    cb('ok')
end)

-- Share photo to social media
RegisterNUICallback('sharePhotoToSocial', function(data, cb)
    TriggerServerEvent('qb-phone:server:createSocialPost', {
        content = data.caption or '📷 Bir fotoğraf paylaştım!',
        image = data.url
    })
    cb('ok')
end)

-- ==================== SETTINGS ====================
RegisterNUICallback('getSettings', function(data, cb)
    QBCore.Functions.TriggerCallback('qb-phone:getSettings', function(settings)
        cb(settings or {theme = 0, wallpaper = 0, brightness = 100, notifications = true})
    end)
end)

RegisterNUICallback('saveSettings', function(data, cb)
    TriggerServerEvent('qb-phone:server:saveSettings', data)
    cb('ok')
end)

-- Receive settings update from server
RegisterNetEvent('qb-phone:client:settingsUpdated', function(settings)
    SendNUIMessage({ action = 'settingsUpdated', settings = settings })
end)

-- ==================== SERVER NOTIFICATIONS FOR ALL APPS ====================

-- New message received
RegisterNetEvent('qb-phone:client:newMessage', function(data)
    SendNUIMessage({
        action = 'notification',
        app = 'messages',
        title = data.senderName or data.senderNumber,
        message = data.message,
        icon = '💬'
    })
    if not PhoneOpen then
        QBCore.Functions.Notify('💬 ' .. (data.senderName or data.senderNumber) .. ': ' .. data.message, 'primary', 5000)
    end
end)

-- New social post
RegisterNetEvent('qb-phone:client:newSocialPost', function(data)
    SendNUIMessage({ action = 'refreshSocial' })
end)

-- Bank transaction
RegisterNetEvent('qb-phone:client:bankTransaction', function(data)
    SendNUIMessage({
        action = 'notification',
        app = 'bank',
        title = 'Banka',
        message = data.message,
        icon = '🏦'
    })
end)

-- Job application received (for job poster)
RegisterNetEvent('qb-phone:client:jobApplication', function(data)
    SendNUIMessage({
        action = 'notification',
        app = 'jobs',
        title = 'İş Başvurusu',
        message = data.applicantName .. ' ilanınıza başvurdu!',
        icon = '💼'
    })
end)

-- ==================== GARAGE (VALE) ====================

-- Oyuncunun sahip olduğu tüm araçları getir
RegisterNUICallback('getGarageVehicles', function(data, cb)
    QBCore.Functions.TriggerCallback('qb-phone:getGarageVehicles', function(vehicles)
        cb(vehicles or {})
    end)
end)

-- Seçilen aracı oyuncunun yanına getir (spawn et)
RegisterNUICallback('spawnGarageVehicle', function(data, cb)
    if not data.plate then cb({ success = false, message = 'Plaka belirtilmedi' }) return end

    QBCore.Functions.TriggerCallback('qb-phone:spawnGarageVehicle', function(result)
        cb(result or { success = false, message = 'Sunucu yanıt vermedi' })
    end, data.plate)
end)
