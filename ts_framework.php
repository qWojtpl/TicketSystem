<?php

    class Ts_Framework {

        public static $_Output = array();
        public static $conn;
        public static $_Lang = array();

        public static function Setup()
        {
            return true;
        }

        public static function Begin()
        {
            return true;
        }

        public static function GetErrorCode($error)
        {
            switch($error)
            {
                case 0:
                    return "Error in connecting with a database..";
                    break;
                case 1:
                    return "A required parametr was not found..";
                    break;
                case 2:
                    return "Found database error..";
                    break;
                case 3:
                    return "Your chat status doesn't agree with the function reguirments..";
                    break;
                case 4:
                    return "Required file not found..";
                    break;
            }
            return "Cannot found message for this error code (".$error.")..";
        }

        public static function Output()
        {
            echo json_encode(self::$_Output);
            return true;
        }

        public static function RegisterOutput($name, $value)
        {
            self::$_Output[$name] = $value;
            return true;
        }

        public static function SaveValue($name, $value)
        {
            $_SESSION[$name] = $value;
            return true;
        }

        public static function GetSavedValue($name)
        {
            if(isset($_SESSION[$name]))
            {
                return $_SESSION[$name];
            } else {
                return false;
            }
        }

        public static function GetValueIsSaved($name)
        {
            if(array_key_exists($name, $_SESSION))
            {
                return true;
            } else {
                return false;
            }
        }

        public static function RemoveSavedValue($name)
        {
            unset($_SESSION[$name]);
            return true;
        }

        public static function GetURLParameter($name)
        {
            return $_GET[$name];
        }

        public static function GetPostParameter($name)
        {
            if(isset($_POST[$name]))
            {
                return $_POST[$name];
            } else {
                return null;
            }
        }

        public static function SendRequest($cmd)
        {
            $query = array();
            $query['Command'] = $cmd;
            if(!$query['Query'] = mysqli_query(Handler::$conn, $cmd))
            {
                $query['Error'] = mysqli_error(Handler::$conn);
            }
            if(gettype($query['Query']) != "boolean") $query['Count'] = mysqli_num_rows($query['Query']);
            return $query;
        }

        public static function SafetizeString($string)
        {
            $string = str_replace('`', ' ', $string);
            $string = str_replace("'", ' ', $string);
            $string = str_replace('"', ' ', $string);
            $string = str_replace('--', ' ', $string);
            $string = str_replace('<', ' ', $string);
            $string = str_replace('>', ' ', $string);

            $string = explode(" ", $string);

            for($i = 0; $i < count($string); $i++)
            {
                if(substr(strtolower($string[$i]), 0, 7) == "http://" || substr(strtolower($string[$i]), 0, 8) == "https://")
                {
                    $string[$i] = "<a href='$string[$i]' target='_blank'>".$string[$i]."</a>";
                }
            }
            
            $string = implode(" ", $string);
            return $string;
        }

        public static function isSetRequestError($query)
        {
            if(isset($query['Error']))
            {
                Handler::RegisterOutput('Error', '1');
                Handler::RegisterOutput('ErrorCode', Handler::GetErrorCode(2));
                Handler::RegisterOutput('Details', $query['Command']);
                Handler::Output();
                return true;
            } else {
                return false;
            }
        }
    }

?>