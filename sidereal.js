"use strict";

// Set up global variables
var date1, date2; // dates and times of the two locations
var place1,place2; // names of the locations
var long1,long2;  // longitudes of the locations (in deg)
var lat1,lat2; // latitudes of the locations (in deg)
// timezone variables associated with the locations
// tz1.tz: timezone offset in minutes from GMT (west is positive)
// tz1.tz1String: the timezone offset string
var tz1,tz2; 
// Tooltips (popup box, to be more accurate) setup
var tipsEnabled, tips, highPrecCalInTips; 
// Save stars' positions for the dates in the two locations 
// initialize the arrays
var starsLoc = [], brightestStarsLoc = [], conLabelLoc = [];
starsLoc[0] = brightStars(); starsLoc[1] = brightStars();
brightestStarsLoc[0] = brightestStars(); brightestStarsLoc[1] = brightestStars();
conLabelLoc[0] = constellationLabel(); conLabelLoc[1] = constellationLabel();
var magLimit = 5.3; // limiting magnitude
var magLimitTip = 5.3; // limit. mag. for stars to show a popup box
// Save Milky Way boundaries' positions for the dates in the two locations 
// initialize the arrays
var milkyLoc = [];
milkyLoc[0] = {northernEdge:northernEdge(), 
               southernEdge:southernEdge(), 
               betaCas:betaCas(), thetaOph:thetaOph(), 
               lambdaSco:lambdaSco(), 
               coalsack:coalsack()};
milkyLoc[1] = {northernEdge:northernEdge(), 
               southernEdge:southernEdge(), 
               betaCas:betaCas(), thetaOph:thetaOph(), lambdaSco:lambdaSco(), 
               coalsack:coalsack()};

// Initial setup
function init() {
    var iplookup = false;
    if (iplookup) {
        $.ajax({url:'http://ip-api.com/json',
          success:function(res) {
              var place = res.city;
              if (res.region != "") {
                  place += ', '+res.region;
              }
              place += ', '+res.countryCode;
              $("#place1").text(place);
              $("#long1").text(res.lon);
              $("#lat1").text(res.lat);
          }, timeout:1000, 
           complete:init_cont});
    } else {
        init_cont();
    }
}

function init_cont() {
    var d = new Date(); // current time from computer's clock
    
    // Set location 1
    var tmp1 = $("#long1").text();
    var tmp2 = $("#lat1").text();
    if (tmp1 != "" && tmp2 != "") {
        place1 = $("#place1").text();
        long1 = parseFloat(tmp1);
        lat1 = parseFloat(tmp2);
    } else {
        place1 = "Champaign, IL, USA";
        long1 = -88.2434; 
        lat1 = 40.1164;
    }
    //place1 = "Champaign, IL";
    //long1 = -88.2434; 
    //lat1 = 40.1164;
    var tz1String = "GMT";
    // Use computer's clock for the time zone
    var tz1offset = d.getTimezoneOffset();
    var tString = d.toTimeString();
    var i = tString.indexOf("GMT");
    if (i != -1) {
        tz1String = tString.slice(i+3);
    }
    tz1 = {tz:tz1offset, tzString:tz1String};
    
    // Set location 2
    place2 = "";
    long2 = long1;
    lat2 = -30;
    if (lat1 < 0) {lat2 = 30;}
    tz2 = {tz:tz1.tz, tzString:tz1.tzString};
    // *** Hong Kong ***
//    place2 = "Hong Kong";
//    long2 = 114.109497;
//    lat2 = 22.396428;
//    tz2 = {tz:-480, tzString:"+0800"};
    
    // Set up the object date1 
    var yyyy = d.getFullYear();
    var mm = d.getMonth()+1;
    var dd = d.getDate();
    var h = d.getHours();
    var m = d.getMinutes();
    var s = d.getSeconds()+1e-3*d.getMilliseconds();
    var dateString = generateDateString(yyyy,mm,dd);
    var timeString = generateTimeString(h,m,s);
    var D = getDm(yyyy,mm,dd,tz1.tz) + (h+m/60+s/3600)/24;
    var T = D/36525;
    var dT = DeltaT(T);
    date1 = {yyyy:yyyy, mm:mm, dd:dd, h:h, m:m, s:s, tz:tz1.tz, 
             tzString:tz1.tzString, dateString:dateString, 
             timeString:timeString, D:D, T:T, dT:dT};
    var GMST = getGMST(date1);
    var LST = getSidereal(GMST,long1);
    date1.LST = LST.hour;
    date1.LST_rad = LST.rad;
    date1.LSTstring = LST.string;
    
    // Set up the object date2 
    h += (tz1.tz - tz2.tz)/60; // hour in location 2
    var hour = h + m/60 + s/3600;
    hour -= 24*Math.floor(h/24);
    var date = CalDat(D+tz2.tz/1440);
    h = Math.floor(hour); m = Math.floor((hour-h)*60); 
    s = 3600*(hour-h-m/60);
    timeString = generateTimeString(h,m,s);
    date2 = {yyyy:date.yy, mm:date.mm, dd:date.dd, h:h, m:m, s:s,
             tz:tz2.tz, tzString:tz2.tzString,
             dateString:date.dateString, timeString:timeString, 
             D:D, T:T, dT:dT};
    GMST = getGMST(date2);
    LST = getSidereal(GMST,long2);
    date2.LST = LST.hour;
    date2.LST_rad = LST.rad;
    date2.LSTstring = LST.string;
    
    tipsEnabled = true;
    tips = [[], []];
    highPrecCalInTips = true;
    $("#loc1").on("click", function(event) {displayPopup(event, 1);});
    $("#loc2").on("click", function(event) {displayPopup(event, 2);});
    
    starChart();
}

// *** Change Locations and Times ***
function displayChangeLocs() {
    $('button.menu').attr("disabled", true);
    $("#inputlocs").slideDown();
    $("#geolocmessage").empty();
    $("#geolocerr").empty();
    $("#place1in").val(place1);
    $("#long1in").val(long1);
    $("#lat1in").val(lat1);
    $("#year1in").val(date1.yyyy);
    $("#month1in").val(date1.mm);
    $("#day1in").val(date1.dd);
    $("#hour1in").val(date1.h);
    $("#minute1in").val(date1.m);
    $("#second1in").val(date1.s.toFixed(3));
    $("#tz1in").val(-tz1.tz/60);
    $("#place2in").val(place2);
    $("#long2in").val(long2);
    $("#lat2in").val(lat2);
    $("#year2in").val(date2.yyyy);
    $("#month2in").val(date2.mm);
    $("#day2in").val(date2.dd);
    $("#hour2in").val(date2.h);
    $("#minute2in").val(date2.m);
    $("#second2in").val(date2.s.toFixed(3));
    $("#tz2in").val(-tz2.tz/60);
    $("#synTimeYes").prop("checked", true);
    $("#synTimeNo").prop("checked", false);
    $(".timeInputLoc2").hide();
}

// Determine Location 1 by Geolocation/IP lookup
function geoloc() {
    $("#geolocmessage").append('Please wait...');
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition( 
            function success(position) {
                var long = position.coords.longitude;
                var lat = position.coords.latitude;
                $("#place1in").val('');
                $("#long1in").val(long);
                $("#lat1in").val(lat);
                $("#geolocmessage").empty();
                var txt = 'Success! Longitude and latitude have been entered.';
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
              var place = res.city;
              if (res.region != "") {
                  place += ', '+res.region;
              }
              place += ', '+res.countryCode;
              $("#place1in").text(place);
              $("#long1in").text(res.lon);
              $("#lat1in").text(res.lat);
              $("#geolocmessage").empty();
              var txt = 'Success! Longitude and latitude have been entered.';
              $("#geolocmessage").append(txt);
          }, timeout:1000, 
           error:function(xhr,status,error) {
                   $("#geolocmessage").empty();
                   var txt = 'Unable to determine your location by GPS or IP address!';
                   $("#geolocerr").append(txt);
                 }
           });
}

function changeSyncTime(i,idHead) {
    var yesID = "#"+idHead+"Yes";
    var noID = "#"+idHead+"No";
    if (i==0) {
        $(yesID).prop("checked", false);
        $(noID).prop("checked", true);
        $(".timeInputLoc2").show();
    } else {
        $(yesID).prop("checked", true);
        $(noID).prop("checked", false);
        $(".timeInputLoc2").hide();
    }
}

