// Pieni staattinen kehityspalvelin ilman riippuvuuksia:
//   node tools/serve.js            -> http://localhost:8765
//   node tools/serve.js . 3000     -> toinen portti
// Tarvitaan, koska peli lataa js/ ja css/ erillisinä tiedostoina.
var http = require('http');
var fs = require('fs');
var path = require('path');
var root = path.resolve(process.argv[2] || path.join(__dirname, '..'));
var port = parseInt(process.argv[3] || '8765', 10);
var types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
};
http.createServer(function (req, res) {
  var urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  var file = path.resolve(path.join(root, urlPath));
  if (file.toLowerCase().indexOf(root.toLowerCase()) !== 0) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, function (err, data) {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}).listen(port, function () { console.log('serving ' + root + ' on http://localhost:' + port); });
