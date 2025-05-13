import argparse
import os
import git
import json
import math
from datetime import datetime

class CommitFile:
    def __init__(self, name, loc, authors, lastchanged):
        self.name = name
        self.loc = loc
        self.authors = authors
        self.lastchanged = lastchanged
        self.nuc = 1

def arguments():
    parser = argparse.ArgumentParser(description="Compute commit-level metrics.")
    parser.add_argument("-p", required=True, type=str, help="Path to local Git repository")
    return parser.parse_args()

def compute_metrics(repo_path):
    try:
        repo = git.Repo(repo_path)
    except git.exc.InvalidGitRepositoryError:
        print(f"Not a valid Git repository: {repo_path}")
        return []

    commits = list(repo.iter_commits('HEAD', reverse=True))
    commit_files = {}
    dev_experience = {}

    results = []

    for commit in commits:
        author = commit.author.name
        timestamp = commit.committed_date
        files = commit.stats.files
        stats = commit.stats.total

        la = stats.get('insertions', 0)
        ld = stats.get('deletions', 0)
        nf = len(files)

        subsystems = set()
        directories = set()
        loc_modified_per_file = []
        authors_touched = set()
        lt = 0
        age = 0
        exp = 0
        rexp = 0
        sexp = 0
        nuc = 0

        for file_path, file_stat in files.items():
            file_la = file_stat.get('insertions', 0)
            file_ld = file_stat.get('deletions', 0)
            total_mod = file_la + file_ld
            loc_modified_per_file.append(total_mod)

            file_dirs = file_path.split("/")
            subsystem = file_dirs[0] if len(file_dirs) > 1 else "root"
            directory = "/".join(file_dirs[:-1]) if len(file_dirs) > 1 else "root"

            subsystems.add(subsystem)
            directories.add(directory)

            if file_path in commit_files:
                f = commit_files[file_path]
                lt += f.loc
                nuc += f.nuc
                for a in f.authors:
                    authors_touched.add(a)
                time_diff = (timestamp - f.lastchanged) / 86400
                age += time_diff
                f.loc += file_la - file_ld
                f.lastchanged = timestamp
                f.nuc += 1
                if author not in f.authors:
                    f.authors.append(author)
            else:
                commit_files[file_path] = CommitFile(file_path, file_la - file_ld, [author], timestamp)
                age += 0

            if author in dev_experience:
                exp += sum(dev_experience[author].values())
                if subsystem in dev_experience[author]:
                    sexp += dev_experience[author][subsystem]
                    dev_experience[author][subsystem] += 1
                else:
                    dev_experience[author][subsystem] = 1
                try:
                    rexp += 1 / (age + 1)
                except:
                    rexp += 0
            else:
                dev_experience[author] = {subsystem: 1}

        ns = len(subsystems)
        nd = len(directories)
        ndev = len(authors_touched)
        nf = nf or 1
        lt = lt / nf
        age = age / nf
        exp = exp / nf
        rexp = rexp / nf

        entropy = 0
        total_loc_mod = sum(loc_modified_per_file)
        for file_mod in loc_modified_per_file:
            if file_mod > 0:
                p = file_mod / total_loc_mod
                entropy -= p * math.log(p, 2)

        metrics = {
            "hash": commit.hexsha,
            "ns": ns,
            "nd": nd,
            "nf": nf,
            "entropy": entropy,
            "la": la,
            "ld": ld,
            "lt": lt,
            "ndev": ndev,
            "age": age,
            "nuc": nuc,
            "exp": exp,
            "rexp": rexp,
            "sexp": sexp,
            "computed_at": datetime.utcnow().isoformat()
        }

        results.append(metrics)

    return results

def main():
    args = arguments()
    metrics = compute_metrics(args.p)
    print(json.dumps(metrics, indent=2))

if __name__ == "__main__":
    main()