/**
 * Created by HeavenVolkoff on 12/22/14.
 */

var async = require('async');
var Client = require('./Client');
var basicFunc = require('./basicFunction');
var request = require("request").defaults({encoding: 'iso-8859-1'});
var url = require('url');
var parseString = require('xml2js').parseString;
var cheerio = require('cheerio');
var iconv = require('iconv-lite');

iconv.extendNodeEncodings();

module.exports = Controller;

function Controller(client){
    "use strict";

    if(client instanceof Client){
        client.addController(this);
    }else{
        throw new Error('Invalid Client');
    }

    Object.defineProperties(this, {
        client: {
            get: function(){
                if(client instanceof Client){
                    return client;
                }else{
                    throw new Error('Invalid Client');
                }
            }
        }
    });
}

Controller.prototype.isOnline = function isOnline(callback){
    callback = typeof callback === 'function'? callback : function(error){if(error){throw error;}};
    var self = this;
    var host = url.parse(self.client.link.login);

    request(
        {
            url: host,
            method: "GET",
            jar: self.client.cookieJar
        },
        function(error, response, body){
            if(!error){
                if(response.statusCode < 400) {
                    self.client.online = true;
                    callback(null, true, response.statusCode);
                }else{
                    self.client.online = false;
                    callback(null, false, response.statusCode);
                }
            }else{
                callback(error);
            }

        }
    );
};

Controller.prototype.login = function apolloLogin(callback){
    "use strict";

    callback = typeof callback === 'function'? callback : function(error){if(error){throw error;}};
    var self = this;
    var host = url.parse(self.client.link.login);

    async.waterfall(
        [
            function(callback){
                self.isOnline(function(error, online, statusCode){
                    if(!error){
                        if(online){
                            request(
                                {
                                    url: host,
                                    method: 'POST',
                                    gzip: true,
                                    followAllRedirects: true,
                                    jar: self.client.cookieJar,
                                    form: {
                                        Login: self.client.username,
                                        Ident: self.client.password,
                                        OK: '  OK  '
                                    }
                                },
                                callback
                            );
                        }else{
                            callback(new Error('Html request error: ' + statusCode));
                        }
                    }else{
                        callback(error);
                    }
                })
            },
            function(response, body, callback){
                if(response.statusCode < 400) {
                    if(body.indexOf('Atenção: É obrigatório o preenchimento dos campos Login e Senha.') !== -1 || body.indexOf('Atenção: Login ou Senha inválidos.') !== -1){
                        self.client.connected = false;
                        callback(null, false);
                    }else{
                        self.client.connected = true;
                        callback(null, true);
                    }
                }else{
                    callback(new Error('Html request error: ' + response.statusCode));
                }
            }
        ],
        callback
    );
};

Controller.prototype.intimationURL = function makeIntimationURL(initialDate, finalDate, initialValDate, finalValDate, subject, cadastreDate, motive, vara, assort, type, intimacao, assortType, userOnly, callback){
    "use strict";

    var assortment = { //Tipo da Ordenacao (Unico)
        processo: 'IP',
        dataCadastro: 'ID',
        motivo: 'IM',
        assunto: 'IA',
        tipoIntimacao: 'IT',
        varaJuizado: 'IV',
        vencimentoPrazo: 'IZ'
    };

    var queryType = { //Possiveis valores do tipo da pesquisa (Unico)
        intimacao: 'I',
        citacao: 'C',
        ambos: 'A'
    };

    var intimacaoType = { //Possiveis valores do tipo da Intimacao (Unico)
        omissao: 'S',
        confirmacao: 'N',
        ambos: 'A'
    };

    var query = {
        //X:      'C',                                                                      //Constante
        DI:     basicFunc.dateString(initialDate),                                          //Data Inicial da Intimacao
        DF:     basicFunc.dateString(finalDate),                                            //Data Final da Intimacao
        DIP:    basicFunc.dateString(initialValDate),                                       //Vencimento Inicial do Prazo
        DFP:    basicFunc.dateString(finalValDate),                                         //Vencimento Final do Prazo
        A:      subject? subject.toString() : null,                                         //Assunto
        DC:     basicFunc.dateString(cadastreDate),                                         //Data Cadastro
        DM:     motive? motive.toString() : null,                                           //Motivo
        V:      vara !== null && !isNaN(vara = Number(vara))? vara : null,                  //Vara
        TI:     queryType[type]? queryType[type] : queryType.ambos,                         //Tipo da pesquisa (Intimacao/Citacao)
        II:     intimacaoType[intimacao]? intimacaoType[intimacao] : intimacaoType.ambos,   //Tipo da Intimacao
        PU:     userOnly? 'S' : null                                                        //Somente Realizado pelo usuario (Sim/Nao) (default: nao)
    };

    if(assortment.hasOwnProperty(assort)){
        query[assortment[assort]] = 'S';
    }else{
        callback(new Error('Invalid Assortment Argument'));
    }

    if(assortType === 'D'){
        query.IDC = 'S';
    }

    basicFunc.makeQuery(query, callback);
};

