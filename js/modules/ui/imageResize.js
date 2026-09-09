import { refreshIcons } from '../../utils/runtime.js';
import { getSiteSettings, saveSiteSettings } from '../../services/storage.js';

export function applyDetailImageSettings(customSettings = null) {
  try {
    const settings = customSettings || (typeof window.state !== 'undefined' && window.state.siteSettings) || getSiteSettings();

    const frameEl = document.getElementById('detail-photo-frame');
    const imgEl = document.getElementById('detail-image');
    if (!frameEl || !imgEl) return;

    const sizeMode = settings.detailImageSize || 'square';
    const aspectMode = settings.detailImageAspect || 'aspect-square';
    const objectFitMode = settings.detailImageFit || 'object-cover';

    let aspectClass = 'aspect-square';
    if (aspectMode === 'aspect-[4/3]') aspectClass = 'aspect-[4/3]';
    else if (aspectMode === 'aspect-[16/9]') aspectClass = 'aspect-[16/9]';
    else if (aspectMode === 'aspect-auto') aspectClass = 'aspect-auto min-h-[220px] max-h-[460px]';
    else aspectClass = 'aspect-square';

    let maxWClass = 'max-w-md mx-auto';
    if (sizeMode === 'small') maxWClass = 'max-w-xs mx-auto';
    else if (sizeMode === 'large') maxWClass = 'max-w-xl mx-auto';
    else if (sizeMode === 'full') maxWClass = 'w-full';
    else maxWClass = 'max-w-md mx-auto';

    frameEl.className = `relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-md ${aspectClass} ${maxWClass} transition-all duration-300`;

    let fitClass = 'object-cover';
    if (objectFitMode === 'object-contain') fitClass = 'object-contain bg-slate-950 p-1';
    else if (objectFitMode === 'object-fill') fitClass = 'object-fill';
    else fitClass = 'object-cover';

    imgEl.className = `w-full h-full ${fitClass} transition-all duration-300 cursor-pointer hover:scale-[1.02]`;
  } catch (e) {
    console.warn('[applyDetailImageSettings error]', e);
  }
}

export function initDetailImageResizeControls() {
  try {
    const settings = (typeof window.state !== 'undefined' && window.state.siteSettings) || getSiteSettings();

    const sizeBtns = document.querySelectorAll('.btn-admin-detail-size');
    sizeBtns.forEach(btn => {
      const val = btn.getAttribute('data-size');
      if (val === (settings.detailImageSize || 'square')) {
        btn.classList.add('bg-rose-900', 'text-white');
        btn.classList.remove('bg-slate-800', 'text-slate-300');
      } else {
        btn.classList.remove('bg-rose-900', 'text-white');
        btn.classList.add('bg-slate-800', 'text-slate-300');
      }
      btn.onclick = () => {
        if (!typeof window.state !== 'undefined' && window.state.siteSettings) {
          window.state.siteSettings.detailImageSize = val;
        }
        saveSiteSettings({ detailImageSize: val });
        applyDetailImageSettings();
        initDetailImageResizeControls();
      };
    });

    const aspectBtns = document.querySelectorAll('.btn-admin-detail-aspect');
    aspectBtns.forEach(btn => {
      const val = btn.getAttribute('data-aspect');
      if (val === (settings.detailImageAspect || 'aspect-square')) {
        btn.classList.add('bg-rose-900', 'text-white');
        btn.classList.remove('bg-slate-800', 'text-slate-300');
      } else {
        btn.classList.remove('bg-rose-900', 'text-white');
        btn.classList.add('bg-slate-800', 'text-slate-300');
      }
      btn.onclick = () => {
        if (typeof window.state !== 'undefined' && window.state.siteSettings) {
          window.state.siteSettings.detailImageAspect = val;
        }
        saveSiteSettings({ detailImageAspect: val });
        applyDetailImageSettings();
        initDetailImageResizeControls();
      };
    });

    const fitBtns = document.querySelectorAll('.btn-admin-detail-fit');
    fitBtns.forEach(btn => {
      const val = btn.getAttribute('data-fit');
      if (val === (settings.detailImageFit || 'object-cover')) {
        btn.classList.add('bg-rose-900', 'text-white');
        btn.classList.remove('bg-slate-800', 'text-slate-300');
      } else {
        btn.classList.remove('bg-rose-900', 'text-white');
        btn.classList.add('bg-slate-800', 'text-slate-300');
      }
      btn.onclick = () => {
        if (typeof window.state !== 'undefined' && window.state.siteSettings) {
          window.state.siteSettings.detailImageFit = val;
        }
        saveSiteSettings({ detailImageFit: val });
        applyDetailImageSettings();
        initDetailImageResizeControls();
      };
    });
  } catch (e) {
    console.warn('[initDetailImageResizeControls error]', e);
  }
}

if (typeof window !== 'undefined') {
  window.applyDetailImageSettings = applyDetailImageSettings;
  window.initDetailImageResizeControls = initDetailImageResizeControls;
}
