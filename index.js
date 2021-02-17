// Require statments
var ex = require('express'),
  swig = require('swig'),app=ex();
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
var filter = new Filter({ placeHolder: '*'});
var showdown  = require('showdown'),
    converter = new showdown.Converter();
var xss = require('xss-filters').inHTMLData;

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


//Helpers

function getLocals(req){
  return {
    notSignedIn: (req.session.signedIn) ? false : true,
    username: (req.session.userData) ? req.session.userData.username : false,
    notifcations: (req.session.signedIn) ? req.session.userData.notifcations : false
  }
}
function truncate( str, n, useWordBoundary ){
  if (str.length <= n) { return str; }
  const subString = str.substr(0, n-1); // the original check
  return (useWordBoundary 
    ? subString.substr(0, subString.lastIndexOf(" ")) 
    : subString) + "...";
};
function json2array(json){
    var result = [];
    var keys = Object.keys(json);
    keys.forEach(function(key){
        var x;
        x = json[key];
        x["key"] = key
        result.push(json[key]);
    });
    return result;
}
// APP.USE();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(upload.array());
app.use(cookieParser());
app.use(session({ secret: process.env.SECRET }))
app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.use(morgan('dev'))
app.use(ex.static('views'));
app.set('view cache', false);
var db = admin.database();
var ref = db.ref("pleas");
var users = db.ref('users');

//app.get();

app.get('/',(req,res)=>{
  res.redirect('/home');
});


app.get('/home',(req,res)=>{
  if(!req.session.signedIn){
    res.render('home',getLocals(req));
  }else{
    res.redirect('/~')
  }
});
app.get('/signup',(req,res)=>{
  if(!req.session.signedIn){
    res.render('signup',getLocals(req));
  }else{
    res.redirect('/~');
  }
});
app.get('/login',(req,res)=>{
  if(!req.session.signedIn){
    res.render('login',getLocals(req));
  }else{
    res.redirect('/~');
  }
});
app.get('/~',(req,res)=>{
  if(req.session.signedIn){
    res.render('page',getLocals(req));
  }else{
    res.redirect('/login');
  }
});
app.get('/new',(req,res)=>{
  if(req.session.signedIn){
    res.render('new',getLocals(req));
  }else{
    res.redirect('/login');
  }
})
app.get('/logout',(req,res)=>{
  req.session.signedIn = undefined;
  req.session.userData = undefined;
  res.redirect('/login');
})
app.get('/plea/:pleaID',(req,res)=>{
  var pleaID = req.params['pleaID'];
  ref.on('value',(snapshot)=>{
    var snapshot = snapshot.val();
    var plea = snapshot[pleaID];
    if(plea){
      if(req.session.signedIn){
        var alreadyJoined = (plea.users.indexOf(req.session.userData.username) !== -1) ? true : false;
        var notowner = (plea.author == req.session.userData.username) ? false : true
      }else{
        var loggedIn = false;
        var notowner = true;
      }
      res.render('plea',{
          "author": plea.author,
          "title": plea.title,
          "des": plea.des,
          "id":pleaID,
          "users":plea.users,
          "tags":plea.tags,
          "owner":notowner,
          "username": (req.session.signedIn)?req.session.userData.username : false,
          "joined": alreadyJoined,
          "loggedIn": loggedIn
      });
    }else{
      res.redirect('/pleas');
    }
  })
})
app.get('/joined/:pleaID',(req,res)=>{
  var id = req.params["pleaID"];
  res.end('Thanks for joining plea with id of: '+id);
});
app.get('/pleas',(req,res)=>{
  var pleas = [];

  ref.once('value',(snapshot)=>{
    if(snapshot.val()){
    pleas = json2array(snapshot.val());

    var newPleas = pleas.map((element)=>{
      var newElement= element;
      newElement.shortDes = truncate(element.des,100, true);
      return newElement
    })
    res.render('pleas',
    {
      notSignedIn: (req.session.signedIn) ? false : true,
      username: (req.session.userData) ? req.session.userData.username : false,pleas: newPleas
    }
    );
    }else{
      res.render('pleas',
    {
      notSignedIn: (req.session.signedIn) ? false : true,
      username: (req.session.userData) ? req.session.userData.username : false,pleas: []
    }
    );
    }
  })
  
});
app.get('/edit/:pleaID',(req,res)=>{
  if(req.session.signedIn){
    res.render('edit',{
      username: req.session.userData.username,
      
    })
  }
});

// app.post();
app.post('/join/:pleaID',(req,res)=>{
  if(req.session.signedIn){
    var pleaID = req.params['pleaID'];
    ref.once('value',(snapshot)=>{
      var snap = snapshot.val();
      var plea = snap[pleaID];
      plea.users[plea.users.length]=req.session.userData.username;
      var pleaRef = ref.child(pleaID);
      pleaRef.update(plea);
      var username = req.session.userData.username;
     // notifcation(pleaID,req.session.username);
      res.redirect('/joined/'+pleaID);
      
    })
  }else{
    res.redirect('/login?goto=joined/'+req.params['pleaID']);
  }
});
app.post('/signup',(req,res)=>{
  var password = crypto.SHA256(req.body.password).toString(crypto.enc.Hex);
  var username = req.body.username;
  var email = req.body.email;
  users.on('value',(snap)=>{
    if(snap[username]){
      res.redirect('/login?exists=true');
    }else{
      var data = {
        username: username,
        email: email,
        notifcations:[{title:"Welcome!",body:"Welcome to Help!",buttonLink:"/",buttonTitle:"Go Home"}],
        passwordHash: password
      }
      users.child(username).set(data);
      res.redirect('/login');
    }
  })
});
app.post('/login',(req,res)=>{
  var username = req.body.username;
  var password = crypto.SHA256(req.body.password).toString(crypto.enc.Hex)
  users.on("value",(d)=>{
      d = d.val();
      d = d[username];
      if(d){
        req.session.signedIn=username;
        req.session.userData=d;
        res.redirect('/~')
      }else{
        res.redirect('/login?doesnotmatch=true');
      }
    })
});
app.post('/new',(req,res)=>{
  if(req.session.signedIn){
    var title = req.body.title;
    var des = req.body.des;
    var author = req.session.userData.username;
    var link = req.body.link;
    var tags = req.body.tags;
    tags = tags.split(',');
    title = filter.clean(title);
    des = filter.clean(des);
    des = xss(des);
    des = converter.makeHtml(des);
    var pleaRef = ref.push({
      title:title,des:des,author:author,users:[author],username: req.session.userData.username,link:link,tags:tags
    });
    res.redirect('/plea/'+pleaRef.key);
  }else{
    res.redirect('/login')
  }
  
})
// app.listen();
http.listen(3000, () => {
  console.log('listening on port:3000');
  console.log('Help! is online!')
});
