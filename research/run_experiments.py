"""Nested group CV. Input CSV: requirement_id,project_id,text,label. No GPU."""
import os
os.environ.setdefault('OMP_NUM_THREADS','1')
os.environ.setdefault('OPENBLAS_NUM_THREADS','1')
import argparse,hashlib,json,platform,time,subprocess
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import sklearn, scipy, joblib
from sklearn.model_selection import GroupKFold,GridSearchCV
from sklearn.metrics import f1_score,precision_score,recall_score,accuracy_score,confusion_matrix,classification_report,make_scorer
from reqcheck_ml import make_pipeline,normalize

ALLOWED={'F','A','L','LF','MN','O','PE','SC','SE','US','FT','PO'}
def load_data(path,task):
    d=pd.read_csv(path,dtype=str).fillna('')
    required={'requirement_id','project_id','text','label'}
    if not required.issubset(d.columns): raise ValueError('Required columns: '+','.join(sorted(required)))
    if d.empty or any(d[c].str.strip().eq('').any() for c in required): raise ValueError('Empty dataset or required values')
    if d.requirement_id.duplicated().any(): raise ValueError('requirement_id must be unique')
    d['label']=d.label.str.strip().str.upper()
    if set(d.label)-ALLOWED: raise ValueError('Unknown labels: '+str(set(d.label)-ALLOWED))
    d['normalized']=d.text.map(normalize)
    if d.normalized.eq('').any(): raise ValueError('Blank normalized requirement')
    if d.groupby('normalized').label.nunique().max()>1: raise ValueError('Conflicting duplicate labels: adjudicate before running')
    before=len(d); d=d.drop_duplicates('normalized').copy(); removed_duplicates=before-len(d)
    if task=='binary':d['target']=np.where(d.label=='F','F','NFR')
    else:d=d[d.label!='F'].copy(); d['target']=d.label
    d=d.sort_values(['project_id','requirement_id']).reset_index(drop=True)
    if d.target.nunique()<2:raise ValueError('Task needs at least two classes')
    return d,removed_duplicates,before

