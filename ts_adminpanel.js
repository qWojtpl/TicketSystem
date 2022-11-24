
class AdminPanel {
    static handler = './ts_adminpanel_handler.php';
    static language_source = 'ts_language.json?cache=' + (new Date().getTime());
    static Lang = [];
    static activeNotifies = [];
    static visibleName;
    static UserPermissions = [];
    static AllPermissions = ["employees.view", "employees.edit", "employees.add", "employees.delete", "groups.view", "groups.add", "groups.edit", "groups.delete", "livechat.use", "messages.receive", "messages.send", "logs.view", "bans.add", "bans.view", "bans.remove", "language.edit", "language.change.default", "hotbar.edit", "all"];
    static PermitGroups = [];
    static LangList = [];
    static LangListKeys = [];
    static SelectedLang;
    static DefaultLang;
    static Initialized = false;
    static MaxPriority = 0;
    static EditingEmployee;

    static Setup()
    {
        AdminPanel.Init();
        return true;
    }

    static Init()
    {
        window.addEventListener('resize', function(event) {
            window.scrollTo(0,0);
        }, true);
        $.ajax(
        {
            type: "GET",
            url: AdminPanel.language_source,
            async: true,
            success : function(data)
            {
                $.post(AdminPanel.handler, {
                    "type": "GetUserLanguage"
                }, function(data2, status) {
                    let json = JSON.parse(data2);
                    
                    if(json.UserLanguage != null)
                    {
                        AdminPanel.Lang = data.langs[json.UserLanguage];
                        AdminPanel.SelectedLang = json.UserLanguage;
                    } else {
                        AdminPanel.Lang = data.langs[data.default];
                        AdminPanel.SelectedLang = data.default;
                    }
                    AdminPanel.DefaultLang = data.default;
                    AdminPanel.LangListKeys = Object.keys(data.langs);
                    for(var i = 0; i < AdminPanel.LangListKeys.length; i++)
                    {
                        AdminPanel.LangList.push(data.langs[AdminPanel.LangListKeys[i]].name);
                    }
                });
                AdminPanel.UpdatePermissions();
            }
        });
    }

    static Login()
    {
        if(AdminPanel.Initialized) return false;
        $.post(AdminPanel.handler, {
            "type" : "Login",
            "login" : document.getElementById('login_username').value,
            "password" : document.getElementById('login_password').value
        }, function(data, status){
            let json = JSON.parse(data);
            if(!json.LoginConfirmed)
            {
                AdminPanel.CreateNotify(AdminPanel.Lang['error'], AdminPanel.Lang['credientalsInvalid'], false, 7);
                return false;
            }
            AdminPanel.visibleName = json.visibleName;
            AdminPanel.UserPermissions = json.permissions;
            AdminPanel.CreateNotify(AdminPanel.Lang['loggedIn'], AdminPanel.Lang['successfulLogin'], true, 7);
            AdminPanel.CreateMenu(true, true);
            AdminPanel.Initialized = true;
        });
    }

    static GetAuth()
    {
        $.post(AdminPanel.handler, {
            "type" : "GetAuth"
        }, function(data, status){
            let json = JSON.parse(data);
            if(json.Error != 1)
            {
                if(json.authConfirmed)
                {
                    return true;
                } else {
                    return false;
                }
            } 
        });
    }

