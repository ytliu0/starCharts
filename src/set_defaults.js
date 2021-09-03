"use strict";

function init() {
    $('#wrapper').show();
    $('#Loc1Manual').prop("checked", true);
    $('#Loc2Manual').prop("checked", true);
    $('#synTimeYes').prop("checked", true);
    showHide('timeInputLoc1', 0);
    showHide('timeInputLoc2', 0);
    $('#setTimeComputer').prop("checked", true);
    $('#tz1Computer').prop("checked", true);
    let tz = -(new Date()).getTimezoneOffset()/60;
    if (tz.toString().length > 6) { tz = tz.toFixed(2);}
    let tzString = ' ('+(tz >= 0 ? 'GMT+':'GMT')+tz+')';
    $('#tz1ClockSpan').text(tzString);
    let para = {divId:'Loc1Form1', loc:1};
    setupLocCityMenu(para);
    para = {divId:'Loc2Form1', loc:2};
    setupLocCityMenu(para);
}

function new_eval(expr) {
    return Function('return '+expr)();
}

function switchLocForm(loc, form) {
    $('#Loc'+loc+'Form'+form).show();
    $('#Loc'+loc+'Form'+(1-form)).hide();
}

// Determine Location 1 by Geolocation/IP lookup
function geoloc() {
    $("#geolocmessage").append('Please wait...');
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition( 
            function success(position) {
                let long = position.coords.longitude;
                let lat = position.coords.latitude;
                $("#place1in").val('');
                $("#long1in").val(long);
                $("#lat1in").val(lat);
                $("#geolocmessage").empty();
                let txt = 'Success! Longitude and latitude have been entered.';
                $("#geolocmessage").append(txt);
            },
            function error(error_message) {
                // error occurs, use ip address lookup
                ipLookUp();
            }
        );
    } else {
        // geolocation is not supported
        // get location by ip address lookup
        ipLookUp();
    }
}

function ipLookUp() {
    $.ajax({url:'http://ip-api.com/json',
          success:function(res) {
              $("#long1in").text(res.lon);
              $("#lat1in").text(res.lat);
              $("#geolocmessage").empty();
              let txt = 'Success! Longitude and latitude have been entered.';
              $("#geolocmessage").append(txt);
          }, timeout:1000, 
           error:function(xhr,status,error) {
                   $("#geolocmessage").empty();
                   let txt = 'Unable to determine your location by GPS or IP address!';
                   $("#geolocerr").append(txt);
                 }
           });
}

function showHide(classId, show) {
    if (show==1) {
        $('.'+classId).show();
    } else {
        $('.'+classId).hide();
    }
}

function toggleActive(loc, item) {
    $('#show'+item+loc).toggleClass('active');
}

