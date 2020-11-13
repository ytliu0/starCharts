"use strict";

var csvdata = "";

// *** Rise and Set Page ***
function riseSetPage() {
    $("#starCharts").hide();
    $("#riseSetArea").show();
    
    var deg_to_rad = Math.PI/180;
    
    $("#riseSetPlace1").text(place1);
    $("#riseSetlong1").html(long1+"&deg;");
    $("#riseSetlat1").html(lat1+"&deg;");
    $("#riseSetDate1").html(date1.dateString);
    $("#riseSetTtimeZone1").html("GMT"+tz1.tzString);
    var loc1 = {locNum:1, long:long1*deg_to_rad, 
                lat:lat1*deg_to_rad, tz:tz1.tz, 
                yyyy:date1.yyyy, mm:date1.mm, dd:date1.dd};
    riseSetLoc(loc1);
    
    $("#riseSetPlace2").text(place2);
    $("#riseSetlong2").html(long2+"&deg;");
    $("#riseSetlat2").html(lat2+"&deg;");
    $("#riseSetDate2").html(date2.dateString);
    $("#riseSetTtimeZone2").html("GMT"+tz2.tzString);
    var loc2 = {locNum:2, long:long2*deg_to_rad, 
                lat:lat2*deg_to_rad, tz:tz2.tz, 
                yyyy:date2.yyyy, mm:date2.mm, dd:date2.dd};
    riseSetLoc(loc2);
}

function backToStarCharts() {
    $("#RSMultiResult").empty();
    $("#riseSetMultipleDays").slideUp();
    $("#riseSetMainPage").slideDown();
    $("#starCharts").show();
    $("#riseSetArea").hide();
}

// *** Change Locations and Dates ***
function riseSetChangeLocs() {
    $('button.menu').attr("disabled", true);
    $("#RSMultiResult").empty();
    $("#riseSetMultipleDays").slideUp();
    $("#riseSetMainPage").slideDown();
    
    // Get the current locations and dates
    var place1current = $("#riseSetPlace1").text();
    var place2current = $("#riseSetPlace2").text();
    var long1String = $("#riseSetlong1").html();
    var pos = long1String.indexOf("&deg;")
    var long1current = parseFloat(long1String.slice(0,pos));
    var long2String = $("#riseSetlong2").html();
    pos = long2String.indexOf("&deg;")
    var long2current = parseFloat(long2String.slice(0,pos));
    var lat1String = $("#riseSetlat1").html();
    pos = lat1String.indexOf("&deg;")
    var lat1current = parseFloat(lat1String.slice(0,pos));
    var lat2String = $("#riseSetlat2").html();
    pos = lat2String.indexOf("&deg;")
    var lat2current = parseFloat(lat2String.slice(0,pos));
    var d1String = $("#riseSetDate1").text();
    var d2String = $("#riseSetDate2").text();
    pos = d1String.indexOf("-");
    var yy1 = parseInt(d1String.slice(0,pos));
    var mm1 = parseInt(d1String.substr(pos+1,2));
    var dd1 = parseInt(d1String.substr(pos+4,2));
    pos = d2String.indexOf("-");
    var yy2 = parseInt(d2String.slice(0,pos));
    var mm2 = parseInt(d2String.substr(pos+1,2));
    var dd2 = parseInt(d2String.substr(pos+4,2));
    var tz1String = $("#riseSetTtimeZone1").text();
    var tz2String = $("#riseSetTtimeZone2").text();
    var tz1sign = tz1String.substr(3,1);
    var tz2sign = tz2String.substr(3,1);
    var tzone1 = parseFloat(tz1String.substr(4,2)) + 
        parseFloat(tz1String.substr(6,2))/60;
    if (tz1sign=="-") {tzone1 = -tzone1;}
    var tzone2 = parseFloat(tz2String.substr(4,2)) + 
        parseFloat(tz2String.substr(6,2))/60;
    if (tz2sign=="-") {tzone2 = -tzone2;}
    
    $("#riseSetInputlocs").slideDown();
    $("#riseSetPlace1in").val(place1current);
    $("#riseSetLong1in").val(long1current);
    $("#riseSetLat1in").val(lat1current);
    $("#riseSetYear1in").val(yy1);
    $("#riseSetMonth1in").val(mm1);
    $("#riseSetDay1in").val(dd1);
    $("#riseSetTz1in").val(tzone1);
    $("#riseSetPlace2in").val(place2current);
    $("#riseSetLong2in").val(long2current);
    $("#riseSetLat2in").val(lat2current);
    $("#riseSetYear2in").val(yy2);
    $("#riseSetMonth2in").val(mm2);
    $("#riseSetDay2in").val(dd2);
    $("#riseSetTz2in").val(tzone2);
    $("#riseSetSynTimeYes").prop("checked", true);
    $("#riseSetSynTimeNo").prop("checked", false);
    $(".timeInputLoc2").hide();
}

