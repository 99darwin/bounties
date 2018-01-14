// dependencies
const _ = require('lodash');
const rp = require('request-promise');
const Web3 = require('web3');
const utils = require('web3-utils');
const Tx = require('ethereumjs-tx');
const BigNumber = require('bignumber.js');
const TestRPC = require('ethereumjs-testrpc');

// required files
const keys = require('./keys.js');
const addresses = require('./addresses.js');
const abi = require('./divx.js');

// web3
if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
} else {
    web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8546'));
};

// global variables
const weiMultiplier = 1000000000000000000;
const e = web3.eth;
const defaultAccount = e.defaultAccount = e.accounts[0];
console.log(`default account: ${defaultAccount}`);
let nonceCount = e.getTransactionCount(defaultAccount);
console.log(`nonce for default account: ${nonceCount}`);
let gasLimit = web3.toHex(100000);
let gasPrice = web3.toHex(21000000000);
const contractAddress = '0x13f11C9905A08ca76e3e853bE63D4f0944326C72';
const contract = web3.eth.contract(abi).at(contractAddress);
const privateKey = new Buffer(keys.privateKey, 'hex');
const testPrivateKey = new Buffer(keys.testPrivateKey, 'hex');

// payment functions
const bountyPay = () => {
    let priceCall = {
        uri: 'https://api.coinmarketcap.com/v1/ticker/divi',
        qs: {
            convert: 'USD'
        },
        headers: {
            'User-Agent': 'Request-Promise'
        },
        json: true
    }
    rp(priceCall)
        .then(function(res) {
            const price = res[0].price_usd;
            console.log(`current DIVX price: $${price}`);
            let bountyArr = [];
            let addressArr = [];
            for (let i = 0; i < addresses.length; i++) {
                let payoutAmount = Math.round(addresses[i].amount / price * weiMultiplier, 15);
                let payoutRound = new BigNumber(payoutAmount, 10);
                bountyArr.push(payoutRound);
                claimants = addresses[i].address;
                addressArr.push(claimants);
                console.log(`Claimant: ${addressArr[i]}`);
                console.log(`Payout: ${bountyArr[i]}`);
            }
            const sendDivx = () => {
                let amountToSend;
                let addressToSend;
                console.log(`Number of bounties to pay: ${addressArr.length}`);
                for (let j = 0; j < addressArr.length; j++) {
                    amountToSend = bountyArr[j];
                    console.log(`Amount sending: ${amountToSend}`);
                    addressToSend = addresses[j].address;
                    console.log(`Address sending to: ${addressToSend}`)
                    const bountyTx = {
                        nonce: nonceCount,
                        to: addressArr[j],
                        value: web3.toHex(0),
                        gasPrice: gasPrice,
                        gasLimit: gasLimit,
                        data: contract.transfer.getData(addressToSend, amountToSend)
                    }
                    nonceCount++;
                    const tx = new Tx(bountyTx);
                    // tx.sign(privateKey);
                    tx.sign(testPrivateKey);
                    const serializedTx = tx.serialize();
                    e.sendRawTransaction(`0x ${serializedTx.toString('hex')}`, function(err, hash) {
                        if (!err) {
                            console.log(`tx successful, here's the hash: ${hash}`);
                        } else {
                            console.log(err);
                        }
                    })
                }
            }
            sendDivx();
        })
        .catch(function(err) {
            console.log(err);
        });
}
bountyPay();
