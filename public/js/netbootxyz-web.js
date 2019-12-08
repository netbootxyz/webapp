// Netboot.xyz
// Client side javascript


// Initiate a websocket connection to the server
var host = window.location.hostname; 
var port = window.location.port;
var protocol = window.location.protocol;
var socket = io.connect(protocol + '//' + host + ':' + port, {});
// If the page is being loaded for the first time render in the homepage
$(document).ready(function(){renderdash()})


//// Dashboard Page rendering ////
function renderdash(){
  $('#pagecontent').empty();
  $('#pagecontent').append('<center><div class="spinner-grow" style="width: 3rem; height: 3rem;" role="status"><span class="sr-only">Loading...</span></div><br><h2>Getting Dashboard</h2></center>');
  socket.emit('getdash');
}
socket.on('renderdash', function(response){
  var tftpversion = response.tftpversion;
  var nginxversion = response.nginxversion;
  var webversion = response.webversion;
  var menuversion = response.menuversion;
  var remotemenuversion = response.remotemenuversion;
  var cpustats = response.cpu;
  var cpupercent = response.CPUpercent;
  var memstats = response.mem;
  var usedmem = (memstats.active/memstats.total)*100;
  var totalmem = parseFloat(memstats.total/1000000000).toFixed(2);
  var diskbuffer = parseFloat(memstats.buffcache/1000000000).toFixed(2);
  if (menuversion != remotemenuversion){
    var upgradebutton = '<button style="cursor:pointer;" onclick="upgrademenus(\'' + remotemenuversion + '\')" class="btn btn-success btn-sm">' + remotemenuversion + ' Available</button>'
  }
  else{
    var upgradebutton = '<button class="btn btn-secondary btn-sm">Up to Date</button>'
  }
  $('#pagecontent').empty();
  $('#pagecontent').append('\
  <div class="card mb-3">\
    <div class="card-header">\
      Software and Services\
    </div>\
    <div class="card-body card-deck">\
      <div class="card mb-3">\
        <div class="card-header">\
          NETBOOT.XYZ\
        </div>\
        <div class="card-body">\
        <table class="table table-hover">\
          <tr><td>Webapp Version: </td><td><a target="_blank" href="https://github.com/netbootxyz/webapp/releases/' + webversion + '">' + webversion + '</a></td></tr>\
          <tr><td>Menus Version:</td><td><a target="_blank" href="https://github.com/netbootxyz/netboot.xyz/releases/' + menuversion + '">' + menuversion + '</a></td></tr>\
          <tr><td>Upgrade Menus to latest</td><td>' + upgradebutton + '</td></tr>\
        </table>\
        </div>\
      </div>\
      <div class="card mb-3">\
        <div class="card-header">\
          Services\
        </div>\
        <div class="card-body">\
        <table class="table table-hover">\
          <tr><td>TFTP:</td><td>' + tftpversion + '</td></tr>\
          <tr><td>WebServer:</td><td>' + nginxversion + '</td></tr>\
        </table>\
        </div>\
      </div>\
    </div>\
  </div>\
  <div class="card mb-3">\
    <div class="card-header">\
      System Stats\
    </div>\
    <div class="card-body card-deck">\
      <div class="card mb-3">\
        <div class="card-header">\
          CPU\
        </div>\
        <div class="card-body">\
        <table class="table table-hover">\
          <tr><td>CPU</td><td>' + cpustats.manufacturer + ' ' + cpustats.brand + '</td></tr>\
          <tr><td>Cores</td><td>' + cpustats.cores + '</td></tr>\
          <tr><td>Usage</td><td><div class="progress"><div class="progress-bar" role="progressbar" style="width: ' + cpupercent + '%;" aria-valuenow="' + cpupercent + '" aria-valuemin="0" aria-valuemax="100"></div></div></td></tr>\
        </table>\
        </div>\
      </div>\
      <div class="card mb-3">\
        <div class="card-header">\
          Memory\
        </div>\
        <div class="card-body">\
        <table class="table table-hover">\
          <tr><td>Total Mem</td><td>' + totalmem + 'G</td></tr>\
          <tr><td>Disk buffer</td><td>' + diskbuffer + 'G</td></tr>\
          <tr><td>Usage</td><td><div class="progress"><div class="progress-bar" role="progressbar" style="width: ' + usedmem + '%;" aria-valuenow="' + usedmem + '" aria-valuemin="0" aria-valuemax="100"></div></div></td></tr>\
        </table>\
        </div>\
      </div>\
    </div>\
  </div>\
  ');
});


