// netboot.xyz
// Main Node.js app

var baseurl = process.env.SUBFOLDER || '/';
var datapath = process.env.DATAPATH || '/';
var app = require('express')();
var { DownloaderHelper } = require('node-downloader-helper');
var exec = require('child_process').exec;
var express = require('express');
var fs = require('fs');
var http = require('http').Server(app);
var io = require('socket.io')(http, {path: baseurl + 'socket.io'});
var isBinaryFile = require("isbinaryfile").isBinaryFile;
var path = require('path');
var readdirp = require('readdirp');
var fetch = require('node-fetch');
var si = require('systeminformation');
const util = require('util');
var { version } = require('./package.json');
var yaml = require('js-yaml');
var baserouter = express.Router();
let ejs = require('ejs');

// Disable sigs on every startup in remote boot.cfg
disablesigs();
function disablesigs(){
  var bootcfgr = datapath + '/config/menus/remote/boot.cfg';
  var bootcfgl = datapath + '/config/menus/local/boot.cfg';
  var bootcfgm = datapath + '/config/menus/boot.cfg';
  if (fs.existsSync(bootcfgr) && ! fs.existsSync(bootcfgl)) {
    var data = fs.readFileSync(bootcfgr, 'utf8');
    var disable = data.replace(/set sigs_enabled true/g, 'set sigs_enabled false');
    fs.writeFileSync(bootcfgr, disable, 'utf8');
    fs.writeFileSync(bootcfgm, disable, 'utf8');
  }
}

////// PATHS //////
//// Main ////
baserouter.get("/", function (req, res) {
  res.render(__dirname + '/public/index.ejs', {baseurl: baseurl});
});
baserouter.get("/netbootxyz-web.js", function (req, res) {
  res.setHeader("Content-Type", "application/javascript");
  res.render(__dirname + '/public/netbootxyz-web.ejs', {baseurl: baseurl});
});
//// Public JS and CSS ////
baserouter.use('/public', express.static(__dirname + '/public'));

