"use strict";

// Set up global variables
let date1, date2; // dates and times of the two locations
let place1,place2; // names of the locations
let long1,long2;  // longitudes of the locations (in deg)
let lat1,lat2; // latitudes of the locations (in deg)
let rotate1 = 0, rotate2 = 0; // rotationion angles (in rad) of charts 1 and 2
// timezone variables associated with the locations
// tz1.tz: timezone offset in minutes from GMT (west is positive)
// tz1.tz1String: the timezone offset string
let tz1=0,tz2=0; 
// Tooltips (popup box, to be more accurate) setup
let tipsEnabled, tips, highPrecCalInTips; 
// Save stars' positions for the dates in the two locations 
// initialize the arrays
let starsLoc = [], brightestStarsLoc = [], conLabelLoc = [];
starsLoc[0] = brightStars(); starsLoc[1] = brightStars();
brightestStarsLoc[0] = brightestStars(); brightestStarsLoc[1] = brightestStars();
conLabelLoc[0] = constellationLabel(); conLabelLoc[1] = constellationLabel();
let magLimit = 5.3; // limiting magnitude
let magLimitTip = 5.3; // limit. mag. for stars to show a popup box
// Save Milky Way boundaries' positions for the dates in the two locations 
// initialize the arrays
//let milkyLoc = [];
//milkyLoc[0] = {northernEdge:northernEdge(), 
//               southernEdge:southernEdge(), 
//               betaCas:betaCas(), thetaOph:thetaOph(), 
//               lambdaSco:lambdaSco(), 
//               coalsack:coalsack()};
//milkyLoc[1] = {northernEdge:northernEdge(), 
//               southernEdge:southernEdge(), 
//               betaCas:betaCas(), thetaOph:thetaOph(), lambdaSco:lambdaSco(), 
//               coalsack:coalsack()};

let milkyPolyLoc = [];
milkyPolyLoc[0] = {Tepoch:0, poly:mw_poly(), sb:mw_sb()};
milkyPolyLoc[1] = {Tepoch:0, poly:mw_poly(), sb:mw_sb()};