function changeLocationsAndTimes(form) {
    place1 = form.place1in.value;
    long1 = parseFloat(form.long1in.value);
    lat1 = parseFloat(form.lat1in.value);
    var tzoffset1 = parseFloat(form.tz1in.value);
    tz1.tz = -tzoffset1*60;
    var tzof = Math.abs(tzoffset1) + 0.5/60; // used for rounding
    if (tzoffset1 >= 0) {
        tz1.tzString = "+";
    }  else {
        tz1.tzString = "-";
    }
    var hs = Math.floor(tzof).toString();
    if (hs.length < 2) {hs = "0"+hs;}
    var ms = Math.floor(60*(tzof-Math.floor(tzof))).toString();
    if (ms.length < 2) {ms = "0"+ms;}
    tz1.tzString += hs+ms;
    var yy1 = parseInt(form.year1in.value);
    var mm1 = parseInt(form.month1in.value);
    var dd1 = parseInt(form.day1in.value);
    var h1 = parseInt(form.hour1in.value);
    var m1 = parseInt(form.minute1in.value);
    var s1 = parseFloat(form.second1in.value);
    
    place2 = form.place2in.value;
    long2 = parseFloat(form.long2in.value);
    lat2 = parseFloat(form.lat2in.value);
    var tzoffset2 = parseFloat(form.tz2in.value);
    tz2.tz = -tzoffset2*60;
    tzof = Math.abs(tzoffset2) + 0.5/60; // used for rounding
    if (tzoffset2 >= 0) {
        tz2.tzString = "+";
    }  else {
        tz2.tzString = "-";
    }
    hs = Math.floor(tzof).toString();
    if (hs.length < 2) {hs = "0"+hs;}
    ms = Math.floor(60*(tzof-Math.floor(tzof))).toString();
    if (ms.length < 2) {ms = "0"+ms;}
    tz2.tzString += hs+ms;
    var sync = document.getElementById("synTimeYes").checked;
    var yy2,mm2,dd2,h2,m2,s2;
    if (sync) {
        yy2 = yy1; mm2 = mm1; dd2 = dd1; h2=h1; m2=m1; s2=s1;
    } else {
        yy2 = parseInt(form.year2in.value);
        mm2 = parseInt(form.month2in.value);
        dd2 = parseInt(form.day2in.value);
        h2 = parseInt(form.hour2in.value);
        m2 = parseInt(form.minute2in.value);
        s2 = parseFloat(form.second2in.value);
    }
    
    // sanity check
    var errid = "#errorlocs";
    $(errid).empty();
    var min = -180, max = 180;
    var message = "Invalid longitude! Longitude must be a number between -180 and 180. West of Greenwich is negative; east of Greenwich is positive.";
    sanityCheck(long1,"#long1in",min,max,message,errid);
    sanityCheck(long2,"#long2in",min,max,message,errid);
    
    min = -90; max = 90;
    message = "Invalid latitude! Latitude must be a number between -90 and 90, positive in the northern hemisphere and negative in the southern hemisphere.";
    sanityCheck(lat1,"#lat1in",min,max,message,errid);
    sanityCheck(lat2,"#lat2in",min,max,message,errid);
    
    min=-200000; max=200000;
    message = "Invalid year! Please enter an integer between "+min+" and "+max+". Note that 0 means 1 BCE, -1 means 2 BCE and so on. Warning: positions of the Sun, Moon and planets are not accurate outside the years between -3000 and 3000.";
    sanityCheck(yy1,"#year1in",min,max,message,errid);
    if (!sync) {sanityCheck(yy2,"#year2in",min,max,message,errid); }
    
    min=1; max=12;
    message = "Invalid month! Month must be an integer between 1 and 12.";
    sanityCheck(mm1,"#month1in",min,max,message,errid);
    if (!sync) {sanityCheck(mm2,"#month2in",min,max,message,errid); }
    
    min=1; max=31;
    message = "Invalid day! Day must be an integer between 1 and 31.";
    sanityCheck(dd1,"#day1in",min,max,message,errid);
    if (!sync) {sanityCheck(dd2,"#day2in",min,max,message,errid); }
    
    min=0; max=23;
    message = "Invalid hour! Hour must be an integer between 0 and 23.";
    sanityCheck(h1,"#hour1in",min,max,message,errid);
    if(!sync) {sanityCheck(h2,"#hour2in",min,max,message,errid); }
    
    min=0; max=59;
    message = "Invalid minute! Minute must be an integer between 0 and 59.";
    sanityCheck(m1,"#minute1in",min,max,message,errid);
    if (!sync) {sanityCheck(m2,"#minute2in",min,max,message,errid); }
    
    min=0; max=60;
    message = "Invalid second! Second must be a number between 0 and 60.";
    sanityCheck(s1,"#second1in",min,max,message,errid);
    if (!sync) {sanityCheck(s2,"#second2in",min,max,message,errid); }
    
    min=-12; max=14;
    message = "Invalid time zone! Time zone must be a number between -12 and 14.";
    sanityCheck(tzoffset1,"#tz1in",min,max,message,errid);
    sanityCheck(tzoffset2,"#tz2in",min,max,message,errid);
    
    if ($(errid).text()=="") {
        $("#inputlocs").slideUp();
        $('button.menu').attr("disabled", false);
        // Make sure the date is in the proper form
        // i.e. no stuff like 02-31 or 04-31
        // so convert date to Julian day and then back to date
        var D = getDm(yy1,mm1,dd1,0);
        var date = CalDat(D);
        yy1 = date.yy; mm1=date.mm; dd1 = date.dd;
        var dateString = date.dateString;
        var timeString = generateTimeString(h1,m1,s1);
        D = getDm(yy1,mm1,dd1,tz1.tz) + (h1+m1/60+s1/3600)/24;
        var T = D/36525;
        var dT = DeltaT(T);
        date1 = {yyyy:yy1, mm:mm1, dd:dd1, h:h1, m:m1, s:s1, 
                 tz:tz1.tz, tzString:tz1.tzString, 
                 dateString:dateString, timeString:timeString, 
                 D:D, T:T, dT:dT};
        var GMST = getGMST(date1);
        var LST = getSidereal(GMST,long1);
        date1.LST = LST.hour;
        date1.LST_rad = LST.rad;
        date1.LSTstring = LST.string;
        D = getDm(yy2,mm2,dd2,0);
        date = CalDat(D);
        yy2 = date.yy; mm2=date.mm; dd2 = date.dd;
        dateString = date.dateString;
        timeString = generateTimeString(h2,m2,s2);
        D = getDm(yy2,mm2,dd2,tz2.tz) + (h2+m2/60+s2/3600)/24;
        T = D/36525;
        dT = DeltaT(T);
        date2 = {yyyy:yy2, mm:mm2, dd:dd2, h:h2, m:m2, s:s2, 
                 tz:tz2.tz, tzString:tz1.tzString, 
                 dateString:dateString, timeString:timeString, 
                 D:D, T:T, dT:dT};
        GMST = getGMST(date2);
        LST = getSidereal(GMST,long2);
        date2.LST = LST.hour;
        date2.LST_rad = LST.rad;
        date2.LSTstring = LST.string;
        
        starChart();
    }
}

// *** star charts ***
function showHide(loc,name) {
    var locStr = loc.toString();
    $("#show"+name+locStr).toggleClass("active");
    starChartLoc(loc);
}

// Calculate the mean Greenwich sidereal time in hours 
function getGMST(d) {
    // Get Julian date at midnight GMST
    var D0 = Math.floor(d.D-0.5)+0.5;
    // Get hours according to the UTC
    var H = d.h + d.m/60 + d.s/3600 + d.tz/60;
    H -= 24*Math.floor(H/24);

    var GMST = 0.06570748587250752*D0;
    GMST -= 24*Math.floor(GMST/24);
    GMST += 6.697374558336001 + 1.00273781191135448*H;
    GMST -= 24*Math.floor(GMST/24);
    var T = d.T + d.dT;
//    GMST += -2.686296296296296e-07 +T*(0.08541030618518518 
//                                       + T*(2.577003148148148e-05 
//                                           + T*(-8.148148148148149e-12 - 
//                                               T*5.547407407407407e-10)));
    GMST += -2.686296296296296e-07 +T*(0.08541030618518518 
                                       + T*2.577003148148148e-05);
    GMST -= 24*Math.floor(GMST/24);
    return GMST;
}

// Calculate the apparent Greenwich sidereal time in hours 
// using the formula on 
// http://aa.usno.navy.mil/faq/docs/GAST.php
// Here d is the new date object
//function getGMAT(d) {
//    // Get Julian date at midnight GMST
//    var D0 = Math.floor(d.D-0.5)+0.5;
//    // Get hours according to the UTC
//    var H = d.h + d.m/60 + d.s/3600 + d.tz/60;
//    H -= 24*Math.floor(H/24);
//
//    var GMST = 0.06570982441908*D0;
//    GMST -= 24*Math.floor(GMST/24);
//    GMST += 6.697374558 + 1.00273790935*H + 2.5862e-5*d.T*d.T;
//    GMST -= 24*Math.floor(GMST/24);
//    var deg_to_rad = Math.PI/180;
//    var Omega = 125.04-0.052954*d.D;
//    var L = 280.47+0.98565*d.D;
//    Omega = (Omega - 360*Math.floor(Omega/360))*deg_to_rad;
//    L = (L - 360*Math.floor(L/360))*deg_to_rad;
//    var eps = (23.4393 - 4e-7*d.D)*deg_to_rad;
//    var Dpsi = -0.000319*Math.sin(Omega) - 0.000024*Math.sin(2*L);
//    return GMST + Dpsi*Math.cos(eps);
//}

// Calculate the sidereal time from GMST and longitude
function getSidereal(GMST,long) {
    var LST = GMST + long/15;
    LST = LST - 24*Math.floor(LST/24); // LST in hours
    var LST_rad = LST*Math.PI/12; // LST in radian
    var LSTr = LST + 0.5/3600; // used for rounding
    var LSTH = Math.floor(LSTr).toString();
    var LSTM = Math.floor(60*(LSTr-LSTH)).toString();
    var LSTS = Math.floor(3600*(LSTr-LSTH-LSTM/60)).toString();
    if (LSTH.length < 2) { LSTH = "0"+LSTH;}
    if (LSTM.length < 2) { LSTM = "0"+LSTM;}
    if (LSTS.length < 2) { LSTS = "0"+LSTS;}
    var LST_string = LSTH+":"+LSTM+":"+LSTS;
    return {hour:LST, rad:LST_rad, string:LST_string};
}

// Generate star charts at a given times (specified by the 
//  time variables date1, date2) and places (specified by the 
// longitudes and latitudes)
function starChart() {
    var d1String = date1.dateString+"&nbsp;&nbsp;"+date1.timeString+"  GMT"+tz1.tzString;
    var d2String = date2.dateString+"&nbsp;&nbsp;"+date2.timeString+" GMT"+tz2.tzString;

    // Output location 1 information
    $("#place1").text(place1);
    $("#long1").html(long1+"&deg;");
    $("#lat1").html(lat1+"&deg;");
    $("#time1").html(d1String);
    $("#siderealTime1").text(date1.LSTstring);
    
    // Output location 2 information
    $("#place2").text(place2);
    $("#long2").html(long2+"&deg;");
    $("#lat2").html(lat2+"&deg;");
    $("#time2").html(d2String);
    $("#siderealTime2").text(date2.LSTstring);
    
    // Set up paramaters for drawing stars and planets
    var pDraw = setupDrawingParameters();
        
    // Generate star charts for the two locations
    starChartLoc(1);
    starChartLoc(2);
    
    // Legend
    addLegend(pDraw);
}

// Standalone function to draw a star chart at one location 
// indicated by the input parameter loc
function starChartLoc(loc) {
    var d,lat,T0;
    if (loc==1) {
        d=date1; lat=lat1;
    } else {
        d=date2; lat=lat2;
    }
    var lat_rad = lat*Math.PI/180;
    var locStr = loc.toString();
    var Canvas = document.getElementById('loc'+locStr);
    if (Math.abs(d.yyyy) > 3000 && $("#warning"+locStr).text()=="") {
        $("#warning"+locStr).append('<p style="color:red;">Warning: Positions of the Sun, Moon and planets are not accurate at this time.</p>');
    }
    if (Math.abs(d.yyyy) < 3000 && $("#warning"+locStr).text() != "") {
        $("#warning"+locStr).empty();
    }
    var T = d.T, TD = d.T+d.dT;
    // Set up paramaters for drawing stars and planets
    var pDraw = setupDrawingParameters();
    pDraw.loc = loc;
    var objects = {milky:{}};
    pDraw.showPlanets = $("#showPlanets"+locStr).hasClass("active");
    pDraw.showEquator = $("#showEquator"+locStr).hasClass("active");
    pDraw.showEcliptic = $("#showEcliptic"+locStr).hasClass("active");
    pDraw.showMilkyWay = $("#showMilkyWay"+locStr).hasClass("active");
    pDraw.showConLines = $("#showConLines"+locStr).hasClass("active");
    pDraw.showConLab = $("#showConLab"+locStr).hasClass("active");
    pDraw.showDayNight = $("#showDayNight"+locStr).hasClass("active");
    if (pDraw.showEcliptic) {
        if (Math.abs(TD) < 1) {
            pDraw.eclipticNorthPoleDec = 1.16170371649804;
        } else {
            pDraw.eclipticNorthPoleDec = 0.5*Math.PI - epsA(TD);
        }
    }
    if (pDraw.showMilkyWay) {
        objects.milky.north = milkyLoc[loc-1].northernEdge;
        objects.milky.south = milkyLoc[loc-1].southernEdge;
        objects.milky.betaCas = milkyLoc[loc-1].betaCas;
        objects.milky.thetaOph = milkyLoc[loc-1].thetaOph;
        objects.milky.lambdaSco = milkyLoc[loc-1].lambdaSco;
        objects.milky.coalsack = milkyLoc[loc-1].coalsack;
        T0 = objects.milky.north[0].Tepoch;
        if (Math.abs(TD-T0) > 0.1) { 
            milkyWayBoundaryPrecession(objects.milky,T0,TD);
        }
        var raDec = galacticNorthPole(TD);
        pDraw.galPoleRa = raDec.ra;
        pDraw.galPoleDec = raDec.dec;
    }
    
    objects.conLines = constellationLines();
    
    if (pDraw.showConLab) {
        objects.conLab = conLabelLoc[loc-1];
        T0 = objects.conLab[0].Tepoch;
        if (Math.abs(TD-T0) > 0.1) {
            var p = precession_matrix(T0,TD-T0);
            addPrecession(objects.conLab,p,TD);
            // Add additional precession when there are 
            // more than one location for the constellation labels
            for (var i=1; i<objects.conLab.length; i++) {
                if ("ra2" in objects.conLab[i]) {
                    var precessed = precessed_ra_dec(objects.conLab[i].ra2, 
                                    objects.conLab[i].dec2, p);
                    objects.conLab[i].ra2 = precessed.ra;
                    objects.conLab[i].dec2 = precessed.dec;
                }
            }
        }
    }
    // Load star data
    objects.stars = starsLoc[loc-1];

   // generate star chart
    T0 = objects.stars[0].Tepoch;
    if (Math.abs(TD-T0) > 0.1) {
        // correct for proper motion and precession
        recomputeStarPos(TD,objects.stars);
     }
    // position of the Sun, Moon and Planets
    // calculate Delta T: 
    if (pDraw.showPlanets) {
        objects.planets = sunMoonPlanets(TD);
    } else {
        // still need to calculate the position of the Sun 
        // in order to set the sky color based on the Sun's 
        // altitude
        objects.planets = [];
        objects.planets[0] = MiniSun(TD);
        
    }
    drawStarsPlanets(Canvas,objects,pDraw,d.LST_rad,lat_rad);
}

