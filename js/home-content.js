(function(){
const root=document.getElementById('home');
function text(el,value){if(el&&value!==undefined)el.textContent=value}
function image(el,url,alt){if(el){el.src=url||'';el.alt=alt||''}}
function link(el,href,label){if(!el)return;if(href)el.setAttribute('href',href);if(label!==undefined){const span=el.querySelector('span');if(span&&el.classList.contains('cta')){el.firstChild.textContent=label+' ';}else el.textContent=label+' ↗'}}
function sectionNode(section){
const node=document.createElement('section');node.dataset.homeSection=section.id;const e=document.createElement.bind(document);
function el(tag,cls,content){const n=document.createElement(tag);if(cls)n.className=cls;if(content!==undefined)n.textContent=content;return n}
function a(href,cls,label){const n=el('a',cls,label);n.href=href||'#';return n}
function pic(d){const n=el('img');image(n,d.image,d.alt||d.title);n.loading='lazy';return n}
if(section.type==='collections'||section.type==='stories'){
node.className='container section';const head=el('div','heading');const t=el('div');t.append(el('span','eyebrow',section.eyebrow),el('h2','',section.title));head.append(t,a(section.href,'textlink',(section.linkText||'Ver más')+' ↗'));node.append(head);
const grid=el('div',section.type==='collections'?'collections':'stories');
(section.items||[]).forEach(d=>{
if(section.type==='collections'){const card=a(d.href,'tile','');card.append(pic(d));const body=el('div','tile-body');body.append(el('h3','',d.title),el('p','',d.text),el('span','arrow','Explorar ↗'));card.append(body);grid.append(card)}
else{const card=a(d.href,'','');const article=el('article','story');article.append(pic(d),el('div','eyebrow',d.eyebrow),el('h3','',d.title),el('p','',d.text),el('span','textlink','Leer más ↗'));card.append(article);grid.append(card)}
});node.append(grid)
}else if(section.type==='feature'){node.className='feature';const wrap=el('div','container feature-grid');wrap.append(pic(section));const t=el('div');t.append(el('span','eyebrow',section.eyebrow),el('h2','',section.title),el('p','',section.text));const button=a(section.href,'cta darkcta',(section.button||'Descubrir')+' ↗');t.append(button);wrap.append(t);node.append(wrap)
}else if(section.type==='store'){node.className='store';const wrap=el('div','container store-inner'),t=el('div');const kicker=el('span','eyebrow',section.eyebrow);kicker.style.color='#e0a89e';t.append(kicker,el('h2','',section.title),el('p','',section.text));wrap.append(t,a(section.href,'cta',(section.button||'Ver tienda')+' ↗'));node.append(wrap)
}else if(section.type==='text'){node.className='container section';node.append(el('div','eyebrow',section.eyebrow),el('h2','',section.title),el('p','',section.text))}
return node
}
function apply(data){if(!data||!Array.isArray(data.sections))return;const intro=root.querySelector('.intro');text(intro?.querySelector('.eyebrow'),data.intro?.eyebrow);text(intro?.querySelector('p'),data.intro?.text);const hero=root.querySelector('.hero'),h=data.hero||{};image(hero?.querySelector('img'),h.image,h.alt);if(hero?.querySelector('img'))hero.querySelector('img').style.objectPosition=h.position||'center';text(hero?.querySelector('.eyebrow'),h.eyebrow);text(hero?.querySelector('h1'),h.title);text(hero?.querySelector('p'),h.description);link(hero?.querySelector('.cta'),h.href,h.button);
root.querySelectorAll('[data-home-section],.intro ~ .container.section,.intro ~ .feature,.intro ~ .store').forEach(n=>{if(n!==hero)n.remove()});
const frag=document.createDocumentFragment();data.sections.filter(s=>s.visible!==false).forEach(s=>frag.append(sectionNode(s)));root.append(frag)
}
async function load(){try{const r=await fetch('data/home.json',{cache:'no-store'});if(!r.ok)throw Error(r.status);apply(await r.json())}catch(e){console.warn('No se pudo cargar la configuración de portada, usando contenido estático.',e)}}
window.addEventListener('message',e=>{if(e.origin!==location.origin||!e.data||e.data.type!=='PRODIGO_PREVIEW')return;apply(e.data.payload)});
load()
})();