<img src="https://github.com/qWojtpl/ticketsystem/blob/main/images/logo.png?raw=true">

#

<h3 align="center">
  <i>Allow users to safe contact with you</i>
</h3>

<br>
<br>

# Requirements

* PHP 7.3+
* JavaScript support
* MySQL (recommended MariaDB)
* jQuery on every page you would like to use livechat

# Installation

* Put all repository to /ticketsystem/ directory
* We highly recommend changing umask on linux systems of ticketsystem directory to **0000** (rwxrwxrwx for directories, rw-rw-rw for files)
* Go to yoursite/ticketsystem/setup
* Complete the setup
* Done ;)

# Groups, employees and permissions

* You can add many groups, employees and custom permissions for selected employee.
* Groups can contain permissions and unique priority
* You can attach group to existing employee which means giving him group's permissions
* Employee consists of login, password, visible name and can contain additional permissions
* Employee which can edit or add groups/employees can give to it all permissions/groups that he has


### Permissions for groups: 
<details><summary>Click to reveal</summary>

```ruby
groups.view
```
  - Allow employees view existing groups

```ruby
groups.add
```
  - Allow employees add new groups (with priority -1 of employee's max priority group)
  
```ruby
groups.edit
```
  - Allow employees edit existing groups (with priority -1 of employee's max priority group)
  
```ruby
groups.delete
```
  - Allow employees delete existing groups (with priority -1 of employee's max priority group)
  
</details>


### Permissions for employees: 
<details><summary>Click to reveal</summary>

```ruby
employees.view
```
  - Allow employees view all existing employees

```ruby
employees.add
```
  - Allow employees add new employees
  
```ruby
employees.edit
```
  - Allow employees edit existing employees which group priority is below employee's max group priority
  
```ruby
employees.delete
```
  - Allow employees delete existing employees which group priority is below employee's max group priority
  
</details>

# Livechat

* Livechat is an addon to your site which allows real-time writing with employees for users
* You can attach livechat to your page very easily!

### Attach these scripts to head tag

```html
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
<script src="./ticketsystem/ts_livechat.js" ticketsystem=true></script>
```

</details>

* Employees with with the appropriate permission can use livechat
* User to join livechat must send his name and e-mail (this feature can be disabled during setup)
* No user's account is required!


### Permissions for livechat:

<details><summary>Click to reveal</summary>

```ruby
livechat.use
```
  - Allow employees use livechat
  
</details>

# Tickets

* 

### Permissions for tickets:

<details><summary>Click to reveal</summary>

```ruby
tickets.use
```
  - Allow employees use tickets

```ruby
tickets.close
```
  - Allow users close tickets

```ruby
tickets.view
```
  - Allow users view all tickets

```ruby
tickets.remove
```
  - Allow users remove all tickets

```ruby
tickets.remove.assigned
```
  - Allow users remove assigned tickets

</details>

# In-system messages

* Employees can send messages to each other

### Permissions for messages:

<details><summary>Click to reveal</summary>

```ruby
messages.receive
```
  - Allow employees receive messages
  
```ruby
messages.send
```
  - Allow employees send messages

</details>

# Bans

* Users can be banned on their e-mail, nickname, cookies or IP address.
* Banned users cannot use livechat and tickets
* Banned users CAN LOGIN to adminpanel as an employee

### Permissions for bans:

<details><summary>Click to reveal</summary>

```ruby
bans.view
```
  - Allow employees view existing bans
  
```ruby
bans.add
```
  - Allow employees add new record to bans (employee can insert e-mail, nickname or IP address)
  
```ruby
bans.remove
```
  - Allow employees remove existing record from bans
  
```ruby
bans.ban
```
  - Allow employees ban user only if they had interaction with this user (fe livechat, assigned ticket)
  
```ruby
bans.unban
```
  - Allow employees unban user only if they banned him
  
</details>

# Logs

* Every action (adding employee, editing employee, starting livechat etc) can be logged to Logs
* This feature can be turned on during setup

### Permissions for logs:

<details><summary>Click to reveal</summary>

```ruby
logs.view
```
  - Allow employees see system logs

</details>

# Languages

* You can edit and add languages to TicketSystem
* In default there's two languages: English and Polish
* Every employee can select their preferenced language
* Employee with appropriate permission can change default language for all employees
* Default language is used in livechat and tickets
* User's preferenced language is more important than default language pack. It means even if default language will be changed, then if employee had selected preferenced language before, then employee will see its preferenced language

### Permissions for languages:

<details><summary>Click to reveal</summary>

```ruby
language.edit
```
  - Allow employees edit existing language packs

```ruby
language.add
```
  - Allow employees add new language packs

```ruby
language.change.default
```
  - Allow employees change default language

```ruby
language.remove
```
  - Allow employees removing language packs

</details>


# Google Authenicator and account security