function drawStarsPlanets(Canvas, objects,pDraw,LST,lat) {
    // set up canvas
    var Ctx = Canvas.getContext('2d');
    Ctx.clearRect(0, 0, Canvas.width, Canvas.height);
    
    var cosLat = Math.cos(lat), sinLat = Math.sin(lat);
    var halfPI = 0.5*Math.PI;
    var twoPI = 2*Math.PI;
    
   // Draw circle on canvas
   var r = 0.47*Math.max(Canvas.width, Canvas.height);
   var xc = 0.5*Canvas.width;
   var yc = 0.5*Canvas.height;
    
   // Calculate the altitude of the Sun (in degrees)
   var raDec = {ra:objects.planets[0].ra, dec:objects.planets[0].dec};
   var hor = ra_dec_to_alt_az(raDec, LST, cosLat,sinLat);
   var altSun = hor.alt*180/Math.PI;
    
   Ctx.beginPath();
   Ctx.setLineDash([]);
   Ctx.arc(xc, yc,r,0,2*Math.PI);
   // Determine the background color depending on the 
   // altitude of the Sun: black if the altSun < -18 deg, 
   // light blue if altSun > 0, gray otherwise
   var b = 255, b1 = 255;
   if (pDraw.showDayNight) {
       b = Math.round(255*(1 + altSun/18));
       b = Math.min(b,255);
       b = Math.max(0,b);
       b1 = Math.round(b*0.95);
   }
   Ctx.fillStyle = "rgb("+b1+","+b1+","+b+")";
   Ctx.fill();
   Ctx.strokeStyle = "black";
   Ctx.stroke();
   // Indicate the 4 cardinal directions
   Ctx.font="20px Arial";
   Ctx.fillStyle = "black";
   Ctx.fillText("N", xc-5, 15);
   Ctx.fillText("S", xc-5, Canvas.height);
   Ctx.fillText("E", 0, yc+5);
   Ctx.fillText("W", Canvas.width-18, yc+5);
    
   // Canvas parameters
   var gpara = {halfPI:halfPI, xc:xc, yc:yc, r:r, r2:r*r, 
                altSun:altSun};
    
   drawAzimuthLabels(Ctx,gpara);
    
   // Draw the equator, ecliptic and galactic equator
   var pole;
   if (pDraw.showEquator) {
       // celestial north pole: dec = pi/2
       var eqColor = "black";
       if (b < 170) {eqColor = "yellow";}
       pole = {ra:0, dec:halfPI, 
               linestyle:[], color:eqColor};
       drawCircle(Ctx,LST,cosLat,sinLat,pole,gpara);
   }
   if (pDraw.showEcliptic) {
       // Ecliptic north pole: ra=-pi/2, dec = pi/2-epsilon
       var ecColor = "brown";
       if (b < 170) {ecColor="yellow";}
       pole = {ra:-0.5*Math.PI, dec:pDraw.eclipticNorthPoleDec, 
               linestyle:[10,15], color:ecColor};
       drawCircle(Ctx,LST,cosLat,sinLat,pole,gpara);
   }
    if (pDraw.showMilkyWay) {
     drawMilkyWay(Ctx,LST,objects.milky,cosLat,sinLat,gpara,pDraw);
        // Draw galactic equator
        pole = {ra:pDraw.galPoleRa, dec:pDraw.galPoleDec, 
               linestyle:[14,15], color:"magenta"};
        drawCircle(Ctx,LST,cosLat,sinLat,pole,gpara);
    }
    
    var newStar;
    if (pDraw.showConLines || tipsEnabled) {
        if (tipsEnabled) {
            newStar = new Array(objects.stars.length);
            newStar.fill(true);
            tips[pDraw.loc-1].length = 0;
        }
        drawConstellationLinesAndSetupTips(Ctx, objects.conLines, objects.stars, LST, cosLat,sinLat, gpara, pDraw, newStar);
    }
    
   var i,x,y,s;
   var coord;
    
   // Draw stars above the horizon
   var n = objects.stars.length; 
   if (b < 170) {
       Ctx.fillStyle = "white";
   } else {
       Ctx.fillStyle = "black";
   }
   for (i=1; i<n; i++) {
       if (objects.stars[i].mag > magLimit) {continue;}
       
       coord = ra_dec_to_xy_above(objects.stars[i], LST, 
                                  cosLat,sinLat, gpara);
       if (coord.x > -998) {
           s = pDraw.starMagA*objects.stars[i].mag + pDraw.starMagB;
           s = Math.max(s,1);
           Ctx.beginPath();
           Ctx.arc(coord.x, coord.y, s, 0, twoPI);
           Ctx.fill();
           
           // Add popup box object for stars with mag < 3
           if (tipsEnabled) {
               if (objects.stars[i].mag < magLimitTip && newStar[i]) {
                   newStar[i] = false;
                   s = Math.max(s,3);
                   tips[pDraw.loc-1].push({
                                x: coord.x,
                                y: coord.y,
                                r2: s*s,
                                object: "star",
                                starInd: i
                        });
               }
           }
       }
   }
    
   if (tipsEnabled) {
       newStar.length = 0;
   }
    
   // Sun, Moon and planets
   if(pDraw.showPlanets) {
       Ctx.font="20px Arial";
       for (i=0; i<9; i++) {
           raDec = {ra:objects.planets[i].ra, dec:objects.planets[i].dec};
           if (i==1) {
               // Convert geocentric coord. -> topocentric coord. 
               // to correct for diurnal parallax of the Moon.
               var topo = topoCentricEquatorial(objects.planets[i].rGeo,
                      raDec.ra,raDec.dec,LST,sinLat,cosLat);
               raDec = {ra:topo.raTopo, dec:topo.decTopo};
           }
           coord = ra_dec_to_xy_above(raDec, LST, cosLat,sinLat, gpara);
           if (coord.x > -998) {
              x = coord.x; y = coord.y;
              var pSymbol = String.fromCharCode(pDraw.code[i]);
              Ctx.fillStyle = pDraw.color[i];
              Ctx.fillText(pSymbol,
                           x+pDraw.offset[i].x, y+pDraw.offset[i].y);
              Ctx.beginPath();
              Ctx.arc(x, y, pDraw.size[i], 0, twoPI);
              Ctx.fill();
              // Add to tips (popup box) if necessary
              if (tipsEnabled) {
                  s = 0.5*Ctx.measureText(pSymbol).width;
                  s = Math.max(s, 10);
                  tips[pDraw.loc-1].push({
                                x: x+pDraw.offset[i].x+s,
                                y: y+pDraw.offset[i].y-10,
                                r2: s*s,
                                object: pDraw.pName[i],
                                pIndex: i
                            });
              }
           }
       }
   }
 
   // draw constellation labels    
   if (pDraw.showConLab) {
        drawConstellationLabel(Ctx, objects.conLab,LST,cosLat,sinLat, gpara, pDraw);
    }
}

function drawAzimuthLabels(Ctx,gpara) {
    // Note that in the drawing azimuth is measured 
    // from the north and increases towards east
    var dA = 10; // increament of azimuth in degrees
    var n = 360/dA; 
    var dArad = dA*Math.PI/180;
    Ctx.font="15px Arial";
    Ctx.txtAlign = "center";
    for (var i=1; i<n; i++) {
        var Adeg = i*dA;
        if (i*dA != 90 && i*dA != 90 && i*dA != 180 && i*dA != 270) {
            var A = i*dArad;
            var cosA = Math.cos(A), sinA = Math.sin(A);
            var x1 = gpara.xc - gpara.r*sinA;
            var y1 = gpara.yc - gpara.r*cosA;
            var x2 = gpara.xc - 1.02*gpara.r*sinA;
            var y2 = gpara.yc - 1.02*gpara.r*cosA;
            var x3,y3;
            if (Adeg < 90 || Adeg >270) {
                x3 = gpara.xc - 1.03*gpara.r*sinA;
                y3 = gpara.yc - 1.03*gpara.r*cosA;
            } else {
                x3 = gpara.xc - 1.06*gpara.r*sinA;
                y3 = gpara.yc - 1.06*gpara.r*cosA;
            }
            Ctx.beginPath();
            Ctx.moveTo(x1,y1);
            Ctx.lineTo(x2,y2);
            Ctx.stroke();
            var txt = Adeg.toString()+String.fromCharCode(176);
            Ctx.save();
            Ctx.translate(x3,y3);
            if (Adeg < 90 || Adeg >270) {
                Ctx.rotate(-A);
            } else {
                Ctx.rotate(Math.PI-A);
            }
            var w = Ctx.measureText(txt).width;
            Ctx.fillText(txt,-w*0.5,0);
            Ctx.restore();
        }
    }
    // Restore default
    Ctx.txtAlign = "start";
}

// RA, Dec -> alt and az
// using the formula on 
// https://en.wikipedia.org/wiki/Celestial_coordinate_system#Converting_coordinates
// Note that az is measured from South
// Here cosLat = cos(latitude) and sinLat = sin(latitude), 
// All angles must be in radians.
// raDec is an object with (at least) two properties: ra and dec (in radians)
// The function returns an object with the properties 
// alt (altitude in radians), sinA (sine azimuth) and cosA (cosine azimuth)
function ra_dec_to_alt_az(raDec, LST, cosLat,sinLat) {
    var HA = (LST - raDec.ra); // hour angle
    var cosHA = Math.cos(HA), sinHA = Math.sin(HA);
    var cosDec = Math.cos(raDec.dec), sinDec = Math.sin(raDec.dec);
    var alt = sinDec*sinLat + cosLat*cosDec*cosHA;
    alt = Math.asin(alt);
    var cosAlt = Math.cos(alt);
    var sA = cosDec*sinHA/cosAlt;
    var cA = (cosDec*cosHA*sinLat - sinDec*cosLat)/cosAlt;
    if (Math.abs(cosAlt) < 1e-10) {
        // the object is at the zeith
        sA = 0; cA = 1;
    }
    return {alt:alt, cosA:cA, sinA:sA};
}

// Correction for atmospheric refraction: alt -> alt + delta alt
// This function returns delta alt in radians given alt in radians.
// Use Saemundsson's formula for atmospheric refraction 
// see https://en.wikipedia.org/wiki/Atmospheric_refraction
// P is presure in kPa and T is temperature in Kelvin
function atmosphericRefraction(alt, P, T) {
    var frac = 2.80198*P/T;
    var x = alt + 0.003137559423803098/(alt + 0.08918632477691024);
    return 0.000296705972839036*frac/Math.tan(x);
}

