/**
 * Created by HeavenVolkoff on 12/27/14.
 */
var server = require('http').createServer();
var socket = require('socket.io');
var Client = require('./Client');
var Controller = require('./Controller');

server.listen(1969);
var io = socket.listen(server);

io.on('connection',
	function (socket) {
		"use strict";

		console.log('user connected ' + socket.id);

		socket.on('error', function(error){
			throw error;
			socket.emit('errorMessage', error);
		});

		socket.on('login', function (username, password){
			console.log('Client ' + socket.id + ' attempt to login');
			if(username && password) {
				socket.apolloClient = new Client(username, password);
				var controller = new Controller(socket.apolloClient);
				socket.apolloClient.controller.login(function(error, login){
					if(!error){
						console.log('Client ' + socket.id + ' logged in');
						socket.emit('connected', login);
					}else{
						console.log('Client ' + socket.id + ' Attempt failed');
						socket.emit('error', error);
					}
				});
			}else{
				socket.emit('error', new Error('Missing Login Information'));
			}
		});

		socket.on('requestIntimation', function(requestObj){
			console.log('Client ' + socket.id + ' request Intimation');
			console.log(requestObj);
			socket.apolloClient.controller.requestIntimation(requestObj,
				function(error, xml){
					if(!error){
						console.log('Client ' + socket.id + ' get Intimation');
						socket.emit('intimation', xml);
					}else{
						socket.emit('error', error);
					}
				}
			);
		});

		socket.on('requestProcessInfo', function(processNumber){
			socket.apolloClient.controller.requestProcessInfo(processNumber,
				function(error, links){
					if(!error){
						socket.emit('processInfo', links);
					}else{
						socket.emit('error', error);
					}
				}
			);
		});
	}
);