function riseSetChangeLocationsAndDates(form) {
    var place1new = form.riseSetPlace1in.value;
    var long1new = parseFloat(form.riseSetLong1in.value);
    var lat1new = parseFloat(form.riseSetLat1in.value);
    var tzoffset1 = parseFloat(form.riseSetTz1in.value);
    var tz1new = {tz:-tzoffset1*60};
    var tzof = Math.abs(tzoffset1) + 0.5/60; // used for rounding
    if (tzoffset1 >= 0) {
        tz1new.tzString = "+";
    }  else {
        tz1new.tzString = "-";
    }
    var hs = Math.floor(tzof).toString();
    if (hs.length < 2) {hs = "0"+hs;}
    var ms = Math.floor(60*(tzof-Math.floor(tzof))).toString();
    if (ms.length < 2) {ms = "0"+ms;}
    tz1new.tzString += hs+ms;
    var yy1 = parseInt(form.riseSetYear1in.value);
    var mm1 = parseInt(form.riseSetMonth1in.value);
    var dd1 = parseInt(form.riseSetDay1in.value);
    
    var place2new = form.riseSetPlace2in.value;
    var long2new = parseFloat(form.riseSetLong2in.value);
    var lat2new = parseFloat(form.riseSetLat2in.value);
    var tzoffset2 = parseFloat(form.riseSetTz2in.value);
    var tz2new = {tz:-tzoffset2*60};
    tzof = Math.abs(tzoffset2) + 0.5/60; // used for rounding
    if (tzoffset2 >= 0) {
        tz2new.tzString = "+";
    }  else {
        tz2new.tzString = "-";
    }
    hs = Math.floor(tzof).toString();
    if (hs.length < 2) {hs = "0"+hs;}
    ms = Math.floor(60*(tzof-Math.floor(tzof))).toString();
    if (ms.length < 2) {ms = "0"+ms;}
    tz2new.tzString += hs+ms;
    var sync = document.getElementById("riseSetSynTimeYes").checked;
    var yy2,mm2,dd2;
    if (sync) {
        yy2=yy1; mm2=mm1; dd2=dd1;
    } else {
        yy2 = parseInt(form.riseSetYear2in.value);
        mm2 = parseInt(form.riseSetMonth2in.value);
        dd2 = parseInt(form.riseSetDay2in.value);
    }
    
    // sanity check
    var errid = "#riseSetErrorlocs";
    $(errid).empty();
    var min = -180, max = 180;
    var message = "Invalid longitude! Longitude must be a number between -180 and 180. West of Greenwich is negative; east of Greenwich is positive.";
    sanityCheck(long1new,"#riseSetLong1in",min,max,message,errid);
    sanityCheck(long2new,"#riseSetLong2in",min,max,message,errid);
    
    min = -90; max = 90;
    message = "Invalid latitude! Latitude must be a number between -90 and 90, positive in the northern hemisphere and negative in the southern hemisphere.";
    sanityCheck(lat1new,"#riseSetLat1in",min,max,message,errid);
    sanityCheck(lat2new,"#riseSetLat2in",min,max,message,errid);
    
    min=-3000; max=3000;
    message = "Invalid year! Please enter an integer between -3000 and 3000. Note that 0 means 1 BCE, -1 means 2 BCE and so on. This webpage can only handle years between -3000 and 3000.";
    sanityCheck(yy1,"#riseSetYear1in",min,max,message,errid);
    if (!sync) {sanityCheck(yy2,"#riseSetYear2in",min,max,message,errid); }
    
    min=1; max=12;
    message = "Invalid month! Month must be an integer between 1 and 12.";
    sanityCheck(mm1,"#riseSetMonth1in",min,max,message,errid);
    if (!sync) {sanityCheck(mm2,"#riseSetMonth2in",min,max,message,errid); }
    
    min=1; max=31;
    message = "Invalid day! Day must be an integer between 1 and 31.";
    sanityCheck(dd1,"#riseSetDay1in",min,max,message,errid);
    if (!sync) {sanityCheck(dd2,"#riseSetDay2in",min,max,message,errid); }
    
    min=-12; max=14;
    message = "Invalid time zone! Time zone must be a number between -12 and 14.";
    sanityCheck(tzoffset1,"#riseSetTz1in",min,max,message,errid);
    sanityCheck(tzoffset2,"#riseSetTz2in",min,max,message,errid);
    
    if ($(errid).text()=="") {
        $("#riseSetInputlocs").slideUp();
        $('button.menu').attr("disabled", false);
        
        // Make sure the date is in the proper form
        // i.e. no stuff like 02-31 or 04-31
        // so convert date to Julian day and then back to date
        var D = getDm(yy1,mm1,dd1,0);
        var date = CalDat(D);
        yy1 = date.yy; mm1=date.mm; dd1 = date.dd;
        var d1String = date.dateString;
        D = getDm(yy2,mm2,dd2,0);
        date = CalDat(D);
        yy2 = date.yy; mm2=date.mm; dd2 = date.dd;
        var d2String = date.dateString;
            
        $("#riseSetPlace1").text(place1new);
        $("#riseSetlong1").html(long1new+"&deg;");
        $("#riseSetlat1").html(lat1new+"&deg;");
        $("#riseSetDate1").html(d1String);
        $("#riseSetTtimeZone1").html("GMT"+tz1new.tzString);
        var deg_to_rad = Math.PI/180;
        var loc1 = {locNum:1, long:long1new*deg_to_rad, 
                   lat:lat1new*deg_to_rad,
                   tz:tz1new.tz, yyyy:yy1, mm:mm1, dd:dd1};
        riseSetLoc(loc1);

        $("#riseSetPlace2").text(place2new);
        $("#riseSetlong2").html(long2new+"&deg;");
        $("#riseSetlat2").html(lat2new+"&deg;");
        $("#riseSetDate2").html(d2String);
        $("#riseSetTtimeZone2").html("GMT"+tz2new.tzString);
        var loc2 = {locNum:2, long:long2new*deg_to_rad, 
                    lat:lat2new*deg_to_rad,
                    tz:tz2new.tz, yyyy:yy2, mm:mm2, dd:dd2};
        riseSetLoc(loc2);
    }
}

// *** Multiple Dates ***
function riseSetMultipleDates() {
    $('button.menu').attr("disabled", true);
    
    $("#riseSetMainPage").slideUp(10);
    $("#RSMultiResult").empty();
    $("#riseSetMultipleDays").slideDown(10);
    $("#riseSetMultipleDaysInput").slideDown(10);
    var long1prev = $("#RSMultiLongin").val();
    if (long1prev =="") {
        // Get location 1 data
        var place1current = $("#riseSetPlace1").text();
        var long1String = $("#riseSetlong1").html();
        var pos = long1String.indexOf("&deg;")
        var long1current = parseFloat(long1String.slice(0,pos));
        var lat1String = $("#riseSetlat1").html();
        pos = lat1String.indexOf("&deg;")
        var lat1current = parseFloat(lat1String.slice(0,pos));
        var tz1String = $("#riseSetTtimeZone1").text();
        var tz1sign = tz1String.substr(3,1);
        var tzone1 = parseFloat(tz1String.substr(4,2)) + 
            parseFloat(tz1String.substr(6,2))/60;
        if (tz1sign=="-") {tzone1 = -tzone1;}
        
        $("#RSMultiPlacein").val(place1current);
        $("#RSMultiLongin").val(long1current);
        $("#RSMultiLatin").val(lat1current);
        $("#RSMultiTzin").val(tzone1);
        $("#RSMultiEpoch").val(2000);
        $("#RSMultiDt").val(1);
    }
    if ($("#objects").val()=="Star") {
        $(".RSMultiRaDec").show();
    }
}

