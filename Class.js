const fs = require("fs");
const fuel = require("aigis-fuel");
const getAssets = require("./getAssets");
const skillMeta = require("./skillMeta.json");
const fileName = "PlayerUnitTable.aar";
const file = fs.readFileSync(`old/${fileName}`);
const oldAL = fuel.parseAL(file).Files[1].Content;
var util = require("util");

function getAbility(value, config) {
  const startIndex = config.Contents.findIndex(v => v._ConfigID === value);
  if (startIndex === -1) {
    throw "No such ConfigID";
  }
  return sliceToNext(config.Contents, "_ConfigID", startIndex).map(v => {
    v._InfluenceTypeName = (
      skillMeta.find(meta => meta.ID === v._InfluenceType) || {
        Description: ""
      }
    ).Description;
    return v;
  });
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
    const newAL = fuel.parseAL(await getAssets(fileName)).Files[1].Content;
    const newConfigAL = fuel.parseAL(await getAssets("AbilityConfig.atb"));
    const oldConfigAL = fuel.parseAL(fs.readFileSync(`old/AbilityConfig.atb`));
    // 分析old和new
    diffs = [];
    oldAL.Contents.forEach((oldContent, index) => {
      const newContent = newAL.Contents.find(
        v => v.ClassID === oldContent.ClassID
      );
      if (!newContent) {
        throw "wired";
      }
      // 比较每一项
      const diff = {
        name: oldContent.Name,
        id: oldContent.ClassID
      };
      let dirty = false;
      Object.keys(oldContent).forEach(key => {
        if (key === "ClassAbility1") {
          oldContent[key] = getAbility(oldContent[key], oldConfigAL);
          newContent[key] = getAbility(newContent[key], newConfigAL);
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
