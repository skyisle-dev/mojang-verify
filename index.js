'use strict';

const Express = require('express')
const app = Express()
const request = require('request')

const discord = require('discord.js')
const client = new discord.Client()

app.use(Express.urlencoded())
app.use(Express.static('./webroot'))

app.get('/', (req,res) => {
    if(req.query.dd === undefined || req.query.dd.replace(' ','') === '' || isNaN(parseInt(req.query.dd))) {
        return res.sendStatus(404)
    }

    if(check(req.query.dd) === 'NotFoundUser') {
        return res.send('<script>alert("존재하지 않습니다."); history.back()</script>')
    }
    if(check(req.query.dd) === 'AlreadyVerifed') {
        return res.send('<script>alert("이미 인증이 되어있습니다."); history.back()</script>')
    }

    return res.sendFile(__dirname + '/webroot/verify_frm.html')
})

/*
app.get('/:discordid', (req, res) => {
    return res.sendFile(__dirname + '/webroot/verify_frm.html')
})
*/

app.get('/finish', (req, res) => {
    return res.send('인증되었습니다. 이 창을 닫으셔도 됩니다')
})

function check(dd) {
    const guild = client.guilds.cache.get('748537416435892294')
    console.log(guild.name)
    const member = guild.members.cache.get(dd)

    if(member === undefined) {
        return 'NotFoundUser'
    }
    if(member.roles.cache.has('749569591973511188')) {
        return 'AlreadyVerifed'
    }
    return 'NeedVerify'
}

app.post('/verify', (req,res) => {

    if(check(req.body.dd) === 'NotFoundUser') {
        return res.send('<script>alert("존재하지 않습니다."); history.back()</script>')
    }
    if(check(req.body.dd) === 'AlreadyVerifed') {
        return res.send('<script>alert("이미 인증이 되어있습니다."); history.back()</script>')
    }
    if(check(req.body.dd) === 'NeedVerify') {
        request('https://authserver.mojang.com/authenticate', {
            body: JSON.stringify({
                agent: {
                    name: 'Minecraft',
                    version: 1
                },
                username: req.body.email,
                password: req.body.password
            }),
            method: 'POST'
        }, (err, res2, body) => {
            if(err) return res.send('<script>alert("Mojang 인증서버로 접속할 수 없습니다."); history.back()</script>')
            
            const ps = JSON.parse(body)
            if(ps.error === undefined) {
                const guild = client.guilds.cache.get('748537416435892294')
                console.log(guild.name)
                const member = guild.members.cache.get(req.body.dd)
                member.roles.add(guild.roles.cache.get('749569591973511188'))
                return res.send('<script>alert("인증되었습니다."); location.href = "/finish"</script>')
            }
            if(ps.error === 'ForbiddenOperationException') return res.send('<script>alert("비밀번호가 틀렸습니다."); history.back()</script>')
            if(ps.error !== undefined) return res.send('<script>alert("오류가 났습니다. ' + ps.error + '"); history.back()</script>')
        })
    }
})

client.on('ready', () => {
    client.user.setPresence({
        activity: {
            type: 'PLAYING',
            name: '/인증'
        }
    })
})

client.on('message', (msg) => {
    if(msg.author.bot) return
    if(msg.channel.type === 'dm') {
        return msg.channel.send('DM에서는 이용하실 수 없습니다.')
    }

    if(msg.content === '/인증') {
        if(!msg.member.roles.cache.has('749569591973511188')) {
            msg.author.send(process.env.SKYISLE_VERIFY_DOMAIN + '/?dd=' + msg.member.id + ' 에서 인증하실수 있습니다.')
            msg.channel.send('DM을 확인하세요!(이 메시지는 2초 후 지워집니다)').then((msg1) => {
                setTimeout(() => {
                    msg.delete()
                    msg1.delete()
                }, 2000)
            })
            return
            
        }
        msg.channel.send('이미 인증이 되어 있습니다.')
        return
    }
    
})

const port = process.env.PORT || 80;

app.listen(port, () => {
    console.log('server open on 80')
})

client.login(process.env.SKYISLE_BOT_TOKEN)