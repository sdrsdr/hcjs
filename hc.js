let data=require('./data');

// let hcmap=new Map();
//
// function hcenc(s) {
// 	if (s.length==0) return;
// 	if (s.length&1==1) throw new Error("NOT A HEX?! ["+s+"]");
// 	s=s.split('');
// 	let crun='';
//
// }

function feed2hcmap(s,hcmap){
	if (s.length==0) return;
	if (s.length&1==1) throw new Error("NOT A HEX?! ["+s+"]");
	s=s.split('');
	let crun='';
	let i=0;
	while (i<s.length){
		crun=crun+s[i]+s[i+1]; i+=2;
		let cr=hcmap.get(crun);
		//console.log('crun:%s cr:%o',crun,cr);
		if (cr==undefined) {
			hcmap.set(crun,{freq:1,len:crun.length,nte:i+crun.length});
			i-=(crun.length-2);
			crun='';
		} else {
			if (cr.nte<=i) {
				cr.freq++;
				cr.nte=i+cr.len;
			}
		}
	}

}
function calccr(hcmapnew,hcmapknown){
	let best=''; let best_cr=2;
	for (let [crun,cr] of hcmap){
		if (hcmapknown.has(crun)) {
			cr.cr=1.0*(cr.freq)/(cr.len*cr.freq);
		} else {
			cr.cr=1.0*(cr.len+cr.freq)/(cr.len*cr.freq);
		}
		if (cr.cr<best_cr) {
			best=crun;
			best_cr=cr.cr;
		}
		console.log("%s f:%s cr:%s",crun,cr.freq,cr.cr);
	}
	return best;
}

let rawlen=0;
let hcmap=new Map();
let hcmapknown=new Map();
for (let c of data) {
	rawlen+=c.pc.length;
	//console.log('adding code:%s',c.pc);
	feed2hcmap(c.pc,hcmap);
	let best=calccr(hcmap,hcmapknown);
	let cr=hcmap.get(best);
	console.log("\n=====BEST=====\n%s f:%s l:%s cr:%s",best,best.length,cr.freq,cr.cr );
	let parts=c.pc.split(best);
	console.log("parts:%o",parts);
	break;

}



console.log("raw len:"+rawlen+' all code count:'+hcmap.size);
//console.log(fhcmap);
