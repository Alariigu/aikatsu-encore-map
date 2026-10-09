const $=id=>document.getElementById(id);
const regionDefs=[['北海道','北海道'],['東北','青森県 岩手県 宮城県 秋田県 山形県 福島県'],['關東','茨城県 栃木県 群馬県 埼玉県 千葉県 東京都 神奈川県'],['中部','新潟県 富山県 石川県 福井県 山梨県 長野県 岐阜県 静岡県 愛知県'],['近畿','三重県 滋賀県 京都府 大阪府 兵庫県 奈良県 和歌山県'],['中國','鳥取県 島根県 岡山県 広島県 山口県'],['四國','徳島県 香川県 愛媛県 高知県'],['九州・沖繩','福岡県 佐賀県 長崎県 熊本県 大分県 宮崎県 鹿児島県 沖縄県']];
const regionLookup=Object.fromEntries(regionDefs.flatMap(([r,p])=>p.split(' ').map(x=>[x,r])));
let stores=[],region='',page=1,onlyFav=false,favorites=new Set();const pageSize=24;
try{const saved=JSON.parse(localStorage.getItem('encore-favorites')||'[]');if(Array.isArray(saved))favorites=new Set(saved.filter(x=>typeof x==='string'))}catch{}
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=s=>s.normalize('NFKC').toLowerCase().replace(/\s+/g,'');
const key=s=>s[0]+'|'+s[2];
let toastTimer;function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2400)}
function updateFavorites(){try{localStorage.setItem('encore-favorites',JSON.stringify([...favorites]))}catch{toast('此瀏覽器無法保存收藏；目前收藏會保留到關閉頁面。')}$('favCount').textContent=favorites.size}
function renderRegions(){const counts=Object.fromEntries(regionDefs.map(([r])=>[r,stores.filter(s=>regionLookup[s[1]]===r).length]));$('regions').innerHTML=[['','全日本'],...regionDefs.map(([r])=>[r,r])].map(([r,label])=>`<button data-region="${r}" class="${region===r?'active':''}" aria-pressed="${region===r}" title="${r?counts[r]:stores.length} 間設置店">${label}</button>`).join('')}
function syncRegionScope(){
 const pref=$('pref'),selected=pref.value;
 const prefs=[...new Set(stores.map(s=>s[1]))].filter(p=>!region||regionLookup[p]===region);
 pref.innerHTML=`<option value="">${region?region+'地區・全部都道府縣':'全部都道府縣'}</option>`+prefs.map(p=>`<option>${escapeHtml(p)}</option>`).join('');
 pref.value=prefs.includes(selected)?selected:'';
 $('search').placeholder=region?`僅搜尋${region}地區的店名、城市、地址…`:'搜尋店名、城市、地址…';
 $('search').setAttribute('aria-label',region?`搜尋${region}地區的店名、城市或地址`:'搜尋店名、城市或地址');
 $('searchScope').hidden=!region;
 $('searchScope').textContent=region?`⌑ 搜尋範圍已鎖定：${region}地區（選「全日本」解除）`:'';
}
function filtered(){const q=normalize($('search').value),pref=$('pref').value;let data=stores.filter(s=>(!region||regionLookup[s[1]]===region)&&(!pref||s[1]===pref)&&(!q||normalize(s[0]+s[1]+s[2]).includes(q))&&(!onlyFav||favorites.has(key(s))));if($('sort').value==='name')data.sort((a,b)=>a[0].localeCompare(b[0],'ja'));return data}
function render(){const data=filtered(),pages=Math.max(1,Math.ceil(data.length/pageSize));page=Math.min(page,pages);$('total').textContent=data.length.toLocaleString();$('filterNote').textContent=[region,$('pref').value,onlyFav?'我的收藏':''].filter(Boolean).join(' · ');$('onlyFav').classList.toggle('active',onlyFav);$('onlyFav').setAttribute('aria-pressed',onlyFav);$('navFav').setAttribute('aria-pressed',onlyFav);
 $('results').innerHTML=data.slice((page-1)*pageSize,page*pageSize).map(s=>{const id=stores.indexOf(s),saved=favorites.has(key(s)),url='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(s[0]+' '+s[2]);return `<article class="card"><div class="card-top"><span class="pref-tag">${escapeHtml(s[1])} · ${regionLookup[s[1]]}</span><button class="fav ${saved?'is-saved':''}" data-fav="${id}" aria-label="${saved?'取消收藏':'收藏'} ${escapeHtml(s[0])}" aria-pressed="${saved}">${saved?'♥':'♡'}</button></div><h3>${escapeHtml(s[0])}</h3><p class="address">${escapeHtml(s[2])}</p><a class="phone" href="tel:${s[3]}">TEL ${s[3]}</a><div class="card-actions"><a class="map-link" href="${escapeHtml(url)}" target="_blank" rel="noopener">Google Maps 導航 ↗</a><button class="copy" data-copy="${id}">複製地址</button></div></article>`}).join('')||`<div class="empty"><span class="empty-symbol">✧</span><strong>${onlyFav&&favorites.size===0?'你的舞台手帳還是空白的':'還沒找到這個舞台'}</strong><p>${onlyFav&&favorites.size===0?'按下店家旁的 ♡，把想去的店收藏起來吧。':'試試其他關鍵字，或重設地區篩選。'}</p></div>`;
 $('pagination').innerHTML=data.length?`<button id="prev" ${page===1?'disabled':''}>← 上一頁</button><span>${page} / ${pages}</span><button id="next" ${page===pages?'disabled':''}>下一頁 →</button>`:'';if($('prev'))$('prev').onclick=()=>changePage(-1);if($('next'))$('next').onclick=()=>changePage(1);
 const params=new URLSearchParams();if($('search').value)params.set('q',$('search').value);if($('pref').value)params.set('pref',$('pref').value);if(region)params.set('region',region);try{history.replaceState(null,'',location.pathname+(params.size?'?'+params:'')+location.hash)}catch{}
}
function changePage(delta){page+=delta;render();$('finder').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}
function reset(){region='';page=1;onlyFav=false;$('search').value='';$('pref').value='';$('sort').value='official';syncRegionScope();renderRegions();render()}
$('search').addEventListener('input',()=>{page=1;render()});for(const id of ['pref','sort'])$(id).addEventListener('change',()=>{page=1;render()});$('clear').onclick=reset;
$('regions').onclick=e=>{const b=e.target.closest('button');if(!b)return;region=b.dataset.region;page=1;$('pref').value='';syncRegionScope();renderRegions();render()};
function toggleOnly(){onlyFav=!onlyFav;page=1;render()}$('onlyFav').onclick=toggleOnly;$('navFav').onclick=()=>{toggleOnly();$('finder').scrollIntoView({behavior:'smooth'})};
$('results').onclick=async e=>{const fav=e.target.closest('[data-fav]'),copy=e.target.closest('[data-copy]');if(fav){const s=stores[Number(fav.dataset.fav)],k=key(s);if(favorites.has(k))favorites.delete(k);else favorites.add(k);updateFavorites();render()}if(copy){const s=stores[Number(copy.dataset.copy)];try{await navigator.clipboard.writeText(s[2]);toast('地址已複製 ♡')}catch{toast('無法複製，請長按店家地址選取。')}}};
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();$('search').focus()}});
async function init(){try{const response=await fetch('stores.json');if(!response.ok)throw Error('data');stores=await response.json();const prefs=[...new Set(stores.map(s=>s[1]))];$('pref').innerHTML='<option value="">全部都道府縣</option>'+prefs.map(p=>`<option>${p}</option>`).join('');const params=new URLSearchParams(location.search);$('search').value=params.get('q')||'';if(prefs.includes(params.get('pref')))$('pref').value=params.get('pref');if(regionDefs.some(([r])=>r===params.get('region')))region=params.get('region');$('favCount').textContent=favorites.size;syncRegionScope();renderRegions();render()}catch{$('total').textContent='—';$('results').innerHTML='<div class="empty"><strong>店家資料暫時載入失敗</strong><p>請重新整理頁面，或先查看下方官方清單。</p><button onclick="location.reload()">重新載入</button></div>'}}init();
