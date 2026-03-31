import sys, getopt, os, shutil
from distutils.dir_util import copy_tree

opts, args = getopt.getopt(sys.argv[1:], "b:", ["backups_path="])
backups_path = None
for opt, arg in opts:
    if opt in ("-b", "--backups_path"):
        backups_path = arg

# validate
if backups_path is None:
    sys.exit('--backups_path is required')
if backups_path == '' or backups_path == '/':
    sys.exit('--source cannot be empty or root')

# bluehost doesn't like it when the source starts with a slash
backups_path = os.path.expanduser('~' + backups_path)

# get folders in backups_path
folders = [f for f in os.listdir(backups_path) if os.path.isdir(os.path.join(backups_path, f))]
# sort folders by date
folders.sort()
# remove the last 2 folders
folders = folders[:-2]
# remove the rest of the folders
for folder in folders:
    print(" removing " + folder)
    shutil.rmtree(os.path.join(backups_path, folder))

sys.exit(0)