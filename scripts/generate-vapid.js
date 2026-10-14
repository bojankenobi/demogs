import crypto from 'crypto';

/**
 * Generates a standard pair of VAPID keys (ECDSA on P-256 / prime256v1 curve)
 * for Web Push notifications without needing external npm modules.
 */
function generateVapidKeys() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1'
  });

  const pubExport = publicKey.export({ type: 'spki', format: 'der' });
  // The raw uncompressed public key is the last 65 bytes
  const rawPub = pubExport.subarray(pubExport.length - 65);
  const vapidPublicKey = rawPub.toString('base64url');

  const privExport = privateKey.export({ type: 'pkcs8', format: 'der' });
  // The raw 32-byte private scalar is at the end of the SEC1/PKCS8 structure
  const rawPriv = privExport.subarray(privExport.length - 32);
  const vapidPrivateKey = rawPriv.toString('base64url');

  console.log('================================================================');
  console.log('✨ Grand Slot Club - Web Push VAPID Keys Generated Successfully!');
  console.log('================================================================');
  console.log('');
  console.log('Copy these keys to your .env or Vercel Environment Variables:');
  console.log('');
  console.log(`VAPID_PUBLIC_KEY=${vapidPublicKey}`);
  console.log(`VAPID_PRIVATE_KEY=${vapidPrivateKey}`);
  console.log(`VAPID_EMAIL=mailto:support@grandslotclub.rs`);
  console.log('');
  console.log('================================================================');
}

generateVapidKeys();