// RA, Dec -> (x,y) on canvas
// Return (-999,-999) if the object is below the horizon 
function ra_dec_to_xy_above(raDec, LST, cosLat,sinLat, gpara) {
    var HA = (LST - raDec.ra); // hour angle
    var cosHA = Math.cos(HA), sinHA = Math.sin(HA);
    var cosDec = Math.cos(raDec.dec), sinDec = Math.sin(raDec.dec);
    var alt = sinDec*sinLat + cosLat*cosDec*cosHA;
    alt = Math.asin(alt);
    var cosAlt = Math.cos(alt);
    var sA = cosDec*sinHA/cosAlt;
    var cA = (cosDec*cosHA*sinLat - sinDec*cosLat)/cosAlt;
    if (Math.abs(cosAlt) < 1e-10) {
        // the object is at the zenith or nadir
        sA = 0; cA = 1;
    }
    
    // Correct for atmospheric refraction when alt > -1 degree
    // Assume P = 101kPa and T = 286K
    if (alt > -0.0175) {
        alt += atmosphericRefraction(alt,101,286);
    }
    
    var x,y;
    if (alt >= 0) {
        // stereographic projection
        var rc = gpara.r*Math.tan(0.5*(gpara.halfPI-alt));
        x = gpara.xc + rc*sA;
        y = gpara.yc + rc*cA;
    } else {
        x=-999; y=-999;
    }
    return {x:x, y:y};
}

// RA, Dec -> (x,y) on canvas
function ra_dec_to_xy(raDec, LST, cosLat,sinLat, gpara) {
    var HA = (LST - raDec.ra); // hour angle
    var cosHA = Math.cos(HA), sinHA = Math.sin(HA);
    var cosDec = Math.cos(raDec.dec), sinDec = Math.sin(raDec.dec);
    var alt = sinDec*sinLat + cosLat*cosDec*cosHA;
    alt = Math.asin(alt);
    var cosAlt = Math.cos(alt);
    var sA = cosDec*sinHA/cosAlt;
    var cA = (cosDec*cosHA*sinLat - sinDec*cosLat)/cosAlt;
    if (Math.abs(cosAlt) < 1e-10) {
        // the object is at the zenith or nadir
        sA = 0; cA = 1;
    }
    
    // Correct for atmospheric refraction when alt > -1 degree
    // Assume P = 101kPa and T = 286K
    if (alt > -0.0175) {
        alt += atmosphericRefraction(alt,101,286);
    }
    
    // stereographic projection
    var rc = gpara.r*Math.tan(0.5*(gpara.halfPI-alt));
    var x = gpara.xc + rc*sA;
    var y = gpara.yc + rc*cA;
    
    return {x:x, y:y};
}

//Geocentric Ra, Dec -> Topocentric RA, Dec
// Input parameters:
//  rGeo: geocentric distance of the object (in km),
//  ra, dec: geocentric ra and dec of the object ( in radians) 
//  LST: local sidereal time (in radian)
//  sinLat, cosLat: sine and cosine of the geodetic latitude
// Output: Topocentric dist. (in km), ra and dec (in radians)
// The conversion uses the formulas (7.30), (7.130)-(7.132) 
//  in Explanatory Supplement to the Astronomical Almanac.
// Assume the evlevation of the location is 0.
function topoCentricEquatorial(rGeo,ra,dec,LST,sinLat,cosLat) {
    // Geocentric Cartesian coordinates of the object
    var x = rGeo*Math.cos(ra)*Math.cos(dec);
    var y = rGeo*Math.sin(ra)*Math.cos(dec);
    var z = rGeo*Math.sin(dec);
    // Geometric Cartesian coordinates of the location
    var a = 6378.1366; // Earth's equatorial radius in km
    // (1-f)^2, where f = 1/298.25642 (see Eq. 7.130)
    var f1_f2 = 0.9933056020041341;
    var aC = a/Math.sqrt(cosLat*cosLat + f1_f2*sinLat*sinLat);
    var aS = f1_f2*aC;
    var xloc = aC*cosLat*Math.cos(LST);
    var yloc = aC*cosLat*Math.sin(LST);
    var zloc = aS*sinLat;
    // Topocentric Cartesian coordinates of the object
    var xtopo = x - xloc;
    var ytopo = y - yloc;
    var ztopo = z - zloc;
    // Topocentric Distance, Ra and Dec
    var rTopo = Math.sqrt(xtopo*xtopo + ytopo*ytopo + ztopo*ztopo);
    var raTopo = Math.atan2(ytopo,xtopo);
    var decTopo = Math.asin(ztopo/rTopo);
    
    return {rTopo:rTopo, raTopo:raTopo, decTopo:decTopo};
}

// Draw a great circle (above the horizon) that is perpendicular 
// to a point with a given ra and dec. (no correction for atm refraction)
// If the given point is the celestial north pole (or south pole), the circle 
// is the equator. If it is an ecliptic pole, the circle is the ecliptic. 
// If it is a galactic pole, the circle is a galactic equator.
// Ra and dec should be two properties of the var pole. 
// pole should also have two properties linestyle and color 
// specifying the line style and color of the line to be drawn.
function drawCircle(Ctx,LST,cosLat,sinLat,pole,gpara) {
    var drawCir = true;

    // Calculate P=(xp,yp,zp) of the point w.r.t. the horizontal 
    // coordinate system
    var xp,yp,zp, sinA,cosA;
    if (Math.abs(pole.dec - gpara.halfPI) < 1e-5) {
        // The point is the celestial north pole
        xp = -cosLat; yp = 0; zp = sinLat;
    } else {
        var HA = LST - pole.ra;
        var sinHA = Math.sin(HA), cosHA = Math.cos(HA);
        var sinDec = Math.sin(pole.dec), cosDec = Math.cos(pole.dec);
        var sinAlt = sinLat*sinDec + cosLat*cosDec*cosHA;
        var cosAlt;
        if (Math.abs(Math.abs(sinAlt)-1) < 1e-5) {
            // The point is at the zenith or nadir.
            // The circle is the entire horizon.
            // Do not draw the circle in this case
            drawCir = false;
        } else {
            cosAlt = Math.sqrt(1-sinAlt*sinAlt);
            sinA = cosDec*sinHA/cosAlt;
            cosA = (cosDec*cosHA*sinLat - sinDec*cosLat)/cosAlt;
            xp = cosAlt*cosA; yp = cosAlt*sinA; zp = sinAlt;
        }
    }
    if (drawCir) {
        // The cross product V = Z x P [Z = (0,0,1)] is perpendicular 
        // to both Z and P. So V is on the circle and horizon. 
        // Calculate the unit vector in the V direction
        var norm = Math.sqrt(xp*xp+yp*yp);
        var Vx = -yp/norm, Vy = xp/norm; // Vz = 0
        // Now calculate W = P x V. This point is also on the circle (since 
        // it's perpendicular to P) and is on the meridian (since 
        // it's perpendicular to V, which is on the horizon) and is above 
        // the horizon (since Z dot W is proportional to 1-(P dot Z)^2 > 0)
        // Note that Wz = xp*Vy - yp*Vx = norm > 0, so W is definitely 
        // above the horizon.
        var Wx = -zp*Vy, Wy = zp*Vx, Wz = norm;
        // The points on the circle are given by the equation 
        // C = cos(theta) V + sin(theta) W
        // The portion above the horizon is for theta in (0,pi).
        
        // Now draw the circle
        var n = 25; // number of points on the line = n+1
        var dtheta = Math.PI/n;
        Ctx.beginPath();
        Ctx.setLineDash(pole.linestyle);
        // Point V
        sinA = Vy; cosA = Vx;
        var x = gpara.xc + gpara.r*sinA, y = gpara.yc + gpara.r*cosA;
        Ctx.moveTo(x,y); 
        for (var i=1; i<n; i++) {
            var theta = i*dtheta;
            var cosTheta = Math.cos(theta), sinTheta = Math.sin(theta);
            var Cx = cosTheta*Vx + sinTheta*Wx;
            var Cy = cosTheta*Vy + sinTheta*Wy;
            var Cz = sinTheta*Wz;
            var pom = Math.sqrt(Cx*Cx + Cy*Cy);
            if (pom < 1e-5) {
                // The point is at the zenith
                Ctx.lineTo(gpara.xc,gpara.yc);
            } else {
                cosA = Cx/pom; sinA = Cy/pom; 
                var alt = Math.asin(Cz);
                var rc = gpara.r*Math.tan(0.5*(gpara.halfPI-alt));
                var x = gpara.xc + rc*sinA;
                var y = gpara.yc + rc*cosA;
                Ctx.lineTo(x,y);
            }
        }
        // Point -V
        sinA = -Vy; cosA = -Vx;
        x = gpara.xc + gpara.r*sinA; y = gpara.yc + gpara.r*cosA;
        Ctx.lineTo(x,y);
        Ctx.strokeStyle = pole.color;
        Ctx.stroke();
    }
}

// Precessed the ra and dec of the milky way boundary
function milkyWayBoundaryPrecession(milky,T0,T) {
    var p = precession_matrix(T0,T-T0);
    addPrecession(milky.north,p,T);
    addPrecession(milky.south,p,T);
    addPrecession(milky.betaCas,p);
    addPrecession(milky.thetaOph,p,T);
    addPrecession(milky.lambdaSco,p,T);
    addPrecession(milky.coalsack,p,T);
}

// Add precession to the ra and dec in array
// Note that the index starts at 1 not 0.
function addPrecession(array,p,T) {
    array[0].epoch = "";
    array[0].Tepoch = T;
    for (var i=1; i<array.length; i++) {
        var precessed = precessed_ra_dec(array[i].ra,
                                     array[i].dec,p);
        array[i].ra = precessed.ra;
        array[i].dec = precessed.dec;
    }
}

// Draw Milky Way boundary 
function drawMilkyWay(Ctx,LST,milky,cosLat,sinLat,gpara,pDraw) {
    if (pDraw.showDayNight && gpara.altSun < -6) {
        Ctx.strokeStyle = "yellow";
    } else {
        Ctx.strokeStyle = "blue";
    }
    Ctx.setLineDash([]);
    //Ctx.lineWidth=2;
    
    // Northern edge
    drawLineAboveHorizon(Ctx,LST,milky.north,cosLat,sinLat,gpara);
    // Southhern edge
    drawLineAboveHorizon(Ctx,LST,milky.south,cosLat,sinLat,gpara);
    // Others
    drawLineAboveHorizon(Ctx,LST,milky.betaCas,cosLat,sinLat,gpara);
    drawLineAboveHorizon(Ctx,LST,milky.thetaOph,cosLat,sinLat,gpara);
    drawLineAboveHorizon(Ctx,LST,milky.lambdaSco,cosLat,sinLat,gpara);
    drawLineAboveHorizon(Ctx,LST,milky.coalsack,cosLat,sinLat,gpara);
    
    // reset line width
    //Ctx.lineWidth=1;
}

// Connect the points in 'array' to a line. Only draw the points 
// above the horizon.
// Note that the first point starts at index 1 not 0.
function drawLineAboveHorizon(Ctx,LST,array,cosLat,sinLat,gpara) {
   var x1,y1,x2,y2;
   var raDec = {ra:array[1].ra, dec:array[1].dec};
   var coord = ra_dec_to_xy(raDec, LST, cosLat,sinLat, gpara);
   x2 = coord.x; y2 = coord.y;
   for (var i=2; i < array.length; i++) {
        x1 = x2; y1 = y2;
        raDec = {ra:array[i].ra, dec:array[i].dec};
        coord = ra_dec_to_xy(raDec, LST, cosLat,sinLat, gpara);
        x2 = coord.x; y2 = coord.y;
        addLine(Ctx,x1,y1,x2,y2,gpara);
    } 
}

// Ra and Dec of the galactic north pole relative to the equinox of the date
function galacticNorthPole(T) {
    // J2000: ra = 12h 51m 26.00s, dec = 27deg 7' 42.0"
    var ra0 = 3.366012906575397, dec0 = 0.4734787372451951;
    var p = precession_matrix(0,T);
    return(precessed_ra_dec(ra0,dec0,p));
}

