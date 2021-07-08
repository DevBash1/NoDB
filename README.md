# NoDB

NoDB is a NodeJs Serverless Relational Database.
It stores Databases in The file system in Json format.
It also Encrypts your Database for security.

## Installation

Use the node package manager [npm](https://npmjs.com) to install NoDB.

```bash
npm i -g bash-nodb
```

## Usage

```javascript
var NODB = require("bash-nodb");

//Create DataBase Instance
let db = new NODB();

//Create Configuration
let cofig = {
    database: "myDB", //DataBase name (Not Relevant)
    password: "123456", //DataBase Password (Valid if DataBase is Encrypted)
    encrypt: true, //Encrypt DataBase Option (Takes Boolean)
    path: "myDB.nodb", //Path to Where DataBase is Stored or Should be stored OR just DataBase name
}

db.login(cofig); //Try to login if DataBase exist or create new database

if(!db.error){ //If no error while trying to login
    db.query("CREATE TABLE programmers(name,position)") //running a query
    console.log(db.result); //console response from NoDB
}else{ //if error
    console.log("Error: " + db.result); //log error
}
```

You Can query NoDB for Data too Or Insert Values
```javascript

db.query("INSERT INTO programmers VALUES (Dev Bash,Web Developer)");
console.log(db.result); //4 Rows affected

```

```javascript
db.query("SELECT * FROM programmers");

```
This will return the Query result in Json format.

NoDB has a built-in default column which can not be rewritten by a query or removed seperately.

The id column which holds the id of each row.

The time column which holds the insert time.


```javascript

{
  id: [ 1 ],
  time: [ 1625426339719 ],
  name: [ 'Dev Bash' ],
  position: [ 'Web Developer' ],
}

```

It also returns a length for looping through values.

```javascript

db.length // 1
```

```javascript
{
  id: [
     1,  2, 3, 4,  5,
     6,  7, 8, 9, 10,
    11, 12
  ],
  time: [
    1625426339719, 1625427089684,
    1625427286065, 1625427395781,
    1625427414376, 1625427441367,
    1625427491341, 1625427542878,
    1625427577761, 1625427618535,
    1625427856361, 1625427926000
  ],
  name: [
    'Dev Bash',
    'Dev Favour',
    'Dev Afolabi',
    'Dev Obiabo',
    'Dev Ese',
    'Dev Praise',
    'Dev Chimaobi',
    'Dev Deli Gad',
    'Dev Adeboye',
    'Dev Aavesh',
    'Dev Akinkunmi Israel',
    'Dev Rayyan'
  ],
  position: [
    'Web Developer',
    'Junior Web Developer',
    'Senior Web Developer',
    'Senior Web Developer',
    'Senior Web Developer',
    'Software Developer',
    'MERN Developer',
    'MERN FullStack Developer',
    'Python Developer',
    'Dragon Lord',
    'Senior Web Developer',
    'Python Developer'
  ]
}
```

NoDB does not support all MySQL clauses
It only supports the most used and more important like -

```sql
SELECT
INSERT INTO
WHERE
DROP
TRUNCATE
CREATE
LIMIT
ORDER BY
```
etc.

This is an example of the WHERE clause.

```sql
Select * From programmers WHERE id < 5
```

Which will return
```javascript
{
  id: [ 1, 2, 3, 4 ],
  time: [ 1625426339719, 1625427089684, 1625427286065, 1625427395781 ],
  name: [ 'Dev Bash', 'Dev Favour', 'Dev Afolabi', 'Dev Obiabo' ],
  position: [
    'Web Developer',
    'Junior Web Developer',
    'Senior Web Developer',
    'Senior Web Developer'
  ]
}
```
NoDB also does not have a LIKE or REGEXP clause.
But dont feel bad about that, it has something better.
It allows you to create your own REGEXP and filter your data with a javascript function.
This gives you more power over data filtering.

```javascript
//Returns only positions with MERN in it
function onlyMERN(pos){
    return pos.includes("MERN");
}

//Set the filter function
db.setFilter(onlyMERN);

db.query("Select * From programmers WHERE filter(position)")
console.log(db.result);

```
Which will return
```javascript
{
  id: [ 7, 8 ],
  time: [ 1625427491341, 1625427542878 ],
  name: [ 'Dev Chimaobi', 'Dev Deli Gad' ],
  position: [ 'MERN Developer', 'MERN FullStack Developer' ]
}
```

NoDB allows you to LIMIT data too and Do other cool things you do with MySQL.

```javascript
db.query("SELECT name FROM programmers LIMIT 5") 
console.log(db.result.name[0]); //Dev Bash
console.log(db.result.name[1]); //Dev Favour
console.log(db.result.name[2]); //Dev Afolabi
console.log(db.result.name[3]); //Dev Obiabo
```
You can also run NoDB from the terminal.
Just make sure you installed NoDB Globally.

Run NoDB Admin and Manage Database From your browser.
```bash
nodb -s PORT
```

![alt text](https://github.com/DevBash1/NoDB/blob/main/Screenshot%202021-07-08%208.48.44%20AM.png?raw=true)

Where PORT is the port for running the NoDB server.
The defaulf port is 4042.

You Can Login to you NoDB Database Or Create it from the terminal.

```bash
nodb -l PATH
```

Where PATH is the path or the name of the Database to Login to or Create.

Using The NoDB Admin you can do other cool things like Importing NoDB Databases or MySQL Databases and Also Exporting NoDB DataBases.

Isn't that cool.
being able to import you MySQL DataBases to NoDB.

You can edit your rows from the NoDB Admin by Editing the Row and Pressing.
```javascript
Ctrl + M
```
NoDB does not use Async Functions Like MySQL and Does Not Query a Server which slows down your application a bit.
It Reads the Database from The FileSystem and Queries it with JavaScript.

NoDB also does not require any additional Configuration or Set Up.
Just Install and Use.

NoDB also automatically detect Data Types like
```javascript
Strings
Numbers
Booleans
Null
```
There is no need to specify Data Types while creating Tables.

There will be more features soon.
Happy Coding!

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://github.com/DevBash1/NoDB/blob/main/LICENSE)
