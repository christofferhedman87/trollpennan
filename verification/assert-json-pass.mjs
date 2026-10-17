import fs from 'node:fs';
const file=process.argv[2]; if(!file) throw new Error('JSON file required');
const data=JSON.parse(fs.readFileSync(file,'utf8')); const rows=data.results??[]; const failed=rows.filter(x=>x.pass!==true);
console.log(JSON.stringify({file,total:rows.length,pass:rows.length-failed.length,fail:failed.length,failed},null,2));
if(!rows.length||failed.length) process.exit(1);
