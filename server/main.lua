local QBCore = exports['qb-core']:GetCoreObject()

-- ==================== PHONE NUMBER SYSTEM ====================

-- Generate unique phone number
local function GeneratePhoneNumber()
    local num = ''
    for i = 1, Config.PhoneNumberLength do
        num = num .. math.random(0, 9)
    end
    -- Format: XXX-XXX-XXX
    return num:sub(1,3) .. '-' .. num:sub(4,6) .. '-' .. num:sub(7)
end

local function IsNumberTaken(number, cb)
    MySQL.query('SELECT id FROM qb_phone_users WHERE phone_number = ?', {number}, function(result)
        cb(result and #result > 0)
    end)
end

local function AssignPhoneNumber(citizenid, cb)
    MySQL.query('SELECT phone_number FROM qb_phone_users WHERE citizenid = ?', {citizenid}, function(result)
        if result and #result > 0 then
            cb(result[1].phone_number)
        else
            local function tryNumber()
                local newNumber = GeneratePhoneNumber()
                IsNumberTaken(newNumber, function(taken)
                    if taken then
                        tryNumber()
                    else
                        MySQL.insert('INSERT INTO qb_phone_users (citizenid, phone_number) VALUES (?, ?)', {citizenid, newNumber})
                        cb(newNumber)
                    end
                end)
            end
            tryNumber()
        end
    end)
end

RegisterNetEvent('phone:deleteMessage')
AddEventHandler('phone:deleteMessage', function(msgId)
    MySQL.Async.execute('DELETE FROM phone_messages WHERE id = @id', {
        ['@id'] = msgId
    })
end)

-- Get phone number on load
RegisterNetEvent('qb-phone:server:getPhoneNumber', function()
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end

    AssignPhoneNumber(Player.PlayerData.citizenid, function(number)
        TriggerClientEvent('qb-phone:client:setPhoneNumber', src, number)
    end)
end)

-- Helper: get number by citizenid
local function GetPhoneNumberByCitizenid(citizenid, cb)
    MySQL.query('SELECT phone_number FROM qb_phone_users WHERE citizenid = ?', {citizenid}, function(result)
        cb(result and result[1] and result[1].phone_number or nil)
    end)
end

-- Helper: get source by phone number
local function GetSourceByNumber(number, cb)
    MySQL.query('SELECT citizenid FROM qb_phone_users WHERE phone_number = ?', {number}, function(result)
        if result and result[1] then
            local Player = QBCore.Functions.GetPlayerByCitizenId(result[1].citizenid)
            cb(Player and Player.PlayerData.source or nil)
        else
            cb(nil)
        end
    end)
end

exports('GetPhoneNumberByCitizenid', GetPhoneNumberByCitizenid)
exports('GetSourceByNumber', GetSourceByNumber)

-- ==================== CONTACTS ====================

QBCore.Functions.CreateCallback('qb-phone:getContacts', function(source, cb)
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then return cb({}) end
    MySQL.query('SELECT * FROM qb_phone_contacts WHERE citizenid = ? ORDER BY name ASC', {Player.PlayerData.citizenid}, function(result)
        cb(result or {})
    end)
end)

RegisterNetEvent('qb-phone:server:addContact', function(data)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    MySQL.insert('INSERT INTO qb_phone_contacts (citizenid, name, number, avatar) VALUES (?, ?, ?, ?)',
        {Player.PlayerData.citizenid, data.name, data.number, data.avatar or ''})
end)

RegisterNetEvent('qb-phone:server:deleteContact', function(id)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    MySQL.query('DELETE FROM qb_phone_contacts WHERE id = ? AND citizenid = ?', {id, Player.PlayerData.citizenid})
end)

RegisterNetEvent('qb-phone:server:updateContact', function(data)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    MySQL.query('UPDATE qb_phone_contacts SET name = ?, number = ?, avatar = ? WHERE id = ? AND citizenid = ?',
        {data.name, data.number, data.avatar or '', data.id, Player.PlayerData.citizenid})
end)

-- ==================== MESSAGES ====================

QBCore.Functions.CreateCallback('qb-phone:getMessages', function(source, cb)
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then return cb({}) end
    MySQL.query([[
        SELECT m.*, 
            (SELECT name FROM qb_phone_contacts WHERE citizenid = ? AND number = m.sender_number LIMIT 1) as sender_name
        FROM qb_phone_messages m 
        WHERE m.receiver_citizenid = ? OR m.sender_citizenid = ?
        GROUP BY m.sender_number, m.receiver_citizenid
        ORDER BY m.created_at DESC
        LIMIT 50
    ]], {Player.PlayerData.citizenid, Player.PlayerData.citizenid, Player.PlayerData.citizenid}, function(result)
        cb(result or {})
    end)
end)

QBCore.Functions.CreateCallback('qb-phone:getConversation', function(source, cb, number)
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then return cb({}) end

    MySQL.query('SELECT phone_number FROM qb_phone_users WHERE citizenid = ?', {Player.PlayerData.citizenid}, function(myNumResult)
        if not myNumResult or not myNumResult[1] then return cb({}) end
        local myNumber = myNumResult[1].phone_number

        MySQL.query([[
            SELECT * FROM qb_phone_messages 
            WHERE (sender_number = ? AND receiver_number = ?) OR (sender_number = ? AND receiver_number = ?)
            ORDER BY created_at ASC
            LIMIT ?
        ]], {myNumber, number, number, myNumber, Config.MaxMessages}, function(result)
            -- Mark as read
            MySQL.query('UPDATE qb_phone_messages SET is_read = 1 WHERE receiver_citizenid = ? AND sender_number = ?',
                {Player.PlayerData.citizenid, number})
            cb(result or {})
        end)
    end)
end)

RegisterNetEvent('qb-phone:server:sendMessage', function(data)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end

    GetPhoneNumberByCitizenid(Player.PlayerData.citizenid, function(myNumber)
        if not myNumber then return end

        -- Find receiver
        MySQL.query('SELECT citizenid FROM qb_phone_users WHERE phone_number = ?', {data.number}, function(result)
            if not result or not result[1] then return end
            local receiverCitizenid = result[1].citizenid

            -- Save message
            MySQL.insert('INSERT INTO qb_phone_messages (sender_citizenid, sender_number, receiver_citizenid, receiver_number, message, is_read) VALUES (?, ?, ?, ?, ?, 0)',
                {Player.PlayerData.citizenid, myNumber, receiverCitizenid, data.number, data.message})

            -- Notify receiver if online
            GetSourceByNumber(data.number, function(receiverSrc)
                if receiverSrc then
                    local senderName = data.contactName or myNumber
                    TriggerClientEvent('qb-phone:client:newMessage', receiverSrc, {
                        senderName = senderName,
                        senderNumber = myNumber,
                        message = data.message
                    })
                end
            end)
        end)
    end)
end)

RegisterNetEvent('qb-phone:server:deleteConversation', function(number)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    MySQL.query('DELETE FROM qb_phone_messages WHERE (sender_citizenid = ? OR receiver_citizenid = ?) AND (sender_number = ? OR receiver_number = ?)',
        {Player.PlayerData.citizenid, Player.PlayerData.citizenid, number, number})
end)

-- ==================== SETTINGS ====================

QBCore.Functions.CreateCallback('qb-phone:getSettings', function(source, cb)
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then return cb({}) end
    MySQL.query('SELECT settings FROM qb_phone_users WHERE citizenid = ?', {Player.PlayerData.citizenid}, function(result)
        if result and result[1] and result[1].settings then
            cb(json.decode(result[1].settings))
        else
            cb({theme = 0, wallpaper = 0, brightness = 100, notifications = true})
        end
    end)
end)

RegisterNetEvent('qb-phone:server:saveSettings', function(data)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    MySQL.query('UPDATE qb_phone_users SET settings = ? WHERE citizenid = ?',
        {json.encode(data), Player.PlayerData.citizenid})
end)

-- ==================== GALLERY ====================

QBCore.Functions.CreateCallback('qb-phone:getGallery', function(source, cb)
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then return cb({}) end
    MySQL.query('SELECT * FROM qb_phone_gallery WHERE citizenid = ? ORDER BY created_at DESC', {Player.PlayerData.citizenid}, function(result)
        cb(result or {})
    end)
end)

RegisterNetEvent('qb-phone:server:savePhoto', function(url, caption)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    MySQL.insert('INSERT INTO qb_phone_gallery (citizenid, url, caption) VALUES (?, ?, ?)',
        {Player.PlayerData.citizenid, url, caption or ''})
end)

RegisterNetEvent('qb-phone:server:deletePhoto', function(id)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    MySQL.query('DELETE FROM qb_phone_gallery WHERE id = ? AND citizenid = ?', {id, Player.PlayerData.citizenid})
end)

-- ==================== GARAGE (VALE) ====================

-- Oyuncunun sahip olduğu tüm araçları getir
QBCore.Functions.CreateCallback('qb-phone:getGarageVehicles', function(source, cb)
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then cb({}) return end
    local citizenid = Player.PlayerData.citizenid

    MySQL.query([[
        SELECT
            pv.plate,
            pv.vehicle,
            pv.hash,
            pv.mods,
            pv.fuel,
            pv.engine,
            pv.state,
            pv.garage,
            pv.depotprice,
            vl.name as label
        FROM player_vehicles pv
        LEFT JOIN qb_phone_vehiclelabels vl ON vl.model = pv.vehicle
        WHERE pv.citizenid = ?
        ORDER BY pv.state ASC, pv.vehicle ASC
    ]], { citizenid }, function(result)
        if not result or #result == 0 then
            MySQL.query([[
                SELECT plate, vehicle, fuel, engine, state, garage
                FROM player_vehicles
                WHERE citizenid = ?
                ORDER BY state ASC, vehicle ASC
            ]], { citizenid }, function(r2)
                local vehicles = {}
                if r2 then
                    for _, v in ipairs(r2) do
                        table.insert(vehicles, {
                            plate   = v.plate,
                            model   = v.vehicle,
                            vehicle = v.vehicle,
                            label   = v.vehicle:gsub('^%l', string.upper),
                            fuel    = v.fuel or 100,
                            engine  = v.engine or 1000,
                            state   = v.state or 1,
                            garage  = v.garage or 'pillboxgarage',
                        })
                    end
                end
                cb(vehicles)
            end)
            return
        end

        local vehicles = {}
        for _, v in ipairs(result) do
            table.insert(vehicles, {
                plate   = v.plate,
                model   = v.vehicle,
                vehicle = v.vehicle,
                label   = v.label or v.vehicle:gsub('^%l', string.upper),
                fuel    = v.fuel or 100,
                engine  = v.engine or 1000,
                state   = v.state or 1,
                garage  = v.garage or 'pillboxgarage',
            })
        end
        cb(vehicles)
    end)
end)

-- Seçilen aracı oyuncunun yanına getir
QBCore.Functions.CreateCallback('qb-phone:spawnGarageVehicle', function(source, cb, plate)
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then cb({ success = false, message = 'Oyuncu bulunamadı' }) return end

    local citizenid = Player.PlayerData.citizenid

    -- Önce aracın bu oyuncuya ait olduğunu ve garajda olduğunu doğrula
    MySQL.query([[
        SELECT plate, vehicle, mods, fuel, engine, state
        FROM player_vehicles
        WHERE citizenid = ? AND plate = ? AND state = 1
        LIMIT 1
    ]], { citizenid, plate }, function(result)
        if not result or #result == 0 then
            cb({ success = false, message = 'Araç garajda bulunamadı veya zaten dışarıda' })
            return
        end

        local vData = result[1]

        -- Aracı "dışarıda" (state=0) olarak işaretle
        MySQL.update('UPDATE player_vehicles SET state = 0 WHERE citizenid = ? AND plate = ?',
            { citizenid, plate }, function(rowsChanged)
                if rowsChanged and rowsChanged > 0 then
                    -- Client'a araç bilgilerini gönder, spawn etmesini söyle
                    TriggerClientEvent('qb-phone:client:spawnVehicle', source, {
                        plate  = vData.plate,
                        model  = vData.vehicle,
                        mods   = vData.mods,
                        fuel   = vData.fuel or 100,
                        engine = vData.engine or 1000.0,
                    })
                    cb({ success = true })
                else
                    cb({ success = false, message = 'Veritabanı güncellenemedi' })
                end
            end)
    end)
end)


NUI.registerCallback('getVehicleLocation', function(source, data, cb)
    local plate = data.plate
    -- Tüm araçları tara, plakası eşleşeni bul
    local vehicles = GetAllVehicles()
    for _, veh in ipairs(vehicles) do
        local vehPlate = GetVehicleNumberPlateText(veh)
        if vehPlate and vehPlate:gsub('%s+', '') == plate:gsub('%s+', '') then
            local coords = GetEntityCoords(veh)
            cb({ coords = { x = coords.x, y = coords.y, z = coords.z } })
            return
        end
    end
    cb({ coords = nil }) -- bulunamadı
end)

NUI.registerCallback('openMapMarker', function(source, data, cb)
    -- Bu callback sadece client'a sinyal verir,
    -- asıl harita işlemi client tarafında yapılır
    cb({ success = true })
end)

-- Tüm konuşmayı silme (sadece alıcının tarafından)
QBCore.Functions.CreateCallback('qb-phone:server:deleteConversation', function(source, cb, data)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return cb(false) end
    local myNumber = Player.PlayerData.charinfo.phone
    local otherNumber = data.number

    MySQL.Async.execute('DELETE FROM phone_messages WHERE (sender_number = ? AND receiver_number = ?) OR (sender_number = ? AND receiver_number = ?)', 
        { myNumber, otherNumber, otherNumber, myNumber })
    cb(true)
end)

-- Tek bir mesaj silme (sadece gelen mesajlar için)
QBCore.Functions.CreateCallback('qb-phone:server:deleteMessage', function(source, cb, data)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return cb(false) end
    local myNumber = Player.PlayerData.charinfo.phone

    MySQL.Async.execute('DELETE FROM phone_messages WHERE id = ? AND receiver_number = ?', { data.id, myNumber })
    cb(true)
end)