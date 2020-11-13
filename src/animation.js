"use strict";

// set up global variables for animations
var animateDtStep = 2; // number of minutes per step
var frameRate = 40; // number of milliseconds to update the frame
var animate_id; // variable for animation

function Animate(loc) {
    var id = "#animate"+loc;
    var state = $(id).text();
    if (state=="Play Animation") {
        $(id).text("Stop Animation");
        $('button.menu').attr("disabled", true);
        $('button.setupAnimate').attr("disabled", true);
        $('button.controlAnimate').attr("disabled", true);
        $(id).attr("disabled", false);
        //disable tooltips
        tipsEnabled = false;
        tips[0].length = 0; tips[1].length = 0;
        
        $(".animationStop").empty();
        clearInterval(animate_id);
        animate_id = setInterval(function() 
                                 {playAnimation(loc,1)}, frameRate);
    } else {
        clearInterval(animate_id);
        $(id).text("Play Animation");
        $('button.menu').attr("disabled", false);
        $('button.setupAnimate').attr("disabled", false);
        $('button.controlAnimate').attr("disabled", false);
        tipsEnabled = true;
        starChart();
    }
}

// Update the star chart by dframes frames
function playAnimation(loc,dframes) {
    var d,tzString,long;
    if (loc==1) {
        d = date1;
        tzString = "GMT"+tz1.tzString;
        long = long1;
    } else {
        d = date2;
        tzString = "GMT"+tz2.tzString;
        long = long2;
    }
    d.D += dframes*animateDtStep/1440;
    d.T = d.D/36525;
    d.dT = DeltaT(d.T);
    var date = CalDat(d.D - d.tz/1440);
    d.yyyy = date.yy; d.mm = date.mm; d.dd = date.dd;
    d.dateString = date.dateString;
    var deltaH = dframes*animateDtStep/60;
    deltaH -= 24*Math.floor(deltaH/24);
    var hour = d.h + d.m/60 + d.s/3600 + deltaH;
    hour -= 24*Math.floor(hour/24);
    d.h = Math.floor(hour);
    d.m = Math.floor((hour - d.h)*60);
    d.s = 3600*(hour - d.h - d.m/60);
    d.timeString = generateTimeString(d.h,d.m,d.s);
    var GMST = getGMST(d);
    var LST = getSidereal(GMST,long);
    d.LST = LST.hour;
    d.LST_rad = LST.rad;
    d.LSTstring = LST.string;
    var dString = d.dateString+"&nbsp;&nbsp;"+d.timeString+"  "+tzString;
    
    if (Math.abs(d.yyyy) > 200000) {
        // stop the animation
        clearInterval(animate_id);
        $("#animate"+loc).text("Play Animation");
        $('button.menu').attr("disabled", false);
        $('button.setupAnimate').attr("disabled", false);
        $('button.controlAnimate').attr("disabled", false);
        $('#warning'+loc).append('<p style="color:red;" class="animationStop">Animation stops since the formula used for precession is only valid between the years -200,000 and 200,000.</p>');
        tipsEnabled = true;
        starChart();
        return;
    }
    $("#time"+loc).html(dString);
    $("#siderealTime"+loc).text(LST.string);
    starChartLoc(loc);
}