    static CreateMenu(source_auth, createMenu)
    {
        if(source_auth) AdminPanel.ContentRefresh(1);
        var t = setInterval(function() {
            if(document.body.contains(document.getElementById('login-box'))) document.getElementById('login-box').remove();

            if(createMenu) {
                var container = document.createElement('div');
                container.setAttribute('id', 'panelContainer');
                document.querySelector('body').appendChild(container);

                var nel = document.createElement('div');
                nel.setAttribute('id', 'menu');
                container.appendChild(nel);
                var content = document.createElement('div');
                content.setAttribute('id', 'content');
                container.appendChild(content);            
            }
            
            var el = document.getElementById('menu');

            if(AdminPanel.UserPermissions.includes('employees.view') || AdminPanel.UserPermissions.includes('all'))
            {
                var employees = "<button onClick='AdminPanel.LoadContent(`employees`)'>" + AdminPanel.Lang['employees'] + "</button>";
            } else if(AdminPanel.UserPermissions.includes('employees.add'))
            {
                var employees = "<button onClick='AdminPanel.LoadContent(`add_employee`)'>" + AdminPanel.Lang['addNewEmployee'] + "</button>";
            } else {
                var employees = "";
            }
            if(AdminPanel.UserPermissions.includes('groups.view') || AdminPanel.UserPermissions.includes('all'))
            {
                var groups = "<button onClick='AdminPanel.LoadContent(`groups`)'>" + AdminPanel.Lang['groups'] + "</button>";
            } else if(AdminPanel.UserPermissions.includes('groups.add'))
            {
                var groups = "<button onClick='AdminPanel.LoadContent(`add_group`)'>" + AdminPanel.Lang['addNewGroup'] + "</button>";
            } else {
                var groups = "";
            }
            el.innerHTML = "<img src='./images/logo.png'><hr><div id='menu-container'><button onClick='AdminPanel.LoadContent(`myaccount`)'>" + AdminPanel.Lang['myAccount'] + "</button>" + employees + groups + "<button onClick='AdminPanel.LoadContent(`livechat`)'>" + AdminPanel.Lang['livechat'] + "</button><button onClick='AdminPanel.LoadContent(`tickets`)'>" + AdminPanel.Lang['tickets'] + "</button><div id='menu-container_footer'><button onClick='AdminPanel.LoadContent(`settings`)'>" + AdminPanel.Lang['settings'] + "</button><button onClick='AdminPanel.Logout()')>" + AdminPanel.Lang['logout'] + "</button></div></div>";
            
            if(createMenu) {
                if(history.state != null)
                {
                    if(history.state.content != 'login')
                    {
                        AdminPanel.LoadContent(history.state.content, true);
                    } else {
                        AdminPanel.LoadContent('myaccount', true);
                    }
                } else {
                    AdminPanel.LoadContent('myaccount', true);
                }
            }
            clearInterval(t);
        }, 1000);
    }

