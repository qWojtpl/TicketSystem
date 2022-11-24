<?php

    require('../ts_framework.php');

    class Handler extends Ts_Framework {

        public static $_Output = array();

        public static function Setup()
        {
            session_start();
            Handler::Begin();
            return true;
        }

        public static function Begin()
        {
            if(Handler::GetPostParameter('type') == null)
            {
                Handler::RegisterOutput('Error', '1');
                Handler::RegisterOutput('ErrorCode', Handler::GetErrorCode(1));
                Handler::Output();
                return false;
            }
            switch(Handler::GetPostParameter('type'))
            {
                case "Setup":
                    Program::SetupTicketSystem();
                    break;
                case "GetSetupBlock":
                    Program::GetSetupBlock(true);
                    break;
            }
        }

    }

    class Program {

        public static function GetSetupBlock($showOutput)
        {
            include('../ts_config.php');
            if($SetupBlocked)
            {
                Handler::RegisterOutput('Blocked', '1');
            } else {
                Handler::RegisterOutput('Blocked', '0');
            }
            if($showOutput) Handler::Output();
            return $SetupBlocked;
        }

        public static function SetupTicketSystem()
        {
            if(Program::GetSetupBlock(false)) 
            {
                Handler::RegisterOutput('Error', '1');
                Handler::RegisterOutput('ErrorCode', 'Setup is blocked');
                Handler::Output();
                return false;
            }
            $options = Handler::GetPostParameter('Data');
            Handler::$conn = mysqli_connect($options[5], $options[6], $options[7], $options[8]);
            if(!Handler::$conn)
            {
                Handler::RegisterOutput('Error', '1');
                Handler::RegisterOutput('ErrorCode', Handler::GetErrorCode(0));
                Handler::Output();
                return false;
            }
            file_put_contents('../ts_config.php', '
<?php 

    // THIS FILE IS AUTO-GENERATED USING SETUP ('.date("Y-m-d H:i:s").')

    $_Database = array(
        "host" => "'.$options[5].'",
        "user" => "'.$options[6].'",
        "password" => "'.$options[7].'",
        "database" => "'.$options[8].'"
    ); 

    $SetupBlocked = true;

?>');
            if(!file_exists('../ts_db.sql'))
            {
                Handler::RegisterOutput('Error', '1');
                Handler::RegisterOutput('ErrorCode', Handler::GetErrorCode(4));
                Handler::Output();
                return false;
            }

            $sql = [];

            $file_sql = file_get_contents('../ts_db.sql');
            $sql = explode(';', $file_sql);

            array_push($sql, 'INSERT INTO groups VALUES(default, "admin", 128)', 'INSERT INTO employees VALUES(default, "Admin", "'.$options[9].'", "'.$options[10].'", now())', 'INSERT INTO employees_groups VALUES(1, 1)', 'INSERT INTO groups_permissions VALUES("all", 1)');

            for($i = 0; $i < count($sql); $i++)
            {
                $query = Handler::SendRequest($sql[$i]);

                if($query['Error'] != null)
                {
                    Handler::RegisterOutput('Error', '1');
                    Handler::RegisterOutput('ErrorCode', Handler::GetErrorCode(2));
                    Handler::Output();
                    return false;
                }
            }

            Handler::RegisterOutput('AllDone', '1');
            Handler::Output();
            return true;
        }
    }

    Handler::Setup();

?>