Controller.prototype.requestIntimation = function requestIntimationXML(requestObj, callback){
    "use strict";

    var self = this;

    if(!self.client.connected){
        callback(new Error('Not Logged In'));
        return;
    }

    self.intimationURL(
        requestObj.initialDate,
        requestObj.finalDate,
        requestObj.initialValDate,
        requestObj.finalValDate,
        requestObj.subject,
        requestObj.cadastreDate,
        requestObj.motive,
        requestObj.vara,
        requestObj.assort,
        requestObj.type,
        requestObj.intimacao,
        requestObj.assortType,
        requestObj.userOnly,
        function(error, query){
            var host = url.parse(self.client.link.intimation + query);

            request({
                    url: host,
                    method: "GET",
                    encoding: null,
                    jar: self.client.cookieJar
                },
                function(error, response, body) {
                    if (!error) {
                        body = iconv.decode(body, 'utf-8');
                        if(body.indexOf('Arguments are of the wrong type, are out of acceptable range, or are in conflict with one another.') !== -1){
                            callback(null, null);
                            return;
                        }
                        parseString(body, {encoding: 'utf8', trim: true, explicitArray: false, async: true, normalizeTags: true}, function (error, result) {
                            if(!error){
                                callback(null, result.rowset.row); //TODO: this will probably always be right but is not the best way to do it
                            }else{
                                callback(error);
                            }
                        });
                    } else {
                        callback(error);
                    }
                }
            );
        }
    );
};

Controller.prototype._MostraPeca = function _MostraPeca( P1, P2, P3, DTI, NPI, NPT, TI, NV) {
    'use strict';

    return{
        status: true,
        url: this.client.link.showFile + 'P1='+P1+'&P2='+P2+'&P3='+P3+'&DTI='+DTI+'&NPI='+NPI+'&NPT='+NPT+'&TI='+TI+'&NV='+NV,
        p1: P1,
        p2: P2,
        p3: P3,
        dti: DTI,
        npi: NPI,
        npt: NPT,
        ti: TI,
        nv: NV
    };
};

Controller.prototype.processURL = function makeProcessURL(processNumber){
    "use strict";

    return this.client.link.process + 'NumProc=' + processNumber.toString();
};

Controller.prototype.requestProcessInfo = function requestProcessInfo(processNumber, callback){
    "use strict";

    var self = this;

    if(!self.client.connected){
        callback(new Error('Not Logged In'));
        return;
    }

    var host = url.parse(self.processURL(processNumber));
    var $ = null;

    async.waterfall(
        [
            function(callback){
                request(
                    {
                        url: host,
                        method: "GET",
                        jar: self.client.cookieJar
                    },
                    callback
                );
            },
            function(response, body, callback){
                request(
                    {
                        url: url.parse(self.client.link.processInfo),
                        method: "GET",
                        jar: self.client.cookieJar
                    },
                    callback
                );
            },
            function(response, body, callback){
                $ = cheerio.load(body);
                var processCode = $('#Procs').children('option').val();
                var query = {
                    NumProc: '',
                    CodDoc: processCode,
                    CodUsuWeb: 260,
                    CodMotiv: 123,
                    Confir: 'true'
                };

                basicFunc.makeQuery(query, callback);
            },
            function(query, callback){
                request(
                    {
                        url: url.parse(self.client.link.processPieces + query),
                        method: "GET",
                        jar: self.client.cookieJar
                    },
                    callback);
            },
            function (response, body, callback) {
                var arr = [];
                $ = cheerio.load(body);
                $('.link-under').each(
                    function (i, elem) {
                        elem = $(elem);
                        var href = elem.attr('href');
                        var pieceName = elem.text();
                        if(href){
                            var pdf = eval('self._' + href.replace(new RegExp('javascript:', 'g'), "")); //eval is here because i am lazy and dont want to parse the javascript function call string
                            pdf.nome = pieceName;
                            arr.push(pdf);
                        }else{
                            callback(new Error('Invalid .link-under class'));
                        }
                    }
                );
                callback(null, arr);
            }
        ],
        callback
    );
};

Controller.prototype.requestPiece = function requestPiece(host, callback){
    "use strict";

    if(!this.client.connected){
        callback(new Error('Not Logged In'));
        return;
    }

    var self = this;
    var $ = null;
    var pdfLink = null;

    async.whilst(
        function(){
            return pdfLink === null;
        },
        function(callback){
            request({
                url: url.parse(host),
                method: "GET",
                jar: self.client.cookieJar
            },
            function(error, response, body){
                if(!error){

                    if(body.indexOf('Este arquivo nao esta disponivel na Internet.') !== -1){
                        pdfLink = false; //Piece pdf url is unavailable, return;
                        callback();

                    }else{
                        $ = cheerio.load(body);

                        $('iframe').each(
                            function(i, elem){
                                var url = $(elem).attr('src');
                                if(url){
                                    pdfLink = url;
                                    return false;
                                }
                            }
                        );

                        if(pdfLink){
                            callback(); // has Piece pdf url, return

                        }else{
                            var link = null;

                            $('meta[http-equiv=Refresh]').each(
                                function(i, elem){
                                    var url = $(elem).attr('content');
                                    if(url){
                                        link = url;
                                        return false;
                                    }
                                }
                            );

                            if(link){
                                host = link.replace(new RegExp('2; URL=', 'g'), self.client.link.consulta);
                                callback(); // Piece pdf url moved place, retry;
                            }else{
                                callback(new Error('Invalid Pdf Link')); // Doesn't have Piece pdf url or moved link, return error;
                            }
                        }
                    }

                }else{
                    callback(error);
                }
            })
        },
        callback
    );
};