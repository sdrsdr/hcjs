'use strict';
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
	for (let [crun,cr] of hcmapnew){
		if (hcmapknown.has(crun)) {
			cr.cr=1.0*(cr.freq)/(cr.len/2*cr.freq);
		} else {
			cr.cr=1.0*(cr.len/2+cr.freq)/(cr.len/2*cr.freq);
		}
		if (cr.cr<best_cr) {
			best=crun;
			best_cr=cr.cr;
		}
		//console.log("%s f:%s cr:%s",crun,cr.freq,cr.cr);
	}
	return best;
}

function findbestcodes(s,hcmap){
	if (s=='') return;
	let kcr=hcmap.get(s);
	if (kcr!=undefined) {
		//console.log("findbestcodes: s:%s hcmap.size:%s direct hit!",s,hcmap.size);
		kcr.freq++;
		kcr.cr=1.0*(kcr.len/2+kcr.freq)/(kcr.len/2*kcr.freq);
		return;
	}
	if (s.length<=6){ //not best at all but we have no better option atm
		//console.log("findbestcodes: s:%s hcmap.size:%s direct miss!",s,hcmap.size);
		kcr={freq:1,len:s.length};
		kcr.cr=1.0*(kcr.len/2+kcr.freq)/(kcr.len/2*kcr.freq);
		kcr.code=hcmap.size;
		hcmap.set(s,kcr);
		return;
	}

	let allcodes=new Map();
	feed2hcmap(s,allcodes);
	let best=calccr(allcodes,hcmap);
	//console.log("findbestcodes: s:%s hcmap.size:%s ac.size:%s best:%s",s,hcmap.size,allcodes.size,best);

	let cr=allcodes.get(best);
	kcr=hcmap.get(best);
	if (kcr==undefined) {
		cr.code=hcmap.size;
		if (cr.nte) delete cr.nte;
		hcmap.set(best,cr);
	} else {
		kcr.freq+=cr.freq;
		kcr.cr=1.0*(kcr.len/2+kcr.freq)/(kcr.len/2*kcr.freq);
	}
	let sstart=0; let bestl=best.length;
	while (s!='') {
		let i=s.indexOf(best,sstart);
		if (i==-1) {
			findbestcodes(s,hcmap);
			break;
		} else if (s==0) {
			s=s.substr(bestl);
		} else if (i&1==1) { //hex can't start here!
			sstart=i+1;
		} else {
			findbestcodes(s.substr(0,i),hcmap);
			sstart=0;
			s=s.substr(i+bestl);
		}
	}

}

function hcencode(s_,hcmap){
	if (s_.length==0) return;
	if (s_.length&1==1) throw new Error("NOT A HEX?! ["+s_+"]");

	findbestcodes(s_,hcmap);
	let partials=new Map;
	for (let [crun/*,cr*/] of hcmap) {
		while (crun.length>2) {
			crun=crun.substr(0,crun.length-2);
			partials.set(crun,true);
		}
	}
	let s=s_;
	let prevbest=false;
	let clen=2;
	let crun='';
	let enc='';
	while (s.length>0 && clen<=s.length){
		crun=s.substr(0,clen); clen+=2;
		let cr=hcmap.get(crun);
		if (cr) prevbest=cr;
		if (partials.has(crun) &&  (clen<=s.length) ) continue;
		if (!prevbest) {
			console.log("===algo err====\n%s\n%o",s_,hcmap);
			throw new Error("Algo ERR?!");
		}
		let cc=prevbest.code.toString(16);
		enc=enc+(cc.length&1==1?'0'+cc:cc);
		if (prevbest.inuse==undefined) prevbest.inuse=true;
		s=s.substr(prevbest.len);
		clen=2;
		prevbest=false;
	}
	if (s!='')  {
		console.log("===algo  err tail:[%s] ====\n%s\n%o",s,s_,hcmap);
		throw new Error("Algo ERR?!");
	}
	return enc;
}


{//isolate
	let rawlen=0;
	let enclen=0;
	let hcmap=new Map();
	for (let c of data) {
		rawlen+=c.pc.length/2;
		let enc=hcencode(c.pc,hcmap);
		enclen+=enc.length/2;

	}
	let tsize=hcmap.size;
	for (let [crun/*,cr*/] of hcmap) {
		tsize+=crun.length/2;
	}
	let bitshave=0; let maxcode=hcmap.size-1;
	while ((maxcode & 0x080)==0) {
		bitshave++; maxcode=maxcode<<1;
	}

	console.log("raw len:%s enclen:%s(%s) tsize:%s  codes count:%s cr:%s(%s)",rawlen,enclen,(enclen*bitshave/8),tsize,hcmap.size,(enclen+tsize)/rawlen,(enclen*bitshave/8+tsize)/rawlen);
	//console.log(hcmap);

}//isolate
