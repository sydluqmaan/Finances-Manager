let template = document.getElementsByTagName("template")[0].content.querySelector("div");
let container = document.getElementById('transactioncontainer');
let catbutton = document.getElementById('catoption');
let recordstab = document.getElementById('recordspanel');
let summarytab = document.getElementById('summarypanel');
let recordstabbutton = document.getElementById('recordstabbutton');
let summarytabbutton = document.getElementById('summarytabbutton');
let spendingsortbycatcontainer = document.getElementById('spendingsortbycatcontainer');
let incomesortbycatcontainer = document.getElementById('incomesortbycatcontainer');
let currencyselectelem = document.getElementById('currencyselect');
let sheetnameinputelem = document.getElementById('listnameinputbox');
let expenditurepiegraph = document.getElementById('piechart');
let incomepiegraph = document.getElementById('piechartincome');
let expendituregraph = document.getElementById('graph')
let activetab = 0;
let lastid = 0;
let unsavedchanges = true;

const today = new Date();
let panelarray = [];
let records = new Map();

let currentDate = today.toJSON()
document.getElementById("periodselector").value = currentDate.slice(0,7);

recordstab.style.display = "flex";
recordstabbutton.classList.add("activetab");
summarytab.style.display = "none";
summarytabbutton.classList.remove("activetab");

window.addEventListener('beforeunload', function (e) {
    eel.programexit()
});

// On sheet name change
sheetnameinputelem.addEventListener("change", function(){
    eel.updatesheetname(sheetnameinputelem.value);
})

// Add new transaction record
function addrecordelement(notblank,record){

    let panelinst = document.importNode(template, true);
    panelarray.push(panelinst);
    
    let nameelem = panelinst.getElementsByClassName('eventname')[0];
    let amountelem = panelinst.getElementsByClassName('amount')[0];
    let dateelem = panelinst.getElementsByClassName('date')[0];
    let categoryelem = panelinst.getElementsByClassName('cat')[0];
    let removebutton = panelinst.getElementsByClassName('removeiconbox');
    lastid = lastid + 1
    let eventid = (lastid);
    let eventname;
    let eventamount;
    let eventdate;
    let eventcategory;

    if (notblank == 1){
        eventname = record[1]
        eventdate = record[2]
        eventamount = (Math.round(record[3] * 100) / 100).toFixed(2);
        eventcategory = record[4]
        
        nameelem.value = eventname
        amountelem.value = eventamount
        dateelem.value = eventdate
        categoryelem.value = eventcategory

        if (eventamount < 0){
            amountelem.style.color = '#F8333C';
        }
        else if (eventamount == ''){
            amountelem.style.color = '#DBD5B5';
        }
        else{
            amountelem.style.color = '#44AF69';
        }

        records.set(this.parentElement,[eventname,eventdate,eventamount,eventcategory]);
    }

    else{
        updatedetails(this.parentElement);
    }
    
    function updatedetails(panelref){
        records.set(panelref,[eventname,eventdate,eventamount,eventcategory]);
        eel.updaterecord(eventid,records.get(panelref));
    }
    
    // add to panel to screen
    container.appendChild(panelinst);

    // on "Remove" click
    removebutton[0].addEventListener('click',function(){
        panelarray.pop(this.parentElement);
        records.delete(this.parentElement);
        this.parentElement.remove();
        eel.poprecord(eventid);

    })

    // On value change events

    // On name change
    nameelem.addEventListener('change',function(){
        eventname = nameelem.value;
        updatedetails(this.parentElement);
    })

    // On amount change
    amountelem.addEventListener('change',function(){
        amountelem.value = (Math.round(amountelem.value * 100) / 100).toFixed(2);
        eventamount = parseFloat(amountelem.value);
        if (amountelem.value < 0){
            amountelem.style.color = '#F8333C';
        }
        else if (amountelem.value == ''){
            amountelem.style.color = '#DBD5B5';
        }
        else{
            amountelem.style.color = '#44AF69';
        }
        updatedetails(this.parentElement);
    })

    // on date change
    dateelem.addEventListener('change',function(){
        eventdate = dateelem.value;
        updatedetails(this.parentElement);
    })

    // on category change
    categoryelem.addEventListener('change',function(){
        eventcategory = categoryelem.value;
        updatedetails(this.parentElement);
    })
    
}

// Add blank transaction
function addnewtransaction(){ 
    addrecordelement(0,[]);
}

// Category option box
catbutton.addEventListener('click',function(){
    document.getElementById("catoptionpanel").style.display = "flex";
    document.getElementById("catoptionpanel").
    document.getElementById("closecatoptionpanel").addEventListener('click',function(){
        document.getElementById("catoptionpanel").style.display = "none";
    })
})

// Switch to records
recordstabbutton.addEventListener('click',function(){
    if (activetab == 1){
        summarytab.style.display = "none";
        summarytabbutton.classList.remove("activetab");
        recordstab.style.display = "flex";
        recordstabbutton.classList.add("activetab");
        activetab = 0;
    }
})

