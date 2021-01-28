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
const dbo = require('@sojs_coder/db')
const http = require('http').createServer(app);
var admin = require("firebase-admin");

// Fetch the service account key JSON file contents
var serviceAccount = require("./help-ab9d8-firebase-adminsdk-jslib-f8778ca049.json");

// Initialize the app with a service account, granting admin privileges
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://help-ab9d8-default-rtdb.firebaseio.com/"
});

// As an admin, the app has access to read and write all data, regardless of Security Rules


// ref.on("child_added", function(snapshot) {
//   var plea = snapshot.val();
  
// });
//Helpers

function getLocals(req){
  return {
    notSignedIn: (req.session.signedIn) ? false : true,
    username: (req.session.userData) ? req.session.userData.username : false
  }
}

// APP.USE();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(upload.array());
app.use(cookieParser());
app.use(session({ secret: "123456789-ABCDEF" }))
app.use(morgan('dev'));
app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.use(morgan('dev'))
app.use(ex.static('views'));
app.set('view cache', false);
const users = new dbo.DB('users');
var db = admin.database();
var ref = db.ref("pleas");

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
  res.redirect('/login');
})
app.get('/plea/:pleaID',(req,res)=>{
  var pleaID = req.params['pleaID'];
  ref.on('value',(snapshot)=>{
    var snapshot = snapshot.val();
    console.log(snapshot)
    var plea = snapshot[pleaID];
    console.log(plea)
    res.render('plea',{"author": plea.author, "title": plea.title, "des": plea.des,"id":pleaID,"users":plea.users, username: (req.session.signedIn)?req.session.userData.username : undefined});
  })
})

// app.post();
app.post('/signup',(req,res)=>{
  var password = crypto.SHA256(req.body.password).toString(crypto.enc.Hex);
  var username = req.body.username;
  var email = req.body.email;
  users.get(username,(d)=>{
    
    if(d){
    
      res.redirect('/signup?exist=true');
    }else{
      users.set(username,{'username':username,'password':password,'email':email},()=>{
        req.session.signedIn=username;
        req.session.userData=d;
        res.redirect('/~');
        
      })
    }
  })
});
app.post('/login',(req,res)=>{
  var username = req.body.username;
  var password = crypto.SHA256(req.body.password).toString(crypto.enc.Hex)
  users.get(username,(d)=>{
    
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
    var pleaRef = ref.push({
      title:title,des:des,author:author,users:[author],username: req.session.userData.username
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