function displayAnimationSetup(loc) {
    $('button.menu').attr("disabled", true);
    $('button.setupAnimate').attr("disabled", true);
    $('button.controlAnimate').attr("disabled", true);
    var animId = "#animationSetup"+loc;
    $(animId).empty();
    $(animId).slideDown();
    
    var txt = "<h2>Animation Setup</h2>";
    $(animId).append(txt);
    txt = '<form name="animSetup" action="" method="get">';
    txt += '<table>';
    txt += '<tr><td colspan="3"><b>Location '+loc+'</b></td></tr>';
    txt += '<tr><td>Name: <input type="text" id="placeAnim"></td>';
    txt += '<td>Longitude: <input type="number" id="longAnim" step="any" min=-180 max=180 /></td> <td>Latitude: <input type="number" id="latAnim" step="any" min=-90 max=90 /></td></tr>';
    txt += '<tr><td colspan="3"><b>Start Time</b></td></tr>';
    txt += '<tr><td>Year: <input type="number" id="yearAnim" step="1" min=-200000 max=200000 /></td>';
    txt += '<td>Month: <input type="number" id="monthAnim" step="1" min=1 max=12 /></td>';
    txt += '<td>Day: <input type="number" id="dayAnim" step="1" min=1 max=31 /></td></tr>';
    txt += '<tr><td>Hour: <input type="number" id="hourAnim" step="1" min=0 max=23 /></td>';
    txt += '<td>Minute: <input type="number" id="minuteAnim" step="1" min=0 max=59 /></td>';
    txt += '<td>Second: <input type="number" id="secondAnim" step="any" min=0 max=60 /></td></tr>';
    txt += '<tr><td>Time zone: GMT+<input type="number" id="tzAnim" step="any" min=-12 max=14 /></td>';
    txt += '<td></td><td></td> </tr>';
    txt += '<tr><td colspan="3">Choose time step/frame: <input type="radio" id="radioCustom" value="custom" onclick="animRadioClick(';
    txt +="'custom')";
    txt += '" />Custom &nbsp;&nbsp;&nbsp;<input type="radio" id="radioSiderealDay" value="sidereal" onclick="animRadioClick(';
    txt += "'sidereal')";
    txt += '" />1 sidereal day&nbsp;&nbsp;&nbsp;<input type="radio" id="radioDay" value="day" onclick="animRadioClick(';
    txt += "'day')";
    txt += '" />1 day&nbsp;&nbsp;&nbsp;<input type="radio" id="radioCentury" value="century" onclick="animRadioClick(';
    txt += "'century')";
    txt += '" />36525 days (100 years)<br />';
    txt +='<input type="number" id="timeStepAnim" step="any" min=-52596000 max=52596000 /> minutes</td></tr>';
    txt += '<tr><td colspan="3">Time between 2 frames: <input type="number" id="frameRateAnim" step="1" min=1 max=1000 /> ms</td></tr>';
    txt += '</table><br />';
    txt += '<p><input type="button" value="Submit" onclick="animationSetup(this.form,'+loc+')" /></p>';
    txt += '</form>';
    $(animId).append(txt); 
    txt = '<div id="animationErrorlocs"></div>'
    $(animId).append(txt);
    txt = '<p>Note:';
    txt += '<ul>';
    txt += '<li>Time step/frame is the time between two successive frames in the animation.</li>';
    txt += '<li>Time between two frames determines how frequently the star chart will be updated during the animation. It can be as fast as 1 ms, but the chart may not be fast enough to be drawn in 1 ms, depending on the processor speed.</li>';
    txt += '<li>If you choose time step/frame to be one sidereal day, the sidereal time will be fixed in all frames and stars will be fixed in the star chart during the animation. You will see the Sun, Moon and planets move with respect to the stars.</li>';
    txt += '<li>If you choose time step/frame to be one day, the local time will be fixed in the animation and you will see the daily shift of constellations with respect to the horizon. In the day time, you will see the Sun trace out a figure-eight pattern over the year, known as the analemma.</li>';
    txt += '<li>The positions of the Sun, Moon and planets are only accurate for years between -3000 and 3000.</li>';
    txt += "<li>If you choose time step/frame to be 36525 days (1 Julian century), the time soon goes beyond the range in which the positions of the Sun, Moon and planets are accurate. It is better to turn off displaying the Sun, Moon, planets and day/night background before playing the animation. Note also that the constellation lines will be distorted as stars move away from their current positions as a result of proper motions. In addition to stars' motions in space, the positions of the stars in the chart also change as a result of precession and Earth's spin. To visualize the effects of stars' motions and precession separately over millennia, it is better to view the animation in <a href='chartGCRS.html' target='_blank'>equatorial star charts</a>.</li>";
    txt += '<li>The animation will stop when year goes beyond 200,000 since the formula for the precession become inaccurate after that time.';
    txt += '</ul></p>';
    $(animId).append(txt);
    
    var d, place, long, lat, tz;
    if (loc==1) {
        d = date1;
        place = place1;
        long=long1; lat=lat1;
        tz = tz1;
    } else {
        d = date2;
        place = place2;
        long=long2; lat=lat2;
        tz = tz2;
    }
    $("#placeAnim").val(place);
    $("#longAnim").val(long);
    $("#latAnim").val(lat);
    $("#yearAnim").val(d.yyyy);
    $("#monthAnim").val(d.mm);
    $("#dayAnim").val(d.dd);
    $("#hourAnim").val(d.h);
    $("#minuteAnim").val(d.m);
    $("#secondAnim").val(d.s.toFixed(3));
    $("#tzAnim").val(-tz.tz/60);
    $("#timeStepAnim").val(animateDtStep);
    $("#frameRateAnim").val(frameRate);
    $("#radioCustom").prop("checked",false);
    $("#radioSiderealDay").prop("checked", false);
    $("#radioDay").prop("checked", false);
    if (animateDtStep==1440) {
        $("#radioDay").prop("checked", true);
        $("#timeStepAnim").prop("disabled",true);
    } else if (Math.abs(animateDtStep-1436.06817551502)<1.6e-3) {
        $("#radioSiderealDay").prop("checked", true);
        $("#timeStepAnim").val(1436.06817551502);
        $("#timeStepAnim").prop("disabled",true);
    } else if (animateDtStep==52596000) {
        $("#radioCentury").prop("checked", true);
        $("#timeStepAnim").prop("disabled",true);
    } else {
        $("#radioCustom").prop("checked",true);
        $("#timeStepAnim").prop("disabled",false);
    }
}

