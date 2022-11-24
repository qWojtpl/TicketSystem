
class SetupApp {

    static progressBarElement;
    static contentHiderElement;
    static contentElement;
    static allElements = 6; // counted from 0
    static currentElement = 0;
    static options = [];
    static preset = ["Selected language:","Log messages:","LiveChat enabled:","Tickets enabled:","Statistics:","Database info:","","","","Default user:"];

    static Setup()
    {
        SetupApp.progressBarElement = document.getElementById('progress_bar');
        SetupApp.contentHiderElement = document.getElementById('content_hider');
        SetupApp.contentHiderElement.style.display = "none";
        SetupApp.contentElement = document.getElementById('content');
        SetupApp.contentElement.innerHTML = "<h1>Loading..</h1>";
        $.post("ts_setup_handler.php", {
            "type": "GetSetupBlock"
        }, function(data, status) {
            let json = JSON.parse(data);
            if(json.Blocked == 1)
            {
                SetupApp.allElements++;
                SetupApp.currentElement = SetupApp.allElements-1;
                SetupApp.SetProgressBarValue(SetupApp.allElements/SetupApp.currentElement);
                SetupApp.NextPage(true);
            } else {
                SetupApp.SetProgressBarValue(SetupApp.allElements/SetupApp.currentElement);
                SetupApp.NextPage(true);
            }
        });
        return true;
    }

    static SetProgressBarValue(value)
    {
        SetupApp.progressBarElement.style.width = "calc(80%/" + value + ")";
        return true;
    }

    static ChangeContent()
    {
        let a = 0;
        let b = 1;
        SetupApp.contentHiderElement.style.display = "block";
        let timer = setInterval(function() {
            a += 0.01;
            SetupApp.contentHiderElement.style.backgroundColor = "rgba(255,255,255," + a + ")";
            if(a >= 1)
            {
                switch(SetupApp.currentElement)
                {
                    case 1:
                        SetupApp.contentElement.innerHTML = "<h1>Requirements</h1><p>Check the requirements before entering the setup. If something is not ready, prepare it now!</p><div class='content_field'><ul><li>PHP 7.3+</li><li>JavaScript support</li><li>MySQL Database</li><li>jQuery (if you want to use LiveChat, then you must attach newest jQuery to all documents)</li><li>If something is not understandable, please read our documentation!</li></ul></div><button onClick='SetupApp.NextPage(true)'>Next</button>";
                        break;
                    case 2:
                        SetupApp.contentElement.innerHTML = "<h1>Select language</h1><p>You can choose preset or write own language file in editor which will be available after setup in adminpanel. Language will be changed after setup.</p><select id='languageSelect'><option>English</option><option>Polish</option></select><br><button onClick='SetupApp.NextPage(true)'>Next</button><p class='previous' onClick='SetupApp.NextPage(false);'>Previous page..</p>";
                        if(SetupApp.options[0] != null) document.getElementById('languageSelect').value = SetupApp.options[0];
                        break;
                    case 3:
                        SetupApp.contentElement.innerHTML = "<h1>Select functions</h1><p>Select which functions will be available. You can change it later ONLY by turning on setup again, so select it smart!</p><div class='content_field'><label><input type='checkbox' value='logMessages' id='functions0'><span>Log every tickets/livechat conversations</span></label><br><label><input type='checkbox' value='enableLiveChat' id='functions1'><span>Enable LiveChat</span></label><br><label><input type='checkbox' value='enableTickets' id='functions2'><span>Enable tickets</span></label><br><label><input type='checkbox' value='doCharts' id='functions3'><span>Generate employee statistics (will be using Chart.js)</span></label><br></div><button onClick='SetupApp.NextPage(true);'>Next</button><p class='previous' onClick='SetupApp.NextPage(false);'>Previous page..</p>"              
                        if(SetupApp.options[1] != null) document.getElementById('functions0').checked = SetupApp.options[1];
                        if(SetupApp.options[2] != null) document.getElementById('functions1').checked = SetupApp.options[2];
                        if(SetupApp.options[3] != null) document.getElementById('functions2').checked = SetupApp.options[3];
                        if(SetupApp.options[4] != null) document.getElementById('functions3').checked = SetupApp.options[4];
                        break;
                    case 4:
                        SetupApp.contentElement.innerHTML = "<h1>Create database connection</h1><p>Create database connection. You can change it ONLY MANUALLY later in PHP config file.</p> <div class='content_field'> <label> <span>Host</span><br> </label> <input type='text' id='db_host' placeholder='Host'><br> <label> <span>Username</span><br> </label> <input type='text' id='db_user' placeholder='Username'><br> <label> <span>Password</span><br> </label> <input type='password' id='db_password' placeholder='Password'><br> <label> <span>Database</span><br> </label> <input type='text' id='db_database' placeholder='Database'><br> </div> <button onClick='SetupApp.NextPage(true);'>Next</button><p class='previous' onClick='SetupApp.NextPage(false);'>Previous page..</p>";
                        if(SetupApp.options[5] != null) document.getElementById('db_host').value = SetupApp.options[5];
                        if(SetupApp.options[6] != null) document.getElementById('db_user').value = SetupApp.options[6];
                        if(SetupApp.options[7] != null) document.getElementById('db_password').value = SetupApp.options[7];
                        if(SetupApp.options[8] != null) document.getElementById('db_database').value = SetupApp.options[8];
                        break;
                    case 5:
                        SetupApp.contentElement.innerHTML = "<h1>Create admin user</h1><p>Create default user which will have admin permissions. You can add more users (admins or not) later in the adminpanel.</p> <div class='content_field'> <label> <span>Username</span><br> </label> <input type='text' id='admin_user' placeholder='Username'><br> <label> <span>Password</span><br> </label> <input type='password' id='admin_password' placeholder='Password'><br> </div> <button onClick='SetupApp.NextPage(true);'>Next</button><p class='previous' onClick='SetupApp.NextPage(false);'>Previous page..</p>";
                        if(SetupApp.options[9] != null) document.getElementById('admin_user').value = SetupApp.options[9];
                        if(SetupApp.options[10] != null) document.getElementById('admin_password').value = SetupApp.options[10];
                        break;
                    case 6:
                        SetupApp.contentElement.innerHTML = "<h1>Setup ready</h1><p>One more time check options. If you click Submit, then ticketsystem will be ready to use. Setup will be secured with manual-file variable, so you don’t have to delete setup files.</p><p id='output'></p><div class='content_field'> <ul> </ul> </div><button onClick='SetupApp.SendData();'>Submit</button><p class='previous' onClick='SetupApp.NextPage(false);'>Previous page..</p>";;
                        let list = SetupApp.contentElement.children[3].children[0];
                        for(var i = 0; i <= 10; i++)
                        {
                            if(i == 6 || i == 7  || i == 8 || i == 10) continue;
                            var alert = "";
                            var message = SetupApp.options[i].toString();
                            if(message == "") {
                                alert = "<span class='warning'>!</span>";
                                document.querySelector('button').disabled = true;
                            }
                            if(i == 5) {
                                if(SetupApp.options[i].toString() == "" || SetupApp.options[i+1].toString() == "" || SetupApp.options[i+3].toString() == "")
                                {
                                    alert = "<span class='warning'>!</span>";
                                    document.querySelector('button').disabled = true;
                                }
                                message = SetupApp.options[i] + "/" + SetupApp.options[i+1] + "/" + SetupApp.options[i+3];
                            }
                            list.innerHTML = list.innerHTML + "<li>" + SetupApp.preset[i] + " " + message + alert + "</li>";
                        }
                        break;
                    case 7:
                        SetupApp.contentElement.innerHTML = "<h1>Setup is blocked</h1><p>Ticketsystem is now ready to use!</p><button onClick='window.location.href=(`../`)'>Log in to adminpanel</button>";
                        break;
                    }
                let timer2 = setInterval(function() {
                    b -= 0.01;
                    SetupApp.contentHiderElement.style.backgroundColor = "rgba(255,255,255," + b + ")";
                    if(b <= 0)
                    {
                        SetupApp.contentHiderElement.style.display = "none";
                        clearInterval(timer2);
                    }
                }, 10);
                clearInterval(timer);
            }
        }, 10);
    }

