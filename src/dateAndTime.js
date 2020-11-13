"use strict";

// Compute D (number of days from J2000) at midnight 
// local time from yyyy, mm, dd, tz (year, month, date, timezone offset)
function getDm(yyyy,mm,dd,tz) {
    var dfrac = tz/1440;
    var m1 = mm, yy = yyyy;
    if (m1 <= 2) {m1 +=12; yy--;}
    var b;
    if (10000*yy+100*m1+dd <= 15821004) {
        // Julian calendar
        b = -2 + Math.floor((yy+4716)/4) - 1179;
    } else {
        // Gregorian calendar
        b = Math.floor(yy/400) - Math.floor(yy/100) + Math.floor(yy/4);
    }
    var D0 = 365*yy - 679004 + b + Math.floor(30.6001*(m1+1)) + dd - 51544.5;
    return(D0 + dfrac);
}

//----------------------------------------------------------
// CalDat: Calendar date and time from D (number of days 
// from J2000)
// 
// yy,mm,dd Calendar date components
// h, m, s hour, min, sec.
// 
// Ported from Astronomy on Personal Computer, p. 15-16
//-------------------------------------------------
function CalDat(D) {
    var a,b,c,d,e,f;
    // Convert Julian day number to calendar date
    a = Math.floor(D + 2451545.5);
    if (a < 0) {
        return CalDatNegativeJD(D + 2451545);
    }
    if (a < 2299161) { //Julian calendar
        b = 0; c = a+1524;
    } else { // Gregorian calendar
        b = Math.floor((a-1867216.25)/36524.25);
        c = a + b - Math.floor(0.25*b) + 1525;
    }
    d = Math.floor((c-122.1)/365.25);
    if (d < 0) {d++;}
    e = 365*d + Math.floor(0.25*d);
    f = Math.floor((c-e)/30.6001);
    if (f < 0) {f++;}
    var dd = c-e - Math.floor(30.6001*f);
    var mm = f - 1 - 12*Math.floor(f/14+1e-5);
    var yy = d - 4715 - Math.floor((7+mm)/10+1e-5);
    var dateString = generateDateString(yy,mm,dd);
    var FracOfDay = D - Math.floor(D+0.5) + 0.5;
    var Hour = 24*FracOfDay;
    var h = Math.floor(Hour);
    var m = Math.floor(60*(Hour-h));
    var s = (Hour - h - m/60)*3600;
    var timeString = generateTimeString(h,m,s);
    return {yy:yy, mm:mm, dd:dd, h:h, m:m, s:s, 
           dateString:dateString, timeString:timeString};
}

//----------------------------------------------------------
// CalDat: Calendar date and time from Julian date JD with JD<0
// 
// yy,mm,dd Calendar date components
// h, m, s hour, min, sec.
// 
//-------------------------------------------------
function CalDatNegativeJD(jd) {
    var mjd = -Math.floor(jd+0.5);
    var md = mjd - Math.floor(mjd/1461);
    var dyear = Math.floor(md/(365+1e-10)) + 1;
    var yyyy = -4712 - dyear;
    var mjd0 = dyear*365 + Math.floor(dyear/4) + 1;
    var dFromY = mjd0 - mjd;
    var monthTable;
    if (dyear % 4 ==0) {
       monthTable = [0, 31, 60, 91, 121, 152, 182, 213, 244, 
                    274, 305, 335, 366];
    } else {
       monthTable = [0, 31, 59, 90, 120, 151, 181, 212, 243, 
                    273, 304, 334, 365];
    }
    var i,mm,dd;
    for (i=1; i<13; i++) {
        if (dFromY <= monthTable[i]) {
            mm = i;
            dd = dFromY - monthTable[i-1];
            break;
        }
    }
    var dateString = generateDateString(yyyy,mm,dd);
    var FracOfDay = 0.5+ (jd + mjd);
    var Hour = 24*FracOfDay;
    var h = Math.floor(Hour);
    var m = Math.floor(60*(Hour-h));
    var s = (Hour - h - m/60)*3600;
    var timeString = generateTimeString(h,m,s);
    return {yy:yyyy, mm:mm, dd:dd, h:h, m:m, s:s, 
           dateString:dateString, timeString:timeString};
}

