<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Description of Utility
 *
 * @author suraj.varane
 */
class Custom_Utility {

    //put your code here

    public $baseUrl = '';

    public function __construct() {
        $this->baseUrl = Zend_Controller_Front::getInstance()->getBaseUrl();
    }

    public function getNoImagePath($entityType) {
        if ($entityType == 'company') {
            return $this->baseUrl . "/upload/images/company/no_img_company.png";
        }else if ($entityType == 'startup') {
            return $this->baseUrl . "/upload/images/company/no_img_startup.png";
        }else if ($entityType == 'product') {
            return $this->baseUrl . "/upload/images/product/no_img_product.jpg";
        } else if ($entityType == 'people') {
            return $this->baseUrl . "/upload/images/people/no_img_people.jpg";
        } else if ($entityType == 'funding') {
            return $this->baseUrl . "/upload/images/funding/no_img_funding.jpg";
        } else if ($entityType == 'mna') {
            return $this->baseUrl . "/upload/images/mna/no_img_mna.jpg";
        } else if ($entityType == 'event') {
            return $this->baseUrl . "/upload/images/event/no_img_event.jpg";
        } else if ($entityType == 'industry') {
            return $this->baseUrl . "/upload/images/industry/no_img_industry.jpg";
        } else if ($entityType == 'news') {
            return $this->baseUrl . "/upload/images/news/no-image-news.png";
        } else if ($entityType == 'news_video') {
            return $this->baseUrl . "/upload/videos/news/no_img_video.jpg";
        } else if ($entityType == 'whatsnext') {
            return $this->baseUrl . "/upload/images/whatsnext/no_img_whatsnext.jpg";
        } else if ($entityType == 'whatsnext_video') {
            return $this->baseUrl . "/upload/videos/whatsnext/no_img_video.jpg";
        } else if ($entityType == 'education') {
            return $this->baseUrl . "/upload/images/education/no_img_education.jpg";
        } else if ($entityType == 'dt') {
            return $this->baseUrl . "/upload/images/dt/no-image.gif";
        }else if ($entityType == 'innovationwatch') {
            return $this->baseUrl . "/upload/images/innovationwatch/no-image.gif";
        }else if ($entityType == 'innovationwatch_video') {
            return $this->baseUrl . "/upload/videos/innovationwatch/no_img_video.jpg";
        } else if ($entityType == 'document') {
            return $this->baseUrl . "/upload/images/document/no-image.gif";
        } 

        return $this->baseUrl . "/images/no-image.gif";
    }

