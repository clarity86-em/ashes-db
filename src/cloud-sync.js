import {sameWorkspace,mergeWorkspaces,normalizeWorkspace} from './cloud-state.js';

export class CloudSync {
  constructor({map,storage,fetcher=fetch,onState,onStatus,onConflict,onCacheError=()=>{}}) {
    Object.assign(this,{map,storage,fetcher,onState,onStatus,onConflict,onCacheError});
    this.ready=false;this.busy=false;this.revision=0;this.base=null;this.current=null;this.timer=null;this.user=null;
  }
  async request(method, body) {
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),15000);
    let response;
    try{response=await this.fetcher('/api/workspace', {method,credentials:'same-origin',cache:'no-store',signal:controller.signal,
      headers:body?{'Content-Type':'application/json','X-Ashes-Request':'1','X-Ashes-User':this.user.id}:undefined,
      body:body?JSON.stringify(body):undefined});}finally{clearTimeout(timeout);}
    let result;try{result=await response.json();}catch{throw Error('서버에 연결하지 못했습니다. 다시 시도해주세요.');}
    if(response.status===409)return {...result,conflict:true};
    if(!response.ok){const error=Error(result.error||'저장하지 못했습니다. 다시 시도해주세요.');error.status=response.status;throw error;}
    return result;
  }
  cache() {
    try{this.storage.setItem(this.key,JSON.stringify({base:this.base,state:this.current,revision:this.revision,pending:!sameWorkspace(this.base,this.current)}));}
    catch{this.onCacheError();}
  }
  merge(remote) {
    const merged=mergeWorkspaces(this.base,this.current,remote.state);
    const state=normalizeWorkspace(merged.state,this.map);
    this.base=remote.state;this.revision=remote.revision;this.current=state;
    if(merged.conflicts.length)this.onConflict(merged.conflicts);
    this.cache();this.onState(structuredClone(this.current));
  }
  async start(initial) {
    const remote=await this.request('GET');
    this.user=remote.user;this.key='ashes-db-cloud-v1:'+this.user.id;
    this.base=remote.state;this.revision=remote.revision;this.current=remote.state||initial;
    let saved,raw;
    try{raw=this.storage.getItem(this.key);}catch{this.onCacheError();}
    if(raw){try{saved=JSON.parse(raw);}catch{throw Error('이 기기의 전송 대기 데이터를 읽지 못했습니다. 브라우저 데이터를 지우지 말고 문의해주세요.');}}
    if(saved?.pending){
      try{
        const local=normalizeWorkspace(saved.state,this.map),base=saved.base?normalizeWorkspace(saved.base,this.map):null;
        const merged=mergeWorkspaces(base,local,remote.state);
        this.current=normalizeWorkspace(merged.state,this.map);
        if(merged.conflicts.length)this.onConflict(merged.conflicts);
      }catch{throw Error('전송하지 못한 덱을 확인해야 합니다. 브라우저 저장 데이터를 지우지 말고 문의해주세요.');}
    }
    this.ready=true;this.cache();this.onState(structuredClone(this.current));
    if(!sameWorkspace(this.current,this.base)) await this.flush();else this.onStatus('saved');
  }
  queue(state) {
    if(!this.ready)return;
    this.current=structuredClone(state);this.cache();clearTimeout(this.timer);
    this.onStatus('pending');this.timer=setTimeout(()=>this.flush(),800);
  }
  async flush(pull=false) {
    clearTimeout(this.timer);
    if(!this.ready||this.busy)return;
    this.busy=true;this.onStatus('saving');
    try{
      if(pull){const remote=await this.request('GET');if(remote.user.id!==this.user.id)throw Error('로그인 계정이 바뀌었습니다. 페이지를 새로 열어주세요.');if(remote.revision!==this.revision)this.merge(remote);}
      let attempts=0;
      while(!sameWorkspace(this.current,this.base)){
        if(++attempts>5)throw Error('다른 기기에서 편집 중입니다. 잠시 뒤 다시 저장해주세요.');
        const sent=structuredClone(this.current);
        const response=await this.request('PUT',{revision:this.revision,state:sent});
        if(response.conflict){this.merge(response);continue;}
        this.base=sent;this.revision=response.revision;this.cache();
      }
      this.onStatus('saved');
    }catch(error){this.cache();this.onStatus(error.status===401?'signed-out':'offline',error.message);}
    finally{this.busy=false;}
  }
  get pending(){return this.ready&&!sameWorkspace(this.current,this.base);}
}
