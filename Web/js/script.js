/**
 * Created by HeavenVolkoff on 12/27/14.
 */
String.prototype.capitalize = function() {
	return this.charAt(0).toUpperCase() + this.slice(1);
};

function optionOffset($option) {
	//Magic Numbers Everywhere
	var i = $option.index();
	var h = Number($option.css('font-size').replace(/px/, '')) + 3; // Cannot get the height of the option element :(
	var $select = $option.parent();
	var offset = $select.offset();
	offset.top += i*h - $select.scrollTop() - 67; //Fix Bug in Safari
	return offset;
}

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

			client.removeListener(event, callback);
			client.realOn.apply(client, arguments);
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
		setTimeout(function(){
			$('#progressLogin').collapse('hide');
			button.attr('disabled', false);
		}, 100);
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
					var dateSelect = $('#initialDateMonth');
					var daySelect = $('#initialDateDay');

					var optionOffsetTop = selectOption('#initialDateMonth', today.getMonth()+1 < 10? '0' + today.getMonth()+1 : today.getMonth()+1).offset().top;
						optionOffsetTop = optionOffsetTop && !isNaN(optionOffsetTop)? optionOffsetTop : optionOffset(selectOption('#initialDateMonth', today.getMonth()+1 < 10? '0' + today.getMonth()+1 : today.getMonth()+1)).top;

					dateSelect.animate({
						scrollTop: dateSelect.scrollTop() + (optionOffsetTop - dateSelect.offset().top)
					}, 1000);

					optionOffsetTop = selectOption('#initialDateDay', today.getDate() < 10? '0' + today.getDate() : today.getDate()).offset().top;
					optionOffsetTop = optionOffsetTop && !isNaN(optionOffsetTop)? optionOffsetTop : optionOffset(selectOption('#initialDateDay', today.getDate() < 10? '0' + today.getDate() : today.getDate())).top;

					daySelect.animate({
						scrollTop: daySelect.scrollTop() + (optionOffsetTop - daySelect.offset().top)
					}, 1000);
				}, 250);
		}else{
			$('#loginError').collapse('show');
			button.attr('disabled', false);
		}
	});

	client.on('intimation', function(intimations){
		var button = $('#queryInt');
		setTimeout(function(){
			$('#progressIntimation').collapse('hide');
			button.attr('disabled', false);
		}, 100);
		button.text('Pesquisar');
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
						var processos = $('.processos');
						appendDOM(processos.find('ul'), array, function(error){
							if(!error){
								var li = processos.find('li');
								li.off();
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
									$('.pecas ul').empty();

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
					var pecas = $('.pecas');

					appendDOM(pecas.find('ul'), array, function(error){
						if(!error){
							var li = pecas.find('li');
							li.off();
							li.click(function(){
								var self = $(this);
								var preview = $('.preview');
								// Menu
								if (self.is(".active")){
									$('#peca_'+self.data('index')).remove();
									preview.collapse('show');
									self.removeClass("active");
									return
								}

								li.not(self).removeClass("active");
								self.addClass("active");

								preview.collapse('hide').siblings().remove();
								if(self.data('status')){
									//$('#document').append($('<iframe>').addClass('collapse').attr({src: self.data('url')}));
									setTimeout(function(){
										$('#document')
											.append(
												$('<embed>').addClass('pdf').attr({src: self.data('url'), type: "application/pdf"})
												//$('<object>').addClass('pdf').attr({id: 'peca_'+self.data('index'), data: self.data('url'), type: "application/pdf", onerror: 'alert("Error")', onemptied: 'alert("Emptied")', onstalled: 'alert("Stalled")', onload:'alert("Load")', typemustmatch: false})
												//	.append(
												//		//$('<embed>').addClass('pdf').attr({src: self.data('url'), type: "application/pdf"})
												//		$('<div>').text('Essa Porra Não Funciona')
												//	)
											);
									}, 200);
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
						var daySelect = $('#initialDateDay');

						$.material.input('#initialDateYear');
						$("#initialDateYear").val(today.getFullYear());
						$("#initialDateMonth")
							.val(today.getMonth()+1 < 10? '0' + today.getMonth()+1 : today.getMonth()+1).click(function(){
								var self = $(this);
								var selected = self.find('option[value="'+ self.val() +'"]');
								var dayOption = daySelect.find('option');

								if(selected.is('.active')){
									return
								}

								selected.addClass('active');
								$("#initialDateMonth").find('option').not(selected).removeClass("active");

								for(var days = daysInMonth(Number(selected.val()) ,today.getFullYear()), day = 1; day <= 31; day++){
									var option = selectOption('#initialDateDay', day < 10? '0' + day : day);
									if(!option.length && day <= days){
										daySelect.append($('<option>').val(day < 10? '0' + day : day).text(day));
									}else if(day > days && option.length){
										option.remove();
									}
								}

								if(!daySelect.find('.active').length){
									var optionOffsetTop = selectOption('#initialDateDay', days < 10? '0' + days : days).offset().top;
									optionOffsetTop = optionOffsetTop && !isNaN(optionOffsetTop)? optionOffsetTop : optionOffset(selectOption('#initialDateDay', days < 10? '0' + days : days)).top;

									daySelect.val(days < 10? '0' + days : days);
									daySelect.animate({
										scrollTop: daySelect.scrollTop() + (optionOffsetTop - daySelect.offset().top)
									}, 500)
								}
							});

						daySelect.val(today.getDate());
						daySelect.click(function(){
							var self = $(this);
							var selected = self.find('option[value="'+ self.val() +'"]');

							if(selected.is('.active')){
								return
							}

							selected.addClass('active');
							$("#initialDateDay").find('option').not(selected).removeClass("active");
						});
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
			client.emit('requestIntimation', {
				initialDate: day + month + year,
				finalDate: day + month + year,
				assort: 'varaJuizado',
				userOnly: true
			});
		});
	});
})();