"use strict";

// Set up global variables
let date; // date and time
// Tooltips (popup box, to be more accurate) setup
let tipsEnabled, tips, highPrecCalInTips; 
let magLimitTip = 5.3; // limiting mag. for stars to display popup
// Save stars' positions for the current time
// initialize the arrays
let stars = brightStars(), conLab = constellationLabel();
let conLine = constellationLines();
let magLimit = 5.3; // limiting magnitude
// Save Milky Way boundaries' positions for the current time
// initialize the arrays
let milkyPoly = {poly:mw_poly(), sb:mw_sb()};

// Set the default animation parameters
let animateDtStep = 1; // number of days per step
let frameRate = 40; // number of milliseconds to update the frame
let animate_id; // variable for animation

// Initial setup
function init() {
    $('#wrapper').show();
    let d = new Date(); // current time from computer's clock
    
    // Set up the object date
    let yyyy = d.getUTCFullYear();
    let mm = d.getUTCMonth()+1;
    let dd = d.getUTCDate();
    let h = d.getUTCHours();
    let m = d.getUTCMinutes();
    let s = d.getUTCSeconds()+1e-3*d.getUTCMilliseconds();
    let dateString = generateDateString(yyyy,mm,dd);
    let timeString = generateTimeString(h,m,s);
    let D = getDm(yyyy,mm,dd,0) + (h+m/60+s/3600)/24;
    let T = D/36525;
    let dT = DeltaT(T);
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

function showHide2(name) {
    $("#show"+name).toggleClass("active");
    starCharts();
}

// Display change date and time
function displayChangeTime() {
    let id = "#changeTime";
    $('button.menu').attr("disabled", true);
    $(id).empty();
    $(id).slideDown();
    let txt = "<h2>Change Date and Time</h2>";
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
    let yy = parseInt(form.yearIn.value);
    let mm = parseInt(form.monthIn.value);
    let dd = parseInt(form.dayIn.value);
    let h = parseInt(form.hourIn.value);
    let m = parseInt(form.minuteIn.value);
    let s = parseFloat(form.secondIn.value);
    
    // sanity check
    let errid = "#changeTimeErrorlocs";
    $(errid).empty();
    let min=-200000, max=200000;
    let message = "Invalid year! Please enter an integer between "+min+" and "+max+". Note that 0 means 1 BCE, -1 means 2 BCE and so on. Note that the positions of the Sun, Moon and planets are only accurate for years between -3000 and 3000.";
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
        let id = "#changeTime";
        $(id).slideUp();
        $(id).empty;
        $('button.menu').attr("disabled", false);
        
        let D = getDm(yy,mm,dd,0);
        let d = CalDat(D);
        let timeString = generateTimeString(h,m,s);
        D += (h + m/60 + s/3600)/24;
        let T = D/36525;
        let dT = DeltaT(T);
        date = {yyyy:d.yy, mm:d.mm, dd:d.dd, h:h, m:m, s:s,
                dateString:d.dateString, 
                timeString:timeString, D:D, T:T, dT:dT};
        starCharts();
    }
}

