
class App {
    
    static master_source = '.';
    static livechat_opened = false;
    static livechat_locked = true;
    static livechat_everOpened = false;
    static notifies = 0;
    static SentDefault = false;
    static app_handler = App.master_source + "/ts_livechat_handler.php";
    static language_source = App.master_source + "/ts_language.json?cache=" + (new Date().getTime());
    static css_source = App.master_source + "/ts_livechat.css";
    static css_element;
    static sounds = [new Audio(App.master_source + '/sounds/ts_message.wav'), new Audio(App.master_source + '/sounds/ts_send.wav')];
    static lang = [];
    static lastMessage = "";
    static writtenMessage = "";
    static timerLimit = 2;
    static timer = App.timerLimit;
    static doLogs = true;
    static myMessages = [];
    static someoneMessages = [];
    static notifiesMessages = [];
    static openAnimationDuration = 500;

    constructor(source) {
        App.master_source = source;
    }

    static Setup()
    {
        for(var i = 0; i < App.sounds.length; i++)
        {
            App.sounds[i].preload = 'auto';
        }
        App.css_element = document.createElement("link");
        App.css_element.setAttribute('rel', 'stylesheet');
        App.css_element.setAttribute('href', App.css_source);
        document.querySelector('head').appendChild(App.css_element);
        App.Init();
        var main = document.createElement("div");
        document.querySelector('body').appendChild(main);
        main.innerHTML = "<div id='ts_livechat'><div id='ts_livechat_button' onclick='App.OpenLiveChat();'><span>&#128172;</span><div id='ts_livechat_button_notify'>5</div></div><div id='ts_livechat_field'><div id='ts_livechat_field_top'></div><div id='ts_livechat_field_content_hider'></div><div id='ts_livechat_field_content'><div id='ts_livechat_scrolldown' onclick='App.ScrollDown();'></div></div><div id='ts_livechat_field_bottom'><div id='ts_livechat_field_bottom_message'><input type='text' id='ts_livechat_field_bottom_messageInput' autocomplete='off' minlength=1 maxlength=256><span onclick='App.SendMessage()'>></span></div></div></div></div></div>";
        App.UpdateNotifies();
        App.CreateEvents();
        return true;
    }

    static Init()
    {
        App.livechat_locked = true;
        $.ajax(
        {
            type: "GET",
            url: App.language_source,
            async: true,
            xhrFields: {
                withCredentials: true
            },
            success : function(text)
            {
                App.lang = text.langs[text.default];
                App.livechat_locked = false;
                    
                $.post(App.app_handler,
                {
                    "type" : "GetChatMessages"
                },
                function(data, status)
                {
                    let json = JSON.parse(data);
                    if(json.Error != 1)
                    {
                        App.SentDefault = true;
                        App.AddSomeoneMessage(App.lang['defaultMessage'], false);
                        for(var i = 0; i < json.Messages.length; i++)
                        {
                            if(json.MessageOwners[i] == 0)
                            {
                                App.myMessages.push(json.Messages[i]);
                                App.AddMyMessage(json.Messages[i]);
                            } else {
                                App.someoneMessages.push(json.Messages[i]);
                                App.AddSomeoneMessage(json.Messages[i], false);
                            }
                        }
                        for(var i = 0; i < json.Notifies.length; i++)
                        {
                            App.notifiesMessages.push(json.Notifies[i]);
                            App.AddChatNotify(json.Notifies[i], false);
                        }
                        App.notifies = json.Unseen;
                        App.UpdateNotifies();
                        App.AddChatNotify(App.lang['returnedToChat'], false);
                    } else {
                        window.addEventListener("click", function() {
                            if(!App.SentDefault)
                            {
                                App.AddSomeoneMessage(App.lang['defaultMessage'], true);
                                App.SentDefault = true;
                            }
                        });
                        document.getElementById('ts_livechat_field').addEventListener("click", function() {
                            if(App.notifies > 0)
                            {
                                App.notifies = 0;
                                App.UpdateNotifies();
                            } 
                        });
                    }
                });
            }
        });
        return true;
    }

