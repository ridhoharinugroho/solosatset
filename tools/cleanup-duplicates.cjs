const fs = require("fs");
  // eslint-disable-next-line no-unused-vars
const path = require("path");

function removeDuplicates(filePath) {
  let content = fs.readFileSync(filePath, "utf8");

  // Define the functions to remove
  const functionsToRemove = [
    "selectFormCategory",
    "selectFormCondition",
    "selectFormNego",
    "selectFormPaymentMethod",
    "openCreateListingModal",
    "updateCreateListingSellerInfo",
    "populateFormRegions",
    "renderFormImagePreviews",
    "normalizeProfileRegionId",
    "renderProfileRegionPicker",
    "renderProfileDistrictPicker",
    "selectProfileRegion",
    "selectProfileDistrict",
  ];

  let removedCount = 0;
  for (const func of functionsToRemove) {
    const regex1 = new RegExp(`function ${func}\\s*\\([^{]*\\)\\s*\\{`);
    const match = content.match(regex1);

    if (match) {
      const startIndex = match.index;
      let braceCount = 0;
      let endIndex = -1;
      let inString = false;
      let stringChar = null;
      let inComment = false;

      for (let i = startIndex; i < content.length; i++) {
        const char = content[i];
        const nextChar = content[i + 1];

        if (!inComment && !inString) {
          if (char === "/" && nextChar === "/") {
            inComment = true;
            i++;
            continue;
          }
          if (char === "/" && nextChar === "*") {
            inComment = true;
            i++;
            continue;
          }
          if (char === '"' || char === "'" || char === "\`") {
            inString = true;
            stringChar = char;
            continue;
          }
          if (char === "{") {
            braceCount++;
          } else if (char === "}") {
            braceCount--;
            if (braceCount === 0) {
              endIndex = i;
              break;
            }
          }
        } else if (inString) {
          if (char === "\\") {
            i++; // Skip escaped character
          } else if (char === stringChar) {
            inString = false;
          }
        } else if (inComment) {
          if (char === "\n") {
            // End of line comment
            inComment = false; // Actually this is just for // comments, for /* */ we need to check */
          }
          if (char === "*" && nextChar === "/") {
            inComment = false;
            i++;
          }
        }
      }

      if (endIndex !== -1) {
        content = content.substring(0, startIndex) + content.substring(endIndex + 1);
        console.log(`Removed ${func} from ${filePath}`);
        removedCount++;
      }
    }
  }

  // Insert the imports if not present
  if (removedCount > 0) {
    const importListings = `import {
  FORM_CATEGORY_META,
  FORM_CONDITION_META,
  FORM_NEGO_META,
  FORM_PAYMENT_METHOD_META,
  selectFormCategory,
  selectFormCondition,
  selectFormNego,
  selectFormPaymentMethod,
  selectFormRegion,
  selectFormDistrict,
  populateFormRegions
} from "./modules/listings/listingFormPickers.js";
import { openCreateListingModal } from "./modules/listings/listingFormModal.js";
import { renderFormImagePreviews } from "./modules/listings/listingFormImages.js";
`;

    const importProfile = `import {
  normalizeProfileRegionId,
  renderProfileRegionPicker,
  renderProfileDistrictPicker,
  selectProfileRegion,
  selectProfileDistrict
} from "./modules/profile/regionPickers.js";
`;

    if (!content.includes("selectFormCategory } from")) {
      // Find the first import statement and insert there
      const firstImportIndex = content.indexOf("import ");
      if (firstImportIndex !== -1) {
        content = content.slice(0, firstImportIndex) + importListings + importProfile + content.slice(firstImportIndex);
      }
    }
    fs.writeFileSync(filePath, content, "utf8");
  }
}

removeDuplicates("js/app-main-controller.js");
removeDuplicates("js/toko-saya-controller.js");
console.log("Cleanup completed!");
