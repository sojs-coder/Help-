/* Require statments */
var ex = require('express'),
  swig = require('swig'), app = ex();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer();
const session = require('express-session');
const cookieParser = require('cookie-parser');
const crypto = require('crypto-js');
const http = require('http').createServer(app);
var admin = require("firebase-admin");
const crypto2 = require('./crypto.js');
var Filter = require('bad-words');
var filter = new Filter({ placeHolder: '*' });

const decrypt = crypto2.decrypt;
const encrypt = crypto2.encrypt;
/* Fetch the service account key JSON file contents */
var serviceAccount = require('./serviceKey.json');
serviceAccount = decrypt(serviceAccount)
serviceAccount = JSON.parse(serviceAccount);

/* Initialize the app with a service account, granting admin privileges */

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://help-f52dd-default-rtdb.firebaseio.com"
});

/* Helpers */

function createNotification(target, notif) {
  users.once('value', (snap) => {
    var timestamp = new Date().getTime()
    snap = snap.val();
    if (snap[target]) {
      var completeNotification = notif;
      completeNotification["timestamp"] = timestamp;
      var all_notifs = snap[target].notifications;
      all_notifs[all_notifs.length] = completeNotification
      var userRef = users.child(target);
      userRef.update({
        "notifications": all_notifs
      });
    } else {
      return;
    }
  })
}
function search(tags, cb) {
  ref.once('value', (snap) => {
    snap = snap.val();
    snap = json2array(snap);

    for (var i = 0; i < snap.length; i++) {
      snap[i].matches = 0;
      for (var j in tags) {
        if (snap[i].tags.indexOf(tags[j]) !== -1) {
          snap[i].matches++;
        }
      }
      if (snap[i].matches == 0) {
        snap[i].relevant = false;
      } else {
        snap[i].relevant = true;
      }
      snap[i].shortDes = truncate(snap[i].des, 100, true);
    }

    snap.sort((a, b) => {
      if (a.matches < b.matches) {
        return 1;
      } else if (a.matches > b.matches) {
        return -1
      }
      return 0;
    });
    var cleaned = snap.map((map)=>{
      if(map.relevant){
        return map;
      }
    });
    if(!cleaned[0]){
      cb(snap,false)
    }else{
      cb(snap,true);
    }
    
  })
}

