import fs from 'node:fs';

const APP='js/app.js';
const TOKO='js/toko-saya.js';

function findFunctionRange(src,name){
  const re=new RegExp(`(^|\\n)function\\s+${name}\\s*\\(`,'m');
  const m=re.exec(src); if(!m) throw new Error(`missing ${name}`);
  const start=m.index+(m[1]?m[1].length:0);
  const brace=src.indexOf('{',m.index+m[0].length);
  let i=brace, depth=0, mode='code', esc=false;
  for(;i<src.length;i++){
    const c=src[i], n=src[i+1];
    if(mode==='line'){ if(c==='\n') mode='code'; continue; }
    if(mode==='block'){ if(c==='*'&&n==='/'){mode='code';i++;} continue; }
    if(mode==='single'||mode==='double'||mode==='template'){
      if(esc){esc=false;continue;} if(c==='\\'){esc=true;continue;} if((mode==='single'&&c==="'")||(mode==='double'&&c==='"')||(mode==='template'&&c==='`'))mode='code'; continue;
    }
    if(c==='/'&&n==='/'){mode='line';i++;continue;} if(c==='/'&&n==='*'){mode='block';i++;continue;}
    if(c==="'"){mode='single';continue;} if(c==='"'){mode='double';continue;} if(c==='`'){mode='template';continue;}
    if(c==='{')depth++; else if(c==='}'&&--depth===0)return [start,i+1];
  }
  throw new Error(`unterminated ${name}`);
}
function removeFunction(src,name){const [a,b]=findFunctionRange(src,name); let end=b; while(end<src.length&&src[end]==='\n')end++; return src.slice(0,a)+src.slice(end);}
function extractFunction(src,name){const [a,b]=findFunctionRange(src,name); return src.slice(a,b);}
function compact(src){
  let out='',i=0,pending=false;
  const id=c=>/[A-Za-z0-9_$]/.test(c||'');
  const regexWords=new Set(['return','throw','case','delete','void','typeof','instanceof','in','of','yield','await','else','do']);
  while(i<src.length){const c=src[i],n=src[i+1];
    if(c==='/'&&n==='/'){i+=2;while(i<src.length&&src[i]!== '\n')i++;pending=true;continue;}
    if(c==='/'&&n==='*'){i+=2;while(i<src.length&&!(src[i]==='*'&&src[i+1]==='/'))i++;i+=2;pending=true;continue;}
    if(/\s/.test(c)){pending=true;i++;continue;}
    if(c==="'"||c==='"'||c==='`'){
      if(pending&&id(out.at(-1))&&id(c))out+=' ';pending=false;const q=c;out+=c;i++;
      while(i<src.length){const x=src[i];out+=x;i++;if(x==='\\'&&i<src.length){out+=src[i++];continue;}if(x===q)break;}continue;
    }
    if(c==='/'){
      let j=out.length-1;while(j>=0&&/\s/.test(out[j]))j--;const prev=out[j]||'';const wm=out.slice(0,j+1).match(/([A-Za-z_$][\w$]*)$/);const word=wm?wm[1]:'';
      const regexStart=!prev||'=([{,:;!&|?+\-*%^~<>'.includes(prev)||regexWords.has(word);
      if(regexStart){if(pending&&regexWords.has(word))out+=' ';pending=false;out+='/';i++;let cls=false;while(i<src.length){const x=src[i];out+=x;i++;if(x==='\\'&&i<src.length){out+=src[i++];continue;}if(x==='[')cls=true;else if(x===']')cls=false;else if(x==='/'&&!cls)break;}while(i<src.length&&/[A-Za-z]/.test(src[i]))out+=src[i++];continue;}
    }
    if(pending){const p=out.at(-1)||'';if(id(p)&&id(c))out+=' ';else if(/[+\-]/.test(p)&&p===c)out+=' ';}pending=false;out+=c;i++;
  }
  return out.trim()+'\n';
}

const toast=extractFunction(fs.readFileSync(APP,'utf8'),'showToast');
const toastModule=`import { refreshIcons } from './runtime.js';\n\nlet lastToastKey = '';\nlet lastToastTime = 0;\n\n${toast}\n`;
fs.writeFileSync('js/utils/toast.js',toastModule);

