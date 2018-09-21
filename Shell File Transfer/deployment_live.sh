#
#
# Script to auto deploye C code
#

#db connection
MYSQL_HOST=localhost
USER_NAME=root
USER_PWD=cheerstestdb


SOURCE_DIR="/home/www/html/industry_insider_uat_data"
TARGET_DIR="/home/www/html/industry_insider"

#download admin zip to server from ftp
#rm -rf  /home/deployment.zip
#rm -rf  ${SOURCE_DIR}/deployment
#wget -P ${SOURCE_DIR} --user=ftpuser60 --password='1gad@kgn2' ftp://203.200.229.65/deployment.zip


#deploy root/admin
rsync -avz --exclude '.htaccess' --exclude 'application.ini' --exclude 'config.js' --exclude 'db' --exclude 'deployment' --exclude ${SOURCE_DIR}/'industry_insider.zip'   ${SOURCE_DIR}/ ${TARGET_DIR}/

chown -R apache ${TARGET_DIR}/
chmod -R 755 ${TARGET_DIR}/
