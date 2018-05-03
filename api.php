<?php

/*
  This is an example class script proceeding secured API
  To use this class you should keep same as query string and function name
  Ex: If the query string value rquest=delete_user Access modifiers doesn't matter but function should be
  function delete_user(){
  You code goes here
  }
  Class will execute the function dynamically;

  usage :

  $object->response(output_data, status_code);
  $object->_request	- to get santinized input

  output_data : JSON (I am using)
  status_code : Send status message for headers

  Add This extension for localhost checking :
  Chrome Extension : Advanced REST client Application
  URL : https://chrome.google.com/webstore/detail/hgmloofddffdnphfgcellkdfbfbjeloo



 */
date_default_timezone_set('Asia/Calcutta');
// Ensure library/ is on include_path
define('BASE_PATH', realpath(dirname(__FILE__) . '/../'));
// Define path to application directory
defined('APPLICATION_PATH') || define('APPLICATION_PATH', realpath(dirname(__FILE__) . '/../application'));

// Define application environment
defined('APPLICATION_ENV') || define('APPLICATION_ENV', (getenv('APPLICATION_ENV') ? getenv('APPLICATION_ENV') : 'production'));

// Ensure library/ is on include_path
set_include_path(implode(PATH_SEPARATOR, array(
    realpath(APPLICATION_PATH . '/../library'),
    get_include_path() . '/library',
)));
require_once 'Zend/Loader/Autoloader.php';
$autoloader = Zend_Loader_Autoloader::getInstance();

$autoloader->registerNamespace('Custom_');

$loader = new Zend_Loader_Autoloader_Resource(array(
    'basePath' => APPLICATION_PATH . '/modules',
    'namespace' => '',
        ));

$loader->addResourceType('default', 'default/models', 'Default_Model');

require_once("Rest.inc.php");

class API extends REST {

    public $data = "";

    public function __construct() {
        parent::__construct();    // Init parent contructor
    }

    /*
     * Public method for access api.
     * This method dynmically call the method based on the query string
     *
     */

    public function processApi() {
        $func = strtolower(trim(str_replace("/", "", $_REQUEST['rquest'])));
        if ((int) method_exists($this, $func) > 0)
            $this->$func();
        else
            $this->response('', 404);    // If the method not exist with in this class, response would be "Page not found".
    }