    public function isFileExits($filePath) {
        if (empty($filePath))
            return false;
        if (file_exists(PUBLIC_PATH . $filePath)) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * 
     * @param type $fileName  String: object Id 
     * @param type $entityType String: company/product/people 
     */
    public function getEntityPicturePath($fileName, $entityType) {
        if (empty($fileName))
            return '';
        if ($entityType == 'company') {
            return "/upload/images/company/" . $fileName;
        } else if ($entityType == 'product') {
            return "/upload/images/product/" . $fileName;
        } else if ($entityType == 'people') {
            return "/upload/images/people/" . $fileName;
        } else if ($entityType == 'funding') {
            return "/upload/images/funding/" . $fileName;
        } else if ($entityType == 'mna') {
            return "/upload/images/mna/" . $fileName;
        } else if ($entityType == 'event') {
            return "/upload/images/event/" . $fileName;
        } else if ($entityType == 'news') {
            return "/upload/images/news/" . $fileName;
        } else if ($entityType == 'whatsnext') {
            return "/upload/images/whatsnext/" . $fileName;
        } else if ($entityType == 'industry') {
            return "/upload/images/industry/" . $fileName;
        } else if ($entityType == 'dt') {
            return "/upload/images/dt/" . $fileName . '.jpg';
        } else if ($entityType == 'dt-bw') {
            return "/upload/images/dt/" . $fileName . '_bw.jpg';
        } else if ($entityType == 'whatsnext_video') {
            return "/upload/videos/whatsnext/" . $fileName;
        } else if ($entityType == 'news_video') {
            return "/upload/videos/news/" . $fileName;
        }else if ($entityType == 'patent') {
            return "/upload/images/patent/" . $fileName;
        }
    }

    /**
     * 
     * Generate Tree Plain UL LI 
     * 
     * @param type $parent
     * @param type $this->treeArr 
     * @return boolean|string
     */
    function buildTreeUl(array $elements, $parentId = 0) {
        $output = "<ul>";
        foreach ($elements as $element) {
            if ($element['parent'] == $parentId) {
                $output .= "<li data-jstree='{ \"opened\" : true }'>";
                $output .= $element['name'];
                $output .= $this->buildTreeUl($elements, $element['id']);
                $output .= "</li>";
            }
        }
        $output .= "</ul>";
        return $output;
    }

    function buildTreeJson(array $elements, $parentId = 0) {
        $branch = array();
        foreach ($elements as $element) {
            $element['HTMLid'] = $element['id'];
            $element['text'] = array('name' => $element['name']);
            if ($element['parent'] == $parentId) {
                $children = $this->buildTreeJson($elements, $element['id']);
                if (count($children) > 0) {
                    $element['collapsed'] = true;
                    $element['children'] = $children;
                }
                $branch[] = $element;
            }
        }
        return $branch;
    }

    public function getAdvanceSearchOperator($item) {


        if ($item['param_filter_type'] == 'filter_operator_0') {
            $param_value = array_map(function($value) {
                return preg_quote(trim($value['val']));
            }, $item['param_value']);
            if ($item['param_operator'] == 'cn') {
                $param_value = implode("|", $param_value);
                $param_operator = new MongoRegex("/$param_value/i");
            } else if ($item['param_operator'] == 'ncn') {
                $param_value = array_map(function($value) {
                    return preg_quote(trim($value['val']));
                }, $item['param_value']);
//                $param_value = array_map(function($value) {
//                    return '^((?!'. preg_quote($value['val'], '/') .').)*$';
//                }, $item['param_value']);
//                $param_value = implode("|",$param_value);
//                $param_operator =new MongoRegex("/$param_value/i");
                $param_value = implode("|", $param_value);
                $param_value = new MongoRegex("/$param_value/i");
                $param_operator = array('$not' => $param_value);
            } else if ($item['param_operator'] == 'stw') {
                $param_value = array_map(function($value) {
                    return '^' . preg_quote($value['val'], '/');
                }, $item['param_value']);
                $param_value = implode("|", $param_value);
                $param_operator = new MongoRegex("/$param_value/i");
            } else if ($item['param_operator'] == 'eq') {
                $param_value = array_map(function($value) {
                    return '^' . preg_quote($value['val'], '/') . '$';
                }, $item['param_value']);
                $param_value = implode("|", $param_value);
                $param_operator = new MongoRegex("/$param_value/i");
            }
        } else if ($item['param_filter_type'] == 'filter_operator_1' ||
                $item['param_filter_type'] == 'filter_operator_3') {
            $param_value = array_map(function($value) {
                return trim($value['val']);
            }, $item['param_value']);
            $param_value = floatval($param_value[0]);
            if ($item['param_operator'] == 'eq') {
                $param_operator = $param_value;
            } else if ($item['param_operator'] == 'neq') {
                $param_operator = array('$ne' => $param_value);
            } else if ($item['param_operator'] == 'gt') {
                $param_operator = array('$gt' => $param_value);
            } else if ($item['param_operator'] == 'lt') {
                $param_operator = array('$lt' => $param_value);
            } else if ($item['param_operator'] == 'gte') {
                $param_operator = array('$gte' => $param_value);
            } else if ($item['param_operator'] == 'lte') {
                $param_operator = array('$lte' => $param_value);
            }
        } else if ($item['param_filter_type'] == 'filter_operator_2') {
            if ($item['param_operator'] == 'eq_yes') {
                $param_operator = 'YES';
            } else if ($item['param_operator'] == 'eq_no') {
                $param_operator = 'NO';
            }
        } else if ($item['param_filter_type'] == 'filter_operator_4') {
            $day_start = array_map(function($value) {
                return new MongoDate(strtotime($value['val']));
            }, $item['param_value']);
            $day_end = new MongoDate(strtotime('+1 day', $day_start[0]->sec));
            $day_start = $day_start[0];
            if ($item['param_operator'] == 'eq') {
                //$param_operator = $day_start;
                $param_operator = array('$gt' => $day_start, '$lt' => $day_end);
            } else if ($item['param_operator'] == 'neq') {
                $param_operator = array(array($item['param_name'] => array('$gt' => $day_end)),
                    array($item['param_name'] => array('$lt' => $day_start)));
            } else if ($item['param_operator'] == 'gt') {
                $param_operator = array('$gt' => $day_end);
            } else if ($item['param_operator'] == 'lt') {
                $param_operator = array('$lt' => $day_start);
            } else if ($item['param_operator'] == 'gte') {
                $param_operator = array('$gte' => $day_start);
            } else if ($item['param_operator'] == 'lte') {
                $param_operator = array('$lte' => $day_end);
            }
        }

//        echo '<pre>$param_operator';
//        print_r($param_operator);
//        die;
        return $param_operator;
    }

    public function getDocumentIconFontClass($docType) {
        if ($docType == 'pdf') {
            return 'fa-file-pdf-o';
        } else if ($docType == 'docx' || $docType == 'doc') {
            return 'fa-file-word-o';
        } else if ($docType == 'xls' || $docType == 'xlsx') {
            return 'fa-file-excel-o';
        } else if ($docType == 'ppt' || $docType == 'pptx') {
            return 'fa-file-powerpoint-o';
        } else if ($docType == 'png' || $docType == 'jpg' || $docType == 'jpeg') {
            return 'fa-file-photo-o';
        }
    }

    public function exportErrorInExcel($errorHtml) {
        //export to excel sheet
        $filename = "Error_Uploading.xls";
        $useragent = $_SERVER['HTTP_USER_AGENT'];
        $matched = "";
        if (preg_match('|MSIE ([7-9].[0-9]{1,2})|', $useragent, $matched)) {
            //$browser_version=$matched[1];
            $browser = 1; //'IE';
        } else if (preg_match('|MSIE ([0-6].[0-9]{1,2})|', $useragent, $matched)) {
            //$browser_version=$matched[1];
            $browser = 2; //'IE <6';
        }
        if ($browser == 1) {
            header('ETag: etagforie7download'); //IE7 requires this header
            header('content-type:application/octetstream');
            header('content-disposition:attachment; filename=' . $filename);
            header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
            header('Pragma: public');
        } else if ($browser == 2) {
            header('Content-Disposition: attachment; filename=' . $filename);
            header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
            header('Pragma: public');
        } else {
            header('Content-type: application/zip');
            header('Content-Disposition: attachment; filename=' . $filename);
        }
        echo $errorHtml;
    }

    public function getStateCookie($request, $route) {

        $statsCookie = $request->getCookie($route);
        return Zend_Json::decode($statsCookie);
//         echo '<pre>$statsCookie';
//            print_r($statsCookie);
//            echo '</pre>';
//            die;
        if (!empty($statsCookie)) {
            $stateCookie = Zend_Json::decode($statsCookie);


            $cookie = @array_values(@array_filter($stateCookie, function($ar) use ($route) {
                                return ((string) $ar['route'] == (string) $route);
                            }));

            if (!empty($cookie)) {
                return $cookie[0];
            }
        }
    }

    public function getBrowser() {
        $browser = '';
        $user_agent = $_SERVER['HTTP_USER_AGENT'];
        if (preg_match('/MSIE/i', $user_agent)) {
            $browser = "Internet Explorer";
        }
        if (preg_match('/Firefox/i', $user_agent)) {
            $browser = "FireFox";
        }
        if (strpos($user_agent, 'Chrome') !== false) {
            $browser = "Google Chrome";
        }
        if (strpos($user_agent, 'Safari') && !strpos($user_agent, 'Chrome')) {
            $browser = 'Safari';
        }
        if (preg_match('/Opera/i', $user_agent)) {
            $browser = "Opera";
        }
        return $browser;
    }
    /**
     * Method to detect device
     * @return type
     */
    function isMobileDevice() {
        return preg_match("/(android|avantgo|blackberry|bolt|boost|cricket|docomo|fone|hiptop|mini|mobi|palm|phone|pie|tablet|up\.browser|up\.link|webos|wos)/i", $_SERVER["HTTP_USER_AGENT"]);
    }
    
    function trialExceedMail($subject ,$msgBody, $from, $to){
        $config = new Zend_Config_Ini(APPLICATION_PATH . '/configs/application.ini', APPLICATION_ENV);
        $email_config = array('auth' => 'login',
            'username' => $config->email->username,
            'password' => $config->email->password,
            'ssl' => 'tls',
            'port' => 587);

        $transport = new Zend_Mail_Transport_Smtp($config->email->server, $email_config);

        $mail = new Zend_Mail();
        $mail->setBodyHtml($msgBody);
        $mail->setFrom($from);
        $mail->addTo($to);
        $mail->setSubject($subject);
        try {
            $mail->send($transport);
        } catch (Exception $e) {
            $mail_error_msg = Zend_Json::encode($e->getMessage());
        }
    }

}
