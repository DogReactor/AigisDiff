const axios = require("axios").default;
const fs = require("fs");
const fsPromise = require("fs").promises;
const fileList = JSON.parse(fs.readFileSync("./FileList.json"));
module.exports = function getAssets(fileName) {
  const f = fileList.find(v => v.Name === fileName);
  if (!f) {
    throw "No such file";
  }

  if (fs.existsSync(`new/${fileName}`)) {
    return fsPromise.readFile(`new/${fileName}`);
  }

  const reqOption = {
    method: "GET",
    url: f.Link,
    baseURL: "http://assets.millennium-war.net/",
    responseType: "arraybuffer"
  };
  return axios(reqOption).then(v => {
    fs.writeFileSync(`new/${fileName}`, v.data);
    return v.data;
  });
};
