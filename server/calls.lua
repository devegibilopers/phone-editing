local QBCore = exports['qb-core']:GetCoreObject()
local ActiveCalls = {}

local function GetSourceByNumber(number, cb)
    exports['qb-phone']:GetSourceByNumber(number, cb)
end

local function GetPhoneNumberByCitizenid(citizenid, cb)
    exports['qb-phone']:GetPhoneNumberByCitizenid(citizenid, cb)
end

-- Make a call
RegisterNetEvent('qb-phone:server:makeCall', function(targetNumber)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end

    GetPhoneNumberByCitizenid(Player.PlayerData.citizenid, function(myNumber)
        if not myNumber then return end

        GetSourceByNumber(targetNumber, function(targetSrc)
            if not targetSrc then
                TriggerClientEvent('qb-phone:client:callDeclined', src, {callId = 'none', reason = 'offline'})
                return
            end

            local callId = myNumber .. '_' .. targetNumber .. '_' .. os.time()
            ActiveCalls[callId] = {
                caller = src,
                callerNumber = myNumber,
                receiver = targetSrc,
                receiverNumber = targetNumber,
                status = 'ringing',
                startTime = os.time()
            }

            -- Get caller name
            local callerName = Player.PlayerData.charinfo and
                (Player.PlayerData.charinfo.firstname .. ' ' .. Player.PlayerData.charinfo.lastname) or myNumber

            -- Notify receiver
            TriggerClientEvent('qb-phone:client:incomingCall', targetSrc, {
                callerName = callerName,
                callerNumber = myNumber,
                callId = callId
            })

            -- Log missed call after 30 seconds if not answered
            SetTimeout(30000, function()
                if ActiveCalls[callId] and ActiveCalls[callId].status == 'ringing' then
                    ActiveCalls[callId] = nil
                    TriggerClientEvent('qb-phone:client:callDeclined', src, {callId = callId, reason = 'no_answer'})
                    -- Save missed call
                    MySQL.insert('INSERT INTO qb_phone_calls (caller_number, receiver_number, status, duration) VALUES (?, ?, ?, ?)',
                        {myNumber, targetNumber, 'missed', 0})
                end
            end)
        end)
    end)
end)

RegisterNetEvent('qb-phone:server:answerCall', function(callId)
    local src = source
    if not ActiveCalls[callId] then return end

    ActiveCalls[callId].status = 'active'
    ActiveCalls[callId].answerTime = os.time()

    -- Ses kanalı oluştur (callId'den benzersiz bir sayı üretelim)
    local channelId = math.random(1000, 9999) 
    ActiveCalls[callId].channel = channelId

    -- Her iki oyuncuya da cevap bilgisini ve kanal ID'sini gönder
    TriggerClientEvent('qb-phone:client:callAnswered', ActiveCalls[callId].caller, {callId = callId, channel = channelId})
    TriggerClientEvent('qb-phone:client:callAnswered', src, {callId = callId, channel = channelId})
end)


-- RegisterNetEvent('qb-phone:server:answerCall', function(callId)
    -- local src = source
    -- if not ActiveCalls[callId] then return end

    -- ActiveCalls[callId].status = 'active'
    -- ActiveCalls[callId].answerTime = os.time()

    -- TriggerClientEvent('qb-phone:client:callAnswered', ActiveCalls[callId].caller, {callId = callId})
    -- TriggerClientEvent('qb-phone:client:callAnswered', src, {callId = callId})
-- end)

-- Decline call
RegisterNetEvent('qb-phone:server:declineCall', function(callId)
    local src = source
    if not ActiveCalls[callId] then return end

    local call = ActiveCalls[callId]
    TriggerClientEvent('qb-phone:client:callDeclined', call.caller, {callId = callId})
    TriggerClientEvent('qb-phone:client:callDeclined', call.receiver, {callId = callId})

    -- Save declined call
    MySQL.insert('INSERT INTO qb_phone_calls (caller_number, receiver_number, status, duration) VALUES (?, ?, ?, ?)',
        {call.callerNumber, call.receiverNumber, 'declined', 0})

    ActiveCalls[callId] = nil
end)

-- End call
-- RegisterNetEvent('qb-phone:server:endCall', function(callId)
    -- local src = source
    -- if not ActiveCalls[callId] then return end

    -- local call = ActiveCalls[callId]
    -- local duration = call.answerTime and (os.time() - call.answerTime) or 0

    -- TriggerClientEvent('qb-phone:client:callEnded', call.caller, {callId = callId, duration = duration})
    -- TriggerClientEvent('qb-phone:client:callEnded', call.receiver, {callId = callId, duration = duration})

    -- -- Save call history
    -- MySQL.insert('INSERT INTO qb_phone_calls (caller_number, receiver_number, status, duration) VALUES (?, ?, ?, ?)',
        -- {call.callerNumber, call.receiverNumber, 'completed', duration})

    -- ActiveCalls[callId] = nil
-- end)

-- calls.lua (Server-Side)
RegisterNetEvent('qb-phone:server:endCall', function(callId)
    local src = source
    if not ActiveCalls[callId] then return end

    local call = ActiveCalls[callId]
    local duration = call.answerTime and (os.time() - call.answerTime) or 0

    -- Her iki tarafa da bildirim gönder
    if call.caller then
        TriggerClientEvent('qb-phone:client:callEnded', call.caller, {callId = callId, duration = duration})
    end
    if call.receiver then
        TriggerClientEvent('qb-phone:client:callEnded', call.receiver, {callId = callId, duration = duration})
    end

    -- Geçmişi kaydet
    MySQL.insert('INSERT INTO qb_phone_calls (caller_number, receiver_number, status, duration) VALUES (?, ?, ?, ?)',
        {call.callerNumber, call.receiverNumber, 'completed', duration})

    ActiveCalls[callId] = nil
end)

-- Get call history
QBCore.Functions.CreateCallback('qb-phone:getCallHistory', function(source, cb)
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then return cb({}) end

    GetPhoneNumberByCitizenid(Player.PlayerData.citizenid, function(myNumber)
        if not myNumber then return cb({}) end
        MySQL.query([[
            SELECT c.*, 
                CASE WHEN c.caller_number = ? THEN 'outgoing' ELSE 'incoming' END as direction,
                (SELECT name FROM qb_phone_contacts WHERE citizenid = ? AND number = 
                    CASE WHEN c.caller_number = ? THEN c.receiver_number ELSE c.caller_number END LIMIT 1) as contact_name
            FROM qb_phone_calls c
            WHERE c.caller_number = ? OR c.receiver_number = ?
            ORDER BY c.created_at DESC
            LIMIT 50
        ]], {myNumber, Player.PlayerData.citizenid, myNumber, myNumber, myNumber}, function(result)
            cb(result or {})
        end)
    end)
end)
