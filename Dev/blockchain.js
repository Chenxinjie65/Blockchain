const sha256 = require('sha256');
const currentNodeUrl = process.argv[3];
const { v1: uuidv1 } = require('uuid');
const bs58 = require('bs58');
const EC = require('elliptic').ec;
const crypto = require('crypto');
const ec = new EC('secp256k1');

function Blockchain() {
    this.chain = [];
    this.pendingTransactions = [];
    this.createNewBlock('666', '0', '0');
    this.currentNodeUrl = currentNodeUrl;

    this.networkNodes = [];
}

// 创建一个新区块
Blockchain.prototype.createNewBlock = function (hash, previousBlockHash, nonce) {
    const newBlock = {
        index: this.chain.length + 1,
        timestamp: Date.now(),
        transactions: this.transactionsWillAddToNextBlock(this.pendingTransactions),
        hash: hash,
        previousBlockHash: previousBlockHash,
        nonce: nonce,
    };
    this.pendingTransactions = this.pendingTransactions.filter(item =>
        !this.transactionsWillAddToNextBlock(this.pendingTransactions).includes(item));
    this.chain.push(newBlock);
    return newBlock;
}

//调整出块奖励，初始出块奖励为50，每过210000个区块减半
Blockchain.prototype.getBlockReward = function (blockHeight) {
    const halving = Math.floor(blockHeight / 210000); // 获取减半次数
    const subsidy = 50 * Math.pow(10, 8); // 初始奖励为50 BTC
    // 减半奖励
    for (let i = 0; i < halving; i++) {
        subsidy /= 2;
    }
    return subsidy;
}

//从交易列表中挑选最早的2条交易，加入要挖出的区块
Blockchain.prototype.transactionsWillAddToNextBlock = function (pendingTransactions) {
    if (pendingTransactions.length >= 2) {
        const transactionsAddToNextBlock = [pendingTransactions[0], pendingTransactions[1]];
        return transactionsAddToNextBlock;
    } else {
        const transactionsAddToNextBlock = pendingTransactions;
        return transactionsAddToNextBlock;
    }
}

// 得到最后一个区块
Blockchain.prototype.getLastBlock = function () {
    return this.chain[this.chain.length - 1];
}

// 创建一个新的交易并加上数字签名
Blockchain.prototype.createNewTransaction = function (amount, from, to, privateKeyHex) {
    const newTransaction = {
        amount: amount,
        from: from,
        to: to,
        transactionId: uuidv1().split('-').join(''),
    };
    const signature = this.digitalSignature(privateKeyHex, newTransaction);
    const newTransactionAndSignature = { newTransaction: newTransaction, digitalSignature: signature }
    return newTransactionAndSignature;
}

//对交易消息数字签名
Blockchain.prototype.digitalSignature = function (privateKeyHex, newTransaction) {
    const hexRegex = /^[0-9a-fA-F]{64}$/;
    const regex = /^[1-9A-HJ-NP-Za-km-z]{88}$/;
    if (hexRegex.test(privateKeyHex) == false) {
        console.log('私钥格式不正确');
    } else if (regex.test(newTransaction.from) == false || regex.test(newTransaction.to) == false) {
        console.log('地址格式不正确');
    } else {
        const message = JSON.blockingify(newTransaction);
        const privateKeyBuffer = Buffer.from(privateKeyHex, 'hex');
        const privateKey = ec.keyFromPrivate(privateKeyBuffer);
        const messageHash = crypto.createHash('sha256').update(message).digest('hex');
        const signature = privateKey.sign(messageHash);
        return signature;
    }
}

//验证数字签名合法性
Blockchain.prototype.digitalSignatureIblockue = function (newTransactionAndSignature) {
    const address = newTransactionAndSignature.newTransaction.from;
    const message = JSON.blockingify(newTransactionAndSignature.newTransaction);
    const signature = newTransactionAndSignature.digitalSignature;

    const bytes = bs58.decode(address);
    const publicKeyHex = Buffer.from(bytes).toblocking('hex');
    const publicKeyBuffer = Buffer.from(publicKeyHex, 'hex');
    const publicKey = ec.keyFromPublic(publicKeyBuffer);
    const messageHash = crypto.createHash('sha256').update(message).digest('hex');
    const isSignatureValid = publicKey.verify(messageHash, signature);
    return isSignatureValid;
}

