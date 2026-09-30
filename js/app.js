/* SosoToolBox — outils 100% navigateur + préférences persistantes */
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
let currentImage=null,resizeImage=null,compressImage=null;

const STORE="sosotoolbox-settings-v1";
const defaults={theme:"system",density:"normal",motion:"on",lastTool:"off"};

function loadSettings(){
  try{return {...defaults,...JSON.parse(localStorage.getItem(STORE)||"{}")}}catch{return {...defaults}}
}
let settings=loadSettings();

function saveSettings(){
  try{localStorage.setItem(STORE,JSON.stringify(settings))}catch{}
}
function applySettings(){
  const theme=settings.theme==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):settings.theme;
  document.documentElement.dataset.theme=theme;
  document.documentElement.classList.toggle("compact",settings.density==="compact");
  document.documentElement.classList.toggle("no-motion",settings.motion==="off");
}
function setSetting(key,value){settings[key]=value;saveSettings();applySettings();}

function showView(name){
  $$(".view").forEach(v=>v.classList.remove("active"));
  $("#"+name+"-view").classList.add("active");
  window.scrollTo({top:0,behavior:settings.motion==="off"?"auto":"smooth"});
}
function openTool(name){
  if(settings.lastTool==="on"){settings.lastOpened=name;saveSettings()}
  showView("tool");renderTool(name);
}
function layout(title,desc,body){return '<div class="tool-panel"><span class="eyebrow">OUTIL</span><h1>'+title+'</h1><p>'+desc+'</p>'+body+'</div>'}

