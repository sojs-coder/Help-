var url = window.location.href;
url = url.split('?url=')[1];
var errorText = "Error 404";
var errorDiv = "fof";
var errorI = 0;
var errorTime = 1000;
function errorType(){
  document.getElementById(errorDiv).innerHTML += errorText.split('')[errorI];
  errorI++;
  if(errorText.length > errorI){
    setTimeout(errorType, errorTime/errorText.length);
  }
}
var bodyText = `Uh Oh, ${url} does not exist. It may be a bad link or a deleted file. Try the buttons below.`;
var bodyDiv = "body";
var bodyI = 0;
var bodyTime = 5000;
function bodyType(){
  document.getElementById(bodyDiv).innerHTML += bodyText.split('')[bodyI];
  bodyI++;
  if(bodyText.length > bodyI){
    setTimeout(bodyType, bodyTime/bodyText.length);
  }else{
    setTimeout(showButtons, 1000)
  }
}
function showButtons(){
  document.querySelectorAll('.buttons')[0].style.display = "block";
}
errorType();
setTimeout(bodyType, 2000)
