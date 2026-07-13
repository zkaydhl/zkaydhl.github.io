// 端对端加密模块 (AES-GCM via WebCrypto)
const PSK = "@1264&9621^ZhBingBing*#55134.";

async function deriveKey(password){
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), {name:'PBKDF2'}, false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    {name:'PBKDF2', salt:enc.encode('qinghe-garden-salt'), iterations:100000, hash:'SHA-256'},
    keyMaterial, {name:'AES-GCM', length:256}, false, ['encrypt','decrypt']);
}

async function encryptData(plain, password=PSK){
  const key = await deriveKey(password);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const cipher = await crypto.subtle.encrypt({name:'AES-GCM', iv}, key, enc.encode(plain));
  const buf = new Uint8Array(iv.length + cipher.byteLength);
  buf.set(iv,0); buf.set(new Uint8Array(cipher), iv.length);
  return btoa(String.fromCharCode(...buf));
}

async function decryptData(b64, password=PSK){
  try{
    const key = await deriveKey(password);
    const raw = Uint8Array.from(atob(b64), c=>c.charCodeAt(0));
    const iv = raw.slice(0,12);
    const data = raw.slice(12);
    const plain = await crypto.subtle.decrypt({name:'AES-GCM', iv}, key, data);
    return new TextDecoder().decode(plain);
  }catch(e){ return null; }
}