//// Config Page rendering ////
function renderconfig(){
  $('#pagecontent').empty();
  $('#pagecontent').append('<center><div class="spinner-grow" style="width: 3rem; height: 3rem;" role="status"><span class="sr-only">Loading...</span></div><br><h2>Getting Config Items</h2></center>');
  socket.emit('getconfig');
}
socket.on('renderconfig', function(remote_files,local_files,filename,islocal){
  $('#pagecontent').empty();
  $('#pagecontent').append('\
  <div class="container-fluid">\
    <div class="row flex-xl-nowrap">\
      <div class="col-12 col-md-3 col-xl-2 bd-sidebar">\
        <button class="btn btn-link bd-search-docs-toggle d-md-none p-0 ml-3" type="button" data-toggle="collapse" data-target="#bd-docs-nav" aria-controls="bd-docs-nav" aria-expanded="false" aria-label="Toggle files navigation">\
          <svg xmlns="http://www.w3.org/2000/svg" viewbox="0 0 30 30" width="30" height="30" focusable="false">\
            <title>Files</title>\
            <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-miterlimit="10" d="M4 7h22M4 15h22M4 23h22"/>\
          </svg>\
        </button>\
        <nav class="collapse bd-links" id="bd-docs-nav">\
      </div>\
      <div id="configcontent" class="col-12 col-md-9 col-xl-10"><center><h1>Please choose a file to edit</h1></center></div>\
    </div>\
  </div>');
  $(local_files).each(function( index, value ) {
    $('#bd-docs-nav').append('\
    <div class="bd-toc-item">\
      <div style="cursor:pointer;" class="bd-toc-link" onclick="editgetfile(\'' + value + '\',true)">\
        ' + value + ' - custom\
      </div>\
    </div>');
  }).promise().done(function(){
    $(remote_files).each(function( index, value ) {
      if (! local_files.includes(value)){
        $('#bd-docs-nav').append('\
        <div class="bd-toc-item">\
          <div style="cursor:pointer;" class="bd-toc-link" onclick="editgetfile(\'' + value + '\',false)">\
            ' + value + '\
          </div>\
        </div>');
      }
    }).promise().done(function(){
      if (filename){
        socket.emit('editgetfile',filename,islocal);
      }
    });
  });
});
// Render edit window
function editgetfile(filename,islocal){
  $('#configcontent').empty();
  $('#configcontent').append('<center><div class="spinner-grow" style="width: 3rem; height: 3rem;" role="status"><span class="sr-only">Loading...</span></div><br><h2>Getting File Contents</h2></center>');
  socket.emit('editgetfile',filename,islocal);
}
socket.on('editrenderfile', function(response,filename,metadata){
  // Filter the buttons to display based on type
  if (metadata == 'nomenu'){
    var buttons = '';
  }
  else if (metadata == false){
    var buttons = '<button style="cursor:pointer;" onclick="saveconfig(\'' + filename + '\')" class="btn btn-success m-3 float-right" type="submit">Save Config</button>';
  }
  else if (metadata == true){
    var buttons = '<button style="cursor:pointer;" onclick="saveconfig(\'' + filename + '\')" class="btn btn-success m-3 float-right" type="submit">Save Config</button>\
                   <button style="cursor:pointer;" onclick="revertconfig(\'' + filename + '\')" class="btn btn-primary m-3 float-right" type="submit">Revert to Stock</button>';
  }
  $('#configcontent').empty();
  $('#configcontent').append('\
  <div class="container">\
    <div class="row">\
      <div class="col">\
        <h1 class="m-3">' + filename + '</h1>\
      </div>\
      <div class="col">\
        ' + buttons + '\
      </div>\
    </div>\
  </div>\
  <div id="editor" style="height:100%;width:100%"></div>');
  editor = ace.edit('editor');
  editor.setTheme('ace/theme/chrome');
  editor.session.setMode('ace/mode/sh');
  editor.$blockScrolling = Infinity;
  editor.setOptions({
    readOnly: false,
  });
  editor.setValue(response, -1);
});
// Save users file
function saveconfig(filename){
  var editor = ace.edit("editor");
  var text = editor.getValue();
  socket.emit('saveconfig',filename,text);
  $('#pagecontent').empty();
  $('#pagecontent').append('<center><div class="spinner-grow" style="width: 3rem; height: 3rem;" role="status"><span class="sr-only">Loading...</span></div><br><h2>Saving File</h2></center>');
}
// Delete a local file (revert)
function revertconfig(filename){
  socket.emit('revertconfig',filename);
  $('#pagecontent').empty();
  $('#pagecontent').append('<center><div class="spinner-grow" style="width: 3rem; height: 3rem;" role="status"><span class="sr-only">Loading...</span></div><br><h2>Reverting File</h2></center>');
}

