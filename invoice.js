'use strict';

module.exports = function(Invoice) {
    Invoice.remoteMethod('test',{
        accepts: [
            {arg: 'req', type: 'object', http: {source: 'req'}},
        ],
        returns: {type: 'object', root: true},
        http: {verb: 'get', path: '/test'}
    });

    Invoice.remoteMethod('listIncomming',{
        accepts: [
            {arg: 'req', type: 'object', http: {source: 'req'}},
        ],
        returns: {type: 'object', root: true},
        http: {verb: 'get', path: '/list-incomming'}
    });

    Invoice.remoteMethod('listSent',{
        accepts: [
            {arg: 'req', type: 'object', http: {source: 'req'}},
        ],
        returns: {type: 'object', root: true},
        http: {verb: 'get', path: '/list-sent'}
    });

    Invoice.remoteMethod('reject',{
        accepts: [
            {arg: 'req', type: 'object', http: {source: 'req'}},
            {
                arg: 'id', type: 'number', required: true,
                description: 'id of invoice to reject'
            },
            {
                arg: 'message', type: 'string', required: false,
                description: 'info message'
            }
        ],
        returns: {type: 'object', root: true},
        http: {verb: 'post', path: '/reject/:id'}
    });

    Invoice.remoteMethod('payInvoice',{
        accepts: [
            {arg: 'req', type: 'object', http: {source: 'req'}},
            {
                arg: 'id', type: 'number', required: true,
                description: 'id of invoice to pay'
            },
            {
                arg: 'message', type: 'string', required: false,
                description: 'info message'
            }
        ],
        returns: {type: 'object', root: true},
        http: {verb: 'post', path: '/pay-invoice/:id'}
    });

    Invoice.remoteMethod('sendInvoice',{
        accepts: [
            {arg: 'req', type: 'object', http: {source: 'req'}},
            {
                arg: 'data',
                type: 'object',
                required: true,
                description: 'json with event data { "recipient": "test4@test.com", "value": "11", "expirationDate": "InvoiceEndDate ( optional)", "message": "billing info" }',
                http: {source: 'body'}
            }
        ],
        returns: {type: 'object', root: true},
        http: {verb: 'post', path: '/send-invoice'}
    });

    Invoice.observe('before save', function updateDate(ctx, next) {
        var date = new Date();
        if (ctx.instance) {
            if(ctx.isNewInstance){
                ctx.instance.insertTime = date;
            } 
            ctx.instance.updateTime = date;
        } else {
            ctx.data.updateTime = date;
            // console.log('Updated %s matching %j', ctx.Model.pluralModelName, ctx.where);
        }
        next();
    });
    require('./utils/invoicesFuncs')(Invoice);
};
