// Reliable, dependency-free client script. The page remains usable if optional JSON files are unavailable.
(function(){
  'use strict';
  function escapeHTML(value){const el=document.createElement('div');el.textContent=String(value ?? '');return el.innerHTML;}
  async function readJSON(path,fallback){try{const response=await fetch(path);if(!response.ok)return fallback;const data=await response.json();return data;}catch(error){console.warn('Optional content unavailable:',path);return fallback;}}
  function renderCommands(items){const list=document.getElementById('commandsList');if(!list||!Array.isArray(items)||!items.length)return;list.innerHTML=items.map(item=>`<div class="command"><strong>/${escapeHTML(item.name||'command')}</strong><span>${escapeHTML(item.description||'')}</span></div>`).join('');}
  function renderReviews(items){const list=document.getElementById('reviewsList');if(!list||!Array.isArray(items)||!items.length)return;list.innerHTML=items.slice(0,6).map(item=>`<article><h3>${escapeHTML(item.name||'Community member')}</h3><p>“${escapeHTML(item.text||'A great addition to our server.') }”</p><small>${'★'.repeat(Math.max(1,Math.min(5,Number(item.rating)||5)))}</small></article>`).join('');}
  function renderGallery(items){const list=document.getElementById('galleryList');if(!list||!Array.isArray(items)||!items.length)return;list.innerHTML=items.map(item=>`<div class="gallery-item"><img loading="lazy" src="${escapeHTML(item.url||'')}" alt="${escapeHTML(item.caption||'Gallery image')}"><span class="g-caption">${escapeHTML(item.caption||'')}</span><span class="muted">${escapeHTML(item.date||'')}</span></div>`).join('');}
  function renderAbout(data){const target=document.getElementById('aboutContent');if(!target||!data)return;if(data.text)target.textContent=data.text;else if(data.html)target.textContent=data.html.replace(/<[^>]*>/g,' ');}
  document.addEventListener('DOMContentLoaded',function(){
    const year=document.getElementById('year');if(year)year.textContent=new Date().getFullYear();
    Promise.all([readJSON('commands.json',[]),readJSON('reviews.json',[]),readJSON('gallery.json',[]),readJSON('about.json',{})]).then(function(values){renderCommands(values[0]);renderReviews(values[1]);renderGallery(values[2]);renderAbout(values[3]);});
  });
})();
