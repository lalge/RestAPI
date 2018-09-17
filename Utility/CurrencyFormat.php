<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Description of CurrencyFormat
 *
 * @author suraj.varane
 */
class Custom_CurrencyFormat {
    //put your code here
    /**
     * Metod to convert Number to $ currency 
     * @param type $num
     * @return string
     */
    function thousandsCurrencyFormat($num,$doller=TRUE) {
        $x = round($num);
        $x_number_format = number_format($x);
        $x_array = explode(',', $x_number_format);
        $x_parts = array('K', 'M', 'B', 'T');
        $x_count_parts = count($x_array) - 1;
        $x_display = $x;
        $x_display = $x_array[0] . ((int) $x_array[1][0] !== 0 ? '.' . $x_array[1][0] : '');
        //$x_display .= $x_parts[$x_count_parts - 1];
        if ($doller){
            return '$'.$x_display;
        }else{
            return $x_display;
        }
      }
}
