const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Blockhain = require('./blockchain');
const { v1: uuidv1 } = require('uuid');
const port = process.argv[2];
const axios = require('axios').default;

const nodeAddress = uuidv1().split('-').join('');

const bitcoin = new Blockhain();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


// 输出完整的区块链
app.get('/blockchain', function (req, res) {
    return res.send(bitcoin);
});


// 往区块链中添加一个交易
app.post('/transaction', function (req, res) {
    const newTransactionAndSignature = bitcoin.createNewTransaction(req.body.amount, req.body.from, req.body.to, req.body.privateKeyHex);
    const blockIndex = bitcoin.addToPendingTransactions(newTransactionAndSignature);
    res.json({ note: `Transaction will be added in block ${blockIndex}.` });
});


// 往区块链中添加一个交易并向全网广播
app.post('/transaction/broadcast', function (req, res) {
    const newTransactionAndSignature = bitcoin.createNewTransaction(req.body.amount, req.body.from, req.body.to, req.body.privateKeyHex);
    bitcoin.addToPendingTransactions(newTransactionAndSignature);

    const newTransaction = {
        "amount": req.body.amount,
        "from": req.body.from,
        "to": req.body.to,
        "privateKeyHex": req.body.privateKeyHex
    };
    
    const requestPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            url: networkNodeUrl + '/transaction',
            method: 'POST',
            data: newTransaction,

        };

        requestPromises.push(axios(requestOptions));
    });

    Promise.all(requestPromises)
        .then(data => {
            res.json({ note: 'Transaction created and broadcast successfully!' });
        });
});


// 挖出一个新区块并向全网广播
app.get('/mine', function (req, res) {
    const lastBlock = bitcoin.getLastBlock();
    const previousBlockHash = lastBlock.hash;
    const transactionsAddToNextBlock = bitcoin.transactionsWillAddToNextBlock(bitcoin.pendingTransactions);
    const minnerReward = [{
        amount: this.getBlockReward(this.chain.length + 1)/100000000,
        from: '00',
        to: minnerAddress,
        transactionId: uuidv1().split('-').join(''),
    }];
    
    const blockData = {
        transactions: minnerReward.concat(transactionsAddToNextBlock),
        index: lastBlock.index + 1
    };
    const nonce = bitcoin.proofOfWork(previousBlockHash, blockData);
    const hash = bitcoin.blockHash(previousBlockHash, blockData, nonce);

    const newBlock = bitcoin.createNewBlock(hash, previousBlockHash, nonce, minnerAddress);
    //向全网广播区块
    const requestPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            url: networkNodeUrl + '/recieve-new-block',
            method: 'POST',
            data: { newBlock: newBlock },
        };

        requestPromises.push(axios(requestOptions));
    });

    Promise.all(requestPromises)
        // .then(data => {
        //     const requestOptions = {
        //         url: bitcoin.currentNodeUrl + '/transaction/broadcast',
        //         method: 'POST',
        //         data: {
        //             amount: 25,
        //             from: "00",
        //             to: nodeAddress
        //         },
        //     };
        //     return axios(requestOptions);
        // })
        .then(data => {
            return res.json({
                note: 'New block mined and broadcast successfully.',
                block: newBlock
            });
        });
});


// 接收其他节点广播的新区块并验证区块合法性
app.post('/recieve-new-block', function (req, res) {
    const newBlock = req.body.newBlock;
    const lastBlock = bitcoin.getLastBlock();
    const correctHash = lastBlock.hash === newBlock.previousBlockHash;
    const correntIndex = lastBlock.index + 1 === newBlock.index;

    if (correctHash && correntIndex) {
        bitcoin.chain.push(newBlock);
        bitcoin.pendingTransactions = [];
        res.json({
            note: 'New block recieved and accepted.',
            newBlock: newBlock
        });
    } else {
        res.json({
            note: 'New block rejectd.'
        });
    }
});


