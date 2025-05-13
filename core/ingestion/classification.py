import argparse
import os
import git
import csv
import json
from thefuzz import fuzz

CATEGORY_PRIORITY = [
    "Corrective",
    "Feature Addition",
    "Preventative",
    "Perfective",
    "Non Functional"
]

# fuzz matching tolerance
# the higher the number, the more tolerant the match
# 100 means exact match
FUZZ_THRESHOLD = 80

def arguments():
    parser = argparse.ArgumentParser(description="Classify Git commits based on message content.")
    parser.add_argument("-p", required=True, type=str, help="Path to local Git repository")
    return parser.parse_args()

class Category:
    def __init__(self, file_path, name):
        self.name = name
        self.keywords = self._load_keywords(file_path)

    def _load_keywords(self, file_path):
        keywords = set()
        with open(file_path, "r") as f:
            reader = csv.reader(f)
            for row in reader:
                for word in row:
                    keywords.add(word.strip().lower())
        return keywords

    def matches(self, message):
        msg = message.lower()
        return any(fuzz.partial_ratio(kw, msg) >= FUZZ_THRESHOLD for kw in self.keywords)

class Classifier:
    def __init__(self, category_dir=os.path.join(os.path.dirname(__file__), "..", "categories")):
        self.categories = []
        self.load_categories(category_dir)

    def load_categories(self, directory):
        self.categories = [
            Category(os.path.join(directory, "corrective.csv"), "Corrective"),
            Category(os.path.join(directory, "feature_addition.csv"), "Feature Addition"),
            Category(os.path.join(directory, "preventative.csv"), "Preventative"),
            Category(os.path.join(directory, "perfective.csv"), "Perfective"),
            Category(os.path.join(directory, "non_functional.csv"), "Non Functional")
        ]

    def classify(self, message):
        matches = []
        for category in self.categories:
            if category.matches(message):
                matches.append(category.name)

        for priority in CATEGORY_PRIORITY:
            if priority in matches:
                return priority
        return "None"

def classify_commits(repo_path):
    if not os.path.isdir(repo_path):
        return {
            "status": "error",
            "message": f"Invalid path: {repo_path}",
            "commits": []
        }

    try:
        repo = git.Repo(repo_path)
    except git.exc.InvalidGitRepositoryError:
        return {
            "status": "error",
            "message": "Not a valid Git repository",
            "commits": []
        }

    commits = list(repo.iter_commits('HEAD', reverse=True))
    classifier = Classifier()
    results = []

    for commit in commits:
        message = commit.message.strip()
        classification = classifier.classify(message)
        results.append({
            "hash": commit.hexsha,
            "message": message,
            "classification": classification
        })

    return {
        "status": "success",
        "repo_path": repo_path,
        "total_commits": len(results),
        "commits": results
    }

def main():
    args = arguments()
    result = classify_commits(args.p)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()