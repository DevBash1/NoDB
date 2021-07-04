import ajax from ajax.js

var socket = io.connect("/");

let server = @("#server");
server.html(document.location.href);

function query(query,callback){
    ajax({
        url:"/?"+query,
        type:"POST",
        params:""
    },function(res){
        callback(res);
    })
    setTables();
}

function notify(text, type="info"){
    var notifier = new Notifier({
        position: 'top-right',
        direction: 'top',
    });
    var notification = notifier.notify(type, text);
    notification.push();
}

function getTables(back){
    socket.emit("tables","");
    socket.on("tables", function(data){
        eval(back)(data);
    })
}

function openTab(evt, tabName) {
  // Declare all variables
  var i, tabcontent, tablinks;

  // Get all elements with class="tabcontent" and hide them
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  // Get all elements with class="tablinks" and remove the class "active"
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // Show the current tab, and add an "active" class to the button that opened the tab
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";
}

function setTables(){
    getTables(function(tables){
        let list = @("#ctn");
        list.html("");

        tables.forEach(function(table){
            list.innerHTML += `<div id="newDb">
                                <div class="flexBetween" style="width:min-content;">
                                    <span style="border:0px;">
                                        <button id="btn1" class="fa fa-plus-square"></button>
                                        <button id="btn2" class="fa fa-database"></button>
                                    </span>
                                    <button class="name" onclick="openTable('${table}')">${table}</button>
                                </div>
                            </div>`;
        })
    })
}
setTables();

function openTable(table){
    let tableBtn = @(".dataBase");
    tableBtn.click();
    let tableList = @("#dataBase");
    tableList.html("");

    //css injection
    @var height = (screen.height - 170) + "px";
    @css
        #ctn{
            height: @height; 
        }
        #content{
            height: @height; 
        }
    @css
    
    let Bigtable = "<table>";
    query("SELECT * FROM "+table,function(data){
        //Add Table Heads
        data = JSON.parse(data);
        let tableHeads = Object.keys(data.result);
        tableHeads.splice(tableHeads.indexOf("length"),1)
        Bigtable += "<tr>";
        tableHeads.forEach(function(i){
            Bigtable += "<th>"+i+"</th>";
        })
        Bigtable += "</tr>";
        //Add Table Body
        for(i=0;i<data.result.length;i++){
            if(i%2 == 0){
                Bigtable += "<tr class='style1'>";
            }else{
                Bigtable += "<tr class='style2'>";
            }
            tableHeads.forEach(function(j){
                let exclude = ["id","time"];

                if(exclude.indexOf(j) != -1){
                    Bigtable += "<td>"+data.result[j][i]+"</td>";
                }else{
                    Bigtable += "<td contenteditable onkeyup=\"updateCol(event,'"+table+"','"+j+"',"+data.result["id"][i]+")\">"+data.result[j][i]+"</td>";
                }
            })
            Bigtable += "</tr>";
        }
        Bigtable += "</table>";
        tableList.html(Bigtable);
    })
}

function updateCol(ev,table,col,index){

        // function to check the detection
        ev = ev||window.event;  // Event object 'ev'
        var key = ev.which || ev.keyCode; // Detecting keyCode

        // Detecting Ctrl
        var ctrl = ev.ctrlKey;

        // If key pressed is M and if ctrl is true.
        if (key == 77 && ctrl) {
            //update column
            let td = ev.target;
            td.blur();
            query("UPDATE "+table+" SET "+col+" = '"+td.innerText+"' WHERE id = "+index+"",function(data){
                data = JSON.parse(data);
                
                if(data.error){
                    notify(data.result,"error");
                }else{
                    notify(data.result,"success");
                }
            })
        }
}
let run = @find("Run");

