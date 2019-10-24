function getFileList(path){
    const fileListObj = {};
    const fileListPath = path
    const csvBuffer = await this.downloadAsset(fileListPath);
    const key = 0xea ^ 0x30;
    let csvString = "";
    csvBuffer.forEach(b => (csvString += String.fromCharCode(b ^ key)));
    const csvData = csvString.split("\n");
    csvData.forEach(line => {
      const d = line.split(",");
      if (d[4]) {
        fileListObj[d[4]] = `/${d[0]}/${d[1]}`;
      }
    });
    
}
