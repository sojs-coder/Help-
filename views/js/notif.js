function timeDifference(date1, date2) {
  var difference = date1 - date2;
  var yearsDifference = Math.floor(difference / 1000 / 60 / 60 / 24 / 365);
  difference -= yearsDifference * 1000 * 60 * 60 * 24 * 365
  var daysDifference = Math.floor(difference / 1000 / 60 / 60 / 24);
  difference -= daysDifference * 1000 * 60 * 60 * 24

  var hoursDifference = Math.floor(difference / 1000 / 60 / 60);
  difference -= hoursDifference * 1000 * 60 * 60

  var minutesDifference = Math.floor(difference / 1000 / 60);
  difference -= minutesDifference * 1000 * 60

  var secondsDifference = Math.floor(difference / 1000);



  return {
    days: daysDifference,
    minutes: minutesDifference,
    hours: hoursDifference,
    seconds: secondsDifference,
    years: yearsDifference
  }
}
var now = new Date().getTime()
async function postData(url = '', data = {}) {
  // Default options are marked with *
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    body: JSON.stringify(data)
  });
  return response.json();
}
function read(notification, link) {
  postData('/readNotification', { notification: notification }).then((data) => {
    if (!link) {
      location.reload();
    } else {
      return;
    }
    //======A later Possiblitly======
    //      ~~~~~~~~~~~~~~~~~~~~     //
    //       (Look down)             //
    //                               //
    // var id = "notif" + data.notifID;
    // document.getElementById(id).style = "background-color: #eaeaea; border-radius: 6px; margin: 6px;";
    // var notifBlock = document.getElementById(id);
    // var title = document.querySelector("#" + id + " .title").innerHTML;
    // var subtitle = document.querySelector("#" + id + " .subtitle").innerHTML;
    // var des = document.querySelector("#" + id + " .text");
    // var buttonLink = document.querySelector("#" + id + " a").href;
    // var buttonTitle = document.querySelector("#" + id + " a").innerHTML;
    // var timestamp = document.querySelector("#"+id+ " ."+timestamp).innerHTML;
    // var assemble = `
    // <h5 class="card-title">${ title } <span class = "text-muted">${timestamp}
    //   </span></h5>
    // <h6 class="card-subtitle mb-2 text-muted">${subtitle}</h6>
    // <p class="card-text">${des}</p>
    // <div class = "btn-group" role = "group">
    // <a href="${buttonLink}" class="btn btn-primary">${buttonTitle}</a>
    // <button class = "btn-primary" disabled>Marked As Read</button>
    // </div>
    // `;
    // notifBlock.innerHTML = assemble;
  });

}
