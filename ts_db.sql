CREATE TABLE groups (
    id_group INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    name VARCHAR(64),
    priority INT NOT NULL
);

CREATE TABLE employees (
    id_employee INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    visibleName VARCHAR(32),
    login VARCHAR(32),
    password VARCHAR(64),
    lastPing DATETIME
);

CREATE TABLE groups_permissions (
    permission VARCHAR(64),
    id_group INT,
    FOREIGN KEY (id_group) REFERENCES groups(id_group) ON DELETE CASCADE
);

CREATE TABLE employees_permissions (
    permission VARCHAR(64),
    id_employee INT,
    FOREIGN KEY (id_employee) REFERENCES employees(id_employee) ON DELETE CASCADE
);

CREATE TABLE employees_groups (
    id_employee INT,
    id_group INT,
    FOREIGN KEY (id_employee) REFERENCES employees(id_employee) ON DELETE CASCADE,
    FOREIGN KEY (id_group) REFERENCES groups(id_group) ON DELETE CASCADE,
    PRIMARY KEY(id_employee, id_group)
);

CREATE TABLE livechats (
    id_chat INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    id_employee INT,
    beginDate DATETIME NOT NULL,
    endDate DATETIME,
    FOREIGN KEY (id_employee) REFERENCES employees(id_employee) ON DELETE SET NULL
);

CREATE TABLE livechatmessages (
    id_message INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    id_chat INT NOT NULL,
    id_employee INT,
    message VARCHAR(256) NOT NULL,
    seen BOOLEAN,
    FOREIGN KEY (id_chat) REFERENCES livechats(id_chat),
    FOREIGN KEY (id_employee) REFERENCES employees(id_employee) ON DELETE SET NULL
);

CREATE TABLE livechatqueue (
    id_queue INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    id_employee INT,
    joinedDate DATETIME,
    FOREIGN KEY (id_employee) REFERENCES employees(id_employee) ON DELETE SET NULL
);

CREATE TABLE hotbar (
    id_employee INT,
    item INT,
    slot INT,
    FOREIGN KEY (id_employee) REFERENCES employees(id_employee) ON DELETE CASCADE
)