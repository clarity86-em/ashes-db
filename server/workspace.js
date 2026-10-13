import {normalizeWorkspace} from '../src/cloud-state.js';

const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','Vary':'Cookie, oai-authenticated-user-id','X-Content-Type-Options':'nosniff'};
const reply=(value,status=200)=>new Response(JSON.stringify(value),{status,headers});
const MAX_BYTES=5_000_000;
export async function workspaceRequest(request,{user,db,map}) {
  if(!user?.userId)return reply({error:'로그인이 필요합니다.'},401);
  if(!['GET','PUT'].includes(request.method))return reply({error:'지원하지 않는 요청입니다.'},405);
  const read=async()=>{
    const row=await db.prepare('SELECT payload, revision, updated_at FROM workspaces WHERE user_id = ?').bind(user.userId).first();
    return {state:row?JSON.parse(row.payload):null,revision:row?.revision||0,updatedAt:row?.updated_at||null};
  };
  if(request.method==='GET')return reply({...await read(),user:{id:user.userId,email:user.email}});
  // Reject cross-site form/fetch writes; identity is supplied only by Sites dispatch.
  if(request.headers.get('origin')!==new URL(request.url).origin||request.headers.get('x-ashes-request')!=='1'||!request.headers.get('content-type')?.startsWith('application/json'))return reply({error:'이 사이트에서 다시 저장해주세요.'},403);
  if(request.headers.get('x-ashes-user')!==user.userId)return reply({error:'로그인 계정이 바뀌었습니다. 페이지를 새로 열어주세요.'},401);
  if(Number(request.headers.get('content-length'))>MAX_BYTES)return reply({error:'저장 데이터는 5 MB 이하여야 합니다.'},413);
  let payload;
  try{
    const reader=request.body?.getReader();if(!reader)throw Error('저장 데이터가 없습니다.');
    const parts=[];let bytes=0;
    for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>MAX_BYTES){await reader.cancel();return reply({error:'저장 데이터는 5 MB 이하여야 합니다.'},413);}parts.push(value);}
    const buffer=new Uint8Array(bytes);let offset=0;for(const part of parts){buffer.set(part,offset);offset+=part.length;}
    payload=JSON.parse(new TextDecoder().decode(buffer));
    if(!Number.isSafeInteger(payload.revision)||payload.revision<0)throw Error('저장 버전이 올바르지 않습니다.');
    payload.state=normalizeWorkspace(payload.state,map);
  }catch(error){return reply({error:error.message||'저장 데이터가 올바르지 않습니다.'},400);}
  const now=new Date().toISOString(),json=JSON.stringify(payload.state);
  let written;
  if(payload.revision===0){
    written=await db.prepare('INSERT INTO workspaces (user_id,payload,revision,updated_at) VALUES (?,?,1,?) ON CONFLICT(user_id) DO NOTHING RETURNING revision').bind(user.userId,json,now).first();
  }else{
    written=await db.prepare('UPDATE workspaces SET payload = ?, revision = revision + 1, updated_at = ? WHERE user_id = ? AND revision = ? RETURNING revision').bind(json,now,user.userId,payload.revision).first();
  }
  if(!written)return reply({...await read(),error:'다른 기기에서 저장한 변경사항이 있습니다.'},409);
  return reply({revision:written.revision,updatedAt:now});
}