// Initial setup
function init() {
    $('#wrapper').show();
    let iplookup = false;
    if (iplookup) {
        $.ajax({url:'http://ip-api.com/json',
          success:function(res) {
              let place = res.city;
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
    let d = new Date(); // current time from computer's clock
    
    // Set location 1
    let tmp1 = $("#long1").text();
    let tmp2 = $("#lat1").text();
    if (tmp1 != "" && tmp2 != "") {
        place1 = $("#place1").text();
        long1 = parseFloat(tmp1);
        lat1 = parseFloat(tmp2);
    } else {
        place1 = "Champaign, IL, USA";
        long1 = -88.2434; 
        lat1 = 40.1164;
    }
    let tz1String;
    // Use computer's clock for the time zone
    let tz1offset = d.getTimezoneOffset();
    let tString = d.toTimeString();
    let i = tString.indexOf("GMT");
    if (i != -1) {
        tz1String = tString.slice(i+3);
    } else {
        let tz = -tz1offset/60;
        if (tz.toString().length > 6) { tz = tz.toFixed(2);}
        tz1String = (tz >= 0 ? '+'+tz:tz);
    }
    tz1 = {tz:tz1offset, tzString:tz1String};
    
    // Set location 2
    place2 = "";
    long2 = long1;
    lat2 = -30;
    if (lat1 < 0) {lat2 = 30;}
    tz2 = {tz:tz1.tz, tzString:tz1.tzString};
    
    // Set up the object date1 
    let yyyy = d.getFullYear();
    let mm = d.getMonth()+1;
    let dd = d.getDate();
    let h = d.getHours();
    let m = d.getMinutes();
    let s = d.getSeconds()+1e-3*d.getMilliseconds();
    let D = getDm(yyyy,mm,dd,tz1.tz) + (h+m/60+s/3600)/24;
    // New: determine initial settings from url query string
    const p = new URLSearchParams(window.location.search);
    D = initial_settings_from_url(p, D, 1);
    let T = D/36525;
    let dT = DeltaT(T);
    let date = CalDat(D - tz1.tz/1440);
    
    date1 = {yyyy:date.yy, mm:date.mm, dd:date.dd, 
             h:date.h, m:date.m, s:date.s, tz:tz1.tz, 
             tzString:tz1.tzString, dateString:date.dateString, 
             timeString:date.timeString, D:D, T:T, dT:dT};
    let GAST = getGAST(date1);
    let LST = getSidereal(GAST,long1);
    date1.LST = LST.hour;
    date1.LST_rad = LST.rad;
    date1.LSTstring = LST.string;
    
    // Set up the object date2 
    // New: determine initial settings from url query string
    D = initial_settings_from_url(p, D, 2);
    T = D/36525;
    dT = DeltaT(T);
    date = CalDat(D - tz2.tz/1440);
    date2 = {yyyy:date.yy, mm:date.mm, dd:date.dd, 
             h:date.h, m:date.m, s:date.s,
             tz:tz2.tz, tzString:tz2.tzString,
             dateString:date.dateString, timeString:date.timeString, 
             D:D, T:T, dT:dT};
    GAST = getGAST(date2);
    LST = getSidereal(GAST,long2);
    date2.LST = LST.hour;
    date2.LST_rad = LST.rad;
    date2.LSTstring = LST.string;
    
    tipsEnabled = true;
    tips = [[], []];
    highPrecCalInTips = true;
    $("#loc1").on("click", function(event) {displayPopup(event, 1);});
    $("#loc2").on("click", function(event) {displayPopup(event, 2);});
    $("#rotate1").val(Math.floor(rotate1*180/Math.PI + 0.5));
    $("#rotate2").val(Math.floor(rotate2*180/Math.PI + 0.5));
    $("#changeLoc1Manual").prop("checked", true);
    $("#changeLoc2Manual").prop("checked", true);
    let para = {divId:'changeLoc1Form1', loc:1};
    setupChangeLocCityMenu(para);
    para = {divId:'changeLoc2Form1', loc:2};
    setupChangeLocCityMenu(para);
    
    starChart();
}

function new_eval(expr) {
    return Function('return '+expr)();
}

// Determine initial settings from url query string
function initial_settings_from_url(p, D, loc) {
    // set location
    set_location_from_url1(p, loc);
    set_location_from_url2(p, loc);
    
    // azimuth at top
    let rotKey = 'rotate'+loc;
    if (p.has(rotKey)) {
        let rotate = parseInt(p.get(rotKey), 10);
        if (!isNaN(rotate)) {
            rotate -= 360*Math.floor(rotate/360);
            rotate *= Math.PI/180;
            if (loc==1) {
                rotate1 = rotate;
            } else {
                rotate2 = rotate;
            }
        }
    }
    // show/hide buttons
    let butts = ['showPlanets', 'showEquator', 'showEcliptic', 
                'showGalactic','showMilkyWay', 'showConLines', 
                'showConLab', 'showDayNight'];
    // change the status of the show/hide buttons if the keys 
    // are present in the query string
    butts.forEach(function(x) {
        if (p.has(x+loc)) {
            let active_new = (p.get(x+loc) != '0');
            let active_current = $('#'+x+loc).hasClass('active');
            if (active_new != active_current) {
                $('#'+x+loc).toggleClass('active');
            }
        }
    });
    
    // Set initial time
    let Dnew = D;
    if (p.has('jd'+loc)) {
        let jd = parseFloat(p.get('jd'+loc));
        if (!isNaN(jd) && jd >= -71328942.5 && jd <= 74769559.5) {
            Dnew = jd - 2451545;
        }
    }
    
    return Dnew;
}

// Set location from the url query string.
// Version 1: get the location information from 
//            long, lat and tz keys
function set_location_from_url1(p, loc) {
    if (p.has('long'+loc) && p.has('lat'+loc)) {
        // set location longitude and latitude
        let lng = parseFloat(p.get('long'+loc));
        let lat = parseFloat(p.get('lat'+loc));
        if (!isNaN(lng) && !isNaN(lat) && 
           lng >= -180 && lng <= 180 && lat >=-90 && lat <=90) {
            if (loc==1) {
                long1 = lng; lat1 = lat; place1 = '';
            } else {
                long2 = lng; lat2 = lat; place2 = '';
            }
        }
    }
    if (p.has('tz'+loc)) {
        let tz = parseFloat(p.get('tz'+loc));
        if (tz.toString().length > 6) { tz = tz.toFixed(2);}
        if (!isNaN(tz) && tz >= -12 && tz <= 12) {
            if (loc==1) {
                tz1 = {tz:-tz*60, tzString:(tz >= 0 ? "+"+tz:tz.toString())};
            } else {
                tz2 = {tz:-tz*60, tzString:(tz >= 0 ? "+"+tz:tz.toString())};
            }
        }
    }
}

// Set location from the url query string.
// Version 2: Get the location information from region and index keys
function set_location_from_url2(p, loc) {
    let regKey = 'region'+loc, iKey = 'ind'+loc;
    let reg, ind, valid = false;
    if (p.has(regKey) && p.has(iKey)) {
        reg = p.get(regKey);
        ind = parseInt(p.get(iKey), 10);
        let regionCode = ['NAm', 'LA', 'EA', 'SEA', 'SA', 'WCA', 'EE', 'NE', 'WE', 'SE', 'AF', 'OC'];
        // Check if reg is equal to one of the strings in regionCode
        valid = regionCode.map(x => x==reg).reduce((a, b) => a || b);
        if (isNaN(ind) || ind < 0) { valid = false;}
    }
    if (valid) {
        let cities = new_eval(reg + '_cities()');
        if (ind >= cities.length) { return;}
        let city = cities[ind];
        if (loc==1) {
            place1 = city[0]+', '+city[1];
            lat1 = city[2];
            long1 = city[3];
        } else {
            place2 = city[0]+', '+city[1];
            lat2 = city[2];
            long2 = city[3];
        }
        let setTz = 'setTz'+loc;
        if (p.has(setTz)) {
            let tz = parseFloat(p.get(setTz));
            if (!isNaN(tz) && tz >= -12 && tz <= 12) {
                if (tz.toString().length > 6) { tz = tz.toFixed(2);}
                let tzString = (tz >= 0 ? '+'+tz:tz.toString());
                tz *= -60;
                if (loc==1) {
                    tz1 = {tz:tz, tzString:tzString};
                } else {
                    tz2 = {tz:tz, tzString:tzString};
                }
            }
        }
    }
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
              let place = res.city;
              if (res.region != "") {
                  place += ', '+res.region;
              }
              place += ', '+res.countryCode;
              $("#place1in").text(place);
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

function changeSyncTime(i,idHead) {
    let yesID = "#"+idHead+"Yes";
    let noID = "#"+idHead+"No";
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

function switchChangeLocForm(loc, form) {
    $('#changeLoc'+loc+'Form'+form).show();
    $('#changeLoc'+loc+'Form'+(1-form)).hide();
}

function setupChangeLocCityMenu(para) {
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
    txt += '<input id="'+divId+'tzCustomInput" type="number" step="0.01" min="-12" max="12" /></p>';
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

function changeLocationsAndTimes() {
    let errid = '#errorlocs';
    $(errid).empty();
    function validate_manual_input(loc) {
        let place = $('#place'+loc+'in').val();
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
        id = '#tz'+loc+'in';
        let tz = parseFloat($(id).val());
        min = -12; max = 12;
        message = "Invalid time zone! Time zone must be a number between -12 and 12.";
        sanityCheck(tz,id,min,max,message,errid);
        
        if ($(errid).text()=='') {
            if (tz.toString().length > 6) {
                tz = tz.toFixed(2);
            }
            let tzString = (tz >= 0 ? '+'+tz:tz.toString());
            tz *= -60;
            if (loc==1) {
                place1 = place; long1 = lng; lat1 = lat;
                tz1.tz = tz; tz1.tzString = tzString;
            } else {
                place2 = place; long2 = lng; lat2 = lat;
                tz2.tz = tz; tz2.tzString = tzString;
            }
        }
    }
    
    function validate_menu_input(loc) {
        let divId = 'changeLoc'+loc+'Form1';
        let ind = parseInt($('#'+divId+'selectCity').val(), 10);
        if (isNaN(ind) || ind == -1) {
            $(errid).append('<p style="color:red;">Please select a city from the dropdown menu for location '+loc+'.</p>');
        } else {
            let prefix = 'region'+divId;
            let regionCode = ['NAm', 'LA', 'EA', 'SEA', 'SA', 'WCA', 'EE', 'NE', 'WE', 'SE', 'AF', 'OC'];
            let reg, n = regionCode.length;
            for (let i=0; i<n; i++) {
                if ($('#'+prefix+regionCode[i]).prop('checked')) {
                    reg = regionCode[i];
                    break;
                }
            }
            let city = new_eval(reg+'_cities()['+ind+']');
            if (loc==1) {
                place1 = city[0]+', '+city[1];
                lat1 = city[2];
                long1 = city[3];
            } else {
                place2 = city[0]+', '+city[1];
                lat2 = city[2];
                long2 = city[3];
            }
            if ($('#'+divId+'tzCustom').prop('checked')) {
                let id = '#'+divId+'tzCustomInput';
                let tz = parseFloat($(id).val());
                let min = -12, max=12;
                let message = 'Invalid time zone for location '+loc+'! Please enter a number between -12 and 12.';
                sanityCheck(tz,id,min,max,message,errid);
                if ($(errid).text()=='') {
                    if (tz.toString().length > 6) {
                        tz = tz.toFixed(2);
                    }
                    let tzString = (tz >= 0 ? '+'+tz:tz.toString());
                    tz *= -60;
                    if (loc==1) {
                        tz1.tz = tz; tz1.tzString = tzString;
                    } else {
                        tz2.tz = tz; tz2.tzString = tzString;
                    }
                }
            } else {
                let d = new Date();
                let tString = d.toTimeString();
                let i = tString.indexOf("GMT");
                if (i != -1) {
                    tString = tString.slice(i+3);
                }
                if (loc==1) {
                    tz1.tz = d.getTimezoneOffset();
                    tz1.tzString = tString;
                } else {
                    tz2.tz = d.getTimezoneOffset();
                    tz2.tzString = tString;
                }
            }
        }
    }
    
    function validate_time_input(loc) {
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
        let s = parseFloat($(id).val());
        min=0; max=60;
        message = 'Invalid second! Please enter a number between '+min+' and '+max+'.';
        sanityCheck(s,id,min,max,message,errid);
        
        if ($(errid).text()=='') {
            let D = getDm(year,month,day,0);
            let date = CalDat(D);
            let dateString = date.dateString;
            let timeString = generateTimeString(hh,mm,s);
            let tz, tzString;
            if (loc==1) {
                tz = tz1.tz; tzString = tz1.tzString;
            } else {
                tz = tz2.tz; tzString = tz2.tzString;
            }
            D = getDm(date.yy,date.mm,date.dd,tz) + (hh+mm/60+s/3600)/24;
            let T = D/36525;
            let dT = DeltaT(T);
            if (loc==1) {
                date1 = {yyyy:date.yy, mm:date.mm, dd:date.dd, h:hh, m:mm, s:s, tz:tz, tzString:tzString, dateString:dateString, timeString:timeString, D:D, T:T, dT:dT};
                let GAST = getGAST(date1);
                let LST = getSidereal(GAST,long1);
                date1.LST = LST.hour;
                date1.LST_rad = LST.rad;
                date1.LSTstring = LST.string;
            } else {
                date2 = {yyyy:date.yy, mm:date.mm, dd:date.dd, h:hh, m:mm, s:s, tz:tz, tzString:tzString, dateString:dateString, timeString:timeString, D:D, T:T, dT:dT};
                let GAST = getGAST(date2);
                let LST = getSidereal(GAST,long2);
                date2.LST = LST.hour;
                date2.LST_rad = LST.rad;
                date2.LSTstring = LST.string;
            }
        }
    }
 
    if ($('#changeLoc1Manual').prop('checked')) {
        validate_manual_input(1);
    } else {
        validate_menu_input(1);
    }
    validate_time_input(1);
    
    if ($('#changeLoc2Manual').prop('checked')) {
        validate_manual_input(2);
    } else {
        validate_menu_input(2);
    }
    if ($(errid).text()=='') {
        if ($('#synTimeYes').prop('checked')) {
            let date = CalDat(date1.D - tz2.tz/1440);
            date2 = {yyyy:date.yy, mm:date.mm, dd:date.dd, 
                    h:date.h, m:date.m, s:date.s, tz:tz2.tz, 
                    tzString:tz2.tzString, dateString:date.dateString, 
                    timeString:date.timeString, D:date1.D, 
                    T:date1.T, dT:date1.dT};
            let GAST = getGAST(date2);
            let LST = getSidereal(GAST, long2);
            date2.LST = LST.hour;
            date2.LST_rad = LST.rad;
            date2.LSTstring = LST.string;
        } else {
            validate_time_input(2);
        }
    }
    
    if ($(errid).text()=='') { 
        $("#inputlocs").slideUp();
        $('button.menu').attr("disabled", false);
        starChart();
    }
}

function slideUpLoadUrl(slideUpId, url) {
    $("#"+slideUpId).slideUp();
    $('button.menu').attr("disabled", false);
    location.href = url;
}

// *** star charts ***
function showHide(loc,name) {
    let locStr = loc.toString();
    $("#show"+name+locStr).toggleClass("active");
    starChartLoc(loc);
}

// *** Rotate the chart **
function rotInput(loc) {
    let locStr = loc.toString();
    let inputId = '#rotate'+locStr;
    let errid = "#errRotate"+locStr;
    $(errid).empty();
    let x = parseInt($(inputId).val());
    let message = "Invalid input! Please enter an integer.";
    $(inputId).css("background-color", "transparent");
    if (isNaN(x)) {
        $(inputId).css("background-color", "#e2a8a8");
        let text = '<p style="color:red;">'+message+'</p>';
        $(errid).append(text);
    }
    if ($(errid).text()=="") {
        x = x - 360*Math.floor(x/360)
        $(inputId).val(x);
        if (loc==1) { 
            rotate1 = x*Math.PI/180.0;
        } else {
            rotate2 = x*Math.PI/180.0;
        }
        starChartLoc(loc);
    }
}

// Calculate the Greenwich mean sidereal time in hours 
function getGMST(d) {
    // Get Julian date at midnight GMST
    let D0 = Math.floor(d.D-0.5)+0.5;
    // Get hours according to the UTC
    //let H = d.h + d.m/60 + d.s/3600 + d.tz/60;
    //H -= 24*Math.floor(H/24);
    let H = 24*(d.D - D0);

    let GMST = 0.06570748587250752*D0;
    GMST -= 24*Math.floor(GMST/24);
    GMST += 6.697374558336001 + 1.00273781191135448*H;
    GMST -= 24*Math.floor(GMST/24);
    let T = d.T + d.dT;
//    GMST += 2.686296296296296e-07 +T*(0.08541030618518518 
//                                       + T*(2.577003148148148e-05 
//                                           + T*(-8.148148148148149e-12 - 
//                                               T*5.547407407407407e-10)));
    GMST += 2.686296296296296e-07 +T*(0.08541030618518518 
                                       + T*2.577003148148148e-05);
    GMST -= 24*Math.floor(GMST/24);
    return GMST;
}

// Calculate the Greenwich apparent sidereal time in hours 
function getGAST(d, Dpsi='8') {
    let D0 = Math.floor(d.D);
    let fday = (d.h + d.m/60 + d.s/3600)/24 + d.tz/1440 + 0.5;
    fday -= Math.floor(fday);
    let ERA = mod2pi_omgDf(0.01720217957524373, D0, 0) + fday*6.300387486754831 - 1.38822409435583;
    fday += 36525*d.dT;
    let jd_int = Math.floor(D0 + 2451545 + fday);
    fday -= Math.floor(fday);
    let Eo = Eo_Vondrak_longT(jd_int, fday, Dpsi);
    let GAST = (ERA - Eo)*12/Math.PI;
    return GAST - 24*Math.floor(GAST/24);
}

// Calculate the apparent sidereal time from GAST and longitude
function getSidereal(GAST,long) {
    let LST = GAST + long/15;
    LST = LST - 24*Math.floor(LST/24); // LST in hours
    let LST_rad = LST*Math.PI/12; // LST in radian
    let LSTr = LST + 0.5/3600; // used for rounding
    let LSTH = Math.floor(LSTr).toString();
    let LSTM = Math.floor(60*(LSTr-LSTH)).toString();
    let LSTS = Math.floor(3600*(LSTr-LSTH-LSTM/60)).toString();
    if (LSTH.length < 2) { LSTH = "0"+LSTH;}
    if (LSTM.length < 2) { LSTM = "0"+LSTM;}
    if (LSTS.length < 2) { LSTS = "0"+LSTS;}
    let LST_string = LSTH+":"+LSTM+":"+LSTS;
    return {hour:LST, rad:LST_rad, string:LST_string};
}

// Generate star charts at a given times (specified by the 
//  time variables date1, date2) and places (specified by the 
// longitudes and latitudes)
function starChart() {
    let d1String = date1.dateString+"&nbsp;&nbsp;"+date1.timeString+"  GMT"+tz1.tzString;
    let d2String = date2.dateString+"&nbsp;&nbsp;"+date2.timeString+" GMT"+tz2.tzString;

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
    let pDraw = setupDrawingParameters();
        
    // Generate star charts for the two locations
    starChartLoc(1);
    starChartLoc(2);
    
    // Legend
    addLegend(pDraw);
}

// Standalone function to draw a star chart at one location 
// indicated by the input parameter loc
function starChartLoc(loc) {
    let d,lat,T0;
    if (loc==1) {
        d=date1; lat=lat1;
    } else {
        d=date2; lat=lat2;
    }
    let lat_rad = lat*Math.PI/180;
    let locStr = loc.toString();
    let Canvas = document.getElementById('loc'+locStr);
    if (Math.abs(d.yyyy) > 3000 && $("#warning"+locStr).text()=="") {
        $("#warning"+locStr).append('<p style="color:red;">Warning: Positions of the Sun, Moon and planets are not accurate at this time.</p>');
    }
    if (Math.abs(d.yyyy) < 3000 && $("#warning"+locStr).text() != "") {
        $("#warning"+locStr).empty();
    }
    let T = d.T, TD = d.T+d.dT;
    // Set up paramaters for drawing stars and planets
    let pDraw = setupDrawingParameters();
    pDraw.loc = loc;
    pDraw.rotate = rotate1;
    if (loc==2) { pDraw.rotate = rotate2;}
    pDraw.cosRotAng = Math.cos(pDraw.rotate);
    pDraw.sinRotAng = Math.sin(pDraw.rotate);
    let objects = {milky:{}};
    pDraw.showPlanets = $("#showPlanets"+locStr).hasClass("active");
    pDraw.showEquator = $("#showEquator"+locStr).hasClass("active");
    pDraw.showEcliptic = $("#showEcliptic"+locStr).hasClass("active");
    pDraw.showGalactic = $("#showGalactic"+locStr).hasClass("active");
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
//        objects.milky.north = milkyLoc[loc-1].northernEdge;
//        objects.milky.south = milkyLoc[loc-1].southernEdge;
//        objects.milky.betaCas = milkyLoc[loc-1].betaCas;
//        objects.milky.thetaOph = milkyLoc[loc-1].thetaOph;
//        objects.milky.lambdaSco = milkyLoc[loc-1].lambdaSco;
//        objects.milky.coalsack = milkyLoc[loc-1].coalsack;
        objects.milky.polyTepoch = milkyPolyLoc[loc-1].Tepoch;
        objects.milky.poly = milkyPolyLoc[loc-1].poly;
        objects.milky.sb = milkyPolyLoc[loc-1].sb;
        //T0 = objects.milky.north[0].Tepoch;
        T0 = objects.milky.polyTepoch;
        if (Math.abs(TD-T0) > 0.1) { 
            milkyWayBoundaryPrecession(objects.milky,T0,TD);
            milkyPolyLoc[loc-1].Tepoch = TD;
            objects.milky.polyTepoch = TD;
        }
    }
    
    if (pDraw.showGalactic) {
        let raDec = galacticNorthPole(TD);
        pDraw.galPoleRa = raDec.ra;
        pDraw.galPoleDec = raDec.dec;
        // ra and dec of Sgr A*
        raDec = galacticCenter(TD);
        pDraw.galCenRa = raDec.ra;
        pDraw.galCenDec = raDec.dec;
    }
    
    objects.conLines = constellationLines();
    
    if (pDraw.showConLab) {
        objects.conLab = conLabelLoc[loc-1];
        T0 = objects.conLab[0].Tepoch;
        if (Math.abs(TD-T0) > 0.1) {
            let p = precession_matrix(T0,TD-T0);
            addPrecession(objects.conLab,p,TD);
            // Add additional precession when there are 
            // more than one location for the constellation labels
            for (let i=1; i<objects.conLab.length; i++) {
                if ("ra2" in objects.conLab[i]) {
                    let precessed = precessed_ra_dec(objects.conLab[i].ra2, 
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
    let Ctx = Canvas.getContext('2d');
    Ctx.clearRect(0, 0, Canvas.width, Canvas.height);
    
    let cosLat = Math.cos(lat), sinLat = Math.sin(lat);
    let halfPI = 0.5*Math.PI;
    let twoPI = 2*Math.PI;
    
   // Draw circle on canvas
   let r = 0.47*Math.max(Canvas.width, Canvas.height);
   let xc = 0.5*Canvas.width;
   let yc = 0.5*Canvas.height;
    
   // Calculate the altitude of the Sun (in degrees)
   let raDec = {ra:objects.planets[0].ra, dec:objects.planets[0].dec};
   let hor = ra_dec_to_alt_az(raDec, LST, cosLat,sinLat);
   let altSun = hor.alt*180/Math.PI;
    
   Ctx.beginPath();
   Ctx.setLineDash([]);
   Ctx.arc(xc, yc,r,0,2*Math.PI);
   // Determine the background color depending on the 
   // altitude of the Sun: black if the altSun < -18 deg, 
   // light blue if altSun > 0, gray otherwise
   let b = 255, b1 = 255;
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
    
   // Canvas parameters
   let gpara = {halfPI:halfPI, xc:xc, yc:yc, r:r, r2:r*r, 
                altSun:altSun, rotate:pDraw.rotate, 
               cosRotAng:pDraw.cosRotAng, 
               sinRotAng:pDraw.sinRotAng};
    
   drawAzimuthLabels(Ctx,gpara);
    
   // Draw the equator, ecliptic and galactic equator
   let pole;
   if (pDraw.showMilkyWay) {
        drawMilkyWay(Ctx,LST,objects.milky,cosLat,sinLat,gpara,pDraw);
   }
    if (pDraw.showGalactic) {
        // Draw galactic equator
        pole = {ra:pDraw.galPoleRa, dec:pDraw.galPoleDec, 
               linestyle:[14,15], color:"magenta"};
        drawCircle(Ctx,LST,cosLat,sinLat,pole,gpara);
        drawGalacticCenter(Ctx, LST, cosLat, sinLat, pDraw.galCenRa, pDraw.galCenDec, gpara);
    }
   if (pDraw.showEquator) {
       // celestial north pole: dec = pi/2
       let eqColor = "black";
       if (b < 170) {eqColor = "yellow";}
       pole = {ra:0, dec:halfPI, 
               linestyle:[], color:eqColor};
       drawCircle(Ctx,LST,cosLat,sinLat,pole,gpara);
   }
   if (pDraw.showEcliptic) {
       // Ecliptic north pole: ra=-pi/2, dec = pi/2-epsilon
       let ecColor = "brown";
       if (b < 170) {ecColor="yellow";}
       pole = {ra:-0.5*Math.PI, dec:pDraw.eclipticNorthPoleDec, 
               linestyle:[10,15], color:ecColor};
       drawCircle(Ctx,LST,cosLat,sinLat,pole,gpara);
   }
    
    let newStar;
    if (pDraw.showConLines || tipsEnabled) {
        if (tipsEnabled) {
            newStar = new Array(objects.stars.length);
            newStar.fill(true);
            tips[pDraw.loc-1].length = 0;
        }
        drawConstellationLinesAndSetupTips(Ctx, objects.conLines, objects.stars, LST, cosLat,sinLat, gpara, pDraw, newStar);
    }
    
   let i,x,y,s,coord;
    
   // Draw stars above the horizon
   let n = objects.stars.length; 
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
               let topo = topoCentricEquatorial(objects.planets[i].rGeo,
                      raDec.ra,raDec.dec,LST,sinLat,cosLat);
               raDec = {ra:topo.raTopo, dec:topo.decTopo};
           }
           coord = ra_dec_to_xy_above(raDec, LST, cosLat,sinLat, gpara);
           if (coord.x > -998) {
              x = coord.x; y = coord.y;
              let pSymbol = String.fromCharCode(pDraw.code[i]);
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
    let dA = 10; // increament of azimuth in degrees
    let n = 360/dA; 
    let dArad = dA*Math.PI/180;
    let rotateDeg = gpara.rotate*180.0/Math.PI;
    Ctx.font="15px Arial";
    Ctx.txtAlign = "center";
    Ctx.fillStyle = "black";
    for (let i=0; i<n; i++) {
        let Adeg = i*dA - rotateDeg;
        Adeg -= 360*Math.floor(Adeg/360);
        let A = i*dArad - gpara.rotate;
        let cosA = Math.cos(A), sinA = Math.sin(A);
        let x1 = gpara.xc - gpara.r*sinA;
        let y1 = gpara.yc - gpara.r*cosA;
        let x2 = gpara.xc - 1.02*gpara.r*sinA;
        let y2 = gpara.yc - 1.02*gpara.r*cosA;
        let x3,y3;
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
        let Achar = i*dA;
        let txt = Achar+String.fromCharCode(176);
        if (Achar==0) {
            txt = "N";
        } else if (Achar==90) {
            txt = "E";
        } else if (Achar==180) {
            txt = "S";
        } else if (Achar==270) {
            txt = "W";
        }
        Ctx.save();
        Ctx.translate(x3,y3);
        if (Adeg < 90 || Adeg >270) {
            Ctx.rotate(-A);
        } else {
            Ctx.rotate(Math.PI-A);
        }
        let w = Ctx.measureText(txt).width;
        Ctx.fillText(txt,-w*0.5,0);
        Ctx.restore();
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
    let HA = (LST - raDec.ra); // hour angle
    let cosHA = Math.cos(HA), sinHA = Math.sin(HA);
    let cosDec = Math.cos(raDec.dec), sinDec = Math.sin(raDec.dec);
    let alt = sinDec*sinLat + cosLat*cosDec*cosHA;
    alt = Math.asin(alt);
    let cosAlt = Math.cos(alt);
    let sA = cosDec*sinHA/cosAlt;
    let cA = (cosDec*cosHA*sinLat - sinDec*cosLat)/cosAlt;
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
    let frac = 2.80198*P/T;
    let x = alt + 0.003137559423803098/(alt + 0.08918632477691024);
    return 0.000296705972839036*frac/Math.tan(x);
}

// RA, Dec -> (x,y) on canvas
// Return (-999,-999) if the object is below the horizon 
function ra_dec_to_xy_above(raDec, LST, cosLat,sinLat, gpara) {
    let HA = (LST - raDec.ra); // hour angle
    let cosHA = Math.cos(HA), sinHA = Math.sin(HA);
    let cosDec = Math.cos(raDec.dec), sinDec = Math.sin(raDec.dec);
    let alt = sinDec*sinLat + cosLat*cosDec*cosHA;
    alt = Math.asin(alt);
    let cosAlt = Math.cos(alt);
    let sinA = cosDec*sinHA/cosAlt;
    let cosA = (cosDec*cosHA*sinLat - sinDec*cosLat)/cosAlt;
    // Rotate the chart by angle pDraw.rotate
    let sA = sinA*gpara.cosRotAng - cosA*gpara.sinRotAng;
    let cA = cosA*gpara.cosRotAng + sinA*gpara.sinRotAng;
    if (Math.abs(cosAlt) < 1e-10) {
        // the object is at the zenith or nadir
        sA = 0; cA = 1;
    }
    
    // Correct for atmospheric refraction when alt > -1 degree
    // Assume P = 101kPa and T = 286K
    if (alt > -0.0175) {
        alt += atmosphericRefraction(alt,101,286);
    }
    
    let x,y;
    if (alt >= 0) {
        // stereographic projection
        let rc = gpara.r*Math.tan(0.5*(gpara.halfPI-alt));
        x = gpara.xc + rc*sA;
        y = gpara.yc + rc*cA;
    } else {
        x=-999; y=-999;
    }
    return {x:x, y:y};
}

// RA, Dec -> (x,y) on canvas
function ra_dec_to_xy(raDec, LST, cosLat,sinLat, gpara) {
    let HA = (LST - raDec.ra); // hour angle
    let cosHA = Math.cos(HA), sinHA = Math.sin(HA);
    let cosDec = Math.cos(raDec.dec), sinDec = Math.sin(raDec.dec);
    let alt = sinDec*sinLat + cosLat*cosDec*cosHA;
    alt = Math.asin(alt);
    let cosAlt = Math.cos(alt);
    let sinA = cosDec*sinHA/cosAlt;
    let cosA = (cosDec*cosHA*sinLat - sinDec*cosLat)/cosAlt;
    // Rotate the chart by angle pDraw.rotate
    let sA = sinA*gpara.cosRotAng - cosA*gpara.sinRotAng;
    let cA = cosA*gpara.cosRotAng + sinA*gpara.sinRotAng;
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
    let rc = gpara.r*Math.tan(0.5*(gpara.halfPI-alt));
    let x = gpara.xc + rc*sA;
    let y = gpara.yc + rc*cA;
    
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
    let x = rGeo*Math.cos(ra)*Math.cos(dec);
    let y = rGeo*Math.sin(ra)*Math.cos(dec);
    let z = rGeo*Math.sin(dec);
    // Geometric Cartesian coordinates of the location
    let a = 6378.1366; // Earth's equatorial radius in km
    // (1-f)^2, where f = 1/298.25642 (see Eq. 7.130)
    let f1_f2 = 0.9933056020041341;
    let aC = a/Math.sqrt(cosLat*cosLat + f1_f2*sinLat*sinLat);
    let aS = f1_f2*aC;
    let xloc = aC*cosLat*Math.cos(LST);
    let yloc = aC*cosLat*Math.sin(LST);
    let zloc = aS*sinLat;
    // Topocentric Cartesian coordinates of the object
    let xtopo = x - xloc;
    let ytopo = y - yloc;
    let ztopo = z - zloc;
    // Topocentric Distance, Ra and Dec
    let rTopo = Math.sqrt(xtopo*xtopo + ytopo*ytopo + ztopo*ztopo);
    let raTopo = Math.atan2(ytopo,xtopo);
    let decTopo = Math.asin(ztopo/rTopo);
    
    return {rTopo:rTopo, raTopo:raTopo, decTopo:decTopo};
}

// Draw a great circle (above the horizon) that is perpendicular 
// to a point with a given ra and dec. (no correction for atm refraction)
// If the given point is the celestial north pole (or south pole), the circle 
// is the equator. If it is an ecliptic pole, the circle is the ecliptic. 
// If it is a galactic pole, the circle is a galactic equator.
// Ra and dec should be two properties of the pole. 
// pole should also have two properties linestyle and color 
// specifying the line style and color of the line to be drawn.
function drawCircle(Ctx,LST,cosLat,sinLat,pole,gpara) {
    let drawCir = true;

    // Calculate P=(xp,yp,zp) of the point w.r.t. the horizontal 
    // coordinate system
    let xp,yp,zp, sinA,cosA;
    if (Math.abs(pole.dec - gpara.halfPI) < 1e-5) {
        // The point is the celestial north pole
        xp = -cosLat; yp = 0; zp = sinLat;
    } else {
        let HA = LST - pole.ra;
        let sinHA = Math.sin(HA), cosHA = Math.cos(HA);
        let sinDec = Math.sin(pole.dec), cosDec = Math.cos(pole.dec);
        let sinAlt = sinLat*sinDec + cosLat*cosDec*cosHA;
        let cosAlt;
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
        let norm = Math.sqrt(xp*xp+yp*yp);
        let Vx = -yp/norm, Vy = xp/norm; // Vz = 0
        // Now calculate W = P x V. This point is also on the circle (since 
        // it's perpendicular to P) and is on the meridian (since 
        // it's perpendicular to V, which is on the horizon) and is above 
        // the horizon (since Z dot W is proportional to 1-(P dot Z)^2 > 0)
        // Note that Wz = xp*Vy - yp*Vx = norm > 0, so W is definitely 
        // above the horizon.
        let Wx = -zp*Vy, Wy = zp*Vx, Wz = norm;
        // The points on the circle are given by the equation 
        // C = cos(theta) V + sin(theta) W
        // The portion above the horizon is for theta in (0,pi).
        
        // Now draw the circle
        let n = 25; // number of points on the line = n+1
        let dtheta = Math.PI/n;
        Ctx.beginPath();
        Ctx.setLineDash(pole.linestyle);
        // Point V
        sinA = Vy; cosA = Vx;
        // Rotate the chart by gpara.rotate
        let sA = sinA*gpara.cosRotAng - cosA*gpara.sinRotAng;
        let cA = cosA*gpara.cosRotAng + sinA*gpara.sinRotAng;
        let x = gpara.xc + gpara.r*sA, y = gpara.yc + gpara.r*cA;
        Ctx.moveTo(x,y); 
        for (let i=1; i<n; i++) {
            let theta = i*dtheta;
            let cosTheta = Math.cos(theta), sinTheta = Math.sin(theta);
            let Cx = cosTheta*Vx + sinTheta*Wx;
            let Cy = cosTheta*Vy + sinTheta*Wy;
            let Cz = sinTheta*Wz;
            let pom = Math.sqrt(Cx*Cx + Cy*Cy);
            if (pom < 1e-5) {
                // The point is at the zenith
                Ctx.lineTo(gpara.xc,gpara.yc);
            } else {
                cosA = Cx/pom; sinA = Cy/pom; 
                // Rotate the chart by gpara.rotate
                sA = sinA*gpara.cosRotAng - cosA*gpara.sinRotAng;
                cA = cosA*gpara.cosRotAng + sinA*gpara.sinRotAng;
                let alt = Math.asin(Cz);
                let rc = gpara.r*Math.tan(0.5*(gpara.halfPI-alt));
                let x = gpara.xc + rc*sA;
                let y = gpara.yc + rc*cA;
                Ctx.lineTo(x,y);
            }
        }
        // Point -V
        sinA = -Vy; cosA = -Vx;
        // Rotate the chart by gpara.rotate
        sA = sinA*gpara.cosRotAng - cosA*gpara.sinRotAng;
        cA = cosA*gpara.cosRotAng + sinA*gpara.sinRotAng;
        x = gpara.xc + gpara.r*sA; y = gpara.yc + gpara.r*cA;
        Ctx.lineTo(x,y);
        Ctx.strokeStyle = pole.color;
        Ctx.stroke();
    }
}

// Precessed the ra and dec of the milky way boundary
function milkyWayBoundaryPrecession(milky,T0,T) {
    let p = precession_matrix(T0,T-T0);
//    addPrecession(milky.north,p,T);
//    addPrecession(milky.south,p,T);
//    addPrecession(milky.betaCas,p);
//    addPrecession(milky.thetaOph,p,T);
//    addPrecession(milky.lambdaSco,p,T);
//    addPrecession(milky.coalsack,p,T);
    // precess the data in polygons
    let n = milky.poly.length;
    for (let i=0; i<n; i++) {
        let np = milky.poly[i].length;
        for (let j=0; j<np; j++) {
            let precessed = precessed_ra_dec(milky.poly[i][j][0], 
                                             milky.poly[i][j][1], p);
            milky.poly[i][j][0] = precessed.ra;
            milky.poly[i][j][1] = precessed.dec;
        }
    }
}

// Add precession to the ra and dec in array
// Note that the index starts at 1 not 0.
function addPrecession(array,p,T) {
    array[0].epoch = "";
    array[0].Tepoch = T;
    for (let i=1; i<array.length; i++) {
        let precessed = precessed_ra_dec(array[i].ra,
                                     array[i].dec,p);
        array[i].ra = precessed.ra;
        array[i].dec = precessed.dec;
    }
}

// Draw Milky Way boundary 
function drawMilkyWay(Ctx,LST,milky,cosLat,sinLat,gpara,pDraw) {
//    if (pDraw.showDayNight && gpara.altSun < -6) {
//        Ctx.strokeStyle = "yellow";
//    } else {
//        Ctx.strokeStyle = "blue";
//    }
//    Ctx.setLineDash([]);
//    
//    // Northern edge
//    drawLineAboveHorizon(Ctx,LST,milky.north,cosLat,sinLat,gpara);
//    // Southhern edge
//    drawLineAboveHorizon(Ctx,LST,milky.south,cosLat,sinLat,gpara);
//    // Others
//    drawLineAboveHorizon(Ctx,LST,milky.betaCas,cosLat,sinLat,gpara);
//    drawLineAboveHorizon(Ctx,LST,milky.thetaOph,cosLat,sinLat,gpara);
//    drawLineAboveHorizon(Ctx,LST,milky.lambdaSco,cosLat,sinLat,gpara);
//    drawLineAboveHorizon(Ctx,LST,milky.coalsack,cosLat,sinLat,gpara);
    
    // Draw polygons
    Ctx.save();
    let fillColor = (pDraw.showDayNight && gpara.altSun < -6 ? "#668cff":"#7FFFD4");
    // add clipping
    Ctx.beginPath();
    Ctx.arc(gpara.xc, gpara.yc, gpara.r, 0, 2*Math.PI);
    Ctx.clip();
    draw_mw_polygon(Ctx, LST, milky.poly, milky.sb, 
                    cosLat,sinLat, gpara, fillColor);
    Ctx.restore();
}

// Draw Milky Way polygons
function draw_mw_polygon(Ctx, LST, mwpoly, sb, cosLat,sinLat, gpara, fillColor) {
    const max_alpha = 0.7;
    Ctx.lineWidth = 0.2;
    Ctx.fillStyle = fillColor;
    Ctx.strokeStyle = fillColor;
    mwpoly.forEach(draw_one_polygon);
    
    function draw_one_polygon(poly, ind) {
        function dist2(p) {
            let dx = p.x - gpara.xc, dy = p.y - gpara.yc;
            return dx*dx + dy*dy;
        }
        
        let coords = poly.map(function(x) {
            let xy = ra_dec_to_xy({ra:x[0], dec:x[1]}, LST, cosLat,sinLat, gpara);
            return xy;
        });
        let R2 = coords.map(dist2);
        if (Math.min.apply(null, R2) >= gpara.r2) {
            // the entire polygon is outside the plot range
            return;
        }
        Ctx.beginPath();
        Ctx.moveTo(coords[0].x, coords[0].y);
        let n = coords.length;
        for (let i=1; i<n; i++) {
            Ctx.lineTo(coords[i].x, coords[i].y);
        }
        Ctx.globalAlpha = max_alpha*sb[ind];
        Ctx.stroke();
        Ctx.fill();
    }
}

// Sgr A*
function drawGalacticCenter(ctx, LST, cosLat, sinLat, ra, dec, gpara) {
    let coord = ra_dec_to_xy_above({ra:ra, dec:dec}, LST, cosLat, sinLat, gpara);
    if (coord.x > -998) {
        let s = 5;
        ctx.save();
        ctx.fillStyle = 'magenta';
        ctx.beginPath();
        ctx.arc(coord.x, coord.y, s, 0, 2*Math.PI);
        ctx.fill();
        ctx.restore();
    }
}

// Connect the points in 'array' to a line. Only draw the points 
// above the horizon.
// Note that the first point starts at index 1 not 0.
function drawLineAboveHorizon(Ctx,LST,array,cosLat,sinLat,gpara) {
   let x1,y1,x2,y2;
   let raDec = {ra:array[1].ra, dec:array[1].dec};
   let coord = ra_dec_to_xy(raDec, LST, cosLat,sinLat, gpara);
   x2 = coord.x; y2 = coord.y;
   for (let i=2; i < array.length; i++) {
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
    let ra0 = 3.366012906575397, dec0 = 0.4734787372451951;
    let p = precession_matrix(0,T);
    return(precessed_ra_dec(ra0,dec0,p));
}

// Ra and Dec of Sgr A* relative to the equinox of the date
function galacticCenter(T) {
    // 3D position of Sgr A* at J2000 in kpc
    let x0 = -0.4372574538483036, y0 = -6.9827518193438181, z0 = -3.8794307505747145; 
    // 3D velocity of Sgr A* in kpc/century
    let vx = -1.154527115906393e-05, vy = 1.117619916911477e-05, vz = -1.881522674419981e-05;
    // 3D position at T centuries after J2000
    let x = x0 + vx*T, y = y0 + vy*T, z = z0 + vz*T;
    let r = Math.sqrt(x*x + y*y + z*z);
    // J2000 RA and DEC of Sgr A* at T centuries after J2000
    let ra = Math.atan2(y,x), dec = Math.asin(z/r);
    let p = precession_matrix(0,T);
    return(precessed_ra_dec(ra, dec, p));
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
    let ind,i,s,rad2;
    for (i=0; i<conLine.length; i++) {
        $.each(conLine[i], function(key, line) {
            if (key != "name" && key != "abbr") {
                let x1,x2,y1,y2;
                let raDec = {ra:stars[line[0]].ra, dec:stars[line[0]].dec};
                let coord = ra_dec_to_xy(raDec, LST, cosLat,sinLat, gpara);
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
                for (let j=1; j<line.length; j++) {
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
    let fontSize = 12;
    Ctx.font = fontSize.toString()+"px Arial";
    // Blackground and text color based on the altitude of the Sun
    let b = 255, b1 = 255;
    if (pDraw.showDayNight) {
        b = Math.round(255*(1 + gpara.altSun/18));
        b = Math.min(b,255);
        b = Math.max(0,b);
        b1 = Math.round(b*0.95);
    }
    let textColor = "orange";
    if (b > 130) {textColor = "#6c3483";}
    let bgColor = "rgb("+b1+","+b1+","+b+")";
    for (let i=1; i<conLab.length; i++) {
        let raDec = {ra:conLab[i].ra, dec:conLab[i].dec};
        let coord = ra_dec_to_xy_above(raDec, LST, cosLat,sinLat, gpara);
        if (coord.x > -998) {
            let w = Ctx.measureText(conLab[i].abbr).width;
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
                let w = Ctx.measureText(conLab[i].abbr).width;
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
    let T0 = stars[0].Tepoch;
    let dcen = T-T0; //number of centuries between T and T0
    stars[0].epoch = "";
    stars[0].Tepoch = T;
    let p = precession_matrix(T0,dcen);
    for (let i=1; i<stars.length; i++) {
        // add proper motion
        let x = stars[i].x + stars[i].vx*dcen;
        let y = stars[i].y + stars[i].vy*dcen;
        let z = stars[i].z + stars[i].vz*dcen;
        let r = Math.sqrt(x*x+y*y+z*z);
        // Modify star's magnitude based on the new distance
        if (stars[i].dist2000 < 9.9e4) {
            stars[i].mag = stars[i].mag2000 + 5*Math.LOG10E*Math.log(r/stars[i].dist2000);
        }
        // precession
        stars[i].x = p.p11*x + p.p12*y + p.p13*z;
        stars[i].y = p.p21*x + p.p22*y + p.p23*z;
        stars[i].z = p.p31*x + p.p32*y + p.p33*z;
        let vx = stars[i].vx, vy = stars[i].vy, vz = stars[i].vz;
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
   let SQR = function(x) {return x*x;}

    let r1sq = SQR(x1-gpara.xc) + SQR(y1-gpara.yc);
    let r2sq = SQR(x2-gpara.xc) + SQR(y2-gpara.yc);
    
    if (r1sq > gpara.r2 && r2sq > gpara.r2) {
        // Both points are below the horizon. Don't plot anything.
        return;
    }
    
    let x1p=x1, x2p=x2, y1p=y1, y2p=y2;
    if (r1sq > gpara.r2 || r2sq > gpara.r2) {
        // Conside a vector R(s) = R1 + s (R2-R1). 
        // Here R1 is the position vector of (x1,y1), 
        //      R2 is the position vector of (x2,y2).
        // Find s between 0 and 1 such that |R(s)|^2 = gpara.r2
        // Need to solve a quadratic equation.
        let R1dotR2 = (x1-gpara.xc)*(x2-gpara.xc) + (y1-gpara.yc)*(y2-gpara.yc);
        let dR1R2sq = SQR(x1-x2) + SQR(y1-y2);
        let q = r1sq - R1dotR2;
        let s;
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
    let Canvas = document.getElementById('legend');
    let Ctx = Canvas.getContext('2d');
    Ctx.clearRect(0, 0, Canvas.width, Canvas.height);
    // magnitude scale
    Ctx.font="20px Arial";
    Ctx.fillStyle = "black";
    Ctx.fillText("Magnitude scale:",0,20);
    let m,s,x,y;
    let twoPI = 2*Math.PI;
    for (m=-1; m<6; m++) {
        s = pDraw.starMagA*m + pDraw.starMagB;
        x = 180+(m+1)*40;
        let dx = -20;
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
    let canvas = document.getElementById('loc'+loc);
    let rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    let hit = false;
    let i, tip;
    for (i=0; i < tips[loc-1].length; i++) {
        tip = tips[loc-1][i];
        let dx = x - tip.x;
        let dy = y - tip.y;
        if (dx*dx + dy*dy < tip.r2) {
            hit = true;
            break;
        }
    }
    if (hit) {
        let tipId = "#tip"+loc;
        let tipText = tipId+"text";
        $(tipText).empty();
        // set up pararameters to be passed to the functions 
        // that displays the popup...
        // Sidereal times, latitude
        let d,long,lat,UT_offset;
        if (loc==1) {
            d = date1;
            long = long1;
            lat = lat1*Math.PI/180;
            UT_offset = -tz1.tz/60;
        } else {
            d = date2;
            long = long2;
            lat = lat2*Math.PI/180;
            UT_offset = -tz2.tz/60;
        }
        let hours = d.h + d.m/60 + d.s/3600;
        // sidereal time at midnight local time; used to compute
        // rise and set times
        let LST0 = d.LST_rad - 1.00273781191135448*hours*Math.PI/12;
        LST0 -= 2*Math.PI*Math.floor(LST0*0.5/Math.PI);
        let para = {loc:loc, lat:lat, LST:d.LST_rad, LST0:LST0, 
                   T:d.T, dT:d.dT, hours:hours, LMT:hours-UT_offset+long/15};
        // Nutation (only calculate when -50 < TD < 10)
        let TD = d.T+d.dT;
        if (TD > -50 && TD < 10) {
            para.nu = nutation(TD);
            para.LAST = para.LST;
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
    let id = "#"+idn;
    $(id).hide();
    $(id+"text").empty();
    $(id).css("left","-200px");
}

// Display popup box for the Sun
function displayPopupSun(tip,para) {
    let sun;
    let calculate = [false,false,true,false,false,false,false,false];
    let TD = para.T+para.dT;
    if (highPrecCalInTips) {
        sun = planetGeoVSOP(TD, "Sun", false);
    } else {
        sun = planetPos(TD, calculate)[2];
    }
    // ra and dec wrt J2000
    let rad_to_deg = 180/Math.PI, rad_to_hr = 12/Math.PI;
    let ra2000 = convertDM(sun.ra2000*rad_to_hr, "hm");
    let dec2000 = convertDM(sun.dec2000*rad_to_deg, "dm");
    // Topocentric Ra and Dec
    let cosLat = Math.cos(para.lat);
    let sinLat = Math.sin(para.lat);
    let raDec, topo;
    let LST = para.LST;
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
    let aber = {ra:topo.raTopo, dec:topo.decTopo};
    if ("nu" in para) {
        let aberpara = {T:TD, m:para.nu, LAST:para.LAST, 
                        cosLat:cosLat, sinLat:sinLat};
        aber = aberration(topo.raTopo, topo.decTopo, aberpara);
    }
    let raTopo = convertDM(aber.ra*rad_to_hr, "hm");
    let decTopo = convertDM(aber.dec*rad_to_deg, "dm");
    let p = precession_matrix(TD,-TD);
    if ("nu" in para) {
        // Remove nutation from the topocentric position first
        let inv_nu = {p11:para.nu.p11, p12:para.nu.p21, 
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
    let conNames = constellationAbbrNames();
    let conste = conNames[get_constellation(raDec.ra, raDec.dec)];
    let ra2000Topo = convertDM(raDec.ra*rad_to_hr, "hm");
    let dec2000Topo = convertDM(raDec.dec*rad_to_deg, "dm");
    // Equation of time 
    let asuntime = (LST - aber.ra)*rad_to_hr + 12;
    asuntime -= 24*Math.floor(asuntime/24);
    let EOT = asuntime - para.LMT;
    EOT -= 24*Math.floor(EOT/24 + 0.5);
    let aEOT = Math.abs(EOT) + 0.5/3600;
    let EOTm = Math.floor(60*aEOT);
    let EOTs = Math.floor(60*(60*aEOT - EOTm));
    let EOTc = (EOT < 0 ? '-'+EOTm:EOTm)+'<sup>m</sup>'+(EOTs < 10 ? '0'+EOTs:EOTs)+'<sup>s</sup>';
    asuntime = convertDM(asuntime, "hm");
    // Angular diameter at 1 AU (arcmin)
    let ang1AU = 31.965; 
    let ang = ang1AU / sun.rGeo;
    // Alt and Azimuth
    raDec = {ra:aber.ra, dec:aber.dec};
    let hor = ra_dec_to_alt_az(raDec, LST, cosLat,sinLat);
    let alt = (hor.alt + atmosphericRefraction(hor.alt, 101, 286))*rad_to_deg;
    let azi = Math.atan2(hor.sinA,hor.cosA)*rad_to_deg + 180;
    alt = alt.toFixed(2)+"&deg;";  azi = azi.toFixed(2)+"&deg;";
    // rise, set and transit
    let T0 = TD - para.hours/876600;
    let ra = [], dec = [];
    for (let i=0; i<25; i++) {
        sun = planetPos(T0+i/876600,calculate)[2];
        ra[i] = sun.ra; dec[i] = sun.dec;
    }
    let tt = getTransitTime(para.LST0,para.lat,ra,dec, false);
    let Transit = tt.t+' ('+tt.alt+')';
    let alt1 = -0.01454441043328608; // -50' in radians
    let trs = getRiseSet(alt1,para.LST0,para.lat,ra,dec);
    let RiseSet = trs.rise+" ("+trs.azRise+"), "+trs.set;
    if (trs.rise=="above") {
        RiseSet = "circumpolar";
    }
    //Twilights
    alt1 = -0.1047197551196598; // -6 deg in rad
    trs = getRiseSet(alt1,para.LST0,para.lat,ra,dec);
    let civ = trs.rise+', '+trs.set;
    if (trs.rise=="above") {
        civ = "above -6&deg;";
    }
    alt1 = -0.2094395102393196; // -12 deg in rad
    trs = getRiseSet(alt1,para.LST0,para.lat,ra,dec);
    let nat = trs.rise+', '+trs.set;
    if (trs.rise=="above") {
        nat = "above -12&deg;";
    }
    alt1 = -0.3141592653589793; // -18 deg in rad
    trs = getRiseSet(alt1,para.LST0,para.lat,ra,dec);
    let ast = trs.rise+', '+trs.set;
    if (trs.rise=="above") {
        ast = "above -18&deg;";
    }
    
    let txt ="<table>";
    txt += '<tr><th colspan="2">Sun</th></tr>';
    txt += '<tr><td>Distance</td> <td>'+sun.rGeo.toFixed(3)+' AU</td></tr>';
    txt += '<tr><td>Angular Diameter</td> <td>'+ang.toFixed(1)+
        "'</td></tr>";
    txt += '<tr><td>Geocentric Ra, Dec (J2000)</td> <td>'+ra2000+', '+dec2000+'</td></tr>';
    txt += '<tr><td>Topocentric Ra, Dec (J2000)</td> <td>'+ra2000Topo+', '+dec2000Topo+'</td></tr>';
    if ("nu" in para) {
        txt += '<tr><td>App. Topo. Ra, Dec (of date)</td> <td>'+raTopo+', '+decTopo+'</td></tr>';
    } else {
        txt += '<tr><td>Topocentric Ra, Dec (of date)</td> <td>'+raTopo+', '+decTopo+'</td></tr>';
    }
    txt += '<tr><td>Apparent Sidereal Time</td> <td>'+convertDM(para.LST*12/Math.PI,"hm")+'</td></tr>';
    txt += '<tr><td>Apparent solar time</td><td>'+asuntime+'</td></tr>';
    txt += '<tr><td>Equation of time</td><td>'+EOTc+'</td></tr>';
    txt += '<tr><td>Constellation</td><td>'+conste+'</td></tr>';
    txt += '<tr><td>Altitude, Azimuth</td> <td>'+alt+', '+azi+'</td></tr>';
    txt += '<tr><td>Rise (Azi), Set</td> <td>'+RiseSet+'</td></tr>';
    txt += '<tr><td>Upper Transit (Altitude)</td> <td>'+Transit+'</td></tr>';
    txt += '<tr><td>Civ. Twi. beg., end</td> <td>'+civ+'</td></tr>';
    txt += '<tr><td>Nat. Twi. beg., end</td> <td>'+nat+'</td></tr>';
    txt += '<tr><td>Ast. Twi. beg., end</td> <td>'+ast+'</td></tr>';
    txt += '</table>';
    
    let tipText = "#tip"+para.loc+"text";
    $(tipText).append(txt);
}

// Display popup box for the Moon
function displayPopupMoon(tip,para) {
    let moon,sun, Dmoon, Lmoon, Lsun, Dsun;
    let TD = para.T+para.dT;
    if (highPrecCalInTips) {
        moon = MoonPosElpMpp02(TD, true);
        Dmoon = moon.rGeo;
        let calculate = [false,false,true,false,false,false,false,false];
        sun = planetPos(TD, calculate)[2];
        Dsun = sun.rGeo;
        Lsun = sun.lam2000;
        Lmoon = moon.lam2000;
    } else {
        moon = MediumMoon(TD);
        sun = MiniSun(TD);
        Dsun = 1.0;
        Lsun = sun.lam;
        Lmoon = moon.lam;
        Dmoon = moon.rGeo;
    }
    let rad_to_deg = 180/Math.PI, rad_to_hr = 12/Math.PI;
    let cosLat = Math.cos(para.lat);
    let sinLat = Math.sin(para.lat);
    // Geocentric ra and dec 
    // Note that both light-time and annual aberration of light 
    // are included
    let geoRa2000 = convertDM(moon.ra2000*rad_to_hr, "hm");
    let geoDec2000 = convertDM(moon.dec2000*rad_to_deg, "dm");
    // Geocentric -> Topocentric
    let raDec, topo;
    let LST = para.LST;
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
    // Correct for diurnal aberration of light
    let aber = {ra:topo.raTopo, dec:topo.decTopo};
    if ("nu" in para) {
        let omega = 7.292115855264215e-5; // Earth's spin ang. velocity
        // Earth's equatorial spin speed / c
        let a = omega*6378.1366/299792.458; 
        // (1-f)^2, where f = 1/298.25642 
        let f1_f2 = 0.9933056020041341;
        let aC_cosLat = cosLat * a/Math.sqrt(cosLat*cosLat + f1_f2*sinLat*sinLat);
        let betax = -aC_cosLat*Math.sin(para.LAST);
        let betay = aC_cosLat*Math.cos(para.LAST);
        let x = Math.cos(aber.ra)*Math.cos(aber.dec) + betax;
        let y = Math.sin(aber.ra)*Math.cos(aber.dec) + betay;
        let z = Math.sin(aber.dec);
        let norm = Math.sqrt(x*x + y*y + z*z);
        aber.ra = Math.atan2(y,x); 
        aber.dec = Math.asin(z/norm)
    }
    let topoRa = convertDM(aber.ra*rad_to_hr, "hm");
    let topoDec = convertDM(aber.dec*rad_to_deg, "dm");
    let rTopo = topo.rTopo;
    // topocentric ra and dec wrt J2000
    let p = precession_matrix(TD,-TD);
    if ("nu" in para) {
        // Remove nutation from the topocentric position first
        let inv_nu = {p11:para.nu.p11, p12:para.nu.p21, 
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
    let conNames = constellationAbbrNames();
    let conste = conNames[get_constellation(raDec.ra, raDec.dec)];
    let topoRa2000 = convertDM(raDec.ra*rad_to_hr,"hm");
    let topoDec2000 = convertDM(raDec.dec*rad_to_deg,"dm"); 
    // Alt and Azimuth
    raDec = {ra:aber.ra, dec:aber.dec};
    let hor = ra_dec_to_alt_az(raDec, LST, cosLat,sinLat);
    // add atm refraction
    let alt = (hor.alt + atmosphericRefraction(hor.alt, 101, 286))*rad_to_deg;
    let azi = Math.atan2(hor.sinA,hor.cosA)*rad_to_deg + 180;
    alt = alt.toFixed(2)+"&deg;";  azi = azi.toFixed(2)+"&deg;";
    // illumination, phase and apparent magnitude
    let illumPhase = moonIlluminated(sun.ra,sun.dec,topo.raTopo,topo.decTopo, 
                                     Lsun,Lmoon, rTopo, Dsun);
    let illum = illumPhase.illuminated.toFixed(2);
    let phase = illumPhase.phase;
    let elong = illumPhase.elongTxt;
    let mag = illumPhase.mag.toFixed(1);
    // rise, transit and set
    let T0 = TD - para.hours/876600;
    let ra = [], dec = [];
    for (let i=0; i<25; i++) {
        moon = MediumMoon(T0 + i/876600);
        ra[i] = moon.ra; dec[i] = moon.dec;
    }
    let tt = getTransitTime(para.LST0,para.lat,ra,dec, true);
    let Transit = tt.t+' ('+tt.alt+')';
    let alt1 = 0.002327105669325773; // 8' in radians
    let trs = getRiseSet(alt1,para.LST0,para.lat,ra,dec);
    let Rise = trs.rise+" ("+trs.azRise+")";
    let Set = trs.set+" ("+trs.azSet+")";
    if (trs.rise=="above") {
        Rise = "circumpolar";
        Set = "circumpolar";
    }
    let svgp = {sunRa:sun.ra, sunDec:sun.dec, ra:aber.ra, dec:aber.dec, cosi:illumPhase.cosi, 
        alt:hor.alt, sinA:-hor.sinA, sinLat:sinLat, cosLat:cosLat, size:150};
    
    let txt ="<table>";
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
    } else {
        txt += '<tr><td>Topocentric Ra, Dec (of date)</td> <td>'+topoRa+', '+topoDec+'</td></tr>';
    }
    txt += '<tr><td>Apparent Sidereal Time</td> <td>'+convertDM(para.LST*12/Math.PI,"hm")+'</td></tr>';
    txt += '<tr><td>Constellation</td><td>'+conste+'</td></tr>';
    txt += '<tr><td>Altitude, Azimuth</td> <td>'+alt+', '+azi+'</td></tr>';
    txt += '<tr><td>Rise (Azimuth)</td> <td>'+Rise+'</td></tr>';
    txt += '<tr><td>Upper Transit (Altitude)</td> <td>'+Transit+'</td></tr>';
    txt += '<tr><td>Set (Azimuth)</td> <td>'+Set+'</td></tr>';
    txt += '<tr><td colspan="2">Phase Appearance (zenith is up)<br />'+generate_svg_phase(svgp)+'</td></tr>';
    txt += '</table>';
    
    let tipText = "#tip"+para.loc+"text";
    $(tipText).append(txt);
}

// Display popup box for a planet
function displayPopupPlanet(tip,para) {
    let calculate = [false,false,true,false,false,false,false,false];
    let ind = tip.pIndex-1;
    if (tip.pIndex < 4) { ind--;}
    calculate[ind] = true;
    let TD = para.T+para.dT;
    let planet, sun;
    if (highPrecCalInTips) {
        planet = planetGeoVSOP(TD, tip.object, true);
        sun = {rGeo:planet.dSunEarth, ra:planet.raSun, dec:planet.decSun,
               lam2000:planet.lamSun2000, bet2000:planet.betSun2000};
    } else {
        let planets = planetPos(TD, calculate);
        planet = planets[ind];
        sun = planets[2];
    }
    let rHelio = planet.rHelio, rGeo = planet.rGeo;
    // ra and dec wrt J2000
    let rad_to_deg = 180/Math.PI, rad_to_hr = 12/Math.PI;
    let ra2000 = convertDM(planet.ra2000*rad_to_hr, "hm");
    let dec2000 = convertDM(planet.dec2000*rad_to_deg, "dm");
    // Topocentric Ra and Dec
    let cosLat = Math.cos(para.lat);
    let sinLat = Math.sin(para.lat);
    let raDec, topo;
    let LST = para.LST;
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
    let aber = {ra:topo.raTopo, dec:topo.decTopo};
    if ("nu" in para) {
        let aberpara = {T:TD, m:para.nu, LAST:para.LAST, 
                        cosLat:cosLat, sinLat:sinLat};
        aber = aberration(topo.raTopo, topo.decTopo, aberpara);
    }
    let raTopo = convertDM(aber.ra*rad_to_hr, "hm");
    let decTopo = convertDM(aber.dec*rad_to_deg, "dm");
    let p = precession_matrix(TD,-TD);
    if ("nu" in para) {
        // Remove nutation from the topocentric position first
        let inv_nu = {p11:para.nu.p11, p12:para.nu.p21, 
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
    let conNames = constellationAbbrNames();
    let conste = conNames[get_constellation(raDec.ra, raDec.dec)];
    let ra2000Topo = convertDM(raDec.ra*rad_to_hr, "hm");
    let dec2000Topo = convertDM(raDec.dec*rad_to_deg, "dm");
    // Elongation and fraction of planet illuminated
    let elongIllum = elongationPhase(planet,sun);
    let Elong = elongIllum.elongation;
    let illum = elongIllum.illuminated;
    // apparent magnitude
    let magPara = {object:tip.object, i:elongIllum.phaseAng, 
                   rHelio:rHelio, rGeo:rGeo, 
                   T:TD, planet:planet, sun:sun};
    let mag = planetMag(magPara);
    // angular size (arcsec)
    let ang1AU = {Mercury:6.726865375887558, 
                  Venus:16.68838398040351,
                  Mars:9.3468517633725, 
                  Jupiter:192.785883944279362, 
                  Saturn:160.579988754892298, 
                  Uranus:69.938001009781189,
                  Neptune:67.897384309708713};
    let ang = ang1AU[tip.object]/rGeo;
    // Alt and Azimuth
    raDec = {ra:aber.ra, dec:aber.dec};
    let hor = ra_dec_to_alt_az(raDec, LST, cosLat,sinLat);
    let alt = (hor.alt + atmosphericRefraction(hor.alt, 101, 286))*rad_to_deg;
    let azi = Math.atan2(hor.sinA,hor.cosA)*rad_to_deg + 180;
    alt = alt.toFixed(2)+"&deg;";  azi = azi.toFixed(2)+"&deg;";
    let svgp = {sunRa:sun.ra, sunDec:sun.dec, ra:aber.ra, dec:aber.dec, cosi:elongIllum.cosi, 
        alt:hor.alt, sinA:-hor.sinA, sinLat:sinLat, cosLat:cosLat, size:150};
    // rise ans set
    let ra=[], dec=[];
    let T0 = TD - para.hours/876600;
    calculate[2] = false; // no need to calculate the Sun's positions
    for (let i=0; i<25; i++) {
        planet = planetPos(T0+i/876600,calculate)[ind];
        ra[i] = planet.ra; dec[i] = planet.dec;
    }
    let tt = getTransitTime(para.LST0,para.lat,ra,dec, false);
    let Transit = tt.t+' ('+tt.alt+')';
    let alt1 = -0.009890199094634533; // -34' in radians
    let trs = getRiseSet(alt1,para.LST0,para.lat,ra,dec);
    let RiseSet = trs.rise+" ("+trs.azRise+"), "+trs.set;
    if (trs.rise=="above") {
        RiseSet = "circumpolar";
    }
    
    let tipText = "#tip"+para.loc+"text";
    let txt ="<table>";
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
    } else {
        txt += '<tr><td>Topocentric Ra, Dec (of date)</td> <td>'+raTopo+', '+decTopo+'</td></tr>';
    }
    txt += '<tr><td>Apparent Sidereal Time</td> <td>'+convertDM(para.LST*12/Math.PI,"hm")+'</td></tr>';
    txt += '<tr><td>Constellation</td><td>'+conste+'</td></tr>';
    txt += '<tr><td>Altitude, Azimuth</td> <td>'+alt+', '+azi+'</td></tr>';
    txt += '<tr><td>Rise (Azi), Set</td> <td>'+RiseSet+'</td></tr>';
    txt += '<tr><td>Upper Transit (Altitude)</td> <td>'+Transit+'</td></tr>';
    // Add svg phase image of the planet for mercury, Venus and Mars
    if (ind==0 || ind==1 || ind==3) {
        txt += '<tr><td colspan="2">Phase Appearance (zenith is up)<br />'+generate_svg_phase(svgp)+'</td></tr>';
    }
    txt += '</table>';

    $(tipText).append(txt);
}

// Display popup box for stars
function displayPopupStar(tip, para) {
    let stars = brightStars();
    let s = stars[tip.starInd]; // this star
    // ra and dec at current time
    let TD = para.T + para.dT; 
    let T0 = stars[0].Tepoch;
    let dcen = TD-T0;
    // correct for proper motion
    let x = s.x + s.vx*dcen;
    let y = s.y + s.vy*dcen;
    let z = s.z + s.vz*dcen;
    let distpc = Math.sqrt(x*x + y*y + z*z);
    
    // Correct for annual parallax
    if (TD > -50 && TD < 10) {
        let calculate = [false,false,true,false,false,false,false,false];
        let sun = planetPos(TD, calculate)[2];
        let rpc = sun.rGeo*Math.PI/648000; // dist. from Sun in pc
        let xe = -rpc*Math.cos(sun.ra2000)*Math.cos(sun.dec2000);
        let ye = -rpc*Math.sin(sun.ra2000)*Math.cos(sun.dec2000);
        let ze = -rpc*Math.sin(sun.dec2000);
        x -= xe;
        y -= ye;
        z -= ze;
        distpc = Math.sqrt(x*x + y*y + z*z);
    }

    // ra and dec wrt J2000.0 (after correcting for proper motion)
    let rad_to_deg = 180/Math.PI, rad_to_hr = 12/Math.PI;
    let ra2000r = Math.atan2(y,x), dec2000r = Math.asin(z/distpc);
    let ra2000 = convertDM(ra2000r*rad_to_hr, "hm");
    let dec2000 = convertDM(dec2000r*rad_to_deg, "dm");
    let conNames = constellationAbbrNames();
    //let conste = conNames[s.con];
    let conste = conNames[get_constellation(ra2000r,dec2000r)];
    let conste2000 = conNames[s.con];
    if (conste != conste2000) {
        conste = conste2000+' (2000), '+conste+' (';
        conste += (para.loc==1 ? date1.yyyy:date2.yyyy)+')';
    }
    // precession and nutation
    let p = precession_matrix(T0,dcen);
    let LST = para.LST;
    if ("nu" in para) {
        // Add nutation
        LST = para.LAST;
        let p11 = para.nu.p11*p.p11 + para.nu.p12*p.p21 + para.nu.p13*p.p31;
        let p12 = para.nu.p11*p.p12 + para.nu.p12*p.p22 + para.nu.p13*p.p32;
        let p13 = para.nu.p11*p.p13 + para.nu.p12*p.p23 + para.nu.p13*p.p33;
        let p21 = para.nu.p21*p.p11 + para.nu.p22*p.p21 + para.nu.p23*p.p31;
        let p22 = para.nu.p21*p.p12 + para.nu.p22*p.p22 + para.nu.p23*p.p32;
        let p23 = para.nu.p21*p.p13 + para.nu.p22*p.p23 + para.nu.p23*p.p33;
        let p31 = para.nu.p31*p.p11 + para.nu.p32*p.p21 + para.nu.p33*p.p31;
        let p32 = para.nu.p31*p.p12 + para.nu.p32*p.p22 + para.nu.p33*p.p32;
        let p33 = para.nu.p31*p.p13 + para.nu.p32*p.p23 + para.nu.p33*p.p33;
        p = {p11:p11, p12:p12, p13:p13, p21:p21, p22:p22, p23:p23, 
             p31:p31, p32:p32, p33:p33};
    }
    let x1 = p.p11*x + p.p12*y + p.p13*z;
    let y1 = p.p21*x + p.p22*y + p.p23*z;
    let z1 = p.p31*x + p.p32*y + p.p33*z;
    let ra = Math.atan2(y1,x1);
    let dec = Math.asin(z1/distpc);
    // Correct for aberration of light
    if ("nu" in para) {
        let aberpara = {T:TD, m:para.nu, LAST:para.LAST, 
                        cosLat:Math.cos(para.lat), 
                        sinLat:Math.sin(para.lat)};
        let raDec = aberration(ra,dec, aberpara);
        ra = raDec.ra; dec = raDec.dec;
    }
    let raStr = convertDM(ra*rad_to_hr, "hm");
    let decStr = convertDM(dec*rad_to_deg, "dm");

    let txt = "<table>";
    let name = s.name;
    let dist2000 = s.dist2000;
    let distly = distpc*3.2616;
    // round distance to 3 sig. fig.
    let dist, varmag="";
    if (dist2000 >= 9.9e4) {
        dist = "?"; 
    } else {
        dist = distpc.toPrecision(4)+" pc ("+distly.toPrecision(4)+" ly)";
    }
    if ("bayer" in s && name.slice(0,1) != "<") {
        name += ", "+s.bayer+" "+s.con;
    }
    let mag = s.mag.toFixed(2);
    let magStr = "Mag.";
    let delMag = 0;
    if (s.dist2000 < 9.9e4) {
        let absmag = s.mag + 5 - 5*Math.LOG10E*Math.log(s.dist2000);
        // correct mag. as a result of change in distance
        delMag = 5*Math.LOG10E*Math.log(distpc/s.dist2000);
        mag = s.mag + delMag;
        magStr += ", Abs. Mag.";
        mag = mag.toFixed(2)+", "+absmag.toFixed(2);
    }
    if ("varMax" in s && "varMin" in s) {
        let varMax = parseFloat(s.varMax)+delMag;
        let varMin = parseFloat(s.varMin)+delMag;
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
    txt += '<tr><td>Constellation</td> <td>'+conste+'</td></tr>';
    txt += "<tr><td>Ra, Dec (J2000)</td> <td>"+ra2000+", "+dec2000+"</td></tr>";
    if ("nu" in para) {
        txt += '<tr><td>App. Ra, Dec (of date)</td> <td>'+raStr+', '+decStr+'</td></tr>';
    } else {
        txt += "<tr><td>Ra, Dec (of date)</td> <td>"+raStr+", "+decStr+"</td></tr>";
    }
    txt += '<tr><td>Apparent Sidereal Time</td> <td>'+convertDM(para.LST*12/Math.PI,"hm")+'</td></tr>';
    
    // Alt and Azimuth
    let raDec = {ra:ra, dec:dec};
    let cosLat = Math.cos(para.lat);
    let sinLat = Math.sin(para.lat);
    let hor = ra_dec_to_alt_az(raDec, LST, cosLat,sinLat);
    let alt = (hor.alt + atmosphericRefraction(hor.alt, 101, 286))*rad_to_deg;
    let azi = Math.atan2(hor.sinA,hor.cosA)*rad_to_deg + 180;
    txt += "<tr><td>Alt, Azimuth</td> <td>"+alt.toFixed(2)+"&deg;, "+azi.toFixed(2)+"&deg;</td></tr>";
    
    // rise, set and transit times
    alt = -0.009890199094634533; // -34' in radians
    let t = riseSetStar(para.LST0, alt, para.lat, ra, dec);
    let transit = t.transit+' ('+t.altTransit+')';
    txt += '<tr><td>Upper Transit (Alt)</td> <td>'+transit+'</td></tr>';
    let riseSet = t.rise+' ('+t.azRise+'), '+t.set;
    if (t.rise=="above") {
        riseSet = "circumpolar";
    }
    txt += '<tr><td>Rise (Azi), Set</td> <td>'+riseSet+'</td></tr>';
    
    txt += '</table>'
    
    let tipText = "#tip"+para.loc+"text";
    $(tipText).append(txt);
}

function generate_svg_moon_phase(Lmoon, Lsun, cosi, size) {
    let a = size*0.475, b = Math.abs(cosi)*a, hs = 0.5*size;
    a = parseFloat(a.toFixed(3));
    b = parseFloat(b.toFixed(3));
    let ytop = hs - a, ybottom = hs + a;
    let dL = Lmoon - Lsun;
    dL -= 2*Math.PI*Math.floor(0.5*dL/Math.PI + 0.5);
    let s = '<svg height="'+size+'" width="'+size+'">';
    let color_illum = 'white', color_black = '#696969';
    if (cosi <= 0) {
        s += '<circle cx="'+hs+'" cy="'+hs+'" r="'+a+'" fill="'+color_illum+'" stroke="none" />';
        let sweep = (dL > 0 ? 0:1);
        s += '<path d="M '+hs+' '+ytop+' A '+a+' '+a+' 0 0 '+sweep+' '+hs+' '+ybottom+' A '+b+' '+a+' 0 0 '+sweep+' '+hs+' '+ytop+'" fill="'+color_black+'" stroke="none" />';
    } else {
        s += '<circle cx="'+hs+'" cy="'+hs+'" r="'+a+'" fill="'+color_black+'" stroke="none" />';
        let sweep = (dL > 0 ? 0:1);
        s += '<path d="M '+hs+' '+ytop+' A '+b+' '+a+' 0 0 '+sweep+' '+hs+' '+ybottom+' A '+a+' '+a+' 0 0 '+sweep+' '+hs+' '+ytop+'" fill="'+color_illum+'" stroke="none" />';
    }
    s += '<circle cx="'+hs+'" cy="'+hs+'" r="'+a+'" stroke="'+color_black+'" fill="none" /></svg>';
    return s;
}

function generate_svg_phase(p) {
    let shdalp = Math.sin(0.5*(p.sunRa - p.ra)), sdec = Math.sin(p.dec);
    let chi = Math.atan2(Math.cos(p.sunDec)*Math.sin(p.sunRa - p.ra), 
    Math.sin(p.sunDec-p.dec) + 2*Math.cos(p.sunDec)*sdec*shdalp*shdalp);
    let w = Math.atan2(p.cosLat*p.sinA, (p.sinLat - sdec*Math.sin(p.alt))/Math.cos(p.alt));
    if (Math.abs(Math.abs(p.alt) - Math.PI*0.5) < 1e-10) { w = 0.0;}
    let chiZ = chi + w;
    let cchi = Math.cos(chiZ), schi = Math.sin(chiZ);
    let a = p.size*0.3, hs = 0.5*p.size;
    let x1 = hs - cchi*a, y1 = hs + a*schi, x2 = hs + cchi*a, y2 = hs - a*schi;
    let b = a*Math.abs(p.cosi);
    let color_illum = 'white', color_black = '#696969';
    let r2d = 180/Math.PI;
    let svg = '<svg width="'+p.size+'" height="'+p.size+'">';
    svg += '<circle cx="'+hs+'" cy="'+hs+'" r="'+a+'" fill="'+color_black+'" stroke="none" />';
    if (p.cosi >= 0) {
        svg += '<path d="M '+x1+' '+y1+' A '+a+' '+b+' '+(-chiZ*r2d)+' 0 0 '+x2+' '+y2+' A '+a+' '+a+' 0 0 0 '+x1+' '+y1+'" fill="'+color_illum+'" stroke="none" />';
    } else {
        svg += '<path d="M '+x1+' '+y1+' A '+a+' '+b+' '+(-chiZ*r2d)+' 0 1 '+x2+' '+y2+' A '+a+' '+a+' 0 0 0 '+x1+' '+y1+'" fill="'+color_illum+'" stroke="none" />';
    }
    svg += '<circle cx="'+hs+'" cy="'+hs+'" r="'+a+'" stroke="'+color_black+'" fill="none" />';
    // Label north direction 
    let sw = Math.sin(w), cw = Math.cos(w);
    let xn1 = hs - a*sw, yn1 = hs - a*cw;
    let xn2 = hs - 1.125*a*sw, yn2 = hs - 1.125*a*cw;
    let xt = hs - 1.2*a*sw - 5*cw, yt = hs - 1.2*a*cw + 5*sw;
    svg += '<path d="M '+xn1+' '+yn1+' L '+xn2+' '+yn2+'" stroke="'+color_black+'" />';
    svg += '<text x="'+xt+'" y="'+yt+'" fill="black" rotate="'+(-w*r2d)+'">N</text>';
    svg += '</svg>';
    return svg;
}

// Set up parameters for drawing stars and planets
function setupDrawingParameters() {
    // Set the colors, sizes of dots of the planets on the star chart
    // and also the coordinate offsets of the planet symbols
    // planet order: Sun, Moon, Mercury, Venus, Mars, Jupiter, Uranus, Neptune
    let pColor = ["red", "orange", "maroon","#FF00FF","red",
                 "brown","brown","#7277e6","#7277e6"];
    let pName = ["Sun","Moon","Mercury","Venus","Mars",
                "Jupiter","Saturn","Uranus","Neptune"];
    let pSize = [1, 2, 1,2,2,2,2,2,2];
    let pCode = [9788,9789,9791,9792,9794,9795,9796,9954,9798];
    let offset = [{x:-10, y:7}, {x:-10, y:7}, {x:-5, y:7}, 
                {x:-7, y:0}, {x:-7, y:2}, {x:-10, y:7}, 
                {x:-5, y:7}, {x:-10, y:3}, {x:-8, y:5}];
    // parameters setting the size of the star
    // size = a*m+b, m = magnitude of the star
    // set a and b so that size = s1 for m=5 and s2 for m=-1.5
    let s1 = 1, s2 = 5;
    let a = (s1-s2)/6.5;
    let b = s1-5*a;

    let pDraw = {color:pColor, code:pCode, size:pSize, offset:offset, pName:pName,
                starMagA:a, starMagB:b};
    return(pDraw);
}
