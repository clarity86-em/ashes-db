'use client';
import {useEffect} from 'react';
import shell from './shell';
export default function DeckApp(){
  useEffect(()=>{
    document.documentElement.dataset.cloud='true';
    if(document.getElementById('ashes-runtime'))return;
    const script=document.createElement('script');script.id='ashes-runtime';script.type='module';script.src='/src/app.js';document.body.append(script);
  },[]);
  return <div dangerouslySetInnerHTML={{__html:shell}}/>;
}
