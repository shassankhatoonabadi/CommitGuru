import argparse, json, os, subprocess, sys, functools
from collections import defaultdict
from typing import Dict, List, Sequence

# ─────────────────────────────  whitelist  ──────────────────────────────
WHITELISTED_EXT = {
    "ADA","ASM","AS","BAS","BAT","C","CC","CLJ","CPP","CS","CSON","CSS","CXX",
    "D","DART","EL","ERL","F","F03","F77","F90","F95","FOR","FS","GO","GRADLE",
    "GROOVY","H","HH","HPP","HXX","HS","HTM","HTML","HX","INI","IPYNB","JAVA",
    "JS","JSON","JL","KT","KTS","L","LESS","LHS","LUA","M","MAKE","MD","ML",
    "MM","NIM","PHP","PL","PM","PRO","PS1","PUG","PY","R","RBI","RB","RKT",
    "RS","RST","S","SASS","SCALA","SCM","SCSS","SH","SLIM","SQL","SS","ST",
    "SWIFT","TEX","TF","TS","TSX","V","VB","VBA","VBPROJ","VBX","VHD","VHDL"
}

class GitBackend:
    def __init__(self, repo): 
        if not os.path.isdir(os.path.join(repo, ".git")):
            sys.exit(f"{repo} is not a git repo")
        self.repo = os.path.abspath(repo)

    def _run(self, *a: Sequence[str]) -> str:
        try:
            return subprocess.check_output(
                ["git", *a],
                cwd=self.repo,
                stderr=subprocess.DEVNULL,
                encoding="utf-8",
                errors="replace"
            )
        except subprocess.CalledProcessError as e:
            sys.exit(f"git {' '.join(a)} failed: {e}")

    @functools.lru_cache(maxsize=None)
    def is_root(self,sha):  return len(self._run("rev-list","--parents","-n","1",sha).split())==1
    @functools.lru_cache(maxsize=None)
    def is_merge(self,sha): return len(self._run("rev-list","--parents","-n","1",sha).split())>2

    def modified_files(self,commit)->List[str]:
        if self.is_root(commit): return []
        files=self._run("diff",f"{commit}^",commit,"--name-only").splitlines()
        return [f for f in files
                if f and os.path.splitext(f)[1][1:].upper() in WHITELISTED_EXT]

    def diff_regions(self,commit,files)->Dict[str,List[int]]:
        if self.is_root(commit) or not files: return {}
        diff=self._run("diff",f"{commit}^",commit,"--unified=0","--",*files).splitlines()
        regions,cur,old=defaultdict(list),None,None
        for ln in diff:
            if ln.startswith("--- "):
                p=ln[6:] if ln.startswith("--- a/") else ln[4:]
                if p=="/dev/null": cur=None;continue
                if p.startswith("a/"): p=p[2:]
                cur=p if os.path.splitext(p)[1][1:].upper() in WHITELISTED_EXT else None
                continue
            if ln.startswith("@@"):
                old=abs(int(ln.split(" ")[1].split(",")[0]));continue
            if cur and ln.startswith("-") and not ln.startswith("---"):
                regions[cur].append(old); old+=1
        return regions

    def blame(self,file,line,fix)->str:
        out=self._run("blame","-l","--follow","-L",f"{line},+1",f"{fix}^","--",file)
        return out.split(" ",1)[0].lstrip("^")

class GitCommitLinker:
    def __init__(self,repo): self.git=GitBackend(repo)
    def link(self,fixes:List[str])->Dict[str,List[str]]:
        mapping:Dict[str,set]=defaultdict(set)
        for fix in fixes:
            for bug in self._link_one_fix(fix):
                if self.git.is_merge(bug):
                    continue
                if fix not in mapping[bug]: mapping[bug].add(fix)
        return mapping
    def _link_one_fix(self,fix)->List[str]:
        culprits=[]
        for f,lines in self.git.diff_regions(fix,self.git.modified_files(fix)).items():
            for ln in lines:
                sha=self.git.blame(f,ln,fix)
                if sha not in culprits: culprits.append(sha)
        return culprits

def load_corrective(p)->List[str]:
    data=json.load(open(p))
    if data and isinstance(data[0],str): return data
    key="commit" if "commit" in data[0] else "hash"
    return [d[key] for d in data]

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("repo"); ap.add_argument("--corrective",required=True)
    ap.add_argument("--output",default="links.json")
    a=ap.parse_args()
    fixes=load_corrective(a.corrective)
    res=[{"buggy_commit":b,"linked_to":list(l)} 
        for b,l in GitCommitLinker(a.repo).link(fixes).items()]

    json.dump(res,open(a.output,"w"),indent=2); print(json.dumps(res,indent=2))

if __name__=="__main__": main()