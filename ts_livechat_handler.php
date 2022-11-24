<?php

    require('ts_framework.php');

    class Handler extends Ts_Framework {

        public static function Setup()
        {
            session_start();
            require('ts_config.php');
            $_Lang = json_decode(file_get_contents('ts_language.json'), true);
            $lang = $_Lang['langs'];
            self::$_Lang = $lang[$_Lang['default']];
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
                case 'CheckChatStatus':
                    Handler::RegisterOutput('isInChat', Program::CheckChatStatus());
                    Handler::Output();
                    break;
                case 'SendMessage':
                    Program::SendMessage();
                    break;
                case 'GetChatMessages':
                    Program::GetChatMessages();
                    break;
                case 'AddNotify':
                    Program::AddNotify();
                    break;
                case 'GetUnseenMessages':
                    Program::GetUnseenMessages(false);
                    Program::GetChatMessages();
                    break;
                case 'LeaveChat':
                    Program::LeaveChat();
                    break;
            }
        }
    }

    class Program {

        public static function GetChatMessages()
        {
            if(Program::CheckChatStatus())
            {
                if(Program::GetChatStatus()) Program::LeaveChat();
                $query = Handler::SendRequest('SELECT * FROM livechatmessages WHERE id_chat="'.Program::GetChatID().'"');
                if(Handler::isSetRequestError($query)) return false;
                $messages = array();
                $owner = array();
                $i = 0;
                $unseen = 0;
                while($row = mysqli_fetch_assoc($query['Query']))
                {
                    Handler::RegisterOutput('Temp', $row['id_employee']);
                    if($row['id_employee'] === NULL)
                    {
                        $owner[$i] = '0';
                    } else {
                        $owner[$i] = '1';
                        if($row['seen'] == 0)
                        {
                            $unseen++;
                        }
                    }
                    $i++;
                    array_push($messages, $row['message']);
                }
                Handler::RegisterOutput('Notifies', Handler::GetSavedValue('ts_notifies'));
                Handler::RegisterOutput('Messages', $messages);
                Handler::RegisterOutput('MessageOwners', $owner);
                Handler::RegisterOutput('Unseen', $unseen);
                Handler::Output();
                return true;
            } else {
                Handler::RegisterOutput('Error', '1');
                Handler::RegisterOutput('ErrorCode', Handler::GetErrorCode(3));
                Handler::Output();
                return false;
            }
        }

        public static function SendMessage()
        {
            $message = Handler::SafetizeString(Handler::GetPostParameter('message'));
            if(!isset($message))
            {
                Handler::RegisterOutput('Error', '1');
                Handler::RegisterOutput('ErrorCode', Handler::GetErrorCode(1));
                Handler::Output();
                return false;
            }
            if(strlen($message) > 256 || strlen($message) < 1) return false;
            if(Program::CheckChatStatus())
            {
                if(Program::GetChatStatus()) Program::LeaveChat();
                if(Handler::GetValueIsSaved('ts_lastMessage'))
                { 
                    if(time() - Handler::GetSavedValue('ts_lastMessage') < 2)
                    {
                        Handler::RegisterOutput('MessageSent', '0');
                        Handler::Output();
                        return false;
                    }
                }
                Handler::SaveValue('ts_lastMessage', time());
                $query = Handler::SendRequest('INSERT INTO livechatmessages VALUES (default, "'.Program::GetChatID().'", null, "'.$message.'", false)');
                if(Handler::isSetRequestError($query)) return false;
                Handler::RegisterOutput('MessageSent', '1');
                Handler::Output();
                return true;
            } else {
                Program::JoinChat($message);
            }
        }

        public static function JoinChat($message)
        {
            if(Program::CheckChatStatus()) return false;
            if(Program::GetChatStatus()) Program::LeaveChat();
            /*if(Program::GetOnlineEmployees() == 0)
            {
                Program::SendFakeEmployeeMessage($_Lang['noEmployeeOnline']);
                return false;
            }*/
            Handler::SaveValue('ts_isInChat', true);
            $query = Handler::SendRequest('INSERT INTO livechats VALUES (default, 1, now(), null)');
            if(Handler::isSetRequestError($query)) return false;
            $query = Handler::SendRequest('SELECT * FROM livechats ORDER BY id_chat DESC LIMIT 1');
            if(Handler::isSetRequestError($query)) return false;
            if($query['Count'] > 0)
            {
                while($row = mysqli_fetch_assoc($query['Query']))
                {
                    Handler::SaveValue('ts_chatid', $row['id_chat']);
                }
            }
            $query = Handler::SendRequest('SELECT * FROM employees WHERE id_employee="1"');
            if(Handler::isSetRequestError($query)) return false;
            $employeeName = "none";
            if($query['Count'] > 0)
            {
                while($row = mysqli_fetch_assoc($query['Query']))
                {
                    $employeeName = $row['visibleName'];
                }
            }
            Handler::RegisterOutput('JoinedChat', 1);
            Handler::RegisterOutput('employeeName', $employeeName);
            Program::SendMessage($message);
            Program::SendFakeEmployeeMessage(Handler::$_Lang['afterDefaultMessage']);
            return true;
        }

        public static function GetUnseenMessages($generateOutput)
        {
            if(!Program::CheckChatStatus())
            {
                Handler::RegisterOutput('Error', '1');
                Handler::RegisterOutput('ErrorCode', Handler::GetErrorCode(3));
                if($generateOutput) Handler::Output();
                return false;
            }
            if(Program::GetChatStatus()) Program::LeaveChat();
            $query = Handler::SendRequest('SELECT * FROM livechatmessages WHERE id_chat="'.Program::GetChatID().'" AND seen=false AND id_employee=1');
            if(Handler::isSetRequestError($query)) return false;
            $messages = array();
            if($query['Count'] > 0)
            {
                while($row = mysqli_fetch_assoc($query['Query']))
                {
                    array_push($messages, $row['message']);
                }
            }
            $query = Handler::SendRequest('UPDATE livechatmessages SET seen=true WHERE id_chat="'.Program::GetChatID().'" AND seen=false AND id_employee=1');
            if(Handler::isSetRequestError($query)) return false;
            Handler::RegisterOutput('NewMessages', $messages);
            if($generateOutput) Handler::Output();
            return true;
        }

        public static function CheckChatStatus()
        {
            return Handler::GetSavedValue('ts_isInChat');
        }

        public static function GetChatID()
        {
            return Handler::GetSavedValue('ts_chatid');
        }

        public static function GetChatStatus()
        {
            if(Program::CheckChatStatus())
            {
                $query = Handler::SendRequest('SELECT * FROM livechats WHERE id_chat="'.Program::GetChatID().'" AND endDate IS NULL');
                if(Handler::isSetRequestError($query)) return false;
                if($query['Count'] != 0)
                {
                    return false;
                } else {
                    return true;
                }
            }
        }

        public static function LeaveChat()
        {
            if(Program::GetChatStatus())
            {
                $query = Handler::SendRequest('UPDATE livechats SET endDate=now() WHERE id_chat="'.Program::GetChatID().'"');
            }
            if(Program::CheckChatStatus())
            {
                Handler::RegisterOutput('Left', 1);
            } else {
                Handler::RegisterOutput('Left', 0);
            }
            Handler::RemoveSavedValue('ts_isInChat');
            Handler::RemoveSavedValue('ts_chatid');
            Handler::RemoveSavedValue('ts_notifies');
            Handler::RemoveSavedValue('ts_lastMessage');
            Handler::Output();
        }

        public static function AddNotify()
        {
            $message = Handler::GetPostParameter('message');
            if(isset($message))
            {
                $notifies = Handler::GetSavedValue('ts_notifies');
                if(!$notifies)
                {
                    Handler::SaveValue('ts_notifies', array());
                    $notifies = array();
                }
                array_push($notifies, $message);
                Handler::SaveValue('ts_notifies', $notifies);
                return true;
            } else {
                Handler::RegisterOutput('Error', '1');
                Handler::Output();
                return false;
            }
        }

        public static function SendFakeEmployeeMessage($message)
        {
            $message = Handler::SafetizeString($message);
            $query = Handler::SendRequest('INSERT INTO livechatmessages VALUES(default, "'.Program::GetChatID().'", 1, "'.$message.'", 0)');
            if(Handler::isSetRequestError($query)) return false;
            return true;
        }

        public static function SelectEmployee()
        {
            $query = Handler::SendRequest('SELECT * FROM livechatqueue ASC LIMIT 1');
            $Employee = array();
            return $Employee;
        }

        public static function GetOnlineEmployees()
        {
            $query = Handler::SendRequest('SELECT * FROM livechatqueue');
            return $query['Count'];
        }

    }

    Handler::Setup();

?>