// Switch to summary
summarytabbutton.addEventListener('click',function(){

    //update screen content
    period = document.getElementById("periodselector").value;
    eel.updateanalytics(period)

    if (activetab == 0){
        summarytab.style.display = "flex";
        summarytabbutton.classList.add("activetab");
        recordstab.style.display = "none";
        recordstabbutton.classList.remove("activetab");
        activetab = 1;
    }
})

// Period value change
document.getElementById("periodselector").addEventListener('change',function(){
    //update screen content
    period = document.getElementById("periodselector").value;
    eel.updateanalytics(period)

    let periodtext = null

    switch(period){
        case "day":
            periodtext = "than yesterday"
            break;
            
        case "week":
            periodtext = "than last week"
            break;

        case "month":
            periodtext = "than last month"
            break;

        case "year":
            periodtext = "than last year"
            break;
    }

    var statements = document.getElementsByClassName("summarystatement1period");
    for(var i = 0; i < statements.length; i++){
        statements[i].innerText = periodtext;
    }
})

// Show Visuals
eel.expose(showvisuals)
function showvisuals(){
    var insuffdivs = document.getElementsByClassName("piechart"); //divsToHide is an array
    for(var i = 0; i < insuffdivs.length; i++){
        insuffdivs[i].style.visibility = "visible";
    }

    document.getElementsByClassName("graph")[0].style.visibility = "visible";

    var insuffdivs = document.getElementsByClassName("datainsuff"); //divsToHide is an array
    for(var i = 0; i < insuffdivs.length; i++){
        insuffdivs[i].style.visibility = "hidden";
    }
}

// Insufficient data
eel.expose(insufficientdata)
function insufficientdata(){

    document.getElementById('expenditure').innerText = "00.00";
    document.getElementById('income').innerText = "00.00";
    document.getElementById('spentamount1').innerText = "--";
    document.getElementById('spentamount2').innerText = "--";
    document.getElementById('spentamount3').innerText = "--";
    document.getElementById('savedamount1').innerText = "--";
    document.getElementById('savedamount2').innerText = "--";
    document.getElementById('savedamount3').innerText = "--";
    document.getElementById('mostspentcat').innerText = "--";

    while (document.getElementById('spendingsortbycatcontainer').lastElementChild){
        document.getElementById('spendingsortbycatcontainer').removeChild(document.getElementById('spendingsortbycatcontainer').lastElementChild);
    }

    while (document.getElementById('incomesortbycatcontainer').lastElementChild){
        document.getElementById('incomesortbycatcontainer').removeChild(document.getElementById('incomesortbycatcontainer').lastElementChild);
    }

    var insuffdivs = document.getElementsByClassName("piechart"); //divsToHide is an array
    for(var i = 0; i < insuffdivs.length; i++){
        insuffdivs[i].style.visibility = "hidden";
    }

    document.getElementsByClassName("graph")[0].style.visibility = "hidden";

    var insuffdivs = document.getElementsByClassName("datainsuff"); //divsToHide is an array
    for(var i = 0; i < insuffdivs.length; i++){
        insuffdivs[i].style.visibility = "visible";
    }
}

eel.expose(clear_year_data)
function clear_year_data(){
    document.getElementById('monthlyaverageincome').innerText = '--'
    document.getElementById('monthlyaveragespending').innerText = '--'
}

// Update balance on screen
eel.expose(updatebalance)
function updatebalance(balance){
    document.getElementById('currentbalance').innerText = balance;
    if (balance < 0){
        document.getElementById('currentbalance').style.color = '#F8333C'
    }
    else{
        document.getElementById('currentbalance').style.color = "#44AF69"
    }
}

// Update Last ID
eel.expose(updatelastid)
function updatelastid(id){
    lastid = id;
}

// Update expenditure on screen
eel.expose(updateincome)
function updateincome(amount){
    document.getElementById('income').innerText = amount;
}

// Update expenditure on screen
eel.expose(updateexpenditure)
function updateexpenditure(amount){
    document.getElementById('expenditure').innerText =  Math.abs(amount);
}

// Update expenditure by category on screen
eel.expose(updateexpenditurebycategory)
function updateexpenditurebycategory(data){
    while (spendingsortbycatcontainer.lastElementChild) {
        spendingsortbycatcontainer.removeChild(spendingsortbycatcontainer.lastElementChild);
    }

    let spendbycattemp = document.getElementsByClassName("summarycatlisttemplate")[0].content.querySelector("div");
    for (cat in data[0]){
        let spendbycatnode = document.importNode(spendbycattemp, true);
        spendingsortbycatcontainer.appendChild(spendbycatnode)
        spendbycatnode.getElementsByClassName('categoryname')[0].innerText = data[0][cat]
        spendbycatnode.getElementsByClassName('catamount')[0].innerText = data[1][cat]
    }
}

// Update expenditure by category on screen
eel.expose(updateincomebycategory)
function updateincomebycategory(data){
    while (incomesortbycatcontainer.lastElementChild) {
        incomesortbycatcontainer.removeChild(incomesortbycatcontainer.lastElementChild);
    }

    let spendbycattemp = document.getElementsByClassName("summarycatlisttemplate2")[0].content.querySelector("div");
    for (cat in data[0]){
        let spendbycatnode = document.importNode(spendbycattemp, true);
        incomesortbycatcontainer.appendChild(spendbycatnode)
        spendbycatnode.getElementsByClassName('categoryname')[0].innerText = data[0][cat]
        spendbycatnode.getElementsByClassName('catamount')[0].innerText = data[1][cat]
    }
}

