"""Evaluate an untouched external CSV once after freezing the model and protocol."""
import argparse,json,hashlib
from pathlib import Path
import joblib
from sklearn.metrics import classification_report,confusion_matrix
from run_experiments import load_data
p=argparse.ArgumentParser();p.add_argument('--model',required=True);p.add_argument('--data',required=True);p.add_argument('--task',choices=['binary','nfr'],default='binary');p.add_argument('--output',required=True);a=p.parse_args()
m=joblib.load(a.model);d,_,_=load_data(a.data,a.task);pred=m.predict(d.text.values)
# Explicitly include unseen external labels; report class coverage rather than silently dropping them.
labels=sorted(set(d.target)|set(m.classes_));out=Path(a.output);out.mkdir(parents=True,exist_ok=True)
report=classification_report(d.target,pred,labels=labels,output_dict=True,zero_division=0)
report['dataset_sha256']=hashlib.sha256(Path(a.data).read_bytes()).hexdigest();report['model_sha256']=hashlib.sha256(Path(a.model).read_bytes()).hexdigest()
(out/'external_report.json').write_text(json.dumps(report,indent=2));d['predicted']=pred;d.to_csv(str(out/'external_predictions.csv'),index=False)
print(json.dumps(report,indent=2))