// Draw constellation lines and/or set up tooltips
// The line information is stored in the object conLine. 
// It is an array that has the following structure:
// [
//          {name: "Bootes" , abbr: "Boo" ,  line1 :[ 938,979,1008,994,962,961,938,919 ] ,  line2 :[ 938,970 ] ,  line3 :[ 962,941,954,937,941 ] },
//          {name: "Leo" , abbr: "Leo" ,  line1 :[ 673,679,694,699,685,689,758,792,757,699 ] ,  line2 :[ 758,757 ] },
//          {name: "Orion" , abbr: "Ori" ,  line1 :[ 389,354,338,347,323,374,366,389,338,285,288,293,298 ] ,  line2 :[ 389,401,409,402,387,407,389 ] ,  line3 :[ 285,287,294,295 ] },
//          {name: "Auriga" , abbr: "Aur" ,  line1 :[ 324,395,396,324,296,339,397,396 ] ,  line2 :[ 324,303,311 ] ,  line3 :[ 303,304 ] }, ...
//       ]
// The object line1, line2, ... stores the indices of stars in the 
// array 'stars' that are used for the constellation lines.
function drawConstellationLinesAndSetupTips(Ctx, conLine, stars, 
                          LST, cosLat,sinLat, gpara, pDraw, 
                                             newStar) {
    Ctx.strokeStyle = "#1B9722";
    // Change line color depending on the background color 
    if (pDraw.showDayNight && gpara.altSun < -6) { Ctx.strokeStyle = "#93ff33";}
    Ctx.setLineDash([]);
    var ind,i,s,rad2;
    for (i=0; i<conLine.length; i++) {
        $.each(conLine[i], function(key, line) {
            if (key != "name" && key != "abbr") {
                var x1,x2,y1,y2;
                var raDec = {ra:stars[line[0]].ra, dec:stars[line[0]].dec};
                var coord = ra_dec_to_xy(raDec, LST, cosLat,sinLat, gpara);
                x2 = coord.x; y2 = coord.y;
                // Add tooltip point
                rad2 = (x2-gpara.xc)*(x2-gpara.xc) + 
                    (y2-gpara.yc)*(y2-gpara.yc);
                if (tipsEnabled && newStar[line[0]] && 
                   rad2 < gpara.r2) {
                    ind = line[0];
                    newStar[ind] = false;
                    s = pDraw.starMagA*stars[ind].mag + pDraw.starMagB;
                    s = Math.max(s,3);
                    tips[pDraw.loc-1].push({
                       x: x2,
                       y: y2,
                       r2: s*s,
                       object: "star",
                       starInd: ind
                    });
                }
                for (var j=1; j<line.length; j++) {
                    x1=x2; y1=y2;
                    raDec = {ra:stars[line[j]].ra, dec:stars[line[j]].dec};
                    coord = ra_dec_to_xy(raDec, LST, cosLat,sinLat, gpara);
                    x2 = coord.x; y2 = coord.y;
                    if (pDraw.showConLines) {
                        addLine(Ctx,x1,y1,x2,y2,gpara);
                    } 
                    // Add tooltip point
                    rad2 = (x2-gpara.xc)*(x2-gpara.xc) + 
                    (y2-gpara.yc)*(y2-gpara.yc);
                    if (tipsEnabled && newStar[line[j]] && 
                       rad2 < gpara.r2) {
                            ind = line[j];
                            newStar[ind] = false;
                            s = pDraw.starMagA*stars[ind].mag + pDraw.starMagB;
                            s = Math.max(s,3);
                            tips[pDraw.loc-1].push({
                                x: x2,
                                y: y2,
                                r2: s*s,
                                object: "star",
                                starInd: ind
                            });
                    }
                }
            }
         });
    }
}

function drawConstellationLabel(Ctx, conLab,LST, cosLat,sinLat, gpara, pDraw) {
    var fontSize = 12;
    Ctx.font = fontSize.toString()+"px Arial";
    // Blackground and text color based on the altitude of the Sun
    var b = 255, b1 = 255;
    if (pDraw.showDayNight) {
        b = Math.round(255*(1 + gpara.altSun/18));
        b = Math.min(b,255);
        b = Math.max(0,b);
        b1 = Math.round(b*0.95);
    }
    var textColor = "orange";
    if (b > 130) {textColor = "#6c3483";}
    var bgColor = "rgb("+b1+","+b1+","+b+")";
    for (var i=1; i<conLab.length; i++) {
        var raDec = {ra:conLab[i].ra, dec:conLab[i].dec};
        var coord = ra_dec_to_xy_above(raDec, LST, cosLat,sinLat, gpara);
        if (coord.x > -998) {
            var w = Ctx.measureText(conLab[i].abbr).width;
            Ctx.fillStyle = bgColor;
            Ctx.fillRect(coord.x,coord.y-fontSize,w,fontSize);
            Ctx.fillStyle = textColor;
            Ctx.fillText(conLab[i].abbr, coord.x,coord.y);
        }
        
        if ("ra2" in conLab[i]) {
            // add label to the second position
            raDec = {ra:conLab[i].ra2, dec:conLab[i].dec2};
            coord = ra_dec_to_xy_above(raDec, LST, cosLat,sinLat, gpara);
            if (coord.x > -998) {
                Ctx.fillStyle = bgColor;
                Ctx.fillRect(coord.x,coord.y-fontSize,w,fontSize);
                Ctx.fillStyle = textColor;
                Ctx.fillText(conLab[i].abbr, coord.x,coord.y);
            }
        }
    }
}

// Recompute stars' positions by adding proper motion and precession to epoch T
function recomputeStarPos(T,stars) {
    var T0 = stars[0].Tepoch;
    var dcen = T-T0; //number of centuries between T and T0
    stars[0].epoch = "";
    stars[0].Tepoch = T;
    var p = precession_matrix(T0,dcen);
    for (var i=1; i<stars.length; i++) {
        // add proper motion
        var x = stars[i].x + stars[i].vx*dcen;
        var y = stars[i].y + stars[i].vy*dcen;
        var z = stars[i].z + stars[i].vz*dcen;
        var r = Math.sqrt(x*x+y*y+z*z);
        // Modify star's magnitude based on the new distance
        if (stars[i].dist2000 < 9.9e4) {
            stars[i].mag = stars[i].mag2000 + 5*Math.LOG10E*Math.log(r/stars[i].dist2000);
        }
        // precession
        stars[i].x = p.p11*x + p.p12*y + p.p13*z;
        stars[i].y = p.p21*x + p.p22*y + p.p23*z;
        stars[i].z = p.p31*x + p.p32*y + p.p33*z;
        var vx = stars[i].vx, vy = stars[i].vy, vz = stars[i].vz;
        stars[i].vx = p.p11*vx + p.p12*vy + p.p13*vz;
        stars[i].vy = p.p21*vx + p.p22*vy + p.p23*vz;
        stars[i].vz = p.p31*vx + p.p32*vy + p.p33*vz;
        stars[i].ra = Math.atan2(stars[i].y, stars[i].x);
        stars[i].dec = Math.asin(stars[i].z/r);
    }
}

// Plot a line from graph position (x1,y1) to (x2,y2); only plot the 
// portion above the horizon. The gpara parameter is an object contains 
// the information necessary to determine if a point is above the horizon.
// gpara.xc, gpara.yc: position of the zenith, 
// gpara.r2: square distance of the horizon from the zenith on the graph.
// A pioint (x,y) is above the horizon if 
// (x-gpara.xc)^2+(y-gpara.yc)^2 < gpara.r2
function addLine(Ctx,x1,y1,x2,y2,gpara) {
   var SQR = function(x) {return x*x;}

    var r1sq = SQR(x1-gpara.xc) + SQR(y1-gpara.yc);
    var r2sq = SQR(x2-gpara.xc) + SQR(y2-gpara.yc);
    
    if (r1sq > gpara.r2 && r2sq > gpara.r2) {
        // Both points are below the horizon. Don't plot anything.
        return;
    }
    
    var x1p=x1, x2p=x2, y1p=y1, y2p=y2;
    if (r1sq > gpara.r2 || r2sq > gpara.r2) {
        // Conside a vector R(s) = R1 + s (R2-R1). 
        // Here R1 is the position vector of (x1,y1), 
        //      R2 is the position vector of (x2,y2).
        // Find s between 0 and 1 such that |R(s)|^2 = gpara.r2
        // Need to solve a quadratic equation.
        var R1dotR2 = (x1-gpara.xc)*(x2-gpara.xc) + (y1-gpara.yc)*(y2-gpara.yc);
        var dR1R2sq = SQR(x1-x2) + SQR(y1-y2);
        var q = r1sq - R1dotR2;
        var s,q;
        if (r1sq <= gpara.r2) {
            s = ( q + Math.sqrt(q*q + dR1R2sq*(gpara.r2-r1sq)) )/dR1R2sq;
            x2p = x1 + s*(x2-x1); y2p = y1 + s*(y2-y1);
        } else {
            s = ( q - Math.sqrt(q*q + dR1R2sq*(gpara.r2-r1sq)) )/dR1R2sq;
            x1p = x1 + s*(x2-x1); y1p = y1 + s*(y2-y1);
        }
    }
    
    // Now plot the line from (x1p,y1p) to (x2p,y2p)
    Ctx.beginPath();
    Ctx.moveTo(x1p,y1p);
    Ctx.lineTo(x2p,y2p);
    Ctx.stroke();
}

