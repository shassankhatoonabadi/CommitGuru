import argparse
import subprocess
import os
import shutil
from urllib.parse import urlparse, urlunparse
import json

def arguments():
    parser = argparse.ArgumentParser(description="Clone a Git repository.")
    parser.add_argument("-u", required=True, type=str, help="Git repository URL to clone")
    parser.add_argument("-d", type=str, default=".", help="Output directory")
    parser.add_argument("-b", type=str, help="Branch to clone")
    parser.add_argument("-t", type=str, help="GitHub token for private repo access (optional)")
    parser.add_argument("-x", type=str, default="x-access-token", help="GitHub username for token auth")
    return parser.parse_args()

def inject_token(url, token, username="x-access-token"):
    if not token:
        return url
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise ValueError("Token injection only supported for HTTPS URLs.")
    new_netloc = f"{username}:{token}@{parsed.netloc}"
    return urlunparse((parsed.scheme, new_netloc, parsed.path, '', '', ''))

def validate_url(url):
    try:
        subprocess.run(["git", "ls-remote", url], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return True
    except subprocess.CalledProcessError:
        return False

def get_default_branch(repo_path):
    try:
        result = subprocess.run(
            ["git", "symbolic-ref", "--short", "refs/remotes/origin/HEAD"],
            cwd=repo_path,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True,
            text=True
        )
        return result.stdout.strip().replace("origin/", "")
    except subprocess.CalledProcessError:
        return None

def clone_repo(url, directory, branch=None):
    repo_name = url.rstrip("/").split("/")[-1].replace(".git", "")
    dest_path = os.path.join(directory, repo_name)

    if os.path.exists(dest_path):
        print(f"Directory '{dest_path}' already exists. Skipping clone.")
        return {
            "status": "skipped",
            "message": f"Directory '{dest_path}' already exists. Skipping clone.",
            "path": dest_path
        }

    if not validate_url(url):
        print(f"Error: URL '{url}' is invalid or inaccessible.")
        return {
            "status": "error",
            "message": f"URL '{url}' is invalid or inaccessible.",
            "path": None
        }

    cmd = ["git", "clone"]
    if branch:
        cmd += ["-b", branch]
    cmd += [url, dest_path]

    try:
        subprocess.run(cmd, check=True)
        cloned_branch = branch or get_default_branch(dest_path)
        print(f"Successfully cloned '{repo_name}'")
        return {
            "status": "success",
            "message": f"Successfully cloned '{repo_name}'",
            "path": dest_path,
            "branch": cloned_branch
        }
    except subprocess.CalledProcessError as e:
        if os.path.exists(dest_path):
            shutil.rmtree(dest_path)
        print(f"Error: Failed to clone repository '{repo_name}' : {e}")
        return {
            "status": "error",
            "message": f"Failed to clone repository '{repo_name}'",
            "error": str(e),
            "command": " ".join(cmd)
        }

def main():
    args = arguments()
    secure_url = inject_token(args.u, args.t, args.x)
    clone_repo(secure_url, args.d, args.b)
    result = clone_repo(secure_url, args.d, args.b)
    print(result["message"])
    if result["status"] == "success":
        print(f"Repository cloned to {result['path']} on branch {result['branch']}")
    else:
        print(f"Clone failed: {result['message']}")

if __name__ == "__main__":
    main()