// Socket IO connection
io.on('connection', function(socket){
  //// Socket Connect ////
  // Log Client and connection time
  console.log(socket.id + ' connected time=' + (new Date).getTime());
  socket.join(socket.id);
  ///////////////////////////
  ////// Socket events //////
  ///////////////////////////
  // When dashboard info is requested send to client
  socket.on('getdash', function(){
    var tftpcmd = '/usr/sbin/dnsmasq --version | head -n1';
    var nginxcmd = '/usr/sbin/nginx -v';
    var dashinfo = {};
    dashinfo['webversion'] = version;
    dashinfo['menuversion'] = fs.readFileSync(datapath + '/config/menuversion.txt', 'utf8');
    fetch('https://api.github.com/repos/netbootxyz/netboot.xyz/releases/latest', {headers: {'user-agent': 'node.js'}})
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(body => {
        dashinfo['remotemenuversion'] = body.tag_name;
        si.cpu(function(cpu) {
          dashinfo['cpu'] = cpu;
          si.mem(function(mem) {
            dashinfo['mem'] = mem;
            si.currentLoad(function(currentLoad) {
              dashinfo['CPUpercent'] = currentLoad.currentload_user;
              exec(tftpcmd, function (err, stdout) {
                dashinfo['tftpversion'] = stdout;
                exec(nginxcmd, function (err, stdout, stderr) {
                   dashinfo['nginxversion'] = stderr;
                   io.sockets.in(socket.id).emit('renderdash',dashinfo);
                });
              });  
            });
          });
        });  
      })
      .catch(error => {
        console.log('There was a problem with the fetch operation: ' + error.message);
      });
    });
  // When upgrade is requested run it
  socket.on('upgrademenus', function(version){
    upgrademenu(version, function(response){
      io.sockets.in(socket.id).emit('renderdashhook');
    });
  });
  socket.on('upgrademenusdev', function(version){
    upgrademenu(version, function(response){
      io.sockets.in(socket.id).emit('renderconfighook');
    });
  });
  // When config info is requested send file list to client
  socket.on('getconfig', function(){
    var local_files = fs.readdirSync(datapath + '/config/menus/local',{withFileTypes: true}).filter(dirent => !dirent.isDirectory()).map(dirent => dirent.name);
    var remote_files = fs.readdirSync(datapath + '/config/menus/remote',{withFileTypes: true}).filter(dirent => !dirent.isDirectory()).map(dirent => dirent.name);
    io.sockets.in(socket.id).emit('renderconfig',remote_files,local_files);
  });
  // When a file is requested send it's contents to the client
  socket.on('editgetfile', function(filename,islocal){
    var file = datapath + '/config/menus/' + filename ;
    var data = fs.readFileSync(file);
    var stat = fs.lstatSync(file);
    isBinaryFile(data, stat.size).then((result) => {
      if (result) {
        io.sockets.in(socket.id).emit('editrenderfile','CANNOT EDIT THIS IS A BINARY FILE',filename,'nomenu');
      }
      else {
        io.sockets.in(socket.id).emit('editrenderfile',data.toString("utf8"),filename,islocal);
      }
    });
  });
  // When save is requested save it sync files and return user to menu
  socket.on('saveconfig', function(filename,text){
    fs.writeFileSync(datapath + '/config/menus/local/' + filename, text);
    layermenu(function(response){
      var local_files = fs.readdirSync(datapath + '/config/menus/local',{withFileTypes: true}).filter(dirent => !dirent.isDirectory()).map(dirent => dirent.name);
      var remote_files = fs.readdirSync(datapath + '/config/menus/remote',{withFileTypes: true}).filter(dirent => !dirent.isDirectory()).map(dirent => dirent.name);
      io.sockets.in(socket.id).emit('renderconfig',remote_files,local_files,filename,true);
    });
  });
  // When revert is requested delete it, sync files and return user to menu
  socket.on('revertconfig', function(filename){
    fs.unlinkSync(datapath + '/config/menus/local/' + filename);
    layermenu(function(response){
      var local_files = fs.readdirSync(datapath + '/config/menus/local',{withFileTypes: true}).filter(dirent => !dirent.isDirectory()).map(dirent => dirent.name);
      var remote_files = fs.readdirSync(datapath + '/config/menus/remote',{withFileTypes: true}).filter(dirent => !dirent.isDirectory()).map(dirent => dirent.name);
      io.sockets.in(socket.id).emit('renderconfig',remote_files,local_files);
    });
  });
  // When a create file is 
  socket.on('createipxe', function(filename){
    fs.writeFileSync(datapath + '/config/menus/local/' + filename, '#!ipxe');
    layermenu(function(response){
      var local_files = fs.readdirSync(datapath + '/config/menus/local',{withFileTypes: true}).filter(dirent => !dirent.isDirectory()).map(dirent => dirent.name);
      var remote_files = fs.readdirSync(datapath + '/config/menus/remote',{withFileTypes: true}).filter(dirent => !dirent.isDirectory()).map(dirent => dirent.name);
      io.sockets.in(socket.id).emit('renderconfig',remote_files,local_files,filename,true);
    });
  });
  // When the endpoints content is requested send it to the client
  socket.on('getlocal', async function(filename){
    var remotemenuversion = fs.readFileSync(datapath + '/config/menuversion.txt', 'utf8');
    var endpointsfile = fs.readFileSync(datapath + '/config/endpoints.yml');
    var endpoints = yaml.load(endpointsfile);
    var localfiles = await readdirp.promise('/assets/.');
    var assets = [];
    if (localfiles.length != 0){
      for (var i in localfiles){
        assets.push('/' + localfiles[i].path);
      }
    }
    io.sockets.in(socket.id).emit('renderlocal',endpoints,assets,remotemenuversion);
  });
  // When remote downloads are requested make folders and download
  socket.on('dlremote', function(dlfiles){
    dlremote(dlfiles, function(response){
      io.sockets.in(socket.id).emit('renderlocalhook');
    });
  });
  // When Local deletes are requested purge items
  socket.on('deletelocal', function(dlfiles){
    for (var i in dlfiles){
      var file = dlfiles[i];
      fs.unlinkSync('/assets' + file);
      console.log('Deleted /assets' + file);
      if (fs.existsSync('/assets' + file + '.part2')) {
        fs.unlinkSync('/assets' + file + '.part2');
        console.log('Deleted /assets' + file + '.part2');
      }
    }
    io.sockets.in(socket.id).emit('renderlocalhook');
  });
  // When Dev Browser is requested reach out to github for versions
  socket.on('devgetbrowser', async function(){
    var api_url = 'https://api.github.com/repos/netbootxyz/netboot.xyz/';
    var options = {headers: {'user-agent': 'node.js'}};
    var releasesResponse = await fetch(api_url + 'releases', options);
    if (!releasesResponse.ok) {
      throw new Error(`HTTP error! status: ${releasesResponse.status}`);
    }
    var releases = await releasesResponse.json();
    var commitsResponse = await fetch(api_url + 'commits', options);
    if (!commitsResponse.ok) {
      throw new Error(`HTTP error! status: ${commitsResponse.status}`);
    }
    var commits = await commitsResponse.json()
    io.sockets.in(socket.id).emit('devrenderbrowser', releases, commits);
  });
});


//// Functions ////

// Layer remote with local in the main tftp endpoint
function layermenu(callback){
  var local_files = fs.readdirSync(datapath + '/config/menus/local',{withFileTypes: true}).filter(dirent => !dirent.isDirectory()).map(dirent => dirent.name);
  var remote_files = fs.readdirSync(datapath + '/config/menus/remote',{withFileTypes: true}).filter(dirent => !dirent.isDirectory()).map(dirent => dirent.name);
  for (var i in remote_files){
    var file = remote_files[i];
    fs.copyFileSync(datapath + '/config/menus/remote/' + file, datapath + '/config/menus/' + file);
  }
  for (var i in local_files){
    var file = local_files[i];
    fs.copyFileSync(datapath + '/config/menus/local/' + file, datapath + '/config/menus/' + file);
  }
  callback(null, 'done');
}

