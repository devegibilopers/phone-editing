local QBCore = exports['qb-core']:GetCoreObject()

QBCore.Functions.CreateCallback('qb-phone:getBankData', function(source, cb)
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then return cb({balance = 0, transactions = {}}) end

    local balance = Player.PlayerData.money['bank'] or 0
    local cash = Player.PlayerData.money['cash'] or 0

    MySQL.query('SELECT * FROM qb_phone_transactions WHERE citizenid = ? ORDER BY created_at DESC LIMIT 30',
        {Player.PlayerData.citizenid}, function(result)
        cb({
            balance = balance,
            cash = cash,
            transactions = result or {}
        })
    end)
end)

QBCore.Functions.CreateCallback('qb-phone:bankTransfer', function(source, cb, data)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return cb({success = false, message = 'Oyuncu bulunamadı'}) end

    local amount = tonumber(data.amount)
    if not amount or amount <= 0 then
        return cb({success = false, message = 'Geçersiz miktar'})
    end

    if amount > Config.MaxTransferAmount then
        return cb({success = false, message = 'Maksimum transfer limiti aşıldı'})
    end

    local myBalance = Player.PlayerData.money['bank'] or 0
    if myBalance < amount then
        return cb({success = false, message = 'Yetersiz bakiye'})
    end

    -- Find receiver by phone number
    MySQL.query('SELECT citizenid FROM qb_phone_users WHERE phone_number = ?', {data.toNumber}, function(result)
        if not result or not result[1] then
            return cb({success = false, message = 'Numara kayıtlı değil'})
        end

        local receiverCitizenid = result[1].citizenid
        local ReceiverPlayer = QBCore.Functions.GetPlayerByCitizenId(receiverCitizenid)

        -- Deduct from sender
        Player.Functions.RemoveMoney('bank', amount, 'phone-transfer')

        -- Add to receiver (online or offline)
        if ReceiverPlayer then
            ReceiverPlayer.Functions.AddMoney('bank', amount, 'phone-transfer')
            TriggerClientEvent('qb-phone:client:bankTransaction', ReceiverPlayer.PlayerData.source, {
                message = '💸 ' .. (Player.PlayerData.charinfo.firstname .. ' ' .. Player.PlayerData.charinfo.lastname) ..
                    ' tarafından $' .. amount .. ' transfer aldınız.'
            })
        else
            -- Offline player — update DB directly
            MySQL.query('UPDATE players SET money = JSON_SET(money, \'$.bank\', JSON_EXTRACT(money, \'$.bank\') + ?) WHERE citizenid = ?',
                {amount, receiverCitizenid})
        end

        -- Save transaction for sender
        MySQL.insert('INSERT INTO qb_phone_transactions (citizenid, type, amount, description, other_party) VALUES (?, ?, ?, ?, ?)',
            {Player.PlayerData.citizenid, 'gönderildi', -amount, data.description or 'Transfer', data.toNumber})

        -- Save transaction for receiver
        MySQL.insert('INSERT INTO qb_phone_transactions (citizenid, type, amount, description, other_party) VALUES (?, ?, ?, ?, ?)',
            {receiverCitizenid, 'alındı', amount, data.description or 'Transfer', data.toNumber})

        -- Notify sender
        TriggerClientEvent('qb-phone:client:bankTransaction', src, {
            message = '✅ $' .. amount .. ' başarıyla transfer edildi.'
        })

        cb({success = true, message = '$' .. amount .. ' transfer edildi!'})
    end)
end)
