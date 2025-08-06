import argparse
import os
import git
import json
from datetime import datetime

def arguments():
    parser = argparse.ArgumentParser(description="Extract commit metadata from a Git repository.")
    parser.add_argument("-p", required=True, type=str, help="Path to local Git repository")
    return parser.parse_args()

def extract_commits(repo_path):
    if not os.path.isdir(repo_path):
        return {
            "status": "error",
            "message": f"Provided path does not exist: {repo_path}",
            "commits": []
        }

    try:
        repo = git.Repo(repo_path)
    except git.exc.InvalidGitRepositoryError:
        return {
            "status": "error",
            "message": f"Not a valid Git repository: {repo_path}",
            "commits": []
        }

    commits = list(repo.iter_commits('HEAD', reverse=True))
    result = []

    for commit in commits:
        # Collect stats (numstat equivalent)
        stats = commit.stats
        total = stats.total
        files_changed = list(stats.files.keys())
        insertions = total.get("insertions", 0)
        deletions = total.get("deletions", 0)

        commit_data = {
            "hash": commit.hexsha,
            "author_name": commit.author.name,
            "author_email": commit.author.email,
            "authored_date": datetime.utcfromtimestamp(commit.authored_date).isoformat(),
            "committer_name": commit.committer.name,
            "committer_email": commit.committer.email,
            "committed_date": datetime.utcfromtimestamp(commit.committed_date).isoformat(),
            "message": commit.message.strip(),
            "parent_hashes": [p.hexsha for p in commit.parents],
            "is_merge": len(commit.parents) > 1,
            "files_changed": files_changed,
            "lines_added": insertions,
            "lines_deleted": deletions
        }

        result.append(commit_data)

    return {
        "status": "success",
        "path": repo_path,
        "total_commits": len(result),
        "commits": result
    }

def main():
    args = arguments()
    output = extract_commits(args.p)
    print(json.dumps(output, indent=2))

if __name__ == "__main__":
    main()