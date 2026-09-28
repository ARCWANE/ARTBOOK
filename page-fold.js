(function(root){
  'use strict';
  function normalize(index,length,span){
    index=Math.max(0,Math.min(length-1,index));
    return index===0?0:1+Math.floor((index-1)/span)*span;
  }
  function adjacent(index,direction,length,span){
    if(direction>0)return index===0?Math.min(1,length-1):Math.min(length-1,index+span);
    return index<=1?0:Math.max(1,index-span);
  }
  function clip(poly,nx,ny,c,positive){
    const out=[];const sign=positive?1:-1;
    for(let i=0;i<poly.length;i++){
      const a=poly[i],b=poly[(i+1)%poly.length];
      const da=(a.x*nx+a.y*ny-c)*sign,db=(b.x*nx+b.y*ny-c)*sign;
      if(da>=-1e-7)out.push(a);
      if((da<0&&db>0)||(da>0&&db<0)){
        const t=da/(da-db);out.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
      }
    }
    return out;
  }
  function geometry(w,h,p,d){
    let nx=p.x-d.x,ny=p.y-d.y;
    if(Math.hypot(nx,ny)<.001)nx=p.x===0?-.001:.001;
    const norm=Math.hypot(nx,ny);nx/=norm;ny/=norm;
    const c=nx*(p.x+d.x)/2+ny*(p.y+d.y)/2;
    const rect=[{x:0,y:0},{x:w,y:0},{x:w,y:h},{x:0,y:h}];
    return {front:clip(rect,nx,ny,c,false),back:clip(rect,nx,ny,c,true),matrix:[1-2*nx*nx,-2*nx*ny,-2*nx*ny,1-2*ny*ny,2*c*nx,2*c*ny]};
  }
  const api={normalize,adjacent,geometry};
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.BookFold=api;
})(typeof window==='object'?window:null);
