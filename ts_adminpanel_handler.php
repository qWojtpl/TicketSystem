<?php

    require('ts_framework.php');

    class Handler extends Ts_Framework {

        static $LangList;

        public static function Setup()
        {
            session_start();
            require('ts_config.php');
            $_Lang = json_decode(file_get_contents('ts_language.json'), true);
            $lang = $_Lang['langs'];
            self::$_Lang = $lang[$_Lang['default']];
            self::$LangList = array_keys($lang);
            self::$conn = mysqli_connect($_Database['host'], $_Database['user'], $_Database['password'], $_Database['database']);
            if(!self::$conn)
            {
                Handler::RegisterOutput('Error', '1');
                Handler::RegisterOutput('ErrorCode', Handler::GetErrorCode(0));
                Handler::Output();
            } else {
                Handler::Begin();
            }
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
                case 'GetAuth':
                    if(Program::ConfirmAuth())
                    {
                        Handler::RegisterOutput('authConfirmed', 1);
                        Handler::RegisterOutput('visibleName', Handler::GetSavedValue('tsAP_visibleName'));
                        Handler::RegisterOutput('permissions', Program::GetUserPermissions(Handler::GetSavedValue('tsAP_login')));
                    } else {
                        Handler::RegisterOutput('authConfirmed', 0);
                    }
                    Handler::Output();
                    break;
                case 'Login':
                    Program::Login();
                    break;
                case 'Logout':
                    Program::Logout();
                    break;
                case 'GetEmployees':
                    Handler::RegisterOutput('employees', Program::GetEmployees());
                    Handler::Output();
                    break;
                case 'CreateEmployee':
                    Program::CreateEmployee();
                    break;
                case 'GetUserPermitGroups':
                    Handler::RegisterOutput('groups', Program::GetUserPermitGroups(Handler::GetSavedValue('tsAP_login')));
                    Handler::Output();
                    break;
                case 'GetGroups':
                    Handler::RegisterOutput('groups', Program::GetGroups());
                    Handler::Output();
                    break;
                case 'CreateGroup':
                    Program::CreateGroup();
                    break;
                case 'SaveLanguage':
                    Program::SaveLanguage();
                    break;
                case 'GetUserLanguage':
                    Handler::RegisterOutput('UserLanguage', Program::GetUserLanguage());
                    Handler::Output();
                    break;
                case 'SetDefaultLanguage':
                    Program::SetDefaultLanguage();
                    break;
                case 'GetLoginHistory':
                    Handler::RegisterOutput('LoginHistory', Program::GetLoginHistory(Handler::GetSavedValue('tsAP_login'), 128));
                    Handler::Output();
                    break;
                case 'GetBans':
                    Handler::RegisterOutput('Bans', Program::GetBans());
                    Handler::Output();
                    break;
                default:
                    Handler::RegisterOutput('Error', 1);
                    Handler::RegisterOutput('ErrorCode', Handler::GetErrorCode(1));
                    Handler::Output();
                    break;
            }
        }
    }

    class Program {
        public static function ConfirmAuth()
        {
            if(Handler::GetSavedValue('tsAP_auth') == 1)
            {
                return true;
            } else {
                return false;
            }
        }

        public static function Login()
        {
            if(isset($_COOKIE['ts_LoginAwait']))
            {
                Handler::RegisterOutput('LoginConfirmed', false);
                Handler::RegisterOutput('WaitError', true);
                Handler::Output();
                return false;
            }
            $query = Handler::SendRequest('SELECT * FROM employees');
            if($query['Count'] > 0)
            {
                while($row = mysqli_fetch_assoc($query['Query']))
                {
                    if($row['login'] == Handler::GetPostParameter('login'))
                    {
                        if($row['password'] != Handler::GetPostParameter('password'))
                        {
                            Handler::SendRequest('INSERT INTO login_logs VALUES(default, '.$row['id_employee'].', "'.Handler::GetUserIP().'", now(), 0)');
                        } else {
                            Handler::SaveValue('tsAP_auth', 1);
                            Handler::SaveValue('tsAP_visibleName', $row['visibleName']);
                            Handler::SaveValue('tsAP_login', $row['login']);
                            Handler::RegisterOutput('LoginConfirmed', true);
                            Handler::RegisterOutput('visibleName', $row['visibleName']);
                            Handler::RegisterOutput('permissions', Program::GetUserPermissions($row['login']));
                            Handler::SendRequest('INSERT INTO login_logs VALUES(default, '.$row['id_employee'].', "'.Handler::GetUserIP().'", now(), 1)');
                            Handler::SaveValue('tsAP_loginSessionID', mysqli_insert_id(Handler::$conn));
                            Handler::Output();
                            return true;
                        }
                    }
                }
            }
            setcookie('ts_LoginAwait', 1, time() + 3);
            Handler::RegisterOutput('LoginConfirmed', false);
            Handler::Output();
            return false;
        }

        public static function Logout()
        {
            Handler::RemoveSavedValue('tsAP_auth');
            Handler::RemoveSavedValue('tsAP_visibleName');
            Handler::RemoveSavedValue('tsAP_login');
            Handler::RemoveSavedValue('tsAP_loginSessionID');
            Handler::RegisterOutput('Logout', true);
            Handler::Output();
        }

        public static function GetUserPermissions($user)
        {
            $permissions = array();
            $query = Handler::SendRequest("SELECT permission FROM groups_permissions JOIN employees_groups USING (id_group) WHERE employees_groups.id_employee=(SELECT id_employee FROM employees WHERE login='".$user."') UNION SELECT permission FROM employees_permissions WHERE employees_permissions.id_employee=(SELECT id_employee FROM employees WHERE login='".$user."');");
            if($query['Count'] > 0)
            {
                while($row = mysqli_fetch_assoc($query['Query']))
                {
                    array_push($permissions, $row['permission']);
                }
            }
            return $permissions;
        }

        public static function UserHasPermission($permission)
        {
            return in_array($permission, Program::GetUserPermissions(Handler::GetSavedValue('tsAP_login')));
        }

        public static function GetEmployees()
        {
            $arr = array();
            if(!Program::ConfirmAuth())
            {
                Handler::RegisterOutput('authConfirmed', 0);
                return $arr;
            }
            Handler::RegisterOutput('authConfirmed', 1);
            if(Program::UserHasPermission("employees.view") || Program::UserHasPermission("all"))
            {
                $query = Handler::SendRequest('SELECT * FROM employees');
                if($query['Count'] > 0)
                {
                    while($row = mysqli_fetch_assoc($query['Query']))
                    {
                        $data = array();
                        $i = $row['id_employee'];
                        if(Handler::GetPostParameter('EmployeeLogin') != null)
                        {
                            if($row['login'] != Handler::GetPostParameter('EmployeeLogin'))
                            {
                                continue;
                            }
                        }
                        $query2 = Handler::SendRequest('SELECT DISTINCT name FROM groups JOIN employees_groups USING (id_group) JOIN employees USING (id_employee) WHERE id_employee = "'.$i.'" ORDER BY groups.priority DESC;');
                        $groups = array();
                        $j = 1;
                        if($query2['Count'] > 0)
                        {
                            while($row2 = mysqli_fetch_assoc($query2['Query']))
                            {
                                $groups[$j-1][count($groups[$j-1])] = $row2['name'];
                                $j++;
                            }
                        } else {
                            $groups[$j-1][0] = "-";
                        }
                        $query2 = Handler::SendRequest('SELECT DISTINCT permission FROM employees_permissions WHERE id_employee = "'.$i.'"');
                        $extra_permissions = array();
                        $j = 1;
                        if($query2['Count'] > 0)
                        {
                            while($row2 = mysqli_fetch_assoc($query2['Query']))
                            {
                                $extra_permissions[$j-1][count($extra_permissions[$j-1])] = $row2['permission'];
                                $j++;
                            }
                        } else {
                            $extra_permissions[$j-1][0] = "-";
                        }
                        $priority = Program::GetUserMaxPriority($row['login']);
                        array_push($data, $row['login']);
                        array_push($data, $row['visibleName']);
                        array_push($data, $groups);
                        array_push($data, $extra_permissions);
                        array_push($data, $priority);
                        array_push($arr, $data);
                    }
                }
                return $arr;
            } else {
                Handler::RegisterOutput('PermissionError', true);
                return $arr;
            }
        }

        public static function GetGroups()
        {
            $arr = array();
            if(!Program::ConfirmAuth())
            {
                Handler::RegisterOutput('authConfirmed', 0);
                return $arr;
            }
            Handler::RegisterOutput('authConfirmed', 1);
            if(Program::UserHasPermission("groups.view") || Program::UserHasPermission("all"))
            {
                $query = Handler::SendRequest('SELECT * FROM groups ORDER BY groups.priority DESC');
                if($query['Count'] > 0)
                {
                    $i = 1;
                    $data = array();
                    while($row = mysqli_fetch_assoc($query['Query']))
                    {
                        $data[$i-1][0] = $row['name'];
                        $data[$i-1][1] = $row['priority'];
                        $query2 = Handler::SendRequest('SELECT DISTINCT permission FROM groups_permissions WHERE id_group = "'.$i.'"');
                        $permissions = array();
                        while($row2 = mysqli_fetch_assoc($query2['Query']))
                        {
                            array_push($permissions, $row2['permission']);
                        }
                        if(count($permissions) == 0)
                        {
                            $permissions[0] = "-";
                        }
                        $data[$i-1][2] = $permissions;
                        array_push($arr, $data[$i-1]);
                        $i++;
                    }
                }
                return $arr;
            } else {
                Handler::RegisterOutput('PermissionError', true);
                return $arr;
            }
        }

        public static function CreateEmployee()
        {
            if(!Program::ConfirmAuth())
            {
                Handler::RegisterOutput('authConfirmed', 0);
                Handler::Output();
                return null;
            }
            Handler::RegisterOutput('authConfirmed', 1);
            if(Program::UserHasPermission('employees.add') || Program::UserHasPermission('all'))
            {
                if(Handler::GetPostParameter('login') === null || Handler::GetPostParameter('visibleName') === null || Handler::GetPostParameter('password') === null)
                {
                    Handler::RegisterOutput('Error', 1);
                    Handler::RegisterOutput('FunctionErrorCode', 1);
                    Handler::Output();
                    return false;
                }
                $newEmployeeInfo = array(Handler::SafetizeString(Handler::GetPostParameter('login')), Handler::SafetizeString(Handler::GetPostParameter('visibleName')), Handler::SafetizeString(Handler::GetPostParameter('password')));
                $newEmployeeGroups = Handler::GetPostParameter('groups');
                $newEmployeePermissions = Handler::GetPostParameter('permissions');
                $permitGroups = Program::GetUserPermitGroups(Handler::GetSavedValue('tsAP_login'));
                $permitPermissions = Program::GetUserPermissions(Handler::GetSavedValue('tsAP_login'));
                $temp = array();
                for($i = 0; $i < count($newEmployeeGroups); $i++)
                {
                    if(!in_array($newEmployeeGroups[$i], $temp))
                    {
                        array_push($temp, $newEmployeeGroups[$i]);
                    }
                }
                $newEmployeeGroups = $temp;
                $temp = array();
                for($i = 0; $i < count($newEmployeePermissions); $i++)
                {
                    if(!in_array($newEmployeePermissions[$i], $temp))
                    {
                        array_push($temp, $newEmployeePermissions[$i]);
                    }
                }
                $newEmployeePermissions = $temp;
                for($i = 0; $i < count($newEmployeeGroups); $i++)
                {
                    if(!in_array($newEmployeeGroups[$i], $permitGroups))
                    {
                        Handler::RegisterOutput('Error', 1);
                        Handler::RegisterOutput('FunctionErrorCode', 3);
                        Handler::Output();
                        return false;
                    }
                }
                for($i = 0; $i < count($newEmployeePermissions); $i++)
                {
                    if(!in_array('all', $permitPermissions) && !in_array($newEmployeePermissions[$i], $permitPermissions))
                    {
                        Handler::RegisterOutput('Error', 1);
                        Handler::RegisterOutput('FunctionErrorCode', 4);
                        Handler::Output();
                        return false;
                    }
                }
                if(strlen($newEmployeeInfo[0]) < 2 || strlen($newEmployeeInfo[1]) < 2)
                {
                    Handler::RegisterOutput('Error', 1);
                    Handler::RegisterOutput('FunctionErrorCode', 2);
                    Handler::Output();
                    return false;
                }
                $query = Handler::SendRequest('SELECT * FROM employees WHERE login="'.$newEmployeeInfo[0].'"');
                if($query['Count'] > 0)
                {
                    Handler::RegisterOutput('Error', 1);
                    Handler::RegisterOutput('FunctionErrorCode', 0);
                    Handler::Output();
                    return false;
                }
                $query = Handler::SendRequest('INSERT INTO employees VALUES(default, "'.$newEmployeeInfo[1].'", "'.$newEmployeeInfo[0].'", "'.$newEmployeeInfo[2].'", now())');
                $lastid = mysqli_insert_id(Handler::$conn);
                $groupID = array();
                for($i = 0; $i < count($newEmployeeGroups); $i++)
                {
                    $query = Handler::SendRequest('SELECT groups.id_group FROM groups WHERE groups.name = "'.$newEmployeeGroups[$i].'"');
                    if($query['Count'] == 0)
                    {
                        Handler::RegisterOutput('Error', 1);
                        Handler::RegisterOutput('FunctionErrorCode', 3);
                        Handler::Output();
                        return false;
                    } else {
                        while($row = mysqli_fetch_assoc($query['Query']))
                        {
                            $groupID[$i] = $row['id_group'];
                        }
                    }
                }
                for($i = 0; $i < count($newEmployeeGroups); $i++)
                {
                    $query = Handler::SendRequest('INSERT INTO employees_groups VALUES("'.$lastid.'", "'.$groupID[$i].'")');
                }
                for($i = 0; $i < count($newEmployeePermissions); $i++)
                {
                    $query = Handler::SendRequest('INSERT INTO employees_permissions VALUES("'.$newEmployeePermissions[$i].'", "'.$lastid.'")');
                }
                Handler::RegisterOutput('CreatedEmployee', 1);
                Handler::Output();
                return true;
            } else {
                Handler::RegisterOutput('PermissionError', true);
                Handler::Output();
                return null;
            }
        }

        public static function CreateGroup()
        {
            if(!Program::ConfirmAuth())
            {
                Handler::RegisterOutput('authConfirmed', 0);
                Handler::Output();
                return null;
            }
            Handler::RegisterOutput('authConfirmed', 1);
            if(Program::UserHasPermission('groups.add') || Program::UserHasPermission('all'))
            {
                if(Handler::GetPostParameter('name') === null)
                {
                    Handler::RegisterOutput('Error', 1);
                    Handler::RegisterOutput('FunctionErrorCode', 1);
                    Handler::Output();
                    return false;
                }
                $newGroupName = Handler::GetPostParameter('name');
                $newGroupPriority = Handler::GetPostParameter('priority');
                $newGroupPermissions = Handler::GetPostParameter('permissions');
                $permitPermissions = Program::GetUserPermissions(Handler::GetSavedValue('tsAP_login'));
                $temp = array();
                for($i = 0; $i < count($newGroupPermissions); $i++)
                {
                    if(!in_array($newGroupPermissions[$i], $temp))
                    {
                        array_push($temp, $newGroupPermissions[$i]);
                    }
                }
                $newGroupPermissions = $temp;
                for($i = 0; $i < count($newGroupPermissions); $i++)
                {
                    if(!in_array('all', $permitPermissions) && !in_array($newGroupPermissions[$i], $permitPermissions))
                    {
                        Handler::RegisterOutput('Error', 1);
                        Handler::RegisterOutput('FunctionErrorCode', 4);
                        Handler::Output();
                        return false;
                    }
                }
                if(intval($newGroupPriority) > Program::GetUserMaxPriority(Handler::GetSavedValue('tsAP_login')) || intval($newGroupPriority) < 0)
                {
                    Handler::RegisterOutput('Error', 1);
                    Handler::RegisterOutput('FunctionErrorCode', 4);
                    Handler::Output();
                    return false;
                }
                if(strlen($newGroupName) < 2)
                {
                    Handler::RegisterOutput('Error', 1);
                    Handler::RegisterOutput('FunctionErrorCode', 2);
                    Handler::Output();
                    return false;
                }
                $query = Handler::SendRequest('SELECT * FROM groups WHERE name="'.$newGroupName.'"');
                if($query['Count'] > 0)
                {
                    Handler::RegisterOutput('Error', 1);
                    Handler::RegisterOutput('FunctionErrorCode', 0);
                    Handler::Output();
                    return false;
                }
                $query = Handler::SendRequest('INSERT INTO groups VALUES(default, "'.$newGroupName.'", "'.$newGroupPriority.'")');
                $lastid = mysqli_insert_id(Handler::$conn);
                for($i = 0; $i < count($newGroupPermissions); $i++)
                {
                    $query = Handler::SendRequest('INSERT INTO groups_permissions VALUES("'.$newGroupPermissions[$i].'", "'.$lastid.'")');
                }
                Handler::RegisterOutput('CreatedGroup', 1);
                Handler::Output();
                return true;
            } else {
                Handler::RegisterOutput('PermissionError', true);
                Handler::Output();
                return null;
            }
        }

        public static function GetUserPermitGroups($user)
        {
            if(!Program::ConfirmAuth())
            {
                Handler::RegisterOutput('authConfirmed', 0);
                Handler::Output();
                return null;
            }
            $groups = array();
            $query = Handler::SendRequest('SELECT groups.name FROM groups WHERE groups.priority <= (SELECT groups.priority FROM employees_groups JOIN groups USING (id_group) JOIN employees USING (id_employee) WHERE employees.login = "'.$user.'" ORDER BY groups.priority DESC);');
            if($query['Count'] > 0)
            {
                while($row = mysqli_fetch_assoc($query['Query']))
                {
                    array_push($groups, $row['name']);
                }
            }
            Handler::RegisterOutput('maxpriority', Program::GetUserMaxPriority($user));
            return $groups;
        }

        public static function GetUserMaxPriority($user)
        {
            $max = 0;
            $query = Handler::SendRequest('SELECT groups.priority FROM employees_groups JOIN groups USING (id_group) JOIN employees USING (id_employee) WHERE employees.login = "'.$user.'" ORDER BY groups.priority DESC');
            if($query['Count'] > 0)
            {
                while($row = mysqli_fetch_assoc($query['Query']))
                {
                    $max = intval($row['priority']);
                    $max -= 1;
                }
            }
            return $max;
        }

        public static function SaveLanguage()
        {
            if(Handler::GetPostParameter('value') == null)
            {
                Handler::RegisterOutput('Error', 1);
                Handler::Output();
                return false;
            }
            if(!in_array(Handler::GetPostParameter('value'), Handler::$LangList))
            {
                Handler::RegisterOutput('Error', 1);
                Handler::Output();
                return false;
            }
            setcookie('ts_PreferencedLanguage', Handler::GetPostParameter('value'), time() + (10 * 365 * 24 * 60 * 60));
            Handler::RegisterOutput('Saved', 1);
            Handler::Output();
            return true;
        }

        public static function GetUserLanguage()
        {
            if(isset($_COOKIE['ts_PreferencedLanguage']))
            {
                return $_COOKIE['ts_PreferencedLanguage'];
            } else {
                return null;
            }
        }

        public static function SetDefaultLanguage()
        {
            if(!Program::ConfirmAuth())
            {
                Handler::RegisterOutput('authConfirmed', 0);
                Handler::Output();
                return false;
            }
            if(!Program::UserHasPermission('all') && !Program::UserHasPermission('language.change.default'))
            {
                Handler::RegisterOutput('PermissionError', 1);
                Handler::Output();
                return false;
            }
            if(Handler::GetPostParameter('value') == null)
            {
                Handler::RegisterOutput('Error', 1);
                Handler::Output();
                return false;
            }
            if(!in_array(Handler::GetPostParameter('value'), Handler::$LangList))
            {
                Handler::RegisterOutput('Error', 1);
                Handler::Output();
                return false;
            }
            $content = json_decode(file_get_contents('ts_language.json'));
            $content->default = Handler::GetPostParameter('value');
            file_put_contents('ts_language.json', json_encode($content, JSON_PRETTY_PRINT));
            Handler::RegisterOutput('Saved', 1);
            Handler::Output();
            return true;
        }

        public static function GetLoginHistory($user, $limit)
        {
            $history = array();
            if(!Program::ConfirmAuth())
            {
                Handler::RegisterOutput('authConfirmed', 0);
                return $history;
            }
            $query = Handler::SendRequest('SELECT * FROM login_logs WHERE login_logs.id_employee = (SELECT id_employee FROM employees WHERE login="'.$user.'") ORDER BY id_log DESC LIMIT '.$limit);
            if($query['Count'] > 0)
            {
                $i = 0;
                while($row = mysqli_fetch_assoc($query['Query']))
                {
                    $history[$i] = array();
                    $history[$i][0] = $row['date'];
                    $history[$i][1] = $row['ip'];
                    $history[$i][2] = $row['status'];
                    if($row['id_log'] == Handler::GetSavedValue('tsAP_loginSessionID'))
                    {
                        $history[$i][3] = 1;
                    }
                    $i++;
                }
            }
            return $history;
        }

        public static function GetBans()
        {
            $bans = array();
            if(!Program::ConfirmAuth())
            {
                Handler::RegisterOutput('authConfirmed', 0);
                return $bans;
            }
            if(!Program::UserHasPermission('bans.view') && !Program::UserHasPermission('all'))
            {
                Handler::RegisterOutput('PermissionError', 1);
                return $bans;
            }
            $keys = ['email', 'ip', 'cookie', 'username'];
            for($i = 0; $i < count($keys); $i++)
            {
                $query = Handler::SendRequest('SELECT '.$keys[$i].', employees.login, date FROM '.$keys[$i].'_bans JOIN (employees) USING (id_employee)');
                $bans[$keys[$i]] = array();
                if($query['Count'] > 0)
                {
                    $j = 0;
                    while($row = mysqli_fetch_assoc($query['Query']))
                    {
                        array_push($bans[$keys[$i]][$j], $row[$keys[$i]]);
                        array_push($bans[$keys[$i]][$j], $row['employees.login']);
                        array_push($bans[$keys[$i]][$j], $row['date']);
                        $j++;
                    }
                }
            }
            return $bans;
        }
    }

    Handler::Setup();

?>