// Update Pie Chart on screen
eel.expose(piechartupdate)
function piechartupdate(){
    expenditurepiegraph.setAttribute('data', 'mypiegraph.svg');
    incomepiegraph.setAttribute('data', 'mypiegraphincome.svg');

}

// Update Graph on screen
eel.expose(graphupdate)
function graphupdate(){
    expendituregraph.setAttribute('data', 'mygraph.svg');
}

eel.expose(statementupdate)
function statementupdate(expdiff,incdiff,spendingavg,incomeavg,mostspentcat,incdiffperc,expdifperc){
    document.getElementById('spentamount1').innerHTML = Math.abs(parseFloat(expdiff))
    document.getElementById('spentamount2').innerHTML = expdifperc

    if (parseFloat(expdiff)>0){
        document.getElementById('spentamount3').innerHTML = 'less'
    }
    else if((parseFloat(expdiff)<0)){
        document.getElementById('spentamount3').innerHTML = 'more'
    }
    
    document.getElementById('savedamount1').innerHTML = Math.abs(parseFloat(incdiff))
    document.getElementById('savedamount2').innerHTML = incdiffperc

    if (parseFloat(incdiff)<0){
        document.getElementById('savedamount3').innerHTML = 'less'
    }
    else if (parseFloat(incdiff)>0){
        document.getElementById('savedamount3').innerHTML = 'more'
    }
    
    document.getElementById('monthlyaveragespending').innerHTML =  Math.abs(parseFloat(spendingavg))
    document.getElementById('monthlyaverageincome').innerHTML = incomeavg
    document.getElementById('mostspentcat').innerHTML = mostspentcat
}

// On currency change
currencyselectelem.addEventListener('change',function(){
    let x = document.getElementsByClassName('currency')
    for(var i = 0; i < x.length; i++){
        x[i].innerText = currencyselectelem.value;
    }
})

// Unsaved changes alert trigger
function changesalert(){
    if (unsavedchanges == true){
        if (confirm("This sheet has unsaved changes. All unsaved changes will be lost.\nDo you want to continue?")) {
            return 0;
        } 
        else {
            return 1;
        }
    }
    else{
        return 2;
    }
}

// Load records from sheet
eel.expose(loadsheetrecords)
function loadsheetrecords(sheetdata,sheetname){

    while (container.lastElementChild) {
        container.removeChild(container.lastElementChild);
    }
    document.getElementById('listnameinputbox').value = sheetname;
    for (x in sheetdata){
        y = sheetdata[x]
        z = [y[1],y[2],y[3],y[4],y[5]]
        addrecordelement(1,y)
    }
    document.getElementById('transactioncontainer').scrollTop = document.getElementById('transactioncontainer').scrollHeight;
}

// Create new sheet request
function newsheet(){
    if (changesalert() == 0 || changesalert() == 2){
        panelarray = [];
        records = new Map();
        while (container.lastElementChild) {
            container.removeChild(container.lastElementChild);
        }
        eel.newsheet();
    }
}

// Open sheet request
function opensheet(){
    let input = document.createElement('input');
    input.type = 'file';
    input.onchange = _this => {
              let files =   Array.from(input.files);
              eel.opensheet(files[0]["name"])
          };
    input.click();
}

eel.expose(setsheetnameininputbox)
function setsheetnameininputbox(name){
    sheetnameinputelem.value = name;
}

// Save sheet request
function savesheet(){
    eel.savefile();
}

// Open menu
function openNav() {
    document.getElementById("mySidenav").style.width = "250px";
    document.getElementById("mySidenav").style.borderRightStyle = "solid";
    document.getElementById("mySidenav").style.borderWidth = "1px";
}
  
// Close file menu
function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
    document.getElementById("mySidenav").style.borderRightStyle = "none";
    document.getElementById("mySidenav").style.borderWidth = "1px";
} 

var statements = document.getElementsByClassName("statement");
var dots = document.getElementsByClassName("statementicons");
var statementindex = 0;

document.getElementById('statementboxarrowleft').addEventListener('click', function(){
    cycle_statement(true);
})

document.getElementById('statementboxarrowright').addEventListener('click', function(){
    cycle_statement(false);
})

function cycle_statement(value){
    if (value==true){
        statementindex -= 1
    }
    
    else if (value == false){
        statementindex += 1
    }

    if (statementindex == -1){
        statementindex = 4
    }

    else if (statementindex == 5){
        statementindex = 0
    }


    for (x in [0,1,2,3,4]){

        if (x == statementindex){
            statements.item(x).style.display = 'flex'
            dots.item(x).style.color = '#DBD5B5'
        }

        else{
            statements.item(x).style.display = 'none'
            dots.item(x).style.color = '#dbd5b565'
        }
    }
}