// Draw star charts on the canvases
function starCharts() {
    if (Math.abs(date.yyyy) > 3000) {
        let txt0 = $(".warning").text();
        if (txt0=="") {
            let txt = '<p style="color:red;">Warning: Positions of the Sun, Moon and planets are not accurate at this time.</p>';
            $(".warning").append(txt);
        }
    } else {
        if ($(".warning").text() != "") {
            $(".warning").empty();
        }
    }
        
    let hr_to_rad = Math.PI/12;
    let deg_to_rad = Math.PI/180;
    let raCentralNorth = $("#rotateNorth").val()*deg_to_rad;
    let raCentral = $("#raCentral").val()*hr_to_rad;
    let raCentralSouth = $("#rotateSouth").val()*deg_to_rad;
    // Set up paramaters for drawing stars and planets
    let pDraw = setupDrawingParameters();
    addLegend(pDraw);
    
    pDraw.showPlanets = $("#showPlanets").hasClass("active");
    if (pDraw.showPlanets) {
        pDraw.planets = sunMoonPlanets(date.T + date.dT);
    }
    pDraw.showEcliptic = $("#showEcliptic").hasClass("active");
    pDraw.showGalactic = $("#showGalactic").hasClass("active");
    pDraw.showMilkyWay = $("#showMilkyWay").hasClass("active");
    pDraw.showConLab = $("#showConLab").hasClass("active");
    
    let TD = date.T + date.dT;
    if (Math.abs(TD - stars[0].Tepoch) > 0.5) {
        recomputeStarPos(TD, stars);
    }
    
    let inputParas = {timeId:"timeNorth",
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
    let txt = date.dateString+" "+date.timeString+" UT";
    $('#'+para.timeId).text(txt);
    let canvas = document.getElementById(para.canvasId);
    let ctx = canvas.getContext('2d');
    let width = canvas.width, height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    
    drawChartBoundaryAndGrid(ctx,canvas,para);
    
    let raDec;
    if (para.pDraw.showMilkyWay) {
        drawMilkyWay(ctx, para);
        ctx.setLineDash([]);
        ctx.strokeStyle = "#ff4dff";
    }
    
    if (para.pDraw.showGalactic) {
        drawCircle(ctx,3.366012906575397,0.4734787372451951, para);
        drawGalacticCenter(ctx, para);
    }
    
    if (para.pDraw.showEcliptic) {
        //raPole = -0.5*Math.PI; decPole = 1.16170371649804;
        raDec = getEclipticNorthPole(date.T+date.dT);
        ctx.setLineDash([]);
        ctx.strokeStyle = "brown";
        drawCircle(ctx,raDec.ra,raDec.dec,para);
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
    let SQR = function(x) {return x*x;}
    let r = 0.465*Math.max(canvas.width, canvas.height);
    let xc = 0.5*canvas.width;
    let yc = 0.5*canvas.height;
    let i,n;
    para.r = r; para.r2 = r*r; para.xc = xc; para.yc = yc;
    
    // Draw ra and dec grid 
    let showPrecession = $("#showPrecession").hasClass("active");
    let p,ra1,dec1,ra2,dec2,ra,dec;
    if (showPrecession) {
        let TD = date.T + date.dT;
        p = precession_matrix(TD, -TD);
    }
    n = 180
    // ra grid
    let ddec = Math.PI/(n-1);
    let raDec;
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
    let dra = 2*ddec;
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
            let dtheta = 2*Math.PI/(n-1);
            ctx.beginPath();
            ctx.setLineDash([]);
            ctx.moveTo(xc-r,yc);
            for (i=1; i<n; i++) {
                let theta = i*dtheta - Math.PI;
                let x = xc + r*Math.cos(theta);
                let y = yc - 0.5*r*Math.sin(theta);
                ctx.lineTo(x,y);
            }
            ctx.strokeStyle = "black";
            ctx.stroke();
    }
    
    // Add Ra labels on the polar charts
    let deg_to_rad = Math.PI/180;
    let fontSize = 15;
    ctx.txtAlign = "center";
    ctx.fillStyle = "black";
    ctx.font = fontSize.toString()+"px Arial";
    let x,y,txt,w, ang;
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
    let newStar, tipInd;
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
    
    let showConLines = $("#showConLines").hasClass("active");
    if (showConLines || tipsEnabled) {
        drawConstellationLinesAndAddTips(ctx,newStar,showConLines,
                                           tipInd,para);
    }

    let pDraw = para.pDraw;
    ctx.fillStyle = "black";
    let i,s;
    let twoPI = 2*Math.PI;
    for (i=0; i<stars.length; i++) {
        let coord = getXY(stars[i].ra, stars[i].dec,para);
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
    let pDraw = gpara.pDraw;
    ctx.setLineDash([]);
    let ind,s,rad2;
    for (let i=0; i<conLine.length; i++) {
        $.each(conLine[i], function(key, line) {
            if (key != "name" && key != "abbr") {
                let ra1,ra2,dec1,dec2,coord;
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
                for (let j=1; j<line.length; j++) {
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

// Sgr A*
function drawGalacticCenter(ctx, gpara) {
    // 3D position of Sgr A* at J2000 in kpc
    let x0 = -0.4372574538483036, y0 = -6.9827518193438181, z0 = -3.8794307505747145; 
    // 3D velocity of Sgr A* in kpc/century
    let vx = -1.154527115906393e-05, vy = 1.117619916911477e-05, vz = -1.881522674419981e-05;
    // 3D position at T centuries after J2000
    let T = date.T + date.dT;
    let x = x0 + vx*T, y = y0 + vy*T, z = z0 + vz*T;
    let r = Math.sqrt(x*x + y*y + z*z);
    // J2000 RA and DEC of Sgr A* at T centuries after J2000
    let ra = Math.atan2(y,x), dec = Math.asin(z/r);
    let coord = getXY(ra, dec, gpara);
    if (coord.inChart) {
        ctx.fillStyle = 'pink';
        let s = 5;
        ctx.beginPath();
        ctx.arc(coord.x, coord.y, s, 0, 2*Math.PI);
        ctx.fill();
    }
}

// Draw a great circle perpendicular to a given point
function drawCircle(ctx,raPole,decPole,gpara) {
    let xPole = Math.cos(raPole)*Math.cos(decPole);
    let yPole = Math.sin(raPole)*Math.cos(decPole);
    let zPole = Math.sin(decPole);
    // R0 = normalized Z cross Rpole 
    let x0 = -yPole, y0 = xPole, z0 = 0;
    let pom = Math.sqrt(x0*x0+y0*y0);
    x0 /= pom; y0 /= pom;
    // R1 = Rpole cross R0
    let x1 = -y0*zPole;
    let y1 = x0*zPole;
    let z1 = xPole*y0 - yPole*x0;
    // The circle can be parametrized by 
    //  R(phi) = cos(phi) R0 + sin(phi) R1
    //  for phi in [0,2 pi)
    let n = 180;
    let dphi = 2*Math.PI/(n-1);
    let x=x0, y=y0, z=z0;
    let ra1 = Math.atan2(y,x);
    let dec1 = Math.asin(z);
    for (let i=1; i<n; i++) {
        let phi = i*dphi;
        let cosPhi = Math.cos(phi), sinPhi = Math.sin(phi);
        x = cosPhi*x0 + sinPhi*x1;
        y = cosPhi*y0 + sinPhi*y1;
        z = cosPhi*z0 + sinPhi*z1;
        let ra2 = Math.atan2(y,x);
        let dec2 = Math.asin(z);
        addLine(ctx, ra1,dec1,ra2,dec2,gpara);
        ra1 = ra2; dec1=dec2;
    }
}

// Draw Milky Way Boundaries
function drawMilkyWay(ctx, gpara) {
    //ctx.setLineDash([]);
    //ctx.strokeStyle = "blue";
    // Northern edge
    //drawLineInChart(ctx,milky.northernEdge,gpara);
    // Southhern edge
    //drawLineInChart(ctx,milky.southernEdge,gpara);
    // Others
    //drawLineInChart(ctx,milky.betaCas,gpara);
    //drawLineInChart(ctx,milky.thetaOph,gpara);
    //drawLineInChart(ctx,milky.lambdaSco,gpara);
    //drawLineInChart(ctx,milky.coalsack,gpara);
    
    drawMW_polypons(ctx, milkyPoly, gpara);
}

// Connect the points in 'array' to a line. Only draw the points 
// in the chart. Note that the first point is at index 1 not 0.
// This is a wrapper that loops around the indices in 'array' and 
// calls the addLine() function to join lines for all points 
// inside 'array' that are in the chart.
function drawLineInChart(ctx,array,gpara) {
   for (let i=2; i < array.length; i++) {
        addLine(ctx, array[i-1].ra, array[i-1].dec, 
                array[i].ra, array[i].dec, gpara);
    } 
}

// Draw Milky Way polygons
function drawMW_polypons(ctx, mwPoly, gpara) {
    const max_alpha = 0.7, fillColor = "#7FFFD4";
    ctx.save();
    if (gpara.projection=='stereographic') {
        // clip
        ctx.beginPath();
        ctx.arc(gpara.xc, gpara.yc, gpara.r, 0, 2*Math.PI);
        ctx.clip();
        drawMW_polypons_stereographic(ctx, mwPoly, gpara, max_alpha, fillColor);
    } else {
        // clip
        ctx.beginPath();
        let n = 100, xc = gpara.xc, yc = gpara.yc, r = gpara.r;
        let dtheta = 2*Math.PI/(n-1);
        ctx.beginPath();
        ctx.moveTo(xc - r, yc);
        for (let i=1; i<n; i++) {
            let theta = i*dtheta - Math.PI;
            let x = xc + r*Math.cos(theta);
            let y = yc - 0.5*r*Math.sin(theta);
            ctx.lineTo(x,y);
        }
        ctx.clip();
        drawMW_polypons_mollweide(ctx, mwPoly, gpara, max_alpha, fillColor);
    }
    ctx.restore();
}

function drawMW_polypons_stereographic(ctx, mwPoly, gpara, 
                                        max_alpha, fillColor) {
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = fillColor;
    ctx.lineWidth = 0.2;
    mwPoly.poly.forEach(draw_one_polygon);
    
    function draw_one_polygon(poly, ind) {
        let coords = poly.map(x => getXYstereographic(x[0], x[1], gpara));
        let someInChart = coords.reduce((a,b) => a || b.inChart, false);
        if (!someInChart) { return;}
        
        let n = coords.length;
        ctx.beginPath();
        ctx.moveTo(coords[0].x, coords[0].y);
        for (let i=1; i<n; i++) {
            ctx.lineTo(coords[i].x, coords[i].y);
        }
        ctx.globalAlpha = max_alpha*mwPoly.sb[ind];
        ctx.stroke();
        ctx.fill();
    }
}

function drawMW_polypons_mollweide(ctx, mwPoly, gpara, max_alpha, fillColor) {
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = fillColor;
    ctx.lineWidth = 0.2;
    let raBoundary = gpara.centralRa - Math.PI;
    mwPoly.poly.forEach(draw_one_polygon);
    
    function draw_one_polygon(poly, ind) {
        let coords = poly.map(x => getXYmollweide(x[0], x[1], gpara));
        let n = coords.length;
        let branch2 = [];
        ctx.beginPath();
        ctx.moveTo(coords[0].x, coords[0].y);
        let crossing = 0, sign = 0;
        for (let i=1; i<n; i++) {
            let bd_cross = check_bd_crossing(coords[i-1], coords[i], 
                                        poly[i-1][0], poly[i][0]);
            if (bd_cross.cross) {
                // crossing the boundary RA line
                crossing++;
                sign = bd_cross.sign;
                let xb1 = bd_cross.bdx1, xb2 = bd_cross.bdx2;
                if (crossing % 2 ==0) {
                    xb1 = bd_cross.bdx2; 
                    xb2 = bd_cross.bdx1;
                }
                ctx.lineTo(xb1, bd_cross.bdy);
                branch2.push([xb2, bd_cross.bdy]);
            }
            let x = coords[i].x, y = coords[i].y;
            if (crossing % 2 ==1) {
                x += 2*gpara.r*sign*Math.cos(coords[i].theta);
            }
            ctx.lineTo(x,y);
            if (crossing > 0) {
                let x2 = coords[i].x;
                if (crossing %2 == 0) {
                    x2 += 2*gpara.r*sign*Math.cos(coords[i].theta);
                }
                branch2.push([x2, y]);
            }
        }
        ctx.globalAlpha = mwPoly.sb[ind]*max_alpha;
        ctx.stroke();
        ctx.fill();
        // branch 2: if the polygon crosses the RA boundary
        if (crossing > 0) {
            n = branch2.length;
            ctx.beginPath();
            ctx.moveTo(branch2[0][0], branch2[0][1]);
            for (let i=1; i<n; i++) {
                ctx.lineTo(branch2[i][0], branch2[i][1])
            }
            ctx.lineTo(branch2[0][0], branch2[0][1]);
            ctx.stroke();
            ctx.fill();
        }
        
        function check_bd_crossing(p1, p2, ra1, ra2) {
            // Check if the "straight" line connecting 
            // p1 and p2 crosses the RA boundary. If so, 
            // calculate the point on the boundary.
            // p1, p2: x, y coordinates on Canvas
            // ra1, ra2: RAs of the points
            let dRa1 = (ra1 - raBoundary)/Math.PI;
            let dRa2 = (ra2 - raBoundary)/Math.PI;
            let dRa12 = (ra1-ra2)/Math.PI;
            dRa1 -= 2*Math.floor(0.5*(dRa1+1));
            dRa2 -= 2*Math.floor(0.5*(dRa2+1));
            dRa12 -= 2*Math.floor(0.5*(dRa12+1));
            let diff = Math.abs(dRa1) + Math.abs(dRa2) - Math.abs(dRa12);
            let cross = (dRa1*dRa2 < 0 && diff < 1e-5);
            let bdx1 = 0, bdy = 0, bdx2=0, sign = 0;
            if (cross) {
                // Calculate the x, y coordinates of the boundary 
                // point on the two sides of p1
                let x1 = (p1.x - gpara.xc)/gpara.r;
                let x2 = (p2.x - gpara.xc)/gpara.r;
                let y1 = (p1.y - gpara.yc)/gpara.r;
                let y2 = (p2.y - gpara.yc)/gpara.r;
                sign = (x1 > 0 ? 1:-1);
                x2 += 2*sign*Math.cos(p2.theta);
                let dx = x2-x1, dy = y2-y1;
                let t1 = x1*dx + 4*y1*dy;
                let t2 = 1 - x1*x1 - 4*y1*y1;
                let s = t2/(t1 + Math.sqrt(t1*t1 + t2*(dx*dx + 4*dy*dy)));
                let x = x1 + s*dx, y = y1 + s*dy;
                bdx1 = gpara.xc + gpara.r*x; 
                bdx2 = gpara.xc - gpara.r*x; 
                bdy = gpara.yc + gpara.r*y;
            }
            return {cross:cross, bdx1:bdx1, bdx2:bdx2, bdy:bdy, sign:sign};
        }
    }
}

// Add constellation labels
function drawConstellationLabel(ctx, gpara) {
    let fontSize = 12;
    ctx.font = fontSize.toString()+"px Arial";
    let textColor = "#6c3483";
    let bgColor = "white";
    let coord,w;
    for (let i=1; i<conLab.length; i++) {
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
    let tipInd;
    if (tipsEnabled) {
        if (para.timeId=="timeNorth") {
            tipInd = 0;
        } else if (para.timeId=="timeCentral") {
            tipInd = 1;
        } else {
            tipInd = 2;
        }
    }
    let pDraw = para.pDraw;
    let twoPI = 2*Math.PI;
    ctx.font="20px Arial";
    for (let i=0; i<9; i++) {
        let ra = pDraw.planets[i].ra2000;
        let dec = pDraw.planets[i].dec2000;
        let coord = getXY(ra,dec,para);
        if (coord.inChart) {
            let x = coord.x, y = coord.y;
            let pSymbol = String.fromCharCode(pDraw.code[i]);
            ctx.fillStyle = pDraw.color[i];
            ctx.fillText(pSymbol,
                           x+pDraw.offset[i].x, y+pDraw.offset[i].y);
            ctx.beginPath();
            ctx.arc(x, y, pDraw.size[i], 0, twoPI);
            ctx.fill();
            
            if (tipsEnabled) {
                let s = 0.5*ctx.measureText(pSymbol).width;
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
    let dRa = ra - gpara.centralRa;
    let dec0 = gpara.centralDec;
    let sinDra = Math.sin(dRa), cosDra = Math.cos(dRa);
    let cosDec0 = Math.cos(dec0), sinDec0 = Math.sin(dec0);
    let cosDec = Math.cos(dec), sinDec = Math.sin(dec);
    let denom = 1 + sinDec0*sinDec + cosDec0*cosDec*cosDra;
    let x = gpara.r*(cosDec0*sinDec - sinDec0*cosDec*cosDra)/denom;
    let y = gpara.r*cosDec*sinDra/denom;
    let inChart = (x*x + y*y <= gpara.r2);
    return {x:gpara.xc+x, y:gpara.yc-y, inChart:inChart};
}

// This function deals with a general case
function getXYstereographic(ra,dec,gpara) {
    if (Math.abs(gpara.angRadius - 0.5*Math.PI) < 1e-5) {
        return getXYstereographic_special(ra,dec,gpara);
    }
    
    let ra0 = gpara.centralRa;
    let dec0 = gpara.centralDec;
    let cosDra = Math.cos(ra-ra0), sinDra = Math.sin(ra-ra0);
    let cosDec0 = Math.cos(dec0), sinDec0 = Math.sin(dec0);
    let cosDec = Math.cos(dec), sinDec = Math.sin(dec);
    let theta = Math.acos(sinDec*sinDec0 + cosDec*cosDec0*cosDra);
    let x = cosDra*sinDec0*cosDec - sinDec*cosDec0;
    let y = sinDra*cosDec;
    let pom = Math.sqrt(x*x + y*y);
    let cosPhi = 1, sinPhi = 0;
    if (pom > 1e-10) {
        cosPhi = x/pom; sinPhi = y/pom;
    }
    let r = gpara.r*Math.tan(0.5*theta)/Math.tan(0.5*gpara.angRadius);
    x = gpara.xc - r*cosPhi;
    y = gpara.yc - r*sinPhi;
    return {x:x, y:y, inChart: r <= gpara.r};
}

// Get the x, y location on canvas given ra, dec and 
// the graphic parameters for the Mollweide projection.
function getXYmollweide(ra,dec,gpara) {
    let ra0 = gpara.centralRa;
    let dRa_pi = (ra-ra0)/Math.PI;
    dRa_pi -= 2*Math.floor(0.5*(dRa_pi+1));
    let theta = mollweideThetaSolver(dec);
    let x = gpara.xc - gpara.r*dRa_pi*Math.cos(theta);
    let y = gpara.yc - 0.5*gpara.r*Math.sin(theta);
    return {x:x, y:y, inChart:true, theta:theta};
}

// Solve the equation 2*theta + sin(2*theta) = pi sin(dec)
function mollweideThetaSolver(dec) {
    if (Math.abs(Math.abs(dec) - 0.5*Math.PI) < 1e-10) {
        return dec;
    }
    let piSinDec = Math.PI*Math.sin(Math.abs(dec));
    // Let u = 2 |theta|
    let ui = 2*Math.abs(dec); // initial guess
    let iter = 0; 
    let tol = 1.e-15;
    let maxIter = 20; // maximum iterations for the Newton solver
    let u;
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
        let u1 = 0, u2 = Math.PI;
        for (let j=0; j<50; j++) {
            u = 0.5*(u1+u2);
            let fu = u + Math.sin(u) - piSinDec;
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
    let coord1, coord2;
    switch (gpara.projection) {
        case "stereographic":
            coord1 = getXYstereographic(ra1,dec1,gpara);
            coord2 = getXYstereographic(ra2,dec2,gpara);
            addLineXY(ctx,coord1.x,coord1.y, coord2.x,coord2.y, gpara);
            break;
        case "Mollweide":
            coord1 = getXYmollweide(ra1,dec1,gpara);
            coord2 = getXYmollweide(ra2,dec2,gpara);
            let raBoundary = gpara.centralRa - Math.PI;
            let dRa1 = (ra1 - raBoundary)/Math.PI;
            let dRa2 = (ra2 - raBoundary)/Math.PI;
            let dRa12 = (ra1-ra2)/Math.PI;
            dRa1 -= 2*Math.floor(0.5*(dRa1+1));
            dRa2 -= 2*Math.floor(0.5*(dRa2+1));
            dRa12 -= 2*Math.floor(0.5*(dRa12+1));
            let diff = Math.abs(dRa1) + Math.abs(dRa2) 
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
   let SQR = function(x) {return x*x;}

    let r1sq = SQR(x1-gpara.xc) + SQR(y1-gpara.yc);
    let r2sq = SQR(x2-gpara.xc) + SQR(y2-gpara.yc);
    
    if (r1sq > gpara.r2 && r2sq > gpara.r2) {
        // Both points are outside the chart. Don't plot anything.
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

// Join two points across the boundary on the Moddweide map
function addLinesXYmollweideAcross(ctx, coord1,coord2, gpara) {
    // Calculate the shifted and scaled coordinates
    let x1 = (coord1.x - gpara.xc)/gpara.r; 
    let x2 = (coord2.x - gpara.xc)/gpara.r;
    let y1 = (coord1.y - gpara.yc)/gpara.r;
    let y2 = (coord2.y - gpara.yc)/gpara.r;
    if (x1 > 0) {x2 += 2*Math.cos(coord2.theta);}
    if (x1 < 0) {x2 -= 2*Math.cos(coord2.theta);}
    
    // Find the point (x,y) on the straight line joining 
    // (x1,y1) and (x2,y2) that lies on the boundary 
    // closest to (x1,y1). The point satisfies the 
    // equation x^2 + 4*y^2 = 1.
    let dx = x2-x1, dy = y2-y1;
    let t1 = x1*dx + 4*y1*dy;
    let t2 = 1 - x1*x1 - 4*y1*y1;
    let s = t2/(t1 + Math.sqrt(t1*t1 + t2*(dx*dx + 4*dy*dy)));
    let x = x1 + s*dx, y = y1 + s*dy;
    
    // Now add a line joining (x1,y1) and (x,y) on the canvas
    let xg = x*gpara.r + gpara.xc, yg = y*gpara.r + gpara.yc;
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
    let ind, tipId;
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
    let canvas = document.getElementById(canvasId);
    let rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    let hit = false;
    let i, tip;
    for (i=0; i < tips[ind].length; i++) {
        tip = tips[ind][i];
        let dx = x - tip.x;
        let dy = y - tip.y;
        if (dx*dx + dy*dy < tip.r2) {
            hit = true;
            break;
        }
    }
    if (hit) {
        let tipText = tipId+"Text";
        $(tipText).empty();
        // set up pararameters to be passed to the functions 
        // that displays the popup...
        let para = {tipInd:ind, tipId:tipId};
        // Nutation (only calculate when -50 < TD < 10)
        let TD = date.T+date.dT;
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
    let id = "#"+idn;
    $(id).hide();
    $(id+"text").empty();
    $(id).css("left","-200px");
}

// Display popup box for the Sun
function displayPopupSun(tip,para) {
    let sun;
    let TD = date.T+date.dT;
    if (highPrecCalInTips) {
        sun = planetGeoVSOP(TD, "Sun", false);
    } else {
        let calculate = [false,false,true,false,false,false,false,false];
        sun = planetPos(TD, calculate)[2];
    }
    // ra and dec wrt GCRS
    let rad_to_deg = 180/Math.PI, rad_to_hr = 12/Math.PI;
    let conNames = constellationAbbrNames();
    let conste = conNames[get_constellation(sun.ra2000, sun.dec2000)];
    let ra2000 = convertDM(sun.ra2000*rad_to_hr, "hm");
    let dec2000 = convertDM(sun.dec2000*rad_to_deg, "dm");
    // ra and dec of date
    let p = precession_matrix(0,TD);
    let raDec = precessed_ra_dec(sun.ra2000,sun.dec2000,p);
    // Add nutation and aberration of light
    if ("nu" in para) {
        raDec = precessed_ra_dec(raDec.ra, raDec.dec, para.nu);
        let aberpara = {T:TD, m:para.nu};
        raDec = aberration(raDec.ra, raDec.dec, aberpara);
    }
    let ra = convertDM(raDec.ra*rad_to_hr, "hm");
    let dec = convertDM(raDec.dec*rad_to_deg, "dm");
    // Equation of time
    let DU0 = Math.floor(date.D - 0.5) + 0.5;
    let EOT = 0.06570748587250752*DU0;
    EOT -= 24*Math.floor(EOT/24 + 0.5);
    EOT += 18.697374558336001 - raDec.ra*rad_to_hr + 2.686296296296296e-7;
    EOT += 0.00273781191135448*(date.h + date.m/60 + date.s/3600);
    let T = date.T + date.dT;
    EOT += T*(0.08541030618518518 + 2.577003148148148e-5*T);
    if ("nu" in para) {
        EOT += para.nu.Ee*rad_to_hr;
    }
    EOT -= 24*Math.floor(EOT/24 + 0.5);
    let aEOT = Math.abs(EOT) + 0.5/3600;
    let EOTm = Math.floor(60*aEOT);
    let EOTs = Math.floor(60*(60*aEOT - EOTm));
    let EOTc = (EOT < 0 ? '-'+EOTm:EOTm) + '<sup>m</sup>' + (EOTs < 10 ? '0'+EOTs:EOTs) + '<sup>s</sup>';
    // Angular diameter at 1 AU (arcmin)
    let ang1AU = 31.965; 
    let ang = ang1AU / sun.rGeo;
    
    let txt ="<table>";
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
    txt += '<tr><td>Equation of time</td><td>'+EOTc+'</td></tr>';
    txt += '<tr><td>Constellation</td><td>'+conste+'</td></tr>';
    txt += '</table>';

    $(para.tipId+"Text").append(txt);
}

// Display popup box for the Moon
function displayPopupMoon(tip,para) {
    let moon,sun, Dmoon, Lmoon, Lsun, Dsun;
    let TD = date.T + date.dT;
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
        Lsun = sun.lam;
        Dsun = 1.0;
        Lmoon = moon.lam;
        Dmoon = moon.rGeo;
    }
    let rad_to_deg = 180/Math.PI, rad_to_hr = 12/Math.PI;
    // Geocentric ra and dec wrt J2000
    let conNames = constellationAbbrNames();
    let conste = conNames[get_constellation(moon.ra2000, moon.dec2000)];
    let ra2000 = convertDM(moon.ra2000*rad_to_hr, "hm");
    let dec2000 = convertDM(moon.dec2000*rad_to_deg, "dm");
    // Geocentric ra and dec of date
    let raDec = {ra:moon.ra, dec:moon.dec};
    // Add nutation and aberration of light
    if ("nu" in para) {
        raDec = precessed_ra_dec(raDec.ra, raDec.dec, para.nu);
        let aberpara = {T:TD, m:para.nu};
        raDec = aberration(raDec.ra, raDec.dec, aberpara);
    }
    let ra = convertDM(raDec.ra*rad_to_hr, "hm");
    let dec = convertDM(raDec.dec*rad_to_deg, "dm");
    // illumination, phase and solar elongation
    let illumPhase = moonIlluminated(sun.ra,sun.dec,moon.ra,moon.dec, 
                                     Lsun,Lmoon, Dmoon, Dsun);
    let illum = illumPhase.illuminated.toFixed(2);
    let phase = illumPhase.phase;
    let elong = illumPhase.elongTxt;
    let mag = illumPhase.mag.toFixed(1);
    let svgp = {sunRa:sun.ra, sunDec:sun.dec, ra:moon.ra, dec:moon.dec, cosi:illumPhase.cosi, size:150};

    let txt ="<table>";
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
    txt += '<tr><td colspan="2">Phase Appearance (north is up)<br />'+generate_svg_phase(svgp)+'</td></tr>';
    txt += '</table>';

    $(para.tipId+"Text").append(txt);
}

// Display popup box for a planet
function displayPopupPlanet(tip,para) {
    let calculate = [false,false,true,false,false,false,false,false];
    let ind = tip.pIndex-1;
    if (tip.pIndex < 4) { ind--;}
    calculate[ind] = true;
    let TD = date.T + date.dT;
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
    let conNames = constellationAbbrNames();
    let conste = conNames[get_constellation(planet.ra2000, planet.dec2000)];
    let ra2000 = convertDM(planet.ra2000*rad_to_hr, "hm");
    let dec2000 = convertDM(planet.dec2000*rad_to_deg, "dm");
    // ra and dec of date
    let raDec = {ra:planet.ra, dec:planet.dec};
    // Add nutation and aberration of light
    if ("nu" in para) {
        raDec = precessed_ra_dec(raDec.ra, raDec.dec, para.nu);
        let aberpara = {T:TD, m:para.nu};
        raDec = aberration(raDec.ra, raDec.dec, aberpara);
    }
    let ra = convertDM(raDec.ra*rad_to_hr, "hm");
    let dec = convertDM(raDec.dec*rad_to_deg, "dm");
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
    let svgp = {sunRa:sun.ra, sunDec:sun.dec, ra:planet.ra, dec:planet.dec, cosi:elongIllum.cosi, size:150};
    
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
    txt += '<tr><td>Ra, Dec (J2000)</td> <td>'+ra2000+', '+dec2000+'</td></tr>';
    if ("nu" in para) {
        txt += '<tr><td>App. Ra, Dec (of date)</td> <td>'+ra+', '+dec+'</td></tr>';
    } else {
        txt += '<tr><td>Ra, Dec (of date)</td> <td>'+ra+', '+dec+'</td></tr>';
    }
    txt += '<tr><td>Constellation</td><td>'+conste+'</td></tr>';
    // Add svg phase image of the planet for mercury, Venus and Mars
    if (ind==0 || ind==1 || ind==3) {
        txt += '<tr><td colspan="2">Phase Appearance (north is up)<br />'+generate_svg_phase(svgp)+'</td></tr>';
    }
    txt += '</table>';
    
    $(para.tipId+"Text").append(txt);
}

// Display popup box for stars
function displayPopupStar(tip, para) {
    let stars = brightStars();
    let s = stars[tip.starInd]; // this star
    // ra and dec at current time
    let TD = date.T + date.dT; 
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
    let conste = conNames[get_constellation(ra2000r, dec2000r)];
    let conste2000 = conNames[s.con];
    if (conste != conste2000) {
        conste = conste2000 + ' (2000), '+conste+' ('+date.yyyy+')';
    }
    // precession
    let p = precession_matrix(T0,dcen);
    let x1 = p.p11*x + p.p12*y + p.p13*z;
    let y1 = p.p21*x + p.p22*y + p.p23*z;
    let z1 = p.p31*x + p.p32*y + p.p33*z;
    let ra = Math.atan2(y1,x1);
    let dec = Math.asin(z1/distpc);
    // Add nutation and aberration of light
    if ("nu" in para) {
        let raDec = precessed_ra_dec(ra, dec, para.nu);
        let aberpara = {T:TD, m:para.nu};
        raDec = aberration(raDec.ra, raDec.dec, aberpara);
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
    let mag = s.mag2000.toFixed(2);
    let magStr = "Mag.";
    let delMag = 0;
    if (s.dist2000 < 9.9e4) {
        let absmag = s.mag2000 + 5 - 5*Math.LOG10E*Math.log(s.dist2000);
        // correct mag. as a result of change in distance
        delMag = 5*Math.LOG10E*Math.log(distpc/s.dist2000);
        mag = s.mag2000 + delMag;
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
        txt += "<tr><td>App. Ra, Dec (of date)</td> <td>"+raStr+", "+decStr+"</td></tr>";
    } else {
        txt += "<tr><td>Ra, Dec (of date)</td> <td>"+raStr+", "+decStr+"</td></tr>";
    }
    
    txt += '</table>'

    $(para.tipId+"Text").append(txt);
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
    let cchi = Math.cos(chi), schi = Math.sin(chi);
    let a = p.size*0.3, hs = 0.5*p.size;
    let x1 = hs - cchi*a, y1 = hs + a*schi, x2 = hs + cchi*a, y2 = hs - a*schi;
    let b = a*Math.abs(p.cosi);
    let color_illum = 'white', color_black = '#696969';
    let r2d = 180/Math.PI;
    let svg = '<svg width="'+p.size+'" height="'+p.size+'">';
    svg += '<circle cx="'+hs+'" cy="'+hs+'" r="'+a+'" fill="'+color_black+'" stroke="none" />';
    if (p.cosi >= 0) {
        svg += '<path d="M '+x1+' '+y1+' A '+a+' '+b+' '+(-chi*r2d)+' 0 0 '+x2+' '+y2+' A '+a+' '+a+' 0 0 0 '+x1+' '+y1+'" fill="'+color_illum+'" stroke="none" />';
    } else {
        svg += '<path d="M '+x1+' '+y1+' A '+a+' '+b+' '+(-chi*r2d)+' 0 1 '+x2+' '+y2+' A '+a+' '+a+' 0 0 0 '+x1+' '+y1+'" fill="'+color_illum+'" stroke="none" />';
    }
    svg += '<circle cx="'+hs+'" cy="'+hs+'" r="'+a+'" stroke="'+color_black+'" fill="none" />';
    // Label north direction 
    let xn1 = hs, yn1 = hs - a;
    let xn2 = hs, yn2 = hs - 1.125*a;
    let xt = hs - 5, yt = hs - 1.2*a;
    svg += '<path d="M '+xn1+' '+yn1+' L '+xn2+' '+yn2+'" stroke="'+color_black+'" />';
    svg += '<text x="'+xt+'" y="'+yt+'" fill="black">N</text>';
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
    
    // Set up colors for the ra grid. 
    // The first color is for ra = 0h, second, ra=6h, third, ra=12h,
    // fourth, ra=18h, fifth, the rest of the ra grid.
    let raGridColor = ["#ff8080", "#ffcc00", "#4d79ff", "#ac7339", "#cccccc"];

    let pDraw = {color:pColor, code:pCode, size:pSize, offset:offset, pName:pName,
                raGridColor:raGridColor, starMagA:a, starMagB:b};
    return(pDraw);
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
    let animId = "#"+anid;
    $('button.menu').attr("disabled", true);
    $('button.setupAnimate').attr("disabled", true);
    $('button.controlAnimate').attr("disabled", true);
    $(animId).empty();
    $(animId).slideDown();
    
    let txt = "<h2>Animation Setup</h2>";
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
    let yy = parseInt(form.yearAnim.value);
    let mm = parseInt(form.monthAnim.value);
    let dd = parseInt(form.dayAnim.value);
    let h = parseInt(form.hourAnim.value);
    let m = parseInt(form.minuteAnim.value);
    let s = parseFloat(form.secondAnim.value);
    let dt = parseFloat(form.timeStepAnim.value);
    let fr = parseInt(form.frameRateAnim.value);
    
    // sanity check
    let errid = "#animationErrorlocs";
    $(errid).empty();
    let min=-200000, max=200000;
    let message = "Invalid year! Please enter an integer between "+min+" and "+max+". Note that 0 means 1 BCE, -1 means 2 BCE and so on. Note that the positions of the Sun, Moon and planets are only accurate for years between -3000 and 3000.";
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
        let animId = "#"+anid;
        $(animId).slideUp();
        $(animId).empty();
        $('button.menu').attr("disabled", false);
        $('button.setupAnimate').attr("disabled", false);
        $('button.controlAnimate').attr("disabled", false);
        let D = getDm(yy,mm,dd,0);
        let d = CalDat(D);
        let timeString = generateTimeString(h,m,s);
        D += (h + m/60 + s/3600)/24;
        let T = D/36525;
        let dT = DeltaT(T);
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
    let id1 = "#animateNorth";
    let id2 = "#animateCentral";
    let id3 = "#animateSouth";
    let state = $(id1).text();
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
    let deltaD = dframes*animateDtStep;
    date.D += deltaD;
    date.T = date.D/36525;
    date.dT = DeltaT(date.T);
    let d = CalDat(date.D);
    date.yyyy = d.yy; date.mm = d.mm; date.dd = d.dd;
    date.dateString = d.dateString;
    let deltaH = 24*(deltaD - Math.floor(deltaD));
    let hour = date.h + date.m/60 + date.s/3600 + deltaH;
    hour -= 24*Math.floor(hour/24);
    date.h = Math.floor(hour);
    date.m = Math.floor((hour - date.h)*60);
    date.s = 3600*(hour - date.h - date.m/60);
    date.timeString = generateTimeString(date.h,date.m,date.s);
    
    if (Math.abs(date.yyyy) > 200000) {
        // stop the animation
        clearInterval(animate_id);
        let id1 = "#animateNorth";
        let id2 = "#animateCentral";
        let id3 = "#animateSouth";
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