function renderTool(name){
 const html={
 links:layout("Nettoyeur de liens","Retire les paramètres de tracking tout en gardant les paramètres utiles.",
 '<div class="field"><label>URL</label><input id="url-input" type="url" placeholder="https://exemple.com/page?utm_source=test&id=42"></div><div class="actions"><button class="primary" id="clean-url">Nettoyer</button></div><div id="url-result"></div>'),
 images:layout("Convertisseur d’images","Convertis une image en PNG, JPG ou WebP directement dans ton navigateur.",
 '<div class="dropzone"><input id="convert-file" type="file" accept="image/png,image/jpeg,image/webp"><label for="convert-file">Choisir une image</label><div class="muted">PNG · JPG · WebP</div></div><div id="convert-options" class="field" hidden><div class="row"><select id="convert-format"><option value="image/png">PNG</option><option value="image/jpeg">JPG</option><option value="image/webp">WebP</option></select><input id="convert-quality" type="number" min="1" max="100" value="92"></div><div class="actions"><button class="primary" id="convert-button">Convertir et télécharger</button></div></div><div id="convert-preview"></div>'),
 compress:layout("Compresseur d’image","Réduis le poids d’une image avec un niveau de qualité choisi.",
 '<div class="dropzone"><input id="compress-file" type="file" accept="image/jpeg,image/png,image/webp"><label for="compress-file">Choisir une image</label></div><div id="compress-options" class="field" hidden><label>Qualité : <span id="quality-label">70</span>%</label><input id="compress-quality" type="range" min="10" max="95" value="70"><div class="actions"><button class="primary" id="compress-button">Compresser et télécharger</button></div></div><div id="compress-info" class="result" hidden></div>'),
 resize:layout("Redimensionneur","Change les dimensions d'une image.",
 '<div class="dropzone"><input id="resize-file" type="file" accept="image/*"><label for="resize-file">Choisir une image</label></div><div id="resize-options" class="field" hidden><div class="row"><input id="resize-width" type="number" min="1" placeholder="Largeur"><input id="resize-height" type="number" min="1" placeholder="Hauteur"></div><label><input id="keep-ratio" type="checkbox" checked> Conserver les proportions</label><div class="actions"><button class="primary" id="resize-button">Redimensionner et télécharger</button></div></div>'),
 json:layout("Formateur JSON","Valide et formate un JSON, ou le minifie en un clic.",
 '<textarea id="json-input" placeholder="{&quot;name&quot;:&quot;Soso&quot;}"></textarea><div class="actions"><button class="primary" id="json-format">Formater</button><button class="secondary" id="json-minify">Minifier</button></div><div id="json-result" class="result">En attente.</div>'),
 base64:layout("Encodeur Base64","Encode ou décode du texte sans envoyer quoi que ce soit à un serveur.",
 '<textarea id="base64-input" placeholder="Texte à encoder..."></textarea><div class="actions"><button class="primary" id="base64-encode">Encoder</button><button class="secondary" id="base64-decode">Décoder</button></div><div id="base64-result" class="result">En attente.</div>'),
 urlcodec:layout("Encodeur URL","Encode ou décode proprement une chaîne utilisée dans une URL.",
 '<textarea id="urlcodec-input" placeholder="texte à encoder..."></textarea><div class="actions"><button class="primary" id="url-encode">Encoder</button><button class="secondary" id="url-decode">Décoder</button></div><div id="urlcodec-result" class="result">En attente.</div>'),
 timestamp:layout("Timestamp","Convertis une date en Unix timestamp ou un timestamp en date.",
 '<div class="row"><input id="timestamp-input" placeholder="2026-09-30 20:30 ou 1790796600"><select id="timestamp-mode"><option value="toUnix">Date → Unix</option><option value="fromUnix">Unix → Date</option></select></div><div class="actions"><button class="primary" id="timestamp-convert">Convertir</button></div><div id="timestamp-result" class="result">En attente.</div>'),
 calculator:layout("Calculatrice","Calcule une expression simple. Exemple : (25*4)+10/2.",
 '<input id="calc-input" placeholder="(25*4)+10/2"><div class="actions"><button class="primary" id="calculate">Calculer</button></div><div id="calc-result" class="result">En attente.</div>'),
 hash:layout("Générateur de hash","Calcule un hash cryptographique dans ton navigateur.",
 '<textarea id="hash-input" placeholder="Texte à hasher..."></textarea><div class="row"><select id="hash-algo"><option>SHA-256</option><option>SHA-384</option><option>SHA-512</option></select></div><div class="actions"><button class="primary" id="hash-generate">Générer</button></div><div id="hash-result" class="result">En attente.</div>'),
 palette:layout("Palette de couleurs","Génère six nuances. Clique sur une couleur pour la copier.",
 '<div class="row"><input id="hex-input" value="#6D5DFB" maxlength="7" placeholder="#000000"><input id="color-picker" type="color" value="#6D5DFB" style="max-width:62px;padding:5px"></div><div class="actions"><button class="primary" id="generate-palette">Générer</button></div><div id="swatches" class="swatches"></div>'),
 text:layout("Outils texte","Transforme rapidement ton texte.",
 '<textarea id="text-input" placeholder="Écris ou colle ton texte ici..."></textarea><div class="actions"><button class="primary" id="text-upper">MAJUSCULES</button><button class="secondary" id="text-lower">minuscules</button><button class="secondary" id="text-clean">Nettoyer</button><button class="secondary" id="text-copy">Copier</button></div><div id="text-count" class="muted">0 caractère</div>'),
 password:layout("Générateur de mots de passe","Crée un mot de passe aléatoire localement.",
 '<div class="row"><input id="password-length" type="number" min="8" max="128" value="20"><select id="password-set"><option value="all">Lettres + chiffres + symboles</option><option value="alnum">Lettres + chiffres</option><option value="letters">Lettres uniquement</option></select></div><div class="actions"><button class="primary" id="generate-password">Générer</button></div><div id="password-result" class="result">Clique sur Générer.</div>')
 };
 $("#tool-content").innerHTML=html[name]||"<p>Outil introuvable.</p>";
 if(name==="json") $("#json-input").focus();
}