    static LoadContent(type, skip)
    {
        var i = 0;
        if(!skip) i = 1000;
        var kicked = false;
        AdminPanel.ContentRefresh(1);
        history.replaceState({content: type}, "Content", "./?" + type);
        if(type != "login") AdminPanel.UpdatePermissions();
        var t = setInterval(function(){
            switch(type)
            {
                case "login":
                    if(document.body.contains(document.getElementById('panelContainer'))) document.getElementById('panelContainer').remove();
                    if(document.body.contains(document.getElementById('login-box'))) document.getElementById('login-box').remove();
                    var box = document.createElement('div');
                    box.setAttribute('id', 'login-box');
                    document.querySelector('body').appendChild(box);
                    //todo
                    box.innerHTML = "<img src='./images/logo.png'> <hr> <div id='login-container'> <h1>Log in</h1> <form onsubmit='return false;' method='post'> <label><span>Username</span></label> <input type='text' id='login_username' name='ts_login' placeholder='Username..'> <label><span>Password</span></label> <input type='password' id='login_password' name='ts_password' placeholder='Password..'> <button type='submit' onClick='AdminPanel.Login();'>Submit</button> </form> </div>";
                    box.children[2].children[0].innerHTML = AdminPanel.Lang['login'];
                    box.children[2].children[1].children[4].innerHTML = AdminPanel.Lang['submit'];
                    break;
                case "myaccount":
                    document.getElementById('content').innerHTML = "<img src='./images/unknown.png'><p>" + AdminPanel.Lang['welcomeBack'] + ", " + AdminPanel.visibleName + "</p><div id='manage-account'><button>" + AdminPanel.Lang['manageAccount'] + "</button><button onClick='AdminPanel.Logout()'>" + AdminPanel.Lang['logout'] + "</button></div>";
                    break;
                case "groups":
                    var addGroup = "";
                    if(!AdminPanel.UserPermissions.includes('groups.view') && !AdminPanel.UserPermissions.includes('all'))
                    {
                        AdminPanel.NoPermission();
                        AdminPanel.LoadContent('myaccount');
                        kicked = true;
                        break;
                    }
                    if(AdminPanel.UserPermissions.includes('groups.add') || AdminPanel.UserPermissions.includes('all'))
                    {
                        addGroup = "<button class='button_right' onClick='AdminPanel.LoadContent(`add_group`)''>" + AdminPanel.Lang['addNewGroup'] + "</button>";
                    }
                    var groups = [];
                    document.getElementById('content').innerHTML = "<p style='text-align:left;margin-left:2%;'>" + AdminPanel.Lang['groups'] + addGroup + "</p><div id='content-container'><div class='loading-circle loading-circle-small'></div></div>";
                    $.post(AdminPanel.handler, {
                        "type" : "GetGroups"
                    }, function(data, status)
                    {
                        let json = JSON.parse(data);
                        if(json.PermissionError)
                        {
                            AdminPanel.NoPermission();
                            AdminPanel.LoadContent('myaccount');
                            kicked = true;
                        } else {
                            groups = json.groups;
                            if(groups.length < 1)
                            {
                                document.getElementById('content-container').innerHTML = "<p>Error</p>";
                            } else {
                                document.getElementById('content-container').children[0].remove();
                                var table = document.createElement('table');
                                table.setAttribute('cellspacing', 0);
                                document.getElementById('content-container').appendChild(table);
                                var str = "<tr><th>" + AdminPanel.Lang['visibleName'] + "</th><th>" + AdminPanel.Lang['permissions'] + "</th><th>" + AdminPanel.Lang['priority'] + "</th><th>" + AdminPanel.Lang['action'] + "</th></tr>";
                                for(var i = 0; i < groups.length; i++)
                                {
                                    if((AdminPanel.UserPermissions.includes('groups.edit') || AdminPanel.UserPermissions.includes('all')) && groups[i][1] <= AdminPanel.MaxPriority + 1)
                                    {
                                        var action = "<span class='spanHover spanHoverNoItalic' onClick='AdminPanel.EditGroup(`" + groups[i][0] + "`);'>" + AdminPanel.Lang['edit'] + "</span>";
                                    } else {
                                        var action = AdminPanel.Lang['noAction'];
                                    }
                                    var permissions = groups[i][2].join(", ");
                                    str = str + "<tr><td>" + groups[i][0] + "</td><td>" + permissions + "</td><td>" + groups[i][1] + "</td><td>" + action + "</td></tr>";
                                } 
                                table.innerHTML = str;
                            }
                        }
                    });
                    break;
                case "employees":
                    var addEmployee = "";
                    if(!AdminPanel.UserPermissions.includes('employees.view') && !AdminPanel.UserPermissions.includes('all'))
                    {
                        AdminPanel.NoPermission();
                        AdminPanel.LoadContent('myaccount');
                        kicked = true;
                        break;
                    }
                    if(AdminPanel.UserPermissions.includes('employees.add') || AdminPanel.UserPermissions.includes('all'))
                    {
                        addEmployee = "<button class='button_right' onClick='AdminPanel.LoadContent(`add_employee`)''>" + AdminPanel.Lang['addNewEmployee'] + "</button>";
                    }
                    var employees = [];
                    document.getElementById('content').innerHTML = "<p style='text-align:left;margin-left:2%;'>" + AdminPanel.Lang['employees'] + addEmployee + "</p><div id='content-container'><div class='loading-circle loading-circle-small'></div></div>";
                    $.post(AdminPanel.handler, {
                        "type" : "GetEmployees"
                    }, function(data, status)
                    {
                        let json = JSON.parse(data);
                        if(json.PermissionError || !json.authConfirmed)
                        {
                            if(!json.authConfirmed)
                            {
                                AdminPanel.Logout(true);
                            } else {
                                AdminPanel.NoPermission();
                                AdminPanel.LoadContent('myaccount');
                            }
                            kicked = true;
                        } else {
                            employees = json.employees;
                            if(employees.length < 1)
                            {
                                document.getElementById('content-container').innerHTML = "<p>There's no employees..</p>";
                            } else {
                                document.getElementById('content-container').children[0].remove();
                                var table = document.createElement('table');
                                table.setAttribute('cellspacing', 0);
                                document.getElementById('content-container').appendChild(table);
                                var str = "<tr><th>Login</th><th>" + AdminPanel.Lang['visibleName'] + "</th><th>" + AdminPanel.Lang['groups'] + "</th><th>" + AdminPanel.Lang['extraPermissions'] + "</th><th>" + AdminPanel.Lang['action'] + "</th></tr>";
                                for(var i = 0; i < employees.length; i++)
                                {
                                    if((AdminPanel.UserPermissions.includes('employees.edit') || AdminPanel.UserPermissions.includes('all')) && employees[i][4] <= AdminPanel.MaxPriority + 1)
                                    {
                                        var action = "<span class='spanHover spanHoverNoItalic' onClick='AdminPanel.EditEmployee(`" + employees[i][0] + "`);'>" + AdminPanel.Lang['edit'] + "</span>";
                                    } else {
                                        var action = AdminPanel.Lang['noAction'];
                                    }
                                    var groups = employees[i][2].join(", ");
                                    var extras = employees[i][3].join(", ");
                                    str = str + "<tr><td>" + employees[i][0] + "</td><td>" + employees[i][1] + "</td><td>" + groups + "</td><td>" + extras + "</td><td>" + action + "</td></tr>";
                                } 
                                table.innerHTML = str;
                            }
                        }
                    });
                    break;
                case "add_employee":
                    if(AdminPanel.UserPermissions.includes('employees.view') || AdminPanel.UserPermissions.includes('all'))
                    {
                        var cancelButton = "<button class='button_right' onClick='AdminPanel.LoadContent(`employees`)'>" + AdminPanel.Lang['cancel'] + "</button>";
                    } else {
                        var cancelButton = "";
                    }
                    document.getElementById('content').innerHTML = "<p style='text-align:left;margin-left:2%;'>" + AdminPanel.Lang['addNewEmployee'] + cancelButton + "</p><div id='content-container'><div class='loading-circle loading-circle-small'></div></div>";
                    if(!AdminPanel.UserPermissions.includes('employees.add') && !AdminPanel.UserPermissions.includes('all'))
                    {
                        AdminPanel.NoPermission();
                        AdminPanel.LoadContent('employees');
                        kicked = true;
                        break;
                    } else {
                        document.getElementById('content-container').innerHTML = "<div id='content-container-inputs'><h1>Account info</h1><label><span>Username</span></label><input type='text' id='newEmployeeUsername' minlength=3 required><br><label><span>Visiblename</span></label><input type='text' id='newEmployeeVisibleName' minlength=3 required><br><label><span>Password</span></label><input type='password' id='newEmployeePassword'><span onClick='AdminPanel.showPassword(`newEmployeePassword`, this)' class='spanHover'>Show password..</span><h1>Groups</h1><div id='groupFields'></div><span onClick='AdminPanel.AddField(`groupFields`, `groups`);' class='spanHover'>Click to assign new group..</span><h1>Permissions</h1><div id='permissionFields'></div><span onClick='AdminPanel.AddField(`permissionFields`, `permissions`);' class='spanHover'>Click to assign new permission..</span><button onClick='AdminPanel.CreateEmployee()'>Add new employee</button></div><br>";
                    }
                    break;
                case "edit_employee":
                    if(AdminPanel.EditingEmployee == null)
                    {
                        AdminPanel.LoadContent('myaccount');
                        kicked = true;
                        break;
                    }
                    if(AdminPanel.UserPermissions.includes('employees.view') || AdminPanel.UserPermissions.includes('all'))
                    {
                        var cancelButton = "<button class='button_right' onClick='AdminPanel.LoadContent(`employees`)'>" + AdminPanel.Lang['cancel'] + "</button>";
                    } else {
                        var cancelButton = "";
                    }
                    document.getElementById('content').innerHTML = "<p style='text-align:left;margin-left:2%;'>" + "Edit employee" + cancelButton + "</p><div id='content-container'><div class='loading-circle loading-circle-small'></div></div>";
                    if(!AdminPanel.UserPermissions.includes('employees.edit') && !AdminPanel.UserPermissions.includes('all'))
                    {
                        AdminPanel.NoPermission();
                        AdminPanel.LoadContent('employees');
                        kicked = true;
                        break;
                    } else {
                        $.post(AdminPanel.handler, {
                            "type": "GetEmployees",
                            "EmployeeLogin": AdminPanel.EditingEmployee
                        }, function(data, status){
                            let json = JSON.parse(data);
                            var employee = json.employees;
                            document.getElementById('content-container').innerHTML = "<div id='content-container-inputs'><h1>Account info</h1><label><span>Visiblename</span></label><input type='text' id='editEmployeeVisibleName' value='" + employee[0][1] + "' minlength=3 required><br><label><span>New password (or keep blank)</span></label><input type='password' id='editEmployeePassword'><span onClick='AdminPanel.showPassword(`editEmployeePassword`, this)' class='spanHover'>Show password..</span><h1>Groups</h1><div id='groupFields'></div><span onClick='AdminPanel.AddField(`groupFields`, `groups`);' class='spanHover'>Click to assign new group..</span><h1>Permissions</h1><div id='permissionFields'></div><span onClick='AdminPanel.AddField(`permissionFields`, `permissions`);' class='spanHover'>Click to assign new permission..</span><button onClick='AdminPanel.EditEmployeePush()'>Edit employee</button></div><br>";
                            for(var i = 0; i < employee[0][2].length; i++)
                            {
                                if(employee[0][2][i] != "-") AdminPanel.AddField('groupFields', 'groups', employee[0][2][i]);
                            }
                            for(var i = 0; i < employee[0][3].length; i++)
                            {
                                if(employee[0][3][i] != "-") AdminPanel.AddField('permissionFields', 'permissions', employee[0][3][i]);
                            }
                        });
                    }
                    break;
                case "add_group":
                    if(AdminPanel.UserPermissions.includes('groups.view') || AdminPanel.UserPermissions.includes('all'))
                    {
                        var cancelButton = "<button class='button_right' onClick='AdminPanel.LoadContent(`groups`)'>" + AdminPanel.Lang['cancel'] + "</button>";
                    } else {
                        var cancelButton = "";
                    }
                    document.getElementById('content').innerHTML = "<p style='text-align:left;margin-left:2%;'>" + AdminPanel.Lang['addNewGroup'] + cancelButton + "</p><div id='content-container'><div class='loading-circle loading-circle-small'></div></div>";
                    if(!AdminPanel.UserPermissions.includes('groups.add') && !AdminPanel.UserPermissions.includes('all'))
                    {
                        AdminPanel.NoPermission();
                        AdminPanel.LoadContent('groups');
                        kicked = true;
                        break;
                    } else {
                        document.getElementById('content-container').innerHTML = "<div id='content-container-inputs'><h1>Group info</h1><label><span>Name</span></label><input type='text' id='newGroupName' minlength=3 required><br><label><span>Priority</span></label><input type='number' onchange='AdminPanel.InputMaxValue(`" + AdminPanel.MaxPriority + "`, this)' value=0 id='newGroupPriority' max='" + AdminPanel.MaxPriority + "' required><br><h1>Permissions</h1><div id='permissionFields'></div><span onClick='AdminPanel.AddField(`permissionFields`, `permissions`);' class='spanHover'>Click to assign new permission..</span><button onClick='AdminPanel.CreateGroup()'>Add new group</button></div><br>";
                    }
                    break;
                case "settings":
                    document.getElementById('content').innerHTML = "<p style='text-align:left;margin-left:2%;'>Settings</p><div id='content-container' class='content-container-big'><div class='content-container-columnview'><button onClick='AdminPanel.LoadContent(`messages`);'>Messages</button><button onClick='AdminPanel.LoadContent(`logs`);'>Logs</button><button onClick='AdminPanel.LoadContent(`ts_info`);'>TicketSystem information</button><button onClick='AdminPanel.LoadContent(`bans`);'>Bans</button><button onClick='AdminPanel.LoadContent(`language`);'>Language</button><button onClick='AdminPanel.LoadContent(`manage_account`);'>Change account information</button><button onClick='AdminPanel.LoadContent(`edithotbar`);'>Edit hotbar</button></div></div>";
                    break;
                case "language":
                    document.getElementById('content').innerHTML = "<p style='text-align:left;margin-left:2%'>Language</p><div id='content-container'><h1>Edit your language preferences</h1><div id='content-container-inputs'><select id='languageSelect'></select><button onClick='AdminPanel.ChangeLanguage(`languageSelect`)'>Save</button></div></div>";
                    if(AdminPanel.UserPermissions.includes('language.change.default') || AdminPanel.UserPermissions.includes('all'))
                    {
                        document.getElementById('content-container').innerHTML = document.getElementById('content-container').innerHTML + "<br><hr><br><h1>Set default language for all users</h1><div id='content-container-inputs'><select id='defaultLanguageSelect'>" + str + "</select><button onClick='AdminPanel.ChangeDefaultLanguage(`defaultLanguageSelect`)'>Save</button></div>";
                    }
                    for(var i = 0; i < AdminPanel.LangList.length; i++)
                    {
                        var str = "<option value='" + AdminPanel.LangListKeys[i] + "'";
                        if(AdminPanel.LangListKeys[i] == AdminPanel.SelectedLang) {
                            str = str + " selected";
                        }
                        str = str + ">" + AdminPanel.LangList[i] + "</option>";
                        document.getElementById('languageSelect').innerHTML = document.getElementById('languageSelect').innerHTML + str;
                        if(AdminPanel.UserPermissions.includes('language.change.default') || AdminPanel.UserPermissions.includes('all'))
                        {
                            var str2 = "<option value='" + AdminPanel.LangListKeys[i] + "'";
                            if(AdminPanel.LangListKeys[i] == AdminPanel.DefaultLang) {
                                str2 = str2 + " selected";
                            }
                            str2 = str2 + ">" + AdminPanel.LangList[i] + "</option>";
                            document.getElementById('defaultLanguageSelect').innerHTML = document.getElementById('defaultLanguageSelect').innerHTML + str2;
                        }   
                    }
                    document.getElementById('content-container').innerHTML = document.getElementById('content-container').innerHTML + "<br>";
                    break;
                case "ts_info":
                    document.getElementById('content').innerHTML = "<div id='content-container'><img src='./images/logo.png' style='width:60%;'><p>Version: 0.1.2</p><p>Release date: 24.11.2022</p></div>";
                    break;
                default:
                    document.getElementById('content').innerHTML = "<h1>404</h1>";
                    break;
            }
            if(!kicked) AdminPanel.ContentRefresh(0);
            clearInterval(t);
        }, i);
    }