const modalModule=`export function createModalController({ nestedPickerModals, refreshIcons, onPrimaryModalVisibilityChange = null, historyBase = {}, historyModalKey = 'appModal' }) {\n  const modalHistoryStack = [];\n  let isPopStateActive = false;\n\n  function openModal(modalId, pushHistory = true) {\n    const modal = document.getElementById(modalId);\n    if (!modal) { console.error('Modal not found:', modalId); return; }\n    const isPicker = nestedPickerModals.has(modalId);\n    if (!isPicker) {\n      document.querySelectorAll('.fixed[id^="modal-"]').forEach((m) => {\n        if (m.id !== modalId && !nestedPickerModals.has(m.id)) {\n          m.classList.add('hidden'); m.style.display = 'none'; m.style.visibility = 'hidden';\n          const idx = modalHistoryStack.indexOf(m.id); if (idx !== -1) modalHistoryStack.splice(idx, 1);\n        }\n      });\n      onPrimaryModalVisibilityChange?.(false);\n    }\n    modal.classList.remove('hidden'); modal.style.display = 'flex'; modal.style.visibility = 'visible'; modal.style.opacity = '1'; document.body.style.overflow = 'hidden';\n    if (!modalHistoryStack.includes(modalId)) modalHistoryStack.push(modalId);\n    if (pushHistory && !isPopStateActive && !isPicker) {\n      try { window.history.pushState({ modalId, [historyModalKey]: true }, ''); } catch {}\n    }\n    if (window.lucide) { try { refreshIcons(modal); } catch { refreshIcons(); } }\n  }\n\n  function closeModal(modalId, fromHistory = false) {\n    const modal = document.getElementById(modalId); if (!modal) return;\n    modal.classList.add('hidden'); modal.style.display = 'none'; modal.style.visibility = 'hidden';\n    const stackIndex = modalHistoryStack.lastIndexOf(modalId); if (stackIndex !== -1) modalHistoryStack.splice(stackIndex, 1);\n    const isNestedPicker = nestedPickerModals.has(modalId);\n    if (!fromHistory && !isPopStateActive && !isNestedPicker && window.history.state?.[historyModalKey]) { try { window.history.back(); } catch {} }\n    const openModals = Array.from(document.querySelectorAll('.fixed:not(.hidden)[id^="modal-"]')).filter(m => window.getComputedStyle(m).display !== 'none' && m.id !== modalId);\n    if (openModals.length === 0) { document.body.style.overflow = ''; onPrimaryModalVisibilityChange?.(true); }\n    else { document.body.style.overflow = 'hidden'; onPrimaryModalVisibilityChange?.(false); }\n  }\n\n  function initBackHandler() {\n    try { if (!window.history.state || !window.history.state[historyBase.key]) window.history.replaceState({ [historyBase.key]: historyBase.value ?? true }, ''); } catch {}\n    window.addEventListener('popstate', () => {\n      isPopStateActive = true;\n      const visibleModals = Array.from(document.querySelectorAll('.fixed:not(.hidden)[id^="modal-"]')).filter(m => window.getComputedStyle(m).display !== 'none');\n      if (visibleModals.length) {\n        let targetModalId = null;\n        for (let i=modalHistoryStack.length-1;i>=0;i--) { const id=modalHistoryStack[i], el=document.getElementById(id); if(el&&window.getComputedStyle(el).display!=='none'&&!el.classList.contains('hidden')){targetModalId=id;break;} }\n        if (!targetModalId) { const picker=visibleModals.find(m=>nestedPickerModals.has(m.id)); targetModalId=picker?picker.id:visibleModals[visibleModals.length-1].id; }\n        if (targetModalId) { closeModal(targetModalId,true); isPopStateActive=false; return; }\n      }\n      isPopStateActive=false;\n    });\n  }\n  window.openModal=openModal; window.closeModal=closeModal;\n  return { openModal, closeModal, initBackHandler };\n}\n`;
fs.writeFileSync('js/utils/modalController.js',modalModule);

function transform(file,kind){
  let src=fs.readFileSync(file,'utf8');
  const imports=`import { showToast } from './utils/toast.js';\nimport { createModalController } from './utils/modalController.js';\n`;
  src=imports+src;
  src=removeFunction(src,'showToast');
  src=src.replace(/\nlet lastToastKey = '';\nlet lastToastTime = 0;\n/,'\n');
  for(const name of ['openModal','closeModal','initBackHandler']) src=removeFunction(src,name);
  src=src.replace(/\nconst modalHistoryStack = \[\];\nlet isPopStateActive = false;\n/,'\n');
  src=src.replace(/\nwindow\.openModal = openModal;\nwindow\.closeModal = closeModal;\n/,'\n');
  const marker=src.match(/const NESTED_PICKER_MODALS = new Set\([\s\S]*?\);/);
  if(!marker) throw new Error('nested marker missing '+file);
  const historyBase=kind==='app'?"{ key: 'appBase', value: true }":"{ key: 'pageBase', value: 'toko-saya' }";
  const sticky=kind==='app'?"onPrimaryModalVisibilityChange: updateStickyHeaderVisibility,":"";
  const inst=`\nconst { openModal, closeModal, initBackHandler } = createModalController({ nestedPickerModals: NESTED_PICKER_MODALS, refreshIcons, historyBase: ${historyBase}, ${sticky} historyModalKey: 'appModal' });\n`;
  src=src.replace(marker[0],marker[0]+inst);
  return compact(src);
}

fs.writeFileSync(APP,transform(APP,'app'));
fs.writeFileSync(TOKO,transform(TOKO,'toko'));
console.log('transformed');
