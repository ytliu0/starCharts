"use strict";

// Set up global variables
var date; // date and time
// Tooltips (popup box, to be more accurate) setup
var tipsEnabled, tips, highPrecCalInTips; 
var magLimitTip = 5.3; // limiting mag. for stars to display popup
// Save stars' positions for the current time
// initialize the arrays
var stars = brightStars(), conLab = constellationLabel();
var conLine = constellationLines();
var magLimit = 5.3; // limiting magnitude
// Save Milky Way boundaries' positions for the current time
// initialize the arrays
var milky = {northernEdge:northernEdge(), 
               southernEdge:southernEdge(), 
               betaCas:betaCas(), thetaOph:thetaOph(), 
               lambdaSco:lambdaSco(), 
               coalsack:coalsack()};

// Set the default animation parameters
var animateDtStep = 1; // number of days per step
var frameRate = 40; // number of milliseconds to update the frame
var animate_id; // variable for animation

// Initial setup
function init() {
    var d = new Date(); // current time from computer's clock
    
    // Set up the object date
    var yyyy = d.getUTCFullYear();
    var mm = d.getUTCMonth()+1;
    var dd = d.getUTCDate();
    var h = d.getUTCHours();
    var m = d.getUTCMinutes();
    var s = d.getUTCSeconds()+1e-3*d.getUTCMilliseconds();
    var dateString = generateDateString(yyyy,mm,dd);
    var timeString = generateTimeString(h,m,s);
    var D = getDm(yyyy,mm,dd,0) + (h+m/60+s/3600)/24;
    var T = D/36525;
    var dT = DeltaT(T);
    date = {yyyy:yyyy, mm:mm, dd:dd, h:h, m:m, s:s,
             dateString:dateString, 
             timeString:timeString, D:D, T:T, dT:dT};
    
    tipsEnabled = true;
    tips = [[], [], []];
    highPrecCalInTips = true;
    $("#canvasNorth").on("click", function(event) {displayPopup(event, "canvasNorth");});
    $("#canvasCentral").on("click", function(event) {displayPopup(event, "canvasCentral");});
    $("#canvasSouth").on("click", function(event) {displayPopup(event, "canvasSouth");});
    
    starCharts();
}

// Display change date and time
function displayChangeTime() {
    var id = "#changeTime";
    $('button.menu').attr("disabled", true);
    $(id).empty();
    $(id).slideDown();
    var txt = "<h2>Change Date and Time</h2>";
    $(id).append(txt);
    txt = '<form name="changeTime" action="" method="get">';
    txt += "<table>";
    txt += '<tr><td>Year: <input type="number" id="yearIn" step="1" min=-200000 max=200000 /></td>';
    txt += '<td>Month: <input type="number" id="monthIn" step="1" min=1 max=12 /></td>';
    txt += '<td>Day: <input type="number" id="dayIn" step="1" min=1 max=31 /></td></tr>';
    txt += '<tr><td>Hour: <input type="number" id="hourIn" step="1" min=0 max=23 /></td>';
    txt += '<td>Minute: <input type="number" id="minuteIn" step="1" min=0 max=59 /></td>';
    txt += '<td>Second: <input type="number" id="secondIn" step="any" min=0 max=60 /> UT</td></tr>';
    txt += '</table><br />';
    txt += '<p><input type="button" value="Submit" onclick="changeTimeAction(this.form)" /></p>';
    txt += '</form>';
    $(id).append(txt); 
    txt = '<div id="changeTimeErrorlocs"></div>'
    $(id).append(txt);
    $("#yearIn").val(date.yyyy);
    $("#monthIn").val(date.mm);
    $("#dayIn").val(date.dd);
    $("#hourIn").val(date.h);
    $("#minuteIn").val(date.m);
    $("#secondIn").val(date.s.toFixed(3));
}

function changeTimeAction(form) {
    var yy = parseInt(form.yearIn.value);
    var mm = parseInt(form.monthIn.value);
    var dd = parseInt(form.dayIn.value);
    var h = parseInt(form.hourIn.value);
    var m = parseInt(form.minuteIn.value);
    var s = parseFloat(form.secondIn.value);
    
    // sanity check
    var errid = "#changeTimeErrorlocs";
    $(errid).empty();
    var min=-200000, max=200000;
    var message = "Invalid year! Please enter an integer between "+min+" and "+max+". Note that 0 means 1 BCE, -1 means 2 BCE and so on. Note that the positions of the Sun, Moon and planets are only accurate for years between -3000 and 3000.";
    sanityCheck(yy,"#yearIn",min,max,message,errid);
    
    min=1; max=12;
    message = "Invalid month! Month must be an integer between 1 and 12.";
    sanityCheck(mm,"#monthIn",min,max,message,errid);
    
    min=1; max=31;
    message = "Invalid day! Day must be an integer between 1 and 31.";
    sanityCheck(dd,"#dayIn",min,max,message,errid);
    
    min=0; max=23;
    message = "Invalid hour! Hour must be an integer between 0 and 23.";
    sanityCheck(h,"#hourIn",min,max,message,errid);
    
    min=0; max=59;
    message = "Invalid minute! Minute must be an integer between 0 and 59.";
    sanityCheck(m,"#minuteIn",min,max,message,errid);
    
    min=0; max=60;
    message = "Invalid second! Second must be a number between 0 and 60.";
    sanityCheck(s,"#secondIn",min,max,message,errid);
    
    if ($(errid).text()=="") {
        var id = "#changeTime";
        $(id).slideUp();
        $(id).empty;
        $('button.menu').attr("disabled", false);
        
        var D = getDm(yy,mm,dd,0);
        var d = CalDat(D);
        var timeString = generateTimeString(h,m,s);
        D += (h + m/60 + s/3600)/24;
        var T = D/36525;
        var dT = DeltaT(T);
        date = {yyyy:d.yy, mm:d.mm, dd:d.dd, h:h, m:m, s:s,
                dateString:d.dateString, 
                timeString:timeString, D:D, T:T, dT:dT};
        starCharts();
    }
}

