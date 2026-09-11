const fs = require("fs");
function removeDuplicates(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
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
    "openProductDetail",
    "renderListings",
  ];
  let removedCount = 0;
  for (const func of functionsToRemove) {
    const regex = new RegExp(
      "(?:export\\\\s+)?(?:async\\\\s+)?function\\\\s+" + func + "\\\\s*\\\\([^}]*\\\\)\\\\s*\\\\{",
    );
    const match = content.match(regex);
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
          if (char === '"' || char === "'" || char === "`") {
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
          if (char === "\\\\") {
            i++;
          } else if (char === stringChar) {
            inString = false;
          }
        } else if (inComment) {
          if (char === "\n") {
            inComment = false;
          }
          if (char === "*" && nextChar === "/") {
            inComment = false;
            i++;
          }
        }
      }
      if (endIndex !== -1) {
        content = content.substring(0, startIndex) + content.substring(endIndex + 1);
        console.log("Removed " + func + " from " + filePath);
        removedCount++;
      }
    }
  }
  if (removedCount > 0) fs.writeFileSync(filePath, content, "utf8");
}
removeDuplicates("js/app-main-controller.js");
removeDuplicates("js/toko-saya-controller.js");