function RSMultipleDays(form) {
    var place = form.RSMultiPlacein.value;
    var long = parseFloat(form.RSMultiLongin.value);
    var lat = parseFloat(form.RSMultiLatin.value);
    var tzoffset = parseFloat(form.RSMultiTzin.value);
    var tzof = Math.abs(tzoffset) + 0.5/60; // used for rounding
    var tzString = "GMT";
    if (tzoffset >= 0) {
        tzString += "+";
    }  else {
        tzString += "-";
    }
    var hs = Math.floor(tzof).toString();
    if (hs.length < 2) {hs = "0"+hs;}
    var ms = Math.floor(60*(tzof-Math.floor(tzof))).toString();
    if (ms.length < 2) {ms = "0"+ms;}
    tzString += hs+ms;
    var obj = form.objects.value;
    var ra, dec, epoch;
    if (obj=="Star") {
        ra = parseFloat(form.RSMultiRa.value);
        dec = parseFloat(form.RSMultiDec.value);
        epoch = parseFloat(form.RSMultiEpoch.value);
    }
    var yy1 = parseInt(form.RSMultiYear1in.value);
    var mm1 = parseInt(form.RSMultiMonth1in.value);
    var dd1 = parseInt(form.RSMultiDay1in.value);
    var yy2 = parseInt(form.RSMultiYear2in.value);
    var mm2 = parseInt(form.RSMultiMonth2in.value);
    var dd2 = parseInt(form.RSMultiDay2in.value);
    var deltaD = parseInt(form.RSMultiDt.value);
    
    // sanity check 
    var errid = "#RSMultiErrorlocs";
    $(errid).empty();
    var objectList = 
        ["Sun","Moon","Mercury","Venus","Mars",
         "Jupiter","Saturn","Uranus","Neptune","Star"];
    var objectSelected = false;
    $("#objects").css("background-color", "white");
    for (var i=0; i < objectList.length; i++) {
        if (obj == objectList[i]) {
            objectSelected = true;
            break;
        }
    }
    if (!objectSelected) {
        var text = '<p style="color:red;">Please select an object.</p>';
        $("#objects").css("background-color", "#e2a8a8");
        $(errid).append(text);
    }
    var min = -180, max = 180;
    var message = "Invalid longitude! Longitude must be a number between -180 and 180. West of Greenwich is negative; east of Greenwich is positive.";
    sanityCheck(long,"#RSMultiLongin",min,max,message,errid);
    
    min = -90; max = 90;
    message = "Invalid latitude! Latitude must be a number between -90 and 90, positive in the northern hemisphere and negative in the southern hemisphere.";
    sanityCheck(lat,"#RSMultiLatin",min,max,message,errid);
    
    min=-12; max=14;
    message = "Invalid time zone! Time zone must be a number between -12 and 14.";
    sanityCheck(tzoffset,"#RSMultiTzin",min,max,message,errid);
    
    if (obj=="Star") {
        min = 0; max = 24;
        message = "Invalid RA! RA must be a number between 0 and 24.";
        sanityCheck(ra,"#RSMultiRa",min,max,message,errid);
        min = -90; max = 90;
        message = "Invalid Dec! Dec must be a number between -90 and 90.";
        sanityCheck(dec,"#RSMultiDec",min,max,message,errid);
        min = -200000; 
        max = 200000;
        message = "Invalid epoch. Please enter a year bteween -200,000 and 200,000: 2000 means J2000.0, 2050 means 50 years after J2000.0.";
        sanityCheck(epoch,"#RSMultiEpoch",min,max,message,errid);
    }
    
    min=-3000; max=3000;
    message = "Invalid year! Please enter an integer between -3000 and 3000. Note that 0 means 1 BCE, -1 means 2 BCE and so on. This webpage can only handle years between -3000 and 3000.";
    sanityCheck(yy1,"#RSMultiYear1in",min,max,message,errid);
    sanityCheck(yy2,"#RSMultiYear2in",min,max,message,errid); 
    
    min=1; max=12;
    message = "Invalid month! Month must be an integer between 1 and 12.";
    sanityCheck(mm1,"#RSMultiMonth1in",min,max,message,errid);
    sanityCheck(mm2,"#RSMultiMonth2in",min,max,message,errid);
    
    min=1; max=31;
    message = "Invalid day! Day must be an integer between 1 and 31.";
    sanityCheck(dd1,"#RSMultiDay1in",min,max,message,errid);
    sanityCheck(dd2,"#RSMultiDay2in",min,max,message,errid); 
    
    min=1; max=Number.POSITIVE_INFINITY;
    message = "Invalid time step! Time step must be a positive integer.";
    sanityCheck(deltaD,"#RSMultiDt",min,max,message,errid);
    
    if ($(errid).text()=="") {
        $("#riseSetMultipleDaysInput").slideUp();
        $('button.menu').attr("disabled", false);
        
        var text = "<p>Location: "+place+
            "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Longitude: "+
            long.toString()+"&deg;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Latitude: "+lat.toString()+"&deg;";
        $("#RSMultiResult").append(text);
        text = '<p>Time zone: '+tzString+'</p>';
        $("#RSMultiResult").append(text);
        if (obj=="Star") {
            text = '<p>Object: a star with RA = '+ra+
                '<sup>h</sup>, &nbsp;&nbsp; Dec = '+ 
                dec+'&deg;, &nbsp;&nbsp; epoch:'+epoch+'</p>';
        } else {
            text = '<p>Object: '+obj+'</p>';
        }
        $("#RSMultiResult").append(text);
        
        var D1 = getDm(yy1,mm1,dd1,0);
        var D2 = getDm(yy2,mm2,dd2,0);
        var RSMultiInput = {long:long, lat:lat, tz:tzoffset, 
                           D1:D1, D2:D2, deltaD:deltaD, 
                            obj:obj, ra:ra, dec:dec, epoch:epoch};
        calcRiseSetMultipleDates(RSMultiInput);
    }
}

function riseSetShowHideRADec(Class) {
    var classj = "."+Class;
    var show = $("#objects").val()=='Star';
    if (show) {
       $(classj).show();
    } else {
        $(classj).hide();
    }
}

// Calculate the local sidereal time at midnight of the time zone
// Here D is the number of dates from J2000.0, tz is the timezone 
// offset in minutes
function getLST0(D,T,long,tz) {
    // Get Julian date at midnight GMST
    var D0 = Math.floor(D-0.5)+0.5;
    // Get hours from tz
    var H = tz/60;
    if (H < 0) {H += 24;}
    var GMST = 0.06570748587250752*D0;
    GMST -= 24*Math.floor(GMST/24);
    GMST += 6.697374558336001 + 1.00273781191135448*H;
    GMST -= 24*Math.floor(GMST/24);
//    GMST += -2.686296296296296e-07 +T*(0.08541030618518518 
//                                       + T*(2.577003148148148e-05 
//                                           + T*(-8.148148148148149e-12 - 
//                                               T*5.547407407407407e-10)));
    GMST += 2.686296296296296e-07 +T*(0.08541030618518518 
                                       + T*2.577003148148148e-05);
    var LST0 = GMST + long*12/Math.PI;
    LST0 -= 24*Math.floor(LST0/24); // LST in hours
    return LST0*Math.PI/12; // LST in radian
}

// Calculate the rise, set and transit times of object for one location
// loc is an object with the following properties
// loc.locNum: 1 or 2 (location 1 or 2)
// loc.long, loc.lat: longitude and latitude in radians
// loc.tz: timezone offset in minutes
// loc.yyyy, loc.mm, loc.dd: year, month and date where the 
//     rise, set and transit times are to be calculated
function riseSetLoc(loc) {
    var locStr = loc.locNum.toString();
    // Number of days from J2000.0 at midnight local time
    var Dm = getDm(loc.yyyy,loc.mm,loc.dd,loc.tz);
    var T = Dm/36525;
    // local sidereal time at midnight local time
    var LST0 = getLST0(Dm,T+DeltaT(T),loc.long,loc.tz);
    
    riseSetPlanetsTwilights(LST0,loc.locNum,loc.lat,T)
    riseSetBrightestStars(LST0, loc.locNum, loc.lat, T+DeltaT(T));
}

