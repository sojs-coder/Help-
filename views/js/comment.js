var replybuttons = document.querySelectorAll('.reply-btn');
replybuttons.forEach((d)=>{
  d.onclick = function (e){
    reply(
      d.getAttribute('data-cm-commentID'),
      d,
      d.getAttribute('data-cm-rauthor'),
      d.getAttribute('data-cm-plea')
    )
  };
});
function reply(commentID,button,rauthor,pleaID){
  createFormReply(commentID,button,rauthor,pleaID);
}
/*
commentID,
author,
pleaID,
comment
*/
function createFormReply(commentID,button,rauthor,pleaID){
  var form = document.createElement('form');
  form.method = "POST";
  form.action = "/reply";
  var comment = document.createElement('textarea');
  comment.name = "comment1";
  var hidden1 = document.createElement('input');
  hidden1.type = 'hidden';
  hidden1.name = "commentID";
  hidden1.value = commentID;
  var hidden2 = document.createElement('input');
  hidden2.type = 'hidden';
  hidden2.name = "rauthor";
  hidden2.value = rauthor;
  var hidden3 = document.createElement('input');
  hidden3.type = 'hidden';
  hidden3.name = "pleaID";
  hidden3.value = pleaID;
  var submit = document.createElement('input');
  submit.type = "submit";
  sumbit.value = "reply";
  //submit.addClass('btn');
  //submit.addClass('btn-success');
  form.appendChild(comment);
  form.appendChild(hidden1);
  form.appendChild(hidden2);
  form.appendChild(hidden3);
  form.appendChild(submit);
  button.parentElement.appendChild(form);
  button.remove();
}