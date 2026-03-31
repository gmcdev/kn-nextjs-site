#!/bin/bash
while getopts u:k:p:s:d: flag; do
    case "${flag}" in
    u) userhost=${OPTARG} ;;
    k) key=${OPTARG} ;;
    p) port=${OPTARG} ;;
    s) source=${OPTARG} ;;
    d) dest=${OPTARG} ;;
    *) echo "Invalid option: -$flag" ;;
    esac
done

# disable stdin fingerprint check
mkdir -p ~/.ssh && echo "Host *" >~/.ssh/config && echo " StrictHostKeyChecking no" >>~/.ssh/config

# scp latest version of remote/prepare-destination script to the remote server
scp -i ~/.ssh/$key -P $port ./remote/prepare-destination.py $userhost:/home2/kingnitr/deployments/prepare-destination.py

# execute remote/prepare-destination with args
ssh -i ~/.ssh/$key -p $port -o StrictHostKeyChecking=no $userhost <<EOF
    cd /home2/kingnitr/deployments
    python prepare-destination.py -s $source -d $dest

EOF
