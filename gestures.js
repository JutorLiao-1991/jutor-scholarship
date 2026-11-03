// Work in poster coordinates so touch and mouse movement match the export.
export function gestureTransform(previous,current,state,box) {
  if(previous.length!==current.length || !current.length)return {};
  if(current.length===1)return {x:state.x+current[0].x-previous[0].x,y:state.y+current[0].y-previous[0].y};
  const middle=points=>({x:(points[0].x+points[1].x)/2,y:(points[0].y+points[1].y)/2});
  const distance=points=>Math.hypot(points[1].x-points[0].x,points[1].y-points[0].y);
  const before=middle(previous),after=middle(current),d=distance(previous);
  const zoom=Math.min(3,Math.max(1,state.zoom*(d>0?distance(current)/d:1)));
  const ratio=zoom/state.zoom,cx=box.x+box.w/2,cy=box.y+box.h/2;
  return {zoom,x:after.x-cx-(before.x-cx-state.x)*ratio,y:after.y-cy-(before.y-cy-state.y)*ratio};
}
