var socket = io.connect("/");

let login = @find("Log in");
let path = @("#username");
let pass = @("#password");
let encrypt = @("#encrypt");

func notify(text, type="info"){
    var notifier = new Notifier({
        position: 'top-right',
        direction: 'top',
    });
    var notification = notifier.notify(type, text);
    notification.push();
}

login.on("click", function(){
    socket.emit("login",{
        path: path.value,
        password: pass.value,
        encrypt:eval(encrypt.value),
    });
    login.disabled = true;
})

socket.on("login", function(data){
    login.disabled = false;
    if(data.includes("success")){
        notify(data,"success");
        document.location.href = document.location.href;
    }else{
        notify(data,"error");
    }
})