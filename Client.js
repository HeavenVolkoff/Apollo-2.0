/**
 * Created by HeavenVolkoff on 12/22/14.
 */
var basicFunc = require('./basicFunction');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var request = require("request");

module.exports = Client;

function Client(username, password){
    "use strict";

    var self = this;
    var controller = null;

    EventEmitter.call(this);

    if(!(basicFunc.notEmpty(username) && basicFunc.notEmpty(password))){
        this.emit('error', new Error('Invalid Parameters'));
    }

    this.addController = function addController(newController){
        if(!controller && typeof newController === 'object'){
            controller = newController;
        }else if(controller) {
            this.emit('error',  new Error('Client already has a controller'));
        }else{
            this.emit('error',  new Error('Invalid Controller'));
        }
    };

    Object.defineProperties(this, {
        connected: {
            value: false,
            writable: true
        },
        username: {
            get: function(){
                return username;
            }
        },
        password: {
            get: function(){
                return password;
            }
        },
        controller: {
            get: function(){
                if(typeof controller === 'object'){
                    return controller;
                }else{
                    self.emit(new Error('Missing Controller'));
                }
            }
        },
        cookieJar: {
            value: request.jar()
        },
        link: {
            get: function(){
                return {
                    login: 'http://procweb.jfrj.jus.br/portal/login.asp',
                    intimation: 'http://procweb.jfrj.jus.br/portal/intimacao/conf_intim_xml.asp?',
                    process: 'http://procweb.jfrj.jus.br/portal/consulta/cons_procs.asp?'
                };
            }
        }
    });
}

util.inherits(Client, EventEmitter);