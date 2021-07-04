#!/usr/bin/env node

/********************
 * Made by DEV BASH *
 * Took N days      *
 * From Nigeria     *
 ********************/

var fs = require("fs");
var sjcl = require("sjcl");
var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var { Server } = require("socket.io");
var io = new Server(server);
var chalk = require("chalk");
var clear = require("clear");
var args = require("minimist")(process.argv.slice(1));
var figlet = require("figlet");
var package = require("./package.json");
var inquirer = require("inquirer");

let filter = "";

function NOdb(){
    db = this;
    db.error = false;
    db.result = "";
    db.length = null;
    db.encrypt = false;
    db.logged = false;
    this.login = function(config){
        if(config === null){
            throw("config is missing");
        }
        if(config.database === null){
            throw("database is missing");
        }
        if(config.path === null){
            throw("path is missing");
        }else{
            if(!config.path.includes("/")){
                config.path = __dirname + "/db/"+config.path;
            }
        }
        if(config.encrypt === null){
            config.encrypt = false;
        }
        if(config.password === null && config.encrypt == true){
            throw("password is missing");
        }
        if(config.encrypt === true){
            if(typeof sjcl == "undefined"){
                config.encrypt = false;
                db.encrypt = false;
            }else{
                db.encrypt = true;
                //try to login or create
                try{
                    if(!fs.existsSync(config.path)){
                        //create
                        let db_str = sjcl.encrypt(config.password,"{}");
                        setFile(config.path,btoa(db_str));
                        db.error = false;
                        db.result = "created successfully";
                        db.logged = true;
                    }else{
                        //login
                        try{
                            let db_str = sjcl.decrypt(config.password,atob(getFile(config.path)));
                            db.error = false;
                            db.result = "login success";
                            db.logged = true;
                        }catch(e){
                            db.error = true;
                            db.encrypt = false;
                            db.result = "login failed";
                        }
                    }
                }catch(e){
                    db.error = true;
                    db.encrypt = false;
                    db.result = "login failed";
                }
            }
        }else{
            if(!fs.existsSync(config.path)){
                //create
                let db_str = "{}";
                setFile(config.path,db_str);
                db.error = false;
                db.result = "created successfully";
                db.logged = true;
            }else{
                //login
                let db_str = getFile(config.path);
                if(db_str.includes("DB_TABLES") || db_str.includes("{")){
                    db.error = false;
                    db.result = "login success";
                    db.logged = true;
                }else{
                    db.error = true;
                    db.result = "login failed";
                    db.logged = false;
                }
            }
        }
        db.name = config.database;
        db.pass = config.password;
        db.path = config.path
    }
    this.admin = function(port=4042){
        let logged = false;
        let config = "";
        let innerDB = this;
        if(isNaN(port)){
            port = 4042;
        }

        function params(param){
            let obj = {};
            param = param.substring(param.indexOf("?")+1,param.length);
            obj.query = param;
            return obj;
        }

        app.use("/", express.static(__dirname + '/admin/libs/'));

        app.get('/', function(req, res) {
            if(logged){
                res.sendFile(__dirname + '/admin/index.html');
            }else{
                res.sendFile(__dirname + '/admin/login.html');
            }
        });
        io.on('connection', function(socket) {
            socket.on("login", function(data){
                data.database = "NODB_" + Math.floor(Math.random() * 1000000000);
                innerDB.login(data);
                if(innerDB.error){
                    socket.emit("login",innerDB.result);
                }else{
                    logged = true;
                    socket.emit("login",innerDB.result);
                    config = data;
                }
            })
            //Nodb API Endpoint
            app.get("/nodb", function(req,res){
                res.send("Not Available Now");
            });
            app.post("/", function(req,res){
                let obj = {};
                try{
                    Params = params(decodeURI(req.url));
                }catch(e){
                    obj.error = true;
                    obj.result = "Query Error";
                }

                innerDB.query(Params.query);
                obj.error = innerDB.error;
                obj.result = innerDB.result;
                res.send(obj);
            })
            socket.on("tables", function(data){
                let tables = [];
                try{
                    tables = Object.keys(innerDB.getDB()["DB_TABLES"]);
                }catch(e){
                    tables = [];
                }
                socket.emit("tables",tables);
            })
            socket.on("export",function(data){
                let url = __dirname + "/db/admin/" + innerDB.name + ".nodb";
                let name = "export.nodb";
                innerDB.export(url);
                socket.emit("export",{
                    error: innerDB.error,
                    url: "/"+name,
                    name: name
                })
                if(!innerDB.error){
                    app.get('/'+name, function(req, res) {
                        res.sendFile(url);
                    });
                }
            })
            socket.on("import", function(data){
                if(data.type == "sql"){
                    let query = innerDB.parseSQL(data.query,false);
                    innerDB.runAll(query,function(err){
                        socket.emit("sql_error",err);
                    });
                    socket.emit("import",{
                        error:innerDB.error,
                        result:innerDB.result,
                    })
                }else{
                    let query = data.query;
                    innerDB.merge(query,false);
                    socket.emit("import",{
                        error:innerDB.error,
                        result:innerDB.result,
                    })
                }
            })
            socket.on("logOut", function(data){
                logged = false;
                socket.emit("logOut","");
            })
        })
        clear();
        console.log(chalk.yellow(figlet.textSync("NOdb",{
            horizontalLayout: "full"
        })))
        console.log("By " + chalk.yellow("Dev Bash"));
        try{
            server.listen(port);
            console.log("Nodb Admin Running on port " + chalk.green(port));
            console.log(chalk.green("Press Ctrl + C to Terminate"));
        }catch(e){
            console.log(chalk.red(port) + " already in use!")
        }
        
    }
    this.console = function(path){
        let innerDB = this;
        function drawTable(obj){
            if(obj["length"] != undefined){
                delete obj["length"];
            }
            let table = "";
            let heads = Object.keys(obj);
            table += chalk.blue(heads.join("|")) + "\n";
            let len = obj[heads[0]].length;
            for(i=0;i<len;i++){
                heads.forEach(function(tb){
                    table += obj[tb][i] + "|";
                })
                table += "\n";
            }
            return table;
        }
        function inquire(){
            inquirer.prompt([
                    {
                        type: 'input',
                        name: 'query',
                        message: 'NODB> '
                    }
            ]).then(function(answers) {
                let value = answers.query;
                if (value.toLowerCase() != "quit" && value.toLowerCase() != "exit") {
                    innerDB.query(value);
                    if(innerDB.error){
                        console.log(chalk.green("? ") + "NODB> "+ chalk.red(innerDB.result));
                    }else{
                        if(typeof innerDB.result == "object"){
                            console.log(drawTable(innerDB.result));
                        }else{
                            console.log(chalk.green("? ") + "NODB> "+ chalk.green(innerDB.result));
                        }
                    }
                    inquire();
                }else{
                    clear();
                }
            }).catch(function(error){
                console.log(chalk.green("? ") + "NODB> "+ chalk.red("An Error Occured"));
            });
        }
        clear();
        console.log(chalk.yellow(figlet.textSync("NOdb",{
            horizontalLayout: "full"
        })))
        console.log("By " + chalk.yellow("Dev Bash"));
        console.log(chalk.green("Enter Quit or Exit to Terminate"));
        
        inquirer.prompt([
                {
                    type: 'input',
                    name: 'database',
                    message: 'database'
                },
                {
                    type: 'password',
                    name: 'password',
                    message: 'password'
                },
                {
                    type: 'confirm',
                    name: 'encrypt',
                    default: false,
                    message: 'encrypt'
                }
        ]).then(function(answers) {
            answers.path = path;
            innerDB.login(answers);
            if(innerDB.error){
                console.log(chalk.green("? ") + "NODB> "+ chalk.red(innerDB.result));
            }else{
                console.log(chalk.green("? ") + "NODB> "+ chalk.green(innerDB.result));
                inquire();
            }
        }).catch(function(error){
            console.log(chalk.green("? ") + "NODB> "+ chalk.red("An Error Occured"));
        });

    }
    this.getDB = function(){
        if(db.encrypt){
            try{
                let db_str = getFile(db.path);
                if(db_str == "{}"){
                    return db_str;
                }
                return JSON.parse(sjcl.decrypt(db.pass,atob(db_str)))
            }catch(e){
                db.error = true;
                db.result = "login failure";
            }
        }else{
            try{
                let db_str = getFile(db.path);
                return JSON.parse(db_str);
            }catch(e){
                db.error = true;
                db.result = "Bad DB";
            }
        }
    }
    this.setDB = function(data){
        if(db.encrypt){
            try{
                let db_str = JSON.stringify(data);
                setFile(db.path,btoa(sjcl.encrypt(db.pass,db_str)));
            }catch(e){
                db.error = true;
                db.result = "login failure";
            }
        }else{
            let db_str = JSON.stringify(data);
            setFile(db.path,db_str);
        }
    }
    this.parseSQL = function(path,isPath){
        let sql = "";
        if(isPath){
            sql = getFile(path).replaceAll("`","'").split("\n");
        }else{
            sql = path.replaceAll("`","'").split("\n");
        }
        let nodb = "";
        let hasTable = false;
        let query = "";
        let content = [];
        let curTable = "";
        let curInsert = "";
        let isInsert = false;
        let tables = [];

        //Handle CREATEs
        sql.forEach(function(i){
            i = i.trim();

            if(i.toUpperCase().startsWith("CREATE TABLE")){
                let index = i.indexOf("'")+1;
                let table = i.substring(index,i.indexOf("'",index+1));
                query += "\n\nCREATE TABLE "+table+"(";
                hasTable = true;
                curTable = table;
                tables.push(table);
            }
            if(hasTable){
                if(i.startsWith("'")){
                    let special = ["id","time"];
                    let index = i.indexOf("'")+1;
                    let row = i.substring(index,i.indexOf("'",index+1));
                    if(special.indexOf(row) == -1){
                        content.push(row);
                    }else{
                        content.push(curTable+"_"+row);
                    }
                    //console.log(row);
                }
                if(i.startsWith(")")){
                    query += content.join(",") + ")\n";
                    nodb += query;
                    query = "";
                    content = [];
                    hasTable = false;
                    curTable = "";
                    //console.log(i);
                }

            }
        });
        //Handle INSERTs
        sql.forEach(function(i){
            i = i.trim();

            if(i.toUpperCase().startsWith("INSERT")){
                let index = i.indexOf("'")+1;
                let insert = i.substring(index,i.indexOf("'",index+1));
                //Avoid Inserting Unexisting Table
                if(tables.indexOf(insert) != -1){
                    isInsert = true;
                    curInsert = insert;
                }
            }
            if(isInsert){
                if(i.startsWith("(") && (i.endsWith(",") || i.endsWith(";"))){
                    let hold = i.substring(0,i.length-1).replaceAll("NULL","null");
                    let build = "INSERT INTO "+curInsert+" VALUES "+hold+"\n";
                    nodb += build;
                }
                if(i.startsWith("(") && i.endsWith(";")){
                    isInsert = false;
                    curInsert = "";
                }
            }
        });

        return nodb;
    }
    this.runAll = function(queries,error=null){
        let innerDB1 = this;
        queries = queries.split("\n");
        console.log("Runing Queries.....wait!")
        console.time("time");
        queries.forEach(function(query,i){
            if(query.trim() != ""){
                innerDB1.query(query);
                if(error != null){
                    if(innerDB1.error == true){
                        error("Line "+i+": "+innerDB1.result);
                    }
                }
            }
        })
        console.log("Done");
        console.timeEnd("time");
    }
    this.lastId = function(){
        return db.lastId;
    }
    Array.prototype.fix = function(){
        let newArr = [];
        for(o=0;o<this.length;o++){
            if(this[o].trim() != ""){
                newArr.push(this[o]);
            }
        }
        return newArr;
    }
    Array.prototype.unique = function(){
        a = this.filter(function(item,pos,self){
            return self.indexOf(item) == pos;
        });
        return a;
    }
    String.prototype.rep = function(keys,values){
        let len = keys.length;
        let replaced = "";
        for(p=0;p<len;p++){
            if(replaced == ""){
                replaced = this.replace(new RegExp("\\b"+keys[p]+"\\b"),setType(values[p]));
            }else{
                replaced = replaced.replace(new RegExp("\\b"+keys[p]+"\\b"),setType(values[p]))
            }
        }
        return replaced;
    }
    String.prototype.remApo = function(){
        if(this.trim().startsWith("'") && this.trim().endsWith("'")){
            return this.trim().substring(1,this.trim().length-1);
        }else if(this.trim().startsWith("\"") && this.trim().endsWith("\"")){
            return this.trim().substring(1,this.trim().length-1);
        }
        return this.toString();
    }
    String.prototype.replaceAll = function(target, replacement) {
      return this.split(target).join(replacement);
    }
    String.prototype.splitComma = function() {
        let word = "";
        let array = [];
        let hasApo = false;
        let theStr = this.trim();
        theStr = theStr.split("");

        for(l=0;l<theStr.length;l++){
            let i = theStr[l];
            let n = theStr[l+1];

            if(i == "'"){
                if(hasApo){
                    word += i;
                    hasApo = false;
                    array.push(word);
                    word = ""
                    l++;
                }else{
                    word += i;
                    hasApo = true;
                }
            }else if(i == ","){
                if(hasApo){
                    word += i;
                }else{
                    array.push(word);
                    word = "";
                }
            }else if(theStr.length-1 == l){
                word += i;
                array.push(word);
                word = "";
            }else if(i == "\\" && n == "'"){
                word += "'";
                l++;
                l++;
            }else{
                word += i;
            }
        }
        return array;
    }

    function setType(word){
        let keys = [true,false,null,undefined];
        if(keys.indexOf(word) != -1){
            return eval(word);
        }
        if(isNaN(word)){
            return "'"+word+"'";
        }
        return Number(word);
    }
    function getType(word){
        let keys = ["true","false","null","undefined"];
        if(keys.indexOf(word) != -1){
            return eval(word);
        }
        if(isNaN(word)){
            return word.toString();
        }
        return Number(word);
    }
    function getFile(path){
        if(!path.includes("/")){
            path = __dirname + "/db/"+path;
        }
        if (fs.existsSync(path)){
            var contents = fs.readFileSync(path, 'utf8');
            return contents;
        }else{
            fs.writeFile(path, "", function (err) {
                if (err) throw err;
            });
            return "{}";
        }
    }

    function setFile(path,data){
        if(!path.includes("/")){
            path = __dirname + "/db/"+path;
        }
        fs.writeFileSync(path, data, function (err) {
            if (err) throw err;
        });
    }
    function btoa(str){
        return Buffer.from(str, 'binary').toString('base64')
    }
    function atob(str){
        return Buffer.from(str, 'base64').toString('binary')
    }
    function getSort(array){
        let arr = [];
        let sort = [];
        for(i=0;i<array.length;i++){
            sort.push(array[i]);
        }
        sort.sort(function(a, b) {
            return a > b ? 1 : a < b ? -1 : 0;
        });
        for(i=0;i<array.length;i++){
            let value = array[i];
            let index = sort.indexOf(value);
            delete sort[index];
            arr.push([i,index]);
        }
        return arr;
    }
    function setSort(array,sort){
        let arr = [];
        for(i=0;i<array.length;i++){
            from = array[i][0];
            to = array[i][1];
            arr[to] = sort[from];
        }
        return arr;
    }
    function pure(str){
        let new_str = [];
        let keywords = ["CREATE","TABLE","DROP","COLUMN","SET","UPDATE","INSERT","INTO","DELETE","TRUNCATE","SELECT","FROM","WHERE","ORDER","BY","LIMIT","ASC","DESC","NOT","AND","OR","VALUES","VALUE","DISTINCT","ALTER","ADD"];
        str = str.trim().split(" ");
        str.forEach(function(i){
            if(keywords.indexOf(i.toUpperCase()) != -1){
                new_str.push(i.toLowerCase());
            }else{
                new_str.push(i);
            }
        })
        return new_str.join(" ");
    }
    this.export = function(path,isPath=true){
        let data = btoa(JSON.stringify(db.getDB()));
        this.error = false;
        this.result = "Exported to " + path;
        if(isPath){
            setFile(path,data);
        }else{
            return data;
        }
    }
    this.import = function(path,isPath=true){
        let database = "";

        if(isPath){
            database = getFile(path);
        }else{
            database = path;
        }
        try{
            database = atob(database);
        }catch(e){
            this.error = true;
            this.result = "Bad DataBase";
            return false;
        }
        //check if database is good and user is logged in
        if(!db.logged){
            this.error = true;
            this.result = "User Not Logged In!";
            return false;
        }
        try{
            JSON.parse(database);
        }catch(e){
            this.error = true;
            this.result = "Bad DataBase";
            return false;
        }
        if(!database.includes("DB_TABLES")){
            this.error = true;
            this.result = "Bad DataBase";
            return false;
        }
        database = JSON.parse(database);
        db.setDB(database);
        this.error = false;
        if(isPath){
            this.result = "Imported From " + path;
        }else{
            this.result = "Imported Successfully";
        }
    }
    this.merge = function(path,isPath=true){
        let database = "";
        
        if(isPath){
            database = getFile(path);
        }else{
            database = path;
        }
        try{
            database = atob(database);
        }catch(e){
            this.error = true;
            this.result = "Bad DataBase";
            return false;
        }
        //check if database is good and user is logged in
        if(!db.logged){
            this.error = true;
            this.result = "User Not Logged In!";
            return false;
        }
        try{
            JSON.parse(database);
        }catch(e){
            this.error = true;
            this.result = "Bad DataBase";
            return false;
        }
        if(!database.includes("DB_TABLES")){
            this.error = true;
            this.result = "Bad DataBase";
            return false;
        }
        let data = db.getDB();
        database = JSON.parse(database);
        let rows = Object.assign(data["DB_TABLES"],database["DB_TABLES"]);
        let newDB = Object.assign(data,database);
        newDB["DB_TABLES"] = rows;
        db.setDB(newDB);
        if(isPath){
            this.error = false;
            this.result = "Merged From " + path;
        }else{
            this.error = false;
            this.result = "Merged Successfully";
        }
    }
    this.query = function(qry){
        db.error = false;
        db.result = "";
        if(qry.trim() == ""){
            db.error = true;
            db.result = "No Query Entered";
            return false;
        }
        qry = pure(qry);
        let str = qry.split(" ").fix();
        let word = str[0].toUpperCase();
        
        if(word == "CREATE"){
            //Handle Create
            if(str[1].toUpperCase() == "TABLE"){
                let line = str.join(" ");
                let tb_name = "";
                let tb_config = "";

                //get tb_name
                tb_name = line.substring(line.indexOf("table")+5,line.indexOf("(")).trim();
                tb_config = line.substring(line.indexOf("(")+1,line.indexOf(")")).trim();
                if(tb_config == ""){
                    db.error = true;
                    db.result = "Can Not Create Empty Table";
                    return false;
                }
                tb_config = tb_config.split(",");
                //add custom rows
                tb_config = ["id","time"].concat(tb_config);
                let len = tb_config.length;
                let theDB = db.getDB();
                if(theDB == undefined){
                    theDB = {};
                }

                if(theDB.DB_TABLES == null){
                    theDB.DB_TABLES = {};
                    theDB.DB_TABLES[tb_name] = tb_config;
                }else{
                    if(theDB[tb_name] != null){
                        db.error = true;
                        db.result = "Table '"+tb_name+"' Already Exists!";
                        return true;
                    }
                    theDB.DB_TABLES[tb_name] = tb_config;
                }
                let theTB = theDB[tb_name] = {};
                //Add Custom Tables
                theTB.id = [];
                theTB.time = [];

                for(k=0;k<len;k++){
                    let ONETB = tb_config[k];
                    theTB[ONETB] = [];
                }
                db.setDB(theDB);
                db.error = false;
                db.result = "Created Table '"+tb_name+"'";
            }else{
                 db.result = "Unexpected String " + str[1];
                 db.error = true;
            }
        }else if(word == "SELECT"){
            if(str[1] == "distinct"){
                let distinct = "";
                let from = ""
                let line = str.join(" ");

                //get distinct
                distinct = line.substring(line.indexOf("distinct")+8,line.indexOf("from")).trim();
                //get from
                from = line.substring(line.indexOf("from")+4,line.length).trim();
                //execute query
                let theDB = db.getDB();
                let data = {};
                //check if table exists
                if(theDB[from] != null){
                    let theTB = theDB[from];
                    let len = theTB.id.length;
                    let keys = theDB.DB_TABLES[from];
                    //check if column exists
                    if(keys.indexOf(distinct) != -1){
                        db.error = false;
                        db.length = theTB[distinct].unique().length;
                        data[distinct] = theTB[distinct].unique();
                        data["length"] = theTB[distinct].unique().length;
                        db.result = data;
                    }else{
                        db.error = true;
                        db.result = "Column '"+distinct+"' Does Not Exist";
                    }
                }else{
                    db.error = true;
                    db.result = "Table '"+from+"' Does Not Exist";
                }
                //console.log(data);
            }else{
                //check if query is good
                if(!qry.includes("from")){
                    db.error = true;
                    db.result = "FROM expected: Specify Where to SELECT From";
                    return true;
                }
                //handle SELECT
                let select = "";
                let from = "";
                let where = "";
                let orderBy = "";
                let order = "ASC";
                let limit = "";
                let line = str.join(" ");

                //get select
                select = line.substring(line.indexOf(" "),line.indexOf("from")).trim();
                //get from
                if(line.includes("where")){
                    from = line.substring(line.indexOf("from")+5,line.indexOf("where")).trim();
                }else if(line.includes("order by")){
                    from = line.substring(line.indexOf("from")+5,line.indexOf("order by")).trim();
                }else if(line.includes("limit")){
                    from = line.substring(line.indexOf("from")+5,line.indexOf("limit")).trim();
                }else{
                    from = line.substring(line.indexOf("from")+5,line.length).trim();
                }
                //get where
                if(line.includes("where")){
                    if(line.includes("order by")){
                        where = line.substring(line.indexOf("where")+5,line.indexOf("order by")).trim();
                    }else if(line.includes("limit")){
                        where = line.substring(line.indexOf("where")+5,line.indexOf("limit")).trim();
                    }else{
                        where = line.substring(line.indexOf("where")+5,line.length).trim();
                    }
                    where = where.replaceAll("=","==").replaceAll("and","&&");
                }
                //get orderBy
                if(line.includes("order by")){
                    if(line.substring(line.indexOf("order by")+8,line.length).includes("desc")){
                        orderBy = line.substring(line.indexOf("order by")+8,line.indexOf("desc")).trim();
                    }else if(line.substring(line.indexOf("order by")+8,line.length).includes("asc")){
                        orderBy = line.substring(line.indexOf("order by")+8,line.indexOf("asc")).trim();
                    }else if(line.includes("limit")){
                        orderBy = line.substring(line.indexOf("order by")+8,line.indexOf("limit")).trim();
                    }else{
                        orderBy = line.substring(line.indexOf("order by")+8,line.length).trim();
                    }
                    if(line.substring(line.indexOf("order by")+8,line.length).includes("desc")){
                        order = "DESC";
                    }
                }
                //get LIMIT
                if(line.includes("limit")){
                    limit = line.substring(line.indexOf("limit")+5,line.length).trim();
                }
                //execute query
                let theDB = db.getDB();
                let data = {};
                //check if table exists
                if(theDB[from] != null){
                    let theTB = theDB[from];
                    let len = theTB.id.length;
                    let keys = theDB.DB_TABLES[from];
                    let values = [];
                    let indexs = [];
                    //if column is *
                    if(select == "*"){
                        select = keys.join(",");
                    }
                    let selects = select.split(",");
                    //check if column exists
                    for(k=0;k<selects.length;k++){
                        let select = selects[k];
                        if(keys.indexOf(select) == -1){
                            db.error = true;
                            db.result = "Column '"+select+"' Does Not Exist";
                            return false;
                        }
                    }
                    //where
                    if(where != ""){
                        for(j=0;j<len;j++){
                            let value = []
                            for(k=0;k<keys.length;k++){
                                let key = keys[k];
                                value.push(theTB[key][j])
                            }
                            values.push(value);
                        }
                        for(j=0;j<len;j++){
                            let new_where = where.rep(keys,values[j]);
                            //console.log(new_where);
                            try{
                                if(eval(new_where)){
                                    indexs.push(j);
                                }
                            }catch(e){

                            }
                        }
                        //console.log(indexs);
                    }
                    //Select
                    if(select == "*"){
                        data = theTB;
                        select = theDB.DB_TABLES[from].join(",");
                    }else{
                        if(selects.length != 0){
                            //check if rows exist in table
                            for(k=0;k<selects.length;k++){
                                if(theDB.DB_TABLES[from].indexOf(selects[k]) != -1){
                                    if(indexs != ""){
                                        for(j=0;j<indexs.length;j++){
                                            let ind = indexs[j];
                                            let row = theTB[selects[k]][ind];
                                            if(data[selects[k]] == (undefined||null)){
                                                data[selects[k]] = [row]
                                            }else{
                                                data[selects[k]].push(row);
                                            }
                                        }
                                    }else{
                                        let row = theTB[selects[k]];
                                        data[selects[k]] = row
                                    }
                                }else{
                                    db.error = true;
                                    db.result = "Row '"+selects[k]+"' Not In "+ from;
                                }
                            }
                        }
                    }
                    //Order By
                    if(orderBy != ""){
                        if(keys.indexOf(orderBy) != -1){
                            if(selects.indexOf(orderBy) == -1){
                                db.error = true;
                                db.result = "Can Not Order By '"+orderBy+"'";
                                return false;
                            }
                            let sortSetting = getSort(data[orderBy]);
                            //console.log(sortSetting);
                            let obj = {};
                            for(j=0;j<selects.length;j++){
                                let row = selects[j];
                                if(order == "ASC"){
                                    obj[row] = setSort(sortSetting,data[row]);
                                }else if(order == "DESC"){
                                    obj[row] = setSort(sortSetting,data[row]).reverse();
                                }else{
                                    obj[row] = setSort(sortSetting,data[row]);
                                }
                            }
                            //console.log(data);
                            //console.log(obj);
                            data = obj;
                        }
                    }
                    //LIMIT
                    if(limit != ""){
                        let end = Number(limit);
                        for(k=0;k<selects.length;k++){
                            let select = selects[k];
                            data[select] = data[select].slice(0,end);
                        }
                    }
                    //Result
                    select = selects[0];
                    if(data != {}){
                        data.length = data[select].length;
                    }else{
                        data.length = 0;
                    }

                    db.result = data;
                }else{
                    db.error = true;
                    db.result = "Table '"+from+"' Does Not Exist";
                }
            }
        }else if(word == "DELETE"){
            if(str[1] == "from"){
                let from = "";
                let where = "";
                let line = str.join(" ");

                //get from
                if(line.includes("where")){
                    from = line.substring(line.indexOf("from")+5,line.indexOf("where")).trim();
                }else{
                    from = line.substring(line.indexOf("from")+5,line.length).trim();
                }
                //get where
                if(line.includes("where")){
                    if(line.includes("order by")){
                        where = line.substring(line.indexOf("where")+5,line.indexOf("order by")).trim();
                    }else if(line.includes("limit")){
                        where = line.substring(line.indexOf("where")+5,line.indexOf("limit")).trim();
                    }else{
                        where = line.substring(line.indexOf("where")+5,line.length).trim();
                    }
                    where = where.replaceAll("=","==").replaceAll("and","&&");
                }
                //execute query
                let theDB = db.getDB();
                let data = {};
                //check if table exists
                if(theDB[from] != null){
                    let theTB = theDB[from];
                    data = theTB;
                    let len = theTB.id.length;
                    let keys = theDB.DB_TABLES[from];
                    let values = [];
                    let indexs = [];
                    //where
                    if(where != ""){
                        for(j=0;j<len;j++){
                            let value = []
                            for(k=0;k<keys.length;k++){
                                let key = keys[k];
                                value.push(theTB[key][j])
                            }
                            values.push(value);
                        }
                        for(j=0;j<len;j++){
                            let new_where = where.rep(keys,values[j]);
                            //console.log(values[i]);
                            try{
                                if(eval(new_where)){
                                    indexs.push(j);
                                }
                            }catch(e){

                            }
                        }
                        for(o=0;o<keys.length;o++){
                            let key = keys[o];
                            for(i=indexs.length - 1;i >= 0; i--){
                                let ind = indexs[i];
                                //console.log(data[key][ind]);
                                data[key].splice(indexs[i],1);
                            }
                        }
                        theDB[from] = data;
                        db.setDB(theDB);
                        db.error = false;
                        db.result = indexs.length + " Rows Affected";
                        //console.log(data);
                    }else{
                        let theTB = theDB[from];
                        data = theTB;
                        let len = theTB.id.length;
                        let keys = theDB.DB_TABLES[from];
                        for(i=0;i<keys.length;i++){
                            let key = keys[i];
                            data[key] = [];
                        }
                        theDB[from] = data;
                        db.setDB(theDB);
                        db.error = false;
                        db.result = len + " Rows Affected";
                    }
                }else{
                    db.error = true;
                    db.result = "Table '"+from+"' Does Not Exist";
                }
            }else{
                db.error = true;
                db.result = "Unexpected String '"+str[1]+"'";
            }
        }else if(word == "INSERT"){
            if(str[1] == "into"){
                let into = "";
                let rows = "";
                let values = "";
                let line = str.join(" ");

                //get into
                let check = line.substring(line.indexOf("into"),line.indexOf("values"));
                if(line.includes("values") && (!check.includes("(") && !check.includes(")"))){
                    into = line.substring(line.indexOf("into")+4,line.indexOf("values")).trim();
                }else if(check.includes("(") && check.includes(")")){
                    into = line.substring(line.indexOf("into")+4,line.indexOf("(")).trim();
                }else{
                    db.error = true;
                    db.result = "Expected Keyword 'VALUES'";
                    return false;
                }
                //get rows
                check = line.substring(0,line.indexOf("values"));
                if(check.includes("(") && check.includes(")")){
                    rows = check.substring(check.indexOf("(")+1,check.indexOf(")")).trim();
                    rows = rows.split(",");
                    rows = rows.unique();
                }
                //get values
                check = line.substring(line.indexOf("values")+6,line.length).trim()
                if(check.includes("(") && check.includes(")")){
                    values = check.substring(check.indexOf("(")+1,check.indexOf(")")).trim().splitComma();
                }
                //execute query
                let theDB = db.getDB();
                let data = {};
                //check if table exists
                if(theDB[into] != null){
                    let theTB = theDB[into];
                    data = theTB;
                    let len = theTB.id.length;
                    let keys = theDB.DB_TABLES[into];
                    //check if rows exists
                    if(rows != ""){
                        for(i=0;i<keys.length;i++){
                            for(j=0;j<rows.length;j++){
                                let row = rows[j];
                                if(keys.indexOf(row) == -1){
                                    db.error = true;
                                    db.result = "Unknown Column '"+row+"'";
                                    return false;
                                }
                            }
                        }
                    }else{
                        if(values.length == keys.length){
                            rows = keys;
                        }else{
                            rows = keys.slice(2,keys.length);
                        }
                    }
                    //value oversize error
                    if(rows != ""){
                        if(values.length > rows.length){
                            db.error = true;
                            db.result = "Unexpected Values '"+values.splice(keys.length+1,values.length).join(",")+"'";
                            return false;
                        }
                    }
                    //insert values
                    let last_id = data["id"][data["id"].length-1]+1;
                    if(isNaN(last_id)){
                        last_id = 1;
                    }
                    db.lastId = last_id;
                    data["id"].push(last_id)
                    data["time"].push(Number(Date.now()))
                    for(j=0;j<values.length;j++){
                        let key = rows[j];
                        //console.log(values[j])
                        data[rows[j]].push(getType(values[j].remApo()));
                    }
                    let leftrows = [];
                    for(i=0;i<rows.length;i++){
                        for(j=0;j<keys.length;j++){
                            let key = keys[j];
                            let exclude = ["id","time"]
                            if(rows.indexOf(key) == -1 && exclude.indexOf(key) == -1){
                                leftrows.push(key);
                            }
                        }
                    }
                    if(leftrows.unique().length != 0){
                        for(i=0;i<leftrows.unique().length;i++){
                            data[leftrows.unique()[i]].push(getType("null"));
                        }
                    }
                    theDB[into] = data;
                    db.setDB(theDB);
                    db.error = false;
                    db.result = (rows.length + 2) + " Rows affected";
                }else{
                    db.error = true;
                    db.result = "Table '"+into+"' Does Not Exist";
                }

                //console.log(data);
            }else{
                db.error = true;
                db.result = "Unexpected String '"+str[1]+"'";
            }
        }else if(word == "DROP"){
            if(str[1] == "table"){
                if(str.length > 3){
                    db.error = true;
                    db.result = "Unexpected String '"+str[3]+"'";
                }else{
                    let table = str[2];
                    //execute query
                    let theDB = db.getDB();
                    //check if table exists
                    if(theDB[table] != null){
                        let len = theDB[table].id.length;
                        delete theDB[table];
                        delete theDB.DB_TABLES[table];
                        db.error = false;
                        db.result = len + " Rows Affected";
                        db.setDB(theDB);
                    }else{
                        db.error = true;
                        db.result = "Table '"+table+"' Does Not Exist";
                    }
                }
            }else{
                db.error = true;
                db.result = "Unexpected String '"+str[1]+"'";
            }
        }else if(word == "UPDATE"){
            if(str[2] == "set"){
                let update = "";
                let rows = [];
                let values = [];
                let line = str.join(" ");

                //get update
                update = line.substring(line.indexOf("update")+6,line.indexOf("set")).trim();
                //get rows
                check = line.substring(line.indexOf("set")+3,line.length).trim();
                if(check.includes("where")){
                    rows = check.substring(0,check.indexOf("where")).trim();
                }else{
                    rows = check.substring(0,check.length).trim();
                }
                if(rows.length != 0){
                    let nrows = rows;
                    rows = [];
                    nrows = nrows.split(",");
                    nrows.forEach(function(i){
                        a = i.split("=");
                        rows.push(a[0].trim());
                        values.push(getType(a[1].remApo()));
                    });
                }
                //check if trying to set id or time
                for(j=0;j<rows.length;j++){
                    let arr = rows;
                    if(arr.indexOf("id") != -1){
                        db.error = true;
                        db.result = "Can Not Execute Set on 'id'";   
                        return false; 
                    }
                    if(arr.indexOf("time") != -1){
                        db.error = true;
                        db.result = "Can Not Execute Set on 'time'";   
                        return false; 
                    }
                }
                //get where
                where = line.substring(line.indexOf("where")+5,line.length).trim();
                where = where.replaceAll("=","==").replaceAll("and","&&");

                //execute query
                let theDB = db.getDB();
                let data = {};
                //check if table exists
                if(theDB[update] != null){
                    let theTB = theDB[update];
                    data = theTB;
                    let len = theTB.id.length;
                    let keys = theDB.DB_TABLES[update];
                    let indexs = [];
                    let items = [];
                    //where
                    if(where != ""){
                        for(i=0;i<len;i++){
                            let value = []
                            for(k=0;k<keys.length;k++){
                                let key = keys[k];
                                value.push(theTB[key][i])
                            }
                            items.push(value);
                        }
                        //console.log(items)
                        for(i=0;i<len;i++){
                            let new_where = where.rep(keys,items[i]);
                            //console.log(new_where);
                            try{
                                if(eval(new_where)){
                                    indexs.push(i);
                                }
                            }catch(e){

                            }
                        }
                        //console.log(indexs);
                    }
                    //Update
                    if(rows.length != 0){
                        //check if rows exist in table
                        for(i=0;i<rows.length;i++){
                            if(theDB.DB_TABLES[update].indexOf(rows[i]) != -1){
                                if(indexs != ""){
                                    for(j=0;j<indexs.length;j++){
                                        let ind = indexs[j];
                                        data[rows[i]][ind] = values[i];
                                    }
                                }
                            }else{
                                db.error = true;
                                db.result = "Row '"+rows[i]+"' Not In "+ update;
                            }
                        }
                    }
                    db.error = false;
                    db.result = indexs.length + " Rows Affected";
                    theDB[update] = data;
                    db.setDB(theDB);
                    //console.log(data);
                }else{
                    db.error = true;
                    db.result = "Table '"+update+"' Does Not Exist";
                }
            }else{
                db.error = true;
                db.result = "Unexpected String '"+str[2]+"'";
            }
        }else if(word == "ALTER"){
            if(str[1] == "table"){
                let line = str.join(" ");
                if(str[3] == "add"){
                    let alter = line.substring(line.indexOf("table")+5,line.indexOf("add")).trim();
                    let col = line.substring(line.indexOf("add")+3,line.length).trim();
                    //Error on multiple
                    if(col.includes(",")){
                        db.error = true;
                        db.result = "1 Column Expected";
                        return false;
                    }
                    if(alter.includes(",")){
                        db.error = true;
                        db.result = "1 Table Expected";
                        return false;
                    }
                    //execute query
                    let theDB = db.getDB();
                    let data = {};
                    //check if table exists
                    if(theDB[alter] != null){
                        let theTB = theDB[alter];
                        data = theTB;
                        let len = theTB.id.length;
                        let keys = theDB.DB_TABLES[alter];
                        if(keys.indexOf(col) == -1){
                            keys.push(col);
                            theTB[col] = [];
                            //fill empty rows
                            for(i=0;i<len;i++){
                                theTB[col][i] = null;
                            }
                            db.setDB(theDB);
                            db.error = false;
                            db.result = "1 Column Affected";
                        }else{
                            db.error = true;
                            db.result = "Column '"+col+"' Already Exists";
                        }
                        //console.log(theDB);
                    }else{
                        db.error = true;
                        db.result = "Table '"+alter+"' Does Not Exist";
                    }
                }else if(str[3] == "drop" && str[4] == "column"){
                    let alter = line.substring(line.indexOf("table")+5,line.indexOf("drop")).trim();
                    let col = line.substring(line.indexOf("column")+6,line.length).trim();
                    //Error on multiple
                    if(col.includes(",")){
                        db.error = true;
                        db.result = "1 Column Expected";
                        return false;
                    }
                    if(alter.includes(",")){
                        db.error = true;
                        db.result = "1 Table Expected";
                        return false;
                    }
                    //execute query
                    let theDB = db.getDB();
                    let data = {};
                    //check if table exists
                    if(theDB[alter] != null){
                        let theTB = theDB[alter];
                        data = theTB;
                        let len = theTB.id.length;
                        let keys = theDB.DB_TABLES[alter];
                        if(keys.indexOf(col) != -1){
                            let exclude = ["id","time"];
                            if(exclude.indexOf(col) == -1){
                                keys.splice(keys.indexOf(col),1);
                                delete theTB[col];
                                db.setDB(theDB);
                                db.error = false;
                                db.result = "1 Column Affected";
                            }else{
                                db.error = true;
                                db.result = "Can Not Execute '"+word+"' On Column '"+col+"'";
                            }
                        }else{
                            db.error = true;
                            db.result = "Column '"+col+"' Does Not Exist";
                        }
                        //console.log(theDB);
                    }
                }else{
                    db.error = true;
                    db.result = "Query Error";
                }
            }else{
                db.error = true;
                db.result = "Unexpected String '"+str[1]+"'";
            }
        }else if(word == "TRUNCATE"){
            if(str[1] == "table" && str.length == 3){
                let truncate = "";
                let line = str.join(" ");
                //get truncate
                truncate = line.substring(line.indexOf("table")+5,line.length).trim();
                //execute query
                let theDB = db.getDB();
                let data = {};
                //check if table exists
                if(theDB[truncate] != null){
                    let theTB = theDB[truncate];
                    data = theTB;
                    let len = theTB.id.length;
                    let keys = theDB.DB_TABLES[truncate];
                    for(i=0;i<keys.length;i++){
                        let key = keys[i];
                        data[key] = [];
                    }
                    db.setDB(theDB);
                    db.error = false;
                    db.result = keys.length + " Columns Affected";
                }else{
                    db.error = true;
                    db.result = "Table '"+truncate+"' Does Not Exist";
                }
            }else{
                db.error = true;
                db.result = "Query Error";
            }
        }else{
            db.error = true;
            db.result = "Unknown Keyword " + word;
        }
    }
    this.setFilter = function(func){
        filter = func;
    }
    this.result = function(){
        return db.result;
    }
    this.error = function(){
        return db.error;
    }
}

//command line

let adminDB = new NOdb();
const options = args;

 if(options.s){
     if(options.s === true){
        adminDB.admin(4042);
     }else{
         adminDB.admin(options.s);
     }
 }else if(options.v || options.version){
     console.log(package.version);
 }else if(options.l){
     if(typeof options.l == "string"){
        adminDB.console(options.l);
     }else{
         console.log(chalk.green("? ") + "NODB> "+ chalk.red("Specify Path to DataBase"));
     }
 }else{
    //adminDB.admin();
 }

module.exports = NOdb;