// Calculate the rise, upper transit and set times of 
// the Sun, Moon and planets. Also calculate the times 
// of the beginning and ending of twilights.
function riseSetPlanetsTwilights(LST0,locNum,lat,T) {
    // First compute the positions of Sun, Moon and planets 
    // at 0h, 1h, ..., 24h
    var dT = DeltaT(T);
    var sinLat = Math.sin(lat), cosLat = Math.cos(lat);
    var i;
    var parray = [];
    for (i=0; i<25; i++) {
        parray[i] = sunMoonPlanets(T + i/876600 + dT);
    }
    
    var ra=[], dec=[];
    var locid, alt, trs, tt, txt;
    
    // Sunrise, sunset and upper transit
    locid = "#riseSetSun"+locNum.toString();
    $(locid).empty();
    for (i=0; i<25; i++) {
        ra[i] = parray[i][0].ra; dec[i] = parray[i][0].dec;
    }
    tt = getTransitTime(LST0,lat,ra,dec,false);
    alt = -0.01454441043328608; // -50' in radians
    trs = getRiseSet(alt,LST0,lat,ra,dec);
    if (trs.rise=="above") {
        txt = "<p>Upper transit: "+tt.t+" (Altitude = "+tt.alt+"); ";
        txt += "the sun is above the horizon all day.";
    } else if (trs.rise=="below") {
        txt = "<p>Upper transit: "+tt.t+" (Altitude = "+tt.alt+"); ";
        txt += "the sun is below the horizon all day.";
    } else {
        txt = "<p>Sunrise: "+trs.rise+" (Azimuth = "+trs.azRise+")&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
        txt += "Sunset: "+trs.set+" (Azimuth = "+trs.azSet+")&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
        txt += "Upper transit: "+tt.t+" (Altitude = "+tt.alt+")</p>";
    }
    $(locid).append(txt);
    // Civil twilight
    alt = -0.1047197551196598; // -6 deg in rad
    trs = getRiseSet(alt,LST0,lat,ra,dec);
    if (trs.rise=="above") {
        txt = "<p>No civil twilights. The Sun's altitude is above -6&deg; all day.</p>";
    } else if (trs.rise=="below") {
        txt = "<p>No civil twilights. The Sun's altitude is below -6&deg; all day.</p>";
    } else {
        txt = "<p>Civil twilight: begins at "+trs.rise+", ends at "+trs.set+".</p>";
    }
    $(locid).append(txt);
    // Nautical twilight
    alt = -0.2094395102393196; // -12 deg in rad
    trs = getRiseSet(alt,LST0,lat,ra,dec);
    if (trs.rise=="above") {
        txt = "<p>No nautical twilights. The Sun's altitude is above -12&deg; all day.</p>";
    } else if (trs.rise=="below") {
        txt = "<p>No nautical twilights. The Sun's altitude is below -12&deg; all day.</p>";
    } else {
        txt = "<p>Nautical twilight: begins at "+trs.rise+", ends at "+trs.set+".</p>";
    }
    $(locid).append(txt);
    // Astronomical twilight
    alt = -0.3141592653589793; // -18 deg in rad
    trs = getRiseSet(alt,LST0,lat,ra,dec);
    if (trs.rise=="above") {
        txt = "<p>No astronomical twilights. The Sun's altitude is above -18&deg; all day.</p>";
    } else if (trs.rise=="below") {
        txt = "<p>No astronomical twilights. The Sun's altitude is below -18&deg; all day.</p>";
    } else {
        txt = "<p>Astronomical twilight: begins at "+trs.rise+", ends at "+trs.set+".</p>";
    }
    $(locid).append(txt);
    
    // Moon
    locid = "#riseSetMoon"+locNum.toString();
    $(locid).empty();
    for (i=0; i<25; i++) {
        ra[i] = parray[i][1].ra; dec[i] = parray[i][1].dec;
    }
    tt = getTransitTime(LST0,lat,ra,dec,true);
    alt = 0.002327105669325773; // 8' in radians
    trs = getRiseSet(alt,LST0,lat,ra,dec);
    if (trs.rise=="above") {
        txt = "<p>Upper transit: "+tt.t+" (Altitude = "+tt.alt+"); ";
        txt += "the Moon is above the horizon all day.";
    } else if (trs.rise=="below") {
        txt = "<p>Upper transit: "+tt.t+" (Altitude = "+tt.alt+"); ";
        txt += "the Moon is below the horizon all day.";
    } else {
        txt = "<p>Moonrise: "+trs.rise+" (Azimuth = "+trs.azRise+")&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
        txt += "Moonset: "+trs.set+" (Azimuth = "+trs.azSet+")&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
        txt += "Upper transit: "+tt.t+" (Altitude = "+tt.alt+")</p>";
    }
    $(locid).append(txt);
    // Illumination and phase
    var raSun = parray[12][0].ra, decSun = parray[12][0].dec;
    var raMoon = parray[12][1].ra, decMoon = parray[12][1].dec;
    var Dmoon = parray[12][1].rGeo;
    var Lsun = parray[12][0].lam2000;
    var Dsun = parray[12][0].rGeo;
    var Lmoon = parray[12][1].lam2000;
    var illumPhase = moonIlluminated(raSun,decSun,raMoon,decMoon, Lsun,Lmoon, Dmoon, Dsun);
    var illum = illumPhase.illuminated, phase = illumPhase.phase;
    var mag = illumPhase.mag.toFixed(1);
    
    txt ="<p>At 12:00 in the given time zone...<br />"
    txt += "Fraction of Moon illuminated: "+illum.toFixed(2)+",&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Phase: "+phase+",<br />";
    txt += "Apparent Magnitude: "+mag+",&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Solar elongation: "+illumPhase.elongTxt+".</p>";
    $(locid).append(txt);
    
    // Planets
    var names = ["Mercury","Venus","Mars","Jupiter","Saturn","Uranus","Neptune"];
    locid = "#riseSetPlanets"+locNum.toString();
    $(locid).empty();
    txt = "<p>The elongation is the angular distance between the planet and the Sun. Elongations, fractions illuminated and magnitudes of the planets are given at 12:00 in the given time zone.</p>";
    $(locid).append(txt);
    $(locid).append("<table>");
    txt = "<tr><th>Planet</th> <th>Rise (Azimuth)</th> <th>Transit (Alt)</th> ";
    txt += "<th>Set (Azimuth)</th> <th>Elong.</th> <th>Illum.</th> <th>Mag.</th> </tr>";
    $(locid).append(txt);
    for (var j=2; j<9; j++) {
        for (i=0; i<25; i++) {
            ra[i] = parray[i][j].ra; dec[i] = parray[i][j].dec;
        }
        tt = getTransitTime(LST0,lat,ra,dec, false);
        alt = -0.009890199094634533; // -34' in radians
        trs = getRiseSet(alt,LST0,lat,ra,dec);
        var Rise=trs.rise+" ("+trs.azRise+")"; 
        var Set=trs.set+" ("+trs.azSet+")";
        if (trs.rise=="above") {
            Rise = "circumpolar"; Set = "circumpolar";
        } else if (trs.rise=="below") {
            Rise = "invisible"; Set = "invisible";
        }
        // Elongation and fraction of planet illuminated
        var planet = parray[12][j];
        var sun = parray[12][0];
        var elongIllum = elongationPhase(planet,sun);
        var Elong = elongIllum.elongation;
        var illum = elongIllum.illuminated;
        // apparent magnitude
        var magPara = {object:names[j-2], i:elongIllum.phaseAng, 
                       rHelio:planet.rHelio, rGeo:planet.rGeo, 
                       T:T+0.5/36525+dT, planet:planet, sun:sun};
        var mag = planetMag(magPara);
        
        txt = "<tr><td>"+names[j-2]+"</td>";
        txt +=" <td>"+Rise+"</td>";
        txt += " <td>"+tt.t+" ("+tt.alt+")"+"</td>";
        txt += " <td>"+Set+"</td>";
        txt += " <td>"+Elong+"</td>";
        txt += " <td>"+illum+"</td>";
        txt += " <td>"+mag.toFixed(1)+"</td> </tr>";
        $(locid).append(txt);
    }
    $(locid).append("</table>");
}

// Calculate the rise, upper transit and set times of the 
// brightest stars. 
// Here LST0 is local sidereal time at midnight local time;
// lat is latitude and T is the number of centuries from J2000.0;
// locNum is the location number (1 or 2)
function riseSetBrightestStars(LST0, locNum, lat, T) {
    // Load star data 
    var bstars = brightestStarsLoc[locNum-1];
    var T0 = bstars[0].Tepoch;
    if (Math.abs(T-T0) > 0.1) {
        // cortrect for precession and proper motions
        recomputeStarPos(T,bstars);
    }
    
    // Now compute rise, set and transit times
    var locid = "#riseSetStars"+locNum.toString();
    $(locid).empty();
    $(locid).append("<table>");
    var txt = "<tr><th>Star</th> <th>Rise (Azimuth)</th> <th>Transit</th> ";
    txt += "<th>Set</th> </tr>";
    $(locid).append(txt);
    // geocentric alt @ rise and set 
    var alt = -0.009890199094634533; // -34' in radians
    for (var i=1; i<bstars.length; i++) {
        var t = riseSetStar(LST0, alt, lat, bstars[i].ra, bstars[i].dec);
        var Rise = t.rise+" ("+t.azRise+")";
        var Transit = t.transit+" ("+t.altTransit+")";
        if (t.rise == "above") {
            Rise = "circumpolar";
            t.set = "circumpolar";
        } else if (t.rise == "below") {
            Rise = "invisible";
            t.set = "invisible";
        }
        txt = "<tr><td>"+bstars[i].name+"</td>";
        txt +=" <td>"+Rise+"</td>";
        txt += " <td>"+Transit+"</td>";
        txt += " <td>"+t.set+"</td> </tr>";
        $(locid).append(txt);
    }
    $(locid).append("</table>");
    txt = "<p>Note: For stars, the azimuth at the set time is the negative of its azimuth when it rises.</p>";
    $(locid).append(txt);
}