    static ContentRefresh(start)
    {  
        if(start || start == "1")
        {
            document.getElementById('content-refresh').style.animationName = "fadeIn";
        } else {
            document.getElementById('content-refresh').style.animationName = "fadeOut";
        }
        
    }

    static Logout(forced)
    {
        $.post(AdminPanel.handler, {
            "type" : "Logout"
        }, function(data, status){

        });
        if(forced)
        {
            //todo
            AdminPanel.CreateNotify('Logged out', "You're not logged in", false, 7);
        } else {
            AdminPanel.CreateNotify(AdminPanel.Lang['loggedOut'], AdminPanel.Lang['successfulLoggedOut'], true, 7);
        }
        AdminPanel.Initialized = false;
        AdminPanel.LoadContent('login');
        return true;
    }

    static NoPermission()
    {
        AdminPanel.CreateNotify(AdminPanel.Lang['permissions'], AdminPanel.Lang['permissionMessage'], false, 7);
        return true;
    }

    static CreateNotify(title, description, isGood, time)
    {
        var className = "rednotify";
        if(isGood) className = "greennotify";
        var container = document.getElementById('notifies-container');
        var notify = document.createElement('div');
        notify.setAttribute('class', 'notify ' + className); 
        var length = 0;
        for(var i = 0; i < AdminPanel.activeNotifies.length; i++)
        {
            if(AdminPanel.activeNotifies[i] == 1) length++;
        }
        notify.setAttribute('id', 'notify_' + length);
        var myID = length;
        AdminPanel.activeNotifies[myID] = 1;
        container.appendChild(notify);
        notify.innerHTML = '<p>' + title + '</p><p>' + description + '</p><div class="notify-bar-light"></div><div class="notify-bar"></div>';
        var bar = notify.children[3];
        bar.style.animationDuration = time + "s";
        var a = time;
        var timer = setInterval(function(){
            if(a <= 0.1)
            {
                clearInterval(timer);
                notify.style.animationName = "notify-out";
                var timer2 = setInterval(function() {
                    AdminPanel.activeNotifies[myID] = 0;
                    notify.remove();
                    clearInterval(timer2);
                }, 1000);
            }
            notify.style.bottom = (15*myID) + "%";
            if(AdminPanel.activeNotifies[myID-1] == 0 && myID > 0)
            {
                AdminPanel.activeNotifies[myID-1] = 1;
                AdminPanel.activeNotifies[myID] = 0;
                myID--;
            }
            a -= 0.1;
        }, 100);
    }

