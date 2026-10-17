import { test } from 'node:test';
import assert from 'node:assert/strict';
import { skapaDialogIsolering } from './dialogIsolering.ts';
class Element {
 constructor(parent=null,inert=false){this.parentElement=parent;this.inert=inert;this.children=[];if(parent)parent.children.push(this);}
}
globalThis.HTMLElement=Element;
function tree(){const body=new Element();globalThis.document={body};const root=new Element(body);const background=new Element(root);const layer=new Element(root);const dialog=new Element(layer);const sibling=new Element(layer);const control=new Element(dialog);return {body,root,background,layer,dialog,sibling,control};}
test('background blocked; dialog ancestors and controls remain active',()=>{
 const t=tree(),s=skapaDialogIsolering();s.isolera(t.dialog);
 assert.equal(t.background.inert,true);assert.equal(t.sibling.inert,true);
 for(const e of [t.body,t.root,t.layer,t.dialog,t.control])assert.equal(e.inert,false);
});
test('restore preserves pre-existing inert values',()=>{
 const t=tree();t.background.inert=true;const s=skapaDialogIsolering();s.isolera(t.dialog);s.aterstall();
 assert.equal(t.background.inert,true);assert.equal(t.sibling.inert,false);s.aterstall();assert.equal(t.background.inert,true);
});
test('nested dialog transition and close restore underlying layer',()=>{
 const t=tree(),s=skapaDialogIsolering();s.isolera(t.dialog);
 const nested=new Element(t.dialog);s.aterstall();s.isolera(nested);
 assert.equal(t.control.inert,true);assert.equal(nested.inert,false);
 s.aterstall();s.isolera(t.dialog);assert.equal(t.control.inert,false);assert.equal(t.background.inert,true);
 s.aterstall();assert.equal(t.background.inert,false);
});
test('new sibling is isolated on next synchronization',()=>{
 const t=tree(),s=skapaDialogIsolering();s.isolera(t.dialog);const added=new Element(t.root);
 s.aterstall();s.isolera(t.dialog);assert.equal(added.inert,true);s.aterstall();assert.equal(added.inert,false);
});
test('React removes inert while the hook is active',()=>{
 const t=tree();t.background.inert=true;const s=skapaDialogIsolering();s.isolera(t.dialog);
 assert.equal(t.background.inert,true);assert.equal(t.sibling.inert,true);
 t.background.inert=false;
 s.aterstall();
 assert.equal(t.background.inert,false);
 assert.equal(t.sibling.inert,false);
});
