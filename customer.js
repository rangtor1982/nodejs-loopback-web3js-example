'use strict';
let app = require('../../server/server');
let Web3 = require('web3');
let web3conf = app.get('web3');

module.exports = function(Customer) {
    Customer.getApp(function(err, app) {
        Customer.email.attachTo(app.dataSources.Email);
    });
    Customer.disableRemoteMethodByName('prototype.__get__accessTokens');
    Customer.disableRemoteMethodByName('prototype.__count__accessTokens');
    Customer.disableRemoteMethodByName('prototype.__delete__accessTokens');
    Customer.disableRemoteMethodByName('prototype.__destroyById__accessTokens');
    Customer.disableRemoteMethodByName('prototype.__updateById__accessTokens');
    Customer.disableRemoteMethodByName('prototype.__findById__accessTokens');
    Customer.disableRemoteMethodByName('prototype.__create__accessTokens');
    Customer.disableRemoteMethodByName('prototype.__get__transactionLogs');
    Customer.disableRemoteMethodByName('prototype.__count__transactionLogs');
    Customer.disableRemoteMethodByName('prototype.__delete__transactionLogs');
    Customer.disableRemoteMethodByName('prototype.__create__transactionLogs');
    Customer.disableRemoteMethodByName('prototype.__destroyById__transactionLogs');
    Customer.disableRemoteMethodByName('prototype.__updateById__transactionLogs');
    Customer.disableRemoteMethodByName('prototype.__findById__transactionLogs');


    Customer.remoteMethod('test',{
        accepts: [
            {arg: 'req', type: 'object', http: {source: 'req'}},
        ],
        returns: {type: 'object', root: true},
        http: {verb: 'get', path: '/test'}
    });

    Customer.remoteMethod('getBalance',{
        accepts: [
            {arg: 'req', type: 'object', http: {source: 'req'}},
        ],
        returns: {type: 'object', root: true},
        http: {verb: 'get', path: '/getbalance'}
    });

    Customer.remoteMethod('transactionsList',{
        accepts: [
            {arg: 'req', type: 'object', http: {source: 'req'}},
        ],
        returns: {type: 'object', root: true},
        http: {verb: 'get', path: '/transactions-list'}
    });

    Customer.remoteMethod('transfer',{
        accepts: [
            {arg: 'req', type: 'object', http: {source: 'req'}},
            {
                arg: 'data',
                type: 'object',
                required: true,
                description: 'json with event data { "recipient": "email", "value": "ethToTransfer" }',
                http: {source: 'body'}
            }
        ],
        returns: {type: 'object', root: true},
        http: {verb: 'post', path: '/transfer'}
    });
    Customer.observe('before save', function addEthAccount(ctx, next) {
        if (ctx.instance && ctx.isNewInstance) {
            ctx.instance.realm = 'ether';
            var web3 = new Web3(new Web3.providers.HttpProvider(web3conf.http));
            web3.eth.personal.newAccount(ctx.instance.password)
            .then((response) => {
                // console.log(response);
                ctx.instance.eth_account = response;
                next();
            });
        } else {
          console.log('Updated %s matching %j', ctx.Model.pluralModelName, ctx.where);
            next();
        }
    });
    require('./utils/customerFuncs')(Customer);
};