    static showPassword(inputID, element)
    {
        var el = document.getElementById(inputID);
        if(el.type == "password")
        {
            el.type = "text";
            element.innerHTML = "Hide password";
        } else {
            el.type = "password";
            element.innerHTML = "Show password";
        }
    }

    static CreateEmployee()
    {
        if(!AdminPanel.UserPermissions.includes('employees.add') && !AdminPanel.UserPermissions.includes('all'))
        {
            AdminPanel.NoPermission();
            return false;
        }
        var login = document.getElementById('newEmployeeUsername').value;
        var visibleName = document.getElementById('newEmployeeVisibleName').value;
        var password = document.getElementById('newEmployeePassword').value;
        var groups = [];
        var groupElements = document.getElementsByClassName('fieldSelection_groups');
        for(var i = 0; i < groupElements.length; i++)
        {
            if(!groups.includes(groupElements[i].value))
            {
                groups.push(groupElements[i].value);
            }
        }
        var permissions = [];
        var permissionElements = document.getElementsByClassName('fieldSelection_permissions');
        for(var i = 0; i < permissionElements.length; i++)
        {
            if(!permissions.includes(permissionElements[i].value))
            {
                permissions.push(permissionElements[i].value);
            }
        }
        $.post(AdminPanel.handler, {
            "type": "CreateEmployee",
            "login": login,
            "visibleName": visibleName,
            "password": password,
            "groups": groups,
            "permissions": permissions
        }, function(data, status)
        {
            let json = JSON.parse(data);
            if(json.Error == 1)
            {
                // todo
                if(json.FunctionErrorCode == 0) AdminPanel.CreateNotify('Error', 'Employee with this name already exists', false, 7);
                if(json.FunctionErrorCode == 1) AdminPanel.CreateNotify('Error', 'Something went wrong..', false, 7);
                if(json.FunctionErrorCode == 2) AdminPanel.CreateNotify('Error', 'Entered fields are too short!', false, 7);
                if(json.FunctionErrorCode == 3) AdminPanel.CreateNotify('Error', "You cannot assign this group!", false, 7);
                if(json.FunctionErrorCode == 4) AdminPanel.CreateNotify('Error', "You cannot assign this permission!!", false, 7);
            } else {
                if(json.CreatedEmployee) {
                    AdminPanel.CreateNotify('Success', 'Successfully created employee: ' + login, true, 7);
                    if(AdminPanel.UserPermissions.includes('employees.view') || AdminPanel.UserPermissions.includes('all')) AdminPanel.LoadContent('employees');
                } else if(json.PermissionError) {
                    AdminPanel.NoPermission();
                } else {
                    AdminPanel.CreateNotify('Error', 'Something went wrong..', false, 7);
                }
            }
        });
    }