// Upgrade menus to specified version
async function upgrademenu(version, callback){
  var remote_folder = datapath + '/config/menus/remote/';
  // Wipe current remote
  var remote_files = fs.readdirSync(datapath + '/config/menus/remote',{withFileTypes: true}).filter(dirent => !dirent.isDirectory()).map(dirent => dirent.name);
  for (var i in remote_files){
    var file = remote_files[i];
    fs.unlinkSync(remote_folder + file);
  }
  // Download files
  var downloads = [];
  var rom_files = ['netboot.xyz.kpxe',
                   'netboot.xyz-undionly.kpxe',
                   'netboot.xyz.efi',
                   'netboot.xyz-snp.efi',
                   'netboot.xyz-snponly.efi',
                   'netboot.xyz-arm64.efi',
                   'netboot.xyz-arm64-snp.efi',
                   'netboot.xyz-arm64-snponly.efi'];

  // This is a commit sha
  if (version.length == 40){
    var download_endpoint = 'https://s3.amazonaws.com/dev.boot.netboot.xyz/' + version + '/ipxe/';
    downloads.push({'url':'https://s3.amazonaws.com/dev.boot.netboot.xyz/' + version + '/menus.tar.gz','path':remote_folder});
  }
  // This is a regular release
  else{
    var download_endpoint = 'https://github.com/netbootxyz/netboot.xyz/releases/download/' + version + '/';
    downloads.push({'url':download_endpoint + 'menus.tar.gz','path':remote_folder});
  }
  for (var i in rom_files){
    var file = rom_files[i];
    var url = download_endpoint + file;    
    downloads.push({'url':url,'path':remote_folder});
  }
  // static config for endpoints
  downloads.push({'url':'https://raw.githubusercontent.com/netbootxyz/netboot.xyz/' + version +'/endpoints.yml','path': datapath + '/config/'});
  await downloader(downloads);
  var untarcmd = 'tar xf ' + remote_folder + 'menus.tar.gz -C ' + remote_folder;
  if (version.length == 40){
    var version = 'Development';
  }
  exec(untarcmd, function (err, stdout) {
    fs.unlinkSync(remote_folder + 'menus.tar.gz');
    fs.writeFileSync(datapath + '/config/menuversion.txt', version);
    layermenu(function(response){
      disablesigs();
      callback(null, 'done');
    });
  });
}

// Grab remote files
async function dlremote(dlfiles, callback){
  var dlarray = [];
  for (var i in dlfiles){
    var dlfile = dlfiles[i];
    var dlpath = datapath + '/assets' + path.dirname(dlfile);
    // Make destination directory
    fs.mkdirSync(dlpath, { recursive: true });
    // Construct array for use in download function
    var url = 'https://github.com/netbootxyz' + dlfile;
    dlarray.push({'url':url,'path':dlpath});
  }
  await downloader(dlarray);
  callback(null, 'done');
}

// downloader loop
async function downloader(downloads){
  var startTime = new Date();
  var total = downloads.length;
  for (var i in downloads){
    var value = downloads[i];
    var url = value.url;
    var path = value.path;
    var dloptions = {override:true,retry:{maxRetries:2,delay:5000}};
    var dl = new DownloaderHelper(url, path, dloptions);

    dl.on('end', function(){ 
      console.log('Downloaded ' + url + ' to ' + path);
    });

    dl.on('error', function(error) {
      console.error('Download failed:', error);
    });

    dl.on('progress', function(stats){
      var currentTime = new Date();
      var elaspsedTime = currentTime - startTime;
      if (elaspsedTime > 500) {
        startTime = currentTime;
        io.emit('dldata', url, [+i + 1,total], stats);
      }
    });

    await dl.start().catch(error => {
      console.error('Download failed:', error);
    });

    if ( ! url.includes('s3.amazonaws.com')){
      // Part 2 if exists repeat
      var response = await fetch(url + '.part2', {method: 'HEAD'});
      var urltest = response.headers.get('server');
      if (urltest == 'AmazonS3' || urltest == 'Windows-Azure-Blob/1.0 Microsoft-HTTPAPI/2.0') {
        var dl2 = new DownloaderHelper(url + '.part2', path, dloptions);
        dl2.on('end', function(){ 
          console.log('Downloaded ' + url + '.part2' + ' to ' + path);
        });
        dl2.on('progress', function(stats){
          var currentTime = new Date();
          var elaspsedTime = currentTime - startTime;
          if (elaspsedTime > 500) {
            startTime = currentTime;
            io.emit('dldata', url, [+i + 1,total], stats);
          }
        });
        await dl2.start();
      }
    }
  }
  io.emit('purgestatus');
}

app.use(baseurl, baserouter);

// Spin up application on port 3000 or set to WEB_APP_PORT env variable

const defaultPort = 3000;

let port = process.env.WEB_APP_PORT;

if (!Number.isInteger(Number(port)) || port < 1 || port > 65535) {
  console.warn(`Invalid port "${port}" in environment variable WEB_APP_PORT. Using default port ${defaultPort} instead.`);
  port = defaultPort;
}

http.listen(port, function(){
  console.log('listening on *:' + port);
});
