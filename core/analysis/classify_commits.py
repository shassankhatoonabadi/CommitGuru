import argparse
import os
import git
import json
from thefuzz import fuzz
from datetime import datetime

# fuzz matching tolerance
FUZZ_THRESHOLD = 80

HARDCODED_CATEGORIES = {
    "Corrective": [
        "fix", "bug", "wrong", "fail", "problem"
    ],
    "Feature Addition": [
        "new", "add", "requirement", "initial", "create"
    ],
    "Preventative": [
        "test", "junit", "coverage", "assert"
    ],
    "Perfective": [
        "clean", "better"
    ],
    "Non Functional": [
        "doc", "merge"
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
        words = message.lower().split()
        return any(kw in word for word in words for kw in self.keywords)

class Classifier:
    def __init__(self):
        self.categories = [Category(name, kws) for name, kws in HARDCODED_CATEGORIES.items()]

    def classify(self, message):
        for category in self.categories:
            if category.matches(message):
                return category.name
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
    corrective_commits = []

    for commit in commits:
        if len(commit.parents) > 1:
            continue
        message = commit.message.strip()
        classification = classifier.classify(message)

        commit_data = {
            "hash": commit.hexsha,
            "message": message,
            "classification": classification,
            "author_name": commit.author.name,
            "author_email": commit.author.email,
            "authored_date": datetime.utcfromtimestamp(commit.authored_date).isoformat(),
            "committer_name": commit.committer.name,
            "committer_email": commit.committer.email,
            "committed_date": datetime.utcfromtimestamp(commit.committed_date).isoformat(),
            "parent_hashes": [p.hexsha for p in commit.parents]
        }

        results.append(commit_data)

        if classification == "Corrective":
            corrective_commits.append(commit_data)

    return {
        "status": "success",
        "repo_path": repo_path,
        "total_commits": len(results),
        "commits": results,
        "corrective_commits": corrective_commits
    }

def main():
    args = arguments()
    result = classify_commits(args.p)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()