// Calculate the rise and set times on multiple dates 
// for a selected object. 
// All the information is in the object input, which 
// has the following properties:
// long: longitude (in degrees)
// lat: latitude (in degrees) 
// tz: time zone offset (in hours, positive for east of Greenwich)
// D1: start time (number of days from J2000.0, disregard time zone)
// D2: stop time (number of days from J2000.0, disregard time zone)
// deltaD: time step (in days)
// obj: object whose rise and set times are to be computed.
//     If obj is the Sun, the twilight times are also computed
// ra, dec, epoch: only relevent if obj is a star, in which case 
//     these variables gives the ra and dec of the stars at the 
//     given epoch. Note that epoch is a year. epoch = 2000 means 
//     J2000.0. epoch = 2050 means 50 years after J2000.0.
function calcRiseSetMultipleDates(input) {
    var deg_to_rad = Math.PI/180;
    var long = input.long * deg_to_rad;
    var lat = input.lat * deg_to_rad;
    
    var T1 = (input.D1 - input.tz/24)/36525;
    var deltaT = input.deltaD/36525;
    
    var count = 0, max = 10000, max_table = 500;
    var D,T,dT, LST0, raDec,i;
    var outid = "#RSMultiResult";
    
    var parray; 
    var ra=[], dec=[];
    var alt, trs, tt, txt, dateString;
    var calculate = [false,false,false,false,false,false,false,false];
    
    txt = '<p>Note: The table shows data up to '+
            max_table+' dates. The csv file contains data up to '+
            max+' dates.</p>';
    $(outid).append(txt);
    txt = "<p>Times are given according to the time zone listed above. Daylight saving time is not taken into account.</p>";
    $(outid).append(txt);
    
    switch (input.obj) {
        case "Sun":
            txt ="<p>The Gregorian calendar is approximately in sync with the Sun's motion, so the times are approximately the same at the same date every year. It is therefore not necessary to calculate the times for more than a year.</p>";
            $(outid).append(txt);
            txt = "<p>In the table below, the angles beside the rise and set times are the azimuths of the Sun at the rise and set times. Azimuth is measured from north and turning positive towards the east. The angle and direction beside the upper transit time is the altitute and direction of the Sun's center at transit. Atmospheric refraction is added when the altitude is above -1&deg;. For the twilights, the first time is the beginning of the twilight and the second time is the end of the twilight.</p>";
            $(outid).append(txt);
            txt = '<p><button onclick="download_csv(csvdata,'+"'Sun.csv')"+'">Download csv file</button></p>';
            $(outid).append(txt);
            $(outid).append('<table>')
            txt = '<tr><th>Date</th> <th>Rise</th> <th>Transit</th> <th>Set</th>';
            txt += '<th>Civ. Twi.</th> <th>Nat. Twi.</th>'; 
            txt += '<th>Ast. Twi.</th> </tr>';
            $(outid).append(txt);
            csvdata = 'Date, Rise, Transit, Set, Civ. Twi. beg., Civ. Twi. end, Nat. Twi. beg., Nat. Twi. end, Ast. Twi. beg., Ast. Twi. end\n';

            calculate[2] = true;
            for (D=input.D1; D<=input.D2; D += input.deltaD) {
                dateString = CalDat(D).dateString;
                T = T1 + count*deltaT;
                dT = DeltaT(T);
                var d = D - input.tz/24;
                LST0 = getLST0(d,T+dT,long,-input.tz*60);
                txt = '<tr> <td>'+dateString+'</td>';
                csvdata += dateString+', ';
                for (i=0; i<25; i++) {
                    parray = planetPos(T+i/876600+dT,calculate);
                    ra[i] = parray[2].ra; dec[i] = parray[2].dec;
                }
                // rise, set, upper transit
                tt = getTransitTime(LST0,lat,ra,dec, false);
                alt = -0.01454441043328608; // -50' in radians
                trs = getRiseSet(alt,LST0,lat,ra,dec);
                if (trs.rise=="above") {
                    txt += '<td>circumpolar</td> <td>';
                    txt += tt.t+' ('+tt.alt+')</td> <td>';
                    txt += 'circumpolar</td> ';
                    csvdata += 'circumpolar, '+tt.t+' ('+tt.alt+'), ';
                    csvdata += 'circumpolar, ';
                } else if (trs.rise=="below") {
                    txt += '<td>invisible</td> <td>';
                    txt += tt.t+' ('+tt.alt+')</td> <td>';
                    txt += 'invisible</td> ';
                    csvdata += 'invisible, '+tt.t+' ('+tt.alt+'), ';
                    csvdata += 'invisible, ';
                } else {
                    txt += '<td>'+trs.rise+' ('+trs.azRise+')</td> <td>';
                    txt += tt.t+' ('+tt.alt+')</td> <td>';
                    txt += trs.set+' ('+trs.azSet+')</td> ';
                    csvdata += trs.rise+' ('+trs.azRise+'), ';
                    csvdata += tt.t+' ('+tt.alt+'), ';
                    csvdata += trs.set+' ('+trs.azSet+'), ';
                }
                // civil twilight
                alt = -0.1047197551196598; // -6 deg in rad
                trs = getRiseSet(alt,LST0,lat,ra,dec);
                if (trs.rise=="above") {
                    txt += '<td>above -6&deg;</td> ';
                    csvdata += 'above -6 degrees, above -6 degrees, ';
                } else if (trs.rise=="below") {
                    txt += '<td>below -6&deg;</td> ';
                    csvdata += 'below -6 degrees, below -6 degrees, ';
                } else {
                    txt += '<td>'+trs.rise+', '+trs.set+'</td> ';
                    csvdata += trs.rise+', '+trs.set+', ';
                }
                // nautical twilight
                alt = -0.2094395102393196; // -12 deg in rad
                trs = getRiseSet(alt,LST0,lat,ra,dec);
                if (trs.rise=="above") {
                    txt += '<td>above -12&deg;</td> ';
                    csvdata += 'above -12 degrees, above -12 degrees, ';
                } else if (trs.rise=="below") {
                    txt += '<td>below -12&deg;</td> ';
                    csvdata += 'below -12 degrees, below -12 degrees, ';
                } else {
                    txt += '<td>'+trs.rise+', '+trs.set+'</td> ';
                    csvdata += trs.rise+', '+trs.set+', ';
                }
                // astronomical twilight
                alt = -0.3141592653589793; // -18 deg in rad
                trs = getRiseSet(alt,LST0,lat,ra,dec);
                if (trs.rise=="above") {
                    txt += '<td>above -18&deg;</td>';
                    csvdata += 'above -18 degrees, above -18 degrees\n';
                } else if (trs.rise=="below") {
                    txt += '<td>below -18&deg;</td>';
                    csvdata += 'below -18 degrees, below -18 degrees\n';
                } else {
                    txt += '<td>'+trs.rise+', '+trs.set+'</td>';
                    csvdata += trs.rise+', '+trs.set+'\n';
                }
                txt += ' </tr>';

                count++;
                if (count <= max_table) {$(outid).append(txt);}
                if (count==max) {break;}
            }
            $(outid).append('</table>');
            break;
            
        case "Moon":
            txt = "<p>In the table below, the angles beside the rise and set times are the azimuths of the Moon at the rise and set times. Azimuth is measured from north and turning positive towards the east. The angle and direction beside the upper transit time is the altitute and direction of the Moon's center at transit. Atmospheric refraction is added when the altitude is above -1&deg;. Illumination gives the fraction of the Moon illuminated. Elongation is the angular distance between the Moon and the Sun. Illumination, apparent magnitude and elongation are the values at 12:00 in the given time zone.</p>";
            $(outid).append(txt);
            txt = '<p><button onclick="download_csv(csvdata,'+"'Moon.csv')"+'">Download csv file</button></p>';
            $(outid).append(txt);
            $(outid).append('<table>')
            txt = '<tr><th>Date</th> <th>Rise</th> <th>Transit</th> <th>Set</th> <th>Illum.</th> <th>Mag.</th> <th>Elong.</th> <th>Phase</th> </tr>';
            $(outid).append(txt);
            csvdata = 'Date, Rise, Transit, Set, Illuminated, Magnitude, Elongation, Phase\n';
            alt = 0.002327105669325773; // 8' in radians
            for (D=input.D1; D<=input.D2; D += input.deltaD) {
                dateString = CalDat(D).dateString;
                T = T1 + count*deltaT;
                dT = DeltaT(T);
                var d = D - input.tz/24;
                LST0 = getLST0(d,T+dT,long,-input.tz*60);
                txt = '<tr> <td>'+dateString+'</td>';
                csvdata += dateString+', ';
                var lam12, Dmoon;
                for (i=0; i<25; i++) {
                    var moon = MediumMoon(T+dT + i/24/36525);
                    ra[i] = moon.ra; dec[i] = moon.dec;
                    if (i==12) {
                        lam12 = moon.lam2000;
                        Dmoon = moon.rGeo;
                    }
                }
                tt = getTransitTime(LST0,lat,ra,dec, true);
                trs = getRiseSet(alt,LST0,lat,ra,dec);
                if (trs.rise=="above") {
                    txt += '<td>circumpolar</td> <td>';
                    txt += tt.t+' ('+tt.alt+')</td> <td>';
                    txt += 'circumpolar</td> ';
                    csvdata += 'circumpolar, '+tt.t+' ('+tt.alt+'), ';
                    csvdata += 'circumpolar, ';
                } else if (trs.rise=="below") {
                    txt += '<td>invisible</td> <td>';
                    txt += tt.t+' ('+tt.alt+')</td> <td>';
                    txt += 'invisible</td> ';
                    csvdata += 'invisible, '+tt.t+' ('+tt.alt+'), ';
                    csvdata += 'invisible, ';
                } else {
                    txt += '<td>'+trs.rise+' ('+trs.azRise+')</td> <td>';
                    txt += tt.t+' ('+tt.alt+')</td> <td>';
                    txt += trs.set+' ('+trs.azSet+')</td> ';
                    csvdata += trs.rise+' ('+trs.azRise+'), ';
                    csvdata += tt.t+' ('+tt.alt+'), ';
                    csvdata += trs.set+' ('+trs.azSet+'), ';
                }
                // Illumination and phase
                calculate[2] = true;
                var sun = planetPos(T+dT+0.5/36525, calculate)[2];
                var raSun = sun.ra, decSun = sun.dec, Dsun = sun.rGeo;
                var raMoon = ra[12], decMoon = dec[12];
                var illumPhase = moonIlluminated(sun.ra,sun.dec,ra[12],dec[12], 
                                sun.lam2000,lam12,Dmoon,Dsun);
                var illum = illumPhase.illuminated.toFixed(2);
                var phase = illumPhase.phase;
                var mag = illumPhase.mag.toFixed(1);
                
                txt += '<td>'+illum+'</td>';
                csvdata += illum + ', ';
                txt += '<td>'+mag+'</td>';
                csvdata += mag + ', ';
                txt += '<td>'+illumPhase.elongTxt+'</td>';
                csvdata += illumPhase.elongTxt + ', ';
                txt += '<td>'+phase+'</td> </tr>';
                csvdata += phase + '\n';

                count++;
                if (count <= max_table) {$(outid).append(txt);}
                if (count==max) {break;}
            }
            $(outid).append('</table>');
            break;
            
        case "Mercury":
        case "Venus":
        case "Mars":
        case "Jupiter":
        case "Saturn":
        case "Uranus":
        case "Neptune":
            var pindex = {"Mercury":0, "Venus":1, "Mars":3, 
                     "Jupiter":4, "Saturn":5, "Uranus":6,
                     "Neptune":7};
            var ind = pindex[input.obj];
            calculate[2] = true;
            calculate[ind] = true;
            txt = "<p>In the table below, the angles beside the rise and set times are the azimuths of "+input.obj;
            txt += " at the rise and set times. Azimuth is measured from north and turning positive towards the east. The angle and direction beside the upper transit time is the altitute and direction of "+input.obj;
            txt += " at transit. Atmospheric refraction is added when the altitude is above -1&deg;. Elongation is the angular distance between "+input.obj+" and the Sun. Elongation and magnitude are given at 12:00 in the given time zone.</p>";
            $(outid).append(txt);
            txt = '<p><button onclick="download_csv(csvdata,'+"'"+
                input.obj+".csv')"+'">Download csv file</button></p>';
            $(outid).append(txt);
            $(outid).append('<table>')
            txt = '<tr><th>Date</th> <th>Rise (Azi)</th> <th>Transit (Alt)</th> <th>Set (Azi)</th> <th>Elong.</th> <th>Illum.</th> <th>Mag.</th></tr>';
            $(outid).append(txt);
            csvdata = 'Date, Rise (Azimuth), Transit (Altitude), Set (Azimuth), Elongation, Illuminated, Magnitude\n';
            alt = -0.009890199094634533; // -34' in radians
            for (D=input.D1; D<=input.D2; D += input.deltaD) {
                dateString = CalDat(D).dateString;
                T = T1 + count*deltaT;
                dT = DeltaT(T);
                var d = D - input.tz/24;
                LST0 = getLST0(d,T+dT,long,-input.tz*60);
                txt = '<tr> <td>'+dateString+'</td> ';
                csvdata += dateString+', ';
                var sun, planet;
                for (i=0; i<25; i++) {
                    parray = planetPos(T+i/876600+dT,calculate);
                    ra[i] = parray[ind].ra; 
                    dec[i] = parray[ind].dec;
                    if (i==12) {
                        sun = parray[2];
                        planet = parray[ind];
                    }
                }
                tt = getTransitTime(LST0,lat,ra,dec, false);
                trs = getRiseSet(alt,LST0,lat,ra,dec);
                var Rise=trs.rise+' ('+trs.azRise+')';
                var Set=trs.set+' ('+trs.azSet+')';
                if (trs.rise=="above") {
                   Rise = "circumpolar"; Set = "circumpolar";
                } else if (trs.rise=="below") {
                   Rise = "invisible"; Set = "invisible";
                }
                // Elongation and fraction of planet illuminated
                var elongIllum = elongationPhase(planet,sun);
                var Elong = elongIllum.elongation;
                var illum = elongIllum.illuminated;
                // apparent magnitude
                var magPara = {object:input.obj, i:elongIllum.phaseAng, 
                               rHelio:planet.rHelio, rGeo:planet.rGeo, 
                               T:T+0.5/36525+dT, planet:planet, sun:sun};
                var mag = planetMag(magPara).toFixed(1);
                txt += '<td>'+Rise+'</td> <td>';
                txt += tt.t+' ('+tt.alt+')</td> <td>';
                txt += Set+'</td> <td>'+Elong+'</td> <td>'+illum+'</td> <td>';
                txt += mag+'</td> </tr>';
                csvdata += Rise+', '+tt.t+' ('+tt.alt+'), ';
                csvdata += Set+', '+Elong+', '+illum+', '+mag+'\n';
                
                count++;
                if (count <= max_table) {$(outid).append(txt);}
                if (count==max) {break;}
            }
            break;
            
        case "Star":
            txt = "<p>Note that the rise, set and upper transit times of a star are 3 minutes and 56 seconds earlier than those in the previous day. The only long-term changes are caused by precession and the star's proper motion, which occurs on a very long time scale.</p>";
            $(outid).append(txt);
            txt = "<p>In the table below, the angles beside the rise time is the azimuth of the star at the rise time. Azimuth is measured from north and turning positive towards the east. For stars, the azimuth at the set time is always equal to the negative of the azimuth at the rise time and the azimuth is the same every day. The angle and direction beside the upper transit time is the altitute and direction of the star at transit, which is also the same every day. Atmospheric refraction is added when the altitude is above -1&deg;.</p>";
            $(outid).append(txt);
            var raStar = input.ra * Math.PI/12;
            var decStar = input.dec * deg_to_rad;
            var Tepoch = (input.epoch - 2000)*0.01;
            txt = '<p><button onclick="download_csv(csvdata,'+"'star.csv')"+
            '">Download csv file</button></p>';
            $(outid).append(txt);
            $(outid).append('<table>')
            txt = '<tr><th>Date</th> <th>Rise</th> <th>Transit</th> <th>Set</th> </tr>';
            $(outid).append(txt);
            csvdata = 'Date, Rise, Transit, Set\n';
            alt = -0.009890199094634533; // -34' in radians
            for (D=input.D1; D<=input.D2; D += input.deltaD) {
                dateString = CalDat(D).dateString;
                T = T1 + count*deltaT;
                dT = DeltaT(T);
                var d = D - input.tz/24;
                LST0 = getLST0(d,T+dT,long,-input.tz*60);
                txt = '<tr> <td>'+dateString+'</td> ';
                csvdata += dateString+', ';
                if (Math.abs(T-Tepoch) > 0.1) {
                    // correct for precession
                    var p = precession_matrix(Tepoch,T-Tepoch);
                    var precessed = precessed_ra_dec(raStar,decStar,p);
                    raStar = precessed.ra;
                    decStar = precessed.dec;
                    Tepoch = T;
                }
                var t = riseSetStar(LST0, alt, lat, raStar, decStar);
                var Rise = t.rise+' ('+t.azRise+')';
                var Set = t.set;
                if (t.rise == "above") {
                    Rise = "circumpolar";
                    Set = "circumpolar";
                } else if (t.rise == "below") {
                    Rise = "invisible";
                    Set = "invisible";
                }
                txt += '<td>'+Rise+'</td> <td>';
                txt += t.transit+' ('+t.altTransit+')</td> <td>';
                txt += Set+'</td></tr>';
                csvdata += Rise+', '+t.transit+' ('+t.altTransit+'), ';
                csvdata += Set+'\n';
                
                count++;
                if (count <= max_table) {$(outid).append(txt);}
                if (count==max) {break;}
            }
    }
}

