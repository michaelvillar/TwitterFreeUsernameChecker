#!/app/bin/node

var http = require('http')
var https = require('https')
var querystring = require('querystring')
var SendGrid = require('sendgrid').SendGrid
var sendgrid = new SendGrid(
  process.env.SENDGRID_USERNAME,
  process.env.SENDGRID_PASSWORD
)

var APP_NAME = "TwitterFreeUsernameChecker"

function auth(callback) {
  var auth = process.env.TFUNC_TWITTER_CONSUMER_KEY + ':' + process.env.TFUNC_TWITTER_CONSUMER_SECRET;
  var auth64 = new Buffer(auth).toString('base64');

  var post_data = querystring.stringify({
    'grant_type' : 'client_credentials'
  });

  var post_options = {
    host: 'api.twitter.com',
    port: '443',
    path: '/oauth2/token',
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + auth64,
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'Content-Length': post_data.length
    }
  };

  var post_req = https.request(post_options, function(res) {
    res.setEncoding('utf8');
    var data = ''
    res.on('data', function (chunk) {
      data += chunk
    });
    res.on('end', function() {
      try {
        var json = JSON.parse(data)
        callback(json.access_token)
      } catch(e) {
      }
    })
    res.on('error', function(e) {
      console.log('Error' , e)
    })
  });
  post_req.write(post_data);
  post_req.end();
}

function checkIfUsernamesExist(usernames, callback) {
  auth(function(access_token) {
    var get_options = {
      host: 'api.twitter.com',
      port: '443',
      path: '/1.1/users/lookup.json?screen_name=' + usernames.join(","),
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + access_token
      }
    };

    var get_req = https.request(get_options, function(res) {
      var data = ""
      res.on("data", function(chunk) {
        data += chunk
      });
      res.on("end", function() {
        try {
          var json = JSON.parse(data)
          json.forEach(function(user) {
            var screenName = user['screen_name'].toLowerCase()
            var pos = usernames.indexOf(screenName)
            if(pos != -1)
              usernames.splice(pos, 1)
          })
          callback(usernames)
        } catch(e) {
          callback([], e)
        }
      })
      res.on('error', function(e) {
        console.log('Error' , e)
      })
    })
    get_req.end();
  })
}

function sendEmail(subject, text) {
  sendgrid.send({
    to: process.env.TFUNC_EMAIL,
    from: process.env.TFUNC_EMAIL,
    subject: subject,
    text: text
  }, function(success, err) {
    if (!success)
      console.log("SendGrid Error : ", err);
  })
}

function sendErrEmail(err) {
  sendEmail(APP_NAME + " - Error", err.toString())
}

function sendFreeUsernamesEmail(freeUsernames) {
  var text = ""
  freeUsernames.forEach(function(u) {
    text += "http://twitter.com/"+u+"\n"
  })
  sendEmail(APP_NAME + " - Free Usernames", text)
}

checkIfUsernamesExist(process.env.TFUNC_USERNAMES.split(","), function(unexistingUsernames, err) {
  if(err)
    sendErrEmail(err)
  else if(unexistingUsernames.length > 0)
    sendFreeUsernamesEmail(unexistingUsernames)
})