    static NextPage(n)
    {
        if(SetupApp.currentElement == SetupApp.allElements && n) return false;
        switch(SetupApp.currentElement)
        {
            case 2:
                SetupApp.options[0] = document.getElementById('languageSelect').value;
                break;
            case 3:
                SetupApp.options[1] = document.getElementById('functions0').checked;
                SetupApp.options[2] = document.getElementById('functions1').checked;
                SetupApp.options[3] = document.getElementById('functions2').checked;
                SetupApp.options[4] = document.getElementById('functions3').checked;
                break;
            case 4:
                SetupApp.options[5] = document.getElementById('db_host').value;
                SetupApp.options[6] = document.getElementById('db_user').value;
                SetupApp.options[7] = document.getElementById('db_password').value;
                SetupApp.options[8] = document.getElementById('db_database').value;
                break;
            case 5:
                SetupApp.options[9] = document.getElementById('admin_user').value;
                SetupApp.options[10] = document.getElementById('admin_password').value;
                break;
        }
        if(n)
        {
            SetupApp.currentElement += 1;
        } else {
            SetupApp.currentElement -= 1;
        }
        SetupApp.SetProgressBarValue(SetupApp.allElements/SetupApp.currentElement);
        SetupApp.ChangeContent();
        return true;
    }

    static SendData()
    {
        $.post('ts_setup_handler.php', {
            "type" : "Setup",
            "Data" : SetupApp.options
        },
        function(data, status)
        {
            console.log(data);
            var json = JSON.parse(data);
            if(json.Error == 1)
            {
                if(json.Blocked == 1)
                {
                    document.getElementById('output').innerHTML = "Setup is already completed!";
                    document.getElementById('output').style.color = "red";
                } else {
                    document.getElementById('output').innerHTML = "Something went wrong! Check your database info and other fields. If problem will not disappear try to reinstall ticketsystem!";
                    document.getElementById('output').style.color = "red";
                }
            }
            if(json.AllDone == 1)
            {
                document.getElementById('output').innerHTML = "Ticketsystem is now ready! Log in to adminpanel in default ticketsystem directory (installPath/ticketsystem/)";
                document.getElementById('output').style.color = "green";
            }
        });
    }

}

$(document).ready(function() {
    SetupApp.Setup();
});

window.onbeforeunload = function()
{
    return "Are you sure you would like to leave? Changes aren't saved..";
}