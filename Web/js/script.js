/**
 * Created by HeavenVolkoff on 12/27/14.
 */
String.prototype.capitalize = function() {
	return this.charAt(0).toUpperCase() + this.slice(1);
};

function daysInMonth(month, year) {
	"use strict";

	return new Date(year, month, 0).getDate();
}

function fixCurrency(text){
	'use strict';
		text = text.toString();
	var v = text.indexOf(',');

	if(v !== -1){
		i = v;
		v = text.slice(v, text.length);
		text = text.slice(0, i);
	}else{
		v = ',00';
	}

	text = text.split('');
	for(var i = text.length - 1, counter = 1; i >= 0; i--, counter++){
		if(counter > 1 && !(counter % 3) && text[i-1]){
			text.splice(i, 0, '.');
		}
	}

	return 'R$' + text.join('') + v;
}

function selectOption(element, i) {
	"use strict";

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
				}else{
					callback(new Error('Jquery is required'));
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
	'use strict';
	var client = io.connect('localhost:1969');
		client.busy = {};
		client.realEmit = client.emit;
		client.realOn = client.on;
		client.emit = function(event){
			if(!client.busy[event]){
				var counterPart = event.indexOf('request');
					counterPart = counterPart !== -1? event.slice(('request').length, event.length).toLowerCase() : event;
				if(client.listeners(counterPart).length){
					client.busy[event] = true;
				}
				client.realEmit.apply(client, arguments);
			}
		};
		client.on = function(event){
			var callback = function(){
				var counterPart = client.busy[event] !== undefined? event : client.busy['request' + event.capitalize()] !== undefined ? 'request' + event.capitalize() : null;
				if(counterPart){
					client.busy[counterPart] = false;
				}
			};

			client.removeListener(event, callback).realOn.apply(client, arguments);
			client.realOn.call(client, event, callback);
		};

	var today = new Date();

	var heightWatch = function(interval, oldHeight){
		if(interval instanceof $ && interval.jquery){
			var height = interval.height();
			if(height !== oldHeight) {
				interval.trigger('height');
			}
			if(oldHeight === 0 || interval.is(":visible")){
				setTimeout(
					function(){
						heightWatch(interval, height);
					}, 250
				)
			}
		}
	};

	client.on('errorMessage', function(error){
		console.log('Error: ' + error);
	});

	client.on('login', function(connected){
		var button = $('#loginButton');
		$('#progressLogin').collapse('hide');
		button.text('Entrar');
		button.spin(false);

		if(connected){
			$('#loginDialog').modal('hide');
			var modal = $('#intimationForm').modal('show').find('.modal-dialog');
			modal.on('height', function(){
				var intimationForm = $(this);
				intimationForm.css('margin-top', 'calc(50vh - ('+ intimationForm.height() +'px/2))');
			});
			heightWatch(modal, modal.height());
			setTimeout(
				function(){
					$('#initialDateMonth').animate({
						scrollTop: selectOption('#initialDateMonth', today.getMonth()+1 < 10? '0' + today.getMonth()+1 : today.getMonth()+1).offset().top
					}, 1000);
					$('#initialDateDay').animate({
						scrollTop: selectOption('#initialDateDay', today.getDate() < 10? '0' + today.getDate() : today.getDate()).offset().top
					}, 1000);
					button.attr('disabled', false);
				}, 500);
		}else{
			$('#loginError').collapse('show');
			button.attr('disabled', false);
		}
	});

	client.on('intimation', function(intimations){
		var button = $('#queryInt');
		setTimeout(function(){
			$('#progressIntimation').collapse('hide');
		}, 100);
		button.text('Entrar');
		button.spin(false);
		if(Array.isArray(intimations)){
			$('#intimationForm').modal('hide');
			async.map(intimations,
				function(item, callback){
					if(item.hasOwnProperty('numproccomplant')){
						var text = Array.isArray(item.txt)? item.txt[0] : item.txt;
						appendDOM($('<li>')
							.data(
							{
								numero: item.numproccompl,
								numeroAnt: item.numproccomplant,
								texto: text.replace(/\n/g, "<br />"),
								dataAutuacao: item.dtautua,
								descricao: item.descr,
								dataIntimacao: item.dtindcit,
								valor: item.valcausa,
								autor: item.nome[1],
								reu: item.nome[0],
								prazoFinal: item.dtfimindcit
							})
							.addClass('withripple row'),
							[
								$('<div>').addClass('col-sm-9').text(Array.isArray(item.numproccomplant)? item.numproccomplant[0] : item.numproccomplant),
								$('<div>').addClass('spin col-sm-3')
							],
							function(error, dom){
								callback(error, dom);
							});
					}else{
						callback(new Error('Error with Process Number'));
					}
				},
				function(error, array){
					if(!error){
						appendDOM($('.processos ul'), array, function(error){
							if(!error){
								var li = $('.processos li');
								li.click(function() {
									var self = $(this);
									// Menu
									if (self.is(".active")){
										return;
									}

									li.not(self).removeClass("active");
									self.addClass("active");

									$('#numero').text(self.data('numero'));
									$('#numeroAnt').text(self.data('numeroAnt'));
									$('#dataAutuacao').text(self.data('dataAutuacao'));
									$('#descricao').text(self.data('descricao'));
									$('#autor').text(self.data('autor'));
									$('#reu').text(self.data('reu'));
									$('#valor').text(fixCurrency(self.data('valor')));
									$('#texto').empty().append(self.data('texto'));
									$('.preview').collapse('show').siblings().remove();

									client.emit('requestProcessInfo', self.data('numero'));
									self.find('.spin').spin({
										lines: 11,
										length: 5,
										width: 3,
										radius: 5,
										corners: 1
									});
								});
								//$(li[0]).click();
							}else{
								throw error;
							}
						});
					}else{
						throw error;
					}
				}
			);
		}else{
			setTimeout(function(){
				$('#intimationError').collapse('show');
			}, 100);
		}
	});

	client.on('processInfo', function(pdfLinks){
		$('.processos li').find('.spin').spin(false);
		async.map(pdfLinks,
			function(item, callback){
				console.log(item);

				appendDOM($('<li>')
						.data(
						{
							nome: item.nome,
							status: item.status,
							data: item.dti,
							url: item.url,
							pagInicial: item.npi,
							quatPags: item.npt,
							index: item.p2
						})
						.addClass('withripple row'),
					[
						$('<div>').addClass('col-sm-12').text(item.nome)
					],
					function(error, dom){
						callback(error, dom);
					}
				);
			},
			function(error, array){
				if(!error){
					appendDOM($('.pecas ul'), array, function(error){
						if(!error){
							var li = $('.pecas li');
							li.click(function(){
								var self = $(this);
								// Menu
								if (self.is(".active")){
									return;
								}

								li.not(self).removeClass("active");
								self.addClass("active");

								$('.preview').collapse('hide').siblings().remove();
								if(self.data('status')){
									$('#document').append($('<object>').addClass('pdf').attr({id: 'peca_'+self.data('index'), data: self.data('url'), type: "application/pdf"}).append($('<embed>').attr({src: self.data('url'), type: "application/pdf"})));
								}
							});
						}
					});
				}else {
					throw error;
				}
			}
		);
	});

	$(document).ready(function() {
		$.material.init();

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
						$("#initialDateMonth").val(today.getMonth()+1 < 10? '0' + today.getMonth()+1 : today.getMonth()+1);


						for(var days = daysInMonth(today.getMonth(), today.getFullYear()), day = 31; day > days; day--){
							selectOption('#initialDateDay', day).hide();
						}

						$("#initialDateDay").val(today.getDate());
					}else{
						throw error;
					}
				});
			}
		);


		var modal = $('#loginDialog').modal('show').find('.modal-dialog');
		modal.on('height', function(){
			var intimationForm = $(this);
			intimationForm.css('margin-top', 'calc(50vh - ('+ intimationForm.height() +'px/2))');
		});
		heightWatch(modal, modal.height());

		$("#loginButton").click(function(){
			var loginError = $('#loginError');
			if(loginError.css('display') !== 'none' && loginError.css('visibility') !== 'hidden'){
				loginError.collapse('hide');
			}
			var login = $('#login').val();
			var password = $('#password').val();
			if(notEmpty(login) && notEmpty(password)){
				var button = $(this);
				var height = button.height();
				var width = button.width();

				$('#progressLogin').collapse('show');
				button.attr('disabled', true);
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
			var button = $(this);
			var height = button.height();
			var width = button.width();

			$('#progressIntimation').collapse('show');
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
			client.emit('requestIntimation', {
				initialDate: day + month + year,
				finalDate: day + month + year,
				assort: 'varaJuizado',
				userOnly: true
			});
		});
	});
})();