/**
 * Created by HeavenVolkoff on 12/22/14.
 */
var basicFunc = require('./basicFunction');
var request = require("request");

module.exports = Client;

function Client(username, password){
    "use strict";

    var controller = null;

    this.credentials = function(user, pass){
        if(basicFunc.notEmpty(user) && basicFunc.notEmpty(pass) && !(basicFunc.notEmpty(username) && basicFunc.notEmpty(password)) ){
            username = user;
            password = pass;
        }else{
            throw new Error('Client already has username and password');
        }
    };

    this.addController = function addController(newController){
        if(!controller && typeof newController === 'object'){
            controller = newController;
        }else if(controller) {
            throw new Error('Client already has a controller');
        }else{
            throw new Error('Invalid Controller');
        }
    };

    Object.defineProperties(this, {
        online: {
            value: false,
            writable: true
        },
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
                    throw new Error('Missing Controller');
                }
            }
        },
        cookieJar: {
            value: request.jar()
        },
        link: {
            get: function(){
                return {
                    home: 'http://procweb.jfrj.jus.br/portal/',
                    login: 'http://procweb.jfrj.jus.br/portal/login.asp',
                    intimation: 'http://procweb.jfrj.jus.br/portal/intimacao/conf_intim_xml.asp?',
                    consulta: 'http://procweb.jfrj.jus.br/portal/consulta/',
                    process: 'http://procweb.jfrj.jus.br/portal/consulta/cons_procs.asp?',
                    processInfo: 'http://procweb.jfrj.jus.br/portal/consulta/reslistproc.asp',
                    processPieces: 'http://procweb.jfrj.jus.br/portal/consulta/resinfopecas2.asp?',
                    showFile: 'http://procweb.jfrj.jus.br/portal/consulta/mostraarquivo.asp?'
                };
            }
        }
    });
}