    public function server_acquirepatentsapi() {
//        print_r($_REQUEST);exit; 
        $companies = $_REQUEST['companies'];
        $companies = explode(',', $companies);
        $companies = array_map(function($value) {
            return new MongoId($value);
        }, $companies);
        $dt = $_REQUEST['dt'];
        $patent_keywords = $_REQUEST['patent_keywords'];
        $pkey = array();
        if ($patent_keywords != '') {
            $pkey = explode(",", $patent_keywords);
        }
        $patent_by_company_name = $_REQUEST['patent_by_company_name'];
        $patent_by_cpc = $_REQUEST['patent_by_cpc'];
        $patent_by_ipc = $_REQUEST['patent_by_ipc'];
        $patent_search_for = $_REQUEST['patent_search_for'];
//        $patent_by_dt_keywords = $this->_getParam('patent_by_dt_keywords', '');

        try {
            $oModelDtSourceConfig = new Default_Model_DtSourceConfig();
            $dt = $oModelDtSourceConfig->getDocument(array('dt_id' => new MongoId($dt)));
            $dt = $dt[0];
            $dtkeywords = $dt['dt_patent_search_config']['keywords'];
            $ipc_classes = $dt['dt_patent_search_config']['ipc_classes'];
            $cpc_classes = $dt['dt_patent_search_config']['cpc_classes'];
            $psources = array();

            $oModelPatentBatch = new Default_Model_PatentAcquisition();
            $oModelCompany = new Default_Model_Company();
            $companiesData = $oModelCompany->getDocument(array('_id' => array('$in' => $companies)), array('_id' => 1, 'company_name.value' => 1, 'company_name_variations' => 1));
            $companiesToUpdate = array();
            foreach ($companiesData as $comp) {
                array_push($companiesToUpdate, $comp['_id']);
                $batchData = array();
                $batchData['company_id'] = $comp['_id'];
                $batchData['company_name'] = $comp['company_name']['value'];
                $batchData['company_name_variations'] = $comp['company_name_variations'];
                $batchData['dt_id'] = $dt['dt_id'];
                $batchData['dt_name'] = $dt['dt_name'];
                $batchData['dt_keywords'] = (!empty($dtkeywords)) ? $dtkeywords : array();
                $batchData['ipc_classes'] = (!empty($patent_by_ipc) && !empty($ipc_classes)) ? $ipc_classes : array();
                $batchData['cpc_classes'] = (!empty($patent_by_cpc) && !empty($cpc_classes)) ? $cpc_classes : array();
                $batchData['create_date'] = new MongoDate(time());
                $batchData['patent_keywords'] = $pkey;
                $batchData['batch_search_for'] = $patent_search_for;
                $batchData['user_id'] = '';
                $batchData['patent_processing_status'] = 'NOTSTARTED';
                $batchData['patent_migration_status'] = 0;
                $batchData['patent_source'] = array();
                foreach ($dt['patent_source'] as $patents) {
                    if ($patents['active'] == 1) {
                        $sourceinfo = array('source' => $patents['source'], 'patent_count' => '', 'status' => 'NOTSTARTED');
                        array_push($batchData['patent_source'], $sourceinfo);
                    }
                }

                $batchId = $oModelPatentBatch->addDocument($batchData);
            }



            /**
             * Update company status as in progress
             */
            $oDbModelCompany = new Default_Model_Company();
            $oDbModelCompany->updateDocument(
                    array('_id' => array('$in' => $companiesToUpdate), 'source_dt.dt_id' => $dt['dt_id']), array(
                '$set' => array('source_dt.$.patent_processing_status' => 'INPROGRESS')), array('multiple' => true));
        } catch (Exception $e) {
            echo $e;
        }
//        $this->response('', 200);
    }

    public function cms_migratepatentapi() {
//        print_r($_REQUEST);exit; 
        $cmsurl = "http://localhost/inx_cms/";
        $company_id = $_REQUEST['company'];
        $dt_id = $_REQUEST['dt_id'];
        $patents = json_decode($_REQUEST['patents']);
        
        try {
            $oPatent = new Default_Model_Patent();
            
            foreach ($patents as $patent) {
                echo "<br>========================================================================";
                echo "<br>==== Start migration for patent: ".$patent->patent_number." =====";
                $gotpatent = $oPatent->getDocument(array('$or' => array(array(
                        'patent_number' => $patent->patent_number, 
                        'patent_application_no' => $patent->patent_application_no))));
                
                if (count($gotpatent) > 0) {
                    $gotpatent = $gotpatent[0];
                    echo "<br>==== Merge patent: ".$patent->patent_number." =====";
                    $ptdata = array();
                    $ptwhere = array('$or' => array(array('patent_number' => $patent->patent_number, 'patent_application_no' => $patent->patent_application_no)));
                    foreach ($patent as $patent_field => $value) {
                        if ($gotpatent[$patent_field] == '' || $gotpatent[$patent_field] == null) {
                            $ptdata[$patent_field] = $value;
                        }
                    }
                    $oPatent->updateDocument($ptwhere, array('$set' => $ptdata));
                } else {
                    echo "<br>==== Add patent: ".$patent->patent_number." =====";
                    $oPatent->addDocument($patent);
                }
                $patent_number = $patent->patent_number;
                $patent_id = $patent->_id->{'$id'};
                $companyid = $patent->company_id->{'$id'};
                try {
                    $ch = curl_init();
                    $curlConfig = array(
                        CURLOPT_URL => $cmsurl."rest/api/processApi",
                        CURLOPT_POST => true,
                        CURLOPT_RETURNTRANSFER => true,
                        CURLOPT_POSTFIELDS => array(
                            'rquest' => 'server_updatepatentstatus',
                            'migration_status' => 1,
                            'patent_number' => $patent_number,
                            'patent_id' => $patent_id,
                            'company_id' => $companyid,
                            'dt_id' => $dt_id
                        )
                    );                    
                    curl_setopt_array($ch, $curlConfig);
                    echo "<br>==== Update Patent Status ====";
                    $result = curl_exec($ch);
                    if (curl_errno($ch)) {
                        echo 'Request Error:' . curl_error($ch);
                    }
                    echo $result;
                    curl_close($ch);
                } catch (Exception $ex) {
                    echo $ex;
                }
            }
            //print_r($patents);
        } catch (Exception $e) {
            echo $e;
        }
        echo "<br>==== End patent migration =====";
//        $this->response('', 200);
    }

