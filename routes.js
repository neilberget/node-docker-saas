var exec = require('child_process').exec;
var fs = require('fs');
var docker = require('docker.io')({ socketPath: '/var/run/docker.sock' });
var flash = require('connect-flash');

var Routes = function(db) {
  this.index = function(req, res) {
    var collection = db.get('dockerfiles');
    collection.find({}, {}, function(e, docs) {
      res.render('index', { 
        dockerfiles: docs,
        info: req.flash('info')
      });
    });
  };

  this.images = {};

  this.images.new = function(req, res) {
    res.render('images/new');
  };

  this.images.create = function(req, res) {
    var collection = db.get('dockerfiles');

    var tag = req.body.tag;
    var dockerfile = req.body.dockerfile;
    
    collection.insert({
      "tag": tag,
      "content" : dockerfile
    }, function (err, doc) {
      console.log(doc);
      if (err) {
        // If it failed, return error
        res.send("There was a problem adding the information to the database.");
      } else {
        res.redirect("/images/" + doc._id + "/build");
        // And set the header so the address bar doesn't still say /adduser
        //res.location("userlist");
      }
    });
  };

  this.images.delete = function(req, res) {
    var collection = db.get('dockerfiles');
    collection.remove( { '_id': req.params.id }, function() {
      res.redirect("/");
    });
  };

  this.images.build = function(req, res) {
    var collection = db.get('dockerfiles');
    collection.findById(req.params.id)
      .complete(function(err, data) {
        fs.mkdir("/tmp/" + req.params.id, function() {
          fs.writeFile("/tmp/" + req.params.id + "/Dockerfile", 
            data.content, 
            function() {
              var tarfile = "/tmp/" + req.params.id + ".tar"
              exec("(cd /tmp/" + req.params.id + "/ && tar cf " + tarfile + " *)",
                function(error, stdout, stderr) {
                  if (error) throw error;

                  docker.build(tarfile, data.tag, function(err, dres) {
                    if (err) throw err;
                    req.flash('info', dres.join("\n"));
                    console.log("data returned from Docker as JS object: ", dres);
                    containerId = dres[dres.length-1].substr(19);
                    res.redirect("/");
                  });
                });
            });
        });
      });
  };

  this.images.start = function(req, res) {
    var collection = db.get('dockerfiles');
    collection.findById(req.params.id)
      .complete(function(err, data) {
        console.log("Creating " + data.tag);
        var createOptions = {
          "Cmd": [], 
          "Image": data.tag
        };
        docker.containers.create(createOptions, function(err, dockerResponse) {
          if (err) {
            console.log(err);
            req.flash('error', err);
            res.redirect("/");
          } else {  
            var startOptions = {};
            console.log("Starting " + dockerResponse.Id);
            docker.containers.start(dockerResponse.Id, startOptions, function(err, dockerStartResponse) {
              if (err) {
                console.log(err);
                req.flash('error', err);
                res.redirect("/");
              } else {
                req.flash('info', 'Service ' + req.params.repo + ' started.');
                res.redirect("/");
              }
            });
          }
        });
      });
  }
}

module.exports = function(db) {
  return new Routes(db);
}
