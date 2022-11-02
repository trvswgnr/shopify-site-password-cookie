#!/usr/bin/env node

const http = require("http");
const readlineSync = require('readline-sync');
const parseCommand = require('./parse-command.js');

function getOutputString(cookieString) {
  const cookieArray = cookieString.split(';');
  const cookie = cookieArray[0].split('=');
  return `Name: ${cookie[0]}\nValue: ${cookie[1]}`;
}

const options = {
  "method": "POST",
  "hostname": "127.0.0.1",
  "port": "9292",
  "path": "/password",
  "headers": {
    "Accept": "*/*",
    "content-type": `multipart/form-data; boundary=---`
  }
};

const req = http.request(options, function (res) {
  const chunks = [];

  res.on("data", function (chunk) {
    chunks.push(chunk);
  });

  res.on("end", function () {
    try {
      const cookieString = res.headers['set-cookie'].find(cookie => cookie.includes('storefront_digest'));
      console.log(getOutputString(cookieString));
    } catch (e) {
      console.log('Incorrect password');
    }
  });
}).on('error', function (err) {
  console.log('There was an error with the request. Is the local server running at http://127.0.0.1:9292?');
});

const params = {
  password: {
    alias: 'p',
    type: String,
    description: 'Password to use to get the cookie'
  },
  help: {
    alias: 'h',
    type: Boolean,
    description: 'Show this help message',
    action(params) {
      console.log('Usage: shopify-cookie [options] [args]')
      for (let param of params) {
        let { name, alias, type, description } = param;
        if (alias) {
          console.log(`-${alias}, --${name}=${type.name}  ${description}`);
        } else {
          console.log(`--${name}=${type.name}  ${description}`);
        }
      }

      process.exit(0);
    }
  }
};

const opts = parseCommand(params);

let password = opts.password || opts.args[0];

if (!password) {
  password = readlineSync.question('Password: ', {
    hideEchoBack: true
  });
}

req.write(`-----\r\nContent-Disposition: form-data; name=\"form_type\"\r\n\r\nstorefront_password\r\n-----\r\nContent-Disposition: form-data; name=\"utf8\"\r\n\r\n✓\r\n-----\r\nContent-Disposition: form-data; name=\"password\"\r\n\r\n${password}\r\n-------\r\n`);

req.end();
