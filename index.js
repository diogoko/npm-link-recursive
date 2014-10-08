var Promise = require('rsvp').Promise;
var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
var walk = require('walkdir');

function getRoot(global) {
  return new Promise(function(resolve) {
    exec('npm root ' + (global ? '-g' : ''), function(error, stdout, stderr) {
      resolve(stdout.trim());
    });
  });
}

function getLinkedPackages(prefix) {
  var children = fs.readdirSync(prefix);
  return children.filter(function(child) {
    var stat = fs.lstatSync(path.join(prefix, child));
    return stat.isSymbolicLink();
  });
}

function findLinkablePaths(linkedPackages) {
  var linkable = [];
  walk.sync('.', function(curPath, stat) {
    var leaf = path.basename(curPath);
    var leafParent = path.basename(path.dirname(curPath));
    if (leafParent === 'node_modules' && linkedPackages.indexOf(leaf) !== -1) {
      // TODO: check if it's a directory
      linkable.push(curPath);
    }
  });
  
  return linkable;
}

getRoot(true).then(function(prefix) {
  var linkedPackages = getLinkedPackages(prefix);
  var linkablePaths = findLinkablePaths(linkedPackages);
  // TODO: link all linkable paths
});