// Quadratic interpolation 
// Performs quadratic interpolation from 
// three equidistant values of a function
// 
// x: value at which the function is to be inetrpolatred
// ym: value of the function at x=-1
// y0: value of the function at x=0
// yp: value of the function at x=1
function Quad(x,ym,y0,yp) {
    var a = 0.5*(yp+ym) - y0;
    var b = 0.5*(yp-ym);
    var c = y0;
    return (a*x+b)*x + c;
}

// Quadratic interpolation 
// Performs root finding and search for extreme values 
// on three equidistant values of a function
// Based on the C++ code in Astronomy on Personal Computer, p. 49
// 
// ym: value of the function at x=-1
// y0: value of the function at x=0
// yp: value of the function at x=1
// xe: abscissa of extreme (may be outside [-1,1])
// ye: value of the function at x=xe
// root1: first root of the quadratic functions 
// root2: second root of the quadratic functions
// nroot: number of roots found in [-1,1]
function QuadRootSearch(ym, y0,yp) {
    var a = 0.5*(yp+ym) - y0;
    var b = 0.5*(yp-ym);
    var c = y0;
    
    var xe, ye, root1, root2, nroot;
    if (Math.abs(a) < 1e-6) {
        // the function is linear
        if (b>0) {
            xe = 1;
        } else {
            xe = -1;
        } 
        if (b==0) {
            // a constant function! 
            xe = 0;
            root1 = Infinity;
            nroot = 0;
        } else {
            root1 = -c/b;
            nroot = 1;
            if (Math.abs(root1) > 1) {nroot=0;}
        }
        ye = b*xe + c;
        return {xe:xe, ye:ye, nroot:nroot, root1:root1, root2:root1};
    }
    
    // Find extreme value
    xe = -0.5*b/a;
    ye = (a*xe + b)*xe + c;
    var dis = b*b - 4*a*c; // discriminant of y=ax^2+bx+c
    if (dis >= 0) {
        // parabola has roots
        if (Math.abs(a*c) > 1e-3*dis) {
            var dx = 0.5*Math.sqrt(dis)/Math.abs(a);
            root1 = xe - dx; root2 = xe + dx;
        } else {
            // The function is nearly linear. The two roots 
            // are close to -c/b and -b/a.
            // Use an alternative expression for the roots to 
            // prevent loss of accuracy due to substraction of 
            // two nearly equal large numbers
            var tmp = b + Math.sqrt(dis);
            if (b < 0) {
                tmp = b - Math.sqrt(dis);
            }
            var r1 = -2*c/tmp;
            var r2 = -0.5*tmp/a;
            root1 = Math.min(r1,r2);
            root2 = Math.max(r1,r2);
        }
        nroot = 0;
        if (Math.abs(root1) <= 1) {nroot++;}
        if (Math.abs(root2) <= 1) {nroot++;}
        if (nroot==1) {
            //make sure root1 is the one in [-1,1]
            root1 = (Math.abs(root1) <= 1) ? root1:root2;
        }
    } else {
        nroot = 0; root1 = Infinity; root2=Infinity;
    }
    return {xe:xe, ye:ye, nroot:nroot, root1:root1, root2:root2};
}