// Draw star charts on the canvases
function starCharts() {
    if (Math.abs(date.yyyy) > 3000) {
        var txt0 = $(".warning").text();
        if (txt0=="") {
            var txt = '<p style="color:red;">Warning: Positions of the Sun, Moon and planets are not accurate at this time.</p>';
            $(".warning").append(txt);
        }
    } else {
        if ($(".warning").text() != "") {
            $(".warning").empty();
        }
    }
        
    var hr_to_rad = Math.PI/12;
    var deg_to_rad = Math.PI/180;
    var raCentralNorth = $("#rotateNorth").val()*deg_to_rad;
    var raCentral = $("#raCentral").val()*hr_to_rad;
    var raCentralSouth = $("#rotateSouth").val()*deg_to_rad;
    // Set up paramaters for drawing stars and planets
    var pDraw = setupDrawingParameters();
    addLegend(pDraw);
    
    pDraw.showPlanets = $("#showPlanets").hasClass("active");
    if (pDraw.showPlanets) {
        pDraw.planets = sunMoonPlanets(date.T + date.dT);
    }
    pDraw.showEcliptic = $("#showEcliptic").hasClass("active");
    pDraw.showMilkyWay = $("#showMilkyWay").hasClass("active");
    pDraw.showConLab = $("#showConLab").hasClass("active");
    
    var TD = date.T + date.dT;
    if (Math.abs(TD - stars[0].Tepoch) > 0.5) {
        recomputeStarPos(TD, stars);
    }
    
    var inputParas = {timeId:"timeNorth",
                  canvasId:"canvasNorth", 
                  projection:"stereographic",
                  centralRa:raCentralNorth, centralDec:0.5*Math.PI, 
                  angRadius:0.5*Math.PI,
                  raGrid:[0,23*hr_to_rad,2*hr_to_rad], 
                  decGrid:[-80*deg_to_rad,81*deg_to_rad,20*deg_to_rad], 
                  pDraw:pDraw};
    drawStarChart(inputParas);
    
    inputParas = {timeId:"timeCentral",
                  canvasId:"canvasCentral", 
                  projection:"Mollweide",
                  centralRa:raCentral, centralDec:0, 
                  raGrid:[0,23*hr_to_rad,2*hr_to_rad], 
                  decGrid:[-80*deg_to_rad,81*deg_to_rad,20*deg_to_rad], 
                  pDraw:pDraw};
    drawStarChart(inputParas);
    
    inputParas = {timeId:"timeSouth",
                  canvasId:"canvasSouth", 
                  projection:"stereographic",
                  centralRa:raCentralSouth, centralDec:-0.5*Math.PI, 
                  angRadius:0.5*Math.PI,
                  raGrid:[0,23*hr_to_rad,2*hr_to_rad], 
                  decGrid:[-80*deg_to_rad,81*deg_to_rad,20*deg_to_rad],
                  pDraw:pDraw};    
    drawStarChart(inputParas);
}

// Draw a star chart on one canvas
function drawStarChart(para) {
    var txt = date.dateString+" "+date.timeString+" UT";
    $('#'+para.timeId).text(txt);
    var canvas = document.getElementById(para.canvasId);
    var ctx = canvas.getContext('2d');
    var width = canvas.width, height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    
    drawChartBoundaryAndGrid(ctx,canvas,para);
    
    var raDec;
    if (para.pDraw.showEcliptic) {
        //raPole = -0.5*Math.PI; decPole = 1.16170371649804;
        raDec = getEclipticNorthPole(date.T+date.dT);
        ctx.setLineDash([]);
        ctx.strokeStyle = "brown";
        drawCircle(ctx,raDec.ra,raDec.dec,para);
    }
    
    if (para.pDraw.showMilkyWay) {
        drawMilkyWay(ctx, para);
        ctx.setLineDash([]);
        ctx.strokeStyle = "#ff4dff";
        drawCircle(ctx,3.366012906575397,0.4734787372451951, para);
    }
    
    drawStars(ctx, canvas, para);
    if (para.pDraw.showPlanets) {
        drawPlanets(ctx, canvas, para);
    }
    
    if (para.pDraw.showConLab) {
        drawConstellationLabel(ctx, para);
    }
}

function drawChartBoundaryAndGrid(ctx,canvas,para) {
    var SQR = function(x) {return x*x;}
    var r = 0.465*Math.max(canvas.width, canvas.height);
    var xc = 0.5*canvas.width;
    var yc = 0.5*canvas.height;
    var i,n;
    para.r = r; para.r2 = r*r; para.xc = xc; para.yc = yc;
    
    // Draw ra and dec grid 
    var showPrecession = $("#showPrecession").hasClass("active");
    var p,ra1,dec1,ra2,dec2,ra,dec;
    if (showPrecession) {
        var TD = date.T + date.dT;
        p = precession_matrix(TD, -TD);
    }
    n = 180
    // ra grid
    var ddec = Math.PI/(n-1);
    var raDec;
    ctx.setLineDash([]);
    for (ra=para.raGrid[0]; ra <= para.raGrid[1]; ra += para.raGrid[2]) {
        ra1 = ra - 2*Math.PI*Math.floor(0.5*ra/Math.PI);
        // draw ra grid with different colors for 
        // ra=0h, 6h, 12h and 18h
        if (Math.abs(ra1) < 1e-3) {
            ctx.strokeStyle = para.pDraw.raGridColor[0];
        } else if (Math.abs(ra1-0.5*Math.PI) < 1e-3) {
            ctx.strokeStyle = para.pDraw.raGridColor[1];
        } else if (Math.abs(ra1-Math.PI) < 1e-3) {
            ctx.strokeStyle = para.pDraw.raGridColor[2];
        } else if (Math.abs(ra1-1.5*Math.PI) < 1e-3) {
            ctx.strokeStyle = para.pDraw.raGridColor[3];
        } else {
            ctx.strokeStyle = para.pDraw.raGridColor[4];
        }
        dec1 = -0.5*Math.PI;
        if (showPrecession) {
           raDec = precessed_ra_dec(ra1,dec1,p);
           ra1 = raDec.ra; dec1 = raDec.dec;
        }
        for (i=1; i<n; i++) {
            ra2 = ra;
            dec2 = i*ddec - 0.5*Math.PI;
            if (showPrecession) {
                raDec = precessed_ra_dec(ra2,dec2,p);
                ra2 = raDec.ra; dec2 = raDec.dec;
            }
            addLine(ctx,ra1,dec1,ra2,dec2,para);
            ra1 = ra2; dec1 = dec2;
        }
    }
    // dec grid
    var dra = 2*ddec;
    for (dec=para.decGrid[0]; dec <= para.decGrid[1]; dec += para.decGrid[2]) {
        dec1 = dec;
        ra1 = 0;
        if (showPrecession) {
           raDec = precessed_ra_dec(ra1,dec1,p);
           ra1 = raDec.ra; dec1 = raDec.dec;
        }
        for (i=1; i<n; i++) {
            dec2 = dec;
            ra2 = i*dra;
            if (showPrecession) {
                raDec = precessed_ra_dec(ra2,dec2,p);
                ra2 = raDec.ra; dec2 = raDec.dec;
            }
            addLine(ctx,ra1,dec1,ra2,dec2,para);
            ra1 = ra2; dec1 = dec2;
        }
    }
    
    // Draw chart boundary
    switch (para.projection) {
        case "stereographic":
            ctx.beginPath();
            ctx.setLineDash([]);
            ctx.arc(xc, yc,r,0,2*Math.PI);
            ctx.strokeStyle = "black";
            ctx.stroke();
            break;
        case "Mollweide":
            n = 100;
            var dtheta = 2*Math.PI/(n-1);
            ctx.beginPath();
            ctx.setLineDash([]);
            ctx.moveTo(xc-r,yc);
            for (i=1; i<n; i++) {
                var theta = i*dtheta - Math.PI;
                var x = xc + r*Math.cos(theta);
                var y = yc - 0.5*r*Math.sin(theta);
                ctx.lineTo(x,y);
            }
            ctx.strokeStyle = "black";
            ctx.stroke();
    }
    
    // Add Ra labels on the polar charts
    var deg_to_rad = Math.PI/180;
    var fontSize = 15;
    ctx.txtAlign = "center";
    ctx.fillStyle = "black";
    ctx.font = fontSize.toString()+"px Arial";
    var x,y,txt,w, ang,ra;
    if (para.canvasId=="canvasNorth") {
        ang = -parseFloat($("#rotateNorth").val())*deg_to_rad;
        for (ra=0; ra<24; ra += 2) {
            x = xc - r*1.04*Math.cos(ang);
            y = yc - r*1.04*Math.sin(ang) + 0.5*fontSize;
            txt = ra.toString()+'h';
            w = 0.5*ctx.measureText(txt).width;
            ctx.fillText(txt,x-w,y);
            ang += 30*deg_to_rad;
        }
    } else if (para.canvasId=="canvasSouth") {
        ang = -parseFloat($("#rotateSouth").val())*deg_to_rad;
        for (ra=0; ra<24; ra += 2) {
            x = xc + r*1.04*Math.cos(ang);
            y = yc - r*1.04*Math.sin(ang) + 0.5*fontSize;
            txt = ra.toString()+'h';
            w = 0.5*ctx.measureText(txt).width;
            ctx.fillText(txt,x-w,y);
            ang += 30*deg_to_rad;
        }
    }
}