    static CreateGroup()
    {
        if(!AdminPanel.UserPermissions.includes('groups.add') && !AdminPanel.UserPermissions.includes('all'))
        {
            AdminPanel.NoPermission();
            return false;
        }
        var name = document.getElementById('newGroupName').value;
        var priority = document.getElementById('newGroupPriority').value;
        var permissions = [];
        var permissionElements = document.getElementsByClassName('fieldSelection_permissions');
        for(var i = 0; i < permissionElements.length; i++)
        {
            if(!permissions.includes(permissionElements[i].value))
            {
                permissions.push(permissionElements[i].value);
            }
        }
        $.post(AdminPanel.handler, {
            "type": "CreateGroup",
            "name": name,
            "priority": priority,
            "permissions": permissions
        }, function(data, status)
        {
            console.log(data);
            let json = JSON.parse(data);
            if(json.Error == 1)
            {
                // todo
                if(json.FunctionErrorCode == 0) AdminPanel.CreateNotify('Error', 'Group with this name already exists', false, 7);
                if(json.FunctionErrorCode == 1) AdminPanel.CreateNotify('Error', 'Something went wrong..', false, 7);
                if(json.FunctionErrorCode == 2) AdminPanel.CreateNotify('Error', 'Entered fields are too short!', false, 7);
                if(json.FunctionErrorCode == 4) AdminPanel.CreateNotify('Error', "You cannot assign this permission!", false, 7);
            } else {
                if(json.CreatedGroup) {
                    AdminPanel.CreateNotify('Success', 'Successfully created group: ' + name, true, 7);
                    if(AdminPanel.UserPermissions.includes('groups.view') || AdminPanel.UserPermissions.includes('all')) AdminPanel.LoadContent('groups');
                } else if(json.PermissionError) {
                    AdminPanel.NoPermission();
                } else {
                    AdminPanel.CreateNotify('Error', 'Something went wrong..', false, 7);
                }
            }
        });
    }