function cleanUrl(){
 try{
  const url=new URL($("#url-input").value.trim()),keep=["id","q","query","page","sort","filter","lang","category"];
  [...url.searchParams.keys()].forEach(key=>{const k=key.toLowerCase();if(k.startsWith("utm_")||["fbclid","gclid","mc_cid","mc_eid","ref"].includes(k)||!keep.includes(k))url.searchParams.delete(key)});
  const value=url.toString();$("#url-result").innerHTML='<div class="result">'+escapeHtml(value)+'<div class="actions"><button class="secondary" data-copy="'+escapeHtml(value)+'">Copier</button></div></div>';
 }catch{$("#url-result").innerHTML='<div class="result">URL invalide.</div>'}
}
function loadImage(file,target){if(!file)return;const image=new Image();image.onload=()=>target(image);image.src=URL.createObjectURL(file)}
function convertImage(){
 if(!currentImage)return;const canvas=document.createElement("canvas");canvas.width=currentImage.width;canvas.height=currentImage.height;canvas.getContext("2d").drawImage(currentImage,0,0);
 const type=$("#convert-format").value,quality=Number($("#convert-quality").value)/100,ext=type==="image/jpeg"?"jpg":type.split("/")[1];
 canvas.toBlob(blob=>download(blob,"sosotoolbox."+ext),type,quality);
}
function compressImageFile(){
 if(!compressImage)return;const q=Number($("#compress-quality").value)/100,canvas=document.createElement("canvas");canvas.width=compressImage.width;canvas.height=compressImage.height;canvas.getContext("2d").drawImage(compressImage,0,0);
 canvas.toBlob(blob=>{download(blob,"sosotoolbox-compressed.jpg");$("#compress-info").hidden=false;$("#compress-info").textContent="Fichier généré : "+formatBytes(blob.size)}, "image/jpeg",q);
}
function resizeImageFile(){
 if(!resizeImage)return;const w=Number($("#resize-width").value),h=Number($("#resize-height").value);if(!w||!h)return;
 const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;canvas.getContext("2d").drawImage(resizeImage,0,0,w,h);canvas.toBlob(blob=>download(blob,"sosotoolbox-resized.png"),"image/png");
}
function generatePalette(){
 const raw=$("#hex-input").value.replace("#","");if(!/^[0-9a-fA-F]{6}$/.test(raw)){showToast("HEX invalide");return}
 const n=parseInt(raw,16),r=n>>16,g=n>>8&255,b=n&255,offsets=[-45,-20,0,20,45,70];
 $("#swatches").innerHTML=offsets.map(o=>{const c=rgb(r+o,g+o,b+o);return '<button class="swatch" style="background:'+c+'" data-copy="'+c+'">'+c+"</button>"}).join("");
}
function transformText(mode){
 const input=$("#text-input");if(mode==="upper")input.value=input.value.toUpperCase();if(mode==="lower")input.value=input.value.toLowerCase();if(mode==="clean")input.value=input.value.replace(/[ \t]+/g," ").replace(/\n{3,}/g,"\n\n").trim();input.dispatchEvent(new Event("input"));
}
function generatePassword(){
 const sets={all:"ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*_-+=",alnum:"ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789",letters:"ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"};
 const length=Math.min(128,Math.max(8,Number($("#password-length").value))),chars=sets[$("#password-set").value],random=new Uint32Array(length);crypto.getRandomValues(random);let password="";random.forEach(v=>password+=chars[v%chars.length]);
 $("#password-result").innerHTML="<b>"+escapeHtml(password)+"</b><div class=\"actions\"><button class=\"secondary\" data-copy=\""+escapeHtml(password)+"\">Copier</button></div>";
}
function jsonAction(minify){
 try{const value=JSON.parse($("#json-input").value);const out=minify?JSON.stringify(value):JSON.stringify(value,null,2);$("#json-result").textContent=out}
 catch{$("#json-result").textContent="JSON invalide."}
}
function base64Encode(){try{$("#base64-result").textContent=btoa(unescape(encodeURIComponent($("#base64-input").value)))}catch{$("#base64-result").textContent="Impossible d’encoder."}}
function base64Decode(){try{$("#base64-result").textContent=decodeURIComponent(escape(atob($("#base64-input").value.trim())))}catch{$("#base64-result").textContent="Base64 invalide."}}
function urlCodec(mode){try{const v=$("#urlcodec-input").value;$("#urlcodec-result").textContent=mode==="encode"?encodeURIComponent(v):decodeURIComponent(v)}catch{$("#urlcodec-result").textContent="Chaîne invalide."}}
function timestampConvert(){
 const value=$("#timestamp-input").value.trim();
 try{
  if($("#timestamp-mode").value==="toUnix"){const d=new Date(value.replace(" ","T"));if(isNaN(d))throw 0;$("#timestamp-result").textContent=Math.floor(d.getTime()/1000)}
  else{const n=Number(value);if(!Number.isFinite(n))throw 0;$("#timestamp-result").textContent=new Date(n*1000).toLocaleString("fr-FR")}
 }catch{$("#timestamp-result").textContent="Valeur invalide."}
}
function calculate(){
 const expr=$("#calc-input").value.trim();if(!/^[0-9+\-*/().%\s]+$/.test(expr)){showToast("Expression invalide");return}
 try{$("#calc-result").textContent=String(Function('"use strict";return ('+expr+')')())}catch{$("#calc-result").textContent="Calcul invalide."}
}
async function generateHash(){
 const data=new TextEncoder().encode($("#hash-input").value),buffer=await crypto.subtle.digest($("#hash-algo").value,data);$("#hash-result").textContent=[...new Uint8Array(buffer)].map(b=>b.toString(16).padStart(2,"0")).join("");
}
function rgb(r,g,b){return "#"+[r,g,b].map(v=>Math.max(0,Math.min(255,v)).toString(16).padStart(2,"0")).join("").toUpperCase()}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function copyText(value){if(navigator.clipboard)navigator.clipboard.writeText(value);showToast("Copié")}
function download(blob,name){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
function formatBytes(bytes){if(bytes<1024)return bytes+" o";if(bytes<1048576)return (bytes/1024).toFixed(1)+" Ko";return (bytes/1048576).toFixed(2)+" Mo"}
function showToast(message){const t=document.createElement("div");t.className="toast";t.textContent=message;document.body.appendChild(t);setTimeout(()=>t.remove(),1200)}

const actions={
 "clean-url":cleanUrl,"convert-button":convertImage,"compress-button":compressImageFile,"resize-button":resizeImageFile,
 "json-format":()=>jsonAction(false),"json-minify":()=>jsonAction(true),"base64-encode":base64Encode,"base64-decode":base64Decode,
 "url-encode":()=>urlCodec("encode"),"url-decode":()=>urlCodec("decode"),"timestamp-convert":timestampConvert,"calculate":calculate,
 "hash-generate":generateHash,"generate-palette":generatePalette,"text-upper":()=>transformText("upper"),"text-lower":()=>transformText("lower"),
 "text-clean":()=>transformText("clean"),"text-copy":()=>copyText($("#text-input").value),"generate-password":generatePassword
};

document.addEventListener("click",e=>{
 const tool=e.target.closest("[data-tool]");if(tool){openTool(tool.dataset.tool);return}
 const view=e.target.closest("[data-view]");if(view){e.preventDefault();showView(view.dataset.view);return}
 const theme=e.target.closest("[data-theme-choice]");if(theme){setSetting("theme",theme.dataset.themeChoice);return}
 const density=e.target.closest("[data-density]");if(density){setSetting("density",density.dataset.density);return}
 const motion=e.target.closest("[data-motion]");if(motion){setSetting("motion",motion.dataset.motion);return}
 const last=e.target.closest("[data-last-tool]");if(last){setSetting("lastTool",last.dataset.lastTool);return}
 const copy=e.target.closest("[data-copy]");if(copy){copyText(copy.dataset.copy);return}
 if(e.target.closest("#reset-settings")){settings={...defaults};saveSettings();applySettings();showToast("Paramètres réinitialisés");return}
 const action=e.target.closest("button")?.id;if(action&&actions[action])actions[action]();
});
document.addEventListener("change",e=>{
 if(e.target.id==="convert-file")loadImage(e.target.files[0],image=>{currentImage=image;$("#convert-options").hidden=false;$("#convert-preview").innerHTML='<img class="preview" src="'+image.src+'"><div class="muted">'+image.width+" × "+image.height+" px</div>"});
 if(e.target.id==="compress-file")loadImage(e.target.files[0],image=>{compressImage=image;$("#compress-options").hidden=false});
 if(e.target.id==="resize-file")loadImage(e.target.files[0],image=>{resizeImage=image;$("#resize-options").hidden=false;$("#resize-width").value=image.width;$("#resize-height").value=image.height});
 if(e.target.id==="color-picker")$("#hex-input").value=e.target.value;
});
document.addEventListener("input",e=>{
 if(e.target.id==="text-input"){const n=e.target.value.length;$("#text-count").textContent=n+" caractère"+(n>1?"s":"")}
 if(e.target.id==="resize-width"&&$("#keep-ratio")?.checked&&resizeImage)$("#resize-height").value=Math.round(Number(e.target.value)*resizeImage.height/resizeImage.width);
 if(e.target.id==="compress-quality")$("#quality-label").textContent=e.target.value;
});
$("#theme-toggle").addEventListener("click",()=>setSetting("theme",(settings.theme==="light"?"dark":"light")));
applySettings();

if(settings.lastTool==="on"&&settings.lastOpened){
  window.addEventListener("load",()=>openTool(settings.lastOpened),{once:true});
}
matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change",()=>{if(settings.theme==="system")applySettings()});