// Draw stars on a canvas
function drawStars(ctx, canvas, para) {
    // Variables for popup box
    var newStar, tipInd;
    if (tipsEnabled) {
        newStar = new Array(stars.length);
        newStar.fill(true);
        if (para.timeId=="timeNorth") {
            tipInd = 0;
        } else if (para.timeId=="timeCentral") {
            tipInd = 1;
        } else {
            tipInd = 2;
        }
        tips[tipInd].length = 0;
    }
    
    var showConLines = $("#showConLines").hasClass("active");
    if (showConLines || tipsEnabled) {
        drawConstellationLinesAndAddTips(ctx,newStar,showConLines,
                                           tipInd,para);
    }

    var pDraw = para.pDraw;
    ctx.fillStyle = "black";
    var i,s;
    var twoPI = 2*Math.PI;
    for (i=0; i<stars.length; i++) {
        var coord = getXY(stars[i].ra, stars[i].dec,para);
        if (coord.inChart && stars[i].mag < magLimit) {
           s = pDraw.starMagA*stars[i].mag + pDraw.starMagB;
           s = Math.max(s,1);
           ctx.beginPath();
           ctx.arc(coord.x, coord.y, s, 0, twoPI);
           ctx.fill();
           
            // setup popup box
           if (tipsEnabled && stars[i].mag < magLimitTip && newStar[i]) {
               newStar[i] = false;
               s = Math.max(s,3);
               tips[tipInd].push({
                   x: coord.x,
                   y: coord.y,
                   r2: s*s,
                   object: "star",
                   starInd: i
                });
           }
        }
    }
   
    if (tipsEnabled) {
        newStar.length = 0;
    }
}

// Recompute stars' positions by adding proper motions to the epoch T
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
        stars[i].x = x; stars[i].y=y; stars[i].z = z;
        stars[i].ra = Math.atan2(y,x);
        stars[i].dec = Math.asin(z/r);
    }
}

// Draw constellation lines and/or add tooltips.
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
function drawConstellationLinesAndAddTips(ctx,newStar,showConLines,
                                           tipInd,gpara) {
    ctx.strokeStyle = "#1B9722";
    var pDraw = gpara.pDraw;
    ctx.setLineDash([]);
    var ind,s,rad2;
    for (var i=0; i<conLine.length; i++) {
        $.each(conLine[i], function(key, line) {
            if (key != "name" && key != "abbr") {
                var ra1,ra2,dec1,dec2,coord;
                ra2 = stars[line[0]].ra;
                dec2 = stars[line[0]].dec;
                // Add popup box point
                if (tipsEnabled && newStar[line[0]]) {
                    coord = getXY(ra2,dec2, gpara);
                    if (coord.inChart) {
                        ind = line[0];
                        newStar[ind] = false;
                        s = pDraw.starMagA*stars[ind].mag + pDraw.starMagB;
                        s = Math.max(s,3);
                        tips[tipInd].push({
                           x: coord.x,
                           y: coord.y,
                           r2: s*s,
                           object: "star",
                           starInd: ind
                        });
                    }
                }
                for (var j=1; j<line.length; j++) {
                    ra1=ra2; dec1=dec2;
                    ra2 = stars[line[j]].ra;
                    dec2 = stars[line[j]].dec;
                    if (showConLines) {
                        addLine(ctx, ra1,dec1, ra2,dec2, gpara);
                    } 
                    // Add popup box point
                    if (tipsEnabled && newStar[line[j]]) {
                        coord = getXY(ra2,dec2, gpara);
                        if (coord.inChart) {
                            ind = line[j];
                            newStar[ind] = false;
                            s = pDraw.starMagA*stars[ind].mag + pDraw.starMagB;
                            s = Math.max(s,3);
                            tips[tipInd].push({
                                x: coord.x,
                                y: coord.y,
                                r2: s*s,
                                object: "star",
                                starInd: ind
                            });
                        }
                    }
                }
            }
         });
    }
}

// Draw a great circle perpendicular to a given point
function drawCircle(ctx,raPole,decPole,gpara) {
    var xPole = Math.cos(raPole)*Math.cos(decPole);
    var yPole = Math.sin(raPole)*Math.cos(decPole);
    var zPole = Math.sin(decPole);
    // R0 = normalized Z cross Rpole 
    var x0 = -yPole, y0 = xPole, z0 = 0;
    var pom = Math.sqrt(x0*x0+y0*y0);
    x0 /= pom; y0 /= pom;
    // R1 = Rpole cross R0
    var x1 = -y0*zPole;
    var y1 = x0*zPole;
    var z1 = xPole*y0 - yPole*x0;
    // The circle can be parametrized by 
    //  R(phi) = cos(phi) R0 + sin(phi) R1
    //  for phi in [0,2 pi)
    var n = 180;
    var dphi = 2*Math.PI/(n-1);
    var x=x0, y=y0, z=z0;
    var ra1 = Math.atan2(y,x);
    var dec1 = Math.asin(z);
    for (var i=1; i<n; i++) {
        var phi = i*dphi;
        var cosPhi = Math.cos(phi), sinPhi = Math.sin(phi);
        x = cosPhi*x0 + sinPhi*x1;
        y = cosPhi*y0 + sinPhi*y1;
        z = cosPhi*z0 + sinPhi*z1;
        var ra2 = Math.atan2(y,x);
        var dec2 = Math.asin(z);
        addLine(ctx, ra1,dec1,ra2,dec2,gpara);
        ra1 = ra2; dec1=dec2;
    }
}

