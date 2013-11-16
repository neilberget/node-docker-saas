var exec = require('child_process').exec;
var fs = require('fs');
var docker = require('docker.io')({ socketPath: '/var/run/docker.sock' });

var Routes = function(db) {
  this.index = function(req, res) {
    var collection = db.get('dockerfiles');
    collection.find({}, {}, function(e, docs) {
      res.render('index', { dockerfiles: docs });
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
      if (err) {
        // If it failed, return error
        res.send("There was a problem adding the information to the database.");
      } else {
        res.redirect("/");
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
        console.log(data);
        fs.mkdir("/tmp/" + req.params.id, function() {
          console.log("Writing Dockerfile");
          fs.writeFile("/tmp/" + req.params.id + "/Dockerfile", 
            data.content, 
            function() {
              console.log("Tarring");
              var tarfile = "/tmp/" + req.params.id + ".tar"
              exec("(cd /tmp/" + req.params.id + "/ && tar cf " + tarfile + " *)",
                function(error, stdout, stderr) {
                  if (error) throw error;

                  console.log("building image");
                  docker.build(tarfile, data.tag, function(err, dres) {
                    if (err) throw err;
                    console.log("data returned from Docker as JS object: ", dres);
                    res.redirect("/");
                  });
                });
            });
        });
      });
  };
}

module.exports = function(db) {
  return new Routes(db);
}