//// Local rendering ////
function renderlocal(){
  $('.nav-item').removeClass('active');
  $('#pagecontent').append('<center><div class="spinner-grow" style="width: 3rem; height: 3rem;" role="status"><span class="sr-only">Loading...</span></div><br><h2>Getting Remote file list</h2></center>');
  socket.emit('getlocal');
}
socket.on('renderlocal', function(endpoints,remotemenuversion){
  $('#pagecontent').empty();
  $('#pagecontent').append('\
  <div class="card-group">\
    <div class="card">\
      <div class="card-header">\
        Remote Functions\
      </div>\
      <div class="card-body">\
      <table class="table table-sm" id="">\
      </table>\
      </div>\
    </div>\
    <div class="card">\
      <div class="card-header">\
        Local Functions\
      </div>\
      <div class="card-body">\
      <table class="table table-sm" id="">\
      </table>\
      </div>\
    </div>\
  </div>\
  <div class="card-group">\
    <div class="card">\
      <div class="card-header">\
        Remote Assets at <a target="_blank" href="https://github.com/netbootxyz/netboot.xyz/releases/' + remotemenuversion + '">' + remotemenuversion + '</a>\
        <span style="float:right;"><button onclick="remoteselect()" class="btn btn-primary btn-sm mr-2">Select All</button><button onclick="remoteclear()" class="btn btn-secondary btn-sm">Clear Selection</button></span>\
      </div>\
      <div class="card-body">\
      <table class="table table-sm" id="remoteassets">\
      </table>\
      </div>\
    </div>\
    <div class="card">\
      <div class="card-header">\
        Local Assets\
        <span style="float:right;"><button onclick="localselect()" class="btn btn-primary btn-sm mr-2">Select All</button><button onclick="localclear()" class="btn btn-secondary btn-sm">Clear Selection</button></span>\
      </div>\
      <div class="card-body">\
      <table class="table table-sm" id="localassets">\
      </table>\
      </div>\
    </div>\
  </div>');
  $.each(endpoints.endpoints, function( index, value ) {
    $.each(value.files, function( arrindex, file ) {
      $('#remoteassets').append('<tr><td><input type="checkbox" class="form-check-input remotecheck" id="fill"></td><td>' + index + '</td><td><a href="https://github.com/netbootxyz' + value.path + file + '" target="_blank">' + value.path.split('download/')[1] + file + '</a></td></tr>');
    });
  });
});
function remoteselect(){   
  $('.remotecheck').each(function() {
    this.checked = true;                        
  });
};
function remoteclear(){   
  $('.remotecheck').each(function() {
    this.checked = false;                        
  });
};
function localselect(){   
  $('.localcheck').each(function() {
    this.checked = true;                        
  });
};
function localclear(){   
  $('.localcheck').each(function() {
    this.checked = false;                        
  });
};