local QBCore = exports['qb-core']:GetCoreObject()

-- ==================== JOB ADS ====================

QBCore.Functions.CreateCallback('qb-phone:getJobAds', function(source, cb)
    MySQL.query([[
        SELECT * FROM qb_phone_job_ads 
        WHERE expires_at > NOW() 
        ORDER BY created_at DESC 
        LIMIT ?
    ]], {Config.MaxJobAds}, function(result)
        cb(result or {})
    end)
end)

RegisterNetEvent('qb-phone:server:createJobAd', function(data)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end

    local authorName = Player.PlayerData.charinfo and
        (Player.PlayerData.charinfo.firstname .. ' ' .. Player.PlayerData.charinfo.lastname) or 'İsimsiz'

    MySQL.insert([[
        INSERT INTO qb_phone_job_ads (citizenid, author_name, title, description, salary, contact_number, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))
    ]], {
        Player.PlayerData.citizenid,
        authorName,
        data.title,
        data.description,
        data.salary or 0,
        data.contactNumber or '',
        Config.MaxJobAdDays
    })
end)

RegisterNetEvent('qb-phone:server:deleteJobAd', function(id)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    MySQL.query('DELETE FROM qb_phone_job_ads WHERE id = ? AND citizenid = ?',
        {id, Player.PlayerData.citizenid})
end)

RegisterNetEvent('qb-phone:server:applyJob', function(id)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end

    MySQL.query('SELECT * FROM qb_phone_job_ads WHERE id = ?', {id}, function(result)
        if not result or not result[1] then return end
        local ad = result[1]

        local applicantName = Player.PlayerData.charinfo and
            (Player.PlayerData.charinfo.firstname .. ' ' .. Player.PlayerData.charinfo.lastname) or 'Anonim'

        -- Notify the job poster if online
        local PosterPlayer = QBCore.Functions.GetPlayerByCitizenId(ad.citizenid)
        if PosterPlayer then
            TriggerClientEvent('qb-phone:client:jobApplication', PosterPlayer.PlayerData.source, {
                applicantName = applicantName,
                jobTitle = ad.title
            })
        end

        -- Send message to contact number
        if ad.contact_number and ad.contact_number ~= '' then
            -- Auto-message from applicant to contact
            TriggerEvent('qb-phone:server:sendMessage', {
                number = ad.contact_number,
                message = '📋 Merhaba! "' .. ad.title .. '" ilanınıza başvuruyorum. - ' .. applicantName
            })
        end

        QBCore.Functions.Notify(src, '✅ Başvurunuz iletildi!', 'success')
    end)
end)

-- ==================== MUSIC ====================

QBCore.Functions.CreateCallback('qb-phone:getMusicPlaylists', function(source, cb)
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then return cb({}) end
    MySQL.query('SELECT * FROM qb_phone_music WHERE citizenid = ? ORDER BY created_at DESC',
        {Player.PlayerData.citizenid}, function(result)
        -- Parse songs JSON
        if result then
            for _, pl in ipairs(result) do
                pl.songs = pl.songs and json.decode(pl.songs) or {}
            end
        end
        cb(result or {})
    end)
end)

RegisterNetEvent('qb-phone:server:saveMusicPlaylist', function(data)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end

    if data.id then
        MySQL.query('UPDATE qb_phone_music SET name = ?, songs = ? WHERE id = ? AND citizenid = ?',
            {data.name, json.encode(data.songs or {}), data.id, Player.PlayerData.citizenid})
    else
        MySQL.insert('INSERT INTO qb_phone_music (citizenid, name, songs) VALUES (?, ?, ?)',
            {Player.PlayerData.citizenid, data.name, json.encode(data.songs or {})})
    end
end)

RegisterNetEvent('qb-phone:server:deleteMusicPlaylist', function(id)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    MySQL.query('DELETE FROM qb_phone_music WHERE id = ? AND citizenid = ?',
        {id, Player.PlayerData.citizenid})
end)
