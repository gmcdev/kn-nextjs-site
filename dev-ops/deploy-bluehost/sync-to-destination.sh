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

# scp all site files to destination
scp -i ~/.ssh/$key -P $port -r $source $userhost:/home2/kingnitr/deployments/next

# delete existing site and move new build into place
ssh -i ~/.ssh/$key -p $port -o StrictHostKeyChecking=no $userhost <<EOF
    cd /home2/kingnitr
    rm -rf public_html/site
    mv deployments/next/out public_html/site

EOF
