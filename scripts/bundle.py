import json, re
trials = json.load(open('ctgov/index.json'))
def clean(t): return re.sub(r'[ \t]+', ' ', re.sub(r'\n{3,}', '\n\n', t))
g1 = clean(open('pdfs/download.pdf.txt').read())
g2 = clean(open('pdfs/2025-00237.pdf.txt').read())
g3 = clean(open('pdfs/fda_guidance.pdf.txt').read())
# split guidance into ~1500-char chunks with ids for citation
def chunks(text, src, prefix):
    paras = [p.strip() for p in text.split('\n\n') if len(p.strip()) > 80]
    out, buf = [], ''
    for p in paras:
        if len(buf) + len(p) > 1500 and buf:
            out.append(buf); buf = ''
        buf += p + '\n'
    if buf: out.append(buf)
    return [{'id': f'{prefix}-{i+1}', 'source': src, 'text': c} for i, c in enumerate(out)]
guidance = chunks(g1, 'FDA Draft Guidance (May 2023): Diabetes Mellitus — Efficacy Endpoints for Clinical Trials Investigating Antidiabetic Drugs', 'FDA-T2D') \
         + chunks(g2, 'FDA Notice (2025, Docket FDA-2007-D-0435): Obesity and Overweight — Developing Drugs for Weight Reduction (Draft Guidance)', 'FDA-NOTICE') \
         + chunks(g3, 'FDA Draft Guidance (Jan 2025, Rev. 2): Obesity and Overweight — Developing Drugs and Biological Products for Weight Reduction', 'FDA-OBES')
js = 'window.TRIALS=' + json.dumps(trials, separators=(',',':')) + ';\nwindow.GUIDANCE=' + json.dumps(guidance, separators=(',',':')) + ';\n'
open('data.js', 'w').write(js)
print(len(trials), 'trials', len(guidance), 'guidance chunks', len(js)//1024, 'KB')
