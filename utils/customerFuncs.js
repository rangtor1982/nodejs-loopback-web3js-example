var app = require('../../../server/server');
var Web3 = require('web3');
var web3conf = app.get('web3');
// let web3 = new Web3(web3conf.ws);
// let web3 = new Web3(new Web3.providers.HttpProvider(web3conf.http));

module.exports = function(Customer) {
    Customer.transactionsList = function(req, cb){
        if(req.accessToken && req.accessToken.userId){
            let currentCustomer,
                transactions;
            var web3 = new Web3(web3conf.ws);
            Customer.findById(req.accessToken.userId)
            .then(customer => {
                currentCustomer = customer;
                return  currentCustomer.transactionLogs(null);
            })
            .then(transactionsData => {
                transactions = transactionsData;
                // console.log(currentCustomer);
                // console.log(transactions);
                // var web3 = new Web3(new Web3.providers.HttpProvider(web3conf.http));
                let transactionList = [];
                transactions.forEach(transaction => {
                    transactionList.push(
                        web3.eth.getTransaction(transaction.transactionHash)
                        .then(transaction => {
                            // console.log(transaction);
                            return transaction;
                        })
                    );
                });
                return Promise.all(transactionList);
            })
            .then(data => {
                let response = [],
                    tmpUsers = [],
                    tmpAccounts = [];
                data.forEach(function(transaction, idx){
                    var curTransaction = transactions.find(tr => {
                            return tr.transactionHash === transaction.hash
                        });
                    if(currentCustomer.eth_account !== transaction.from ) tmpAccounts.push(transaction.from);
                    else if(currentCustomer.eth_account !== transaction.to ) tmpAccounts.push(transaction.to);
                    // console.log(tmpUser);
                    response.push({
                        id: curTransaction.id,
                        from: currentCustomer.eth_account === transaction.from ? currentCustomer : transaction.from,
                        to: currentCustomer.eth_account === transaction.to ? currentCustomer : transaction.to,
                        value: web3.utils.fromWei(transaction.value),
                        date: curTransaction.insertTime
                    });
                });
                tmpAccounts = tmpAccounts.filter(function onlyUnique(value, index, self) { 
                    return self.indexOf(value) === index;
                });
                tmpAccounts.forEach(acc => {
                    tmpUsers.push(Customer.findOne({where: {eth_account: acc}}));
                });
                Promise.all(tmpUsers)
                .then(users => {
                    let tmpUser;
                    // console.log(users);
                    for(var i=0; i< response.length; i++){
                        if(typeof response[i].from === 'string' || response[i].from instanceof String){
                            tmpUser = users.find(usr => {
                                return usr ? usr.eth_account === response[i].from : false;
                            });
                            response[i].from = tmpUser ? tmpUser : {};
                        }
                        if(typeof response[i].to === 'string' || response[i].to instanceof String){
                            tmpUser = users.find(usr => {
                                return usr ? usr.eth_account === response[i].to : false;
                            });
                            response[i].to = tmpUser ? tmpUser : {};
                        }
                    }
                    return cb(null, { 
                        status: true,
                        data: {
                            transactions: response,
                            customer: currentCustomer 
                        },
                        message: ''
                    });
                })
                .catch(function(err){
                    console.log(err);
                    return cb({status: false, data: {}, message: err.message});
                });
            })
            .catch(function(err){
                console.log(err);
                return cb({status: false, data: {}, message: err.message});
            });
        } else {
            cb({status: 0, message: 'no user provided'});
        }
    };
    Customer.test = function(req, cb){
        var models = app.models();
        return cb(null, {status: true, data:  { models: models }, message: ''} );
    };
    Customer.getBalance = function(req, cb){
        if(req.accessToken && req.accessToken.userId){
            Customer.findById(req.accessToken.userId, function(err, currentCustomer){
                if(err) {
                    return cb({status: false, data: {}, message: err.message});
                };
                // var web3 = new Web3(new Web3.providers.HttpProvider(web3conf.http));
                var web3 = new Web3(web3conf.ws);
                web3.eth.getBalance(currentCustomer.eth_account)
                .then((response) => {
                    // console.log(response);
                    return cb(null, {status: true, data:  { balance: web3.utils.fromWei(response) }, message: ''} );
                })
                .catch(function(err){
                    return cb({status: false, data: {}, message: err.message});
                });
            });
        } else {
            cb({status: false, data: {}, message: 'no user provided'});
        }
    };
    Customer.transfer = function(req, data, cb){
        var currentCustomer;
        var toCustomer;
        if(req.accessToken && req.accessToken.userId && data.recipient){
            Customer.findById(req.accessToken.userId, function(err, resultCustomer){
                if(err) {
                   return cb({status: false, data: {}, message: err.message});
                };
                currentCustomer = resultCustomer;
                Customer.findOne({ where: {email: data.recipient}}, function(err, resultToCustomer){
                    var web3 = new Web3(web3conf.ws);
                    toCustomer = resultToCustomer;
                    var trData = {
                        from: currentCustomer.eth_account,
                        to: toCustomer.eth_account,
                        value: web3.utils.toWei(data.value)
                    };
                    web3.eth.personal.unlockAccount(currentCustomer.eth_account, currentCustomer.password)
                    .then(response => {
                        Customer.send({
                            trData: trData
                        });
                        // console.log(web3.version);
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
                            toCustomer.transactionLogs.create(logData);
                            currentCustomer.transactionLogs.create(logData);
                            subscription.unsubscribe(function(error, success){
                                // if(success) console.log('Successfully unsubscribed!');
                            });
                        });
                        return cb(null, {status: true, data: { transaction:response}, message: ''} );
                    })
                    .catch(function(err){
                        console.log(err);
                        return cb({status: 0, message: err.message});
                    });
                });
            });
        } else {
            return cb({status: false, data: {}, message: 'no user provided'});
        }
    };

    Customer.send = function sendTransaction(data){
        var web3 = new Web3(web3conf.ws);
        web3.eth.sendTransaction( data.trData)
        .then((response) => {
            return;
        })
        .catch(function(err){
            console.log(err);
            return err;
        });
    };
};
