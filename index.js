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
const pleas = new dbo.DB('pleas');

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
  var name = req.body.name;
  var des = req.body.des;
  var maxout = req.body.maxout;
  if(maxout){
    var assistances = req.body.assistances;
    pleas.get(name, (d)=>{
      if(d){
        res.redirect('/new?exists=true');
      }else{
        pleas.get('pleaID',(d)=>{
          var pleaID = d;
          pleas.set(name,{des:des,maxout:assistances,username:req.session.userData.username,pleaID:pleaID},()=>{});
          d++;
          pleas.set('pleaID',d,()=>{});
        })
      }
    })
  }else{
    pleas.get(name, (d)=>{
      if(d){
        res.redirect('/new?exists=true');
      }else{
        pleas.get('pleaID',(d)=>{
          var pleaID = d;
          pleas.set(name,{'des':des,'maxout':9999999999,'username':req.session.userData.username,'pleaID':pleaID},()=>{});
          d++;
          pleas.set('pleaID',d,()=>{});
          
        })
      }
    })
  }
  

  res.redirect('/~')
});

// app.listen();
http.listen(3000, () => {
  console.log('listening on port:3000');
  console.log('Help! is online!')
});