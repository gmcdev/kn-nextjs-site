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

REMOTE_HOME=/home2/kingnitr
REMOTE_DEST=$REMOTE_HOME$dest/out

# rsync build to destination, excluding RSC payload files (~14GB savings)
rsync -az --delete --partial --timeout=120 \
  -e "ssh -i ~/.ssh/$key -p $port -o StrictHostKeyChecking=no" \
  $source/ $userhost:$REMOTE_DEST/

# delete existing site and move new build into place
ssh -i ~/.ssh/$key -p $port -o StrictHostKeyChecking=no $userhost <<EOF
    cd $REMOTE_HOME
    rm -rf public_html/site
    mv $REMOTE_DEST public_html/site

EOF