// Add legend to the legend canvas
function addLegend(pDraw) {
    var Canvas = document.getElementById('legend');
    var Ctx = Canvas.getContext('2d');
    Ctx.clearRect(0, 0, Canvas.width, Canvas.height);
    // magnitude scale
    Ctx.font="20px Arial";
    Ctx.fillStyle = "black";
    Ctx.fillText("Magnitude scale:",0,20);
    var m,s,x,y;
    var twoPI = 2*Math.PI;
    for (m=-1; m<6; m++) {
        s = pDraw.starMagA*m + pDraw.starMagB;
        x = 180+(m+1)*40;
        var dx = -20;
        if (m==-1) {dx=-22;}
        Ctx.fillText(m.toString(),x+dx,20);
        Ctx.beginPath();
        Ctx.arc(x, 15, s, 0, twoPI);
        Ctx.fill();
    }
    // planet symbols
    Ctx.fillText("Planet symbols:   Sun",0,50);
    Ctx.fillText("Moon",270,50);
    Ctx.fillText("Mercury",380,50);
    Ctx.fillText("Venus",160,75);
    Ctx.fillText("Mars",270,75);
    Ctx.fillText("Jupiter",380,75);
    Ctx.fillText("Saturn",160,100);
    Ctx.fillText("Uranus",270,100);
    Ctx.fillText("Neptune",380,100);
    Ctx.fillStyle = pDraw.color[0];
    x = 195; y=50; 
    Ctx.fillText(String.fromCharCode(pDraw.code[0]),x,y);
    Ctx.beginPath();
    Ctx.arc(x-pDraw.offset[0].x, y-pDraw.offset[0].y, 
            pDraw.size[0], 0, twoPI);
    Ctx.fill();
    Ctx.fillStyle = pDraw.color[1];
    x = 320;
    Ctx.fillText(String.fromCharCode(pDraw.code[1]),x,y);
    Ctx.beginPath();
    Ctx.arc(x-pDraw.offset[1].x, y-pDraw.offset[1].y, 
            pDraw.size[1], 0, twoPI);
    Ctx.fill();
    Ctx.fillStyle = pDraw.color[2];
    x = 455;
    Ctx.fillText(String.fromCharCode(pDraw.code[2]),x,y);
    Ctx.beginPath();
    Ctx.arc(x-pDraw.offset[2].x, y-pDraw.offset[2].y, 
            pDraw.size[2], 0, twoPI);
    Ctx.fill();
    Ctx.fillStyle = pDraw.color[3];
    x = 220; y = 75;
    Ctx.fillText(String.fromCharCode(pDraw.code[3]),x,y);
    Ctx.beginPath();
    Ctx.arc(x-pDraw.offset[3].x, y-pDraw.offset[3].y, 
            pDraw.size[3], 0, twoPI);
    Ctx.fill();
    Ctx.fillStyle = pDraw.color[4];
    x = 320;
    Ctx.fillText(String.fromCharCode(pDraw.code[4]),x,y);
    Ctx.beginPath();
    Ctx.arc(x-pDraw.offset[4].x, y-pDraw.offset[4].y, 
            pDraw.size[4], 0, twoPI);
    Ctx.fill();
    Ctx.fillStyle = pDraw.color[5];
    x = 445;
    Ctx.fillText(String.fromCharCode(pDraw.code[5]),x,y);
    Ctx.beginPath();
    Ctx.arc(x-pDraw.offset[5].x, y-pDraw.offset[5].y, 
            pDraw.size[5], 0, twoPI);
    Ctx.fill();
    Ctx.fillStyle = pDraw.color[6];
    x = 225; y=100;
    Ctx.fillText(String.fromCharCode(pDraw.code[6]),x,y);
    Ctx.beginPath();
    Ctx.arc(x-pDraw.offset[6].x, y-pDraw.offset[6].y, 
            pDraw.size[6], 0, twoPI);
    Ctx.fill();
    Ctx.fillStyle = pDraw.color[7];
    x = 335; 
    Ctx.fillText(String.fromCharCode(pDraw.code[7]),x,y);
    Ctx.beginPath();
    Ctx.arc(x-pDraw.offset[7].x, y-pDraw.offset[7].y, 
            pDraw.size[7], 0, twoPI);
    Ctx.fill();
    Ctx.fillStyle = pDraw.color[8];
    x = 460; 
    Ctx.fillText(String.fromCharCode(pDraw.code[8]),x,y);
    Ctx.beginPath();
    Ctx.arc(x-pDraw.offset[8].x, y-pDraw.offset[8].y, 
            pDraw.size[8], 0, twoPI);
    Ctx.fill();
}

// Display tooltip (actually a popup box) on mouse click
function displayPopup(e, loc) {
    var canvas = document.getElementById('loc'+loc);
    var rect = canvas.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    var hit = false;
    var i, tip;
    for (i=0; i < tips[loc-1].length; i++) {
        tip = tips[loc-1][i];
        var dx = x - tip.x;
        var dy = y - tip.y;
        if (dx*dx + dy*dy < tip.r2) {
            hit = true;
            break;
        }
    }
    if (hit) {
        var tipId = "#tip"+loc;
        var tipText = tipId+"text";
        $(tipText).empty();
        // set up pararameters to be passed to the functions 
        // that displays the popup...
        // Sidereal times, latitude
        var d,long,lat;
        if (loc==1) {
            d = date1;
            long = long1;
            lat = lat1*Math.PI/180;
        } else {
            d = date2;
            long = long2;
            lat = lat2*Math.PI/180;
        }
        var hours = d.h + d.m/60 + d.s/3600;
        // sidereal time at midnight local time; used to compute
        // rise and set times
        var LST0 = d.LST_rad - 1.00273781191135448*hours*Math.PI/12;
        LST0 -= 2*Math.PI*Math.floor(LST0*0.5/Math.PI);
        var para = {loc:loc, lat:lat, LST:d.LST_rad, LST0:LST0, 
                   T:d.T, dT:d.dT, hours:hours};
        // Nutation (only calculate when -50 < TD < 10)
        var TD = d.T+d.dT;
        if (TD > -50 && TD < 10) {
            para.nu = nutation(TD);
            para.LAST = para.LST + para.nu.Ee;
        }
        
        if (tip.object=="star") {
            displayPopupStar(tip,para);
        } else if (tip.object=="Sun") {
            displayPopupSun(tip,para);
        } else if (tip.object=="Moon") {
            displayPopupMoon(tip,para);
        } else {
            displayPopupPlanet(tip,para);
        }
        
        $(tipId).css("left", (tip.x+3)+"px");
        $(tipId).css("top", (tip.y+3)+"px");
        $(tipId).show();
    }
}

// Close popup
function closePopup(idn) {
    var id = "#"+idn;
    $(id).hide();
    $(id+"text").empty();
    $(id).css("left","-200px");
}

// Display popup box for the Sun
function displayPopupSun(tip,para) {
    var sun;
    var calculate = [false,false,true,false,false,false,false,false];
    var TD = para.T+para.dT;
    if (highPrecCalInTips) {
        sun = planetGeoVSOP(TD, "Sun", false);
    } else {
        sun = planetPos(TD, calculate)[2];
    }
    // ra and dec wrt J2000
    var rad_to_deg = 180/Math.PI, rad_to_hr = 12/Math.PI;
    var ra2000 = convertDM(sun.ra2000*rad_to_hr, "hm");
    var dec2000 = convertDM(sun.dec2000*rad_to_deg, "dm");
    // Topocentric Ra and Dec
    var cosLat = Math.cos(para.lat);
    var sinLat = Math.sin(para.lat);
    var raDec, topo;
    var LST = para.LST;
    if ("nu" in para) {
        LST = para.LAST;
        raDec = precessed_ra_dec(sun.ra, sun.dec, para.nu);
        sun.ra = raDec.ra; sun.dec = raDec.dec;
        topo = topoCentricEquatorial(sun.rGeo*149597870.7, 
                                     sun.ra,sun.dec,
                                     LST,sinLat,cosLat);
    } else {
        topo = topoCentricEquatorial(sun.rGeo*149597870.7, 
                                     sun.ra,sun.dec,
                                     LST,sinLat,cosLat);
    }
    // Correct for aberration of light
    var aber = {ra:topo.raTopo, dec:topo.decTopo};
    if ("nu" in para) {
        var aberpara = {T:TD, m:para.nu, LAST:para.LAST, 
                        cosLat:cosLat, sinLat:sinLat};
        aber = aberration(topo.raTopo, topo.decTopo, aberpara);
    }
    var raTopo = convertDM(aber.ra*rad_to_hr, "hm");
    var decTopo = convertDM(aber.dec*rad_to_deg, "dm");
    var p = precession_matrix(TD,-TD);
    if ("nu" in para) {
        // Remove nutation from the topocentric position first
        var inv_nu = {p11:para.nu.p11, p12:para.nu.p21, 
                      p13:para.nu.p31, p21:para.nu.p12, 
                      p22:para.nu.p22, p23:para.nu.p32, 
                      p31:para.nu.p13, p32:para.nu.p23, 
                      p33:para.nu.p33};
        raDec = precessed_ra_dec(topo.raTopo,topo.decTopo,inv_nu);
        // Now precessed to J2000.0
        raDec = precessed_ra_dec(raDec.ra,raDec.dec,p);
    } else {
        raDec = precessed_ra_dec(topo.raTopo,topo.decTopo,p);
    }
    var ra2000Topo = convertDM(raDec.ra*rad_to_hr, "hm");
    var dec2000Topo = convertDM(raDec.dec*rad_to_deg, "dm");
    // Angular diameter at 1 AU (arcmin)
    var ang1AU = 31.965; 
    var ang = ang1AU / sun.rGeo;
    // Alt and Azimuth
    raDec = {ra:aber.ra, dec:aber.dec};
    var hor = ra_dec_to_alt_az(raDec, LST, cosLat,sinLat);
    var alt = (hor.alt + atmosphericRefraction(hor.alt, 101, 286))*rad_to_deg;
    var azi = Math.atan2(hor.sinA,hor.cosA)*rad_to_deg + 180;
    alt = alt.toFixed(2)+"&deg;";  azi = azi.toFixed(2)+"&deg;";
    // rise, set and transit
    var T0 = TD - para.hours/876600;
    var ra = [], dec = [];
    for (var i=0; i<25; i++) {
        sun = planetPos(T0+i/876600,calculate)[2];
        ra[i] = sun.ra; dec[i] = sun.dec;
    }
    var tt = getTransitTime(para.LST0,para.lat,ra,dec, false);
    var Transit = tt.t+' ('+tt.alt+')';
    var alt1 = -0.01454441043328608; // -50' in radians
    var trs = getRiseSet(alt1,para.LST0,para.lat,ra,dec);
    var RiseSet = trs.rise+" ("+trs.azRise+"), "+trs.set;
    if (trs.rise=="above") {
        RiseSet = "circumpolar";
    }
    //Twilights
    alt1 = -0.1047197551196598; // -6 deg in rad
    trs = getRiseSet(alt1,para.LST0,para.lat,ra,dec);
    var civ = trs.rise+', '+trs.set;
    if (trs.rise=="above") {
        civ = "above -6&deg;";
    }
    alt1 = -0.2094395102393196; // -12 deg in rad
    trs = getRiseSet(alt1,para.LST0,para.lat,ra,dec);
    var nat = trs.rise+', '+trs.set;
    if (trs.rise=="above") {
        nat = "above -12&deg;";
    }
    alt1 = -0.3141592653589793; // -18 deg in rad
    trs = getRiseSet(alt1,para.LST0,para.lat,ra,dec);
    var ast = trs.rise+', '+trs.set;
    if (trs.rise=="above") {
        ast = "above -18&deg;";
    }
    
    var txt ="<table>";
    txt += '<tr><th colspan="2">Sun</th></tr>';
    txt += '<tr><td>Distance</td> <td>'+sun.rGeo.toFixed(3)+' AU</td></tr>';
    txt += '<tr><td>Angular Diameter</td> <td>'+ang.toFixed(1)+
        "'</td></tr>";
    txt += '<tr><td>Geocentric Ra, Dec (J2000)</td> <td>'+ra2000+', '+dec2000+'</td></tr>';
    txt += '<tr><td>Topocentric Ra, Dec (J2000)</td> <td>'+ra2000Topo+', '+dec2000Topo+'</td></tr>';
    if ("nu" in para) {
        txt += '<tr><td>App. Topo. Ra, Dec (of date)</td> <td>'+raTopo+', '+decTopo+'</td></tr>';
        txt += '<tr><td>Apparent Sidereal Time</td> <td>'+convertDM(para.LAST*12/Math.PI,"hm")+'</td></tr>';
    } else {
        txt += '<tr><td>Topocentric Ra, Dec (of date)</td> <td>'+raTopo+', '+decTopo+'</td></tr>';
    }
    txt += '<tr><td>Altitude, Azimuth</td> <td>'+alt+', '+azi+'</td></tr>';
    txt += '<tr><td>Rise (Azi), Set</td> <td>'+RiseSet+'</td></tr>';
    txt += '<tr><td>Upper Transit (Altitude)</td> <td>'+Transit+'</td></tr>';
    txt += '<tr><td>Civ. Twi. beg., end</td> <td>'+civ+'</td></tr>';
    txt += '<tr><td>Nat. Twi. beg., end</td> <td>'+nat+'</td></tr>';
    txt += '<tr><td>Ast. Twi. beg., end</td> <td>'+ast+'</td></tr>';
    
    var tipText = "#tip"+para.loc+"text";
    $(tipText).append(txt);
}