// Search for the time of upper transit (defined as hour ang = 0)
// based on ra and dec computed at hourly speced time interval 
// over the course of a day.
// ra and dec must be arrays of length 25.
// moonParallax is a logic parameter that determines if 
//  the parallax should be added to the altitude at 
//  transit (only relevant to the Moon)
function getTransitTime(LST0,lat,ra,dec, moonParallax) {
    var twoPI = 2*Math.PI;
    var HA = [];
    var i;
    for (i=0; i<25; i++) {
        HA[i] = LST0 - ra[i] + 0.262516170790829*i;
        HA[i] -= twoPI*Math.floor((HA[i]+Math.PI)/twoPI);
    }
    // Search for upper transit time
    var j;
    for (i=0; i<24; i++) {
        if (HA[i]*HA[i+1] < 0 && Math.abs(HA[i]-HA[i+1]) < 1) {
            j=i;
            break;
        }
    }
    if (j===undefined) {
        return {t:"-", alt:"-"};
    } 
    if (j==0) {j=1;}
    var result = QuadRootSearch(HA[j-1], HA[j], HA[j+1]);
    if (result.nroot != 1) {
        return {t:"NA", alt:"NA"};
    }
    // transit time 
    var t = convertHoursToHourMinute(j + result.root1);
    // transit altitude and azimuth
    // First interpolate dec
    var decTransit = Quad(result.root1,dec[j-1],dec[j],dec[j+1]);
    var alt = 0.5*Math.PI - Math.abs(lat-decTransit);
    if (moonParallax) {
        // add parallax correction (only relevant for the moon)
        var Rearth = 6371, Dmoon = 384400;
        alt -= Rearth*Math.cos(alt)/(Dmoon - Rearth*Math.sin(alt));
    }
    if (alt > -0.0175) {
        // add atm refraction
        alt += atmosphericRefraction(alt,101,286);
    }
    alt *= (180/Math.PI);
    alt = alt.toFixed(1)+"&deg;";
    if (lat < decTransit) {
        alt += " N";
    } else {
        alt += " S";
    }
    return {t:t, alt:alt};
}

