const EC = require('elliptic').ec;
const ec = new EC('secp256k1'); // 椭圆曲线的名称
const bs58 = require('bs58');

// 通过私钥获取公钥
function getPublicKey(privateKey) {
  const keyPair = ec.keyFromPrivate(privateKey);
  const publicKey = keyPair.getPublic('hex');
  return publicKey;
}

// 测试
const privateKey = '4e46f66549f217c07f2e1d4c47d8af807ea53f8212d1e71060b34c8b21eaf1a6';
const publicKeyHex = getPublicKey(privateKey);
const publicKeyBytes = Buffer.from(publicKeyHex, 'hex');
const publicKeyBase58 = bs58.encode(publicKeyBytes);
console.log(publicKeyBase58);