    static AddField(elementID, type, defaultValue)
    {
        var groupElement = document.createElement('div');
        var newElement = document.createElement('select');
        newElement.setAttribute('id', type + '_' + document.getElementsByClassName('fieldSelection_' + type).length);
        newElement.setAttribute('class', 'fieldSelection_' + type);
        document.getElementById(elementID).appendChild(groupElement)
        groupElement.appendChild(newElement);
        var deleteSpan = document.createElement('span');
        deleteSpan.setAttribute('class', 'spanHover spanHoverNoItalic');
        deleteSpan.setAttribute('onClick', 'this.parentElement.remove();');
        deleteSpan.innerHTML = "Click to remove above element..";
        groupElement.appendChild(deleteSpan);
        switch(type)
        {
            case 'groups':
                var array = AdminPanel.PermitGroups;
                break;
            case 'permissions':
                var array = AdminPanel.AllPermissions;
                var temp = [];
                for(var i = 0; i < array.length; i++)
                {
                    if(AdminPanel.UserPermissions.includes('all') || AdminPanel.UserPermissions.includes(AdminPanel.AllPermissions[i]))
                    {
                        temp.push(AdminPanel.AllPermissions[i]);
                    }
                }
                array = temp;
                break;
        }
        var str = "";
        for(var i = 0; i < array.length; i++)
        {
            var add = "";
            if(array[i] == defaultValue)
            {
                var add = "selected"
            }
            str = str + "<option " + add + ">" + array[i] + "</option>";
        }
        newElement.innerHTML = str;
        for(var i = 0; i < 2; i++)
        {
            var br = document.createElement('br');
            groupElement.appendChild(br);
        }
        return true;
    }