function getLocals(req, cb) {
  users.once('value', (snap) => {
    if (snap) {
      snap = snap.val();
      var userData = (snap[req.session.username]) ? snap[req.session.username] : undefined;
      if (userData) {
        userData.notifications = userData.notifications.reverse();
        userData.notifications = userData.notifications.splice(0, 3);
      }
      cb({
        notSignedIn: (req.session.signedIn) ? false : true,
        username: (userData) ? userData.username : false,
        notifications: (userData) ? userData.notifications : false
      })
    } else {
      cb({
        notSignedIn: true,
        username: false,
        notifications: false
      })
    }
  })

}
function truncate(str, n, useWordBoundary, filter) {
  if (str.length <= n) { return str; }
  var subString = str.substr(0, n - 1);
  var regex = /<\/?\w+((\s+\w+(\s*=\s*(?:".*?"|'.*?'|[^'">\s]+))?)+\s*|\s*)\/?>/gi;
  subString = subString.replace(regex,' ');
  return (useWordBoundary
    ? subString.substr(0, subString.lastIndexOf(" "))
    : subString) + "...";
};
function json2array(json) {
  var result = [];
  var keys = Object.keys(json);
  keys.forEach(function(key) {
    var x;
    x = json[key];
    x["key"] = key
    result.push(json[key]);
  });
  return result;
}
function filterIt(arr, searchKey) {
  var results = [];
  if (!Array.isArray(searchKey)) {
    searchKey = [searchKey];
  }
  for (var i in searchKey) {
    results.push(arr.filter(obj => Object.keys(obj).some(key => obj[key].includes(searchKey[i]))));
  }
  return results;
}



/*========= APP.USE();======== */

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  parameterLimit: 100000,
  limit: '50mb',
  extended: true
}));
app.use(upload.array());
app.use(cookieParser());
app.use(session({ secret: process.env.SECRET }))
app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.use(morgan('dev'))
app.use(ex.static('views'));
app.use(ex.json())
app.set('view cache', false);
app.use((req, res, next) => {
  req.getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = req.url.split('?')[1]
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
  return next();
});
function notification(plea, req) {
  var username = req.session.username;
  ref.once('value', (snap) => {
    snap = snap.val();
    if (snap[plea]) {
      var author = snap[plea].author;
      users.once('value', (usersnap) => {
        usersnap = usersnap.val();
        createNotification(author, {
          title: username + ' Wants to help!',
          subtitle: snap[plea].title,
          body: username + ' wants to helps you on ' + snap[plea].title,
          buttonTitle: 'Accept',
          buttonLink: '/accept?username=' + username + '&plea=' + plea, "read": false
        })
      })
    }
  })
}

var db = admin.database();
var ref = db.ref("pleas");
var users = db.ref('users');


/*======app.get();======*/

app.get('/', (req, res) => {
  if (!req.session.signedIn) {
    getLocals(req, (json) => {
      res.render('home', json)
    })

  } else {
    res.redirect('/~')
  }
});
app.get('/home', (req, res) => {
  res.redirect('/');
});

app.get('/auth', (req, res) => {
  res.render('auth', {});
});

app.get('/signup', (req, res) => {
  if (!req.session.signedIn) {
    getLocals(req, (json) => {
      res.render('signup', json)
    })
  } else {
    res.redirect('/~');
  }
});
app.get('/login', (req, res) => {
  if (!req.session.signedIn) {
    getLocals(req, (json) => {
      if (req.getUrlParameter('goto')) {
        req.session.goto = req.getUrlParameter('goto');
      } else {
        req.session.goto = undefined;
      }
      res.render('login', json);
    })
  } else {
    res.redirect('/~');
  }
});
app.get('/~', (req, res) => {
  if (req.session.signedIn) {
    getLocals(req, (json) => {
      json.notifications = json.notifications.map((d) => {
        d.notunread = (d.read) ? true : false;
        return d;
      })
      res.render('page', json)
    })
  } else {
    res.redirect('/login');
  }
});
app.get('/new', (req, res) => {

  users.once('value', (snap) => {

    snap = snap.val();
    if (req.session.signedIn) {
      var userData = snap[req.session.username];
      if (userData.identified || req.session.identified) {
        getLocals(req, (json) => {
          res.render('new', json)
        })
      } else {

        res.redirect('/authenticate')
      }
    } else {

      res.redirect('/login');
    }
  })

});
app.get('/authenticate', (req, res) => {
  users.once('value', (snap) => {
    snap = snap.val();
    var userData = snap[req.session.username]

    if (req.session.signedIn) {
      if (!userData.identified) {

        if (req.get('X-Replit-User-Id')) {
          userRef = db.ref('users/' + userData.username);
          userRef.update({
            "identified": req.get('X-Replit-User-Name')
          });

          res.redirect('/new');
        } else {
          getLocals(req, (json) => {
            res.render('replauth', json)
          })
        }
      } else {
        res.redirect('/new');
      }
    } else {
      res.redirect('/login');
    }
  });
})
app.get('/logout', (req, res) => {
  req.session.signedIn = undefined;
  req.session.username = undefined;
  res.redirect('/login');
})
app.get('/plea/:pleaID', (req, res) => {
  var pleaID = req.params['pleaID'];
  ref.once('value', (snapshot) => {
    var snapshot = snapshot.val();
    var plea = snapshot[pleaID];
    var userData, loggedIn, notOwner;
    if (plea) {
      if (req.session.signedIn) {
        users.once('value', (snap) => {
          snap = snap.val();
          userData = snap[req.session.username]
          alreadyJoined = (plea.users.indexOf(userData.username) !== -1) ? true : false;
          notowner = (plea.author == userData.username) ? false : true
          res.render('plea', {
            "author": plea.author,
            "title": plea.title,
            "des": plea.des,
            "id": pleaID,
            "users": plea.users,
            "tags": plea.tags,
            "owner": notowner,
            "username": req.session.username,
            "joined": alreadyJoined
          });
        })
      } else {
        res.render('plea', {
          "author": plea.author,
          "title": plea.title,
          "des": plea.des,
          "id": pleaID,
          "users": plea.users,
          "tags": plea.tags,
          "owner": true,
          "username": false,
          "joined": false
        });
      }

    } else {
      res.redirect('/pleas');
    }
  })
})

app.get('/pleas', (req, res) => {
  var pleas = [];
  var userData = undefined;
  if (req.session.signedIn) {
    users.once('value', (snap) => {
      snap = snap.val();
      userData = snap[req.session.username]
    })
  }
  ref.once('value', (snapshot) => {
    if (snapshot.val()) {
      pleas = json2array(snapshot.val());
      pleas = pleas.reverse();
      var newPleas = pleas.map((element) => {
        var newElement = element;
        newElement.shortDes = truncate(element.des, 100, true);
        return newElement
      })

      res.render('pleas',
        {
          notSignedIn: (req.session.signedIn) ? false : true,
          username: (userData) ? userData.username : false, pleas: newPleas
        }
      );
    } else {
      res.render('pleas',
        {
          notSignedIn: (req.session.signedIn) ? false : true,
          username: (userData) ? userData.username : false, pleas: []
        }
      );
    }
  })

});
app.get('/edit/:pleaID', (req, res) => {

  if (req.session.signedIn) {
    ref.once('value', (snap) => {
      var pleaRef = ref.child(req.params['pleaID']);
      var key = pleaRef.key;
      snap = snap.val();
      plea = snap[req.params['pleaID']];
      plea['id'] = key;
      plea["tags"] = plea["tags"].join(', ');
      res.render('edit', {
        username: req.session.username,
        plea: plea
      })
    })

  } else {
    res.redirect('/plea/' + req.params["pleaID"])
  }
});
app.get('/search', (req, res) => {
  if (req.url.indexOf('?') !== -1) {
    var tags = req.getUrlParameter('q');
    tags = tags.split('+');
    var results = search(tags, (newOrder, results) => {
      res.render('search', { newOrder: newOrder, username: req.session.username, noresults: false, viables: results});
    })
  } else {
    res.render('search', { noresults: true, username: req.session.username });
  }
});
app.get('/notifications', (req, res) => {

  users.once('value', (snap) => {
    snap = snap.val();
    if (req.session.username) {
      if (snap[req.session.username]) {
        var notifications = snap[req.session.username].notifications;
        notifications = notifications.map((data) => {
          data.notunread = (data.read) ? true : false;
          return data;
        })
        notifications = notifications.reverse();
        var locals = {
          username: req.session.username,
          notifications: notifications
        }
        res.render('notifications', locals)
      } else {
        res.redirect('/signup')
      }
    } else {
      res.redirect('/login?goto=notifications')
    }
  })
})
app.get('/accept', (req, res) => {
  if (req.session.username) {
    var username = req.getUrlParameter("username");
    var plea = req.getUrlParameter('plea');
    ref.once('value', (snap) => {
      snap = snap.val();
      var pleaRef = snap[plea];
      if (pleaRef) {
        if (pleaRef.author == req.session.username) {
          var replLink = pleaRef.link;
          var notification = {
            "title": req.session.username + " accepted your help",
            "subtitle": pleaRef.title,
            "body": req.session.username + " has accepted your help on " + pleaRef.title,
            "buttonLink": replLink,
            "buttonTitle": "Go to Repl"
          }
          createNotification(username, notification)
          var locals = {
            username: req.session.username,
            message: "Success!",
            accepted: username,
            pleaTitle: pleaRef.title,

          }
          res.render('accepted', locals);
        } else {
          var locals = {
            username: req.session.username,
            message: "Not Allowed!",
            accepted: false,
            pleaTitle: false,
            errorText: "You do not own that plea!",
            success: true
          }
          res.render("accepted", locals);
        }

      } else {
        var locals = {
          username: req.session.username,
          message: "Does Not Exist!",
          accepted: false,
          pleaTitle: false,
          errorText: "The plea specified does not exist",
          success: true
        }
        res.render('accepted',locals)
      }
    })
  } else {
    res.redirect('/login')
  }
});
app.get('/site/privacy', (req, res) => {
  getLocals(req, (json) => {
    if (req.getUrlParameter('embed') == "true") {
      if (req.getUrlParameter('dark') == "true") {
        json['dark'] = true;
        res.render('privacyembed', json);
        
      } else {
        res.render('privacyembed', json);
      }

    } else {
      res.render('privacypolicy', json);
    }
  })
});
app.get('/site/terms', (req, res) => {
  getLocals(req, (json) => {
    if (req.getUrlParameter('embed') == "true") {
      if (req.getUrlParameter('dark') == "true") {
        json['dark'] = true;
        res.render('tosembed', json);
        
      } else {
        res.render('tosembed', json);
      }

    } else {
      res.render('tos', json);
    }
  })
});
app.get('/contact', (req, res) => {
  getLocals(req, (json) => {
    res.render('contact', json);
  })
})
/*=====app.post();========*/
app.post('/join/:pleaID', (req, res) => {
  var userData;
  if (req.session.signedIn) {
    users.once('value', (snap) => {
      snap = snap.val();
      userData = snap[req.session.username];
      var pleaID = req.params['pleaID'];
      ref.once('value', (snapshot) => {
        var snap = snapshot.val();
        var plea = snap[pleaID];
        plea.users[plea.users.length] = userData.username;
        var pleaRef = ref.child(pleaID);
        pleaRef.update(plea);
        var username = userData.username;
        notification(pleaID, req);
        res.redirect('/plea/' + pleaID);
      })
    });
  } else {
    res.redirect('/login?goto=joined/' + req.params['pleaID']);
  }
});
app.post('/signup', (req, res) => {
  var password = crypto.SHA256(req.body.password).toString(crypto.enc.Hex);
  var username = req.body.username;
  var email = req.body.email;

  users.once('value', (snap) => {
    snap = snap.val();
    if (snap[username]) {
      res.redirect('/signup?exists=true');
    } else {
      var now = new Date();
      var timestamp = now.getTime();
      var data = {
        username: username,
        email: email,
        notifications: [{ title: "Welcome!", body: "Welcome to Help!", buttonLink: "/", buttonTitle: "Go Home", "subtitle": "Help!", "timestamp": timestamp }, {
          "body": "View Help's Github profile",
          "buttonLink": "https://github.com/sojs-coder/Help-",
          "subTitle": "Help Info",
          "buttonTitle": "Go!",
          "title": "Help On Github", "timestamp": timestamp
        }],
        passwordHash: password, identified: false
      }

      users.child(username).set(data);
      req.session.username = username;
      req.session.signedIn = username;
      res.redirect('/~');


    }
  })
  
});
app.post('/login', (req, res) => {

  users.once('value', (snap) => {

    snap = snap.val();
    userData = snap[req.session.username]
    var username = req.body.username;
    var password = crypto.SHA256(req.body.password).toString(crypto.enc.Hex)
    users.once("value", (d) => {
      d = d.val();
      d = d[username];

      if (d) {
        d = (d.passwordHash == password);
        if (d) {
          req.session.signedIn = username;
          req.session.username = username;
          if (req.session.goto) {
            var goto = req.session.goto;
            delete req.session.goto;
            res.redirect(goto);
          } else {
            res.redirect('/~')
          }
        } else {
          res.redirect('/login?doesnotmatch=true');
        }

      } else {
        res.redirect('/login?doesnotmatch=true');
      }
    })
  })
});
app.post('/new', (req, res) => {
  if (req.session.signedIn) {
    var title = req.body.title;
    var des = req.body["des-content"];
    var author = req.session.username;
    var link = req.body.link;
    var tags = req.body.tags;
    tags = tags.split(',');
    title = filter.clean(title);
    des = filter.clean(des);

    var pleaRef = ref.push({
      title: title, des: des, author: author, users: [author], username: req.session.username, link: link, tags: tags
    });
    res.redirect('/plea/' + pleaRef.key);
  } else {
    res.redirect('/login')
  }

});
app.post('/edit/:pleaID', (req, res) => {
  if (req.session.signedIn) {
    var title = req.body.title;
    var des = req.body["des-content"];
    var author = req.session.username;
    var link = req.body.link;
    var tags = req.body.tags;
    tags = tags.split(',');
    title = filter.clean(title);
    des = filter.clean(des);
    var pleaRef = ref.child(req.params['pleaID'])
    pleaRef.update({
      title: title, des: des, author: author, users: [author], username: req.session.username, link: link, tags: tags
    });
    res.redirect('/plea/' + pleaRef.key);
  } else {
    res.redirect('/login')
  }
});
app.post('/readNotification', (req, res) => {
  var data = req.body;
  var notifID = data.notification;
  notifID = notifID.split('notif').join("")
  notifID = parseInt(notifID);
  users.once('value', (snap) => {
    snap = snap.val();
    usersnap = snap[req.session.username];
    var notifs = usersnap['notifications'];
    notifs = notifs.reverse();
    notifs[notifID].read = true;
    notifs = notifs.reverse();
    userRef = users.child(req.session.username);
    userRef.update({
      "notifications": notifs
    });

  })
  res.send({ "notifID": notifID });
});

/*====404======*/
app.get('/404', (req, res) => {
  getLocals(req, (json) => {
    res.status(404)
    res.render('404', json);
  })
})
app.use((req, res, next) => {

  res.status(404)
  res.redirect('/404?url=' + req.url);


});
/*=====app.listen();======*/
http.listen(3000, () => {
  console.log('listening on port:3000');
  console.log('Help! is online!')
});
