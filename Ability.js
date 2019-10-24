const fs = require("fs");
const fuel = require("aigis-fuel");
const getAssets = require("./getAssets");
const skillMeta = require("./skillMeta.json");
const fileName = "AbilityList.atb";
const file = fs.readFileSync(`old/${fileName}`);
const oldAL = fuel.parseAL(file);
var util = require("util");

function getAbility(value, config) {
  const startIndex = config.Contents.findIndex(v => v._ConfigID === value);
  if (startIndex === -1) {
    throw "No such ConfigID" + value;
  }
  return sliceToNext(config.Contents, "_ConfigID", startIndex);
}
function sliceToNext(a, key, startIndex) {
  let index = startIndex;
  while (true) {
    index++;
    if (index === a.length) {
      return a.slice(startIndex, index);
    }
    if (a[index][key] !== 0) {
      return a.slice(startIndex, index);
    }
  }
}
function compare(a, b) {
  if (a.length !== b.length) {
    return true;
  }
  a.forEach((v, i) => {
    const bv = b[i];
    Object.keys(v).forEach(key => {
      if (v[key] !== bv[key]) {
        return true;
      }
    });
  });
  return false;
}
// Skill
try {
  (async function() {
    const newAL = fuel.parseAL(await getAssets(fileName));
    const newConfigAL = fuel.parseAL(await getAssets("AbilityConfig.atb"));
    const oldConfigAL = fuel.parseAL(fs.readFileSync(`old/AbilityConfig.atb`));
    // 分析old和new
    diffs = [];
    oldAL.Contents.forEach((oldContent, index) => {
      const newContent = newAL.Contents.find(
        v => v.AbilityID === oldContent.AbilityID
      );
      if (!newContent) {
        throw "wired";
      }
      // 比较每一项
      const diff = {
        name: oldContent.AbilityName,
        id: oldContent.AbilityID
      };
      let dirty = false;
      Object.keys(oldContent).forEach(key => {
        if (key === "_ConfigID") {
          try {
            oldContent[key] = getAbility(oldContent[key], oldConfigAL);
            newContent[key] = getAbility(newContent[key], newConfigAL);
          } catch (err) {
            console.log(err, oldContent, newContent);
          }

          if (compare(oldContent[key], newContent[key])) {
            diff[key] = [oldContent[key], newContent[key]];
            dirty = true;
          }
        } else {
          if (oldContent[key] !== newContent[key]) {
            diff[key] = [oldContent[key], newContent[key]];
            dirty = true;
          }
        }
      });
      if (dirty) {
        diffs.push(diff);
        //   console.log(newContent);
      }
    });
    console.log(diffs);
  })();
} catch (err) {
  console.log(err);
}
