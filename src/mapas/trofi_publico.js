// Background characters only: not attack targets or traffic occupants.
const buildBefore38=buildTrofi;
buildTrofi=function(){const fresh=!TROFI.built;buildBefore38();if(!fresh)return;
 const resting=person37(0x735d82);resting.g.name='Descansando38';resting.g.rotation.z=-Math.PI/2;resting.g.position.set(-18,.22,-8);resting.legs[0].rotation.x=.3;resting.arms[0].rotation.x=-.7;TROFI.scene.add(resting.g);
 const cup=cyl(.045,.035,.12,trofiMat(0xe8e1c8),-17.5,.08,-7.65,TROFI.scene,8);
 T37.resting38=resting;
 const group=new THREE.Group();group.name='GrupoAmaroki38';const truck=TROFI.amaroki;truck.updateMatrixWorld(true);
 for(let i=0;i<3;i++){const p=person37([0xeee7d7,0x5a758f,0x9c5962][i]);p.g.position.set((i-1)*.7,0,0);p.arms[0].rotation.x=-1.1;const phone=box(.08,.14,.025,trofiMat(0x171a20),-.23,1.6,.15,p.g,false);group.add(p.g);}
 group.position.copy(truck.position);group.position.z+=2.3;TROFI.scene.add(group);T37.group38=group;
};
const updateBefore38=updateTrofi;updateTrofi=function(dt){updateBefore38(dt);if(T37.resting38)T37.resting38.arms[0].rotation.x=-.7+Math.sin(TROFI.t*.5)*.025;if(T37.group38)T37.group38.children.forEach((p,i)=>p.rotation.y=Math.sin(TROFI.t*.3+i)*.15);};

