const EC = require('elliptic').ec;
const bs58 = require('bs58');
const ec = new EC('secp256k1');

//利用椭圆曲线算法生成账户(地址和私钥)

const keyPair = ec.genKeyPair();
const publicKeyHex = keyPair.getPublic('hex');
const privateKey = keyPair.getPrivate('hex');
const publicKeyBytes = Buffer.from(publicKeyHex, 'hex');
const publicKeyBase58 = bs58.encode(publicKeyBytes);

// console.log(`Public Key: ${publicKeyBase58}`);
// console.log(`Private Key: ${privateKey}`);


// let PublicKey = 'PwRHb8U5UC8iXaWfa56TnJGkVdtfe48PNrwjoXMeF4X3k1aZJre3f2S2M1QNyN9bFDMFbXz9KGvjVNWZkiDz9PtD';
// let PrivateKey = '3c833dc0608495077673ee1dbe14f18fddae5860b2b92e366c122109aad0607e';
                    

// Public Key: RoTxgWUF9FGDXSqTX83CWRKDtmN7MXEKM3imhf7TjLy3bBqR4UX7bhoLw1YTseqRA13idrUSziq9xh5Cd7zYdH4U
// Private Key: 4846bfea1d938c13597bd8f918590e9d324be85440e69176c834e1cb10d35b85

// Public Key: NRtnyFumZEJANBersJbHcefCmC2avxBhJ56heGWJXpKNYSYUYPbZ2Lpp2y7byYwQcuV94sjKE5KeqzwkFjfaY6h3
// Private Key: 93beafd15d22f6a9065f93d81425c65c4122fcbf740c018b0228ebc0eccc4b01
