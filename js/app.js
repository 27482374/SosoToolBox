/* SosoToolBox — navigation + outils
 * Les traitements restent dans le navigateur.
 */
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const names={links:"Nettoyeur de liens",images:"Convertisseur d’images",resize:"Redimensionneur",palette:"Palette de couleurs",text:"Outils texte",password:"Générateur de mots de passe"};
let currentImage=null,resizeImage=null;

function showView(name){
  $$(".view").forEach(v=>v.classList.remove("active"));
  $("#"+name+"-view").classList.add("active");
  window.scrollTo({top:0,behavior:"smooth"});
}
function openTool(name){showView("tool");renderTool(name)}
function layout(title,desc,body){return '<div class="tool-panel"><span class="eyebrow">OUTIL</span><h1>'+title+'</h1><p>'+desc+'</p>'+body+'</div>'}

function renderTool(name){
 const html={
 links:layout("Nettoyeur de liens","Retire les paramètres de tracking tout en gardant les paramètres utiles.",
 '<div class="field"><label>URL</label><input id="url-input" type="url" placeholder="https://exemple.com/page?utm_source=test&id=42"></div><div class="actions"><button class="primary" id="clean-url">Nettoyer</button></div><div id="url-result"></div>'),
 images:layout("Convertisseur d’images","Convertis une image en PNG, JPG ou WebP directement dans ton navigateur.",
 '<div class="dropzone"><input id="convert-file" type="file" accept="image/png,image/jpeg,image/webp"><label for="convert-file">Choisir une image</label><div class="muted">PNG · JPG · WebP</div></div><div id="convert-options" class="field" hidden><div class="row"><select id="convert-format"><option value="image/png">PNG</option><option value="image/jpeg">JPG</option><option value="image/webp">WebP</option></select><input id="convert-quality" type="number" min="1" max="100" value="92"></div><div class="actions"><button class="primary" id="convert-button">Convertir et télécharger</button></div></div><div id="convert-preview"></div>'),
 resize:layout("Redimensionneur","Change les dimensions d'une image.",
 '<div class="dropzone"><input id="resize-file" type="file" accept="image/*"><label for="resize-file">Choisir une image</label></div><div id="resize-options" class="field" hidden><div class="row"><input id="resize-width" type="number" min="1" placeholder="Largeur"><input id="resize-height" type="number" min="1" placeholder="Hauteur"></div><label><input id="keep-ratio" type="checkbox" checked> Conserver les proportions</label><div class="actions"><button class="primary" id="resize-button">Redimensionner et télécharger</button></div></div>'),
 palette:layout("Palette de couleurs","Génère six nuances. Clique sur une couleur pour la copier.",
 '<div class="row"><input id="hex-input" value="#6D5DFB" maxlength="7" placeholder="#000000"><input id="color-picker" type="color" value="#6D5DFB" style="max-width:62px;padding:5px"></div><div class="actions"><button class="primary" id="generate-palette">Générer</button></div><div id="swatches" class="swatches"></div>'),
 text:layout("Outils texte","Transforme rapidement ton texte.",
 '<textarea id="text-input" placeholder="Écris ou colle ton texte ici..."></textarea><div class="actions"><button class="primary" id="text-upper">MAJUSCULES</button><button class="secondary" id="text-lower">minuscules</button><button class="secondary" id="text-clean">Nettoyer</button><button class="secondary" id="text-copy">Copier</button></div><div id="text-count" class="muted">0 caractère</div>'),
 password:layout("Générateur de mots de passe","Crée un mot de passe aléatoire localement.",
 '<div class="row"><input id="password-length" type="number" min="8" max="128" value="20"><select id="password-set"><option value="all">Lettres + chiffres + symboles</option><option value="alnum">Lettres + chiffres</option><option value="letters">Lettres uniquement</option></select></div><div class="actions"><button class="primary" id="generate-password">Générer</button></div><div id="password-result" class="result">Clique sur Générer.</div>')
 };
 $("#tool-content").innerHTML=html[name]||"<p>Outil introuvable.</p>";
}