    /*
     * 	Encode array into JSON
     */

    public function server_updatepatentstatus() {
        $serverurl = "http://localhost/inx_cms/";
        $migration_status = $_REQUEST['migration_status'];
        $patent_id = $_REQUEST['patent_id'];
        $patent_number = $_REQUEST['patent_number'];
        $company_id = $_REQUEST['company_id'];
        $dt_id = $_REQUEST['dt_id'];
        $oPatentBatch = new Default_Model_PatentAcquisition();
        $oPatent = new Default_Model_Patent();

        if ($migration_status == 1) {
            $pwhere['_id'] = new MongoId($patent_id);
            $pwhere['patent_number'] = $patent_number;
            $pdata = array('patent_migration_status' => 1);
            $oPatent->updateDocument($pwhere, array('$set' => $pdata));
            echo "<br>==== Updated === Patent status ====";
            
            $cwhere = array(
                'company_id' => new MongoId($company_id),
                'patent_migration_status' => 0
            );

            
            $gotincomplete = $oPatent->getDocument($cwhere);
            if (count($gotincomplete) == 0) {
                /// Update acquisition collection patent_migration_status on SERVER side
                $uwhere['company_id'] = new MongoId($company_id);
                $uwhere['patent_migration_status'] = 0;
                $udata = array('patent_migration_status' => 1);
                $oPatentBatch->updateDocument($uwhere, array('$set' => $udata));
                
                /// Update company collection patent_processing_status on CMS side
                try {
                    $ch = curl_init();
                    $curlConfig = array(
                        CURLOPT_URL => $serverurl . "rest/api/processApi",
                        CURLOPT_POST => true,
                        CURLOPT_RETURNTRANSFER => true,
                        CURLOPT_POSTFIELDS => array(
                            'rquest' => 'cms_updatecompanystatus',
                            'processing_status' => 1,
                            'company_id' => $company_id,
                            'dt_id' => $dt_id
                        )
                    );
                    curl_setopt_array($ch, $curlConfig);
                    echo "<br>==== Update company status ====";
                    $result = curl_exec($ch);
                    if (curl_errno($ch)) {
                        echo 'Request Error:' . curl_error($ch);
                    }
                    echo $result;
                    curl_close($ch);
                } catch (Exception $ex) {
                    echo $ex;
                }
            }
        }
    }

    public function cms_updatecompanystatus() {
        $processing_status = $_REQUEST['processing_status'];
        $company_id = $_REQUEST['company_id'];
        $dt_id = $_REQUEST['dt_id'];
        if ($processing_status == 1) {
            $oCompany = new Default_Model_Company();
            $where = array('_id' => new MongoId($company_id), 'source_dt.dt_id' => new MongoId($dt_id));
            $data = array(
                '$set' => array('source_dt.$.patent_processing_status' => 'COMPLETED')
            );
            $oCompany->updateDocument($where, $data);
            echo "<br>==== Updated == company status ====";
            
        }
    }

    private function json($data) {
        if (is_array($data)) {
            return json_encode($data);
        }
    }

    /**
     * 
     * Create Email batch
     * @return JSON resp
     */
}

// Initiiate Library
error_reporting(E_ALL);
ini_set('display_errors', 0);

$api = new API;

$api->processApi();
?>