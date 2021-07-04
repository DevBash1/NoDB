func ajax(json,callback){
    json = JSON.stringify(json);
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
    if(type.toLowerCase() == "get"){
        xh.open(type, url, true);
        #xh.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xh.send();
    }else if(type.toLowerCase() == "post"){
        xh.open(type, url, true);
        #xh.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xh.send(params);
    }else{
        throw("Can only take GET and POST");
    }
    xh.onload = function() {
        if (xh.status == 200) {
            callback(xh.responseText);
        }
    }
}

func ajaxSync(json){
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
            res = "error: " + xh.status;
        }
    }
    if(type.toLowerCase() == "get"){
        xh.open(type, url, false);
        xh.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xh.send();
    }else if(type.toLowerCase() == "post"){
        xh.open(type, url, false);
        xh.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xh.send(params);
    }else{
        throw("Can only take GET and POST");
    }
    return res;
}