def run(args):
    out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
    d,removed_duplicates,original=load_data(args.data,args.task)
    # Keep an exact record of retained rows; no automatic rare-class merging.
    d.to_csv(str(out/'cleaned_data.csv'),index=False)
    labels=sorted(d.target.unique()); X=d.text.values;y=d.target.values;groups=d.project_id.values
    if len(set(groups))<3:raise ValueError('At least 3 distinct projects required for nested group CV')
    outer=list(GroupKFold(n_splits=min(5,len(set(groups)))).split(X,y,groups))
    for tr,te in outer:
        if len(set(y[tr]))<2:raise ValueError('Outer training fold has fewer than 2 classes')
    scorer=make_scorer(f1_score,average='macro',labels=labels,zero_division=0)
    names=['word_nb','word_lr','word_svm','wordchar_lr','wordchar_svm','hybrid_lr','hybrid_svm',
           'ablate:without_structure','ablate:without_modality','ablate:without_constraints']
    if args.quick:names=['word_svm','hybrid_svm']
    results=[];predictions=[];splits=[]
    for fold,(tr,te) in enumerate(outer):
        assert not(set(groups[tr])&set(groups[te]))
        splits.append({'fold':fold,'train_ids':d.iloc[tr].requirement_id.tolist(),'test_ids':d.iloc[te].requirement_id.tolist()})
        inner=list(GroupKFold(n_splits=min(3,len(set(groups[tr])))).split(X[tr],y[tr],groups[tr]))
        for itr,ite in inner:
            if len(set(y[tr][itr]))<2:raise ValueError('Inner training fold has fewer than 2 classes; revise documented protocol')
        for name in names:
            pipe,grid=make_pipeline(name); t=time.perf_counter()
            search=GridSearchCV(pipe,grid,cv=inner,scoring=scorer,n_jobs=1,error_score='raise',refit=True)
            search.fit(X[tr],y[tr]);fit_seconds=time.perf_counter()-t
            t=time.perf_counter();pred=search.predict(X[te]);prediction_seconds=time.perf_counter()-t
            row={'model':name,'fold':fold,'macro_f1':f1_score(y[te],pred,labels=labels,average='macro',zero_division=0),
                 'macro_precision':precision_score(y[te],pred,labels=labels,average='macro',zero_division=0),
                 'macro_recall':recall_score(y[te],pred,labels=labels,average='macro',zero_division=0),
                 'accuracy':accuracy_score(y[te],pred),'fit_seconds':fit_seconds,'predict_seconds':prediction_seconds,
                 'test_n':len(te),'missing_test_classes':','.join(sorted(set(labels)-set(y[te]))),
                 'missing_train_classes':','.join(sorted(set(labels)-set(y[tr]))),'best_params':json.dumps(search.best_params_)}
            results.append(row)
            for idx,p in zip(te,pred):predictions.append({'model':name,'fold':fold,'requirement_id':d.iloc[idx].requirement_id,
                          'project_id':groups[idx],'true':y[idx],'predicted':p})
            print(name,'fold',fold,'macro-F1',round(row['macro_f1'],4),flush=True)
    res=pd.DataFrame(results);res.to_csv(str(out/'fold_metrics.csv'),index=False)
    pp=pd.DataFrame(predictions);pp.to_csv(str(out/'oof_predictions.csv'),index=False)
    summary=res.groupby('model').macro_f1.agg(['mean','std']).sort_values('mean',ascending=False)
    summary.to_csv(str(out/'summary.csv'))
    # OOF metrics and confusion matrices: each retained requirement predicted once per approach.
    pooled=[]
    for name in names:
        z=pp[pp.model==name]
        pooled.append({'model':name,'pooled_macro_f1':f1_score(z.true,z.predicted,labels=labels,average='macro',zero_division=0)})
        report=classification_report(z.true,z.predicted,labels=labels,output_dict=True,zero_division=0)
        (out/(name.replace(':','_')+'_report.json')).write_text(json.dumps(report,indent=2))
        cm=confusion_matrix(z.true,z.predicted,labels=labels)
        fig,ax=plt.subplots(figsize=(max(5,len(labels)*.65),max(4,len(labels)*.55)))
        im=ax.imshow(cm,cmap='Blues');fig.colorbar(im,ax=ax)
        ax.set(xticks=range(len(labels)),yticks=range(len(labels)),xticklabels=labels,yticklabels=labels,xlabel='Predicted',ylabel='Actual',title=name)
        for i in range(len(labels)):
            for j in range(len(labels)):ax.text(j,i,str(cm[i,j]),ha='center',va='center',fontsize=8)
        fig.tight_layout();fig.savefig(str(out/(name.replace(':','_')+'_confusion.png')),dpi=160);plt.close(fig)
    pd.DataFrame(pooled).to_csv(str(out/'pooled_metrics.csv'),index=False)
    fig,ax=plt.subplots(figsize=(10,5));ax.barh(summary.index,summary['mean'],xerr=summary['std'].fillna(0));ax.set(xlim=(0,1),xlabel='Outer-fold macro-F1 (mean +/- SD)',title='Grouped nested cross-validation');fig.tight_layout();fig.savefig(str(out/'comparison.png'),dpi=180);plt.close(fig)
    if {'word_svm','hybrid_svm'}.issubset(names):
        diff=res.pivot(index='fold',columns='model',values='macro_f1');diff['hybrid_minus_word']=diff.hybrid_svm-diff.word_svm
        diff[['word_svm','hybrid_svm','hybrid_minus_word']].to_csv(str(out/'paired_fold_differences.csv'))
    # Deployment selection is exploratory; do not call its maximum CV score an independent final test.
    selected=summary.index[0];pipe,grid=make_pipeline(selected)
    final_cv=list(GroupKFold(n_splits=min(3,len(set(groups)))).split(X,y,groups))
    search=GridSearchCV(pipe,grid,cv=final_cv,scoring=scorer,n_jobs=1,error_score='raise');search.fit(X,y)
    joblib.dump(search.best_estimator_,str(out/'model.joblib'))
    manifest={'status':'DEMONSTRATION_ONLY' if args.demo else 'EXPERIMENT_RUN_REQUIRES_REVIEW',
              'task':args.task,'original_rows':original,'removed_exact_duplicates':removed_duplicates,'task_rows_after_dedup':len(d),'labels':labels,
              'class_counts':d.target.value_counts().to_dict(),'projects':len(set(groups)),'selected_for_deployment':selected,
              'selected_params':search.best_params_,'seed':42,'outer_splits':len(outer),'inner_splits_max':3,
              'dataset_sha256':hashlib.sha256(Path(args.data).read_bytes()).hexdigest(),
              'python':platform.python_version(),'sklearn':sklearn.__version__,'numpy':np.__version__,
              'scipy':scipy.__version__,'pandas':pd.__version__,'matplotlib':matplotlib.__version__,
              'source_sha256':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in [Path(__file__),Path(__file__).with_name('reqcheck_ml.py')]},
              'interpretation':'Fixed global label macro-F1. Absent fold classes count as zero. Inspect support tables. Selected-model score is selection-biased; evaluate externally for a final claim.'}
    (out/'manifest.json').write_text(json.dumps(manifest,indent=2));(out/'splits.json').write_text(json.dumps(splits,indent=2))
    (out/'environment_freeze.txt').write_text(subprocess.check_output([os.sys.executable,'-m','pip','freeze']).decode())
    print(summary.to_string());print('Saved',out)
if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--data',required=True);ap.add_argument('--output',default='results');ap.add_argument('--task',choices=['binary','nfr'],default='binary');ap.add_argument('--quick',action='store_true');ap.add_argument('--demo',action='store_true');run(ap.parse_args())
