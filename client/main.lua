local QBCore = exports['qb-core']:GetCoreObject()
local PhoneOpen = false
local PlayerData = {}
local PhoneNumber = nil

-- Initialize
AddEventHandler('QBCore:Client:OnPlayerLoaded', function()
    PlayerData = QBCore.Functions.GetPlayerData()
    TriggerServerEvent('qb-phone:server:getPhoneNumber')
end)

AddEventHandler('QBCore:Client:OnPlayerUnload', function()
    PlayerData = {}
    PhoneNumber = nil
    if PhoneOpen then ClosePhone() end
end)

RegisterNetEvent('QBCore:Client:OnJobUpdate', function(JobInfo)
    PlayerData.job = JobInfo
end)

-- Phone Number received from server
RegisterNetEvent('qb-phone:client:setPhoneNumber', function(number)
    PhoneNumber = number
end)

-- Open/Close Phone
RegisterCommand('phone', function()
    TogglePhone()
end)

RegisterKeyMapping('phone', 'Telefonu Aç/Kapat', 'keyboard', Config.PhoneKey)

function TogglePhone()
    if PhoneOpen then
        ClosePhone()
    else
        OpenPhone()
    end
end

function OpenPhone()
    -- Eğer numara nil veya varsayılan değerse sunucudan tekrar iste
    if not PhoneNumber or PhoneNumber == '000-000-000' then
        TriggerServerEvent('qb-phone:server:getPhoneNumber')
    end

    PhoneOpen = true
    SetNuiFocus(true, true)
    PlayerData = QBCore.Functions.GetPlayerData()

    SendNUIMessage({
        action = 'openPhone',
        playerData = {
            -- Burada kısa bir bekleme (wait) koyabilirsin veya direkt mevcut veriyi yolla
            name = PlayerData.charinfo and (PlayerData.charinfo.firstname .. ' ' .. PlayerData.charinfo.lastname) or 'Oyuncu',
            number = PhoneNumber or 'Yükleniyor...', -- 000 yerine Yükleniyor yazması daha profesyonel durur
            job = PlayerData.job and PlayerData.job.label or 'İşsiz',
            money = PlayerData.money and PlayerData.money['bank'] or 0,
        }
    })
end

function ClosePhone()
    PhoneOpen = false
    SetNuiFocus(false, false)
    SendNUIMessage({ action = 'closePhone' })
end

-- NUI Callbacks
RegisterNUICallback('closePhone', function(data, cb)
    ClosePhone()
    cb('ok')
end)

RegisterNUICallback('getPlayerData', function(data, cb)
    PlayerData = QBCore.Functions.GetPlayerData()
    cb({
        name = PlayerData.charinfo and (PlayerData.charinfo.firstname .. ' ' .. PlayerData.charinfo.lastname) or 'Oyuncu',
        number = PhoneNumber or '000-000-000',
        job = PlayerData.job and PlayerData.job.label or 'İşsiz',
        money = PlayerData.money and PlayerData.money['bank'] or 0,
        cash = PlayerData.money and PlayerData.money['cash'] or 0,
    })
end)

-- GPS / Waypoint
RegisterNUICallback('setWaypoint', function(data, cb)
    if data.x and data.y then
        SetNewWaypoint(data.x, data.y)
        QBCore.Functions.Notify('📍 Haritada işaretlendi!', 'success')
    end
    cb('ok')
end)

RegisterNUICallback('clearWaypoint', function(data, cb)
    ClearGpsPlayerWaypoint()
    QBCore.Functions.Notify('📍 İşaret kaldırıldı.', 'primary')
    cb('ok')
end)

-- Notification from server
RegisterNetEvent('qb-phone:client:notification', function(data)
    SendNUIMessage({
        action = 'notification',
        app = data.app,
        title = data.title,
        message = data.message,
        icon = data.icon or '📱'
    })
    -- Also show QBCore notification if phone is closed
    if not PhoneOpen then
        QBCore.Functions.Notify('📱 ' .. data.title .. ': ' .. data.message, 'primary', 5000)
    end
end)

-- Incoming Call
RegisterNetEvent('qb-phone:client:incomingCall', function(data)
    SendNUIMessage({
        action = 'incomingCall',
        callerName = data.callerName,
        callerNumber = data.callerNumber,
        callId = data.callId
    })
    if not PhoneOpen then
        OpenPhone()
    end
end)

RegisterNUICallback('answerCall', function(data, cb)
    TriggerServerEvent('qb-phone:server:answerCall', data.callId)
    cb('ok')
end)

