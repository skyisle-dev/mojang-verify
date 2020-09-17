'use strict';

const Express = require('express')
const app = Express()
const request = require('request')

const fs = require('fs')

const discord = require('discord.js')
const client = new discord.Client()

const keyMap = new Map()
const unverifyKeyMap = new Map()

app.use(Express.urlencoded())
app.use(Express.static('./webroot'))

app.get('/tos', (req,res) => {
    return res.sendFile(__dirname + '/webroot/tos.html')
})

app.get('/', (req,res) => {
    if(req.query.dd === undefined || req.query.dd.replace(' ','') === '') {
        return res.sendStatus(404)
    }

    if(check(req.query.dd) === 'NotFoundUser') {
        return res.send('<script>alert("존재하지 않습니다."); history.back()</script>')
    }
    if(check(req.query.dd) === 'AlreadyVerifed') {
        return res.send('<script>alert("이미 인증이 되어있습니다."); history.back()</script>')
    }

    return res.sendFile(__dirname + '/lgForm.html')
})

/*
app.get('/:discordid', (req, res) => {
    return res.sendFile(__dirname + '/webroot/verify_frm.html')
})
*/

app.get('/finish', (req, res) => {
    return res.send('인증(취소)되었습니다. 이 창을 닫으셔도 됩니다')
})

function check(dd) {
    const guild = client.guilds.cache.get('748537416435892294')
    console.log(guild.name)
    console.log(keyMap)
    const id = keyMap.get(dd)
    
    const member = guild.members.cache.get(id)

    if(member === undefined) {
        return 'NotFoundUser'
    }
    if(member.roles.cache.has('749569591973511188')) {
        return 'AlreadyVerifed'
    }
    return 'NeedVerify'
}

function check2(dd) {
    const guild = client.guilds.cache.get('748537416435892294')
    console.log(guild.name)
    console.log(unverifyKeyMap)
    const id = unverifyKeyMap.get(dd)
    
    const member = guild.members.cache.get(id)

    if(member === undefined) {
        return 'NotFoundUser'
    }
    if(member.roles.cache.has('749569591973511188')) {
        return 'AlreadyVerifed'
    }
    return 'NeedVerify'
}

app.get('/unverify', (req,res) => {
    if(req.query.dd === undefined || req.query.dd.replace(' ','') === '') {
        return res.send('<script>alert("잘못된 요청입니다."); history.back()</script>')
    }
    if(!unverifyKeyMap.has(req.query.dd)) {
        return res.send('<script>alert("잘못된 요청입니다."); history.back()</script>')
    }
    const guild = client.guilds.cache.get('748537416435892294')
    console.log(guild.name)
    const id = unverifyKeyMap.get(req.query.dd)
    const member = guild.members.cache.get(id)
    member.roles.remove(guild.roles.cache.get('749569591973511188'))
    fs.readFile('./' + id + '.txt', (err, data) => {
        if(err) { console.log(err) }
        fs.unlinkSync(`./${data}.txt`)
        fs.unlinkSync(`./${id}.txt`)
        unverifyKeyMap.delete(req.body.dd)
        return res.send('<script>alert("성공적으로 인증이 취소되었습니다."); location.href = "/finish"</script>')
    })
    
})

app.post('/verify', (req,res) => {

    if(check(req.body.dd) === 'NotFoundUser') {
        return res.send('<script>alert("잘못된 요청입니다."); history.back()</script>')
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
            if(err) {
                keyMap.delete(req.body.dd)
                return res.send('<script>alert("Mojang 인증서버로 접속할 수 없습니다."); history.back()</script>')
            }
            
            const ps = JSON.parse(body)

            if(ps.error === 'ForbiddenOperationException') { 
                keyMap.delete(req.body.dd)
                return res.send('<script>alert("비밀번호가 틀렸습니다."); history.back()</script>') 
            }
            if(ps.error !== undefined) {
                keyMap.delete(req.body.dd)
                return res.send('<script>alert("오류가 났습니다. ' + ps.error + '"); history.back()</script>')
            }

            if(fs.existsSync(`./${ps.selectedProfile.name}_${req.body.email}.txt`)) {
                keyMap.delete(req.body.dd)
                return res.send('<script>alert("이미 인증이 되어있습니다."); history.back()</script>')
            }

            if(ps.error === undefined) {
                const guild = client.guilds.cache.get('748537416435892294')
                console.log(guild.name)
                const id = keyMap.get(req.body.dd)
                const member = guild.members.cache.get(id)
                member.roles.add(guild.roles.cache.get('749569591973511188'))
                fs.writeFileSync(`./${ps.selectedProfile.name}_${req.body.email}.txt`, '')
                fs.writeFileSync(`./${id}.txt`, `${ps.selectedProfile.name}_${req.body.email}`)
                keyMap.delete(req.body.dd)
                return res.send('<script>alert("인증되었습니다."); location.href = "/finish"</script>')
            }
            
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

function makeid(length) {
    /*
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
    */
   const uuid = require('uuid').v4
   return uuid()
 } 
 //dddd

client.on('message', (msg) => {
    if(msg.author.bot) return
    if(msg.channel.type === 'dm') {
        return msg.channel.send('DM에서는 이용하실 수 없습니다.')
    }

    if(msg.member.hasPermission('ADMINISTRATOR') && msg.content.startsWith('/클리어') && !isNaN(parseInt(msg.content.split(' ')[1]))) {
        msg.channel.bulkDelete(parseInt(msg.content.split(' ')[1]))
    }

    if(msg.content === '/인증' && msg.channel.id === '749832727485743216') {
        if(!msg.member.roles.cache.has('749569591973511188')) {
            const key = makeid(120)
            keyMap.set(key, msg.member.id)
            msg.author.send(process.env.SKYISLE_VERIFY_DOMAIN + '/?dd=' + key + ' 에서 인증하실수 있습니다.')
            msg.channel.send('DM을 확인하세요!(이 메시지는 2초 후 지워집니다)').then((msg1) => {
                setTimeout(() => {
                    msg.delete()
                    msg1.delete()
                }, 2000)
            })
            return
            
        }
        msg.channel.send('이미 인증이 되어 있습니다.(이 메시지는 2초 후에 지워집니다)').then((msg1) => {
            setTimeout(() => {
                msg.delete()
                msg1.delete()
            }, 2000)
        })
        return
    }

    if(msg.content === '/인증취소' && msg.channel.id === '749867750746357762') {
        if(msg.member.roles.cache.has('749569591973511188')) {
            const key = makeid(120)
            unverifyKeyMap.set(key, msg.member.id)
            msg.author.send(process.env.SKYISLE_VERIFY_DOMAIN + '/unverify?dd=' + key + ' 에서 인증하실수 있습니다.')
            msg.channel.send('DM을 확인하세요!(이 메시지는 2초 후 지워집니다)').then((msg1) => {
                setTimeout(() => {
                    msg.delete()
                    msg1.delete()
                }, 2000)
            })
            return
            
        }
        msg.channel.send('인증이 되어있지 않습니다.(이 메시지는 2초 후에 지워집니다)').then((msg1) => {
            setTimeout(() => {
                msg.delete()
                msg1.delete()
            }, 2000)
        })
        return
    }
    
})

const port = process.env.PORT || 80;

app.listen(port, () => {
    console.log('server open on 80')
})

client.login(process.env.SKYISLE_BOT_TOKEN)


/*
var http = require("http");
setInterval(function() {
    http.get("http://skyisle-verify.herokuapp.com");
}, 300000); // every 5 minutes (300000)
*/