    static CreateEvents()
    {
        document.getElementById('ts_livechat_field_bottom_messageInput').addEventListener("keypress", function(event)
        {
            if(event.key == "Enter")
            {
                App.SendMessage();
            }
        });
        document.getElementById('ts_livechat_field_bottom_messageInput').addEventListener("keydown", function(event)
        {
            if(event.key == "ArrowUp")
            {
                App.writtenMessage = document.getElementById('ts_livechat_field_bottom_messageInput').value;
                if(App.lastMessage.length > 1) 
                {
                    document.getElementById('ts_livechat_field_bottom_messageInput').value = App.lastMessage;
                }
            }
            if(event.key == "ArrowDown")
            {
                document.getElementById('ts_livechat_field_bottom_messageInput').value = App.writtenMessage;
            }
            
        });
    }

    static Listen()
    {
        var update = setInterval(function(){
            $.post(App.app_handler,
            {
                "type" : "GetUnseenMessages"
            },
            function(data, status)
            {
                let json = JSON.parse(data);
                if(json.NewMessages != false && json.Error != 1)
                {
                    for(var i = 0; i < json.NewMessages.length; i++)
                    {
                        App.someoneMessages.push(json.NewMessages[i]);
                        App.AddSomeoneMessage(json.NewMessages[i], true);
                    }
                }
                if(json.Error != 1)
                {
                    let tempMessages = [];
                    let tempNotifies = [];
                    let tempSomeoneMessages = [];
                    for(var i = 0; i < json.Messages.length; i++)
                    {
                        if(json.MessageOwners[i] == 0)
                        {
                            tempMessages.push(json.Messages[i]);
                        } else {
                            tempSomeoneMessages.push(json.Messages[i]);
                        }
                    }
                    tempNotifies = json.Notifies;
                    if(App.myMessages.length < tempMessages.length)
                    {
                        let l = tempMessages.length - App.myMessages.length;
                        for(var i = tempMessages.length-l; i < tempMessages.length; i++)
                        {
                            App.AddMyMessage(tempMessages[i]);
                        }
                        App.myMessages = tempMessages;
                    }
                    if(App.someoneMessages.length < tempSomeoneMessages.length)
                    {
                        let l = tempSomeoneMessages.length - App.someoneMessages.length;
                        for(var i = tempSomeoneMessages.length-l; i < tempSomeoneMessages.length; i++)
                        {
                            App.AddSomeoneMessage(tempSomeoneMessages[i]);
                        }
                        App.someoneMessages = tempSomeoneMessages;
                    }
                    if(App.notifiesMessages.length < tempNotifies.length)
                    {
                        let l = tempNotifies.length - App.notifiesMessages.length;
                        for(var i = tempNotifies.length-l; i < tempNotifies.length; i++)
                        {
                            App.AddChatNotify(tempNotifies[i], false);
                        }
                        App.notifiesMessages = tempNotifies;
                    }
                }
            }
        );
        }, 1000);
    }
    
    static OpenLiveChat()
    {
        if(App.livechat_locked) return;
        if(!App.livechat_everOpened)
        {
            App.Listen();
            App.livechat_everOpened = true;
        }
        document.getElementById('ts_livechat_field').style.animationName = "openLiveChat";
        App.livechat_locked = true;
        if(App.livechat_opened)
        {
            document.getElementById('ts_livechat_field').style.animationDirection = "reverse";
            let timer = setInterval(function()
            {
                clearInterval(timer);
                document.getElementById('ts_livechat_field').style.display = 'none';
            }, App.openAnimationDuration);
        } else {
            document.getElementById('ts_livechat_field').style.display = 'block';
            document.getElementById('ts_livechat_field').style.animationDirection = "normal";
            if(App.notifies > 0)
            {
                App.notifies = 0;
                App.UpdateNotifies();
            } 
            App.ScrollDown();
        }
        let timer2 = setInterval(function()
        {
            clearInterval(timer2);
            document.getElementById('ts_livechat_field').style.animationName = null;
            App.livechat_locked = false;
        }, App.openAnimationDuration);
        App.livechat_opened = !App.livechat_opened;
    }

