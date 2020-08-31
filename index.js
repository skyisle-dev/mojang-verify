'use strict';

const Express = require('express')
const app = Express()

app.use(Express.urlencoded())
app.use(Express.static('./webroot'))

app.get('/', (req, res) => {
    return res.sendFile(__dirname + '/webroot/index.html')
})

app.listen(80, () => {
    console.log('server open on 80')
})