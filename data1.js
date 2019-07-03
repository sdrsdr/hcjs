let fs=require('fs');
let data=fs.readFileSync("data.js.hex",{encoding:"utf8"});
module.exports=[{pc:data}]