    static AddChatNotify(message, saveNotify)
    {
        let liveChatContent = document.getElementById('ts_livechat_field_content');
        let notify = document.createElement('div');
        notify.setAttribute('class', 'ts_livechat_notify');
        notify.innerHTML = '<span>' + message + '</span>';
        liveChatContent.appendChild(notify);
        if(saveNotify)
        {
            App.notifiesMessages.push(message);
            $.post(App.app_handler,
                {
                    "type" : "AddNotify",
                    "message" : message
                },
                function(data, status)
                {}
            );
        }
        App.ScrollDown();
    }

    static AddSomeoneMessage(message, playAudio, addNotifies)
    {
        document.getElementById('ts_livechat_scrolldown').style.display = 'block';
        let element = document.createElement('div');
        element.setAttribute('class', 'ts_livechat_someonemessage');
        let mess = document.createElement('span');
        mess.innerHTML = message;
        element.appendChild(mess);
        document.getElementById('ts_livechat_field_content').appendChild(element);
        element.style.animationName = "newMessage";
        App.ReceiveMessage(playAudio, true, addNotifies);
    }

    static AddMyMessage(message)
    {
        document.getElementById('ts_livechat_scrolldown').style.display = 'block';
        let element = document.createElement('div');
        element.setAttribute('class', 'ts_livechat_mymessage');
        let mess = document.createElement('span');
        mess.innerHTML = message;
        element.appendChild(mess);
        document.getElementById('ts_livechat_field_content').appendChild(element);
        element.style.animationName = "newMessage";
        App.ScrollDown();
    }

    static ReceiveMessage(playAudio, addNotifies)
    {
        if(addNotifies) App.notifies++;
        if(playAudio)
        {
            App.sounds[0].pause();
            App.sounds[0].currentTime = 0;
            App.sounds[0].play();
        }
        App.UpdateNotifies();
    }

    static UpdateNotifies()
    {
        if(App.livechat_opened) App.notifies = 0;
        if(App.notifies > 0)
        {
            if(App.notifies > 99)
            {
                document.getElementById('ts_livechat_button_notify').innerHTML = "99+";
            } else {
                document.getElementById('ts_livechat_button_notify').innerHTML = App.notifies;
            }
            document.getElementById('ts_livechat_button_notify').style.display = 'flex';
        } else {
            document.getElementById('ts_livechat_button_notify').style.display = 'none';
        }
    }

    static ScrollDown()
    {
        let liveChatContent = document.getElementById('ts_livechat_field_content');
        liveChatContent.scrollTop = liveChatContent.scrollHeight;
        if(document.getElementById('ts_livechat_scrolldown').style.display == 'block')
        {
            document.getElementById('ts_livechat_scrolldown').style.display = 'none';
        }
    }

    static isMaximumScrolled()
    {

    }

