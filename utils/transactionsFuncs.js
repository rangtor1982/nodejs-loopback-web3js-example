let app = require('../../../server/server');
let Customer = app.models.Customer;
let Web3 = require('web3');
let web3conf = app.get('web3');

module.exports = function(Transactionlog) {
    Transactionlog.list = function(req, cb){
        if(req.accessToken && req.accessToken.userId){
            // let currentCustomer = new Customer();
            Customer.findById(req.accessToken.userId, function(err, currentCustomer){
                if(err) {
                    return cb({status: 0, message: err.message});
                };
                var web3 = new Web3(new Web3.providers.HttpProvider(web3conf.host));
                web3.eth.getBalance(currentCustomer.eth_account)
                .then((response) => {
                    // console.log(response);
                    return cb(null, {status: 1, balance: web3.utils.fromWei(response)} );
                })
                .catch(function(err){
                    return cb({status: false, data: {}, message: err.message});
                });
            })
            .then(customer => {
                console.log(customer);
            })
            .catch(function(err){
                return cb({status: false, data: {}, message: err.message});
            });
    } else {
            return cb({status: false, data: {}, message: err.message});
        }
    };
};