// Search for the times when the altitude of an object reaches
// the specified alt0 (in radians) based on ra and dec computed 
// at hourly speced time interval over the course of a day.
// ra and dec must be arrays of length 25.
function getRiseSet(alt0,LST0,lat,ra,dec) {
    var i;
    // calculate sin(altitude) - sin(specified altitide)
    var cosLat = Math.cos(lat), sinLat = Math.sin(lat);
    var sinAlt0 = Math.sin(alt0);
    var dSinAlt = [];
    var HA;
    for (i=0; i<25; i++) {
        HA = LST0 - ra[i] + 0.262516170790829*i;
        dSinAlt[i] = sinLat*Math.sin(dec[i]) + 
            cosLat*Math.cos(dec[i])*Math.cos(HA) - sinAlt0;
    }
    // Now search for "rise" and "set" times
    var foundRise = false, foundSet = false;
    var iRise, iSet, tRise, tSet;
    for (i=1; i<25; i += 2) {
        var result = QuadRootSearch(dSinAlt[i-1], dSinAlt[i], dSinAlt[i+1]);
        if (result.nroot > 0) {
            if (result.nroot == 1) {
                if (dSinAlt[i-1] < 0) {
                    iRise = i;
                    foundRise = true;
                    tRise = i+result.root1;
                } else {
                    iSet = i;
                    foundSet = true;
                    tSet = i+result.root1;
                }
            } else {
                // found two roots, meaning both rise and set times 
                // are there.
                iRise = i; iSet = i;
                foundRise = true; foundSet = true;
                if (result.ye >= 0) {
                    tRise = i + result.root1;
                    tSet = i + result.root2;
                } else {
                    tSet = i + result.root1;
                    tRise = i + result.root2;
                }
            }
        }
        if (foundRise && foundSet) {break;}
    }
    
    // Calculate the azimuth at rise and set times
    // First, define a general function for the calculation
    // j is the index iRise or iSet, dj is tRise-iRise or 
    //     tSet-iSet
    var getAz = function(j,dj) {
        var cosDec, sinDec, sA,cA,y0,yp,ym,x,y, raI, decI;
        // First interpolate ra and dec
        // For ra, interpolate sin(ra) and cos(ra) 
        // to take care of the discontinuity at pi
        y0 = Math.sin(ra[j]); 
        yp = Math.sin(ra[j+1]);
        ym = Math.sin(ra[j-1]); 
        y = Quad(dj,ym,y0,yp);
        y0 = Math.cos(ra[j]);
        yp = Math.cos(ra[j+1]);
        ym = Math.cos(ra[j-1]); 
        x = Quad(dj,ym,y0,yp)
        raI = Math.atan2(y,x);
        decI = Quad(dj,dec[j-1],dec[j],dec[j+1]); 
        HA = LST0 - raI + 0.262516170790829*(j+dj);
        cosDec = Math.cos(decI), sinDec = Math.sin(decI);
        sA = cosDec*Math.sin(HA);
        cA = cosDec*Math.cos(HA)*sinLat - sinDec*cosLat;
        var az = 180 + 180/Math.PI*Math.atan2(sA,cA);
        if (az > 180) {az -= 360;}
        return Math.round(az).toString()+"&deg;"
    }
    
    var azRise = "-", azSet = "-";
    var Rise = "-", Set = "-";
    if (foundRise) {
        Rise = convertHoursToHourMinute(tRise);
        azRise = getAz(iRise,tRise-iRise);
    } 
    if (foundSet) {
        Set = convertHoursToHourMinute(tSet);
        azSet = getAz(iSet, tSet-iSet);
    }
    
    if (!foundRise && !foundSet) {
        if (dSinAlt[0] > 0) {
            Rise = "above"; Set = "above";
        } else {
            Rise = "below"; Set = "below";
        }
    }
    return {rise:Rise, set:Set, azRise:azRise, azSet:azSet};
}

// convert hours -> hh:mm 
function convertHoursToHourMinute(hours) {
    var hr = hours + 0.5/60 // take care of rounding
    var h = Math.floor(hr);
    var m = Math.floor((hr-h)*60).toString();
    h = h.toString();
    if (h.length < 2) {h = "0"+h;}
    if (m.length < 2) {m = "0"+m;}
    return h+":"+m;
}

// Calculate the time for a star 
// (or objects with essentially fixed RAs and DECs over the 
//  course of a day) to rise and set to a given geocentric altitude alt
//  and the upper transit time
// Here LST0 is the local sidereal time at midnight.
// All angles are measured in radians
function riseSetStar(LST0, alt, lat, ra, dec) {
    var halfPI = 0.5*Math.PI;
    var rad_to_deg = 180/Math.PI;
    var altMax = halfPI - Math.abs(lat-dec);
    var altMin = -halfPI + Math.abs(lat+dec);
    
    // Calculate the upper transit time
    var dHA = (ra-LST0)*12/Math.PI;
    dHA = dHA - 24*Math.floor(dHA/24);
    var t = dHA/1.00273781191135448;
    var tTransit = convertHoursToHourMinute(t);
    var azTransit=""; // azimuth at transit (either North, South or at zenith)
    if (lat < dec) {
        azTransit = "N";
    } else if (lat > dec) {
        azTransit = "S";
    }
    // upper transit altitude
    var altTransit = altMax;
    if (altTransit > -0.0175) {
        // add atm refraction
        altTransit += atmosphericRefraction(altMax,101,286);
    }
    altTransit *= rad_to_deg;
    altTransit = altTransit.toFixed(1)+"&deg; "+azTransit;
    
    // Calculate the rise and set times
    var tRise, tSet, azRise;
    if (alt < altMin) {
        tRise = "above"; tSet = "above"; azRise="-";
    } else if (alt > altMax) {
        tRise = "below"; tSet = "below"; azRise = "-";
    } else {
        var sinRa = Math.sin(ra), cosRa = Math.cos(ra);
        var sinDec = Math.sin(dec), cosDec = Math.cos(dec);
        var sinLat = Math.sin(lat), cosLat = Math.cos(lat);
        var HA = Math.acos( (Math.sin(alt) - sinLat*sinDec)/(cosLat*cosDec) );
        var LST = HA + ra;
        t = (LST-LST0)*12/Math.PI;
        t = t-24*Math.floor(t/24);
        tSet = convertHoursToHourMinute(t/1.00273781191135448);
        LST = ra-HA;
        t = (LST-LST0)*12/Math.PI;
        t = t-24*Math.floor(t/24);
        tRise = convertHoursToHourMinute(t/1.00273781191135448);
        azRise = Math.atan2(-Math.sin(HA)*cosDec, cosDec*Math.cos(HA)*sinLat-sinDec*cosLat);
        azRise = Math.round(azRise*rad_to_deg + 180).toString()+"&deg;";
    }
    return {rise:tRise, set:tSet, azRise:azRise, transit:tTransit, 
            altTransit:altTransit};
}

function download_csv(data, filename) {
    // create link to download data
    var hiddenElement = window.document.createElement('a');
    hiddenElement.href = window.URL.createObjectURL(new Blob([data], {type: 'text/csv'}));
    hiddenElement.download = filename;

    // Append anchor to body.
    document.body.appendChild(hiddenElement);
    hiddenElement.click();

    // Remove anchor from body
    document.body.removeChild(hiddenElement);
}
