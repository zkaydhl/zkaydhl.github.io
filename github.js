// GitHub API 操作
const GH = {
  token:null, user:null, repo:null,

  async init(){
    // 优先从本地读取（首次输入后写入本地 + 加密到 config.js）
    const local = localStorage.getItem('qh_cfg');
    if(local){
      try{
        const cfg = JSON.parse(await decryptData(local));
        this.token=cfg.token; this.user=cfg.user; this.repo=cfg.repo;
        return true;
      }catch(e){}
    }
    return false;
  },

  async setup(token,user,repo){
    this.token=token; this.user=user; this.repo=repo;
    const cfg = JSON.stringify({token,user,repo});
    localStorage.setItem('qh_cfg', await encryptData(cfg));
    // 加密写入 config.js 与 pskey.js
    await this.putFile('config.js', 'window.__CFG__="'+await encryptData(cfg)+'";');
    await this.putFile('pskey.js', 'window.__PSK__="'+await encryptData(PSK)+'";');
  },

  headers(){ return {Authorization:'token '+this.token, Accept:'application/vnd.github.v3+json'}; },

  async getFile(path){
    const url=`https://api.github.com/repos/${this.user}/${this.repo}/contents/${path}`;
    const r = await fetch(url,{headers:this.headers()});
    if(r.status===404) return null;
    const j = await r.json();
    return {content:decodeURIComponent(escape(atob(j.content.replace(/\n/g,'')))), sha:j.sha};
  },

  async putFile(path, content, message='update'){
    const existing = await this.getFile(path);
    const url=`https://api.github.com/repos/${this.user}/${this.repo}/contents/${path}`;
    const body={
      message, 
      content: btoa(unescape(encodeURIComponent(content)))
    };
    if(existing) body.sha=existing.sha;
    const r = await fetch(url,{method:'PUT',headers:{...this.headers(),'Content-Type':'application/json'},body:JSON.stringify(body)});
    return r.ok;
  },

  // 读取 data.js 格式的加密数据对象
  async loadJS(path, varName){
    const f = await this.getFile(path);
    if(!f) return null;
    try{
      const m = f.content.match(new RegExp(varName+'\\s*=\\s*"([^"]*)"'));
      if(m) return JSON.parse(await decryptData(m[1]));
    }catch(e){}
    return null;
  },

  async saveJS(path, varName, obj){
    const enc = await encryptData(JSON.stringify(obj));
    return this.putFile(path, `window.${varName}="${enc}";`);
  }
};
