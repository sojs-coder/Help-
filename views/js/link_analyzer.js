var header_links = document.querySelectorAll('.nav-link');
var url = window.location.href;
url = url.split('?')[0];
url = url.split('#')[0]
if(url.indexOf('/home') !== -1 | url.indexOf('/~') !== -1 | url.indexOf('/authenticate') !== -1 |url.indexOf('/new') !== -1 | url.indexOf("/edit") !== -1 | url.indexOf("/plea") !== -1 | url.indexOf('/notifications') !== -1){
  url = url.replace('/home','/');
  url = url.replace('/~','/');
  url = url.replace('/authenticate','/pleas');
  url = url.replace('/new','/pleas');
  url = url.replace(/\/edit\/\w+/,'/pleas');
  url = url.replace(/\/plea\/-\w+/,'/pleas');
  url = url.replace('/notifications','/');

}
header_links.forEach((d)=>{
  var href = d.href;
  
  if(href == url){
    d.classList.add('active');
  }
});