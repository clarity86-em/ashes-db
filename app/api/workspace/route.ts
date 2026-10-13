import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {workspaceRequest} from '../../../server/workspace.js';
import cards from '../../../data/cards.json';

export const dynamic='force-dynamic';
const map=new Map(cards.map(card=>[card.stub,card]));
async function handle(request:Request){
  try{return await workspaceRequest(request,{user:await getChatGPTUser(),db:env.DB,map});}
  catch{return Response.json({error:'저장 서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해주세요.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
export const GET=handle;
export const PUT=handle;
