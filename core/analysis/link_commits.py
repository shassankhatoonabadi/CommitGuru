import argparse
import os
import subprocess
import git
import json
from classify_commits import Classifier


def arguments():
    parser = argparse.ArgumentParser(description="Link bug-inducing commits to fixes.")
    parser.add_argument("-p", required=True, type=str, help="Path to local Git repository")
    return parser.parse_args()

def get_corrective_commits(repo):
    classifier = Classifier()
    corrective = []
    all_commits = list(repo.iter_commits('HEAD', reverse=True))
    for commit in all_commits:
        classification = classifier.classify(commit.message)
        if classification == "Corrective":
            corrective.append(commit)
    return corrective, all_commits

def get_modified_regions(commit, repo_path):
    if not commit.parents:
        # Handle initial commit, diff against empty tree
        diff_cmd = f"git diff {commit.hexsha} --unified=0"
    else:
        diff_cmd = f"git diff {commit.hexsha}^ {commit.hexsha} --unified=0"
    
    try:
        diff = subprocess.check_output(diff_cmd, shell=True, cwd=repo_path, executable="/bin/bash")
    except subprocess.CalledProcessError:
        return {}

    diff = diff.decode("utf-8")
    region_diff = {}
    current_file = None

    for line in diff.splitlines():
        if line.startswith("diff --git"):
            parts = line.split(" b/")
            if len(parts) > 1:
                current_file = parts[1]
                region_diff[current_file] = []
        elif line.startswith("@@") and current_file:
            parts = line.split("@@")
            if len(parts) > 1:
                location_info = parts[1].strip().split(" ")
                for token in location_info:
                    if token.startswith("+"):
                        try:
                            if "," in token:
                                start_line, count = map(int, token[1:].split(","))
                                region_diff[current_file].extend([str(i) for i in range(start_line, start_line + count)])
                            else:
                                region_diff[current_file].append(str(int(token[1:])))
                        except ValueError:
                            continue
    return region_diff


def get_bug_inducing_commits(corrective_commit, all_commits, repo_path):
    buggy_commits = set()
    corrective_regions = get_modified_regions(corrective_commit, repo_path)
    corrective_time = corrective_commit.committed_date

    for commit in all_commits:
        if commit.committed_date >= corrective_time:
            break

        commit_regions = get_modified_regions(commit, repo_path)
        for file, lines_fixed in corrective_regions.items():
            if file in commit_regions:
                lines_buggy = commit_regions[file]
                # Check if there's an intersection of modified lines
                if set(lines_fixed).intersection(lines_buggy):
                    buggy_commits.add(commit.hexsha)
                    break

    return list(buggy_commits), corrective_regions

def link_corrective_commits(repo_path):
    if not os.path.isdir(repo_path):
        return {
            "status": "error",
            "message": f"Invalid repo path: {repo_path}"
        }

    try:
        repo = git.Repo(repo_path)
    except git.exc.InvalidGitRepositoryError:
        return {
            "status": "error",
            "message": "Not a valid Git repository"
        }

    corrective_commits, all_commits = get_corrective_commits(repo)
    links = []
    for corrective in corrective_commits:
        linked, modified_regions = get_bug_inducing_commits(corrective, all_commits, repo_path)
        links.append({
            "fix_commit": corrective.hexsha,
            "linked_to": linked,
            "modified_regions": modified_regions
        })

    return {
        "status": "success",
        "repo_path": repo_path,
        "linked_commits": links,
        "total_fix_commits": len(corrective_commits)
    }


def main():
    args = arguments()
    result = link_corrective_commits(args.p)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()