RegisterNUICallback('declineCall', function(data, cb)
    TriggerServerEvent('qb-phone:server:declineCall', data.callId)
    cb('ok')
end)

RegisterNUICallback('endCall', function(data, cb)
    TriggerServerEvent('qb-phone:server:endCall', data.callId)
    cb('ok')
end)

RegisterNetEvent('qb-phone:client:callAnswered', function(data)
    SendNUIMessage({ action = 'callAnswered', callId = data.callId })
    
    -- PMA-Voice Entegrasyonu
    if data.channel then
        exports['pma-voice']:setCallChannel(data.channel)
        print("Ses kanalına bağlanıldı: " .. data.channel)
    end
end)

RegisterNetEvent('qb-phone:client:callDeclined', function(data)
    SendNUIMessage({ action = 'callDeclined', callId = data.callId })
end)

RegisterNetEvent('qb-phone:client:callEnded', function(data)
    -- Telefonun arayüzünü kapat/güncelle
    SendNUIMessage({ action = 'callEnded', callId = data.callId })
    
    -- Mumble kanalından çıkış (PMA-Voice)
    exports['pma-voice']:setCallChannel(0)
    
    -- Debug için konsola yazdır (sorun çözülünce silebilirsin)
    print("Arama bitti, ses kanalı sıfırlandı.") 
end)

-- Dışarıdaki aracın koordinatını plakadan bul
RegisterNUICallback('getVehicleLocation', function(data, cb)
    local plate = data.plate and data.plate:gsub('%s+', '') or ''
    local vehicles = GetGamePool('CVehicle')

    for _, veh in ipairs(vehicles) do
        local vehPlate = GetVehicleNumberPlateText(veh):gsub('%s+', '')
        if vehPlate == plate then
            local coords = GetEntityCoords(veh)
            cb({ coords = { x = coords.x, y = coords.y, z = coords.z } })
            return
        end
    end

    -- Araç havuzda bulunamadı (çok uzakta stream dışında olabilir)
    cb({ coords = nil })
end)

-- Haritaya waypoint koy + blip ekle
RegisterNUICallback('openMapMarker', function(data, cb)
    local coords = data.coords
    if not coords then cb({ success = false }) return end

    -- Waypoint
    SetNewWaypoint(coords.x, coords.y)

    -- Eski araç bliplerini temizle (üst üste gelmesin)
    for _, blip in ipairs(GetGamePool('CObject')) do end -- placeholder
    -- Blip ekle
    local blip = AddBlipForCoord(coords.x, coords.y, coords.z)
    SetBlipSprite(blip, 225)     -- araba ikonu
    SetBlipColour(blip, 3)       -- mavi
    SetBlipScale(blip, 0.8)
    SetBlipAsShortRange(blip, true)
    BeginTextCommandSetBlipName("STRING")
    AddTextComponentString(data.label or data.plate)
    EndTextCommandSetBlipName(blip)

    -- 30 saniye sonra blip'i kaldır
    SetTimeout(10000, function()
        if DoesBlipExist(blip) then
            RemoveBlip(blip)
        end
    end)

    cb({ success = true })
end)

-- ==================== GARAGE SPAWN HANDLER (FARLAR AÇIK + DİNAMİK TAKİP) ====================

