#!/usr/bin/env node

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

function linkAll(linkedPackages) {
  var walker = walk('.').on('directory', function(curPath, stat) {
    var leaf = path.basename(curPath);
    var leafParent = path.basename(path.dirname(curPath));
    if (leafParent === 'node_modules' && linkedPackages.indexOf(leaf) !== -1) {
      walker.pause();
      linkPath(path.dirname(path.dirname(curPath)), leaf).then(function() {
        walker.resume();
      });
    }
  });
}

function linkPath(projectPath, packageName) {
  return npmUninstall(projectPath, packageName).
    then(function() {
      return npmLink(projectPath, packageName);
    });
}

function npmUninstall(cwd, packageName) {
  return new Promise(function(resolve) {
    exec('npm uninstall ' + packageName, { cwd: cwd }, function(error, stdout, stderr) {
      resolve();
    });
  });
}

function npmLink(cwd, packageName) {
  return new Promise(function(resolve) {
    exec('npm link ' + packageName, { cwd: cwd }, function(error, stdout, stderr) {
      resolve();
    });
  });
}

getRoot(true).then(function(prefix) {
  var linkedPackages = getLinkedPackages(prefix);
  linkAll(linkedPackages);
});
