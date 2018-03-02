import os
from subprocess import Popen, PIPE
import argparse
import sys
from glob import glob
import shutil
from os.path import basename

def report_error(err, m):
    msg = str(err, 'utf-8').strip() + '\n'
    if m:
        msg += m
    return msg

def copy_files():
    print()
    print('-----> Removing files from server')
    for file in glob(r'server/static/*'):
        os.remove(file)

    print('-----> Copying files to server')
    for file in glob(r'client/build/*.*'):
        shutil.copy(file, f"server/static/{basename(file)}")
    
    for file in glob(r'client/build/static/js/*'):
        shutil.copy(file, f"server/static/{basename(file)}")

    for file in glob(r'client/build/static/css/*'):
        shutil.copy(file, f"server/static/{basename(file)}")
    print('-----> Files copied to server')


def compile_frontend():
    print('-----> Compiling frontend')
    os.chdir(r'./client')
    p = Popen([r'npm.cmd', 'run', 'build'], stdout=PIPE, env=dict(os.environ.copy()))
    if p.wait() != 0:
        os.chdir(r'..')
        raise Exception(report_error(p.stdout.read(), 'Frontend compile failed!'))
    os.chdir(r'..')
    print('-----> Frontend compiled')

def pack_assets():
    print()
    print('-----> Packing assets')
    p = Popen([r'go-bindata.exe','-o','server/assets/assets.go', '-pkg' ,'assets', 'server/static'], stdout=PIPE)
    if p.wait() != 0:
        raise Exception(report_error(p.stdout.read(), 'Asset packing failed!'))
    print('-----> Assets packed')

def compile_executable():
    print()
    print('-----> Compiling go')
    p = Popen(['go', 'build', '-o', 'docket.exe', './server'], stderr=PIPE)
    if p.wait() != 0:
        raise Exception(report_error(p.stderr.read(), 'Go build failed!'))
    print('-----> Go compiled')

def args():
    p = argparse.ArgumentParser(description='Docket build tool.')
    p.add_argument('-p', '--pack', help='frontend compile and binary pack only.', action='store_true')
    return p.parse_args()

def main():
    pack = args().pack
    if pack:
        print('-----> Frontend compile and pack only')
        print()

    try:
        compile_frontend()
        copy_files()
        pack_assets()
        if not pack:
            compile_executable()
        print('\nBuild succeeded!')
        sys.exit(0)
    except Exception as x:
        print(f'\n{str(x)}\nBuild failed!')
        sys.exit(1)

if __name__ == '__main__':
    main()