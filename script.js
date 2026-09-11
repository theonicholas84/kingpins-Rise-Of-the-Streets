let money = 5000;
let members = 5;
let territories = 1;
let day = 1;

function updateUI(){

    document.getElementById("money").textContent = money;
    document.getElementById("members").textContent = members;
    document.getElementById("territories").textContent = territories;

}

function addLog(text){

    let log = document.getElementById("log");

    log.innerHTML =
        "[Day " + day + "] " + text +
        "<br>" +
        log.innerHTML;

}

function recruit(){

    if(money >= 500){

        money -= 500;
        members++;

        addLog("New member recruited.");

        updateUI();

    }else{

        addLog("Not enough money.");

    }

}

function expand(){

    let power = members * Math.random();

    if(power > 5){

        territories++;

        money += 1000;

        addLog("Territory captured.");

    }else{

        members--;

        addLog("Gang war failed. Lost one member.");

    }

    updateUI();

}

function nextDay(){

    day++;

    let income = territories * 300;

    money += income;

    randomEvent();

    addLog("Earned $" + income);

    updateUI();

}

function randomEvent(){

    let roll = Math.floor(Math.random() * 4);

    if(roll === 0){

        money -= 300;

        addLog("Police raid cost $300.");

    }

    if(roll === 1){

        money += 700;

        addLog("Illegal deal successful.");

    }

    if(roll === 2){

        members++;

        addLog("A local thug joined.");

    }

    if(roll === 3){

        addLog("Quiet day.");

    }

}

updateUI();!
