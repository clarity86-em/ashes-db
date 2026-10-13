import {requireChatGPTUser} from './chatgpt-auth';
import DeckApp from './deck-app';
export const dynamic='force-dynamic';
export default async function Home(){await requireChatGPTUser('/');return <DeckApp/>;}