// Draw Milky Way Boundaries
function drawMilkyWay(ctx, gpara) {
    ctx.setLineDash([]);
    ctx.strokeStyle = "blue";
    // Northern edge
    drawLineInChart(ctx,milky.northernEdge,gpara);
    // Southhern edge
    drawLineInChart(ctx,milky.southernEdge,gpara);
    // Others
    drawLineInChart(ctx,milky.betaCas,gpara);
    drawLineInChart(ctx,milky.thetaOph,gpara);
    drawLineInChart(ctx,milky.lambdaSco,gpara);
    drawLineInChart(ctx,milky.coalsack,gpara);
}

// Connect the points in 'array' to a line. Only draw the points 
// in the chart. Note that the first point is at index 1 not 0.
// This is a wrapper that loops around the indices in 'array' and 
// calls the addLine() function to join lines for all points 
// inside 'array' that are in the chart.
function drawLineInChart(ctx,array,gpara) {
   for (var i=2; i < array.length; i++) {
        addLine(ctx, array[i-1].ra, array[i-1].dec, 
                array[i].ra, array[i].dec, gpara);
    } 
}

// Add constellation labels
function drawConstellationLabel(ctx, gpara) {
    var fontSize = 12;
    ctx.font = fontSize.toString()+"px Arial";
    var textColor = "#6c3483";
    var bgColor = "white";
    var coord,w;
    for (var i=1; i<conLab.length; i++) {
        coord = getXY(conLab[i].ra, conLab[i].dec, gpara);
        if (coord.inChart) {
            w = ctx.measureText(conLab[i].abbr).width;
            ctx.fillStyle = bgColor;
            ctx.fillRect(coord.x,coord.y-fontSize,w,fontSize);
            ctx.fillStyle = textColor;
            ctx.fillText(conLab[i].abbr, coord.x,coord.y);
        }
        
        if ("ra2" in conLab[i]) {
            // add label to the second position
            coord = getXY(conLab[i].ra2, conLab[i].dec2, gpara);
            if (coord.inChart) {
                ctx.fillStyle = bgColor;
                ctx.fillRect(coord.x,coord.y-fontSize,w,fontSize);
                ctx.fillStyle = textColor;
                ctx.fillText(conLab[i].abbr, coord.x,coord.y);
            }
        }
    }
}

