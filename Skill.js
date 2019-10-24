const fs = require("fs");
const fuel = require("aigis-fuel");
const getAssets = require("./getAssets");
const skillMeta = require("./skillMeta.json");
const fileName = "SkillList.atb";
const file = fs.readFileSync(`old/${fileName}`);
const oldAL = fuel.parseAL(file);
var util = require("util");

const type = {
  "AbilityList.atb": "AbilityConfig.atb",
  "SkillList.atb": "SkillTypeList.atb"
};

function getSkillType(value, type, influnce) {
  const InfluenceID = type.Contents.find(v => v.SkillTypeID === value);
  if (!InfluenceID) {
    throw "No such skill type id";
  }
  const startIndex = influnce.Contents.findIndex(
    v => v.Data_ID === InfluenceID.ID_Influence
  );
  if (startIndex === -1) {
    throw "No such InfluenceID";
  }
  return sliceToNext(influnce.Contents, "Data_ID", startIndex).map(v => {
    v.Data_InfluenceTypeName = (
      skillMeta.find(meta => meta.ID === v.Data_InfluenceType) || {
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
    const newAL = fuel.parseAL(await getAssets(fileName));
    const newTypeAL = fuel.parseAL(await getAssets(type[fileName]));
    const newInfluenceAL = fuel.parseAL(
      await getAssets("SkillInfluenceConfig.atb")
    );
    const oldTypeAL = fuel.parseAL(fs.readFileSync(`old/${type[fileName]}`));
    const oldInflunceAl = fuel.parseAL(
      fs.readFileSync(`old/SkillInfluenceConfig.atb`)
    );
    // 分析old和new
    diffs = [];
    oldAL.Contents.forEach((oldContent, index) => {
      const newContent = newAL.Contents[index];
      if (!newContent) {
        throw "wired";
      }
      // 比较每一项
      const diff = {
        name: oldContent.SkillName || oldContent.AbilityName,
        id: index
      };
      let dirty = false;
      Object.keys(oldContent).forEach(key => {
        if (key === "SkillType") {
          oldContent[key] = getSkillType(
            oldContent[key],
            oldTypeAL,
            oldInflunceAl
          );
          newContent[key] = getSkillType(
            newContent[key],
            newTypeAL,
            newInfluenceAL
          );
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