// 注册一个新节点并向全网广播
app.post('/register-and-broadcast-node', function (req, res) {
    const newNodeUrl = req.body.newNodeUrl;
    if (bitcoin.networkNodes.indexOf(newNodeUrl) == -1)
        bitcoin.networkNodes.push(newNodeUrl);

    const regNodesPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            url: networkNodeUrl + '/register-node',
            method: 'POST',
            data: { newNodeUrl: newNodeUrl },
        };

        regNodesPromises.push(axios(requestOptions));
    });

    Promise.all(regNodesPromises)
        .then(data => {
            const bulkRegisterOptions = {
                url: newNodeUrl + '/register-nodes-bulk',
                method: 'POST',
                data: {
                    allNetworkNodes: [...bitcoin.networkNodes, bitcoin.currentNodeUrl],
                },
            };
            return axios(bulkRegisterOptions);
        })
        .then(data => {
            return res.json({
                note: 'New node registered with network successfully.',
            })
        });
});


// 注册一个新节点
app.post('/register-node', function (req, res) {
    const newNodeUrl = req.body.newNodeUrl;
    const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(newNodeUrl) == -1;
    const notCurrentNode = bitcoin.currentNodeUrl !== newNodeUrl;
    if (nodeNotAlreadyPresent && notCurrentNode)
        bitcoin.networkNodes.push(newNodeUrl);
    return res.json({ note: 'New node registered successfully.' })
});


// 批量注册新节点
app.post('/register-nodes-bulk', function (req, res) {
    const allNetworkNodes = req.body.allNetworkNodes;
    allNetworkNodes.forEach(networkNodeUrl => {
        const nodeNotAlreadyPresent =
            bitcoin.networkNodes.indexOf(networkNodeUrl) == -1;
        const notCurrentNode = bitcoin.currentNodeUrl !== networkNodeUrl;
        if (nodeNotAlreadyPresent && notCurrentNode)
            bitcoin.networkNodes.push(networkNodeUrl);
    })

    return res.json({ note: 'Bulk registration successful.' })
});


// 与全网节点达成共识，得到最长合法链
app.get('/consensus', function (req, res) {
    const requestPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            url: networkNodeUrl + '/blockchain',
            method: 'GET',
        };

        requestPromises.push(axios(requestOptions));
    });

    Promise.all(requestPromises).then(blockchains => {
        const currentChainLength = bitcoin.chain.length;
        let maxChainLength = currentChainLength;
        let newLongestChain = null;
        let newPendingTransactions = null;

        blockchains.forEach(blockchain => {
            if (blockchain.data.chain.length > maxChainLength) {
                maxChainLength = blockchain.data.chain.length;
                newLongestChain = blockchain.data.chain;
                newPendingTransactions = blockchain.data.pendingTransactions;
            }
        })

        if (
            !newLongestChain ||
            (newLongestChain && !bitcoin.chainIsValid(newLongestChain))
        ) {
            return res.json({
                note: 'Current chain has not been replaced.',
                chain: bitcoin.chain,
            })
        } else {
            bitcoin.chain = newLongestChain;
            bitcoin.pendingTransactions = newPendingTransactions;
            return res.json({
                note: 'This chain has been replaced.',
                chain: bitcoin.chain,
            });
        }
    });
});



//----------------------------------------------------------------
//   区块链浏览器接口
//----------------------------------------------------------------


//用哈希值查询区块
app.get('/block/:blockHash', function (req, res) {
    const blockHash = req.params.blockHash;
    const block = bitcoin.searchBlock(blockHash);
    if (block == null) {
        res.json({ note: 'This block is not exist' });
    } else {
        res.json({ block: block });
    }
});


// 根据Id查询交易
app.get('/transaction/:transactionId', function (req, res) {
    const transactionId = req.params.transactionId;
    const trasactionData = bitcoin.searchTransaction(transactionId);
    if (trasactionData.transaction == null) {
        res.json({ note: 'This transaction is not exist' });
    } else {
        res.json({
            transaction: trasactionData.transaction,
            block: trasactionData.block
        });
    }
});


//查询某个地址的所有交易记录
app.get('/address/:address', function(req, res) {
	const address = req.params.address;
	const addressData = bitcoin.getAddressData(address);
	res.json({
		addressData: addressData
	});
});



app.listen(port, function () {
    console.log(`Listening on port ${port}...`);
});
