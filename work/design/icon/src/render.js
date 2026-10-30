const sharp=require('sharp');const fs=require('fs');const O='/home/claude/wsm/work/design/icon/';
(async()=>{for(const n of ['opt1','opt2','opt3']){
 const icon=fs.readFileSync(O+n+'_icon.svg');
 for(const s of [512,192,48]) await sharp(icon,{density:72*s/512*4}).resize(s,s).png().toFile(O+`${n}_${s}.png`);
 for(const l of ['fg','bg']) await sharp(fs.readFileSync(O+`${n}_${l}.svg`),{density:144}).resize(432,432).png().toFile(O+`${n}_${l}_432.png`);
}console.log('done')})();
