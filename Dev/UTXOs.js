const sha256 = require('sha256');
const currentNodeUrl = process.argv[3];
const { v1: uuidv1 } = require('uuid');
const bs58 = require('bs58');
const EC = require('elliptic').ec;
const crypto = require('crypto');
const ec = new EC('secp256k1');

// 数字签名
function sign(data, privateKey) {
  const key = ec.keyFromPrivate(privateKey);
  const hash = crypto.createHash('sha256').update(data).digest();
  const signature = key.sign(hash);
  const r = signature.r.toString('hex');
  const s = signature.s.toString('hex');
  return { r, s };
}

// 验证数字签名
function verify(data, signature, publicKey) {
  const key = ec.keyFromPublic(bs58.decode(publicKey));
  const hash = crypto.createHash('sha256').update(data).digest();
  return key.verify(hash, signature);
}

const utxos = [{
  txId: '70051fb0b9d511edadeee3c1aa8cedd8',
  inputs: [
    { preTxId: 'txid1', amount: 10 },
    { preTxId: 'txid2', amount: 20 }
  ],
  outputs: [
    { to: 'PwRHb8U5UC8iXaWfa56TnJGkVdtfe48PNrwjoXMeF4X3k1aZJre3f2S2M1QNyN9bFDMFbXz9KGvjVNWZkiDz9PtD', amount: 15 },
    { to: 'xcv', amount: 20 }
  ]
}, {
  txId: '80051fb0b9d511edadeee3c1aa8cedd8',
  inputs: [
    { preTxId: 'txid1', amount: 10 },
    { preTxId: 'txid2', amount: 20 }
  ],
  outputs: [
    { to: 'asd', amount: 15 },
    { to: 'xcv', amount: 20 }
  ]
}];

//1.验证txInput输入地址和之前交易的txOutput比输出地址相同，
//2.对之前的整个交易签名

//构建一个交易
function Transaction(to, amount, privateKey) {

  //检查地址和私钥格式是否正确
  const hexRegex = /^[0-9a-fA-F]{64}$/;
  const regex = /^[1-9A-HJ-NP-Za-km-z]{88}$/;
  if (hexRegex.test(privateKey) == false) {
    console.log('私钥格式不正确');
  } else if (regex.test(to) == false) {
    console.log('地址格式不正确');
  } else {
    let found = false;
    let utxoNotUsed = null;
    const keyPair = ec.keyFromPrivate(privateKey);
    const publicKeyHex = keyPair.getPublic('hex');
    const publicKeyBytes = Buffer.from(publicKeyHex, 'hex');
    const from = bs58.encode(publicKeyBytes);

    // 查找该地址未花费的交易
    for (const utxo of utxos) {
      for (const output of utxo.outputs) {
        if (output.to === from && amount <= output.amount) {
          found = true;
          utxoNotUsed = utxo;
          break;
        }
      }
      if (found === true) {
        break;
      }
    }
    if (found === false) {
      console.log('该账户余额不足');
    } else {
      //构建TxInput对象
      const jsonStr = JSON.stringify(utxoNotUsed);
      const utxoNotUsedBuf = Buffer.from(jsonStr, 'utf8');
      const TxInput = [{
        preTxId: utxoNotUsed.txId,
        from: from,
        signature: sign(utxoNotUsedBuf, privateKey)
      }];

      //构建TxOutput对象
      const lastOutput = utxoNotUsed.outputs.find(output => output.to === from);
      const lastOutputAmount = lastOutput.amount;
      const TxOutput = [{
        to: to,
        amount: amount
      }, {
        to: from,
        amount: lastOutputAmount - amount
      }]

      //构建一个新的交易
      if (verify(utxoNotUsedBuf, TxInput[0].signature, from) === true) {
        const newTransaction = {
          txId: uuidv1().split('-').join(''),
          inputs: TxInput,
          outputs: TxOutput
        };
        return newTransaction;
      } else {
        console.log('数字签名不合法');
      }
    }
  }
}

let tx = Transaction('RoTxgWUF9FGDXSqTX83CWRKDtmN7MXEKM3imhf7TjLy3bBqR4UX7bhoLw1YTseqRA13idrUSziq9xh5Cd7zYdH4U',
  12, '3c833dc0608495077673ee1dbe14f18fddae5860b2b92e366c122109aad0607e');
console.log(tx)


