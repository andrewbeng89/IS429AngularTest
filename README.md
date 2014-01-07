# IS429 Cloud Computing Lab for AngularJS Development and CI with Nitrous.IO, CloudBees and Jenkins

This tutorial will cover the steps for using a virtual maching (VM) on [Nitrous.IO](https://www.nitrous.io) to develop and deploy AngularJS web apps running on a node.js server.

The tutorial is divided into the following 2 sections: 

1. Part 1 walks through the steps to use Git and Jenkins as a test and deploy tool to push updates to CloudBees (PaaS).
2. Part 3 covers AngularJS web app development approaches


## Sign up for GitHub and Nitrous.IO

1. Sign up for [GitHub](https://github.com)
2. Sign up for [Nitrous.IO](https://www.nitrous.io). You can choose to use your GitHub account to do this, or your own email. If you are going to use Nitrous.IO to develop for both Python and node.js stacks, please sign up for two Nitrous.IO accounts.
3. Once your Nitrous.IO registration has been completed, create new node.js VM Box from [here](https://www.nitrous.io/app#/boxes/new)
4. Open the IDE of the VM Box, which should look like this:

![koding terminal](https://github.com/andrewbeng89/IS429AngularTest/raw/master/images/nitrous_ide.png)

## Part 1: Github, CloudBees and Jenkins

### Configuring Git and GitHub

Use the Nitrous.IO console located at the bottom section of the IDE to execute terminal commands. 

Generate a new ssh key pair on the VM to use to sync with GitHub and Jenkins.

1. `cd ~/.ssh`
2. `ssh-keygen -t rsa -C "<your_email@example.com>"`
3. When "Enter file in which to save the key (/home/action/.ssh/id_rsa):" is prompted, enter  `/home/action/.ssh/nitrous_id_rsa`
4. `Enter passphrase (empty for no passphrase): [Type a passphrase]`
5. `Enter same passphrase again: [Type passphrase again]`
6. Once the key pair has been generated, open the public key nitrous_id_rsa.pub using with vim `vim nitrous_id_rsa.pub`
7. Copy the public key (first line) and add it to your [GitHub keys](https://github.com/settings/ssh) with a new key name, e.g. nitrous_node
8. Close vim by entering `:q!`
5. Create a new config file in the .ssh folder and enter these lines below:
<pre>
  <code>
# Default GitHub user
 Host github.com
 HostName github.com
 PreferredAuthentications publickey
 IdentityFile ~/.ssh/nitrous_id_rsa
  </code>
</pre> 


### Clone and Configure Demo App


1. Set your git user email identity `git config --global user.email "<your_email@example.com>"`
2. Set your git user email identity `git config --global user.name "<Your Name>"`
3. Clone this repository `git clone https://github.com/andrewbeng89/IS429AngularTest.git`
4. `cd IS429AngularTest`
5. Reomve the .git directory `rm -rf .git`
6. Create a new GitHub repository with your account
7. Initialise the demo app as a git repo on the VM `git init`
8. Add the remote to the newly create GitHub repository `git remote add origin git@github.com:<your_username>/<your_new_repo>.git`


### Running the application on Nitrous.IO

You can use Nitrous.IO as a testing environment for development.

1. `cd app`
2. In the app directory, create a new file `credentials.js`
3. Add `module.exports = {MONGO_PASSWORD:"is429"};` and save
4. Run the app `node main.js`
5. Under "Preview" from the IDE, select "Port 3000" to view the app which should look like this:

![koding terminal](https://github.com/andrewbeng89/IS429AngularTest/raw/master/images/webapp_preview.png)

### Install and use the CloudBees SDK

After signing up for [CloudBees](http://www.cloudbees.com/), install the CloudBees SDK on your Nitrous.IO Box

1. `curl -L cloudbees-downloads.s3.amazonaws.com/sdk/cloudbees-sdk-1.5.2-bin.zip > bees_sdk.zip`
2. `unzip bees_sdk.zip`
3. `rm bees_sdk.zip`
4. `cd cloudbees-sdk-1.5.2`
5. `vim ~/.bashrc` and enter `i`
6. Insert the following lines at the end on the file. `Esc + :wq` to save and close
<pre>
  <code>
export BEES_HOME=~/cloudbees-sdk-1.5.2                                                                                                                                                                                                 
PATH=$PATH:$BEES_HOME
  </code>
</pre> 

Check that the SDK has been installed

1. Reload .bashrc `source ~/.bashrc`
2. `bees help` and enter region and account credentials

### Continuous Integration with CloudBees and GitHub

CloudBees provides [Jenkins](https://wiki.jenkins-ci.org/display/JENKINS/Meet+Jenkins), a framework for building/testing software projects continuously, as a service. Developers can hook their GitHub project to this service, triggering automated test, build and deployment scripts whenever a push is made to the GitHub repository. Follow these steps to use Jenkins-as-a-Service with GitHub and CloudBees:

1. Go to `https://<your-username>.ci.cloudbees.com/pluginManager/available`
2. Select the GitHub plugin and click "Install without restart"
3. During the installation process, check "Restart Jenkens when installation is complete..."
4. Once Jenkins has restarted, go to `https://<your-username>.ci.cloudbees.com/configure` and scroll down to "GitHub Web Hook"
5. Check "Let Jenkins auto-manage..."
7. Enter GitHub credentials and test them
6. Check "Override Hook URL"
7. Copy the Hook URL
8. Go to `https://github.com/<your-username>/<your-repository>/settings/hooks`
9. Select "Jenkins (Github plugin)" and enter the URL
10. Check "Active" and click "Test Hook"
6. Click "Apply" at the bottom of the page.

Create and configure new CloudBees hosted node.js application

1. `bees app:create -a <your-app-name> -t nodejs -P MONGO_PASSWORD="is429" -R PLUGIN.SRC.nodejs=https://dl.dropboxusercontent.com/u/6484381/nodejs-clickstack.zip`
2. Go to `https://<your-username>.ci.cloudbees.com/view/All/newJob` to configure a new Jenkins build job
3. Check "Build a free-style software project" and click "Ok"
4. Uncheck "Restrict where this project can be run" under "CloudBees DEV@cloud Authorization" on the next page
5. Check "Git" under "Source Code Management" and enter `https://github.com/<your-username>/<your-repository>.git` as the "Repository URL"
6. Check "Build when a change is pushed to GitHub" under "Build Triggers"
7. Select "Execute shell" from "Add build step" dropdown
8. Add "Deploy applications" build step
9. Click "Add application" and enter the Application ID of the app you just created in the first step
10. Change "Application file" to `target/*.zip`
11. Add "Publish JUnit test result report" from "Add post-build action" and fill `test_out/unit.xml,test_out/e2e.xml` in "Test report XMLs"
12. Add the following shell commands under "Execute shell":
<pre>
  <code>
export DISPLAY=:1
Xvfb :1 &

#
# Fetch node and testacular if we don't have it already
#

node_version=v0.10.16
install_name=node-$node_version-linux-x64
node_home=$PWD/$install_name

#if [ ! -e $install_name.tar.gz ]
#then
    wget http://nodejs.org/dist/$node_version/$install_name.tar.gz
    tar xf $install_name.tar.gz
    $node_home/bin/npm install -g phantomjs
    $node_home/bin/npm install -g karma
    $node_home/bin/npm install -g karma-junit-reporter
    $node_home/bin/npm install -g karma-jasmine
    $node_home/bin/npm install -g karma-ng-scenario
    $node_home/bin/npm install -g mocha
#fi

# 
# run the Angular.js tests (using a browser on the build server)
#

export PATH=$PATH:$node_home/bin
export PHANTOMJS_BIN=$node_home/bin/phantomjs
scripts/test.sh  --single-run --browsers="Chrome,Firefox" --reporters="dots,junit" --no-colors

#
# run the Angular.js e2e tests (this requires a server too)
#

node scripts/web-server.js > /dev/null &
NODE_PID=$!
scripts/e2e-test.sh --single-run --browsers="Chrome,Firefox" --reporters="dots,junit" --no-colors
kill -s TERM $NODE_PID


#
# package the app for the CloudBees node.js stack (deployer picks it up)
# 

cd app

if [ ! -d test ]
  then mkdir test
fi

cat > "test/test.js" << EOF
  var app = require('../app'), http = require('http'), request = require('supertest'), assert = require('assert');
   describe('GET /index.html', function(){
    it('get index.html', function(done){
      request(app)
        .get('/index.html')
        .expect(200, done);
    });
  });
EOF

npm install
npm test

mkdir -p ../target
rm -rf ../target/app.zip
zip -r ../target/app.zip *
  </code>
</pre>

Finally... click "Apply" at the bottom of the page! To test the CI testing and deployment:

1. `cd ~/<your-repo>`
2. Make some changes to app/index.html using the Nitrous.IO IDE
3. Commit the changes `git commit -m "test changes to app/index.html"`
4. Push the changes to GitHub `git push origin master`
5. Go to `https://<your-username>.ci.cloudbees.com/job/<your-build-id>/` where the build will start shortly


## Part 2: AngularJS Development in the Cloud

This section will cover simple front and back end techniques to get you up to speed with application development in the Cloud

### AngularJS

[AngularJS](http://angularjs.org) provides a modularized approach to bind data structures, e.g. Arrays, Objects and other variables, to HTML views. This repository provides the code for a simple "todo list" application created in AngularJS.

There are three versions of this "todo" application:

1. A purely front-end AngularJS app that DOES NOT communicate with any back-end database that will be pushed to GitHub Pages (index.html located [here](https://github.com/andrewbeng89/mitb_node_demo/blob/master/index.html))
3. A purelt front-end AngularJS app that COMMUNICATES with a [Firebase](https://firebase.com) real-time Database-as-a-Service
2. Integrated AngularJS app that communites with a Node.js backe-end hosted on Heroku and Elastic Beanstalk (index.html located [here](https://github.com/andrewbeng89/mitb_node_demo/blob/master/public/index.html))

The "/public/js/todo.js" script, together with the "index.html" file located at the root of this repository is all that is required to get an AngularJS "todo list" application up and running. This purely front-end application is pushed to and viewable on GH-Pages branch of this repository. The list of "todos" is reinitialized to an empty list after the page has been refreshed. In order to create an application that will persist the list "todos", please refer to the steps below.


### AngularJS + Firebase + AngularFire

[Firebase](https://firebase.com) provides a real-time document (JSON) database. [AngularFire](http://angularfire.com/) is a JavaScript library that allows developers to bind AngularJS scope objects with real-time data from Firebase. CRUD operations will be persisted and executed on the client-side without any need for any backend operations. 

Take a look at "indext.html" at the root of this repository and "/public/js/todo_fire.js" to see the modifications from "todo.js". 

To create your own Firebase real-time database: 

1. Sign up for Firebase with your GitHub account
2. Create a new developer plan Firebase, and note the URL of the Firebase
3. Change this line in "todo_fire.js": `var ref = new Firebase('https://<your-firebase-name>.firebaseio.com/todos');`
4. Push an update that will publish the the static "index.html" to GH-Pages
5. View the app on your GH-Pages URL
6. Create some new todos and reload the page and observe


### Node.js with MongoDB (Mongolab Database-as-a-Service)

[Node.js](http://nodejs.org) is a JavaScript platform built on [Google's V8 engine](https://code.google.com/p/v8/), and is used to develop a wide variety of network applications, including web applications.

This demo application uses the [Express web app framework](http://expressjs.com/) as its backbone, with a "public" folder containing all of the front-end code (AngularJS-based application). The AngularJS code for this integrated version of the app exists in "todo_xhr.js". Unlike "todo.js", the method calls will interact with the Expressjs application via HTTP requests. The application back-end code ("app.js") will handle these request to either create, retrieve, update or delete (CRUD) "todo" items in the application's database.

The application database used here is [MongoDB](http://www.mongodb.org/), a document/object based database system. Unlike a traditional relational databse system (e.g. MySQL, Oracle DB), MongoDB is an example of a non-relational [NoSQL](http://en.wikipedia.org/wiki/NoSQL) database. Other examples of NoSQL database systems include CouchDB and Google's App Engine Datastore (NDB is covered in the [sister GAE tutorial](https://github.com/andrewbeng89/mitb_gae_demo)).

To uses MongoDB-as-a-Service hosted on [Mongolab](https://mongolab.com) with the "todo list" application, follow these steps:

1. Sign up for Mongolab [here](https://mongolab.com/signup/)
2. Once logged in, proceed to create a new mondolab development environment [here](https://mongolab.com/create). Remember to select "Development (single-node)" under "plans"
3. Choose a name for the database, e.g. "<your name>-todos-db"
4. When prompted, create the credentials for a new database user (username and password)
5. Make a note of the database name and the username and password of the new user you have just created 

To make use of the MongoDB database you have just created in the Node.js web application these credentials have to be used in a secure manner:

1. For developemnt on Koding.com, a new file at the root level of this repository called credentials.js will be used
2. Using the Heroku toolbelt, the MongoDB password will be set as Heroku environment variable
3. Using the Elastic Beanstalk console, the MongoDB password will be set as Heroku environment variable
4. Using the travis gem CLI, the MongoDB password will be encrypted and used during the build process

To use the password in the development environment, create a new file called "credentials.js" in the root directory of application repository. Edit the contents of "credentials.js" accordingly:

<pre>
  <code>
module.exports = {
    MONGO_PASSWORD: '<MongoDB Password from Mongolab here>'
};
  </code>
</pre>

Using Heroku toolbelt from the VM terminal:

1. `heroku config:set MONGO_PASSWORD=<MongoDB Password from Mongolab here>`
2. Verify that the MONGO_PASSWORD variable has been set: `heroku config`

Using the Elastic Beanstalk Console:

1. From the [console](https://console.aws.amazon.com/elasticbeanstalk/home), navigate to the application's "Configuration" page
2. Scroll down to "Environment Properties"
3. At the last table row, Enter "MONGO_PASSWORD" into the "Property Name" column and your password into the "Property Value" column
4. Save the configuration

Using travis to encrypt:

1. From the VM terminal at the repository's root level: `travis encrypt MONGO_PASSWORD="<MongoDB Password from Mongolab here>" --add`
2. Check the .travis.yml file to verify that a new secure variable has been added


### Application Tracking with Google Analytics

Google Analytics can be used as a tool to track your application's users' behaviour. These include page views, application events, content flow and user locations, just to name a few.

The following steps will demonstrate configuring Google Analytics to track the number of page views and the number of CRUD events triggered by users:

1. Create a Google Analytics account [here](http://www.google.com/analytics/)
2. From the main home console, navigate to the "Admin" page
3. Create a new "Property"
4. Enter the details of this application (the URL can either be the Heroku or Elastic Beanstalk URL)
5. Once created, note the "Tracking ID" for this application
6. Open the "/public/js/gooogle-analytics.js" file
7. Edit this line: `_gaq.push(['_setAccount', '<Tracking ID here>']);`
8. Open the "/public/js/todo_xhr.js" file
9. The lines with code similar to ` _gaq.push(['_trackEvent', 'create', 'click', 'todo']);` indicate event tracking with Google Analytics


## View the demo app on [Heroku](http://mitb-node-demo.herokuapp.com)
## View the demo app on [Elastic Beanstalk](http://mitb-node-demo-8tqj3ypyra.elasticbeanstalk.com)