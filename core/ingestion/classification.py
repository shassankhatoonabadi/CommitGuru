import argparse
import os
import git
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

HARDCODED_CATEGORIES = {
    "Corrective": [
        "fix", "bug", "error", "issue", "crash", "fail", "problem", "resolve", "patch", "repair", "defect", "broken", "debug"
    ],
    "Feature Addition": [
        "add", "feature", "implement", "initial", "new", "create", "introduce", "build", "enable", "extend", "support"
    ],
    "Preventative": [
        "test", "testing", "unittest", "junit", "coverage", "assert", "verify", "safety", "validation", "check"
    ],
    "Perfective": [
        "clean", "refactor", "improve", "enhance", "optimize", "better", "rewrite", "update", "restructure", "tidy"
    ],
    "Non Functional": [
        "doc", "documentation", "readme", "comment", "note", "merge", "changelog", "format", "license"
    ]
}

def arguments():
    parser = argparse.ArgumentParser(description="Classify Git commits based on message content.")
    parser.add_argument("-p", required=True, type=str, help="Path to local Git repository")
    return parser.parse_args()

class Category:
    def __init__(self, name, keywords):
        self.name = name
        self.keywords = [kw.lower() for kw in keywords]

    def matches(self, message):
        msg = message.lower()
        return any(fuzz.partial_ratio(kw, msg) >= FUZZ_THRESHOLD for kw in self.keywords)

class Classifier:
    def __init__(self):
        self.categories = [Category(name, kws) for name, kws in HARDCODED_CATEGORIES.items()]

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