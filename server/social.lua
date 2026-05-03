local QBCore = exports['qb-core']:GetCoreObject()

-- ==================== SOCIAL MEDIA ====================

QBCore.Functions.CreateCallback('qb-phone:getSocialPosts', function(source, cb)
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then return cb({}) end
    MySQL.query([[
        SELECT p.*, 
            (SELECT COUNT(*) FROM qb_phone_social_likes WHERE post_id = p.id) as likes,
            (SELECT COUNT(*) FROM qb_phone_social_likes WHERE post_id = p.id AND citizenid = ?) as liked
        FROM qb_phone_social_posts p
        ORDER BY p.created_at DESC
        LIMIT ?
    ]], {Player.PlayerData.citizenid, Config.MaxSocialPosts}, function(result)
        cb(result or {})
    end)
end)

RegisterNetEvent('qb-phone:server:createSocialPost', function(data)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end

    if #data.content > Config.SocialCharLimit then return end

    local authorName = Player.PlayerData.charinfo and
        (Player.PlayerData.charinfo.firstname .. ' ' .. Player.PlayerData.charinfo.lastname) or 'Anonim'

    MySQL.insert('INSERT INTO qb_phone_social_posts (citizenid, author_name, content, image) VALUES (?, ?, ?, ?)',
        {Player.PlayerData.citizenid, authorName, data.content, data.image or ''})

    -- Notify all online players
    local Players = QBCore.Functions.GetPlayers()
    for _, targetSrc in ipairs(Players) do
        TriggerClientEvent('qb-phone:client:newSocialPost', targetSrc)
    end
end)

RegisterNetEvent('qb-phone:server:likePost', function(id)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end

    MySQL.query('SELECT id FROM qb_phone_social_likes WHERE post_id = ? AND citizenid = ?',
        {id, Player.PlayerData.citizenid}, function(result)
        if result and #result > 0 then
            MySQL.query('DELETE FROM qb_phone_social_likes WHERE post_id = ? AND citizenid = ?',
                {id, Player.PlayerData.citizenid})
        else
            MySQL.insert('INSERT INTO qb_phone_social_likes (post_id, citizenid) VALUES (?, ?)',
                {id, Player.PlayerData.citizenid})
        end
    end)
end)

RegisterNetEvent('qb-phone:server:deletePost', function(id)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    MySQL.query('DELETE FROM qb_phone_social_posts WHERE id = ? AND citizenid = ?',
        {id, Player.PlayerData.citizenid})
end)
