const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
  console.log('request here');
  // console.log(req);
  // console.log(req.url, req.method, req.headers);
  const url = req.url;
  const method = req.method;
  if(url==='/'){
    res.write(`
    <html lang="en">
    <head>
      <title>test</title>
    </head>
    <body>
     <form action="/message" method="POST">
      <input type="text" name="formMessage">
        <button type="submit" >send</button>
      </form>
    </body>
    </html>
    `)
    return res.end();

  }else if (url === '/message' && method === 'POST'){
    // const theMessage = url.parse(req.url, true).query.formMessage;
    // const theMessage = req.body.formMessage;
    const body = [];
    req.on('data', (chunk) => {
      console.log(chunk);
      body.push(chunk);
    });
    return req.on('end', () => {
      const parsedBody = Buffer.concat(body).toString();
      console.log(parsedBody);
      const message = parsedBody.split('=')[0];
      // fs.writeFileSync('message.txt', message);
      fs.writeFile('message.txt', message, (err)=>{
        res.statusCode = 302;
        res.setHeader('Location', '/');
        return res.end();
      })
    });
    // res.setHeader('Content-type', 'text/html');
    // res.write(`
    //   <!DOCTYPE html>
    //   <html lang="en">
    //   <head>
    //     <meta charset="UTF-8">
    //     <title>test</title>
    //   </head>
    //   <body>
    //     ${theMessage}
    //   </body>
    //   </html>
    //   `)
  }
   // return res.end();
  // process.exit();
});

server.listen(3000, '127.0.0.1', () => {
  console.log('Listening for requests now');
});

