#
#
# Script to auto deploye C code
#

#db connection
MYSQL_HOST=localhost
USER_NAME=root
USER_PWD=cheerstestdb


SOURCE_DIR="/home/www/html/industry_insider_uat"
TARGET_DIR="/home/www/html/industry_insider_uat"
TARGET_DATA_DIR="/home/www/html/industry_insider_uat_data"


#download admin zip to server from ftp
#rm -rf  /home/deployment.zip
#rm -rf  ${SOURCE_DIR}/deployment
#wget -P ${SOURCE_DIR} --user=ftpuser60 --password='1gad@kgn2' ftp://203.200.229.65/deployment.zip

#unzip admin 
unzip ${SOURCE_DIR}/industry_insider.zip -d ${SOURCE_DIR}/deployment


#deploy root/admin
rsync -avz --exclude '.htaccess' --exclude 'configs' ${SOURCE_DIR}/deployment/ ${TARGET_DIR}
#rsync -avz  ${SOURCE_DIR}/deployment/ ${TARGET_DIR}

# minified JS/css
node minify.js ${SOURCE_DIR}

chown -R apache ${TARGET_DIR}/
chmod -R 755 ${TARGET_DIR}/

#deploy data UAT
rsync -avz --exclude '.htaccess' --exclude 'configs' --exclude 'upload' --exclude ${SOURCE_DIR}/'deployment/' ${SOURCE_DIR}/ ${TARGET_DATA_DIR}

chown -R apache ${TARGET_DATA_DIR}/
chmod -R 755 ${TARGET_DATA_DIR}/