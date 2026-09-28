(() => {
  'use strict';
  const {pages,chapters}=window.ARKVEIN_BOOK;
  const {normalize,adjacent,geometry}=window.BookFold;
  const $=id=>document.getElementById(id);
  const spread=$('spread'),book=$('book'),folio=$('folio');
  const contents=$('contentsDialog'),art=$('artDialog');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),narrow=matchMedia('(max-width: 900px)');
  const span=()=>narrow.matches?1:2;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number=i=>String(i).padStart(2,'0');
  const partName=p=>((window.ARKVEIN_BOOK.parts||{})[p.part])||'';
  const label=p=>!p.chapter?'':p.chapter==='world'?'Вступление':((chapters.find(c=>c.id===p.chapter)||{}).title||'')+(partName(p)?' · '+partName(p):'');
  const lens='<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="13" cy="13" r="8"/><path d="m19 19 8 8M9 13h8m-4-4v8"/></svg>';
  let current=0,turn=null,touch=null,suppressClickUntil=0;
  function row(i,label,subtitle=''){
    return `<button class="toc-row" data-page="${i}" type="button"><span>${esc(label)}${subtitle?`<small>${esc(subtitle)}</small>`:''}</span><span class="toc-number">${i?number(i):'—'}</span></button>`;
  }
  function pageMarkup(page,i){
    let copy='',cls=({contents:'contents-page',chapter:'chapter-page'})[page.type]||page.type||'story';
    if(page.type==='cover')copy=`<div class="cover-brand"><img class="world-mark" src="world-mark-v5.png" alt="Знак мира Арквейн"><h2><span class="wordmark">ARCWANE</span></h2><p class="cover-subtitle">ARTBOOK 2026</p></div>`;
    else if(page.type==='frontispiece')copy=`<div class="frontispiece-mark"><img src="world-mark-v5.png" alt="Знак Арквейна"><h2>Арквейн</h2><p>Истории одного мира</p></div>`;
    else if(page.type==='chapter')copy=`<p class="section">${esc(page.section)}</p><h2>${esc(page.title)}</h2><p class="chapter-subtitle">${esc(page.subtitle)}</p>`;
    else if(page.type==='contents')copy=`<p class="section">${esc(page.section)}</p><h2>Содержание</h2><nav aria-label="Главы книги">${chapters.map(ch=>row(pages.findIndex(p=>p.chapter===ch.id),ch.title,ch.subtitle)).join('')}</nav>`;
    else copy=`<p class="section">${esc(page.section)}</p><h2>${esc(page.title).replace(/\n/g,'<br>')}</h2><div class="prose">${page.text.map(p=>`<p>${esc(p)}</p>`).join('')}</div>`;
    const zoom=page.type==='cover'?'<button class="cover-open-area" type="button" data-open aria-label="Открыть книгу ARCWANE"></button>':page.image?`<button class="art-hotspot" type="button" data-art="${i}" aria-label="Увеличить иллюстрацию: ${esc(page.title.replace(/\n/g,' '))}"><span class="zoom-lens">${lens}</span></button>`:'';
    return `<section class="leaf ${cls}" aria-label="${esc(page.title.replace(/\n/g,' '))}" data-index="${i}">${page.image?`<img class="page-art" src="${page.image}"${page.focus?` style="--fx:${page.focus}"`:''}${page.fallback?` onerror="this.onerror=null;this.src='${page.fallback}'"`:''} alt="${esc(page.alt)}" draggable="false">`:''}${zoom}<div class="page-copy">${copy}</div><footer class="page-foot"><span>${page.chapter&&page.chapter!=='world'?'Арквейн · '+esc(label(page)):'Арквейн'}</span><span>${number(i)}</span></footer></section>`;
  }
  function visible(i){return i===0?[pages[0]]:pages.slice(i,i+span());}
  function corners(){
    const leaves=[...spread.children];
    const add=(el,direction,side)=>{for(const corner of ['top','bottom'])el.insertAdjacentHTML('beforeend',`<button class="page-corner ${side} ${corner}" type="button" data-turn="${direction}" data-corner="${corner}" aria-label="${direction>0?'Перелистнуть вперёд':'Перелистнуть назад'} — потяните за угол"><span aria-hidden="true"></span></button>`);};
    if(current>0)add(leaves[0],-1,'left');
    if(current===0||current+span()<pages.length)add(leaves.at(-1),1,'right');
  }

  // Phones: shrink the page text until it fits one screen, so nothing needs scrolling.
  const phone=matchMedia('(max-width: 700px) and (orientation: portrait)');
  function fitCopy(){
    for(const leaf of spread.querySelectorAll('.leaf:not(.cover)')){
      leaf.style.removeProperty('--fs');leaf.style.removeProperty('--arth');
      if(!phone.matches)continue;
      const copy=leaf.querySelector('.page-copy');if(!copy)continue;
      let fs=15.5;
      const limit=()=>leaf.clientHeight*.72;
      while(copy.offsetHeight>limit()&&fs>11.5){fs-=.5;leaf.style.setProperty('--fs',fs+'px');}
      leaf.style.setProperty('--arth',Math.min(leaf.clientHeight,copy.offsetTop+70)+'px');
    }
  }
  addEventListener('resize',()=>fitCopy());
  function render(index){
    current=normalize(index,pages.length,span());
    book.classList.toggle('closed',current===0);
    spread.innerHTML=visible(current).map((p,i)=>pageMarkup(p,current+i)).join('');
    corners();
    folio.innerHTML=current===0?'<strong>ARCWANE</strong>ARTBOOK 2026':`<strong>${esc(label(pages[current])||'Книга мира')}</strong>${number(current)}${span()>1?'–'+number(Math.min(current+1,pages.length-1)):''} / ${pages.length-1}`;
    history.replaceState(null,'','#'+pages[current].id);
    fitCopy();
    [current-1,current+1,current+span(),current+span()+1].filter(i=>i>=0&&i<pages.length).forEach(i=>{if(pages[i].image){const image=new Image();image.src=pages[i].image;}});
  }
  function inertClone(element){const copy=element.cloneNode(true);copy.inert=true;copy.setAttribute('aria-hidden','true');copy.querySelectorAll('button').forEach(b=>b.remove());return copy;}
  function begin(target,corner='bottom'){
    if(turn)return false;target=normalize(target,pages.length,span());if(target===current)return false;
    const forward=target>current,leaves=[...spread.children];
    const leaf=forward?leaves.at(-1):leaves[0];
    const r=leaf.getBoundingClientRect(),br=book.getBoundingClientRect();
    const w=r.width,h=r.height,left=r.left-br.left,top=r.top-br.top;
    const stage=document.createElement('div');stage.className='fold-stage';stage.setAttribute('aria-hidden','true');stage.inert=true;
    const under=document.createElement('div');under.className='fold-under';
    // While the closed cover is lifted, its inside frontispiece is revealed.
    under.innerHTML=target===0?'':current===0?pageMarkup(pages[1],1):visible(target).map((p,i)=>pageMarkup(p,target+i)).join('');
    if(target===0)stage.classList.add('closing-cover');
    if(current===0||narrow.matches||target===0)under.classList.add('single');
    stage.append(under);
    for(const other of leaves){if(other===leaf)continue;const rr=other.getBoundingClientRect();const still=inertClone(other);still.classList.add('fold-still');Object.assign(still.style,{left:(rr.left-br.left)+'px',top:(rr.top-br.top)+'px',width:rr.width+'px',height:rr.height+'px',minHeight:'0',aspectRatio:'auto'});stage.append(still);}
    const front=inertClone(leaf);front.classList.add('fold-front');
    const back=document.createElement('div');back.className='fold-back';
    const backPage=target===0?0:forward?target:Math.min(target+span()-1,pages.length-1);
    back.innerHTML=`<div class="reverse-face">${pageMarkup(pages[backPage],backPage)}</div>`;
    for(const el of [front,back])Object.assign(el.style,{left:left+'px',top:top+'px',width:w+'px',height:h+'px',minHeight:'0',aspectRatio:'auto'});
    stage.append(front,back);book.append(stage);book.classList.add('is-turning');
    book.classList.toggle('is-closing-cover',target===0);
    const p={x:forward?w:0,y:corner==='top'?0:h};
    turn={from:current,target,stage,front,back,w,h,p,d:{...p},forward,corner,raf:null,pointerId:null};
    paint({x:p.x+(forward?-.02:.02),y:p.y});return true;
  }
  function poly(points){return points.length<3?'polygon(0 0,0 0,0 0)':'polygon('+points.map(p=>`${p.x}px ${p.y}px`).join(',')+')';}
  function paint(d){
    if(!turn)return;turn.d=d;
    const g=geometry(turn.w,turn.h,turn.p,d);
    turn.front.style.clipPath=poly(g.front);turn.back.style.clipPath=poly(g.back);
    turn.back.style.transform='matrix('+g.matrix.join(',')+')';
  }
  function finish(commit){
    if(!turn)return;const t=turn;if(t.raf)cancelAnimationFrame(t.raf);
    turn=null;t.stage.remove();book.classList.remove('is-turning','is-closing-cover');
    if(t.pointerId!==null&&book.hasPointerCapture(t.pointerId))book.releasePointerCapture(t.pointerId);
    render(commit?t.target:t.from);
  }
  function settle(commit){
    if(!turn)return;const t=turn,start={...t.d};
    const end=commit?{x:t.forward?-t.w:2*t.w,y:t.p.y}:{x:t.p.x+(t.forward?-.02:.02),y:t.p.y};
    if(reduced.matches){finish(commit);return;}
    const begun=performance.now(),duration=commit?380:260;
    const animate=now=>{if(turn!==t)return;const p=Math.min(1,(now-begun)/duration),e=1-Math.pow(1-p,3);paint({x:start.x+(end.x-start.x)*e,y:start.y+(end.y-start.y)*e});if(p<1)t.raf=requestAnimationFrame(animate);else finish(commit);};
    t.raf=requestAnimationFrame(animate);
  }
  function navigate(target){if(target<0||target>=pages.length||turn)return;if(reduced.matches){render(target);return;}if(begin(target))settle(true);}
  function move(direction){if((direction<0&&current===0)||(direction>0&&current!==0&&current+span()>=pages.length))return;navigate(adjacent(current,direction,pages.length,span()));}
  book.addEventListener('pointerdown',event=>{
    const handle=event.target.closest('[data-turn]');if(!handle||turn||event.button!==0)return;
    const target=adjacent(current,Number(handle.dataset.turn),pages.length,span());
    if(!begin(target,handle.dataset.corner))return;
    event.preventDefault();touch=null;turn.pointerId=event.pointerId;turn.startX=event.clientX;turn.startY=event.clientY;turn.distance=0;book.setPointerCapture(event.pointerId);
  });
  book.addEventListener('pointermove',event=>{
    if(!turn||turn.pointerId!==event.pointerId)return;event.preventDefault();
    const dx=event.clientX-turn.startX,dy=event.clientY-turn.startY;turn.distance=Math.hypot(dx,dy);
    const x=turn.forward?Math.max(-turn.w,Math.min(turn.w-.02,turn.p.x+dx)):Math.max(.02,Math.min(2*turn.w,dx));
    paint({x,y:Math.max(-turn.h*.3,Math.min(turn.h*1.3,turn.p.y+dy))});
  });
  book.addEventListener('pointerup',event=>{
    if(!turn||turn.pointerId!==event.pointerId)return;
    suppressClickUntil=performance.now()+600;
    const commit=turn.distance<7||Math.abs(turn.p.x-turn.d.x)>turn.w*.45;
    if(book.hasPointerCapture(event.pointerId))book.releasePointerCapture(event.pointerId);turn.pointerId=null;settle(commit);
  });
  book.addEventListener('pointercancel',event=>{if(turn&&turn.pointerId===event.pointerId){turn.pointerId=null;settle(false);}});
  $('contentsList').innerHTML=row(0,'Обложка')+row(pages.findIndex(p=>p.type==='contents'),'Содержание')+chapters.map(ch=>{let last=null;return `<h3>${esc(ch.title)}</h3>`+pages.map((p,i)=>{if(p.chapter!==ch.id)return '';const n=partName(p);const head=n&&n!==last?`<h4>${esc(n)}</h4>`:'';last=n||last;return head+row(i,p.title.replace(/\n/g,' '));}).join('');}).join('');
  $('contentsButton').addEventListener('click',()=>{if(!turn)contents.showModal();});
  document.addEventListener('click',event=>{
    if(turn||performance.now()<suppressClickUntil)return;
    const page=event.target.closest('[data-page]');if(page){contents.close();navigate(Number(page.dataset.page));return;}
    const corner=event.target.closest('[data-turn]');if(corner){move(Number(corner.dataset.turn));return;}
    if(event.target.closest('[data-open]')){move(1);return;}
    const zoom=event.target.closest('[data-art]');if(zoom){const p=pages[Number(zoom.dataset.art)];$('artTitle').textContent=p.title.replace(/\n/g,' ');const full=$('artFull');full.onerror=p.fallback?()=>{full.onerror=null;full.src=p.fallback;}:null;full.src=p.image;full.parentNode.classList.toggle('no-dim',['faction-title','last-firing'].includes(p.id));full.parentNode.classList.toggle('half-dim',['sigillat','gatekeeper'].includes(p.id));$('artFull').alt=p.alt;$('artCaption').textContent=p.caption;art.showModal();const fr=full.parentNode,fx=parseFloat(p.focus||'50')/100,centre=()=>{fr.scrollLeft=(fr.scrollWidth-fr.clientWidth)*fx;};full.onload=centre;requestAnimationFrame(centre);}
  });
  for(const dialog of [contents,art]){dialog.querySelector('.close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});}
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&turn){event.preventDefault();settle(false);return;}
    if(contents.open||art.open||turn||event.altKey||event.ctrlKey||event.metaKey)return;
    if(event.key==='ArrowRight'){event.preventDefault();move(1);}if(event.key==='ArrowLeft'){event.preventDefault();move(-1);}
    if(event.key==='Home'){event.preventDefault();navigate(0);}if(event.key==='End'){event.preventDefault();navigate(pages.length-1);}
  });
  book.addEventListener('touchstart',e=>{if(e.touches.length!==1||e.target.closest('[data-turn]')){touch=null;return;}touch={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:true});
  book.addEventListener('touchend',e=>{if(!touch||turn)return;const dx=e.changedTouches[0].clientX-touch.x,dy=e.changedTouches[0].clientY-touch.y;touch=null;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.6){suppressClickUntil=performance.now()+600;move(dx<0?1:-1);}},{passive:true});
  book.addEventListener('touchcancel',()=>{touch=null;},{passive:true});
  const fromHash=()=>Math.max(0,pages.findIndex(p=>p.id===location.hash.slice(1)));
  addEventListener('hashchange',()=>{const target=fromHash();if(turn)finish(false);render(target);});
  addEventListener('resize',()=>{if(turn)finish(false);});
  narrow.addEventListener('change',()=>{if(turn)finish(false);render(current);});
  render(fromHash());
})();