function setupLocCityMenu(para) {
    let divId = para.divId;
    let txt = '<p style="color:blue;">1. Select a region:</p>';
    let radioName = 'region'+divId;
    let region = [{code:'NAm',name:'North America'}, 
                  {code:'LA', name:'Latin America'}, 
                  {code:'EA', name:'East Asia'}, 
                  {code:'SEA', name:'South-East Asia'}, 
                  {code:'SA', name:'South Asia'}, 
                  {code:'WCA', name:'West and Central Asia'}, 
                  {code:'EE', name:'Eastern Europe'}, 
                  {code:'NE',name:'Northern Europe'}, 
                  {code:'WE', name:'Western Europe'}, 
                  {code:'SE', name:'Southern Europe'}, 
                  {code:'AF', name:'Africa'}, 
                  {code:'OC', name:'Oceania'}];
    txt += '<table class="selectRegion">';
    region.forEach(function(x, i) {
        if (i % 4 ==0) { txt +='<tr>';}
        txt += '<td><input type="radio" id="'+radioName+x.code+'" name="'+radioName+'" value="'+x.code+'" onclick="addCity('+"'"+divId+"','"+x.code+"'"+')" ';
        if (i==0) { txt += 'checked ';}
        txt += '/>';
        txt += '<label for="'+radioName+x.code+'">'+x.name+'</label></td>';
        if (i % 4 == 3) { txt += '</tr>';}
    });
    if (region.length % 4 != 0) { 
        txt += '<td colspan="'+(4-region.length)+'"></td></tr>';
    }
    txt += '</table><br />';
    txt += '<p style="color:blue;">2. Select a city from the dropdown menu: <span id="'+divId+'selectCitySpan"></span></p>';
    txt += '<p><span style="color:blue;">3. Choose a time zone:</span><br />';
    txt += '<input type="radio" id="'+divId+'tzComputer" name="'+divId+'timezone" />';
    let tz = -(new Date()).getTimezoneOffset()/60;
    if (tz.toString().length > 6) { tz = tz.toFixed(2);}
    let tzString = ' ('+(tz >= 0 ? 'GMT+':'GMT')+tz+')';
    txt += '<label for="'+divId+'tzComputer">Set by computer'+"'s clock"+tzString+'</label>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
    txt += '<input type="radio" id="'+divId+'tzCustom" name="'+divId+'timezone" checked />';
    txt += '<label for="'+divId+'tzCustom">Custom: GMT+</label>';
    txt += '<input id="'+divId+'tzCustomInput" type="number" step="0.01" min="-12" max="12" /></p><br />';
    $('#'+divId).html(txt);
    addCity(divId, region[0].code);
}

function addCity(divId, regionCode) {
    let city = new_eval(regionCode+'_cities()');
    // city is a 2D array of the form 
    // [[city0, country0, latitude0, longitude0, elevation0, UTCoffset0], 
    //  [city1, country1, latitude1, longitude1, elevation1, UTCoffset1],
    //  ... ]
    let n = city.length;
    let txt = '<select name="'+divId+'selectCity" id="'+divId+'selectCity" onchange="setDefaultCustomTimeZone('+"'"+divId+"','"+regionCode+"'"+')">';
    txt += '<option disabled selected value="-1"> -- select a city -- </option>'
    let country = '';
    for (let i=0; i<n; i++) {
        if (city[i][1] != country) {
            txt += '<option disabled value="-1" style="color:brown;">'+city[i][1].toUpperCase()+'</option>';
            country = city[i][1];
        }
        let city1 = city[i][0]+', '+city[i][1];
        txt += '<option value="'+i+'">'+city1+'</option>';
    }
    txt += '</select>';
    $('#'+divId+'selectCitySpan').html(txt);
}

function setDefaultCustomTimeZone(divId, regionCode) {
    let ind = parseInt($('#'+divId+'selectCity').val(), 10);
    if (ind != -1) {
        let tz = parseFloat(new_eval(regionCode+'_cities()['+ind+'][5]'));
        $('#'+divId+'tzCustomInput').val(tz);
    }
}

