/**
 * Created by HeavenVolkoff on 12/22/14.
 */

var async = require('async');

/**
 * Extend Object prototype to verify an array of properties asynchronously
 *
 * @param {Array} props
 * @param {function} callback
 */
Object.prototype.hasOwnProperties = function (props, callback){
    'use strict';

    var self = this;
    props = props instanceof Array? props : typeof props === 'string'? [props] : [];

    async.detect(
        props,
        function(prop, callback){
            prop = typeof prop === 'string'? prop : prop.toString;
            callback(!self.hasOwnProperty(prop));
        },
        function(unknownProp){
            callback(unknownProp);
        }
    );
};

module.exports.notEmpty = function notEmpty(str){
    "use strict";

    return (typeof str === 'string' && str.length !== 0);
};

module.exports.dateString = function dateString(date){
    "use strict";

    if(date instanceof Date){
        var day = date.getDate();
        var month = date.getMonth();
        var year = date.getYear();

        if(day < 10){
            day = '0' + day;
        }
        if(month < 10){
            month = '0' + month;
        }

        return day+month+year;
    }else if(typeof date === 'string'){
        if(date.length === 8){
            return date;
        }
    }

    return null;
};



module.exports.makeQuery = function makeQuery(obj, callback){
    "use strict";

    var query = '';
    async.each(
        Object.keys(obj),
        function(key, callback){
            if(obj.hasOwnProperty(key) && obj[key] !== null && obj[key] !== undefined) {
                query += (key + '=' + obj[key] + '&');
            }
            callback();
        },
        function(){
            callback(null, query.slice(0, query.length - 1));
        }
    );
};