function cleanUrl(){
 try{
  const url=new URL($("#url-input").value.trim());
  const keep=["id","q","query","page","sort","filter","lang","category"];
  [...url.searchParams.keys()].forEach(key=>{const k=key.toLowerCase();if(k.startsWith("utm_")||["fbclid","gclid","mc_cid","mc_eid","ref"].includes(k)||!keep.includes(k))url.searchParams.delete(key)});
  const value=url.toString();
  $("#url-result").innerHTML='<div class="result">'+escapeHtml(value)+'<div class="actions"><button class="secondary" data-copy="'+escapeHtml(value)+'">Copier</button></div></div>';
 }catch(e){$("#url-result").innerHTML='<div class="result">URL invalide.</div>'}
}
function loadImage(file,target){if(!file)return;const image=new Image();image.onload=()=>target(image);image.src=URL.createObjectURL(file)}
function convertImage(){
 if(!currentImage)return;
 const canvas=document.createElement("canvas");canvas.width=currentImage.width;canvas.height=currentImage.height;
 canvas.getContext("2d").drawImage(currentImage,0,0);
 const type=$("#convert-format").value,quality=Number($("#convert-quality").value)/100,ext=type==="image/jpeg"?"jpg":type.split("/")[1];
 canvas.toBlob(blob=>download(blob,"sosotoolbox."+ext),type,quality);
}
function resizeImageFile(){
 if(!resizeImage)return;const w=Number($("#resize-width").value),h=Number($("#resize-height").value);if(!w||!h)return;
 const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;canvas.getContext("2d").drawImage(resizeImage,0,0,w,h);
 canvas.toBlob(blob=>download(blob,"sosotoolbox-resized.png"),"image/png");
}
function generatePalette(){
 const raw=$("#hex-input").value.replace("#","");if(!/^[0-9a-fA-F]{6}$/.test(raw)){showToast("HEX invalide");return}
 const n=parseInt(raw,16),r=n>>16,g=n>>8&255,b=n&255,offsets=[-45,-20,0,20,45,70];
 $("#swatches").innerHTML=offsets.map(o=>{const c=rgb(r+o,g+o,b+o);return '<button class="swatch" style="background:'+c+'" data-copy="'+c+'">'+c+"</button>"}).join("");
}
function transformText(mode){
 const input=$("#text-input");
 if(mode==="upper")input.value=input.value.toUpperCase();
 if(mode==="lower")input.value=input.value.toLowerCase();
 if(mode==="clean")input.value=input.value.replace(/[ \t]+/g," ").replace(/\n{3,}/g,"\n\n").trim();
 input.dispatchEvent(new Event("input"));
}
function generatePassword(){
 const sets={all:"ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*_-+=",alnum:"ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789",letters:"ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"};
 const length=Math.min(128,Math.max(8,Number($("#password-length").value))),chars=sets[$("#password-set").value],random=new Uint32Array(length);crypto.getRandomValues(random);
 let password="";random.forEach(v=>password+=chars[v%chars.length]);
 $("#password-result").innerHTML="<b>"+escapeHtml(password)+"</b><div class=\"actions\"><button class=\"secondary\" data-copy=\""+escapeHtml(password)+"\">Copier</button></div>";
}
function rgb(r,g,b){return "#"+[r,g,b].map(v=>Math.max(0,Math.min(255,v)).toString(16).padStart(2,"0")).join("").toUpperCase()}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function copyText(value){navigator.clipboard?.writeText(value);showToast("Copié")}
function download(blob,name){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
function showToast(message){const t=document.createElement("div");t.className="toast";t.textContent=message;document.body.appendChild(t);setTimeout(()=>t.remove(),1200)}
function setTheme(theme){document.documentElement.dataset.theme=theme;localStorage.setItem("soso-theme",theme)}

document.addEventListener("click",e=>{
 const tool=e.target.closest("[data-tool]");if(tool){openTool(tool.dataset.tool);return}
 const view=e.target.closest("[data-view]");if(view){e.preventDefault();showView(view.dataset.view);return}
 const themeChoice=e.target.closest("[data-theme-choice]");if(themeChoice){setTheme(themeChoice.dataset.themeChoice);return}
 const copy=e.target.closest("[data-copy]");if(copy){copyText(copy.dataset.copy);return}
 const actions={
   "clean-url":cleanUrl,
   "convert-button":convertImage,
   "resize-button":resizeImageFile,
   "generate-palette":generatePalette,
   "text-upper":()=>transformText("upper"),
   "text-lower":()=>transformText("lower"),
   "text-clean":()=>transformText("clean"),
   "text-copy":()=>copyText($("#text-input").value),
   "generate-password":generatePassword
 };
 const action=e.target.closest("button")?.id;
 if(action && actions[action]) actions[action]();
});
document.addEventListener("change",e=>{
 if(e.target.id==="convert-file")loadImage(e.target.files[0],image=>{currentImage=image;$("#convert-options").hidden=false;$("#convert-preview").innerHTML='<img class="preview" src="'+image.src+'"><div class="muted">'+image.width+" × "+image.height+" px</div>"});
 if(e.target.id==="resize-file")loadImage(e.target.files[0],image=>{resizeImage=image;$("#resize-options").hidden=false;$("#resize-width").value=image.width;$("#resize-height").value=image.height});
 if(e.target.id==="color-picker")$("#hex-input").value=e.target.value;
});
document.addEventListener("input",e=>{
 if(e.target.id==="text-input"){const n=e.target.value.length;$("#text-count").textContent=n+" caractère"+(n>1?"s":"")}
 if(e.target.id==="resize-width"&&$("#keep-ratio")?.checked&&resizeImage)$("#resize-height").value=Math.round(Number(e.target.value)*resizeImage.height/resizeImage.width);
});
$("#theme-toggle").addEventListener("click",()=>setTheme((document.documentElement.dataset.theme||"light")==="light"?"dark":"light"));
setTheme(localStorage.getItem("soso-theme")||"light");