    static SendMessage()
    {
        let messageObject = document.getElementById('ts_livechat_field_bottom_messageInput');
        let message = messageObject.value;
        if(message.length > 256 || message.length < 1) 
        {
            App.BlockMessage(false); 
            return;
        }
        if(message == " ") 
        {
            App.BlockMessage(false); 
            return;
        }
        var j = 0;
        for(var i = 0; i < message.length; i++)
        {
            if(message.charAt(i) == " ") j++; 
        }
        if(j == message.length) 
        {
            App.BlockMessage(false); 
            return;
        }
        if(App.timer < App.timerLimit)
        {
            App.BlockMessage(true);
            return;
        }
        App.lastMessage = message;
        messageObject.value = '';
        App.AddMyMessage(App.SafetizeString(message));
        App.sounds[1].pause();
        App.sounds[1].currentTime = 0;
        App.sounds[1].play();
        App.timer = 0;
        App.myMessages.push(message);
        $.post(App.app_handler,
            {
                "type" : "SendMessage",
                "message" : message
            },
            function(data, status)
            {
                console.log(data);
                let json = JSON.parse(data);
                if(json.Error == 1) App.Log('Error', App.GetErrorMessage(0));
                if(!json.MessageSent || json.MessageSent == 0)
                {
                    App.Log('Alert', App.GetErrorMessage(1));
                    App.AddChatNotify(App.lang['messageCannotBeDelivered'], false);
                } else {
                    let timer = setInterval(function()
                    {
                        App.timer++;
                        if(App.timer >= App.timerLimit)
                        {
                            clearInterval(timer);
                        }
                    }, 1000);
                    if(json.JoinedChat)
                    {
                        App.AddChatNotify(App.lang['connectedWithEmployee'] + json.employeeName, true);
                    }
                }
            }
        );
    }

    static BlockMessage(showError)
    {
        if(showError)
        {
            document.getElementById('ts_livechat_field_bottom_messageInput').style.animationName = "error";
            let timer = setInterval(function()
            {
                clearInterval(timer);
                document.getElementById('ts_livechat_field_bottom_messageInput').style.animationName = null;
            }, 100);
        }
        return true;
    }

    static LeaveChat()
    {
        $.post(App.app_handler,
            {
                "type" : "LeaveChat",
            },
            function(data, status)
            {
                let json = JSON.parse(data);
                if(json.Error == 1) 
                {
                    App.Log("Error", App.GetErrorMessage(0));
                    return false;
                }
                if(json.Left)
                {
                    App.AddChatNotify(App.lang['disconnected'], false);
                    return true;
                }
            }
        );
    }

    static CloseLiveChat()
    {
        let el = document.getElementById('ts_livechat_field_content_hider');
        el.style.display = 'block';
        el.innerHTML = App.lang['closeConfirm'] + "<button>Yes</button><br><button>No</button>";
    }

    static SafetizeString(string)
    {  
        string = string.replaceAll('`', ' ');
        string = string.replaceAll("'", ' ');
        string = string.replaceAll('"', ' ');
        string = string.replaceAll('--', ' ');
        string = string.replaceAll('<', ' ');
        string = string.replaceAll('>', ' ');

        string = string.split(" ");

        for(var i = 0; i < string.length; i++)
        {
            if(string[i].toLowerCase().startsWith("http://") || string[i].toLowerCase().startsWith("https://"))
            {
                string[i] = "<a href='" + string[i] + "' target='_blank'>" + string[i] + "</a>";
            }
        }

        string = string.join(" ");
        return string;
    }

    static Log(typeOfLog, message)
    {
        if(!App.doLogs) return false;
        switch(typeOfLog)
        {
            case "Alert":
                App.ShowLog(typeOfLog, message, "red", "yellow");
                break;
            case "Error":
                App.ShowLog(typeOfLog, message, "yellow", "red");
                break;
            default:
                App.ShowLog(typeOfLog, message, "green", "none");
                break;
        }
        return true;
    }

    static ShowLog(typeOfLog, message, color, background)
    {
        console.log("%cTicketSystem " + typeOfLog + " : " + message, 'background-color: ' + background + '; color: ' + color);
        return true;
    }

    static GetErrorMessage(code)
    {
        switch(code)
        {
            case 0:
                return "Server returned error and query cannot be completed (0x0)"; 
                break;
            case 1:
                return "Server probably returned error, so query cannot be completed but server doesn't make any changes. (1x0)";
                break;
            default:
                return "Something went wrong but I don't have nothing to show to you..";
                break;
        }
    }

}

let app = new App('.');

$(document).ready(function() {
    App.Setup();
});