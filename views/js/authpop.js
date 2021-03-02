document.getElementById('auth').addEventListener('click',()=>{
          var newWin = window.open('/auth',"Verify Your Identity","width=300,height=500");
          newWin.focus();
          newWin.onclose = ()=>{
            location.reload()
          }


        })