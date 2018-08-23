var app = require('../../../server/server');
var Web3 = require('web3');
var web3conf = app.get('web3');

module.exports = function(Invoice) {
    
    Invoice.sendInvoice = function(req, data, cb){
        if(!req.accessToken || !req.accessToken.userId){
            return cb({status: false, data: {}, message: 'auth needed'});
        }
        var Customer = app.models.Customer;
        var currentCustomer;
        var toCustomer;
        if(!data.recipient || !data.value){
            return cb({status: false, data: {}, message: 'required fields are empty'});
        }
        Customer.findById(req.accessToken.userId)
        .then(resultCustomer => {
            currentCustomer = resultCustomer;
            return Customer.findOne({ where: {email: data.recipient}});
        })
        .then(resultToCustomer => {
            if(!resultToCustomer){
                return {status: false, data: {}, message: 'recipient not found'};
            }
            toCustomer = resultToCustomer;
            let invoiceData = {
                fromCustomer: currentCustomer.id,
                toCustomer: toCustomer.id,
                amount: data.value,
                status: 'pending',
                expirationDate: data.expirationDate ? data.expirationDate : null,
                messageSender: data.message ? data.message : 'new invoice'
            };
            return Invoice.create(invoiceData);
        })
        .then(invoice => {
            if(invoice.hasOwnProperty('status')){
                return cb(invoice);
            }
            return cb(null, { 
                status: true,
                data: {
                    invoice: invoice
                },
                message: ''
            });
        })
        .catch(function(err){
            return cb({status: false, data: {}, message: err.message});
        });
    };

    Invoice.listIncomming = function(req, cb){
        if(!req.accessToken || !req.accessToken.userId){
            return cb({status: false, data: {}, message: 'auth needed'});
        }
        var Customer = app.models.Customer;
        var currentCustomer;
        var responseData;
        Customer.findById(req.accessToken.userId)
        .then( resultCustomer => {
            currentCustomer = resultCustomer;
            return Invoice.find({where: {toCustomer: currentCustomer.id}});
        })
        .then(invoices => {
            let tpmUsers = [];
            let tpmUsersPromise = [];

            responseData = invoices;

            invoices.forEach(element => {
                tpmUsers.push(element.fromCustomer);
            });
            tpmUsers = tpmUsers.filter(function onlyUnique(value, index, self) { 
                return self.indexOf(value) === index;
            });
            tpmUsers.forEach(customer => {
                tpmUsersPromise.push(Customer.findById(customer));
            });
            return Promise.all(tpmUsersPromise);
        })
        .then(users => {
            let tmpUser;
            let response = [];
            for(var i=0; i< responseData.length; i++){
                tmpUser = users.find(usr => {
                    return usr ? usr.id === responseData[i].fromCustomer : false;
                });
                response.push({
                    customer: tmpUser,
                    // toCustomer: currentCustomer,
                    amount: responseData[i].amount,
                    insertTime: responseData[i].insertTime,
                    updateTime: responseData[i].updateTime,
                    expirationDate: responseData[i].expirationDate,
                    status: responseData[i].status,
                    message: responseData[i].messageSender,
                    id: responseData[i].id
                });
            }

            return cb(null, { 
                status: true,
                data: {
                    invoices: response 
                },
                message: ''
            });
        })
        .catch(function(err){
            return cb({status: false, data: {}, message: err.message});
        });
    };
    Invoice.listSent = function(req, cb){
        if(!req.accessToken || !req.accessToken.userId){
            return cb({status: false, data: {}, message: 'auth needed'});
        }
        var Customer = app.models.Customer;
        var currentCustomer;
        var responseData;
        Customer.findById(req.accessToken.userId)
        .then( resultCustomer => {
            currentCustomer = resultCustomer;
            return Invoice.find({where: {fromCustomer: currentCustomer.id}});
        })
        .then(invoices => {
            let tpmUsers = [];
            let tpmUsersPromise = [];

            responseData = invoices;

            invoices.forEach(element => {
                tpmUsers.push(element.toCustomer);
            });
            tpmUsers = tpmUsers.filter(function onlyUnique(value, index, self) { 
                return self.indexOf(value) === index;
            });
            tpmUsers.forEach(customer => {
                tpmUsersPromise.push(Customer.findById(customer));
            });
            return Promise.all(tpmUsersPromise);
        })
        .then(users => {
            let tmpUser;
            let response = [];
            for(var i=0; i< responseData.length; i++){
                tmpUser = users.find(usr => {
                    return usr ? usr.id === responseData[i].toCustomer : false;
                });
                response.push({
                    // fromCustomer: tmpUser,
                    customer: tmpUser,
                    amount: responseData[i].amount,
                    insertTime: responseData[i].insertTime,
                    updateTime: responseData[i].updateTime,
                    expirationDate: responseData[i].expirationDate,
                    status: responseData[i].status,
                    message: responseData[i].messageReciever,
                    // messageSender: responseData[i].messageSender,
                    id: responseData[i].id
                });
            }

            return cb(null, { 
                status: true,
                data: {
                    invoices: response 
                },
                message: ''
            });
        })
        .catch(function(err){
            return cb({status: false, data: {}, message: err.message});
        });
    };

    Invoice.reject = function(req, id, message, cb){
        if(!req.accessToken || !req.accessToken.userId){
            return cb({status: false, data: {}, message: 'auth needed'});
        }
        var Customer = app.models.Customer;
        var currentCustomer;
        // var responseData;
        Customer.findById(req.accessToken.userId)
        .then( resultCustomer => {
            currentCustomer = resultCustomer;
            return Invoice.findById(id);
        })
        .then(invoice => {
            if(!invoice){
                return {status: false, data: {}, message: 'invoice not found'};
            }
            if(invoice.toCustomer != currentCustomer.id){
                return {status: false, data: {}, message: 'invoice don\'t belongs to you'};
            }
            return invoice.updateAttributes({
                status: 'rejected', 
                messageReciever: message ? message : ''
            });
        })
        .then(result => {
            if(result.hasOwnProperty('status')){
                return cb(result);
            }
            return cb(null, { 
                status: true,
                data: {
                    response: result 
                },
                message: ''
            });
        })
        .catch(function(err){
            return cb({status: false, data: {}, message: err.message});
        });
    };

    Invoice.payInvoice = function(req, id, message, cb){
        if(!req.accessToken || !req.accessToken.userId){
            return cb({status: false, data: {}, message: 'auth needed'});
        }
        var Customer = app.models.Customer;
        var currentCustomer;
        var recipientCustomer;
        var invoiceData;
        var web3 = new Web3(web3conf.ws);

        Customer.findById(req.accessToken.userId)
        .then( resultCustomer => {
            currentCustomer = resultCustomer;
            return Invoice.findById(id);
        })
        .then(invoice => {
            invoiceData = invoice;
            if(!invoice){
                return {status: false, data: {}, message: 'invoice not found'};
            }
            if(invoice.status != 'pending'){
                return {status: false, data: {}, message: 'invoice status: '+invoice.status};
            }
            if(invoice.toCustomer != currentCustomer.id){
                return {status: false, data: {}, message: 'invoice don\'t belongs to you'};
            }
            return Customer.findById(invoice.fromCustomer);
        })
        .then(resultCustomer => {
            if(resultCustomer.hasOwnProperty('status')){
                return resultCustomer;
            }
            recipientCustomer = resultCustomer;
            return web3.eth.personal.unlockAccount(currentCustomer.eth_account, currentCustomer.password);
        })
        .then(response => {
            if(response.hasOwnProperty('status')){
                return response;
            }
            var trData = {
                from: currentCustomer.eth_account,
                to: recipientCustomer.eth_account,
                value: web3.utils.toWei(invoiceData.amount.toString())
            };
            Customer.send({
                trData: trData
            });
            var subscription = web3.eth.subscribe('pendingTransactions', function(error, result){
                if (error)
                    // console.log('subscribe - '+result);
                // else {
                    console.log(error);
                // }
            })
            .on("data", function(transaction){
                // console.log('response - '+transaction);
                var logData = {
                    transactionHash : transaction
                };
                currentCustomer.transactionLogs.create(logData);
                recipientCustomer.transactionLogs.create(logData);
                invoiceData.updateAttributes({
                    status: 'paid', 
                    transactionHash: transaction
                });
                subscription.unsubscribe(function(error, success){
                    // if(success) console.log('Successfully unsubscribed!');
                });
            });
            return response;
        })
        .then(result => {
            if(result.hasOwnProperty('status')){
                return cb(result);
            }
            return cb(null, { 
                status: true,
                data: {
                    response: result 
                },
                message: ''
            });
        })
        .catch(function(err){
            return cb({status: false, data: {}, message: err.message});
        });
    };

    Invoice.test = function(req, cb){
        if(!req.accessToken || !req.accessToken.userId){
            return cb({status: false, data: {}, message: 'auth needed'});
        }
        var Customer = app.models.Customer;
        var currentCustomer;
        var responseData;
        Customer.findById(req.accessToken.userId)
        .then( resultCustomer => {
            currentCustomer = resultCustomer;
            return cb(null, { 
                status: true,
                data: {
                    customer: currentCustomer 
                },
                message: ''
            });
        })
        .catch(function(err){
            return cb({status: false, data: {}, message: err.message});
        });
    };
};