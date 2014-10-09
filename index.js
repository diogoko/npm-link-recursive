#!/usr/bin/env node

var Promise = require('rsvp').Promise;
var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
var walk = require('walkdir');

function getRoot() {
  return new Promise(function(resolve, reject) {
    exec('npm root -g', function(error, stdout, stderr) {
      if (error) {
        reject(error);
        return;
      }
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

function linkAll(linkedPackages) {
  return new Promise(function(resolve, reject) {
    var walker = walk('.').on('directory', function(curPath, stat) {
      var leaf = path.basename(curPath);
      var leafParent = path.basename(path.dirname(curPath));
      if (leafParent === 'node_modules' && linkedPackages.indexOf(leaf) !== -1) {
        walker.pause();
        linkPath(path.dirname(path.dirname(curPath)), leaf).then(function() {
          walker.resume();
        }).catch(function(error) {
          walker.end();
          reject(error);
        });
      }
    }).on('end', function() {
      resolve();
    });
  });
}

function linkPath(projectPath, packageName) {
  console.log('linking ' + projectPath + '/node_modules/' + packageName);
  return npmUninstall(projectPath, packageName).
    then(function() {
      return npmLink(projectPath, packageName);
    });
}

function npmUninstall(cwd, packageName) {
  return new Promise(function(resolve, reject) {
    exec('npm uninstall ' + packageName, { cwd: cwd }, function(error, stdout, stderr) {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

function npmLink(cwd, packageName) {
  return new Promise(function(resolve, reject) {
    exec('npm link ' + packageName, { cwd: cwd }, function(error, stdout, stderr) {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

getRoot().then(function(prefix) {
  var linkedPackages = getLinkedPackages(prefix);
  return linkAll(linkedPackages);
}).catch(function(error) {
  console.error(error.message);
});