RegisterNetEvent('qb-phone:client:spawnVehicle', function(vData)
    local playerPed = PlayerPedId()
    local playerCoords = GetEntityCoords(playerPed)
    local playerHeading = GetEntityHeading(playerPed)

    -- Spawn mesafesi (metre)
    local spawnDistance = 40.0
    local rad = math.rad(playerHeading)
    local spawnX = playerCoords.x + math.sin(rad) * spawnDistance
    local spawnY = playerCoords.y + math.cos(rad) * spawnDistance
    local spawnZ = playerCoords.z

    -- Zemin yüksekliğini al
    local groundZ = GetGroundZFor_3dCoord(spawnX, spawnY, spawnZ, false)
    if groundZ ~= spawnZ and groundZ ~= -1000.0 then
        spawnZ = groundZ
    else
        for i = 1, 10 do
            groundZ = GetGroundZFor_3dCoord(spawnX, spawnY, spawnZ - (i * 0.5), false)
            if groundZ ~= spawnZ - (i * 0.5) and groundZ ~= -1000.0 then
                spawnZ = groundZ
                break
            end
        end
    end

    local modelHash = GetHashKey(vData.model)

    -- Model yükle
    RequestModel(modelHash)
    local timeout = 0
    while not HasModelLoaded(modelHash) and timeout < 100 do
        Wait(100)
        timeout = timeout + 1
    end

    if not HasModelLoaded(modelHash) then
        QBCore.Functions.Notify('❌ Araç modeli yüklenemedi!', 'error', 4000)
        return
    end

    -- Aracı oluştur
    local vehicle = CreateVehicle(modelHash, spawnX, spawnY, spawnZ, playerHeading, true, false)
    SetVehicleNumberPlateText(vehicle, vData.plate)

    -- Motor ve gövde sağlığı (tamir)
    SetVehicleEngineHealth(vehicle, 1000.0)
    SetVehicleBodyHealth(vehicle, 1000.0)
    SetVehiclePetrolTankHealth(vehicle, 1000.0)

    -- Yakıt (full)
    local fuelAmount = 100.0
    if exports['qb-fuel'] then
        pcall(function()
            if exports['qb-fuel'].SetFuel then
                exports['qb-fuel']:SetFuel(vehicle, fuelAmount)
            elseif exports['qb-fuel'].setFuel then
                exports['qb-fuel']:setFuel(vehicle, fuelAmount)
            else
                SetVehicleFuelLevel(vehicle, fuelAmount)
            end
        end)
    else
        SetVehicleFuelLevel(vehicle, fuelAmount)
    end

    -- Modlar
    if vData.mods then
        local mods = type(vData.mods) == 'string' and json.decode(vData.mods) or vData.mods
        if mods and type(mods) == 'table' then
            for modType, modIndex in pairs(mods) do
                local mt = tonumber(modType)
                if mt then
                    SetVehicleMod(vehicle, mt, tonumber(modIndex) or 0, false)
                end
            end
        end
    end

    SetModelAsNoLongerNeeded(modelHash)

    -- Kapıları kitli
    SetVehicleDoorsLocked(vehicle, 2)

    -- FARLAR AÇIK (2 = uzun far? 3 = her ikisi de açık, gece için)
    SetVehicleLights(vehicle, 3)

    -- Sarı blip
    local blip = AddBlipForEntity(vehicle)
    SetBlipSprite(blip, 1)
    SetBlipColour(blip, 66)
    SetBlipScale(blip, 0.8)
    SetBlipAsShortRange(blip, true)
    BeginTextCommandSetBlipName("STRING")
    AddTextComponentString("🚗 Vale Aracı")
    EndTextCommandSetBlipName(blip)

    -- NPC vale sürücüsü
    local driverModel = GetHashKey('s_m_m_autoshop_01')
    RequestModel(driverModel)
    while not HasModelLoaded(driverModel) do Wait(0) end

    local driver = CreatePedInsideVehicle(vehicle, 26, driverModel, -1, true, false)
    SetPedIntoVehicle(driver, vehicle, -1)
    SetVehicleEngineOn(vehicle, true, true, false)
    SetVehicleLights(vehicle, 3) -- farlar açık (tekrar)

    -- Dinamik takip
    local follow = true
    local arrived = false

    Citizen.CreateThread(function()
        while not arrived and follow do
            Citizen.Wait(1000)
            local currentPlayerCoords = GetEntityCoords(playerPed)
            TaskVehicleDriveToCoord(driver, vehicle, currentPlayerCoords.x, currentPlayerCoords.y, currentPlayerCoords.z, 15.0, 0, modelHash, 786603, 5.0, true)
        end
    end)

    -- Yakınlık kontrolü
    Citizen.CreateThread(function()
        while not arrived do
            Citizen.Wait(200)
            local vehicleCoords = GetEntityCoords(vehicle)
            local currentPlayerCoords = GetEntityCoords(playerPed)
            local distance = #(vehicleCoords - currentPlayerCoords)
            if distance < 6.0 then
                arrived = true
                follow = false
                ClearPedTasks(driver)
                SetVehicleForwardSpeed(vehicle, 0.0)
                Wait(500)
                TaskLeaveVehicle(driver, vehicle, 0)
                Citizen.Wait(1000)
                DeleteEntity(driver)
                SetVehicleDoorsLocked(vehicle, 1)
                SetVehicleEngineOn(vehicle, true, true, false)
                SetVehicleLights(vehicle, 1) -- farları kapatma, istersen açık bırak (1 = kısa far)
                if DoesBlipExist(blip) then
                    RemoveBlip(blip)
                end
                if exports['qb-vehiclekeys'] then
                    exports['qb-vehiclekeys']:GiveKeys(vData.plate)
                end
                TriggerEvent('vehiclekeys:client:SetOwner', vData.plate)
                QBCore.Functions.Notify('🚗 Vale aracınız getirildi! Kapılar açık, anahtar sizde.', 'success', 4000)
                break
            end
        end
    end)
end)