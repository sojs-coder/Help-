// Require statments
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
// Fetch the service account key JSON file contents
var serviceAccount = require('./serviceKey.json');
serviceAccount = decrypt(serviceAccount)
serviceAccount = JSON.parse(serviceAccount);

// Initialize the app with a service account, granting admin privileges
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://help-38d77-default-rtdb.firebaseio.com/"
});

// APP.USE();

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
app.set('view cache', false)
app.use((req,res,next)=>{
  req.getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = req.url.split('?')[1],
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return typeof sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
        }
    }
    return false;
  };
  return next();
})

var db = admin.database();
var ref = db.ref("pleas");
var users = db.ref('users');
//Helpers
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
      if (snap[i].matches == 0){
        snap[i].notrelevant = true;
      }else{
        snap[i].notrelevant = false;
      }
      snap[i].shortDes = truncate(snap[i].des, 150, true);
    }
    
    snap.sort((a, b) => {
      if (a.matches < b.matches) {
        return 1;
      } else if (a.matches > b.matches) {
        return -1
      }
      return 0;
    });
    cb(snap);
  })
}
function getLocals(req) {
  return users.once('value', (snap) => {
    if (snap) {
      snap = snap.val();
      var userData = (snap[req.session.username]) ? snap[req.session.username] : undefined;
      return {
        notSignedIn: (req.session.signedIn) ? false : true,
        username: (userData) ? userData.username : false,
        notifcations: (userData) ? userData.notifcations : false
      }
    } else {
      return {
        notSignedIn: true,
        username: false,
        notifcations: false
      }
    }
  })

}
function truncate(str, n, useWordBoundary) {
  if (str.length <= n) { return str; }
  const subString = str.substr(0, n - 1); // the original check
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
  if(!Array.isArray(searchKey)){
    searchKey = [searchKey];
  }
  for (var i in searchKey){
    results.push(arr.filter(obj => Object.keys(obj).some(key => obj[key].includes(searchKey[i]))));
  }
  return results;
}



//app.get();

app.get('/', (req, res) => {
  res.redirect('/home');
});

app.get('/auth', (req, res) => {
  res.render('auth', {});
})
app.get('/home', (req, res) => {
  if (!req.session.signedIn) {
    res.render('home', getLocals(req));
  } else {
    res.redirect('/~')
  }
});
app.get('/signup', (req, res) => {
  if (!req.session.signedIn) {
    res.render('signup', getLocals(req));
  } else {
    res.redirect('/~');
  }
});
app.get('/login', (req, res) => {
  if (!req.session.signedIn) {
    res.render('login', getLocals(req));
  } else {
    res.redirect('/~');
  }
});
app.get('/~', (req, res) => {
  if (req.session.signedIn) {
    res.render('page', getLocals(req));
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
        res.render('new', getLocals(req));
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
            "identified": true
          });

          res.redirect('/new');
        } else {
          res.render('replauth', getLocals(req));
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
  ref.on('value', (snapshot) => {
    var snapshot = snapshot.val();
    var plea = snapshot[pleaID];

    if (plea) {
      if (req.session.signedIn) {
        users.once('value', (snap) => {
          snap = snap.val();
          userData = snap[req.session.username]
          var alreadyJoined = (plea.users.indexOf(userData.username) !== -1) ? true : false;
          var notowner = (plea.author == userData.username) ? false : true
        })
      } else {
        var loggedIn = false;
        var notowner = true;
        var alreadyJoined = false;
      }
      res.render('plea', {
        "author": plea.author,
        "title": plea.title,
        "des": plea.des,
        "id": pleaID,
        "users": plea.users,
        "tags": plea.tags,
        "owner": notowner,
        "username": (req.session.signedIn) ? req.session.username : false,
        "joined": (alreadyJoined)
      });
    } else {
      res.redirect('/pleas');
    }
  })
})
app.get('/joined/:pleaID', (req, res) => {
  var id = req.params["pleaID"];
  res.end('Thanks for joining plea with id of: ' + id);
});
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
        newElement.shortDes = truncate(element.des, 150, true);
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
    res.render('edit', {
      username: req.session.username,

    })
  } else {
    res.redirect('/plea/' + req.params["pleaID"])
  }
});
app.get('/search',(req,res)=>{
  if(req.url.indexOf('?') !== -1){
  var tags = req.getUrlParameter('q');
  tags = tags.split('+');
  var results = search(tags,(newOrder)=>{
      res.render('search',{newOrder: newOrder, username: req.session.username, noresults: false});
  })
  }else{
      res.render('search',{noresults: true, username: req.session.username});
  }
});

// app.post();
app.post('/join/:pleaID', (req, res) => {
  var userData = undefined;
  if (req.session.signedIn) {
    users.once('value', (snap) => {
      snap = snap.val();
      userData = snap[req.session.username]
    })
  }
  if (req.session.signedIn) {
    var pleaID = req.params['pleaID'];
    ref.once('value', (snapshot) => {
      var snap = snapshot.val();
      var plea = snap[pleaID];
      plea.users[plea.users.length] = userData.username;
      var pleaRef = ref.child(pleaID);
      pleaRef.update(plea);
      var username = userData.username;
      // notifcation(pleaID,req.session.username);
      res.redirect('/joined/' + pleaID);

    })
  } else {
    res.redirect('/login?goto=joined/' + req.params['pleaID']);
  }
});
app.post('/signup', (req, res) => {
  var password = crypto.SHA256(req.body.password).toString(crypto.enc.Hex);
  var username = req.body.username;
  var email = req.body.email;

  users.once('value', (snap) => {
    if (snap[username]) {
      res.redirect('/login?exists=true');
    } else {

      var data = {
        username: username,
        email: email,
        notifcations: [{ title: "Welcome!", body: "Welcome to Help!", buttonLink: "/", buttonTitle: "Go Home" }],
        passwordHash: password, identified: false
      }

      users.child(username).set(data);


    }
  })
  req.session.username = username;
  req.session.signedIn = username;
  res.redirect('/~');
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
      d = (d.passwordHash == password);
      if (d) {
        req.session.signedIn = username;
        req.session.username = username;
        res.redirect('/~')
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

// app.listen();
http.listen(3000, () => {
  console.log('listening on port:3000');
  console.log('Help! is online!')
});
