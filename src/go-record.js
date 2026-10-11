export const moves = [["B", "pd"], ["W", "dp"], ["B", "cd"], ["W", "qp"], ["B", "op"], ["W", "oq"], ["B", "nq"], ["W", "pq"], ["B", "cn"], ["W", "fq"], ["B", "mp"], ["W", "qn"], ["B", "ic"], ["W", "dj"], ["B", "po"], ["W", "qo"], ["B", "cp"], ["W", "cq"], ["B", "bq"], ["W", "co"], ["B", "bp"], ["W", "bo"], ["B", "do"], ["W", "bn"], ["B", "dq"], ["W", "ep"], ["B", "dr"], ["W", "cm"], ["B", "jp"], ["W", "cg"], ["B", "ed"], ["W", "qf"], ["B", "qe"], ["W", "pf"], ["B", "nd"], ["W", "pi"], ["B", "oj"], ["W", "oi"], ["B", "nj"], ["W", "mh"], ["B", "gp"], ["W", "gq"], ["B", "dn"], ["W", "dm"], ["B", "fo"], ["W", "hp"], ["B", "ho"], ["W", "eo"], ["B", "en"], ["W", "fn"], ["B", "em"], ["W", "el"], ["B", "fm"], ["W", "gn"], ["B", "fl"], ["W", "go"], ["B", "ek"], ["W", "dk"], ["B", "dl"], ["W", "cl"], ["B", "eh"], ["W", "di"], ["B", "pj"], ["W", "qi"], ["B", "rf"], ["W", "rg"], ["B", "kd"], ["W", "hn"], ["B", "om"], ["W", "re"], ["B", "rd"], ["W", "sf"], ["B", "fi"], ["W", "gk"], ["B", "hm"], ["W", "in"], ["B", "hl"], ["W", "ko"], ["B", "kp"], ["W", "gc"], ["B", "df"], ["W", "id"], ["B", "jc"], ["W", "ge"], ["B", "dg"], ["W", "cf"], ["B", "ch"], ["W", "bh"], ["B", "dh"], ["W", "bi"], ["B", "hd"], ["W", "he"], ["B", "gd"], ["W", "fd"], ["B", "hc"], ["W", "fe"], ["B", "ec"], ["W", "gh"], ["B", "fc"], ["W", "gi"], ["B", "ii"], ["W", "hk"], ["B", "ik"], ["W", "il"], ["B", "im"], ["W", "ij"], ["B", "jl"], ["W", "jj"], ["B", "if"], ["W", "km"], ["B", "kl"], ["W", "lj"], ["B", "lk"], ["W", "lo"], ["B", "li"], ["W", "kj"], ["B", "ci"], ["W", "cj"], ["B", "mj"], ["W", "nr"], ["B", "mr"], ["W", "lq"], ["B", "lp"], ["W", "mq"], ["B", "np"], ["W", "lr"], ["B", "lm"], ["W", "kh"], ["B", "hg"], ["W", "qc"], ["B", "qd"], ["W", "rc"], ["B", "pc"], ["W", "sd"], ["B", "gg"], ["W", "ce"], ["B", "bd"], ["W", "qb"], ["B", "hi"], ["W", "jg"], ["B", "hj"], ["W", "ob"], ["B", "pb"], ["W", "pa"], ["B", "nb"], ["W", "de"], ["B", "ee"], ["W", "gj"], ["B", "hh"], ["W", "ej"], ["B", "nf"], ["W", "mf"], ["B", "me"], ["W", "rk"], ["B", "fh"], ["W", "el"], ["B", "nh"], ["W", "ng"], ["B", "lg"], ["W", "lh"], ["B", "mg"], ["W", "og"], ["B", "kg"], ["W", "ni"], ["B", "jh"], ["W", "na"], ["B", "ki"], ["W", "mi"], ["B", "ji"], ["W", "nc"], ["B", "mb"], ["W", "od"], ["B", "mc"], ["W", "oc"], ["B", "kr"], ["W", "ms"], ["B", "io"], ["W", "ip"], ["B", "jo"], ["W", "jn"], ["B", "ir"], ["W", "hr"], ["B", "ql"], ["W", "rl"], ["B", "qm"], ["W", "rm"], ["B", "ao"], ["W", "bm"], ["B", "ln"], ["W", "kn"], ["B", "mo"], ["W", "be"], ["B", "ae"], ["W", "af"], ["B", "ad"], ["W", "ma"], ["B", "la"], ["W", "oa"], ["B", "dd"], ["W", "bg"], ["B", "lb"], ["W", "pn"], ["B", "on"], ["W", "er"], ["B", "cr"], ["W", "fp"], ["B", "iq"], ["W", "hq"], ["B", "qj"], ["W", "rj"], ["B", "ks"]];
// Replay only the actual main line; remove captured groups after every move.
export function boardAt(moveCount) {
  const board = new Int8Array(361);
  const neighbors = p => [p%19>0?p-1:-1,p%19<18?p+1:-1,p>=19?p-19:-1,p<342?p+19:-1].filter(q=>q>=0);
  function group(start) {
    const seen=new Set([start]), stack=[start]; let liberty=false;
    while(stack.length){const p=stack.pop();for(const q of neighbors(p)){
      if(!board[q])liberty=true;
      else if(board[q]===board[start]&&!seen.has(q)){seen.add(q);stack.push(q);}
    }}
    return {seen,liberty};
  }
  for(const [color,point] of moves.slice(0,Math.max(0,Math.min(moves.length,moveCount)))) {
    if(point.length!==2)continue;
    const x=point.charCodeAt(0)-97,y=point.charCodeAt(1)-97;if(x>18||y>18)continue;
    const p=y*19+x, value=color==='B'?1:2;
    if(board[p])throw new Error('Occupied intersection in record');
    board[p]=value;
    for(const q of neighbors(p))if(board[q]&&board[q]!==value){const g=group(q);if(!g.liberty)for(const r of g.seen)board[r]=0;}
    if(!group(p).liberty)throw new Error('Suicide in record');
  }
  return board;
}
