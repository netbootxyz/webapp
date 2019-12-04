// Netboot.xyz
// Client side javascript


// Initiate a websocket connection to the server
var host = window.location.hostname; 
var port = window.location.port;
var protocol = window.location.protocol;
var socket = io.connect(protocol + '//' + host + ':' + port, {});
// If the page is being loaded for the first time render in the homepage
$(document).ready(function(){renderhome()})


//// Home Page rendering ////
function renderhome(){
  $('.nav-item').removeClass('active');
  $('#pagecontent').append('<center><div class="spinner-grow" style="width: 3rem; height: 3rem;" role="status"><span class="sr-only">Loading...</span></div><br><h2>Getting Config Items</h2></center>');
  socket.emit('getconfig');
}
socket.on('renderconfig', function(response){
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
  $.each(response, function( index, value ) {
    $('#bd-docs-nav').append('\
    <div class="bd-toc-item">\
      <div style="cursor:pointer;" class="bd-toc-link" onclick="editgetfile(\'' + value + '\')">\
        ' + value + '\
      </div>\
    </div>');
  });
});
// Render edit window
function editgetfile(filename){
  $('#configcontent').empty();
  $('#configcontent').append('<center><div class="spinner-grow" style="width: 3rem; height: 3rem;" role="status"><span class="sr-only">Loading...</span></div><br><h2>Getting File Contents</h2></center>');
  socket.emit('editgetfile',filename);
}
socket.on('editrenderfile', function(response,filename){
  $('#configcontent').empty();
  $('#configcontent').append('\
  <div class="container">\
    <div class="row">\
      <div class="col">\
        <h1 class="m-3">' + filename + '</h1>\
      </div>\
      <div class="col">\
        <button style="cursor:pointer;" onclick="saveconfig(\'' + filename + '\')" class="btn btn-success m-3 float-right" type="submit">Save Config</button>\
        <button style="cursor:pointer;" onclick="revertconfig(\'' + filename + '\')" class="btn btn-primary m-3 float-right" type="submit">Revert to Stock</button>\
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


//// Local rendering ////
function renderlocal(){
  $('.nav-item').removeClass('active');
  $('#pagecontent').append('<center><div class="spinner-grow" style="width: 3rem; height: 3rem;" role="status"><span class="sr-only">Loading...</span></div><br><h2>Getting Remote file list</h2></center>');
  socket.emit('getlocal');
}
socket.on('renderlocal', function(response){
  $('#pagecontent').empty();
  $.each(response.endpoints, function( index, value ) {
    $('#pagecontent').append(index + '<br>');
  });
});