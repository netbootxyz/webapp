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
    var upgradebutton = '<button onclick="upgrademenus(\'' + remotemenuversion + '\')" class="btn btn-success btn-sm">' + remotemenuversion + ' Available</button>'
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
          <tr><td>Upgrade Menus to latest</td><td><div id="upgradebutton">' + upgradebutton + '</div></td></tr>\
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
// Upgrade menu files
function upgrademenus(version){
  $('#upgradebutton').empty();
  $('#upgradebutton').append('<div class="spinner-grow" style="width: 1rem; height: 1rem;" role="status"><span class="sr-only">Loading...</span></div>');
  socket.emit('upgrademenus', version);
}
function upgrademenusdev(version){
  $('#configcontent').empty();
  $('#configcontent').append('<center><div class="spinner-grow" style="width: 3rem; height: 3rem;" role="status"><span class="sr-only">Loading...</span></div><br><h2>Pulling menus at version requested</h2></center>');
  socket.emit('upgrademenusdev', version);
}
// Re-render dash hook
socket.on('renderdashhook', function(){
  if($('#upgradebutton').length){
    renderdash();
  }
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
      <div id="configcontent" class="col-12 col-md-9 col-xl-10">\
        <center>\
          <h1>Please choose a file to edit<br>Or<br></h1>\
          <div class="form-row">\
            <div class="col-md-4"></div>\
            <div class="col-md-2"><input type="text" class="form-control ipxefilename" placeholder="myfile.ipxe"></div>\
            <div class="col-md-2"><button onclick="createipxe()" class="btn btn-primary form-control">Create New</button></div>\
            <div class="col-md-4"></div>\
          </div><br>\
          <div class="form-row">\
            <div class="col-md-4"></div>\
            <div class="col-md-4"><button onclick="devbrowser()" class="btn btn-outline-info form-control">Menu Development Versions</button></div>\
            <div class="col-md-4"></div>\
          </div>\
        </center>\
      </div>\
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
    var buttons = '<button onclick="saveconfig(\'' + filename + '\')" class="btn btn-success m-3 float-right">Save Config</button>';
  }
  else if (metadata == true){
    var buttons = '<button onclick="saveconfig(\'' + filename + '\')" class="btn btn-success m-3 float-right">Save Config</button>\
                   <button onclick="revertconfig(\'' + filename + '\')" class="btn btn-danger m-3 float-right">Revert/Delete</button>';
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
// Create a new file
function createipxe(){
  var filename = $('.ipxefilename').val().trim();
  if (filename){
  socket.emit('createipxe',filename);
  $('#pagecontent').empty();
  $('#pagecontent').append('<center><div class="spinner-grow" style="width: 3rem; height: 3rem;" role="status"><span class="sr-only">Loading...</span></div><br><h2>Creating File</h2></center>');
  }
}
// Render edit window
function devbrowser(){
  $('#configcontent').empty();
  $('#configcontent').append('<center><div class="spinner-grow" style="width: 3rem; height: 3rem;" role="status"><span class="sr-only">Loading...</span></div><br><h2>Getting Remote Development Versions</h2></center>');
  socket.emit('devgetbrowser');
}
socket.on('devrenderbrowser', function(releases,commits){
  $('#configcontent').empty();
  $('#configcontent').append('\
  <div class="card-group">\
    <div class="card">\
      <div class="card-header">\
        Development Commits\
      </div>\
      <div class="card-body">\
      <table class="table table-sm" id="commits">\
        <thead>\
          <tr>\
            <th>Commit</th>\
            <th></th>\
          </tr>\
        </thead>\
      </table>\
      </div>\
    </div>\
    <div class="card">\
      <div class="card-header">\
        Releases\
      </div>\
      <div class="card-body">\
      <table class="table table-sm" id="releases" style=".dataTables_filter {display:none;}">\
        <thead>\
          <tr>\
            <th>Release</th>\
            <th></th>\
          </tr>\
        </thead>\
      </table>\
      </div>\
    </div>\
  </div>');
  var tableoptions = {
    "paging": false,
    "bInfo" : false,
    'sDom': 't',
    "order": []
  };
  $("#commits").dataTable().fnDestroy();
  $("#releases").dataTable().fnDestroy();
  var commitstable = $('#commits').DataTable(tableoptions);
  var releasestable = $('#releases').DataTable(tableoptions);
  commitstable.clear();
  releasestable.clear();
  $.each(releases, function(index,value){
    releasestable.row.add( 
      [
        '<a target="_blank" href="' + value.html_url + '">' + value.tag_name + '</a>',
        '<span style="float:right;"><button onclick="upgrademenusdev(\'' + value.tag_name + '\')" class="btn btn-outline-success btn-sm">Download</button></span>'
      ]
    );
  });
  $.each(commits, function(index,value){
    commitstable.row.add( 
      [
        '<a target="_blank" href="' + value.html_url + '">' + value.sha + '</a>',
        '<span style="float:right;"><button onclick="upgrademenusdev(\'' + value.sha + '\')" class="btn btn-outline-success btn-sm">Download</button></span>'
      ]
    );
  });
  commitstable.draw();
  releasestable.draw();
});
// Re-render menus hook
socket.on('renderconfighook', function(){
  if($('#bd-docs-nav').length){
    renderconfig();
  }
});

//// Local rendering ////
function renderlocal(){
  $('#pagecontent').empty();
  $('#pagecontent').append('<center><div class="spinner-grow" style="width: 3rem; height: 3rem;" role="status"><span class="sr-only">Loading...</span></div><br><h2>Getting Remote file list</h2></center>');
  socket.emit('getlocal');
}
socket.on('renderlocal', function(endpoints,localfiles,remotemenuversion){
  $('#pagecontent').empty();
  $('#pagecontent').append('\
  <div class="card-group">\
    <div class="card">\
      <div class="card-header">\
        Remote Assets at <a target="_blank" href="https://github.com/netbootxyz/netboot.xyz/releases/' + remotemenuversion + '">' + remotemenuversion + '</a>\
        <span style="float:right;">\
          <div class="form-row">\
            <div class="col"><input type="text" class="form-control form-control-sm" id="remotesearch" placeholder="Filter.."></div>\
            <div class="col"><button onclick="remoteselect()" class="btn btn-primary btn-sm form-control form-control-sm">Select All</button></div>\
            <div class="col"><button onclick="remoteclear()" class="btn btn-secondary btn-sm form-control form-control-sm">Clear Selection</button></div>\
            <div class="col"><button onclick="dlremote()" class="btn btn-success btn-sm form-control form-control-sm">Pull Selected</button></div>\
          </div>\
        </span>\
      </div>\
      <div class="card-body">\
      <table class="table table-sm" id="remoteassets">\
        <thead>\
          <tr>\
            <th>Asset Name</th>\
            <th>Asset path</th>\
            <th></th>\
          </tr>\
        </thead>\
      </table>\
      </div>\
    </div>\
    <div class="card">\
      <div class="card-header">\
        Local Assets\
        <span style="float:right;">\
          <div class="form-row">\
            <div class="col"><input type="text" class="form-control form-control-sm" id="localsearch" placeholder="Filter.."></div>\
            <div class="col"><button onclick="localselect()" class="btn btn-primary btn-sm form-control form-control-sm">Select All</button></div>\
            <div class="col"><button onclick="localclear()" class="btn btn-secondary btn-sm form-control form-control-sm">Clear Selection</button></div>\
            <div class="col"><button onclick="deletelocal()" class="btn btn-danger btn-sm form-control form-control-sm">Delete Selected</button></div>\
          </div>\
        </span>\
      </div>\
      <div class="card-body">\
      <table class="table table-sm" id="untrackedassets" style=".dataTables_filter {display:none;}">\
        <thead>\
          <tr>\
            <th>Untracked Assets</th>\
            <th></th>\
          </tr>\
        </thead>\
      </table>\
      <table class="table table-sm" id="localassets" style=".dataTables_filter {display:none;}">\
        <thead>\
          <tr>\
            <th>Asset Name</th>\
            <th>Asset path</th>\
            <th></th>\
          </tr>\
        </thead>\
      </table>\
      </div>\
    </div>\
  </div>');
  var tableoptions = {
    "paging": false,
    "bInfo" : false,
    'sDom': 't',
    "order": [[ 0, "asc" ]]
  };
  $("#localassets").dataTable().fnDestroy();
  $("#remoteassets").dataTable().fnDestroy();
  var localtable = $('#localassets').DataTable(tableoptions);
  var remotetable = $('#remoteassets').DataTable(tableoptions);
  localtable.clear();
  remotetable.clear();
  $.each(endpoints.endpoints, function(index,value){
    $.each(value.files, function( arrindex, file ) {
      if (localfiles.includes(value.path + file)){
        localtable.row.add( 
          [
            index,
            value.path.split('download/')[1] + file,
            '<span style="float:right;"><input type="checkbox" class="form-check-input localcheck" value="' + value.path + file + '"></span>'

          ]
        );
        localfiles.splice( localfiles.indexOf(value.path + file), 1 );
      }
      else{
        remotetable.row.add( 
          [
            index,
            '<a href="https://github.com/netbootxyz' + value.path + file + '" target="_blank">' + value.path.split('download/')[1] + file + '</a>',
            '<span style="float:right;"><input type="checkbox" class="form-check-input remotecheck" value="' + value.path + file + '"></span>'
          ]
        );
      }
    });
  });
  if (localfiles.length != 0){
    var untrackedtable = $('#untrackedassets').DataTable(tableoptions);
    $.each(localfiles, function( arrindex, file ) {
      untrackedtable.row.add( 
        [
          '/assets' + file,
          '<span style="float:right;"><input type="checkbox" class="form-check-input localcheck" value="' + file + '"></span>'
        ]
      );
    });
    untrackedtable.draw();
  }
  remotetable.draw();
  localtable.draw();
  $('#localsearch').keyup(function(){
    localtable.search($(this).val()).draw() ;
  })
  $('#remotesearch').keyup(function(){
    remotetable.search($(this).val()).draw() ;
  })
});
function remoteselect(){   
  $('.remotecheck').each(function() {
    if (this.style.display != "none"){
      this.checked = true;
    }
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
// Download remote files
function dlremote(){
  var allfiles = $('.remotecheck');
  var dlfiles = [];
  $.each(allfiles, function( index, value ) {
    if($(this).is(":checked")){
      dlfiles.push($(this).val());
    }
  }).promise().done(function(){
    if(dlfiles.length != 0){
      socket.emit('dlremote',dlfiles);
    }
  });
}
// Re-render local hook
socket.on('renderlocalhook', function(){
  if($('#localassets').length){
   renderlocal();
  }
});
// Delete local files
function deletelocal(){
  var allfiles = $('.localcheck');
  var deletefiles = [];
  $.each(allfiles, function( index, value ) {
    if($(this).is(":checked")){
      deletefiles.push($(this).val());
    }
  }).promise().done(function(){
    if(deletefiles.length != 0){
      socket.emit('deletelocal',deletefiles);
    }
  });
}

//// Download Status Bars ////
socket.on('dldata', function(url, count, stats){
  $('#statusbar').empty();
  $('#statusbar').append('\
  <div class="row">\
    <div class="col-4">\
      ' + url.split('download/')[1] + '\
    </div>\
    <div class="col-2">\
      ' + count[0] + ' of ' + count[1] + '\
    </div>\
    <div class="col-6">\
      <div class="progress">\
        <div class="progress-bar" role="progressbar" style="width: ' + stats.progress + '%;" aria-valuenow="' + stats.progress + '" aria-valuemin="0" aria-valuemax="100"></div>\
      </div>\
    </div>\
  </dev>');
});
socket.on('purgestatus', function(){
  $('#statusbar').empty();
});