function animRadioClick(select) {
    $("#radioCustom").prop("checked",false);
    $("#radioSiderealDay").prop("checked", false);
    $("#radioDay").prop("checked", false);
    $("#radioCentury").prop("checked", false);
    switch(select) {
        case "custom":
            $("#radioCustom").prop("checked",true);
            $("#timeStepAnim").prop("disabled",false);
            break;
        case "sidereal":
            $("#radioSiderealDay").prop("checked", true);
            $("#timeStepAnim").val(1436.06817551502);
            $("#timeStepAnim").prop("disabled",true);
            break;
        case "day":
            $("#radioDay").prop("checked", true);
            $("#timeStepAnim").val(1440);
            $("#timeStepAnim").prop("disabled",true);
            break;
        case "century":
            $("#radioCentury").prop("checked", true);
            $("#timeStepAnim").val(52596000);
            $("#timeStepAnim").prop("disabled",true);
    }
}
        
function animationSetup(form, loc) {
    var place = form.placeAnim.value;
    var long = parseFloat(form.longAnim.value);
    var lat = parseFloat(form.latAnim.value);
    var tzoffset = parseFloat(form.tzAnim.value);
    var tz = {tz:-tzoffset*60};
    var tzof = Math.abs(tzoffset) + 0.5/60; // used for rounding
    if (tzoffset >= 0) {
        tz.tzString = "+";
    }  else {
        tz.tzString = "-";
    }
    var hs = Math.floor(tzof).toString();
    if (hs.length < 2) {hs = "0"+hs;}
    var ms = Math.floor(60*(tzof-Math.floor(tzof))).toString();
    if (ms.length < 2) {ms = "0"+ms;}
    tz.tzString += hs+ms;
    var yy = parseInt(form.yearAnim.value);
    var mm = parseInt(form.monthAnim.value);
    var dd = parseInt(form.dayAnim.value);
    var h = parseInt(form.hourAnim.value);
    var m = parseInt(form.minuteAnim.value);
    var s = parseFloat(form.secondAnim.value);
    var dt = parseFloat(form.timeStepAnim.value);
    var fr = parseInt(form.frameRateAnim.value);
    
    // sanity check
    var errid = "#animationErrorlocs";
    $(errid).empty();
    var min = -180, max = 180;
    var message = "Invalid longitude! Longitude must be a number between -180 and 180. West of Greenwich is negative; east of Greenwich is positive.";
    sanityCheck(long,"#longAnim",min,max,message,errid);
    
    min = -90; max = 90;
    message = "Invalid latitude! Latitude must be a number between -90 and 90, positive in the northern hemisphere and negative in the southern hemisphere.";
    sanityCheck(lat,"#latAnim",min,max,message,errid);
    
    min=-200000; max=200000;
    message = "Invalid year! Please enter an integer between "+min+" and "+max+". Note that 0 means 1 BCE, -1 means 2 BCE and so on. Note that the positions of the Sun, Moon and planets are only accurate for years between -3000 and 3000.";
    sanityCheck(yy,"#yearAnim",min,max,message,errid);
    
    min=1; max=12;
    message = "Invalid month! Month must be an integer between 1 and 12.";
    sanityCheck(mm,"#monthAnim",min,max,message,errid);
    
    min=1; max=31;
    message = "Invalid day! Day must be an integer between 1 and 31.";
    sanityCheck(dd,"#dayAnim",min,max,message,errid);
    
    min=0; max=23;
    message = "Invalid hour! Hour must be an integer between 0 and 23.";
    sanityCheck(h,"#hourAnim",min,max,message,errid);
    
    min=0; max=59;
    message = "Invalid minute! Minute must be an integer between 0 and 59.";
    sanityCheck(m,"#minuteAnim",min,max,message,errid);
    
    min=0; max=60;
    message = "Invalid second! Second must be a number between 0 and 60.";
    sanityCheck(s,"#secondAnim",min,max,message,errid);
    
    min=-12; max=14;
    message = "Invalid time zone! Time zone must be a number between -12 and 14.";
    sanityCheck(tzoffset,"#tzAnim",min,max,message,errid);
    
    min=-52596000; max=52596000;
    message = "Invalid time step/frame! Please enter a number between "+min+" and "+max+".";
    sanityCheck(dt, "#timeStepAnim",min,max,message,errid);
    
    min=1; max=1000;
    message = "Invalid time between 2 frames! Please enter an integer between "+min+" and "+max+".";
    sanityCheck(fr, "#frameRateAnim",min,max,message,errid);
    
    if ($(errid).text()=="") {
        var animId = "#animationSetup"+loc;
        $(animId).slideUp();
        $(animId).empty();
        $('button.menu').attr("disabled", false);
        $('button.setupAnimate').attr("disabled", false);
        $('button.controlAnimate').attr("disabled", false);
        var d;
        if (loc==1) {
            place1 = place;
            long1 = long;
            lat1 = lat;
            d = date1;
            tz1 = {tz:tz.tz, tzString:tz.tzString};
        } else {
            place2 = place;
            long2 = long;
            lat2 = lat;
            d = date2;
            tz2 = {tz:tz.tz, tzString:tz.tzString};
        }
        var D = getDm(yy,mm,dd,0);
        var date = CalDat(D);
        d.yyyy = date.yy; d.mm=date.mm; d.dd = date.dd;
        d.h = h; d.m = m; d.s = s;
        d.tz = tz.tz; d.tzString = tz.tzString;
        d.dateString = date.dateString;
        d.timeString = generateTimeString(h,m,s);
        d.D = getDm(d.yyyy,d.mm,d.dd,tz.tz) + (h+m/60+s/3600)/24;
        d.T = d.D/36525;
        d.dT = DeltaT(d.T);
        var GMST = getGMST(d);
        var LST = getSidereal(GMST,long);
        d.LST = LST.hour;
        d.LST_rad = LST.rad;
        d.LSTstring = LST.string;
        animateDtStep = dt;
        frameRate = fr;
        starChart();
    }
}