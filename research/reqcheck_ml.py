"""ReqCheck research implementation. Python 3.7 / scikit-learn 0.22 compatible."""
import re
import numpy as np
from scipy.sparse import csr_matrix
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC

VAGUE = ('quickly', 'easy', 'user friendly', 'adequate', 'efficient', 'as soon as possible', 'etc')
class SurfaceFeatures(BaseEstimator, TransformerMixin):
    """Fixed nonnegative features; no corpus statistics fitted outside folds."""
    def __init__(self, group='all'):
        self.group = group
    def fit(self, X, y=None):
        return self
    def transform(self, X):
        rows=[]
        for text in X:
            s=str(text).lower(); words=re.findall(r'\b\w+\b',s); n=max(len(words),1)
            structure=[min(n,100)/100., min(len(s),1000)/1000., min(s.count(',')+s.count(';'),10)/10.]
            modality=[sum(w in ('shall','must','should','may','will') for w in words)/n,
                      sum(w in ('not','never','no') for w in words)/n,
                      sum(w.endswith('ing') for w in words)/n]
            constraints=[sum(bool(re.search(r'\d',w)) for w in words)/n,
                         float(bool(re.search(r'\b(seconds?|minutes?|hours?|milliseconds?|percent|users?)\b|%',s))),
                         sum(term in s for term in VAGUE)/float(len(VAGUE))]
            values={'structure':structure,'modality':modality,'constraints':constraints}
            row=[]
            for name in ('structure','modality','constraints'):
                if self.group == 'all' or self.group != 'without_'+name: row.extend(values[name])
            rows.append(row)
        return csr_matrix(np.asarray(rows,dtype=float))

def make_pipeline(name):
    word=TfidfVectorizer(ngram_range=(1,2),min_df=1,max_features=15000,sublinear_tf=True)
    char=TfidfVectorizer(analyzer='char_wb',ngram_range=(3,5),min_df=1,max_features=20000,sublinear_tf=True)
    if name.startswith('wordchar'):
        feats=FeatureUnion([('word',word),('char',char)])
    elif name.startswith('hybrid') or name.startswith('ablate'):
        group='all' if name.startswith('hybrid') else name.split(':')[1]
        feats=FeatureUnion([('word',word),('surface',SurfaceFeatures(group))])
    else: feats=word
    if name=='word_nb': clf=MultinomialNB(); grid={'clf__alpha':[0.5,1.]}
    elif name.endswith('_lr'): clf=LogisticRegression(solver='liblinear',class_weight='balanced',max_iter=2000,random_state=42); grid={'clf__C':[0.1,1.,10.]}
    else: clf=LinearSVC(class_weight='balanced',random_state=42,max_iter=10000); grid={'clf__C':[0.1,1.,10.]}
    return Pipeline([('features',feats),('clf',clf)]),grid

def normalize(text):
    return re.sub(r'\W+',' ',str(text).lower()).strip()

def ambiguity_flags(text):
    flags=[]
    patterns = [re.escape(term) for term in VAGUE if term not in ('easy', 'user friendly')]
    patterns += [r'easy(?:\s+to\s+use)?', r'user[\s-]+friendly']
    for pattern in patterns:
        for m in re.finditer(r'\b'+pattern+r'\b',text,re.I):
            flags.append({'rule':'VAGUE_TERM','term':m.group(),'start':m.start(),'end':m.end(),
                          'suggestion':'Ask the author to specify a measurable acceptance criterion.'})
    for m in re.finditer(r'\bwhen\s+(?:it|they)\s+(?:is|are)\s+ready\b', text, re.I):
        flags.append({'rule':'UNDEFINED_TRIGGER','term':m.group(),'start':m.start(),'end':m.end(),
                      'suggestion':'Name the actor or object and define the observable readiness condition.'})
    return sorted(flags, key=lambda flag: (flag['start'], flag['end']))
