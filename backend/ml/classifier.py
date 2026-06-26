from sklearn.svm import LinearSVC
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import pickle
import json
import os


MODEL_PATH  = os.path.join(os.path.dirname(__file__), 'svm_model.pkl')
REPORT_PATH = os.path.join(os.path.dirname(__file__), 'svm_eval_report.json')


def get_or_train_model():
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, 'rb') as f:
            return pickle.load(f)

    from ml.training_data import generate_training_data
    texts, labels = zip(*generate_training_data())

    # 80 / 20 train-test split — stratified so every category gets equal representation
    X_train, X_test, y_train, y_test = train_test_split(
        texts, labels, test_size=0.2, random_state=42, stratify=labels
    )

    # LinearSVC is ~10x faster than SVC(kernel='linear') on large datasets
    # CalibratedClassifierCV wraps it to provide probability estimates
    model = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), stop_words='english',
                                  min_df=2, max_features=50000, sublinear_tf=True)),
        ('svm', CalibratedClassifierCV(LinearSVC(C=1.0, max_iter=2000))),
    ])
    model.fit(X_train, y_train)

    # Evaluate on the held-out test set and save the report
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, output_dict=True)

    eval_data = {
        'accuracy': round(accuracy, 4),
        'test_size': len(X_test),
        'train_size': len(X_train),
        'per_category': {
            label: {
                'precision': round(report.get(label, {}).get('precision', 0), 3),
                'recall':    round(report.get(label, {}).get('recall',    0), 3),
                'f1_score':  round(report.get(label, {}).get('f1-score',  0), 3),
                'support':   report.get(label, {}).get('support', 0),
            }
            for label in model.classes_
        },
        'macro_avg': {
            'precision': round(report['macro avg']['precision'], 3),
            'recall':    round(report['macro avg']['recall'],    3),
            'f1_score':  round(report['macro avg']['f1-score'],  3),
        },
    }

    with open(REPORT_PATH, 'w') as f:
        json.dump(eval_data, f, indent=2)

    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(model, f)

    return model


def get_eval_report():
    """Return the saved evaluation report, or None if model hasn't been trained yet."""
    if not os.path.exists(REPORT_PATH):
        return None
    with open(REPORT_PATH) as f:
        return json.load(f)


_model = None


CONFIDENCE_THRESHOLD = 0.35  # below this → "Unrelated / General"

def classify_log(text):
    global _model
    if _model is None:
        _model = get_or_train_model()

    try:
        from ml.preprocess import preprocess
        text = preprocess(text)
        if not text.strip():
            from worklogs.models import Category
            cat, _ = Category.objects.get_or_create(name='Unrelated / General')
            return cat

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
