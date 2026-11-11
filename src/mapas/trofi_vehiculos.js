// v36 Trofi-only visual pass: no combat or camera replacements.
function pickup36(color){
 const g=new THREE.Group(),paint=trofiMat(color,{metalness:.55,roughness:.32}),black=trofiMat(0x14171b),glass=trofiMat(0x172c3a,{metalness:.35,roughness:.12}),chrome=trofiMat(0x939da6,{metalness:.85,roughness:.3});
 g.name='Pickup36';
 function prism(points,depth,m,z){const sh=new THREE.Shape();points.forEach((p,i)=>i?sh.lineTo(p[0],p[1]):sh.moveTo(p[0],p[1]));sh.closePath();const geo=new THREE.ExtrudeGeometry(sh,{depth,bevelEnabled:false,steps:1});const o=new THREE.Mesh(geo,m);o.position.z=z;o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
 box(5.2,.25,1.92,black,0,.62,0,g);
 prism([[-2.6,.75],[2.6,.75],[2.6,1.03],[2.35,1.18],[1.2,1.25],[-.9,1.15],[-2.6,1.18]],1.92,paint,-.96);
 // cabin with separate roof, pillars and glazing
 prism([[-.95,1.13],[1.2,1.13],[.75,1.98],[-.7,1.98]],1.78,glass,-.89);
 box(1.53,.09,1.85,paint,.03,2.0,0,g);
 for(const z of [-.92,.92]){
  for(const x of [-.76,.02,.78]){const p=box(.09,.82,.08,paint,x,1.58,z,g);if(x===.78)p.rotation.z=.43;if(x===-.76)p.rotation.z=-.17;}
  box(2.1,.25,.065,paint,.12,1.19,z,g);
  for(const x of [-.45,.48])box(.16,.04,.035,chrome,x,1.31,z*1.025,g,false);
  box(2.3,.08,.19,black,.12,.68,z*1.08,g);
  box(.22,.16,.15,paint,1.01,1.57,z*1.12,g);
 }
 // visibly hollow cargo bed, not a solid box
 box(1.65,.06,1.69,black,-1.75,1.16,0,g);
 for(const z of [-.91,.91])box(1.72,.38,.1,paint,-1.75,1.35,z,g);
 box(.1,.38,1.92,paint,-2.55,1.35,0,g);
 box(.1,.36,1.9,paint,-.92,1.35,0,g);
 for(let x=-2.45;x<-.98;x+=.17)box(.025,.025,1.63,chrome,x,1.2,0,g,false);
 // wheel arches and large tyres
 for(const x of [-1.73,1.64])for(const z of [-1,1]){
  const tire=cyl(.46,.46,.27,black,x,.46,z,g,24);tire.rotation.x=Math.PI/2;
  const rim=cyl(.27,.27,.285,chrome,x,.46,z,g,18);rim.rotation.x=Math.PI/2;
  const hub=cyl(.09,.09,.3,black,x,.46,z,g,12);hub.rotation.x=Math.PI/2;
  const arch=new THREE.Mesh(new THREE.TorusGeometry(.51,.065,8,24,Math.PI),black);arch.position.set(x,.46,z*1.02);g.add(arch);
 }
 box(.15,.17,2.0,chrome,2.62,.79,0,g);box(.14,.14,2.0,chrome,-2.62,.72,0,g);
 box(.04,.35,.91,black,2.63,1.03,0,g);
 for(let y=.92;y<1.18;y+=.07)box(.045,.025,.88,chrome,2.66,y,0,g,false);
 const white=new THREE.MeshBasicMaterial({color:0xfff1d3}),red=new THREE.MeshBasicMaterial({color:0xe93220});
 const tails=[];
 for(const z of [-.72,.72]){box(.06,.16,.39,white,2.63,1.11,z,g,false);box(.04,.25,.12,red,-2.62,1.27,z*.99,g,false);
 const blink=new THREE.Mesh(new THREE.PlaneGeometry(.12,.09),new THREE.MeshBasicMaterial({color:0xffa020,transparent:true,opacity:.8,side:THREE.DoubleSide}));blink.rotation.y=-Math.PI/2;blink.position.set(-2.63,1.36,z);g.add(blink);tails.push(blink);}
 const label=trofiLabel('AMAROKI',1.03,.16,'rgba(0,0,0,0)','#17191d');label.position.set(-2.61,1.4,0);label.rotation.y=-Math.PI/2;g.add(label);
 g.userData={L:5.3,W:2.02,tails};return g;
}
const carBefore36=trofiCar;trofiCar=function(color,kind){return kind==='amarok'?pickup36(color):carBefore36(color,kind);};
trofiAmaroki=function(){return pickup36(0xbac1c5);};
function service36(car,type){car.userData.service36=type;
 for(const z of [-1,1]){const badge=trofiLabel(type==='remis'?'REMIS':'DiDi',.68,.24,type==='remis'?'#18372b':'#ed7425','#ffffff');badge.position.set(-.15,1.04,z*(car.userData.W/2+.018));badge.rotation.y=z>0?0:Math.PI;car.add(badge);}
 if(type==='remis'){box(.52,.14,.25,trofiMat(0xeee8d7),-.12,1.67,0,car,false);const roof=trofiLabel('REMIS',.48,.12,'#eee8d7','#18372b');roof.position.set(-.12,1.67,.14);car.add(roof);}
}
function photo36(){
 const g=new THREE.Group();g.name='Fotografo36';const cloth=trofiMat(0x35434f),pants=trofiMat(0x20242b),skin=trofiMat(0xc68b62);
 for(const x of [-.1,.1]){cyl(.07,.06,.78,pants,x,.42,0,g,8);box(.14,.08,.25,trofiMat(0x15171b),x,.06,.035,g);}
 cyl(.19,.15,.61,cloth,0,1.12,0,g,12);sph(.13,.15,.13,skin,0,1.63,0,g);
 const arms=new THREE.Group();g.add(arms);for(const x of [-.23,.23]){const a=cyl(.055,.045,.42,cloth,x,1.31,.13,arms,8);a.rotation.x=-.65;const b=cyl(.045,.04,.3,skin,x*.65,1.45,.31,arms,8);b.rotation.x=-1.05;}
 const cam=new THREE.Group();cam.position.set(0,1.54,.36);arms.add(cam);box(.26,.17,.12,trofiMat(0x111317),0,0,0,cam);const lens=cyl(.075,.075,.12,trofiMat(0x182e3b,{metalness:.6}),0,0,.1,cam,12);lens.rotation.x=Math.PI/2;
 const flash=new THREE.Mesh(new THREE.PlaneGeometry(.06,.04),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0}));flash.position.set(.08,.065,.064);cam.add(flash);
 g.position.set(-4.5,0,-7.5);return {g,arms,flash,phase:0};
}
const buildBefore36=buildTrofi;buildTrofi=function(){const fresh=!TROFI.built;buildBefore36();if(!fresh)return;
 // keep 3 road cars plus the existing truck; remove unused meshes entirely
 const cars=TROFI.cars.filter(c=>!c.truck),keep=cars.slice(0,3);for(const c of cars.slice(3))c.g.parent.remove(c.g);TROFI.cars=TROFI.cars.filter(c=>c.truck||keep.includes(c));
 keep.forEach((c,i)=>{c.x=-48*c.dir;c.wait=3+i*7;c.vmax=7.5+i*.6;if(i<2)service36(c.g,i===0?'remis':'didi');});
 for(const c of TROFI.cars)if(c.truck)c.wait=24;
 for(const h of TROFI.hiway.slice(6))h.g.parent.remove(h.g);TROFI.hiway=TROFI.hiway.slice(0,6);TROFI.hiway.forEach((h,i)=>h.x=-48+i*16);
 for(const n of TROFI.npcs)if(n.body&&n.body.cfg.patovica){n.body.root.scale.multiply(new THREE.Vector3(1.18,1.12,1.18));n.body.root.name='Patovica36';}
 TROFI.photo36=photo36();TROFI.scene.add(TROFI.photo36.g);
 const sc=TROFI.scene;
 // entrance details: canopy, pillars, planters, floor mat and restrained warm lighting
 const metal=trofiMat(0x242a31,{metalness:.6}),stone=trofiMat(0x42464a),leaf=trofiMat(0x294c34);
 box(4.9,.14,1.2,metal,1.2,3.15,-9.95,sc);box(2.1,.015,1.15,trofiMat(0x252529),1.2,.025,-9.3,sc,false);
 for(const x of [-1.65,4.05]){box(.58,.55,.58,stone,x,.28,-9.65,sc);for(const dx of [-.14,0,.14])sph(.18,.38,.18,leaf,x+dx,.8,-9.65,sc);}
 for(const x of [-.6,1.2,3]){box(.2,.05,.2,new THREE.MeshBasicMaterial({color:0xffd8a4}),x,3.04,-9.65,sc,false);}
 const strip=box(4.6,.035,.035,new THREE.MeshBasicMaterial({color:0xffbe82}),1.2,3.03,-9.38,sc,false);strip.name='Entrada36';
 const sign=trofiLabel('ACCESO  |  FILA',1.6,.23,'#20252b','#e8d6bd');sign.position.set(-1.7,1.7,-10.15);sc.add(sign);
};
const updateBefore36=updateTrofi;updateTrofi=function(dt){
 const pending=TROFI.cars.map(c=>({c,old:c.wait}));updateBefore36(dt);
 for(const p of pending)if(p.old<=0&&p.c.wait>0)p.c.wait=p.c.truck?30+Math.random()*12:9+Math.random()*9;
 const p=TROFI.photo36;if(p){p.phase+=dt;const center=fighters.length?fightCenter():null;if(center)p.g.rotation.y=Math.atan2(center.x-p.g.position.x,center.z-p.g.position.z);p.arms.rotation.x=Math.sin(p.phase*.65)*.025;p.flash.material.opacity=p.phase%6<.065?.95:0;}
};
window.GV36={pickup:pickup36,version:36};

