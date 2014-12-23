/**
 * Created by HeavenVolkoff on 12/22/14.
 */
var Client = require('./Client');
var basicFunc = require('./basicFunction');
var request = require("request");
var url = require('url');
var parseString = require('xml2js').parseString;

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

Controller.prototype.login = function apolloLogin(callback){
    "use strict";

    callback = typeof callback === 'function'? callback : function(error){if(error){throw error;}};
    var self = this;
    var host = url.parse(self.client.link.login);

    request(
        {
            url: host,
            method: "GET",
            jar: self.client.cookieJar
        },
        function(error) {
            if(!error) {
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
                    }, function (error, response, body) {
                        if (!error) {
                            if(response.statusCode < 400) {
                                self.client.connected = true;
                                callback(null, {
                                    url: host,
                                    gzip: true,
                                    followAllRedirects: true,
                                    jar: self.client.cookieJar
                                });
                            }else{
                                callback(new Error('Html request error: ' + response.statusCode));
                            }
                        } else {
                            callback(error);
                        }
                    }
                );
            }else{
                callback(error);
            }
        }
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
        X:      'C',                                                                        //Constante
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
        self.client.emit('error', new Error('Not Logged In'));
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
                    jar: self.client.cookieJar
                },
                function(error, response, body) {
                    if (!error) {
                        parseString(body, function (error, result) {
                            if(!error){
                                callback(null, result);
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

Controller.prototype.processURL = function makeProcessURL(processNumber){
    "use strict";

    return this.client.link.process + 'NumProc=' + processNumber.toString();
};

Controller.prototype.requestProcessInfo = function requestProcessInfo(processNumber, callback){
    "use strict";

    var self = this;

    if(!self.client.connected){
        self.client.emit('error', new Error('Not Logged In'));
        return;
    }

    var host = typeof processNumber === 'object' && processNumber.hasOwnProperty('host')? processNumber : typeof processNumber === 'string'? url.parse(self.processURL(processNumber)) : null;

    if(!host){
        self.emit('error', new Error('Invalid Process Number'));
        return;
    }

    request({
            url: host,
            method: "GET",
            jar: self.client.cookieJar
        },
        function(error, response, body) {
            if (!error) {
                console.log(body);
            } else {
                callback(error);
            }
        }
    );
};