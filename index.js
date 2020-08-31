'use strict';

const Express = require('express')
const app = Express()
const request = require('request')

app.use(Express.urlencoded())
app.use(Express.static('./webroot'))

app.get('/', (req,res) => {
    if(req.query.dd === undefined || req.query.dd.replace(' ','') === '' || isNaN(parseInt(req.query.dd))) {
        return res.sendStatus(404)
    }
    return res.sendFile(__dirname + '/webroot/verify_frm.html')
})

/*
app.get('/:discordid', (req, res) => {
    return res.sendFile(__dirname + '/webroot/verify_frm.html')
})
*/

app.post('/verify', (req,res) => {
    request('https://authserver.mojang.com/authenticate', {
        body: JSON.stringify({
            agent: {
                name: 'Minecraft',
                version: 1
            },
            username: req.body.email,
            password: req.body.password
        })
    }, (err, res, body) => {
        if(err) return res.send('<script>alert("Mojang 인증서버로 접속할 수 없습니다."); history.back()</script>')
        
        const ps = JSON.parse(body)
        if(ps.error === undefined) return res.send('<script>alert("인증되었습니다."); history.back()</script>')
        if(ps.error === 'ForbiddenOperationException') return res.send('<script>alert("비밀번호가 틀렸습니다."); history.back()</script>')
        if(ps.error !== undefined) return res.send('<script>alert("오류가 났습니다. ' + ps.error + '"); history.back()</script>')
    })
})

app.listen(80, () => {
    console.log('server open on 80')
})