function generateQueryString() {
    let errid = '#result';
    $(errid).empty();
    function validate_manual_input(loc, s, tz) {
        let id = '#long'+loc+'in';
        let lng = parseFloat($(id).val());
        let min = -180, max = 180;
        let message = "Invalid longitude! Longitude must be a number between -180 and 180. West of Greenwich is negative; east of Greenwich is positive.";
        sanityCheck(lng,id,min,max,message,errid);
        id = '#lat'+loc+'in';
        let lat = parseFloat($(id).val());
        min = -90; max = 90;
        message = "Invalid latitude! Latitude must be a number between -90 and 90, positive in the northern hemisphere and negative in the southern hemisphere.";
        sanityCheck(lat,id,min,max,message,errid);
        if (loc==2 || $('#tz1Custom').prop('checked')) {
            id = '#tz'+loc+'in';
            tz = parseFloat($(id).val());
            min = -12; max = 12;
            message = "Invalid time zone! Time zone must be a number between -12 and 12.";
            sanityCheck(tz,id,min,max,message,errid);
        }
        
        if ($(errid).text()=='') {
            if (loc==2) { s.url += '&';}
            s.url += 'long'+loc+'='+lng+'&lat'+loc+'='+lat;
            if (loc==2 || $('#tz1Custom').prop('checked')) {
                if (tz.toString().length > 6) { tz = tz.toFixed(2);}
                s.url += '&tz'+loc+'='+tz;
            }
        }
        return tz;
    }
    
    function validate_menu_input(loc, s, tz) {
        let divId = 'Loc'+loc+'Form1';
        let ind = parseInt($('#'+divId+'selectCity').val(), 10);
        if (isNaN(ind) || ind == -1) {
            $(errid).append('<p style="color:red;">Please select a city from the dropdown menu for location '+loc+'.</p>');
        } else {
            if (loc==2) { s.url += '&';}
            let prefix = 'region'+divId;
            let regionCode = ['NAm', 'LA', 'EA', 'SEA', 'SA', 'WCA', 'EE', 'NE', 'WE', 'SE', 'AF', 'OC'];
            let reg, n = regionCode.length;
            for (let i=0; i<n; i++) {
                if ($('#'+prefix+regionCode[i]).prop('checked')) {
                    reg = regionCode[i];
                    break;
                }
            }
            s.url += 'region'+loc+'='+reg+'&ind'+loc+'='+ind;
            if ($('#'+divId+'tzCustom').prop('checked')) {
                let id = '#'+divId+'tzCustomInput';
                tz = parseFloat($(id).val());
                let min=-12, max=12;
                let message = "Invalid time zone! Time zone must be a number between -12 and 12.";
                sanityCheck(tz,id,min,max,message,errid);
                if ($(errid).text()=='') {
                    if (tz.toString().length > 6) { tz = tz.toFixed(2);}
                    s.url += '&setTz'+loc+'='+tz;
                }
            }
            
        }
        return tz;
    }
    
    function validate_time_input(loc, s, tz) {
        let id = '#year'+loc+'in';
        let year = parseInt($(id).val(), 10);
        let min = parseInt($(id).attr('min'), 10);
        let max = parseInt($(id).attr('max'), 10);
        let message = 'Invalid year! Please enter an integer between '+min+' and '+max+'.';
        sanityCheck(year,id,min,max,message,errid);
        id = '#month'+loc+'in';
        let month = parseInt($(id).val(), 10);
        min=1; max=12;
        message = 'Invalid month! Please enter an integer between '+min+' and '+max+'.';
        sanityCheck(month,id,min,max,message,errid);
        id = '#day'+loc+'in'
        let day = parseInt($(id).val(), 10);
        min=1; max=31;
        message = 'Invalid day! Please enter an integer between '+min+' and '+max+'.';
        sanityCheck(day,id,min,max,message,errid);
        id = '#hour'+loc+'in';
        let hh = parseInt($(id).val(), 10);
        min=0; max=23;
        message = 'Invalid hour! Please enter an integer between '+min+' and '+max+'.';
        sanityCheck(hh,id,min,max,message,errid);
        id = '#minute'+loc+'in';
        let mm = parseInt($(id).val(), 10);
        min=0; max=59;
        message = 'Invalid minute! Please enter an integer between '+min+' and '+max+'.';
        sanityCheck(mm,id,min,max,message,errid);
        id = '#second'+loc+'in';
        let ss = parseInt($(id).val(), 10);
        min=0; max=59;
        message = 'Invalid second! Please enter an integer between '+min+' and '+max+'.';
        sanityCheck(ss,id,min,max,message,errid);
        
        if ($(errid).text()=='') {
            let jd = getDm(year,month,day,0) + (hh + mm/60.0 + ss/3600 - tz)/24 + 2451545 + 1e-3/86400;
            s.url += '&jd'+loc+'='+jd;
        }
    }
    
    function azimuthAtTop(loc, s) {
        let id = '#azi'+loc;
        let rot = parseInt($(id).val(), 10);
        let min = -360, max = 360;
        let message = 'Invalid azimuth at top for location '+loc+'! Please enter an integer between -360 and 360';
        sanityCheck(rot,id,min,max,message,errid);
        if ($(errid).text()=='') {
            rot -= 360*Math.floor(rot/360);
            if (rot != 0) {
                s.url += '&rotate'+loc+'='+rot;
            }
        }
    }
    
    function showHideButtonStates(loc, s) {
        let butts = ['showPlanets', 'showEquator', 'showEcliptic', 
                'showGalactic','showMilkyWay', 'showConLines', 
                'showConLab', 'showDayNight'];
        let defaultStates = [true, false, false, false, true, true, false, true];
        butts.forEach(function (x, i) {
            let active_new = $('#'+x+loc).hasClass('active');
            if (active_new != defaultStates[i]) {
                s.url += '&'+x+loc+'='+(active_new ? 1:0);
            }
        });
    }
    
    let q = {url:'index.html?'};
    let tz1 = -(new Date()).getTimezoneOffset()/60, tz2 = tz1;
    
    // Location 1
    if ($('#Loc1Manual').prop('checked')) {
        tz1 = validate_manual_input(1, q, tz1);
    } else {
        tz1 = validate_menu_input(1, q, tz1);
    }
    if ($(errid).text() == '') {
        if ($('#setTimeCustom').prop('checked')) {
            validate_time_input(1, q, tz1);
        }
    }
    // azimuth at top
    if ($(errid).text() == '') {
        azimuthAtTop(1, q);
    }
    // show/hide buttons
    if ($(errid).text() == '') {
        showHideButtonStates(1, q);
    }
    
    // Location 2
    if ($('#Loc2Manual').prop('checked')) {
        tz2 = validate_manual_input(2, q, tz2);
    } else {
        tz2 = validate_menu_input(2, q, tz2);
    }
    if ($(errid).text()=='') {
        if ($('#synTimeNo').prop('checked')) {
            validate_time_input(2, q, tz2);
        }
    }
    // azimuth at top
    if ($(errid).text()=='') { 
        azimuthAtTop(2, q);
    }
    // show/hide buttons
    if ($(errid).text() == '') {
        showHideButtonStates(2, q);
    }
    
    if ($(errid).text() == '') {
        let url = q.url.replace(/&/g, '&amp;');
        let txt = '<p class="result">The new (relative) URL with the query string is<br />'+url+'</p>'
        txt += '<p class="result">Here is the <a href="'+q.url+'" target="_blank">link</a>. If you are satisfied with this setting, bookmark this new URL and use it for the new default settings.</p>';
        $(errid).html(txt);
    }
}

// sanity check
// If there are errors, print message in red at the place 
// indicated by the id errid
function sanityCheck(x,inputId,min,max,message,errid) {
    $(inputId).css("background-color", "white");
    if (isNaN(x) || x < min || x > max) {
        $(inputId).css("background-color", "#e2a8a8");
        let text = '<p style="color:red;">'+message+'</p>';
        $(errid).append(text);
    }
}

// Compute D (number of days from J2000) at midnight 
// local time from yyyy, mm, dd, tz (year, month, date, timezone offset)
function getDm(yyyy,mm,dd,tz) {
    let dfrac = tz/1440;
    let m1 = mm, yy = yyyy;
    if (m1 <= 2) {m1 +=12; yy--;}
    let b;
    if (10000*yy+100*m1+dd <= 15821004) {
        // Julian calendar
        b = -2 + Math.floor((yy+4716)/4) - 1179;
    } else {
        // Gregorian calendar
        b = Math.floor(yy/400) - Math.floor(yy/100) + Math.floor(yy/4);
    }
    let D0 = 365*yy - 679004 + b + Math.floor(30.6001*(m1+1)) + dd - 51544.5;
    return(D0 + dfrac);
}