// Compute Delta T: difference between Terrestrial time and UT.
// Use the fitting formulas given on 
// http://eclipsewise.com/help/deltatpoly2014.html
// returned Delta T is in century
function DeltaT(T) {
    var y = T*100 + 2000;
    var u,u2,u3,u4,u5,u6,u7, DT;
    if (y > 2015) {
        u = y-2015;
        DT = 67.62 + 0.3645*u + 0.0039755*u*u;
    } else if (y > 2005) {
        u = y-2005;
        DT = 64.69 + 0.2930*u;
    } else if (y > 1986) {
        u = y-2000; u2 = u*u; u3 = u2*u;
        u4 = u2*u2; u5 = u2*u3;
        DT = 63.86 + 0.3345*u - 0.060374*u2 + 0.0017275*u3 + 
            0.000651814*u4 + 0.00002373599*u5;
    } else if (y > 1961) {
        u = y-1975; u2 = u*u; u3=u*u2;
        DT = 45.45 + 1.067*u - u2/260 - u3/718;
    } else if (y > 1941) {
        u = y-1950; u2 = u*u; u3=u*u2;
        DT = 29.07 + 0.407*u - u2/233 + u3/2547;
    } else if (y > 1920) {
        u = y-1920; u2=u*u; u3=u2*u;
        DT = 21.2 + 0.84493*u - 0.0761*u2 + 0.0020936*u3;
    } else if (y > 1900) {
        u = y-1900; u2=u*u; u3=u*u2; u4=u2*u2;
        DT = -2.79 + 1.494119*u - 0.0598939*u2 + 0.0061966*u3 - 0.000197*u4;
    } else if (y > 1860) {
        u = y-1860; 
        u2=u*u; u3=u*u2; u4=u2*u2; u5=u2*u3;
        DT = 7.62 + 0.5737*u - 0.251754*u2 + 
            0.01680668*u3 - 0.0004473624*u4 + 
            u5/233174;
    } else if (y > 1800) {
        u = y-1800; u2=u*u; u3=u*u2; u4=u2*u2;
        u5=u2*u3; u6=u3*u3; u7=u3*u4;
        DT = 13.72 - 0.332447*u + 0.0068612*u2 + 
            0.0041116*u3 - 0.00037436*u4 + 
		    0.0000121272*u5 - 0.0000001699*u6 + 
            0.000000000875*u7;
    } else if (y > 1700) {
        u = y-1700; u2=u*u; u3=u*u2; u4=u2*u2;
        DT = 8.83 + 0.1603*u - 0.0059285*u2 + 
            0.00013336*u3 - u4/1174000;
    } else if (y > 1600) {
        u = y-1600; u2=u*u; u3=u*u2;
        DT = 120 - 0.9808*u - 0.01532*u2 + u3/7129;
    } else if (y > 500) {
        u = 0.01*(y-1000); u2=u*u; u3=u*u2; u4=u2*u2;
        u5=u2*u3; u6=u3*u3;
        DT = 1574.2 - 556.01*u + 71.23472*u2 + 
            0.319781*u3 - 0.8503463*u4 - 
            0.005050998*u5 + 0.0083572073*u6;
    } else if (y > -500) {
        u = 0.01*y; u2=u*u; u3=u*u2; u4=u2*u2;
        u5=u2*u3; u6=u3*u3;
        DT = 10583.6 - 1014.41*u + 33.78311*u2 - 
            5.952053*u3 - 0.1798452*u4 + 
            0.022174192*u5 + 0.0090316521*u6;
    } else {
        u = 0.01*(y-1820);
        DT = -20 + 32*u*u;
    }
    
    return(DT*3.16880878140289e-10);
}

// Generate date string from yyyy, mm and dd:
// return yyyy-mm-dd
function generateDateString(yyyy,mm,dd) {
    var absy = Math.abs(yyyy);
    if (absy < 10) {
        absy = "000"+absy;
    } else if (absy < 100) {
        absy = "00"+absy;
    } else if (absy < 1000) {
        absy = "0"+absy;
    } else {
        absy = absy.toString();
    }
    var yStr = absy;
    if (yyyy < 0) {yStr = "-"+yStr;}
    var mmString = mm.toString();
    if (mm < 10) {mmString = "0"+mmString;}
    var ddString = dd.toString();
    if (dd < 10) {ddString = "0"+ddString;}
    return yStr+"-"+mmString+"-"+ddString;
}

// Generate time string from h,m,s: 
// return hh:mm:ss 
function generateTimeString(h,m,s) {
    var hround = h + m/60 + (s+0.5)/3600;
    var hh = Math.floor(hround);
    var mm = Math.floor((hround-hh)*60);
    var ss= Math.floor(3600*(hround-hh-mm/60));
    hh = hh.toString(); mm = mm.toString(); ss = ss.toString();
    if (hh.length < 2) {hh = "0"+hh;}
    if (mm.length < 2) {mm = "0"+mm;}
    if (ss.length < 2) {ss = "0"+ss;}
    return hh+":"+mm+":"+ss;
}

function showHide(name) {
    $("#show"+name).toggleClass("active");
    starCharts();
}

// sanity check
// If there are errors, print message in red at the place 
// indicated by the id errid
function sanityCheck(x,inputId,min,max,message,errid) {
    $(inputId).css("background-color", "white");
    if (isNaN(x) || x < min || x > max) {
        $(inputId).css("background-color", "#e2a8a8");
        var text = '<p style="color:red;">'+message+'</p>';
        $(errid).append(text);
    }
}

// x -> xD+'separator'+xM+'separator'+xS
// If type == "hm", return hour+"<sup>h</sup>"+minute+"<sup>m</sup>"+second+"<sup>s</sup>".
// If type == "dm", return degree+"&deg;"+minute+"'"+second+'"'.
function convertDM(x, type) {
    var xStr,dms,xround,xd,xm,xs;
    if (type=="hm") {
       x -= 24*Math.floor(x/24); 
       xround = x + 0.05/3600; 
    } else {
       xround = Math.abs(x) + 0.5/3600;
    }
    xd = Math.floor(xround);
    xm = Math.floor((xround-xd)*60);
    if (type=="hm") {
        xs = Math.floor((xround-xd-xm/60)*36000);
    } else{
        xs = Math.floor((xround-xd-xm/60)*3600);
    }
    xd = xd.toString(); xm = xm.toString(); xs = xs.toString();
    if (xd.length < 2) {xd = "0"+xd;}
    if (type=="dm" && x < 0) {xd = "-"+xd;}
    if (xm.length < 2) {xm = "0"+xm;}
    if (xs.length < 2) {xs = "0"+xs;}
    if (type=="hm") {
        if (xs.length < 3) {xs = "0"+xs;}
        xStr = xd+"<sup>h</sup>"+xm+"<sup>m</sup>"+xs.slice(0,2)+ "."+xs.slice(2)+"<sup>s</sup>";
    } else {
        xStr = xd+"&deg;"+xm+"'"+xs+'"';
    }
    return xStr;
}
