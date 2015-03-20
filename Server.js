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

		console.log('Client connected ' + socket.id);
		socket.apolloClient = new Client();
		(new Controller(socket.apolloClient));

		socket.on('login', function (username, password){
			console.log('Client ' + socket.id + ' attempt to login');

			if(username && password) {
				if(!socket.apolloClient.connected) {
					try {
						socket.apolloClient.credentials(username, password);

					} catch(error){
						console.log('Client ' + socket.id + ' Login Attempt failed. Error: ' + error);
						socket.emit('login', error);
					}
				}

				socket.apolloClient.controller.login(function(error, login){
					socket.emit('login', error, login);

					if(!error && login){
						console.log('Client ' + socket.id + ' logged in');
					}else{
						console.log('Client ' + socket.id + ' Login Attempt failed. Login: ' + login + ' Error: ' + error);
					}
				});
			}else{
				socket.emit('login', new Error('Missing Login Information'));
				console.log('Client ' + socket.id + ' Attempt failed. Error: Missing Login Info');
			}
		});

		socket.on('requestIntimation', function(requestObj){
			console.log('Client ' + socket.id + ' request Intimation');

			socket.apolloClient.controller.requestIntimation(requestObj,
				function(error, xml){
					socket.emit('intimation', error, xml);

					if(!error){
						console.log('Client ' + socket.id + ' got Intimation');
					}else{
						console.log('Client ' + socket.id + ' Intimation Error: ' + error);
					}
				}
			);
		});

		socket.on('requestProcessInfo', function(processNumber){
			console.log('Client ' + socket.id + ' request Process Info');

			socket.apolloClient.controller.requestProcessInfo(processNumber,
				function(error, links){
					socket.emit('processInfo', error, links);

					if(!error){
						console.log('Client ' + socket.id + ' got Process Info');
					}else{
						console.log('Client ' + socket.id + ' Process Info Error: ' + error);
					}
				}
			);
		});

		socket.on('requestProcessPiece', function(pieceURL, id){
			console.log('Client ' + socket.id + ' request Process Piece');

			socket.apolloClient.controller.requestPiece(pieceURL, function(error, pdfLink){
				socket.emit('processPiece', error, pdfLink, id);

				if(!error){
					console.log('Client ' + socket.id + ' got Process Piece');
				}else{
					console.log('Client ' + socket.id + ' Process Piece Error: ' + error);
				}
			});
		})
	}
);