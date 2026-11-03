import test from 'node:test';
import assert from 'node:assert/strict';
import {gestureTransform} from '../gestures.js';
const box={x:24,y:24,w:1032,h:826};
const state={zoom:1.5,x:25,y:-40};
test('dragging follows one finger and resumes after a pinch',()=>{
  assert.deepEqual(gestureTransform([{x:200,y:300}],[{x:230,y:280}],state,box),{x:55,y:-60});
  assert.deepEqual(gestureTransform([{x:200,y:300}],[{x:200,y:300}],state,box),{x:25,y:-40});
});
test('pinch keeps the same photo point beneath the moving midpoint',()=>{
  const before=[{x:200,y:300},{x:400,y:300}],after=[{x:150,y:320},{x:550,y:320}];
  const next=gestureTransform(before,after,state,box);
  assert.equal(next.zoom,3);
  assert.equal((300-540-state.x)/state.zoom,(350-540-next.x)/next.zoom);
  assert.equal((300-437-state.y)/state.zoom,(320-437-next.y)/next.zoom);
});
test('zoom limits and coincident pointers stay finite',()=>{
  const before=[{x:200,y:300},{x:400,y:300}];
  for(const after of [[{x:200,y:300},{x:201,y:300}],[{x:-2000,y:300},{x:2000,y:300}]]){
    const next=gestureTransform(before,after,state,box);
    assert.ok(next.zoom>=1&&next.zoom<=3);
    assert.ok(Number.isFinite(next.x)&&Number.isFinite(next.y));
  }
  assert.equal(gestureTransform([{x:0,y:0},{x:0,y:0}],[{x:0,y:0},{x:0,y:0}],state,box).zoom,1.5);
});