// Display popup box for the Moon
function displayPopupMoon(tip,para) {
    var moon,sun, Dmoon, Lmoon, Lsun;
    var TD = para.T+para.dT;
    if (highPrecCalInTips) {
        moon = MoonPosElpMpp02(TD, true);
        Dmoon = moon.rGeo;
        var calculate = [false,false,true,false,false,false,false,false];
        sun = planetPos(TD, calculate)[2];
        Lsun = sun.lam2000;
        Lmoon = moon.lam2000;
    } else {
        moon = MediumMoon(TD);
        sun = MiniSun(TD);
        Lsun = sun.lam;
        Lmoon = moon.lam;
        Dmoon = moon.rGeo;
    }
    var rad_to_deg = 180/Math.PI, rad_to_hr = 12/Math.PI;
    var cosLat = Math.cos(para.lat);
    var sinLat = Math.sin(para.lat);
    // Geocentric ra and dec 
    var geoRa2000 = convertDM(moon.ra2000*rad_to_hr, "hm");
    var geoDec2000 = convertDM(moon.dec2000*rad_to_deg, "dm");
    // Geocentric -> Topocentric
    var raDec, topo;
    var LST = para.LST;
    if ("nu" in para) {
        LST = para.LAST;
        raDec = precessed_ra_dec(moon.ra, moon.dec, para.nu);
        moon.ra = raDec.ra; moon.dec = raDec.dec;
        topo = topoCentricEquatorial(moon.rGeo, 
                                     moon.ra,moon.dec,
                                     LST,sinLat,cosLat);
    } else {
        topo = topoCentricEquatorial(moon.rGeo, 
                                moon.ra,moon.dec, 
                                para.LST,sinLat,cosLat);
    }
    // Correct for aberration of light
    var aber = {ra:topo.raTopo, dec:topo.decTopo};
    if ("nu" in para) {
        var aberpara = {T:TD, m:para.nu, LAST:para.LAST, 
                        cosLat:cosLat, sinLat:sinLat};
        aber = aberration(topo.raTopo, topo.decTopo, aberpara);
    }
    var topoRa = convertDM(aber.ra*rad_to_hr, "hm");
    var topoDec = convertDM(aber.dec*rad_to_deg, "dm");
    var rTopo = topo.rTopo;
    // topocentric ra and dec wrt J2000
    var p = precession_matrix(TD,-TD);
    if ("nu" in para) {
        // Remove nutation from the topocentric position first
        var inv_nu = {p11:para.nu.p11, p12:para.nu.p21, 
                      p13:para.nu.p31, p21:para.nu.p12, 
                      p22:para.nu.p22, p23:para.nu.p32, 
                      p31:para.nu.p13, p32:para.nu.p23, 
                      p33:para.nu.p33};
        raDec = precessed_ra_dec(topo.raTopo,topo.decTopo,inv_nu);
        // Now precessed to J2000.0
        raDec = precessed_ra_dec(raDec.ra,raDec.dec,p);
    } else {
        raDec = precessed_ra_dec(topo.raTopo,topo.decTopo,p);
    }
    var topoRa2000 = convertDM(raDec.ra*rad_to_hr,"hm");
    var topoDec2000 = convertDM(raDec.dec*rad_to_deg,"dm"); 
    // Alt and Azimuth
    raDec = {ra:aber.ra, dec:aber.dec};
    var hor = ra_dec_to_alt_az(raDec, LST, cosLat,sinLat);
    // add atm refraction
    var alt = (hor.alt + atmosphericRefraction(hor.alt, 101, 286))*rad_to_deg;
    var azi = Math.atan2(hor.sinA,hor.cosA)*rad_to_deg + 180;
    alt = alt.toFixed(2)+"&deg;";  azi = azi.toFixed(2)+"&deg;";
    // illumination, phase and apparent magnitude
    var illumPhase = moonIlluminated(sun.ra,sun.dec,topo.raTopo,topo.decTopo, 
                                     Lsun,Lmoon, rTopo);
    var illum = illumPhase.illuminated.toFixed(2);
    var phase = illumPhase.phase;
    var elong = illumPhase.elongTxt;
    var mag = illumPhase.mag.toFixed(1);
    // rise, transit and set
    var T0 = TD - para.hours/876600;
    var ra = [], dec = [];
    for (var i=0; i<25; i++) {
        moon = MediumMoon(T0 + i/876600);
        ra[i] = moon.ra; dec[i] = moon.dec;
    }
    var tt = getTransitTime(para.LST0,para.lat,ra,dec, true);
    var Transit = tt.t+' ('+tt.alt+')';
    var alt1 = 0.002327105669325773; // 8' in radians
    var trs = getRiseSet(alt1,para.LST0,para.lat,ra,dec);
    var Rise = trs.rise+" ("+trs.azRise+")";
    var Set = trs.set+" ("+trs.azSet+")";
    if (trs.rise=="above") {
        Rise = "circumpolar";
        Set = "circumpolar";
    }
    
    var txt ="<table>";
    txt += '<tr><th colspan="2">Moon</th></tr>';
    txt += '<tr><td>Geocentric Distance</td><td>'+
        Dmoon.toFixed(0)+' km ('+(Dmoon/6371).toFixed(1)+
        'R<sub>&oplus;</sub>)</td></tr>';
    txt += '<tr><td>Topocentric Distance</td><td>'+
        rTopo.toFixed(0)+' km ('+(rTopo/6371).toFixed(1)+
        'R<sub>&oplus;</sub>)</td></tr>';
    txt += '<tr><td>Angular Diameter</td> <td>'+
        (3475/rTopo*10800/Math.PI).toFixed(1)+"'</td></tr>";
    txt += '<tr><td>Phase</td> <td>'+phase+'</td></tr>';
    txt += '<tr><td>Illuminated</td> <td>'+illum+'</td> </tr>';
    txt += '<tr><td>Apparent Magnitude</td> <td>'+mag+'</td> </tr>';
    txt += '<tr><td>Solar Elongation</td> <td>'+elong+'</td> </tr>';
    txt += '<tr><td>Geocentric Ra, Dec (J2000)</td> <td>'+geoRa2000+', '+geoDec2000+'</td></tr>';
    txt += '<tr><td>Topocentric Ra, Dec (J2000)</td> <td>'+topoRa2000+', '+topoDec2000+'</td></tr>';
    if ("nu" in para) {
        txt += '<tr><td>App. Topo. Ra, Dec (of date)</td> <td>'+topoRa+', '+topoDec+'</td></tr>';
        txt += '<tr><td>Apparent Sidereal Time</td> <td>'+convertDM(para.LAST*12/Math.PI,"hm")+'</td></tr>';
    } else {
        txt += '<tr><td>Topocentric Ra, Dec (of date)</td> <td>'+topoRa+', '+topoDec+'</td></tr>';
    }
    txt += '<tr><td>Altitude, Azimuth</td> <td>'+alt+', '+azi+'</td></tr>';
    txt += '<tr><td>Rise (Azimuth)</td> <td>'+Rise+'</td></tr>';
    txt += '<tr><td>Upper Transit (Altitude)</td> <td>'+Transit+'</td></tr>';
    txt += '<tr><td>Set (Azimuth)</td> <td>'+Set+'</td></tr>';
    
    var tipText = "#tip"+para.loc+"text";
    $(tipText).append(txt);
}

// Display popup box for a planet
function displayPopupPlanet(tip,para) {
    var calculate = [false,false,true,false,false,false,false,false];
    var ind = tip.pIndex-1;
    if (tip.pIndex < 4) { ind--;}
    calculate[ind] = true;
    var TD = para.T+para.dT;
    var planet, sun;
    if (highPrecCalInTips) {
        planet = planetGeoVSOP(TD, tip.object, true);
        sun = {rGeo:planet.dSunEarth, 
               lam2000:planet.lamSun2000, 
               bet2000:planet.betSun2000};
    } else {
        var planets = planetPos(TD, calculate);
        planet = planets[ind];
        sun = planets[2];
    }
    var rHelio = planet.rHelio, rGeo = planet.rGeo;
    // ra and dec wrt J2000
    var rad_to_deg = 180/Math.PI, rad_to_hr = 12/Math.PI;
    var ra2000 = convertDM(planet.ra2000*rad_to_hr, "hm");
    var dec2000 = convertDM(planet.dec2000*rad_to_deg, "dm");
    // Topocentric Ra and Dec
    var cosLat = Math.cos(para.lat);
    var sinLat = Math.sin(para.lat);
    var raDec, topo;
    var LST = para.LST;
    if ("nu" in para) {
        LST = para.LAST;
        raDec = precessed_ra_dec(planet.ra, planet.dec, para.nu);
        planet.ra = raDec.ra; planet.dec = raDec.dec;
        topo = topoCentricEquatorial(rGeo*149597870.7, 
                                     planet.ra,planet.dec,
                                     LST,sinLat,cosLat);
    } else {
        topo = topoCentricEquatorial(rGeo*149597870.7,
                                     planet.ra,planet.dec,
                                     LST,sinLat,cosLat);
    }
    // Correct for aberration of light
    var aber = {ra:topo.raTopo, dec:topo.decTopo};
    if ("nu" in para) {
        var aberpara = {T:TD, m:para.nu, LAST:para.LAST, 
                        cosLat:cosLat, sinLat:sinLat};
        aber = aberration(topo.raTopo, topo.decTopo, aberpara);
    }
    var raTopo = convertDM(aber.ra*rad_to_hr, "hm");
    var decTopo = convertDM(aber.dec*rad_to_deg, "dm");
    var p = precession_matrix(TD,-TD);
    if ("nu" in para) {
        // Remove nutation from the topocentric position first
        var inv_nu = {p11:para.nu.p11, p12:para.nu.p21, 
                      p13:para.nu.p31, p21:para.nu.p12, 
                      p22:para.nu.p22, p23:para.nu.p32, 
                      p31:para.nu.p13, p32:para.nu.p23, 
                      p33:para.nu.p33};
        raDec = precessed_ra_dec(topo.raTopo,topo.decTopo,inv_nu);
        // Now precessed to J2000.0
        raDec = precessed_ra_dec(raDec.ra,raDec.dec,p);
    } else {
        raDec = precessed_ra_dec(topo.raTopo,topo.decTopo,p);
    }
    var ra2000Topo = convertDM(raDec.ra*rad_to_hr, "hm");
    var dec2000Topo = convertDM(raDec.dec*rad_to_deg, "dm");
    // Elongation and fraction of planet illuminated
    var elongIllum = elongationPhase(planet,sun);
    var Elong = elongIllum.elongation;
    var illum = elongIllum.illuminated;
    // apparent magnitude
    var magPara = {object:tip.object, i:elongIllum.phaseAng, 
                   rHelio:rHelio, rGeo:rGeo, 
                   T:TD, planet:planet, sun:sun};
    var mag = planetMag(magPara);
    // angular size (arcsec)
    var ang1AU = {Mercury:6.726865375887558, 
                  Venus:16.68838398040351,
                  Mars:9.3468517633725, 
                  Jupiter:192.785883944279362, 
                  Saturn:160.579988754892298, 
                  Uranus:69.938001009781189,
                  Neptune:67.897384309708713};
    var ang = ang1AU[tip.object]/rGeo;
    // Alt and Azimuth
    raDec = {ra:aber.ra, dec:aber.dec};
    var hor = ra_dec_to_alt_az(raDec, LST, cosLat,sinLat);
    var alt = (hor.alt + atmosphericRefraction(hor.alt, 101, 286))*rad_to_deg;
    var azi = Math.atan2(hor.sinA,hor.cosA)*rad_to_deg + 180;
    alt = alt.toFixed(2)+"&deg;";  azi = azi.toFixed(2)+"&deg;";
    // rise ans set
    var ra=[], dec=[];
    var T0 = TD - para.hours/876600;
    calculate[2] = false; // no need to calculate the Sun's positions
    for (var i=0; i<25; i++) {
        planet = planetPos(T0+i/876600,calculate)[ind];
        ra[i] = planet.ra; dec[i] = planet.dec;
    }
    var tt = getTransitTime(para.LST0,para.lat,ra,dec, false);
    var Transit = tt.t+' ('+tt.alt+')';
    var alt1 = -0.009890199094634533; // -34' in radians
    var trs = getRiseSet(alt1,para.LST0,para.lat,ra,dec);
    var RiseSet = trs.rise+" ("+trs.azRise+"), "+trs.set;
    if (trs.rise=="above") {
        RiseSet = "circumpolar";
    }
    
    var tipText = "#tip"+para.loc+"text";
    var txt ="<table>";
    txt += '<tr><th colspan="2">'+tip.object+'</th></tr>';
    txt += '<tr><td>Heliocentric Distance</td> <td>'+rHelio.toFixed(3)+' AU</td></tr>';
    txt += '<tr><td>Geocentric Distance</td> <td>'+rGeo.toFixed(3)+' AU</td></tr>';
    txt += '<tr><td>Angular Diameter</td> <td>'+ang.toPrecision(3)+'"</td></tr>';
    txt += '<tr> <td>Elongation</td> <td>'+Elong+'</td></tr>';
    if (tip.pIndex < 5) {
        txt += '<tr><td>Illuminated</td> <td>'+illum+'</td></tr>';
    }
    txt += '<tr><td>Apparent Magnitude</td> <td>'+mag.toFixed(1)+'</td></tr>';
    txt += '<tr><td>Geocentric Ra, Dec (J2000)</td> <td>'+ra2000+', '+dec2000+'</td></tr>';
    txt += '<tr><td>Topocentric Ra, Dec (J2000)</td> <td>'+ra2000Topo+', '+dec2000Topo+'</td></tr>';
    if ("nu" in para) {
        txt += '<tr><td>App. Topo. Ra, Dec (of date)</td> <td>'+raTopo+', '+decTopo+'</td></tr>';
        txt += '<tr><td>Apparent Sidereal Time</td> <td>'+convertDM(para.LAST*12/Math.PI,"hm")+'</td></tr>';
    } else {
        txt += '<tr><td>Topocentric Ra, Dec (of date)</td> <td>'+raTopo+', '+decTopo+'</td></tr>';
    }
    txt += '<tr><td>Altitude, Azimuth</td> <td>'+alt+', '+azi+'</td></tr>';
    txt += '<tr><td>Rise (Azi), Set</td> <td>'+RiseSet+'</td></tr>';
    txt += '<tr><td>Upper Transit (Altitude)</td> <td>'+Transit+'</td></tr>';
    
    $(tipText).append(txt);
}

