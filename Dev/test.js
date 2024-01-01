const Blockchain = require('./blockchain');
const sha256 = require('sha256');

let Bitcoin = new Blockchain();

// //创建Block和Transactions
// Bitcoin.createNewBlock(1200, 'a97f665q5z66a8', '7q78v99a999');
// Bitcoin.createNewTransaction(100,'0x28r8s9879q8998', '0xa9a87q6d6d6');
// Bitcoin.createNewBlock(4200, 'fafa97fzf6a8', 'vsf8v99a999');
// Bitcoin.createteNewTransaction(30,'0x128s9879q8998', '0x9ca87q6d6d6');
// Bitcoin.createteNewTransaction(40,'0x4cr8s9879q8998', '0xb2a87q6d6d6');
// Bitcoin.createteNewTransaction(50,'0x6fr8s9879q8998', '0xls187q6d6d6');
// Bitcoin.createNewBlock(4200,'ssj1nj1nn1' , '8ai8v99a999');

// //Proof Of Work
// console.log(Bitcoin.blockHash('666',{
//     Transactions: [],
//     index: 2,
// },
// 35140
//   ));

// // Genesis Block
// console.log(Bitcoin);

//验证链的合法性
// const btc = {
//     "chain": [
//     {
//     "index": 1,
//     "timestamp": 1674917798424,
//     "Transactions": [],
//     "hash": 666,
//     "previousBlockHash": "0",
//     "nonce": "0"
//     },
//     {
//     "index": 2,
//     "timestamp": 1674917829164,
//     "Transactions": [
//     {
//     "amount": 76,
//     "from": "w3fvs82euq8hcahJK",
//     "to": "fdzbzzruw9fq0rq",
//     "transactionId": "056689609f1c11ed85e597fb89e64679"
//     },
//     {
//     "amount": 76,
//     "from": "w3fvs82euq8hcahJK",
//     "to": "fdzbzzruw9fq0rq",
//     "transactionId": "05ba9cd09f1c11ed85e597fb89e64679"
//     }
//     ],
//     "hash": "0000398d6731470316e23ce34f87907e2e8625bfbc42e308746210dff7761f44",
//     "previousBlockHash": 666,
//     "nonce": 66221
//     }
//     ],
//     "pendingTransactions": [
//     {
//     "amount": 25,
//     "from": "00",
//     "to": "f788e2709f1b11ed85e597fb89e64679",
//     "transactionId": "09de55e09f1c11ed85e597fb89e64679"
//     }
//     ],
//     "currentNodeUrl": "http://localhost:3001",
//     "networkNodes": []
//     }
//     console.log(Bitcoin.chainIsValid(btc.chain))

//数字签名
// let signature = Bitcoin.digitalSignature('8cb243c32b480512808425f222069c50efb69bd0bea5a5369c3f0f5c2bee2d24',message);
// console.log(signature);

//创建新交易
let newTransactionAndSignature = Bitcoin.createNewTransaction(100,'PwRHb8U5UC8iXaWfa56TnJGkVdtfe48PNrwjoXMeF4X3k1aZJre3f2S2M1QNyN9bFDMFbXz9KGvjVNWZkiDz9PtD', 
'RoTxgWUF9FGDXSqTX83CWRKDtmN7MXEKM3imhf7TjLy3bBqR4UX7bhoLw1YTseqRA13idrUSziq9xh5Cd7zYdH4U',
'3c833dc0608495077673ee1dbe14f18fddae5860b2b92e366c122109aad0607e');
// console.log(newTransactionAndSignature);

//验证数字签名合法性
let digitalSignatureIsTrue = Bitcoin.digitalSignatureIsTrue(newTransactionAndSignature);
// console.log(digitalSignatureIsTrue);

console.log(Bitcoin.getBlockReward(1)/100000000)