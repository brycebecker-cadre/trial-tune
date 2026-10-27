// Converts pdf.js text items into text with Markdown-style tables; shared by the page and the node probe
function pdfPagesToText(pages) {
  const ROW_TOL = 3, CELL_GAP = 9, COL_TOL = 14;
  const norm = s => s.replace(/\d+/g, '#').replace(/\s+/g, ' ').trim();
  const pageRows = pages.map(items => {
    const its = items.filter(i => i.str.trim()).map(i => ({ x: i.transform[4], y: i.transform[5], w: i.width, s: i.str })).sort((a, b) => b.y - a.y || a.x - b.x);
    const rows = [];
    for (const it of its) { const r = rows[rows.length - 1]; if (r && Math.abs(r.y - it.y) <= ROW_TOL) r.items.push(it); else rows.push({ y: it.y, items: [it] }); }
    for (const r of rows) {
      r.items.sort((a, b) => a.x - b.x); r.cells = [];
      for (const it of r.items) { const c = r.cells[r.cells.length - 1]; if (c && it.x - c.end <= CELL_GAP) { c.s += (c.s.endsWith('-') || /^\s/.test(it.s) || c.s.endsWith(' ') ? '' : ' ') + it.s.trim(); c.end = it.x + it.w; } else r.cells.push({ x: it.x, end: it.x + it.w, s: it.s.trim() }); }
    }
    return rows;
  });
  // ── Drop lines repeated on most pages (running header/footer) ──
  const freq = new Map();
  for (const rows of pageRows) for (const k of new Set(rows.map(r => norm(r.cells.map(c => c.s).join(' '))))) freq.set(k, (freq.get(k) || 0) + 1);
  const repeated = k => pages.length >= 3 && (freq.get(k) || 0) >= Math.ceil(pages.length * 0.6);
  // ── A multi-cell row is tabular only when a nearby multi-cell row shares 2+ column positions ──
  const share = (a, b) => a.cells.filter(c => b.cells.some(d => Math.abs(d.x - c.x) <= COL_TOL)).length >= 2;
  for (const rows of pageRows) {
    const multi = rows.filter(r => r.cells.length >= 2);
    for (const r of multi) r.tbl = multi.some(o => o !== r && Math.abs(o.y - r.y) < 130 && share(r, o));
  }
  const gaps = new Map();
  for (const rows of pageRows) for (let k = 1; k < rows.length; k++) { const g = Math.round(rows[k - 1].y - rows[k].y); if (!rows[k].tbl && g > 6 && g < 40) gaps.set(g, (gaps.get(g) || 0) + 1); }
  const lineGap = [...gaps.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 14;
  const blocks = [];
  for (const rows of pageRows) {
    let prev = null;
    for (const r of rows) {
      if (repeated(norm(r.cells.map(c => c.s).join(' ')))) continue;
      const gap = prev ? prev.y - r.y : 99;
      const isTbl = r.tbl;
      // ── Wrapped cell text: tight line gap and every cell aligns with a column of the previous table row ──
      if (prev && prev.table && gap <= lineGap + 1 && r.cells.every(c => prev.cells.some(p => Math.abs(p.x - c.x) <= COL_TOL))) {
        for (const c of r.cells) { const p = prev.cells.find(p => Math.abs(p.x - c.x) <= COL_TOL); p.s += (p.s.endsWith('-') ? '' : ' ') + c.s; }
        prev.y = r.y; continue;
      }
      const row = { y: r.y, table: isTbl, cells: r.cells.map(c => ({ x: c.x, s: c.s })), gap };
      if (!isTbl) row.cells = [{ x: r.cells[0].x, s: r.cells.map(c => c.s).join(' ') }];
      blocks.push(row); prev = row;
    }
    if (prev) prev.pageEnd = true;
  }
  // ── Emit: group consecutive table rows into one table with snapped columns; text rows into paragraphs ──
  const out = []; let i = 0;
  while (i < blocks.length) {
    if (blocks[i].table) {
      const grp = []; while (i < blocks.length && blocks[i].table) grp.push(blocks[i++]);
      const xs = []; for (const r of grp) for (const c of r.cells) { const k = xs.find(x => Math.abs(x - c.x) <= COL_TOL); if (k == null) xs.push(c.x); }
      xs.sort((a, b) => a - b);
      const lines = grp.map(r => { const cells = xs.map(() => ''); for (const c of r.cells) { let bi = 0; for (let j = 1; j < xs.length; j++) if (Math.abs(xs[j] - c.x) < Math.abs(xs[bi] - c.x)) bi = j; cells[bi] = cells[bi] ? cells[bi] + ' ' + c.s : c.s; } return '| ' + cells.join(' | ') + ' |'; });
      out.push(lines.join('\n'));
    } else {
      let para = ''; let last = null;
      while (i < blocks.length && !blocks[i].table) {
        const r = blocks[i]; const s = r.cells[0].s;
        const heading = /^\d+(\.\d+)*\.?\s+[A-Z]/.test(s) && s.length < 80 && !/[-,;]$/.test(s);
        const brk = last && last.pageEnd ? /^[A-Z0-9]/.test(s) && /[.:;]$/.test(para) : r.gap > lineGap + 2;
        if (para && (brk || heading)) { out.push(para); para = ''; }
        para += para ? ((para.endsWith('-') ? '' : ' ') + s) : s; last = r; i++;
        if (heading) { out.push(para); para = ''; }
      }
      if (para) out.push(para);
    }
  }
  return out.join('\n\n');
}
if (typeof module !== 'undefined') module.exports = { pdfPagesToText };
