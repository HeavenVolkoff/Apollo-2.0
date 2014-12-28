/**
 * Created by HeavenVolkoff on 12/27/14.
 */
function daysInMonth(month, year) {
	return new Date(year, month, 0).getDate();
}

function selectOption(element, i) {
	return $(element + ' option[value="' + i + '"]');
}

function notEmpty(str){
	"use strict";

	return (typeof str === 'string' && !!str.length);
}

function appendDOM(initial, array, callback){
	'use strict';

	initial = initial instanceof Element? $(initial) : initial;

	if(!(initial instanceof $)){
		callback(new Error('Invalid Initial Value'));
	}else{
		array = Array.isArray(array)? array : [];
		var DOM = initial;
		var index = 0;

		async.eachSeries(
			array,
			function(item, callback){
				item = item instanceof Element? $(item) : item;

				if(item instanceof $ && item.jquery){
					if(Array.isArray(array[++index])){
						appendDOM(item, array[index], function(error, dom){
							if(!error){
								callback(error, null);
							}else{
								$.fn.append.call(DOM, dom);
								callback();
							}
						});
					}else{
						$.fn.append.call(DOM, item);
						callback();
					}
				}
			},
			function(error){
				if(error){
					callback(error, null);
				}else{
					callback(null, DOM);
				}
			}
		);
	}
}

(function(){
	var client = io.connect('localhost:1969');
	client.busy = false;
	client.logged = false;

	client.on('errorMessage', function(error){
		console.log('Error: ' + error);
	});

	client.on('connected', function(connected){
		console.log('connected' + connected);
		var button = $('#loginButton');
		$('#progressLogin').collapse('hide');
		button.text('Entrar');
		button.spin(false);

		if(connected){
			client.logged = true;
			$('#loginDialog').modal('hide');
			$('#intimationForm').modal('show').find('.modal-dialog').css('margin-top', 'calc(50vh - (321px/2))');
		}else{
			$('#loginError').collapse('show');
		}
	});

	client.on('intimation', function(intimations){
		if(Array.isArray(intimations)){
			$('#intimationForm').modal('hide');
			async.map(intimations,
				function(item, callback){
					/*
					 */
					console.log(item);
					if(item.hasOwnProperty('NUMPROCCOMPLANT')){
						callback(null, $('<li>').addClass('withripple').text(item.NUMPROCCOMPLANT[0]));
					}else{
						callback(new Error('Error with Process Number'));
					}
				},
				function(error, array){
					if(!error){
						console.log(array);
						appendDOM($('.processos ul'), array, function(error){
							if(!error){
								$(".processos li").click(function() {
									// Menu
									if ($(this).is(".active")) return;
									$(".processos li").not($(this)).removeClass("active");
									$(this).addClass("active");
								});
							}else{
								throw error;
							}
						})
					}else{
						throw error;
					}
				}
			);
		}else{
			setInterval(function(){
				$('#intimationError').collapse('show');
			}, 100);
		}
	});

	client.on('processInfo', function(pdfLinks){
		async.eachSeries(pdfLinks,
			function(item, callback){
				/*

				 */
				console.log(item);
				callback();
			},
			function(error){
				if(error){
					throw error;
				}
			}
		);
	});

	$(document).ready(function() {
		$.material.init();

		var today = new Date();
		var years = today.getFullYear();
		var yearArr = [];

		async.whilst(
			function(){
				return years >= today.getFullYear() - 100;
			},
			function(callback){
				yearArr.push($('<option>').val(years).text(years));
				years--;
				callback();
			},
			function(err){
				appendDOM($('#initialDateYear'), yearArr, function(error, DOM){
					if(!error){
						$.material.input('#initialDateYear');
						$("#initialDateYear").val(today.getFullYear());
						$("#initialDateMonth").val(today.getMonth() < 10? '0' + today.getMonth() : today.getMonth());

						for(var days = daysInMonth(today.getMonth(), today.getFullYear()), day = 31; day > days; day--){
							selectOption('#initialDateDay', day).hide();
						}

						$("#initialDateDay").val(today.getDate());
					}else{
						throw error;
					}
				})
			}
		);


		$('#loginDialog').modal('show').find('.modal-dialog').css('margin-top', 'calc(50vh - (255px/2))');

		$(".pecas li").click(function() {
			// Menu
			if ($(this).is(".active")) return;
			$(".pecas li").not($(this)).removeClass("active");
			$(this).addClass("active");
		});

		$("#loginButton").click(function(){
			var loginError = $('#loginError');
			if(loginError.css('display') !== 'none' && loginError.css('visibility') !== 'hidden'){
				loginError.collapse('hide');
			}
			var login = $('#login').val();
			var password = $('#password').val();
			if(notEmpty(login) && notEmpty(password)){
				var button = $('#loginButton');
				var height = button.height();
				var width = button.width();

				$('#progressLogin').collapse('show');
				button.text('');
				button.height(height);
				button.width(width);
				button.spin({
					lines: 11,
					length: 5,
					width: 3,
					radius: 5,
					corners: 1
				});
				client.emit('login', login, password);
			}else{
				loginError.collapse('show');
			}
		});

		$('#queryInt').click(function(){
			var intimationError = $('#intimationError');
			if(intimationError.css('display') !== 'none' && intimationError.css('visibility') !== 'hidden'){
				intimationError.collapse('hide');
			}
			var day = $('#initialDateDay').val()[0].toString();
			var month = $('#initialDateMonth').val()[0].toString();
			var year = $('#initialDateYear').val()[0].toString();
			client.emit('requestIntimation', {
				initialDate: day + month + year,
				finalDate: day + month + year,
				assort: 'varaJuizado',
				userOnly: true
			})
		});
	});
})();