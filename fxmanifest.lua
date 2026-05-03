fx_version 'cerulean'
game 'gta5'

author 'QB-Phone - Free & Open Source'
description 'Full-featured iOS-style phone for QBCore'
version '1.0.0'

shared_scripts {
    '@qb-core/shared/locale.lua',
    'config.lua'
}

client_scripts {
    '@qb-core/shared/locale.lua',
    'client/main.lua',
    'client/calls.lua',
    'client/apps.lua'
}

server_scripts {
    '@oxmysql/lib/MySQL.lua',
    'server/main.lua',
    'server/calls.lua',
    'server/social.lua',
    'server/bank.lua',
    'server/jobs.lua',
    'server/music.lua'
}

ui_page 'html/index.html'

files {
    'html/index.html',
    'html/css/style.css',
    'html/css/apps.css',
    'html/js/main.js',
    'html/js/apps.js',
    'html/js/nui.js',
    'html/sounds/*.mp3'
}

lua54 'yes'
