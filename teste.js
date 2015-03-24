var Client = require('./Client');
var Controller = require('./Controller');
var async = require('async');

(function(username, password){
    "use strict";

    var user = new Client(username, password);
    var controller = new Controller(user);

    user.controller.login(function(error, login){
        //console.log(error);
        //console.log(loginObj);
        if(!error && login){
            user.controller.requestIntimation({
                initialDate: '26112014',
                finalDate: '26112014',
                assort: 'varaJuizado',
                userOnly: true
            }, function(error, xml){
                async.eachSeries(xml,
                    function(item, callback){
                        console.log(item);
                        user.controller.requestProcessInfo(item.NUMPROCCOMPL[0], function(error, links){
                            if(!error){
                                console.log(links);
                                callback();
                            }else{
                                callback(error);
                            }
                        });
                    },
                    function(error){
                        if(error){
                            throw error;
                        }
                    }
                );
            });
        }
    });

    //user.controller.intimationURL('30112014', '30112014', null, null, null, null, null, null, 'varaJuizado', null, null, null, true, function(url){console.log(url);});
})('USERNAME', 'PASSWORD');
