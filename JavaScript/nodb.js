/********************
 * Made by DEV BASH *
 * Took N days      *
 * From Nigeria     *
 ********************/

let filter = "";

//like function
function like(word,match){
    if(typeof word == "number"){
        word = word.toLocaleString().replaceAll(",","");
    }
    if(typeof match == "number"){
        match = match.toLocaleString().replaceAll(",","");
    }
    return word.includes(match);
}

function NOdb(config=null){
    let lastDB = null;
    let db = this;
    db.result = "User Not Logged In!"
    db.error = true;
    db.length = null;
    db.encrypt = false;
    db.logged = false;
    db.lastId = null;
    db.isWeb = false;
    this.login = function(config){
        if(config == null){
            throw("config is missing");
        }
        if(config.database == null){
            throw("database is missing");
        }
        if(config.path == null){
            throw("path is missing");
        }else{
            if(!config.path.includes("/")){
                config.path = "/db/"+config.path;
            }
        }
        if(config.encrypt == null){
            config.encrypt = false;
        }
        if(config.web){
            db.isWeb = true;
        }
        if(config.password == null && config.encrypt == true){
            throw("password is missing");
        }
        if(config.encrypt == true && typeof sjcl != "object"){
            throw("Can Not Find sjcl for Encrypting Database!");
        }
        if(!db.isWeb){
            if(config.encrypt == true){
                if(typeof sjcl == "undefined"){
                    config.encrypt = false;
                    db.encrypt = false;
                }else{
                    db.encrypt = true;
                    //try to login or create
                    try{
                        if(localStorage.getItem(config.path) == null){
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
                if(localStorage.getItem(config.path) == null){
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
        }else{
            //Its a web database
            let gotDB = ajaxSync({
                url:config.path,
                type:"GET",
                params:"",
            });
            if(gotDB == "Error Occured"){
                db.result = "Error loading Database";
                db.error = true;
            }else{
                try{
                    JSON.parse(gotDB);
                }catch(e){
                    db.result = "Bad DB";
                    db.error = true;
                    return false;
                }
                db.error = false;
                db.result = "login success";
                db.logged = true;
            }
        }
        db.name = config.database;
        db.pass = config.password;
        db.path = config.path
    }
    if(config){
        db.login(config);
    }
    this.getDB = function(){
        if(db.isWeb){
            let gotDB = ajaxSync({
                url:db.path,
                type:"GET",
                params:"",
            });
            if(gotDB == "Error Occured"){
                db.result = "Error loading Database";
                db.error = true;
                throw("Error loading Database");
            }else{
                try{
                    return JSON.parse(gotDB);
                }catch(e){
                    db.result = "Bad DB";
                    db.error = true;
                    return false;
                }
            }
        }
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
        if(db.isWeb){
            db.result = "Error Setting Database";
            db.error = true;
            throw("Error Setting Database");
        }
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
                replaced = this.replace(new RegExp("\\b"+keys[p]+"\\b","g"),setType(values[p]));
            }else{
                replaced = replaced.replace(new RegExp("\\b"+keys[p]+"\\b","g"),setType(values[p]))
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

    function ajaxSync(json) {
        json = JSON.stringify(json);
        let res = "";
        var data = JSON.parse(json);
        var url = data.url;
        var type = data.type;
        var params = data.params.toString();

        if (window.XMLHttpRequest) {
            // code for modern browsers
            xh = new XMLHttpRequest();
        } else {
            // code for old IE browsers
            xh = new ActiveXObject("Microsoft.XMLHTTP");
        }

        xh.onload = function() {
            if (xh.status == 200) {
                res = xh.responseText;
            }else{
                res = "Error Occured";
            }
        }
        xh.onerror = function(){
            res = "Error Occured";
        }
        if (type.toLowerCase() == "get") {
            xh.open(type, url, false);
            xh.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            xh.send();
        } else if (type.toLowerCase() == "post") {
            xh.open(type, url, false);
            xh.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            xh.send(params);
        } else {
            throw ("Can only take GET and POST");
        }
        return res;
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
        if(word.startsWith("{") && word.endsWith("}")){
            try{
                return JSON.parse(JSON.stringify(word));
            }catch(e){
                //console.log("Error: "+e);
            }
        }
        if(isNaN(word)){
            return word.toString();
        }
        return Number(word);
    }
    function getFile(path){
        let file = localStorage.getItem(path);
        if(file == null){
            return "{}";
        }
        return file;
    }

    function setFile(path,data){
        localStorage.setItem(path,data);
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
    this.query = function(qry){
        db.error = false;
        db.result = "";
        db.length = null;
        
        if(qry.trim() == ""){
            db.error = true;
            db.result = "No Query Entered";
            return false;
        }
        if(!db.logged){
            db.result = "User Not Logged In!"
            db.error = true;
            return false;
        }
        qry = pure(qry);
        let str = qry.split(" ").fix();
        let word = str[0].toUpperCase();
        
        if(word == "CREATE"){
            if(db.isWeb){
                db.result = "Can Not Modify Database";
                db.error = true;
                return false;
            }
            //Handle Create
            if(str[1].toUpperCase() == "TABLE"){
                lastDB = db.getDB();
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
                        return false;
                    }
                }else{
                    db.error = true;
                    db.result = "Table '"+from+"' Does Not Exist";
                    return false;
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
                //fix duplictae selects
                select = select.split(",").unique().join(",");

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
                    where = where.replaceAll("=","==").replaceAll("and","&&").replaceAll("or","||");
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
                                    if(indexs.length != 0){
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
                                        if(where == ""){
                                            let row = theTB[selects[k]];
                                            data[selects[k]] = row
                                        }else{
                                            data[selects[k]] = [];
                                        }
                                    }
                                }else{
                                    db.error = true;
                                    db.result = "Row '"+selects[k]+"' Not In "+ from;
                                    return false;
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
                        db.length = data[select].length;
                    }else{
                        db.length = 0;
                    }

                    db.result = data;
                }else{
                    db.error = true;
                    db.result = "Table '"+from+"' Does Not Exist";
                }
            }
        }else if(word == "DELETE"){
            if(db.isWeb){
                db.result = "Can Not Modify Database";
                db.error = true;
                return false;
            }
            lastDB = db.getDB();
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
                    where = where.replaceAll("=","==").replaceAll("and","&&").replaceAll("or","||");
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
            if(db.isWeb){
                db.result = "Can Not Modify Database";
                db.error = true;
                return false;
            }
            if(str[1] == "into"){
                lastDB = db.getDB();
                let into = "";
                let rows = "";
                let values = "";
                let line = str.join(" ");

                //get into
                let check = line.substring(line.indexOf("into"),line.indexOf("values"));
                
                if(line.includes("values") && (!check.includes("(") && !check.includes(")"))){
                    into = line.substring(line.indexOf("into")+4,line.indexOf("values")).trim();
                }else if(line.includes("value") && (!check.includes("(") && !check.includes(")"))){
                    into = line.substring(line.indexOf("into")+4,line.indexOf("value")).trim();
                }else if(line.includes("VALUES") && (!check.includes("(") && !check.includes(")"))){
                    into = line.substring(line.indexOf("into")+4,line.indexOf("VALUES")).trim();
                }else if(line.includes("VALUE") && (!check.includes("(") && !check.includes(")"))){
                    into = line.substring(line.indexOf("into")+4,line.indexOf("VALUE")).trim();
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
                //check if is special table
                if(into == "DB_TABLES"){
                    db.error = true;
                    db.result = "You Can Not Insert Into This Table";
                    return false;
                }
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
                            rows.splice(values.length);
                        }
                    }
                    //value oversize error
                    if(rows != ""){
                        if(values.length > rows.length){
                            db.error = true;
                            db.result = "Unexpected Values '"+values.splice(rows.length).join(",")+"'";
                            return false;
                        }
                        if(values.length == keys.length){
                            db.error = true;
                            db.result = "Unexpected Values '"+values.splice(2).join(",")+"'";
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
            if(db.isWeb){
                db.result = "Can Not Modify Database";
                db.error = true;
                return false;
            }
            if(str[1] == "table"){
                lastDB = db.getDB();
                if(str.length > 3){
                    db.error = true;
                    db.result = "Unexpected String '"+str[3]+"'";
                }else{
                    let table = str[2];
                    //execute query
                    let theDB = db.getDB();
                    //check if is special table
                    if(table == "DB_TABLES"){
                        db.error = true;
                        db.result = "You Can Not Drop This Table";
                        return false;
                    }
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
            if(db.isWeb){
                db.result = "Can Not Modify Database";
                db.error = true;
                return false;
            }
            if(str[2] == "set"){
                lastDB = db.getDB();
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
                where = where.replaceAll("=","==").replaceAll("and","&&").replaceAll("or","||");

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
            if(db.isWeb){
                db.result = "Can Not Modify Database";
                db.error = true;
                return false;
            }
            if(str[1] == "table"){
                let line = str.join(" ");
                if(str[3] == "add"){
                    lastDB = db.getDB();
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
                    lastDB = db.getDB();
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
            if(db.isWeb){
                db.result = "Can Not Modify Database";
                db.error = true;
                return false;
            }
            if(str[1] == "table" && str.length == 3){
                lastDB = db.getDB();
                let truncate = "";
                let line = str.join(" ");
                //get truncate
                truncate = line.substring(line.indexOf("table")+5,line.length).trim();
                //execute query
                let theDB = db.getDB();
                let data = {};
                //check if is special table
                if(truncate == "DB_TABLES"){
                    db.error = true;
                    db.result = "You Can Not Truncate This Table";
                    return false;
                }
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
        return db.result;
    }
    this.undo = function(){
        if(lastDB != null){
            db.setDB(lastDB);
            db.result = "Query Undone";
            db.error = false;
        }else{
            db.error = true;
            db.result = "Query can not be undone";
        }
    }
    this.setFilter = function(func){
        filter = func;
    }
    this.escape = function(str){
        return escape(str);
    }
    this.showTable = function(){
        try{
            if(typeof db.result == "object"){
                console.table(db.result);
            }else{
                console.warn("Error displaying table");
            }
        }catch(e){
            console.warn("Error displaying table");
        }
    }
}

try{
    module.exports = NOdb;
}catch(e){
    
}