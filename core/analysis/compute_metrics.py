import json
import logging
from pydriller import Repository
import math
import os

class CommitFile:

	def __init__(self, name, loc, authors, lastchanged):
		self.name = name												# File name
		self.loc = loc													# LOC in file
		self.authors = authors									# Array of authors
		self.lastchanged = lastchanged					# unix time stamp of when last changed
		self.nuc = 1

ALLOWED_EXT = {
    # -------------- extensions --------------
    "ADA","ADB","ADS","ASM","BAS","BB","BMX","C","CLJ","CLS","COB","CBL","CPP","CC","CXX",
    "CBP","CS","CSPROJ","D","DBA","DBPRO123","E","EFS","EGT","EL","FOR","FTN","F","F77","F90",
    "FRM","GO","H","HPP","HXX","HS","I","INC","JAVA","L","LGT","LISP","M","M4","ML","N","NB",
    "P","PAS","PP","PHP","PHP3","PHP4","PHP5","PHPS","PHTML","PIV","PL","PM","PRG","PRO","PY","R",
    "RB","RESX","RC","RC2","RKT","RKTL","SCI","SCE","SCM","SD7","SLN","SPIN","STK","SWG","TCL",
    "VAP","VB","VBG","XPL","XQ","XSL","Y","AHK","APPLESCRIPT","AS","AU3","BAT","CMD","COFFEE",
    "EGG","ERB","HTA","IBI","ICI","IJS","ITCL","JS","JSFL","LUA","MRC","NCF","NUT","PS1",
    "PS1XML","PSC1","PSD1","PSM1","RDP","SCPT","SCPTD","SDL","SH","VBS","EBUILD","XML","GRADLE",
    "PROPERTIES", "GITIGNORE", "NAME", "JSON", "CSV"
}
ALLOWED_FILE = {"GRADLEW","MAKEFILE","CMAKE","CONFIGURE","RUN"}

def extension_ok(fname: str) -> bool:
    base = fname.rsplit("/", 1)[-1]          # strip path
    if "." in base:
        return base.rsplit(".",1)[1].upper() in ALLOWED_EXT
    return base.upper() in ALLOWED_FILE

def find_renamed_file(fileName, commitFiles):
    fileBase = os.path.basename(fileName)
    for existingFile in commitFiles:
        if os.path.basename(existingFile) == fileBase:
            # You can add further heuristics here if needed
            return existingFile
    return None
    
def getCommitStatsProperties(stats, commitFiles, devExperience, author, unixTimeStamp, renamed_files):
    la = 0
    ld = 0
    nf = 0
    ns = 0
    nd = 0
    lt = 0
    AGE = 0
    nuc = 0
    paths = []
    subsystemsSeen = set()
    directoriesSeen = set()
    locModifiedPerFile = []
    devs_touched = set()
    file_age_days = []

    for stat in stats:
        parts = stat.split("\t")
        if len(parts) < 3:
            continue
        try:
            added = int(parts[0])
            deleted = int(parts[1])
        except ValueError:
            continue

        fileName = parts[2].replace("'", '').replace('"', '').replace("\\", "")
        paths.append(fileName)

        total_mod = added + deleted
        la += added
        ld += deleted
        locModifiedPerFile.append(total_mod)

        fileDirs = fileName.split("/")
        subsystem = fileDirs[0] if len(fileDirs) > 1 else "root"
        directory = "/".join(fileDirs[:-1]) if len(fileDirs) > 1 else "root"
        subsystemsSeen.add(subsystem)
        directoriesSeen.add(directory)

        # Handle renames
        if fileName not in commitFiles:
            renamed_from = renamed_files.get(fileName)
            if renamed_from and renamed_from in commitFiles:
                commitFiles[fileName] = commitFiles.pop(renamed_from)

        # --- Existing file ---
        if fileName in commitFiles:
            prevFile = commitFiles[fileName]

            lt += prevFile.loc
            devs_touched.update(prevFile.authors)

            # AGE in days
            delta_days = (unixTimeStamp - prevFile.lastchanged) / 86400
            if delta_days >= 0:
                file_age_days.append(delta_days)

            # NUC: sum of prior changes
            nuc += prevFile.nuc

            # Update file metadata
            prevFile.loc += added - deleted
            prevFile.lastchanged = unixTimeStamp
            if author not in prevFile.authors:
                prevFile.authors.append(author)
            prevFile.nuc += 1  # ← increment after snapshot

        # --- New file ---
        else:
            commitFiles[fileName] = CommitFile(fileName, added - deleted, [author], unixTimeStamp)
            # Do not count nuc for new files

    nf = len(paths)
    ns = len(subsystemsSeen)
    nd = len(directoriesSeen)
    lt = lt / nf if nf > 0 else 0
    ndev = len(devs_touched)
    AGE = sum(file_age_days) / len(file_age_days) if file_age_days else 0

    # Developer experience
    if author not in devExperience:
        devExperience[author] = {"total": 0, "timestamps": []}
    exp = devExperience[author]["total"]
    devExperience[author]["total"] += 1
    devExperience[author]["timestamps"].append(unixTimeStamp)

    # Entropy
    totalLOCModified = sum(locModifiedPerFile)
    entrophy = 0
    if totalLOCModified > 0:
        for loc in locModifiedPerFile:
            p = loc / totalLOCModified
            if p > 0:
                entrophy -= p * math.log(p, 2)

    return f', "la": {la}, "ld": {ld}, "lt": {lt}, "ns": {ns}, "nd": {nd}, "nf": {nf}, "entrophy": {entrophy}, "exp": {exp}, "ndev": {ndev}, "age": {AGE}, "nuc": {nuc}'

def log(repo_path):
    commitFiles   = {}
    devExperience = {}
    results       = []
    renamed_files = {}
    file_devs = {}


    for commit in Repository(repo_path).traverse_commits():
        if len(commit.parents) > 1:
            continue

        # Track actual file renames
        for mod in commit.modified_files:
            if mod.change_type.name == "RENAME":
                old_path = mod.old_path
                new_path = mod.new_path
                if old_path and new_path:
                    renamed_files[new_path] = old_path

        stats = [
            f"{mod.added_lines}\t{mod.deleted_lines}\t{mod.new_path or mod.old_path}"
            for mod in commit.modified_files
            if extension_ok(mod.new_path or mod.old_path)
        ]

        author  = commit.author.name
        unix_ts = int(commit.author_date.timestamp())

        stat_props_str = getCommitStatsProperties(
            stats,
            commitFiles,
            devExperience,
            author,
            unix_ts,
            renamed_files  # ← pass it here
        )

        metrics = json.loads("{" + stat_props_str.lstrip(",") + "}") if stat_props_str else {}

        commit_obj = {
            "commit_hash": commit.hash,
            "author":      author,
            "author_date": commit.author_date.isoformat(),
            "message":     commit.msg,
            "stats":       metrics,
        }
        results.append(commit_obj)

    logging.info("Done getting/parsing git commits.")
    return results

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("-p", "--path", required=True, help="Path to local Git repository")
    args = parser.parse_args()

    output = log(args.path)
    print(json.dumps(output, indent=2))