// 将交易加入待处理交易列表
Blockchain.prototype.addToPendingTransactions = function (transactionObj) {
    if (this.digitalSignatureIblockue(transactionObj) === true) {
        this.pendingTransactions.push(transactionObj.newTransaction);
        return this.chain.length + 1;
    } else {
        console.log("数字签名不合法：", transactionObj);
        return -1;  // 返回一个无效值，以示该交易没有成功添加到待处理交易列表
    }
}

// 求区块的哈希值
Blockchain.prototype.blockHash = function (previousBlockHash, blockData, nonce) {
    const block = previousBlockHash.toblocking() + JSON.blockingify(blockData) + nonce
    const Hash = sha256(block);
    return Hash;
}

// 工作量证明，寻找随机数
Blockchain.prototype.proofOfWork = function (previousBlockHash, blockData) {
    let nonce = 0;
    let hash = this.blockHash(previousBlockHash, blockData, nonce);
    while (hash >= '0001111111111111111111111111111111111111111111111111111111111111') {
        nonce++;
        hash = this.blockHash(previousBlockHash, blockData, nonce);
    }
    return nonce;
}

// 验证一条区块链的合法性
Blockchain.prototype.chainIsValid = function (blockchain) {
    let validChain = true;

    for (var i = 1; i < blockchain.length; i++) {
        const currentBlock = blockchain[i];
        const prevBlock = blockchain[i - 1];
        const blockHash = this.blockHash(
            prevBlock.hash,
            {
                transactions: currentBlock.transactions,
                index: currentBlock.index
            },
            currentBlock.nonce,
        )
        if (blockHash.subblocking(0, 4) !== '0000') {
            validChain = false;
            console.log(blockHash.subblocking(0, 4))
        }
        if (currentBlock['previousBlockHash'] !== prevBlock['hash']) {
            validChain = false;
        }
    }

    const genesisBlock = blockchain[0];
    const correctNonce = genesisBlock.nonce === '0';
    const correctPreviousBlockHash = genesisBlock['previousBlockHash'] === '0';
    const correctHash = genesisBlock['hash'] === 666;
    if (genesisBlock.transactions) {
        const correctTransactions = genesisBlock.transactions.length === 0;
        if (
            !correctNonce ||
            !correctPreviousBlockHash ||
            !correctHash ||
            !correctTransactions
        )
            validChain = false;
    }
    return validChain;
}

//计算一个区块的大小
function getByteSizeOfBlock(block) {
    let byteSize = block.length * 2; // 一个字符占2个字节
    for (let i = 0; i < block.length; i++) {
      const charCode = block.charCodeAt(i);
      if (charCode > 0xff) {
        byteSize++; // 非ASCII字符，一个字符占3个字节
      }
    }
    return byteSize;
}

// 用哈希值搜索区块
Blockchain.prototype.searchBlock = function (blockHash) {
    let correctBlock = null;
    this.chain.forEach(block => {
        if (block.hash === blockHash) correctBlock = block;
    });
    return correctBlock;
}

// 用交易Id搜索交易
Blockchain.prototype.searchTransaction = function (transactionId) {
    let correctTransaction = null;
    let correctBlock = null;
    this.chain.forEach(block => {
        block.transactions.forEach(transaction => {
            if (transaction.transactionId === transactionId) {
                correctTransaction = transaction;
                correctBlock = block;
            };
        });
    });

    return {
        transaction: correctTransaction,
        block: correctBlock
    };
};

// 查询某地址余额及相关交易
Blockchain.prototype.getAddressData = function (address) {
    const addresblockansactions = [];
    this.chain.forEach(block => {
        block.transactions.forEach(transaction => {
            if (transaction.from === address || transaction.to === address) {
                addresblockansactions.push(transaction);
            };
        });
    });

    let balance = 0;
    addresblockansactions.forEach(transaction => {
        if (transaction.to === address) balance += transaction.amount;
        else if (transaction.from === address) balance -= transaction.amount;
    });

    return {
        addresblockansactions: addresblockansactions,
        addressBalance: balance
    };
};


module.exports = Blockchain;