from sklearn.svm import LinearSVC
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.calibration import CalibratedClassifierCV
import pickle
import os

from ml.training_data import TRAINING_DATA

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'svm_model.pkl')


def get_or_train_model():
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, 'rb') as f:
            return pickle.load(f)

    texts, labels = zip(*TRAINING_DATA)

    # LinearSVC is ~10x faster than SVC(kernel='linear') on large datasets
    # CalibratedClassifierCV wraps it to provide probability estimates
    model = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), stop_words='english',
                                  min_df=2, max_features=50000, sublinear_tf=True)),
        ('svm', CalibratedClassifierCV(LinearSVC(C=1.0, max_iter=2000))),
    ])
    model.fit(texts, labels)

    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(model, f)
    return model


_model = None


CONFIDENCE_THRESHOLD = 0.35  # below this → "Unrelated / General"

def classify_log(text):
    global _model
    if _model is None:
        _model = get_or_train_model()

    try:
        proba = _model.predict_proba([text])[0]
        max_confidence = proba.max()

        if max_confidence < CONFIDENCE_THRESHOLD:
            label = 'Unrelated / General'
        else:
            label = _model.classes_[proba.argmax()]

        from worklogs.models import Category
        category, _ = Category.objects.get_or_create(name=label)
        return category
    except Exception:
        return None


def retrain():
    global _model
    if os.path.exists(MODEL_PATH):
        os.remove(MODEL_PATH)
    _model = None
    return get_or_train_model()