// Display popup box for stars
function displayPopupStar(tip, para) {
    var stars = brightStars();
    var s = stars[tip.starInd]; // this star
    // ra and dec at current time
    var TD = para.T + para.dT; 
    var T0 = stars[0].Tepoch;
    var dcen = TD-T0;
    // correct for proper motion
    var x = s.x + s.vx*dcen;
    var y = s.y + s.vy*dcen;
    var z = s.z + s.vz*dcen;
    var distpc = Math.sqrt(x*x + y*y + z*z);
    
    // Correct for annual parallax
    if (TD > -50 && TD < 10) {
        var calculate = [false,false,true,false,false,false,false,false];
        var sun = planetPos(TD, calculate)[2];
        var rpc = sun.rGeo*Math.PI/648000; // dist. from Sun in pc
        var xe = -rpc*Math.cos(sun.ra2000)*Math.cos(sun.dec2000);
        var ye = -rpc*Math.sin(sun.ra2000)*Math.cos(sun.dec2000);
        var ze = -rpc*Math.sin(sun.dec2000);
        x -= xe;
        y -= ye;
        z -= ze;
        distpc = Math.sqrt(x*x + y*y + z*z);
    }

    // ra and dec wrt J2000.0 (after correcting for proper motion)
    var rad_to_deg = 180/Math.PI, rad_to_hr = 12/Math.PI;
    var ra2000 = convertDM(Math.atan2(y,x)*rad_to_hr, "hm");
    var dec2000 = convertDM(Math.asin(z/distpc)*rad_to_deg, "dm");
    // precession and nutation
    var p = precession_matrix(T0,dcen);
    var LST = para.LST;
    if ("nu" in para) {
        // Add nutation
        LST = para.LAST;
        var p11 = para.nu.p11*p.p11 + para.nu.p12*p.p21 + para.nu.p13*p.p31;
        var p12 = para.nu.p11*p.p12 + para.nu.p12*p.p22 + para.nu.p13*p.p32;
        var p13 = para.nu.p11*p.p13 + para.nu.p12*p.p23 + para.nu.p13*p.p33;
        var p21 = para.nu.p21*p.p11 + para.nu.p22*p.p21 + para.nu.p23*p.p31;
        var p22 = para.nu.p21*p.p12 + para.nu.p22*p.p22 + para.nu.p23*p.p32;
        var p23 = para.nu.p21*p.p13 + para.nu.p22*p.p23 + para.nu.p23*p.p33;
        var p31 = para.nu.p31*p.p11 + para.nu.p32*p.p21 + para.nu.p33*p.p31;
        var p32 = para.nu.p31*p.p12 + para.nu.p32*p.p22 + para.nu.p33*p.p32;
        var p33 = para.nu.p31*p.p13 + para.nu.p32*p.p23 + para.nu.p33*p.p33;
        p = {p11:p11, p12:p12, p13:p13, p21:p21, p22:p22, p23:p23, 
             p31:p31, p32:p32, p33:p33};
    }
    var x1 = p.p11*x + p.p12*y + p.p13*z;
    var y1 = p.p21*x + p.p22*y + p.p23*z;
    var z1 = p.p31*x + p.p32*y + p.p33*z;
    var ra = Math.atan2(y1,x1);
    var dec = Math.asin(z1/distpc);
    // Correct for aberration of light
    if ("nu" in para) {
        var aberpara = {T:TD, m:para.nu, LAST:para.LAST, 
                        cosLat:Math.cos(para.lat), 
                        sinLat:Math.sin(para.lat)};
        raDec = aberration(ra,dec, aberpara);
        ra = raDec.ra; dec = raDec.dec;
    }
    var raStr = convertDM(ra*rad_to_hr, "hm");
    var decStr = convertDM(dec*rad_to_deg, "dm");

    var txt = "<table>";
    var name = s.name;
    var dist2000 = s.dist2000;
    var distly = distpc*3.2616;
    // round distance to 3 sig. fig.
    var dist, varmag="";
    if (dist2000 >= 9.9e4) {
        dist = "?"; 
    } else {
        dist = distpc.toPrecision(4)+" pc ("+distly.toPrecision(4)+" ly)";
    }
    if ("bayer" in s && name.slice(0,1) != "<") {
        name += ", "+s.bayer+" "+s.con;
    }
    var mag = s.mag.toFixed(2);
    var magStr = "Mag.";
    var delMag = 0;
    if (s.dist2000 < 9.9e4) {
        var absmag = s.mag + 5 - 5*Math.LOG10E*Math.log(s.dist2000);
        // correct mag. as a result of change in distance
        delMag = 5*Math.LOG10E*Math.log(distpc/s.dist2000);
        mag = s.mag + delMag;
        magStr += ", Abs. Mag.";
        mag = mag.toFixed(2)+", "+absmag.toFixed(2);
    }
    if ("varMax" in s && "varMin" in s) {
        var varMax = parseFloat(s.varMax)+delMag;
        var varMin = parseFloat(s.varMin)+delMag;
        varmag = varMax.toFixed(2)+" &ndash; "+varMin.toFixed(2);
    }
    txt += '<tr><th colspan="2">'+name+'</th></tr>';
    txt += '<tr><td>'+magStr+'</td> <td>'+mag+'</td></tr>';
    if (varmag != "") {
        txt += '<tr><td>Variable</td> <td>'+varmag+'</td></tr>';
    }
    txt += '<tr><td>Distance</td> <td>'+dist+'</td></tr>';
    if ("spect" in s) {
        txt += '<tr><td>Spec, col. ind.</td> <td>'+s.spect;
        if ("colorInd" in s) {
            txt += ', '+s.colorInd;
        }
        txt += '</td></tr>';
    }
    var conNames = constellationAbbrNames();
    txt += '<tr><td>Constellation</td> <td>'+conNames[s.con]+'</td></tr>';
    txt += "<tr><td>Ra, Dec (J2000)</td> <td>"+ra2000+", "+dec2000+"</td></tr>";
    if ("nu" in para) {
        txt += '<tr><td>App. Ra, Dec (of date)</td> <td>'+raStr+', '+decStr+'</td></tr>';
        txt += '<tr><td>Apparent Sidereal Time</td> <td>'+convertDM(para.LAST*12/Math.PI,"hm")+'</td></tr>';
    } else {
        txt += "<tr><td>Ra, Dec (of date)</td> <td>"+raStr+", "+decStr+"</td></tr>";
    }
    
    // Alt and Azimuth
    var raDec = {ra:ra, dec:dec};
    var cosLat = Math.cos(para.lat);
    var sinLat = Math.sin(para.lat);
    var hor = ra_dec_to_alt_az(raDec, LST, cosLat,sinLat);
    var alt = (hor.alt + atmosphericRefraction(hor.alt, 101, 286))*rad_to_deg;
    var azi = Math.atan2(hor.sinA,hor.cosA)*rad_to_deg + 180;
    txt += "<tr><td>Alt, Azimuth</td> <td>"+alt.toFixed(2)+"&deg;, "+azi.toFixed(2)+"&deg;</td></tr>";
    
    // rise, set and transit times
    alt = -0.009890199094634533; // -34' in radians
    var t = riseSetStar(para.LST0, alt, para.lat, ra, dec);
    var transit = t.transit+' ('+t.altTransit+')';
    txt += '<tr><td>Upper Transit (Alt)</td> <td>'+transit+'</td></tr>';
    var riseSet = t.rise+' ('+t.azRise+'), '+t.set;
    if (t.rise=="above") {
        riseSet = "circumpolar";
    }
    txt += '<tr><td>Rise (Azi), Set</td> <td>'+riseSet+'</td></tr>';
    
    txt += '</table>'
    
    var tipText = "#tip"+para.loc+"text";
    $(tipText).append(txt);
}

// Set up parameters for drawing stars and planets
function setupDrawingParameters() {
    // Set the colors, sizes of dots of the planets on the star chart
    // and also the coordinate offsets of the planet symbols
    // planet order: Sun, Moon, Mercury, Venus, Mars, Jupiter, Uranus, Neptune
    var pColor = ["red", "orange", "maroon","#FF00FF","red",
                 "brown","brown","#7277e6","#7277e6"];
    var pName = ["Sun","Moon","Mercury","Venus","Mars",
                "Jupiter","Saturn","Uranus","Neptune"];
    var pSize = [1, 2, 1,2,2,2,2,2,2];
    var pCode = [9788,9789,9791,9792,9794,9795,9796,9954,9798];
    var offset = [{x:-10, y:7}, {x:-10, y:7}, {x:-5, y:7}, 
                {x:-7, y:0}, {x:-7, y:2}, {x:-10, y:7}, 
                {x:-5, y:7}, {x:-10, y:3}, {x:-8, y:5}];
    // parameters setting the size of the star
    // size = a*m+b, m = magnitude of the star
    // set a and b so that size = s1 for m=5 and s2 for m=-1.5
    var s1 = 1, s2 = 5;
    var a = (s1-s2)/6.5;
    var b = s1-5*a;

    var pDraw = {color:pColor, code:pCode, size:pSize, offset:offset, pName:pName,
                starMagA:a, starMagB:b};
    return(pDraw);
}