import sys, getopt, os
from distutils.dir_util import copy_tree

opts, args = getopt.getopt(sys.argv[1:], "s:d:", ["source=", "destination="])
source = None
destination = None
for opt, arg in opts:
    if opt in ("-s", "--source"):
        source = arg
    elif opt in ("-d", "--destination"):
        destination = arg

# validate

# source is optional
# if source is None, then we'll create an empty deploy directory
if source == '' or source == '/':
    source = None
if source:
    source = os.path.expanduser('~' + source)

if destination is None:
    sys.exit('--destination is required')
if destination == '' or destination == '/':
    sys.exit('--destination cannot be empty or root')

# destination
destination = os.path.expanduser('~' + destination)
# and make sure the destination exists
if not os.path.exists(destination):
    os.makedirs(destination)

print("source: " + source)
print("destination: " + destination)

# make a duplicate of the source in destination path
if source and os.path.exists(source):
    copy_tree(source, destination)

sys.exit(0)