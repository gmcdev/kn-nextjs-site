#!/bin/bash
while getopts u:k:p:b: flag; do
    case "${flag}" in
    u) userhost=${OPTARG} ;;
    k) key=${OPTARG} ;;
    p) port=${OPTARG} ;;
    b) backups_path=${OPTARG} ;;
    *) echo "Invalid option: -$flag" ;;
    esac
done

# disable stdin fingerprint check
mkdir -p ~/.ssh && echo "Host *" >~/.ssh/config && echo " StrictHostKeyChecking no" >>~/.ssh/config

# scp latest version of remote/prune-stale-backups script to the remote server
scp -i ~/.ssh/$key -P $port ./remote/prune-stale-backups.py $userhost:/home2/kingnitr/deployments/prune-stale-backups.py

# execute remote/prune-stale-backups with args
ssh -i ~/.ssh/$key -p $port -o StrictHostKeyChecking=no $userhost <<EOF
    cd /home2/kingnitr/deployments
    python prune-stale-backups.py -b $backups_path

EOF
