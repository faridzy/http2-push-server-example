'use strict'

const fs = require('fs')
const path = require('path')
const http2 = require('http2')
const helper = require('./helper')

const { HTTP2_HEADER_PATH } = http2.constants
const PORT = process.env.PORT || 4300
const PUBLIC_PATH = path.join(__dirname,'/public')

console.log(PUBLIC_PATH);

const publicFiles = helper.getFiles(PUBLIC_PATH)
const server = http2.createSecureServer({
  cert: fs.readFileSync(path.join(__dirname, '/ssl/cert.pem')),
  key: fs.readFileSync(path.join(__dirname, '/ssl/key.pem'))
}, onRequest)



function push (stream, path) {
  const file = publicFiles.get(path)

  if (!file) {
    return
  }

  console.log(file);

  stream.pushStream({ [HTTP2_HEADER_PATH]: path }, (pushStream) => {
   
    pushStream.respondWithFD(file.fileDescriptor, file.headers)
  })
}


function onRequest (req, res) {
  const reqPath = req.url === '/' ? '/index.html' : req.url
  const file = publicFiles.get(reqPath)

  
  if (!file) {
    res.statusCode = 404
    res.end()
    return
  }

  
  if (reqPath === '/index.html') {
    push(res.stream, 'assets1.js')
    push(res.stream, 'assets2.js')
  }

  
  res.stream.respondWithFD(file.fileDescriptor, file.headers)
}

server.listen(PORT, (err) => {
  if (err) {
    console.error(err)
    return
  }

  console.log(`Server listening on ${PORT}`)
})