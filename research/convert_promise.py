"""Convert original PROMISE three-column ARFF without scipy's string-ARFF limitation."""
import re,csv,argparse
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('source');p.add_argument('destination');p.add_argument('--encoding',default='utf-8-sig');a=p.parse_args()
rows=[];data=False
for number,line in enumerate(Path(a.source).read_text(encoding=a.encoding).splitlines(),1):
    s=line.strip()
    if s.lower()=='@data':data=True;continue
    if not data or not s or s.startswith('%'):continue
    m=re.match(r'''^(\d+)\s*,\s*(['"])(.*)\2\s*,\s*([A-Za-z]+)\s*(?:%.*)?$''',s)
    if not m:raise ValueError('Unsupported ARFF row %d; inspect manually rather than skipping it'%number)
    rows.append({'requirement_id':'PROMISE-%04d'%(len(rows)+1),'project_id':m.group(1),'text':m.group(3).replace("\\'", "'"),'label':m.group(4).upper()})
if not rows:raise ValueError('No data rows')
with open(a.destination,'w',newline='',encoding='utf-8') as f:
    w=csv.DictWriter(f,fieldnames=['requirement_id','project_id','text','label']);w.writeheader();w.writerows(rows)
print('Converted',len(rows),'rows. Verify counts and acknowledge the original dataset authors.')
