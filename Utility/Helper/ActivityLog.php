<?php

/**
 * Helper class for EventLog
 *
 */
class Custom_Helper_ActivityLog extends Zend_Controller_Plugin_Abstract {

    public function preDispatch() {


        $request = Zend_Controller_Front::getInstance()->getRequest();
        $RequestUrl = $request->getRequestUri();
        $module = $request->getModuleName();
        $controller = $request->getControllerName();
        $action = $request->getActionName();
        $route = Zend_Controller_Front::getInstance()->getRouter()->getCurrentRouteName();

        $sessionLogin = new Zend_Session_Namespace("SESSION_LOGIN");
//        echo ' $RequestUrl: '.$RequestUrl.'<Br>';
//        echo ' $module: '.$module.'<Br>';
//        echo ' $controller: '.$controller.'<Br>';
//        echo ' $action: '.$action.'<Br>';
//        echo ' $route: '.$route.'<Br>';
//        die;

        if ($route != 'websocket') {
            $dbModelActivityLog = new Default_Model_ActivityLog;
            $data = array(
                'user_id' => $sessionLogin->user_id,
                'user_ip' => $_SERVER['REMOTE_ADDR'],
                'user_country' => '',
                'user_browser' => $_SERVER['HTTP_USER_AGENT'],
                'user_device' => '',
                'user_auth_key' => $sessionLogin->user_auth_key,
                'module_name' => $module,
                'controller_name' => $controller,
                'action_name' => $action,
                'route_name' => $route,
                'request_url' => $RequestUrl,
                'activity_datetime_ist' => new MongoDate(strtotime(date('Ymd H:i:s'))),
                'request_params' => Zend_Json::encode($request->getParams())
            );
            $dbModelActivityLog->addDocument($data);
        }
    }

}
