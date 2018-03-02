"""deploy.py --> Deployment/backup script for Docket.

1. Read version
2. Create deployment directory
3. Copy files over (exclude this deployment script)
4. Find exe and move it to bin subfolder
5. Copy exe to top level Docket folder
"""
import os
from distutils.dir_util import copy_tree, remove_tree
from distutils.file_util import move_file, copy_file
import shutil
import time

_WORKSPACE = os.getcwd()
_ROOT = r'T:\Systems\InternalTools\Docket'
_EXCLUDED_DIRS = ['.vscode', 'node_modules']
_EXCLUDED_FILES = [os.path.basename(__file__)]
_EXECUTABLE = 'docket.exe'

def bin_folder(target):
    return os.path.join(target, 'bin')

def src_folder(target):
    return os.path.join(target, 'src')

def get_version():
    with open('VERSION', 'r') as f:
        return f'v{f.read().strip()}'

def top_folder(root, version):
    trg = os.path.join(root, version)
    if os.path.exists(trg) or os.path.exists(f'{trg}.zip'):
        raise Exception(f'{version} is already deployed, did you forget to increment the version file?')
    return trg

def make_structure(vfolder):
    os.mkdir(vfolder)
    os.mkdir(bin_folder(vfolder))

def exclude_dirs(trgdir, exs):
    for e in exs:
        d = os.path.join(src_folder(trgdir), e)
        remove_tree(d)
        print(f'removed directory {d}')

def exclude_files(trgdir, exs):
    for e in exs:
        d = os.path.join(src_folder(trgdir), e)
        os.remove(d)
        print(f'removed file {d}')

def ignore(directory, files):
    return [f for f in files if f in _EXCLUDED_FILES or f in _EXCLUDED_DIRS]

def copy_source(trgdir, dry_run=0):
    print()
    print('---------------------------Copying---------------------------')
    copied = shutil.copytree(_WORKSPACE, src_folder(trgdir), ignore=ignore)
    print(f'{len(copied)} files copied to {src_folder(trgdir)}')

def move_exe(trgdir):
    print()
    print('---------------------------Moving---------------------------')
    src = os.path.join(src_folder(trgdir), _EXECUTABLE)
    bdst = os.path.join(bin_folder(trgdir), _EXECUTABLE)
    
    ddst = os.path.join(_ROOT, _EXECUTABLE)

    move_file(src, bdst)
    if os.path.exists(ddst):
        os.remove(ddst)
    copy_file(bdst, ddst)
    print(f'moved {_EXECUTABLE} to {bin_folder(trgdir)}')
    print(f'copied {_EXECUTABLE} to {_ROOT}')

def main():
    version = get_version()
    print(f'deploying Docket {version}')
    try:
        target = top_folder(_ROOT, version)
        make_structure(target)
        copy_source(target)
        move_exe(target)
        print()
        print(f'Docket {version} deployed')
    except Exception as ex:
        print(f'could not deploy Docket {version}:')
        print(str(ex))

if __name__ == '__main__':
    main()