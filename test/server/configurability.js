var name = require.resolve('superagent');
delete require.cache[name];
delete superagent;
var expect = require('expect');
var express = require('express');
var superagent = require('superagent');
var cModule = require('cache-service-cache-module');
var cacheModule = new cModule({backgroundRefreshInterval: 500});
require('../../superagentCache')(superagent, cacheModule, null);
//To make sure requiring a second time won't break anything
require('../../superagentCache')(superagent, cacheModule, null);

var app = express();

app.get('/one', function(req, res){
  res.send(200, {key: 'one'});
});

app.get('/four', function(req, res){
  res.send(400, {key: 'one'});
});

app.post('/one', function(req, res){
  res.send(200, {key: 'post'});
});

app.put('/one', function(req, res){
  res.send(200, {key: 'put'});
});

app.patch('/one', function(req, res){
  res.send(200, {key: 'patch'});
});

app.delete('/one', function(req, res){
  res.send(200, {key: 'delete'});
});

app.get('/false', function(req, res){
  res.send(200, {key: false});
});

app.get('/params', function(req, res){
  res.send(200, {pruneQuery: req.query.pruneQuery, otherParams: req.query.otherParams});
});

app.get('/options', function(req, res){
  res.send(200, {pruneHeader: req.get('pruneHeader'), otherOptions: req.get('otherOptions')});
});

app.get('/redirect', function(req, res){
  res.redirect('/one');
});

app.get('/404', function(req, res){
  res.send(404);
});

var count = 0;
app.get('/count', function(req, res){
  count++;
  res.send(200, {count: count});
});

var delayCount = 0;
app.get('/delay', function(req, res){
  delayCount++;
  setTimeout(function(){
    res.send(200, {delayCount: delayCount});
  }, 250);
});

var delayCount2 = 0;
app.get('/delay2', function(req, res){
  delayCount2++;
  setTimeout(function(){
    res.send(200, {delayCount: delayCount2});
  }, 250);
});

app.listen(3004);

describe('superagentCache', function(){

  beforeEach(function(){
    superagent.cache.flush();
  });

  describe('configurability tests', function () {

    it('Should be able to configure global settings: doQuery', function (done) {
      superagent.defaults = {doQuery: false, expiration: 1};
      superagent
        .get('localhost:3004/one')
        .end(function (err, response, key){
          superagent.cache.get(key, function (err, response) {
            expect(response).toBe(null);
            done();
          });
        }
      );
    });

    it('Global settings should be locally overwritten by chainables: doQuery', function (done) {
      superagent.defaults = {doQuery: false, expiration: 1};
      superagent
        .get('localhost:3004/one')
        .doQuery(true)
        .end(function (err, response, key){
          superagent.cache.get(key, function (err, response) {
            expect(response).toNotBe(null);
            expect(response.body.key).toBe('one');
            done();
          });
        }
      );
    });

    it('Should be able to configure global settings: expiration', function (done) {
      superagent.defaults = {doQuery: false, expiration: 1};
      superagent
        .get('localhost:3004/one')
        .doQuery(true)
        .end(function (err, response, key){
          superagent.cache.get(key, function (err, response) {
            expect(response).toNotBe(null);
            expect(response.body.key).toBe('one');
            setTimeout(function(){
              superagent
                .get('localhost:3004/one')
                .end(function (err, response, key){
                  superagent.cache.get(key, function (err, response) {
                    expect(response).toBe(null);
                    done();
                  });
                }
              );
            }, 1000);
          });
        }
      );
    });

    it('Global settings should be locally overwritten by chainables: expiration', function (done) {
      superagent.defaults = {doQuery: false, expiration: 1};
      superagent
        .get('localhost:3004/one')
        .doQuery(true)
        .expiration(2)
        .end(function (err, response, key){
          superagent.cache.get(key, function (err, response) {
            expect(response).toNotBe(null);
            expect(response.body.key).toBe('one');
            setTimeout(function(){
              superagent
                .get('localhost:3004/one')
                .end(function (err, response, key){
                  superagent.cache.get(key, function (err, response) {
                    expect(response).toNotBe(null);
                    expect(response.body.key).toBe('one');
                    done();
                  });
                }
              );
            }, 1000);
          });
        }
      );
    });

  });

});
