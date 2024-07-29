// Simple standalone test to see what version of SSL/TLS version we are using.

const https = require('https')

const options = {
    hostname: 'www.howsmyssl.com',
    port: 443,
    path: '/a/check',
    method: 'GET',
    secureProtocol: "TLSv1_2_method"
}

let data = null;

https.request(options, res => {
  let body = ''
  res.on('data', d => body += d)
  res.on('end', () => {
    data = JSON.parse(body)
    console.log('SSL Version: ' + data.tls_version)
    
    process.exit(0);
  })
}).on('error', err => {
  // This gets called if a connection cannot be established.
  console.warn(err)
  process.exit(1);
}).end()