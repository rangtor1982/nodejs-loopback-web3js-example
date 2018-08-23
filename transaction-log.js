'use strict';
let app = require('../../server/server');

module.exports = function(Transactionlog) {
    Transactionlog.remoteMethod('list',{
        accepts: [
            {arg: 'req', type: 'object', http: {source: 'req'}},
        ],
        returns: {arg: 'transactions', type: 'object'},
        http: {verb: 'get', path: '/list'}
    });
    Transactionlog.observe('before save', function updateDate(ctx, next) {
        if (ctx.instance) {
            var date = new Date();
            if(ctx.isNewInstance){
                ctx.instance.insertTime = date;
            } 
            ctx.instance.updateTime = date;
        } else {
          console.log('Updated %s matching %j',
            ctx.Model.pluralModelName,
            ctx.where);
        }
        next();
    });
    require('./utils/transactionsFuncs')(Transactionlog);
};
