# RealBoard - Client #
Realtime collaborative IDE and simple project management

**RealBoard - Client** is an open source application that you can use to make your project more alive and controlled in real time. Kill many conflicts of writing code between the team with each other. It's powerful to control the previous version to the latest version of your project.

You don't need to close and reopen your IDE to get a change, because we are all set for you. So, let's write a document together in real time now.

![RealBoard-Client Dashboard preview](https://raw.githubusercontent.com/morkid/realboard/master/client/public/img/realboard/rb1.png)

## Feature list :
* Realtime collaborative IDE *(Skip conflict in writing)*
* Simple Project Management *(Create new / Get report)*
* Simple Task Manager
* Simple Version Control
* Live discussion
* Live Notification
* Live Invitation
* [Firebase](https://www.firebase.com/) Integration

![RealBoard-Client Collaborative IDE Preview](https://raw.githubusercontent.com/morkid/realboard/master/client/public/img/realboard/rb6.png)

## Minimum Requirements :

| Modules	| Min Version | Libraries / Extensions |
| --------- |:-----------:| ----------------------:|
| [NodeJs](https://nodejs.org/) | v0.10.25 | <ul><li>[Socket.io](https://github.com/Automattic/socket.io)</li><li>[Firebase](https://www.npmjs.com/package/firebase)</li><li>[Request](https://github.com/request/request)</li></ul> |
| [PHP](http://php.net/) | >= 5.4 | <ul><li>SQLite3</li></ul> |

![RealBoard-Client Full profile manager](https://raw.githubusercontent.com/morkid/realboard/master/client/public/img/realboard/rb5.png)


## Running perfect on :
* Ubuntu 14.04 LTS *trusty*
* Centos 6.6
* Debian 7 *wheezy*
* FreeBSD 10.1

## Installation Guide :
1. __Install apache2__

  * __Ubuntu / Debian__
  ```shell
  sudo apt-get update
  sudo apt-get install apache2 libapache2-mod-php5
  ```
  * Centos
  ```shell
  ...
  ```
  * __FreeBSD__
  ```shell
  ...
  ```

2. __Install php5__

  * __Ubuntu / Debian__
  ```shell
  sudo apt-get update
  sudo apt-get install php5 php5-sqlite
  sudo service apache2 reload
  ```
  * Centos
  ```shell
  ...
  ```
  * __FreeBSD__
  ```shell
  ...
  ```

3. __Install NodeJS__

  * __Ubuntu / Debian__
  ```shell
  sudo apt-get update
  sudo apt-get install nodejs npm
  sudo ln -s /usr/bin/nodejs /use/bin/node
  ```
  * Centos
  ```shell
  ...
  ```
  * __FreeBSD__
  ```shell
  ...
  ```

4. __Download And Setup RealBoard - Client__

  ```shell
  sudo apt-get update
  sudo apt-get install git-core
  cd /var/www/html
  git clone https://github.com/morkid/realboard.git
  ```

  Setup realboard configuration
  ```shell
  sudo nano /var/www/realboard/server/config.json
  ```

  Change ide path and firebase url (optional) value
  ```json
  {
    "ide_path":"/var/www/",
    "firebase_url":"https://you.firebaseio.com/"
  }
  ```
  
  Change directory permission
  ```shell
  chown -R www-data:www-data /var/www
  chmod 755 $(find /var/www/html/ -type d)
  ```
  
  Run node server
  ```shell
  cd /var/www/html/realboard/server/js
  sudo node server.js
  ```

  Open [http://__yourserver__/realboard/client](http://localhost/realboard/client) and signin using :
  * email : superuser@localhost.localdomain
  * password : superuser

  __Add new user__
  * Expand __Data panel__ at the bottom of application
  * Click team add new user

## License

MIT
