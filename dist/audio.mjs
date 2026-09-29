// SPDX-License-Identifier: LGPL-3.0-or-later
import {narration} from './narration.mjs';
export function createNarrator() {
  const audio=document.getElementById('chapter-audio');
  const play=document.getElementById('audio-play');
  const seek=document.getElementById('audio-seek');
  const transcript=document.getElementById('transcript');
  let chapter='try',playingOutcome=false;
  const clock=seconds=>Number.isFinite(seconds)?`${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`:'—';
  function update() {
    document.getElementById('play-icon').textContent=audio.paused?'▶':'Ⅱ';
    play.setAttribute('aria-label',audio.paused?'Play narration':'Pause narration');
    seek.value=audio.duration?String(100*audio.currentTime/audio.duration):'0';
    document.getElementById('audio-time').textContent=`${clock(audio.currentTime)} / ${clock(audio.duration)}`;
  }
  function select(id) {
    if(!narration[id])return;
    if(chapter===id&&!playingOutcome&&audio.getAttribute('src'))return;
    audio.pause();chapter=id;playingOutcome=false;
    audio.src=`assets/audio/${id}.mp3`;
    document.getElementById('audio-title').textContent=narration[id].title;
    document.getElementById('audio-voice').textContent='Iago · chapter narration';
    transcript.innerHTML='';
    const p=document.createElement('p');p.textContent=narration[id].text;transcript.append(p);
    update();
  }
  async function start() {
    try{await audio.play();}catch{window.dispatchEvent(new CustomEvent('guide-notice',{detail:'Audio could not start. The full transcript is available.'}));}
    update();
  }
  play.addEventListener('click',()=>audio.paused?start():audio.pause());
  seek.addEventListener('input',()=>{if(Number.isFinite(audio.duration))audio.currentTime=audio.duration*Number(seek.value)/100;});
  document.getElementById('audio-speed').addEventListener('change',event=>audio.playbackRate=Number(event.target.value));
  document.getElementById('transcript-toggle').addEventListener('click',event=>{const open=transcript.hidden;transcript.hidden=!open;event.currentTarget.setAttribute('aria-expanded',String(open));});
  for(const name of ['timeupdate','loadedmetadata','play','pause','ended'])audio.addEventListener(name,update);
  audio.addEventListener('error',()=>window.dispatchEvent(new CustomEvent('guide-notice',{detail:'Narration is unavailable. You can read the transcript.'})));
  document.getElementById('office-film').addEventListener('play',()=>audio.pause());
  audio.addEventListener('play',()=>document.getElementById('office-film').pause());
  select('try');
  return {select,isPlaying:()=>!audio.paused,chapter:()=>chapter,pause:()=>audio.pause(),
    outcome(id,text){audio.pause();playingOutcome=true;audio.src=`assets/audio/${id}.mp3`;document.getElementById('audio-title').textContent='Scenario outcome';document.getElementById('audio-voice').textContent='Brian · your simulated AI partner';transcript.textContent=text;start();}};
}
