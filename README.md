TwitterFreeUsernameChecker
==========================

Tool to check if Twitter usernames are available.


The idea is to cron a script that simply check if usernames exist and email you when they don't anymore.
Hopefully, I'll get some luck :)

To deploy on heroku
- create an App : heroku apps:create
- add Sendgrid free add-on : heroku addons:add sendgrid
- add Scheduler free add-on : heroku addons:add scheduler
- schedule a cron : heroku addons:open scheduler
- schedule using task = checker.js
- heroku config:add TFUNC_EMAIL='youremail@example.com'
- heroku config:add TFUNC_TWITTER_CONSUMER_KEY='App consumer key'
- heroku config:add TFUNC_TWITTER_CONSUMER_SECRET='App consumer secret'
- git push heroku master