(function() {
  var app, currentImg, drone, express, faye, imageSendingPaused, path, server, socket, autonomy, mission;
  express = require("express");
  faye = require("faye");
  path = require("path");
  drone = require("ar-drone").createClient();
  //autonomy = require('ardrone-autonomy');
  //mission = autonomy.createMission();
  drone.config('general:navdata_demo', 'TRUE');
  app = express();
  app.configure(function() {
    app.set('port', process.env.PORT || 3001);
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
    return app.use("/components", express.static(path.join(__dirname, 'components')));
  });
  server = require("http").createServer(app);
  new faye.NodeAdapter({
    mount: '/faye',
    timeout: 45
  }).attach(server);
  socket = new faye.Client("http://localhost:" + (app.get("port")) + "/faye");
  socket.subscribe("/drone/move", function(cmd) {
    var _name;
    console.log("move", cmd);
    if(cmd.action == 'gotoroom') {
      console.log('coming in');
      //return mission.takeoff().zero().altitude(1).hover(4000).land();
      return drone['takeoff'];
    }
    else
      return typeof drone[_name = cmd.action] === "function" ? drone[_name](cmd.speed) : void 0;
  });
  socket.subscribe("/drone/animate", function(cmd) {
    console.log('animate', cmd);
    return drone.animate(cmd.action, cmd.duration);
  });
  socket.subscribe("/drone/drone", function(cmd) {
    var _name;
    console.log('drone command: ', cmd.action);
    if(cmd.action == 'gotoroom') {
      console.log('coming in');
      /*return mission['takeoff']().run(function(err, result) {

      });*/
      return [
        drone.takeoff(),
        /*drone.after(3000, function() {
          this.stop();
          this.front(0.1);
        }),
        drone.after(3000, function() {
          this.stop();
          this.back(0.1);
        }),*/
        drone.after(5000, function() {
          this.stop();
          this.land();
        })
      ]
    }
    else
      return typeof drone[_name = cmd.action] === "function" ? drone[_name]() : void 0;
  });
  function check() {
    console.log('inside function');
    return {
      //drone['takeoff']();
    }
  }
  server.listen(app.get("port"), function() {
    return console.log("Express server listening on port " + app.get("port"));
  });
  currentImg = null;
  drone.on('navdata', function(data) {
    return socket.publish("/drone/navdata", data);
  });
  imageSendingPaused = false;
  drone.createPngStream().on("data", function(frame) {
    currentImg = frame;
    if (imageSendingPaused) {
      return;
    }
    socket.publish("/drone/image", "/image/" + (Math.random()));
    imageSendingPaused = true;
    return setTimeout((function() {
      return imageSendingPaused = false;
    }), 100);
  });
  app.get("/image/:id", function(req, res) {
    res.writeHead(200, {
      "Content-Type": "image/png"
    });
    return res.end(currentImg, "binary");
  });
}).call(this);
