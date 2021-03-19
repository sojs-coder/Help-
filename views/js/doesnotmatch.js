 function getUrlParameter(sParam) {
    var sPageURL = window.location.href.split('?')[1]
    if (sPageURL) {
      var sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

      for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
          return typeof sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
        }
      }
    }
    return false;
  };
      
if(getUrlParameter('doesnotmatch') == 'true'){
  document.getElementById('errorMessage').innerHTML = "Username or password is incorrect";
}else if(getUrlParameter('exists') == 'true'){
  document.getElementById('errorMessage').innerHTML = "This username is already in use"
}