// Draw Sun, Moon and Planets on one canvas
function drawPlanets(ctx, canvas, para) {
    var tipInd;
    if (tipsEnabled) {
        if (para.timeId=="timeNorth") {
            tipInd = 0;
        } else if (para.timeId=="timeCentral") {
            tipInd = 1;
        } else {
            tipInd = 2;
        }
    }
    var pDraw = para.pDraw;
    var twoPI = 2*Math.PI;
    ctx.font="20px Arial";
    for (var i=0; i<9; i++) {
        var ra = pDraw.planets[i].ra2000;
        var dec = pDraw.planets[i].dec2000;
        var coord = getXY(ra,dec,para);
        if (coord.inChart) {
            var x = coord.x, y = coord.y;
            var pSymbol = String.fromCharCode(pDraw.code[i]);
            ctx.fillStyle = pDraw.color[i];
            ctx.fillText(pSymbol,
                           x+pDraw.offset[i].x, y+pDraw.offset[i].y);
            ctx.beginPath();
            ctx.arc(x, y, pDraw.size[i], 0, twoPI);
            ctx.fill();
            
            if (tipsEnabled) {
                var s = 0.5*ctx.measureText(pSymbol).width;
                s = Math.max(s, 10);
                tips[tipInd].push({
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

// Convert ra, dec (wrt GCRS equinox and equator) in radians 
//  -> X, Y on canvas. 
function getXY(ra,dec,gpara) {
    switch (gpara.projection) {
        case "stereographic":
            return getXYstereographic(ra,dec,gpara);
            break;
        case "Mollweide":
            return getXYmollweide(ra,dec,gpara);
    }
}

// Get the x, y location on canvas given ra, dec and 
// the graphic parameters for the stereographic projection.
// This function is a special case where the radius of the 
// coverage, angRadius, is pi/2.
function getXYstereographic_special(ra,dec,gpara) {
    var dRa = ra - gpara.centralRa;
    var dec0 = gpara.centralDec;
    var sinDra = Math.sin(dRa), cosDra = Math.cos(dRa);
    var cosDec0 = Math.cos(dec0), sinDec0 = Math.sin(dec0);
    var cosDec = Math.cos(dec), sinDec = Math.sin(dec);
    var denom = 1 + sinDec0*sinDec + cosDec0*cosDec*cosDra;
    var x = gpara.r*(cosDec0*sinDec - sinDec0*cosDec*cosDra)/denom;
    var y = gpara.r*cosDec*sinDra/denom;
    var inChart = (x*x + y*y <= gpara.r2);
    return {x:gpara.xc+x, y:gpara.yc-y, inChart:inChart};
}

// This function deals with a general case
function getXYstereographic(ra,dec,gpara) {
    if (Math.abs(gpara.angRadius - 0.5*Math.PI) < 1e-5) {
        return getXYstereographic_special(ra,dec,gpara);
    }
    
    var ra0 = gpara.centralRa;
    var dec0 = gpara.centralDec;
    var cosDra = Math.cos(ra-ra0), sinDra = Math.sin(ra-ra0);
    var cosDec0 = Math.cos(dec0), sinDec0 = Math.sin(dec0);
    var cosDec = Math.cos(dec), sinDec = Math.sin(dec);
    var theta = Math.acos(sinDec*sinDec0 + cosDec*cosDec0*cosDra);
    var x = cosDra*sinDec0*cosDec - sinDec*cosDec0;
    var y = sinDra*cosDec;
    var pom = Math.sqrt(x*x + y*y);
    var cosPhi = 1, sinPhi = 0;
    if (pom > 1e-10) {
        cosPhi = x/pom; sinPhi = y/pom;
    }
    var r = gpara.r*Math.tan(0.5*theta)/Math.tan(0.5*gpara.angRadius);
    x = gpara.xc - r*cosPhi;
    y = gpara.yc - r*sinPhi;
    return {x:x, y:y, inChart: r <= gpara.r};
}

// Get the x, y location on canvas given ra, dec and 
// the graphic parameters for the Mollweide projection.
function getXYmollweide(ra,dec,gpara) {
    var ra0 = gpara.centralRa;
    var dRa_pi = (ra-ra0)/Math.PI;
    dRa_pi -= 2*Math.floor(0.5*(dRa_pi+1));
    var theta = mollweideThetaSolver(dec);
    var x = gpara.xc - gpara.r*dRa_pi*Math.cos(theta);
    var y = gpara.yc - 0.5*gpara.r*Math.sin(theta);
    return {x:x, y:y, inChart:true, theta:theta};
}

// Solve the equation 2*theta + sin(2*theta) = pi sin(dec)
function mollweideThetaSolver(dec) {
    if (Math.abs(Math.abs(dec) - 0.5*Math.PI) < 1e-10) {
        return dec;
    }
    var piSinDec = Math.PI*Math.sin(Math.abs(dec));
    // Let u = 2 |theta|
    var ui = 2*Math.abs(dec); // initial guess
    var iter = 0; 
    var tol = 1.e-15;
    var maxIter = 20; // maximum iterations for the Newton solver
    var u;
    for (iter=0; iter<maxIter; iter++) {
        // Solve by Newton-Raphson method
        u = ui - (ui+Math.sin(ui) - piSinDec)/(1 + Math.cos(ui))
        if (Math.abs(u-ui) < tol) {
            break;
        }
        ui = u;
    }
    if (iter==maxIter) {
        // Newton solver fails to converge after maxIter iterations.
        // Use bisection method instead.
        var u1 = 0, u2 = Math.PI;
        for (var j=0; j<50; j++) {
            u = 0.5*(u1+u2);
            var fu = u + Math.sin(u) - piSinDec;
            if (fu < 0) {
                u1 = u;
            } else {
                u2 = u;
            }
            if ((u2-u1) < tol || Math.abs(fu) < tol) {
                iter += j;
                break;
            }
        }
    }
    
    if (dec < 0) {u = -u};
    return 0.5*u;
}

// Plot a line joining the points (ra1, dec1) to (ra2, dec2)
function addLine(ctx, ra1,dec1, ra2,dec2, gpara) {
    var coord1, coord2;
    switch (gpara.projection) {
        case "stereographic":
            coord1 = getXYstereographic(ra1,dec1,gpara);
            coord2 = getXYstereographic(ra2,dec2,gpara);
            addLineXY(ctx,coord1.x,coord1.y, coord2.x,coord2.y, gpara);
            break;
        case "Mollweide":
            coord1 = getXYmollweide(ra1,dec1,gpara);
            coord2 = getXYmollweide(ra2,dec2,gpara);
            var raBoundary = gpara.centralRa - Math.PI;
            var dRa1 = (ra1 - raBoundary)/Math.PI;
            var dRa2 = (ra2 - raBoundary)/Math.PI;
            var dRa12 = (ra1-ra2)/Math.PI;
            dRa1 -= 2*Math.floor(0.5*(dRa1+1));
            dRa2 -= 2*Math.floor(0.5*(dRa2+1));
            dRa12 -= 2*Math.floor(0.5*(dRa12+1));
            var diff = Math.abs(dRa1) + Math.abs(dRa2) 
                       - Math.abs(dRa12);
            if (dRa1*dRa2 < 0 && diff < 1e-5) {
                addLinesXYmollweideAcross(ctx, coord1,coord2, gpara);
            } else {
                ctx.beginPath() ;
                ctx.moveTo(coord1.x,coord1.y);
                ctx.lineTo(coord2.x, coord2.y);
                ctx.stroke();
            }
    }
}

// Plot a line from graph position (x1,y1) to (x2,y2); only plot the 
// portion inside the chart. The gpara parameter is an object contains 
// the information necessary to determine if a point is inside the chart.
// gpara.xc, gpara.yc: position of the canvas center, 
// gpara.r2: max square distance from the canvas center.
// A pioint (x,y) is inside the chart if 
// (x-gpara.xc)^2+(y-gpara.yc)^2 <= gpara.r2
function addLineXY(Ctx,x1,y1,x2,y2,gpara) {
   var SQR = function(x) {return x*x;}

    var r1sq = SQR(x1-gpara.xc) + SQR(y1-gpara.yc);
    var r2sq = SQR(x2-gpara.xc) + SQR(y2-gpara.yc);
    
    if (r1sq > gpara.r2 && r2sq > gpara.r2) {
        // Both points are outside the chart. Don't plot anything.
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
        var s;
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

// Join two points across the boundary on the Moddweide map
function addLinesXYmollweideAcross(ctx, coord1,coord2, gpara) {
    // Calculate the shifted and scaled coordinates
    var x1 = (coord1.x - gpara.xc)/gpara.r; 
    var x2 = (coord2.x - gpara.xc)/gpara.r;
    var y1 = (coord1.y - gpara.yc)/gpara.r;
    var y2 = (coord2.y - gpara.yc)/gpara.r;
    if (x1 > 0) {x2 += 2*Math.cos(coord2.theta);}
    if (x1 < 0) {x2 -= 2*Math.cos(coord2.theta);}
    
    // Find the point (x,y) on the straight line joining 
    // (x1,y1) and (x2,y2) that lies on the boundary 
    // closest to (x1,y1). The point satisfies the 
    // equation x^2 + 4*y^2 = 1.
    var dx = x2-x1, dy = y2-y1;
    var t1 = x1*dx + 4*y1*dy;
    var t2 = 1 - x1*x1 - 4*y1*y1;
    var s = t2/(t1 + Math.sqrt(t1*t1 + t2*(dx*dx + 4*dy*dy)));
    var x = x1 + s*dx, y = y1 + s*dy;
    
    // Now add a line joining (x1,y1) and (x,y) on the canvas
    var xg = x*gpara.r + gpara.xc, yg = y*gpara.r + gpara.yc;
    ctx.beginPath();
    ctx.moveTo(coord1.x, coord1.y);
    ctx.lineTo(xg,yg);
    ctx.stroke();
    
    // Need to add a line on the other side of the map close to 
    // coord2
    xg = -x*gpara.r + gpara.xc;
    ctx.beginPath();
    ctx.moveTo(xg,yg);
    ctx.lineTo(coord2.x, coord2.y);
    ctx.stroke();
}

// Display tooltip (actually a popup box) on mouse click
function displayPopup(e, canvasId) {
    var ind, tipId;
    if (canvasId=="canvasNorth") {
        ind = 0;
        tipId = "#tipNorth";
    } else if (canvasId=="canvasCentral") {
        ind = 1;
        tipId = "#tipCentral";
    } else {
        ind = 2;
        tipId = "#tipSouth";
    }
    var canvas = document.getElementById(canvasId);
    var rect = canvas.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    var hit = false;
    var i, tip;
    for (i=0; i < tips[ind].length; i++) {
        tip = tips[ind][i];
        var dx = x - tip.x;
        var dy = y - tip.y;
        if (dx*dx + dy*dy < tip.r2) {
            hit = true;
            break;
        }
    }
    if (hit) {
        var tipText = tipId+"Text";
        $(tipText).empty();
        // set up pararameters to be passed to the functions 
        // that displays the popup...
        var para = {tipInd:ind, tipId:tipId};
        // Nutation (only calculate when -50 < TD < 10)
        var TD = date.T+date.dT;
        if (TD > -50 && TD < 10) {
            para.nu = nutation(TD);
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
    var TD = date.T+date.dT;
    if (highPrecCalInTips) {
        sun = planetGeoVSOP(TD, "Sun", false);
    } else {
        var calculate = [false,false,true,false,false,false,false,false];
        sun = planetPos(TD, calculate)[2];
    }
    // ra and dec wrt GCRS
    var rad_to_deg = 180/Math.PI, rad_to_hr = 12/Math.PI;
    var conNames = constellationAbbrNames();
    var conste = conNames[get_constellation(sun.ra2000, sun.dec2000)];
    var ra2000 = convertDM(sun.ra2000*rad_to_hr, "hm");
    var dec2000 = convertDM(sun.dec2000*rad_to_deg, "dm");
    // ra and dec of date
    var p = precession_matrix(0,TD);
    var raDec = precessed_ra_dec(sun.ra2000,sun.dec2000,p);
    // Add nutation and aberration of light
    if ("nu" in para) {
        raDec = precessed_ra_dec(raDec.ra, raDec.dec, para.nu);
        var aberpara = {T:TD, m:para.nu};
        raDec = aberration(raDec.ra, raDec.dec, aberpara);
    }
    var ra = convertDM(raDec.ra*rad_to_hr, "hm");
    var dec = convertDM(raDec.dec*rad_to_deg, "dm");
    // Angular diameter at 1 AU (arcmin)
    var ang1AU = 31.965; 
    var ang = ang1AU / sun.rGeo;
    
    var txt ="<table>";
    txt += '<tr><th colspan="2">Sun</th></tr>';
    txt += '<tr><td>Distance</td> <td>'+sun.rGeo.toFixed(3)+' AU</td></tr>';
    txt += '<tr><td>Angular Diameter</td> <td>'+ang.toFixed(1)+
        "'</td></tr>";
    txt += '<tr><td>Ra, Dec (J2000)</td> <td>'+ra2000+', '+dec2000+'</td></tr>';
    if ("nu" in para) {
        txt += '<tr><td>App. Ra, Dec (of date)</td> <td>'+ra+', '+dec+'</td></tr>';
    } else {
        txt += '<tr><td>Ra, Dec (of date)</td> <td>'+ra+', '+dec+'</td></tr>';
    }
    txt += '<tr><td>Constellation</td><td>'+conste+'</td></tr>';

    $(para.tipId+"Text").append(txt);
}

// Display popup box for the Moon
function displayPopupMoon(tip,para) {
    var moon,sun, Dmoon, Lmoon, Lsun, Dsun;
    var TD = date.T + date.dT;
    if (highPrecCalInTips) {
        moon = MoonPosElpMpp02(TD, true);
        Dmoon = moon.rGeo;
        var calculate = [false,false,true,false,false,false,false,false];
        sun = planetPos(TD, calculate)[2];
        Dsun = sun.rGeo;
        Lsun = sun.lam2000;
        Lmoon = moon.lam2000;
    } else {
        moon = MediumMoon(TD);
        sun = MiniSun(TD);
        Lsun = sun.lam;
        Dsun = 1.0;
        Lmoon = moon.lam;
        Dmoon = moon.rGeo;
    }
    var rad_to_deg = 180/Math.PI, rad_to_hr = 12/Math.PI;
    // Geocentric ra and dec wrt J2000
    var conNames = constellationAbbrNames();
    var conste = conNames[get_constellation(moon.ra2000, moon.dec2000)];
    var ra2000 = convertDM(moon.ra2000*rad_to_hr, "hm");
    var dec2000 = convertDM(moon.dec2000*rad_to_deg, "dm");
    // Geocentric ra and dec of date
    var raDec = {ra:moon.ra, dec:moon.dec};
    // Add nutation and aberration of light
    if ("nu" in para) {
        raDec = precessed_ra_dec(raDec.ra, raDec.dec, para.nu);
        var aberpara = {T:TD, m:para.nu};
        raDec = aberration(raDec.ra, raDec.dec, aberpara);
    }
    var ra = convertDM(raDec.ra*rad_to_hr, "hm");
    var dec = convertDM(raDec.dec*rad_to_deg, "dm");
    // illumination, phase and solar elongation
    var illumPhase = moonIlluminated(sun.ra,sun.dec,moon.ra,moon.dec, 
                                     Lsun,Lmoon, Dmoon, Dsun);
    var illum = illumPhase.illuminated.toFixed(2);
    var phase = illumPhase.phase;
    var elong = illumPhase.elongTxt;
    var mag = illumPhase.mag.toFixed(1);
    
    var txt ="<table>";
    txt += '<tr><th colspan="2">Moon</th></tr>';
    txt += '<tr><td>Geocentric Distance</td><td>'+
        Dmoon.toFixed(0)+' km ('+(Dmoon/6371).toFixed(1)+
        'R<sub>&oplus;</sub>)</td></tr>';
    txt += '<tr><td>Angular Diameter</td> <td>'+
        (3475/Dmoon*10800/Math.PI).toFixed(1)+"'</td></tr>";
    txt += '<tr><td>Phase</td> <td>'+phase+'</td></tr>';
    txt += '<tr><td>Illuminated</td> <td>'+illum+'</td> </tr>';
    txt += '<tr><td>Apparent Magnitude</td> <td>'+mag+'</td> </tr>';
    txt += '<tr><td>Solar Elongation</td> <td>'+elong+'</td> </tr>';
    txt += '<tr><td>Geocentric Ra, Dec (J2000)</td> <td>'+ra2000+', '+dec2000+'</td></tr>';
    if ("nu" in para) {
        txt += '<tr><td>App. Geocentric Ra, Dec (of date)</td> <td>'+ra+', '+dec+'</td></tr>';
    } else {
        txt += '<tr><td>Geocentric Ra, Dec (of date)</td> <td>'+ra+', '+dec+'</td></tr>';
    }
    txt += '<tr><td>Constellation</td><td>'+conste+'</td></tr>';

    $(para.tipId+"Text").append(txt);
}

// Display popup box for a planet
function displayPopupPlanet(tip,para) {
    var calculate = [false,false,true,false,false,false,false,false];
    var ind = tip.pIndex-1;
    if (tip.pIndex < 4) { ind--;}
    calculate[ind] = true;
    var TD = date.T + date.dT;
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
    var conNames = constellationAbbrNames();
    var conste = conNames[get_constellation(planet.ra2000, planet.dec2000)];
    var ra2000 = convertDM(planet.ra2000*rad_to_hr, "hm");
    var dec2000 = convertDM(planet.dec2000*rad_to_deg, "dm");
    // ra and dec of date
    var raDec = {ra:planet.ra, dec:planet.dec};
    // Add nutation and aberration of light
    if ("nu" in para) {
        raDec = precessed_ra_dec(raDec.ra, raDec.dec, para.nu);
        var aberpara = {T:TD, m:para.nu};
        raDec = aberration(raDec.ra, raDec.dec, aberpara);
    }
    var ra = convertDM(raDec.ra*rad_to_hr, "hm");
    var dec = convertDM(raDec.dec*rad_to_deg, "dm");
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
    txt += '<tr><td>Ra, Dec (J2000)</td> <td>'+ra2000+', '+dec2000+'</td></tr>';
    if ("nu" in para) {
        txt += '<tr><td>App. Ra, Dec (of date)</td> <td>'+ra+', '+dec+'</td></tr>';
    } else {
        txt += '<tr><td>Ra, Dec (of date)</td> <td>'+ra+', '+dec+'</td></tr>';
    }
    txt += '<tr><td>Constellation</td><td>'+conste+'</td></tr>';
    
    $(para.tipId+"Text").append(txt);
}

// Display popup box for stars
function displayPopupStar(tip, para) {
    var stars = brightStars();
    var s = stars[tip.starInd]; // this star
    // ra and dec at current time
    var TD = date.T + date.dT; 
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
    var ra2000r = Math.atan2(y,x), dec2000r = Math.asin(z/distpc);
    var ra2000 = convertDM(ra2000r*rad_to_hr, "hm");
    var dec2000 = convertDM(dec2000r*rad_to_deg, "dm");
    var conNames = constellationAbbrNames();
    var conste = conNames[get_constellation(ra2000r, dec2000r)];
    var conste2000 = conNames[s.con];
    if (conste != conste2000) {
        conste = conste2000 + ' (2000), '+conste+' ('+date.yyyy+')';
    }
    // precession
    var p = precession_matrix(T0,dcen);
    var x1 = p.p11*x + p.p12*y + p.p13*z;
    var y1 = p.p21*x + p.p22*y + p.p23*z;
    var z1 = p.p31*x + p.p32*y + p.p33*z;
    var ra = Math.atan2(y1,x1);
    var dec = Math.asin(z1/distpc);
    // Add nutation and aberration of light
    if ("nu" in para) {
        var raDec = precessed_ra_dec(ra, dec, para.nu);
        var aberpara = {T:TD, m:para.nu};
        raDec = aberration(raDec.ra, raDec.dec, aberpara);
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
    var mag = s.mag2000.toFixed(2);
    var magStr = "Mag.";
    var delMag = 0;
    if (s.dist2000 < 9.9e4) {
        var absmag = s.mag2000 + 5 - 5*Math.LOG10E*Math.log(s.dist2000);
        // correct mag. as a result of change in distance
        delMag = 5*Math.LOG10E*Math.log(distpc/s.dist2000);
        mag = s.mag2000 + delMag;
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
    txt += '<tr><td>Constellation</td> <td>'+conste+'</td></tr>';
    
    txt += "<tr><td>Ra, Dec (J2000)</td> <td>"+ra2000+", "+dec2000+"</td></tr>";
    if ("nu" in para) {
        txt += "<tr><td>App. Ra, Dec (of date)</td> <td>"+raStr+", "+decStr+"</td></tr>";
    } else {
        txt += "<tr><td>Ra, Dec (of date)</td> <td>"+raStr+", "+decStr+"</td></tr>";
    }
    
    txt += '</table>'

    $(para.tipId+"Text").append(txt);
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
    
    // Set up colors for the ra grid. 
    // The first color is for ra = 0h, second, ra=6h, third, ra=12h,
    // fourth, ra=18h, fifth, the rest of the ra grid.
    var raGridColor = ["#ff8080", "#ffcc00", "#4d79ff", "#ac7339", "#cccccc"];

    var pDraw = {color:pColor, code:pCode, size:pSize, offset:offset, pName:pName,
                raGridColor:raGridColor, starMagA:a, starMagB:b};
    return(pDraw);
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
    
    // Ra grid legend
    x=0; y = 130;
    Ctx.beginPath();
    Ctx.moveTo(x,y);
    Ctx.lineTo(x+40,y);
    Ctx.strokeStyle = pDraw.raGridColor[0];
    Ctx.stroke();
    Ctx.font="16px Arial";
    Ctx.fillStyle = "black";
    Ctx.fillText("Ra = 0h", x+45,y+8);
    x=120; y=130;
    Ctx.beginPath();
    Ctx.moveTo(x,y);
    Ctx.lineTo(x+40,y);
    Ctx.strokeStyle = pDraw.raGridColor[1];
    Ctx.stroke();
    Ctx.font="16px Arial";
    Ctx.fillStyle = "black";
    Ctx.fillText("Ra = 6h", x+45,y+8);
    x=240; y=130;
    Ctx.beginPath();
    Ctx.moveTo(x,y);
    Ctx.lineTo(x+40,y);
    Ctx.strokeStyle = pDraw.raGridColor[2];
    Ctx.stroke();
    Ctx.font="16px Arial";
    Ctx.fillStyle = "black";
    Ctx.fillText("Ra = 12h", x+45,y+8);
    x=370; y=130;
    Ctx.beginPath();
    Ctx.moveTo(x,y);
    Ctx.lineTo(x+40,y);
    Ctx.strokeStyle = pDraw.raGridColor[3];
    Ctx.stroke();
    Ctx.font="16px Arial";
    Ctx.fillStyle = "black";
    Ctx.fillText("Ra = 18h", x+45,y+8);
}

function displayAnimationSetup(anid) {
    var animId = "#"+anid;
    $('button.menu').attr("disabled", true);
    $('button.setupAnimate').attr("disabled", true);
    $('button.controlAnimate').attr("disabled", true);
    $(animId).empty();
    $(animId).slideDown();
    
    var txt = "<h2>Animation Setup</h2>";
    $(animId).append(txt);
    txt = '<form name="animSetup" action="" method="get">';
    txt += '<table>';
    txt += '<tr><td colspan="3"><b>Start Time</b></td></tr>';
    txt += '<tr><td>Year: <input type="number" id="yearAnim" step="1" min="-200000" max="200000" /></td>';
    txt += '<td>Month: <input type="number" id="monthAnim" step="1" min="1" max="12" /></td>';
    txt += '<td>Day: <input type="number" id="dayAnim" step="1" min="1" max="31" /></td></tr>';
    txt += '<tr><td>Hour: <input type="number" id="hourAnim" step="1" min="0" max="23" /></td>';
    txt += '<td>Minute: <input type="number" id="minuteAnim" step="1" min="0" max="59" /></td>';
    txt += '<td>Second: <input type="number" id="secondAnim" step="any" min="0" max="60" />UT</td></tr>';
    txt += '<tr><td colspan="3">Choose time step/frame: <input type="radio" id="radioCustom" value="custom" onclick="animRadioClick(';
    txt +="'custom')";
    txt += '" />Custom &nbsp;&nbsp;&nbsp;<input type="radio" id="radioYear" value="year" onclick="animRadioClick(';
    txt += "'year')";
    txt += '" />365.25 days&nbsp;&nbsp;&nbsp;<input type="radio" id="radioCentury" value="century" onclick="animRadioClick(';
    txt += "'century')";
    txt += '" />36525 days (100 years)<br />';
    txt +='<input type="number" id="timeStepAnim" step="any" min="-36525" max="36525" /> days</td></tr>';
    txt += '<tr><td colspan="3">Time between 2 frames: <input type="number" id="frameRateAnim" step="1" min="1" max="1000" /> ms</td></tr>';
    txt += '</table><br />';
    txt += '<p><input type="button" value="Submit" onclick="animationSetup(this.form,';
    txt += "'"+anid+"')";
    txt += '" /></p>';
    txt += '</form>';
    $(animId).append(txt); 
    txt = '<div id="animationErrorlocs"></div>';
    $(animId).append(txt);
    txt = '<p>Note:';
    txt += '<ul>';
    txt += '<li>Time step/frame is the time between two successive frames in the animation.</li>';
    txt += '<li>Time between two frames determines how frequently the star charts will be updated during the animation. It can be as fast as 1 ms, but the charts may not be fast enough to be drawn in 1 ms, depending on the processor speed.</li>';
    txt += '<li>The positions of the Sun, Moon and planets are only accurate for years between -3000 and 3000.</li>';
    txt += '<li>If you choose time step/frame to be 36525 days (1 Julian century), the time soon goes beyond the range in which the positions of the Sun, Moon and planets are accurate. It is better to turn off displaying the Sun, Moon and planets before playing the animation. Note also that the constellation lines will be distorted as stars move away from their current positions as a result of proper motions.</li>';
    txt += '<li>The animation will stop when year goes beyond 200,000 since the formula for the precession becomes inaccurate after that time.';
    txt += '</ul></p>';
    $(animId).append(txt);
    
    // Fill in the current time
    $("#yearAnim").val(date.yyyy);
    $("#monthAnim").val(date.mm);
    $("#dayAnim").val(date.dd);
    $("#hourAnim").val(date.h);
    $("#minuteAnim").val(date.m);
    $("#secondAnim").val(date.s.toFixed(3));
    $("#timeStepAnim").val(animateDtStep);
    $("#frameRateAnim").val(frameRate);
    
    $("#radioCustom").prop("checked",false);
    $("#radioYear").prop("checked", false);
    $("#radioDay").prop("checked", false);
    if (Math.abs(animateDtStep - 365.25) < 1e-10) {
        $("#radioYear").prop("checked", true);
        $("#timeStepAnim").val(365.25);
        $("#timeStepAnim").prop("disabled",true);
    } else if (Math.abs(animateDtStep-36525)< 1e-3) {
        $("#radioCentury").prop("checked", true);
        $("#timeStepAnim").val(36525);
        $("#timeStepAnim").prop("disabled",true);
    } else {
        $("#radioCustom").prop("checked",true);
        $("#timeStepAnim").prop("disabled",false);
    }
}

function animRadioClick(select) {
    $("#radioCustom").prop("checked",false);
    $("#radioYear").prop("checked", false);
    $("#radioCentury").prop("checked", false);
    switch(select) {
        case "custom":
            $("#radioCustom").prop("checked",true);
            $("#timeStepAnim").prop("disabled",false);
            break;
        case "year":
            $("#radioYear").prop("checked", true);
            $("#timeStepAnim").val(365.25);
            $("#timeStepAnim").prop("disabled",true);
            break;
        case "century":
            $("#radioCentury").prop("checked", true);
            $("#timeStepAnim").val(36525);
            $("#timeStepAnim").prop("disabled",true);
    }
}

function animationSetup(form,anid) {
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
    var min=-200000, max=200000;
    var message = "Invalid year! Please enter an integer between "+min+" and "+max+". Note that 0 means 1 BCE, -1 means 2 BCE and so on. Note that the positions of the Sun, Moon and planets are only accurate for years between -3000 and 3000.";
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
    
    min=-36525; max=36525;
    message = "Invalid time step/frame! Please enter a number between "+min+" and "+max+".";
    sanityCheck(dt, "#timeStepAnim",min,max,message,errid);
    
    min=1; max=1000;
    message = "Invalid time between 2 frames! Please enter an integer between "+min+" and "+max+".";
    sanityCheck(fr, "#frameRateAnim",min,max,message,errid);
    
    if ($(errid).text()=="") {
        var animId = "#"+anid;
        $(animId).slideUp();
        $(animId).empty();
        $('button.menu').attr("disabled", false);
        $('button.setupAnimate').attr("disabled", false);
        $('button.controlAnimate').attr("disabled", false);
        var D = getDm(yy,mm,dd,0);
        var d = CalDat(D);
        var timeString = generateTimeString(h,m,s);
        D += (h + m/60 + s/3600)/24;
        var T = D/36525;
        var dT = DeltaT(T);
        date = {yyyy:d.yy, mm:d.mm, dd:d.dd, h:h, m:m, s:s,
                dateString:d.dateString, 
                timeString:timeString, D:D, T:T, dT:dT};
        animateDtStep = dt;
        frameRate = fr;
        starCharts();
    }
}

// Animation manager function
function Animate() {
    var id1 = "#animateNorth";
    var id2 = "#animateCentral";
    var id3 = "#animateSouth";
    var state = $(id1).text();
    if (state=="Play Animation") {
        $(id1).text("Stop Animation");
        $(id2).text("Stop Animation");
        $(id3).text("Stop Animation");
        $('button.menu').attr("disabled", true);
        $('button.setupAnimate').attr("disabled", true);
        $('button.controlAnimate').attr("disabled", true);
        $(id1).attr("disabled", false);
        $(id2).attr("disabled", false);
        $(id3).attr("disabled", false);
        //disable popup box
        tipsEnabled = false;
        tips[0].length=0; tips[1].length=0; tips[2].length=0;
        
        $(".animationStop").empty();
        clearInterval(animate_id);
        animate_id = setInterval(function() 
                                 {playAnimation(1)}, frameRate);
    } else {
        clearInterval(animate_id);
        $(id1).text("Play Animation");
        $(id2).text("Play Animation");
        $(id3).text("Play Animation");
        $('button.menu').attr("disabled", false);
        $('button.setupAnimate').attr("disabled", false);
        $('button.controlAnimate').attr("disabled", false);
        tipsEnabled = true;
        starCharts();
    }
}

// Update the star chart by dframes frames
function playAnimation(dframes) {
    var deltaD = dframes*animateDtStep;
    date.D += deltaD;
    date.T = date.D/36525;
    date.dT = DeltaT(date.T);
    var d = CalDat(date.D);
    date.yyyy = d.yy; date.mm = d.mm; date.dd = d.dd;
    date.dateString = d.dateString;
    var deltaH = 24*(deltaD - Math.floor(deltaD));
    var hour = date.h + date.m/60 + date.s/3600 + deltaH;
    hour -= 24*Math.floor(hour/24);
    date.h = Math.floor(hour);
    date.m = Math.floor((hour - date.h)*60);
    date.s = 3600*(hour - date.h - date.m/60);
    date.timeString = generateTimeString(date.h,date.m,date.s);
    
    if (Math.abs(date.yyyy) > 200000) {
        // stop the animation
        clearInterval(animate_id);
        var id1 = "#animateNorth";
        var id2 = "#animateCentral";
        var id3 = "#animateSouth";
        $(id1).text("Play Animation");
        $(id2).text("Play Animation");
        $(id3).text("Play Animation");
        $('button.menu').attr("disabled", false);
        $('button.setupAnimate').attr("disabled", false);
        $('button.controlAnimate').attr("disabled", false);
        $('.warning').append('<p style="color:red;" class="animationStop">Animation stops since the formula used for precession is only valid between the years -200,000 and 200,000.</p>');
        tipsEnabled = true;
        starCharts();
        return;
    }
    starCharts();
}