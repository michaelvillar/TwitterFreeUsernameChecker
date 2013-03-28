#!/app/bin/node

var http = require('http')
var SendGrid = require('sendgrid').SendGrid
var sendgrid = new SendGrid(
  process.env.SENDGRID_USERNAME,
  process.env.SENDGRID_PASSWORD
)

var APP_NAME = "TwitterFreeUsernameChecker"

function checkIfUsernamesExist(usernames, callback) {
  var url = "http://api.twitter.com/1/users/lookup.json?screen_name=";
  url += usernames.join(",")
  http.get(url, function(res) {
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
  }).on('error', function(e) {
    callback([], e)
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