    static UpdatePermissions()
    {
        $.post(AdminPanel.handler, {
            "type" : "GetAuth"
        }, function(data, status) {
            let json = JSON.parse(data);
            if(json.authConfirmed)
            {
                AdminPanel.visibleName = json.visibleName;
                if(!AdminPanel.Initialized) {
                    AdminPanel.CreateMenu(false, true);
                    AdminPanel.Initialized = true;
                    AdminPanel.UserPermissions = json.permissions;
                } else {
                    if(json.permissions != AdminPanel.UserPermissions)
                    {
                        AdminPanel.UserPermissions = json.permissions;
                        AdminPanel.CreateMenu(false, false);
                    }
                }
                $.post(AdminPanel.handler, {
                    "type": "GetUserPermitGroups"
                }, function(data, status) {
                    let json = JSON.parse(data);
                    AdminPanel.PermitGroups = json.groups;
                    AdminPanel.MaxPriority = json.maxpriority;
                });
            } else {
                AdminPanel.Initialized = false;
                AdminPanel.LoadContent('login');
            }
        });
    }

    static InputMaxValue(value, element)
    {
        if(parseInt(element.value) > parseInt(value))
        {
            element.value = value;
        } else if(parseInt(element.value) < 0)
        {
            element.value = 0;
        }
    }

    static EditEmployee(username)
    {
        if(!AdminPanel.UserPermissions.includes("employees.edit") && !AdminPanel.UserPermissions.includes("all"))
        {
            AdminPanel.NoPermission();
            return false;
        }
        AdminPanel.LoadContent('edit_employee');
        AdminPanel.EditingEmployee = username;
        return true;
    }

    static ChangeLanguage(elementID)
    {
        var lang = document.getElementById(elementID).value;
        $.post(AdminPanel.handler, {
            "type": "SaveLanguage",
            "value": lang
        }, function(data, status)
        {
            let json = JSON.parse(data);
            if(json.Saved != 1)
            {
                AdminPanel.CreateNotify('Error', 'Something went wrong..', false, 7);
            } else {
                window.location.reload();
            }
        });
    }

    static ChangeDefaultLanguage(elementID)
    {
        if(!AdminPanel.UserPermissions.includes('language.change.default') && !AdminPanel.UserPermissions.includes('all'))
        {
            AdminPanel.NoPermission();
            return false;
        }
        var lang = document.getElementById(elementID).value;
        $.post(AdminPanel.handler, {
            "type": "SetDefaultLanguage",
            "value": lang
        }, function(data, status)
        {
            console.log(data);
            let json = JSON.parse(data);
            if(json.Saved != 1)
            {
                AdminPanel.CreateNotify('Error', 'Something went wrong..', false, 7);
            } else if(json.PermissionError)
            {
                AdminPanel.NoPermission();
            } else {
                AdminPanel.CreateNotify('Default language', 'Default language has been successfully set to ' + lang + '!', true, 7);
            }
        });
    }
}

$(document).ready(function() {
    AdminPanel.Setup();
});