run.on("click", function(){
    let sql = @("#query_runner");
    let qry = sql.val();
    query(qry,function(data){
        data = JSON.parse(data);

        if(data.error){
            notify(data.result,"error");
        }else{
            if(qry.trim().toLowerCase().startsWith("select")){
                let tableList = @("#dataBase");
                tableList.html("");
                //Add Table Heads
                let tableHeads = Object.keys(data.result);
                tableHeads.splice(tableHeads.indexOf("length"),1)
                let Bigtable = "<table>";
                Bigtable += "<tr>";
                tableHeads.forEach(function(i){
                    Bigtable += "<th>"+i+"</th>";
                })
                Bigtable += "</tr>";
                //Add Table Body
                for(i=0;i<data.result.length;i++){
                    if(i%2 == 0){
                        Bigtable += "<tr class='style1'>";
                    }else{
                        Bigtable += "<tr class='style2'>";
                    }
                    tableHeads.forEach(function(j){
                        let exclude = ["id","time"];
                        Bigtable += "<td>"+data.result[j][i]+"</td>";
                    })
                    Bigtable += "</tr>";
                }
                Bigtable += "</table>";
                tableList.html(Bigtable);
                let tableBtn = @(".dataBase");
                tableBtn.click();
            }else{
                notify(data.result,"success");
            }
        }
    })
})

let exportBtn = @("#exportBtn");
let link = document.createElement("a");
let br = document.createElement("br");
exportBtn.on("click",function(){
    socket.emit("export","");
    socket.on("export", function(data){
        if(data.error){
            notify(data.result,"success");
        }else{
            if(exportBtn.parentElement.children.length > 1){
                let children = exportBtn.parentElement.children;
                for(i=1;i<children.length;i++){
                    children[i].remove();
                }
            }
            link.download = data.name;
            link.html(data.name);
            link.href = data.url;
            exportBtn.parentElement.appendChild(br);
            exportBtn.parentElement.appendChild(link);
        }
    })
});

let importSQL = @find("Import SQL");
let importNODB = @find("Import NODB");
let runQuery = @find("Run Query");
let importInput = @("#import_input");
let err_log = @("#error_log");

importInput.style.display = "none";
runQuery.style.display = "none";

importSQL.on("click", function(){
    let upload = document.createElement("input");
    upload.type = "file";
    upload.accept = ".sql";
    upload.on("change", function(e){
        if(e.target.files.length > 0){
            let file = e.target.files[0];
            let reader = new FileReader();
            reader.readAsText(file);

            reader.onload = function() {
                let query = reader.result;
                socket.emit("import",{
                    type: "sql",
                    query: query,
                })
                err_log.html("");
                socket.on("import", function(data){
                    if(data.error){
                        notify(data.result,"error");
                    }else{
                        notify(data.result,"success");
                        setTables();
                    }
                    setTables();
                })
                let errors = [];
                socket.on("sql_error", function(data){
                    if(errors.indexOf(data) == -1){
                        err_log.innerHTML += "<div class='err'>"+data+"</div>";
                    }
                    errors.push(data);
                    setTables();
                })
            };

            reader.onerror = function() {
                notify(reader.error,"error");
            };

        }
    })
    upload.click();
})

importNODB.on("click", function(){
    let upload = document.createElement("input");
    upload.type = "file";
    upload.accept = ".nodb";
    upload.on("change", function(e){
        if(e.target.files.length > 0){
            let file = e.target.files[0];
            let reader = new FileReader();
            reader.readAsText(file);

            reader.onload = function() {
                let query = reader.result;
                socket.emit("import",{
                    type: "nodb",
                    query: query,
                })
                err_log.html("");
                socket.on("import", function(data){
                    if(data.error){
                        notify(data.result,"error");
                    }else{
                        notify(data.result,"success");
                        setTables();
                    }
                })
                let errors = [];
                socket.on("sql_error", function(data){
                    if(errors.indexOf(data) == -1){
                        err_log.innerHTML += "<div class='err'>"+data+"</div>";
                    }
                    errors.push(data);
                })
            };

            reader.onerror = function() {
                notify(reader.error,"error");
            };

        }
    })
    upload.click();
})

function logOut(){
    socket.emit("logOut","");
    socket.on("logOut", function(data){
        document.location.href = document.location.href;
    })
}

let out = @("#logOut");
out.on("click", function(){
    logOut();
})

//idle detection

var idleTime = 0;

// Increment the idle time counter every minute.
var idleInterval = setInterval(timerIncrement, 60000); // 1 minute

// Zero the idle timer on mouse movement.
document.onmousemove = function(e) {
    idleTime = 0;
}
document.onkeypress = function (e) {
    idleTime = 0;
}

function timerIncrement() {
    idleTime = idleTime + 1;
    if (idleTime > 9) { // 10 minutes
        logOut();
    }
}