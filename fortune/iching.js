// 주역 점 — 작괘(시초법 확률 · 동전법 · 직접 입력)와 주희 『역학계몽』 「고변점(考變占)」의 판단 규칙.
const ICHING = (() => {
"use strict";
const BY = {}; ICHING_DATA.forEach(h => BY[h.bits] = h);
const rnd = n => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };
// 시초법(대연지수 49책) 결과의 확률: 6 노음 1/16, 7 소양 5/16, 8 소음 7/16, 9 노양 3/16
function yarrow(){ const r = rnd(16); return r < 1 ? 6 : r < 6 ? 7 : r < 13 ? 8 : 9; }
// 동전법(척전법): 동전 셋, 앞면 3·뒷면 2로 합산 — 6 = 1/8, 7 = 3/8, 8 = 3/8, 9 = 1/8
function coins(){ let s = 0; for (let i = 0; i < 3; i++) s += rnd(2) ? 3 : 2; return s; }
function cast(method){ return Array.from({length:6}, () => method === "coin" ? coins() : yarrow()); } // index 0 = 초효
const lineName = (pos, yang, ko) => ko ? (pos === 0 ? `초${yang ? "구" : "육"}` : pos === 5 ? `상${yang ? "구" : "육"}` : `${yang ? "구" : "육"}${"이삼사오"[pos - 1]}`)
  : (pos === 0 ? `Line 1 (${yang ? "nine" : "six"})` : pos === 5 ? `Top line (${yang ? "nine" : "six"})` : `Line ${pos + 1} (${yang ? "nine" : "six"})`);
// 고변점: which texts to read
function read(vals){
  const bits = vals.map(v => v === 7 || v === 9 ? "1" : "0").join(""), ch = vals.map((v, i) => v === 6 || v === 9 ? i : -1).filter(i => i >= 0);
  const to = vals.map(v => v === 9 ? "0" : v === 6 ? "1" : v === 7 ? "1" : "0").join("");
  const B = BY[bits], Z = ch.length ? BY[to] : null, n = ch.length, R = [];
  const line = (H, i, main) => ({hex:H, kind:"line", i, main});
  const judg = (H, main) => ({hex:H, kind:"judgment", main});
  let rule;
  if (n === 0){ rule = 0; R.push(judg(B, true)); }
  else if (n === 1){ rule = 1; R.push(line(B, ch[0], true)); }
  else if (n === 2){ rule = 2; R.push(line(B, ch[1], true), line(B, ch[0], false)); }
  else if (n === 3){ rule = 3; const own = ch.includes(0); R.push(judg(B, own), judg(Z, !own)); }
  else if (n === 4){ rule = 4; const st = [0,1,2,3,4,5].filter(i => !ch.includes(i)); R.push(line(Z, st[0], true), line(Z, st[1], false)); }
  else if (n === 5){ rule = 5; const st = [0,1,2,3,4,5].find(i => !ch.includes(i)); R.push(line(Z, st, true)); }
  else { rule = 6; if (B.n === 1 || B.n === 2) R.push({hex:B, kind:"use", main:true}); else R.push(judg(Z, true)); }
  return {vals, bits, to, B, Z, changes:ch, rule, texts:R};
}
const RULE = {ko:[
  "변하는 효가 없으면 본괘의 괘사로 점친다. 내괘를 정(貞, 일의 바탕), 외괘를 회(悔, 일의 결과)로 본다.",
  "한 효가 변하면 본괘의 그 변효 효사로 점친다.",
  "두 효가 변하면 본괘의 두 변효 효사로 점치되 위의 효를 위주로 한다.",
  "세 효가 변하면 본괘와 지괘의 괘사로 점친다. 본괘를 정, 지괘를 회로 보며, 초효가 변한 앞의 열 괘는 본괘를, 뒤의 열 괘는 지괘를 위주로 한다.",
  "네 효가 변하면 지괘의 변하지 않은 두 효의 효사로 점치되 아래 효를 위주로 한다.",
  "다섯 효가 변하면 지괘의 변하지 않은 한 효의 효사로 점친다.",
  "여섯 효가 모두 변하면 건·곤은 용구·용육으로, 나머지 괘는 지괘의 괘사로 점친다."],
 en:[
  "No moving lines: read the judgment of the primary hexagram (inner trigram = the matter's ground, outer = its outcome).",
  "One moving line: read that line of the primary hexagram.",
  "Two moving lines: read both lines of the primary hexagram, the upper one as the main.",
  "Three moving lines: read the judgments of both hexagrams; if the bottom line moved, the primary is the main, otherwise the resulting hexagram.",
  "Four moving lines: read the two unchanged lines of the resulting hexagram, the lower one as the main.",
  "Five moving lines: read the one unchanged line of the resulting hexagram.",
  "All six moving: Qian and Kun read 'use nines / use sixes'; others read the judgment of the resulting hexagram."]};
return {cast, read, lineName, RULE, BY, SOURCE:"주희 『역학계몽(易學啓蒙)』 「고변점」"};
})();
