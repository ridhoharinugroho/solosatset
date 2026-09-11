import { refreshIcons } from "../../utils/runtime.js";

export function renderFormImagePreviews(state) {
  const previewContainer = document.getElementById("image-preview-container"),
    counterBadge = document.getElementById("upload-photo-counter"),
    uploadLabel = document.getElementById("file-upload-label");
  if (!previewContainer) return;
  const count = state.uploadedImages.length;
  if (
    (counterBadge &&
      ((counterBadge.textContent = `${count}/3 Foto (Rasio 1:1)`),
      (counterBadge.className =
        count >= 3
          ? "text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-md"
          : "text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md")),
    0 === count)
  )
    return (
      previewContainer.classList.add("hidden"),
      (previewContainer.innerHTML = ""),
      void (uploadLabel && (uploadLabel.textContent = "Pilih / Tambah Foto dari HP / Komputer (Maks 3)"))
    );
  (previewContainer.classList.remove("hidden"),
    uploadLabel &&
      (uploadLabel.textContent = count < 3 ? `+ Tambah Foto Lagi (${count}/3 Terpilih)` : "Maksimal 3 Foto Terpenuhi"));
  let html = "";
  (state.uploadedImages.forEach((imgUrl, idx) => {
    html += `\n      <div class="relative rounded-2xl overflow-hidden aspect-square bg-slate-100 border-2 border-rose-200 shadow-sm group">\n        <img src="${imgUrl}" alt="Foto ${idx + 1}" class="w-full h-full object-cover">\n        <span class="absolute top-1.5 left-1.5 bg-slate-950/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-xs">\n          ${0 === idx ? "Utama" : `Foto ${idx + 1}`}\n        </span>\n        <button\n          type="button"\n          data-remove-idx="${idx}"\n          class="absolute top-1.5 right-1.5 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-full text-xs shadow-md transition-transform hover:scale-110"\n          title="Hapus foto ini"\n        >\n          <i data-lucide="x" class="w-3.5 h-3.5"></i>\n        </button>\n      </div>\n    `;
  }),
    (previewContainer.innerHTML = html),
    previewContainer.querySelectorAll("[data-remove-idx]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute("data-remove-idx"), 10);
        (state.uploadedImages.splice(idx, 1), renderFormImagePreviews(state), refreshIcons());
      });
    }),
    refreshIcons());
}
