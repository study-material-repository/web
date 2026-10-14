(function(root){
  const months=['january','february','march','april','may','june','july','august','september','october','november','december'];
  function normalize(text){return String(text||'').normalize('NFKD').toLowerCase().replace(/cloudcomputing/g,'cloud computing').replace(/(scs|csc)\s*(\d)/g,'$1 $2').replace(/\bprog\b/g,'programming').replace(/\btech\b/g,'technology').replace(/\borganisations\b/g,'organizations').replace(/\balgorithms\b/g,'algorithm').replace(/\bdatabases\b/g,'database').replace(/\bgames\b/g,'gaming').replace(/[^a-z0-9]+/g,' ').trim();}
  function dateOf(text){
    const value=normalize(text);let m=value.match(/\b(20\d{2}) (\d{1,2}) (\d{1,2})\b/);
    if(m)return [Number(m[1]),Number(m[2]),Number(m[3])];
    m=value.match(/\b(\d{1,2}) ([a-z]+) (20\d{2})\b/);
    if(m){const month=months.findIndex(n=>n===m[2]||n.slice(0,3)===m[2]);if(month>=0)return [Number(m[3]),month+1,Number(m[1])];}
    return null;
  }
  function queries(text){return String(text).split(/[\n\r\uFFFC]+|\s*[-•]\s*(?=[a-zA-Z])/).map(s=>s.trim()).filter(s=>s&&!/^\d(?:st|nd|rd|th)?$/i.test(s));}
  function rank(nodes,text,pathFor){
    const date=dateOf(text), clean=normalize(text);
    const words=clean.split(' ').filter(w=>w&&!/^\d+$/.test(w)&&!months.some(m=>m===w||m.slice(0,3)===w)&&!['and','of','the','for','in'].includes(w));
    const codes=clean.match(/\b(?:scs|csc)\s*(\d{3,4})\b/);
    const numbers=clean.split(' ').filter(w=>/^\d+$/.test(w)&&(!date||!date.includes(Number(w))));
    return nodes.map(node=>{
      const path=pathFor(node), hay=normalize(node.name+' '+path), tokens=hay.split(' '), fileDate=dateOf(node.name);
      let matched=0;words.forEach(w=>{if(tokens.some(t=>t===w||(w.length>=4&&(t.startsWith(w)||w.startsWith(t)))))matched++;});
      const ratio=words.length?matched/words.length:1;
      const codeMatch=!codes||hay.replace(/\s+/g,'').includes(codes[0].replace(/\s+/g,''));
      const dateMatch=!date||(fileDate&&date.every((v,i)=>v===fileDate[i]));
      const numericMatch=numbers.every(n=>tokens.includes(n));
      const exact=ratio===1&&dateMatch&&codeMatch&&numericMatch;
      const score=ratio*60+(date&&dateMatch?35:0)+(codes&&codeMatch?30:0)+(normalize(node.name).includes(clean)?20:0)+(node.kind!=='folder'?2:0);
      return {node,path,score,exact,eligible:ratio>=0.6&&codeMatch&&numericMatch&&(!date||dateMatch)};
    }).filter(x=>x.eligible).sort((a,b)=>b.score-a.score||a.node.name.localeCompare(b.node.name)).slice(0,40);
  }
  root.SmrSearch={normalize,dateOf,queries,rank};
  if(typeof module!=='undefined')module.exports=root.SmrSearch;
})(typeof window!=='undefined'?window:globalThis);
