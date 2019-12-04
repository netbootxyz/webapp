// Netboot.xyz
// Main Node.js app

var app = require('express')();
var express = require('express');
var fs = require('fs');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var request = require('request');
var yaml = require('js-yaml');

////// PATHS //////
//// Main ////
app.get("/", function (req, res) {
  res.sendFile(__dirname + '/public/index.html');
});
//// Public JS and CSS ////
app.use('/public', express.static(__dirname + '/public'));



// Socket IO connection
io.on('connection', function(socket){
  //// Socket Connect ////
  // Log Client and connection time
  console.log(socket.id + ' connected time=' + (new Date).getTime());
  socket.join(socket.id);
  ///////////////////////////
  ////// Socket events //////
  ///////////////////////////
  // When config info is requested send file list to client
  socket.on('getconfig', function(){
    fs.readdir('/menus', function (err, files) {
      if (err) {
        console.log('Unable to scan directory: ' + err);
      }
      io.sockets.in(socket.id).emit('renderconfig',files);
    });
  });
  // When a file is requested send it's contents to the client
  socket.on('editgetfile', function(filename){
    fs.readFile('/menus/' + filename, function (err, data) {
      if (err) {
        console.log('Unable to read file: ' + err);
      }
      io.sockets.in(socket.id).emit('editrenderfile',data.toString("utf8"),filename);
    });
  });
  // When the endpoints content is requested send it to the client
  socket.on('getlocal', function(filename){
    request.get('https://raw.githubusercontent.com/netbootxyz/netboot.xyz/development/endpoints.yml', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var endpoints = yaml.safeLoad(body);
            io.sockets.in(socket.id).emit('renderlocal',endpoints);
        }
    });
  });
});

// Spin up application on port 3000
http.listen(3000, function(){
  console.log('listening on *:3000');
});
