"use strict";

// Calculate the geocentric position of a planet 
// using the VSOP87 algorithm
function planetGeoVSOP(T, planet, lightTime) {
    let pos;
    switch(planet) {
        case "Sun":
           pos = {X:0, Y:0, Z:0};
           break;
        case "Mercury":
           pos = MercuryPosVSOP(T);
           break;
        case "Venus":
           pos = VenusPosVSOP(T);
           break;
        case "Mars":
           pos = MarsPosVSOP(T);
           break;
        case "Jupiter":
           pos = JupiterPosVSOP(T);
           break;
        case "Saturn":
           pos = SaturnPosVSOP(T);
           break;
        case "Uranus":
           pos = UranusPosVSOP(T);
           break;
        case "Neptune":
           pos = NeptunePosVSOP(T);
    }
    let earth = EarthPosVSOP(T);
    let rHelio = Math.sqrt(pos.X*pos.X + pos.Y*pos.Y + pos.Z*pos.Z);
    let Xgeo = pos.X - earth.X;
    let Ygeo = pos.Y - earth.Y;
    let Zgeo = pos.Z - earth.Z;
    let rGeo = Math.sqrt(Xgeo*Xgeo + Ygeo*Ygeo + Zgeo*Zgeo);
    
    // Parameter for the Sun (useful for calculating 
    // a planet's elongation,  phase angle and apparent magnitude).
    // dSunEarth: Earth-Sun distance, 
    // lamSun2000: ecliptic longitude of the Sun wrt J2000 
    // equinox and ecliptic,
    // betSun2000: ecliptic latitude of the Sun wrt 
    // J2000 equinox and ecliptic.
    let dSunEarth = Math.sqrt(earth.X*earth.X + earth.Y*earth.Y + earth.Z*earth.Z);
    let lamSun2000 = Math.atan2(-earth.Y, -earth.X);
    let betSun2000 = -Math.asin(earth.Z/dSunEarth);
    
    // correct for light time
    if (lightTime) {
        // Calculate the retarded position to first order...
        // I know I could simply add -V rGeo/c to the position 
        // vector, but then I need to calculate the approximate 
        // value of V. Calling the position function again is  
        // somewhat wasteful of computer resource but is easier.
        // Don't do this if the positions are to be calculated 
        // very frequently.
        let f1oc = 1.581250740982066e-07; // 1/c in century/AU
        switch(planet) {
            case "Sun":
                // do nothing 
                break;
            case "Mercury":
                pos = MercuryPosVSOP(T - rGeo*f1oc);
                break;
            case "Venus":
                pos = VenusPosVSOP(T - rGeo*f1oc);
                break;
            case "Mars":
                pos = MarsPosVSOP(T - rGeo*f1oc);
                break;
            case "Jupiter":
               pos = JupiterPosVSOP(T - rGeo*f1oc);
               break;
            case "Saturn":
                pos = SaturnPosVSOP(T - rGeo*f1oc);
                break;
            case "Uranus":
                pos = UranusPosVSOP(T - rGeo*f1oc);
               break;
            case "Neptune":
                pos = NeptunePosVSOP(T - rGeo*f1oc);
        }
        rHelio = Math.sqrt(pos.X*pos.X + pos.Y*pos.Y + pos.Z*pos.Z);
        Xgeo = pos.X - earth.X;
        Ygeo = pos.Y - earth.Y;
        Zgeo = pos.Z - earth.Z;
        rGeo = Math.sqrt(Xgeo*Xgeo + Ygeo*Ygeo + Zgeo*Zgeo);
    }
    
    // Ecliptic long. and lat. wrt J2000
    let lam2000 = Math.atan2(Ygeo,Xgeo);
    let bet2000 = Math.asin(Zgeo/rGeo);
    
    // equatorial coordinates
    let cosEps = 0.917482139208287;
    let sinEps = 0.397776978008764;
    let YgeoEq = cosEps*Ygeo - sinEps*Zgeo;
    let ZgeoEq = sinEps*Ygeo + cosEps*Zgeo;
    let XsunEq = -earth.X;
    let YsunEq = -cosEps*earth.Y + sinEps*earth.Z;
    let ZsunEq = -sinEps*earth.Y - cosEps*earth.Z;
    
    // Ra and Dec wrt J2000
    let ra2000 = Math.atan2(YgeoEq, Xgeo);
    let dec2000 = Math.asin(ZgeoEq/rGeo);
    
    // precessed to the equator and equinox of the date
    let p = precession_matrix(0,T);
    let xp = p.p11*Xgeo + p.p12*YgeoEq + p.p13*ZgeoEq;
    let yp = p.p21*Xgeo + p.p22*YgeoEq + p.p23*ZgeoEq;
    let zp = p.p31*Xgeo + p.p32*YgeoEq + p.p33*ZgeoEq;
    let xsun = p.p11*XsunEq + p.p12*YsunEq + p.p13*ZsunEq;
    let ysun = p.p21*XsunEq + p.p22*YsunEq + p.p23*ZsunEq;
    let zsun = p.p31*XsunEq + p.p32*YsunEq + p.p33*ZsunEq;
    let raSun = Math.atan2(ysun, xsun);
    let decSun = Math.asin(zsun/Math.sqrt(xsun*xsun + ysun*ysun + zsun*zsun));
    let ra = Math.atan2(yp,xp);
    let dec = Math.asin(zp/rGeo);
    
    return {X:pos.X, Y:pos.Y, Z:pos.Z, 
            Xgeo:Xgeo, Ygeo:Ygeo, Zgeo:Zgeo, 
            rHelio:rHelio, rGeo:rGeo, 
            lam2000:lam2000, bet2000:bet2000, 
            ra2000:ra2000, dec2000:dec2000, ra:ra, dec:dec, 
            dSunEarth:dSunEarth, lamSun2000:lamSun2000, 
            betSun2000:betSun2000, raSun:raSun, decSun:decSun};
}