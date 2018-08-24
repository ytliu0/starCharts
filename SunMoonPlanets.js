"use strict";

// Compute the approximate RA and Dec for the Sun, Moon and 
// Planets.

// returns the fractional part of a number
var Frac = function(x) {
    return(x - Math.floor(x));
}

var Modulus = function(x,y) {
    return(x - y*Math.floor(x/y));
}

// ecliptic -> equatorial 
function eclipticToEquatorial(lam,bet, eps) {
    var cosEps = Math.cos(eps);
    var sinEps = Math.sin(eps);
    var cosLam = Math.cos(lam);
    var sinLam = Math.sin(lam);
    var cosBet = Math.cos(bet);
    var sinBet = Math.sin(bet);
    
    var delta = sinBet*cosEps + cosBet*sinEps*sinLam;
    delta = Math.asin(delta);
    var sA = cosBet*sinLam*cosEps - sinBet*sinEps;
    var cA = cosBet*cosLam;
    var alpha = Math.atan2(sA,cA);
    
    return({ra:alpha, dec:delta});
}

// Gather the positions of the Sun, Moon and planets 
// at dynamical time T (number of centuries from 2000)
function sunMoonPlanets(T) {
    
    var planets = [];
    
    // approximate position of the Sun, Moon and planets
    var others = planetPos(T,[true,true,true,true,true,true,true,true]);
    
    // index: 0=Sun, 1=Moon, 2=Mercury, 3=Venus, 4=Mars, 
    //        5=Jupiter, 6=Saturn, 7=Uranus, 8=Neptune
    planets[0] = others[2];
    planets[1] = MediumMoon(T);
    planets[2] = others[0];
    planets[3] = others[1];
    planets[4] = others[3];
    planets[5] = others[4];
    planets[6] = others[5];
    planets[7] = others[6];
    planets[8] = others[7];

    return(planets);
}

// Calculate the approximate position of the Sun
// Using the foemula in Astronomy on Personal Computer
function MiniSun(T) {
    var pi2 = 2*Math.PI;
    var Rad = Math.PI/180;
    var eps = 23.43929111*Math.PI/180;
    var Msun = pi2*Frac(0.993133 + 99.997361*T);
    var Lsun = pi2*Frac(0.7859453 + Msun/pi2 + 
                       (6893*Math.sin(Msun)+72*Math.sin(2*Msun) + 
                       6191.2*T)/1296000);
    var raDec = eclipticToEquatorial(Lsun,0,eps);
    return {ra:raDec.ra, dec:raDec.dec, lam:Lsun, bet:0};
}

// Calculate the approximate position of the Moon
// Using the foemula in Astronomy on Personal Computer
function MiniMoon(T) {
    var pi2 = 2*Math.PI;
    var Rad = Math.PI/180;
    var Arcs = 3600/Math.PI*180;
    var eps = 23.43929111*Math.PI/180;
    var L_0 = Frac(0.606433+1336.855225*T);
    var l = pi2*Frac(0.374897+1325.55241*T);
    var ls = pi2*Frac(0.993133 + 99.997361*T);
    var D = pi2*Frac(0.827361+1236.853086*T);
    var F = pi2*Frac(0.259086+1342.227825*T);
    
    var dL = 22640*Math.sin(l) - 4586*Math.sin(l-2*D) + 
        2370*Math.sin(2*D) + 769*Math.sin(2*l) - 
        668*Math.sin(ls) - 412*Math.sin(2*F) - 
        212*Math.sin(2*l-2*D) - 206*Math.sin(l+ls-2*D) + 
        192*Math.sin(l+2*D) - 165*Math.sin(ls-2*D) - 
        125*Math.sin(D) - 110*Math.sin(l+ls) + 
        148*Math.sin(l-ls) - 55*Math.sin(2*F-2*D);
    var S = F + (dL+412*Math.sin(2*F) + 541*Math.sin(ls))/Arcs;
    var h = F - 2*D;
    var N = -526*Math.sin(h) + 44*Math.sin(l+h) - 
        31*Math.sin(h-l) - 23*Math.sin(ls+h) + 
        11*Math.sin(h-ls) - 25*Math.sin(F-2*l) + 
        21*Math.sin(F-l);
    var lam = pi2*Frac(L_0 + dL/1296000);
    var bet = (18520*Math.sin(S) + N)/Arcs;
    var raDec = eclipticToEquatorial(lam,bet, eps);
    
    return {ra:raDec.ra, dec:raDec.dec, lam:lam, bet:bet};
}

// Compute the approximate distance of the Moon in km.
// Accuracy: +/- 300km for |T| < 50, rms error approx. 85km
// The formula is obtained by truncating the ELP 2000-82b 
// distance series: terms with amplitudes less 
// than 100km are removed.
function MiniMoonDist(T) {
    var twoPi = 6.283185307179586; // 2 pi
    var f1opi = 0.3183098861837907; // 1/pi
    // function that convert an angle to the range [-pi, pi)
    var frac = function(x) {
           return x - twoPi*Math.floor(0.5*(x*f1opi + 1));
    }
    var T2 = T*T;
    var T3 = T2*T;
    var T4 = T2*T2;
    
    var W1 = -2.472840876591278 +frac(8399.684731773916*T);
    var W1full = W1 + frac(-2.854728398477281e-05*T2) + 
        frac(3.201709550047375e-08*T3) + 
        frac(-1.53637455543612e-10*T4);
    var W2 = 1.454788532322509 + frac(70.99330481835962*T);
    var W2full = W2 + frac(-0.0001855750416003838*T2) + 
        frac(-2.183940189294126e-07*T3) + 
        frac(1.032701622131422e-09*T4);
    var pomp = 1.796595523358783 + frac(0.005629793667315685*T);
    var pompfull = pomp + frac(2.582602479270498e-06*T2) + 
        frac(-6.690428799311597e-10*T3);
    var Ea = 1.753470343150658 + frac(628.3075849621554*T);
    var Eafull = Ea + frac(-9.793236358412627e-08*T2) + 
        frac(4.363323129985824e-11*T3) + 
        frac(7.272205216643039e-13*T4);
    
    // Delaunay's arguments
    var Dfull = W1full-Eafull+Math.PI;
    var Lfull = W1full-W2full;
    var Lpfull = Eafull-pompfull;
   
   var s = 385000.5289868034;
   s += -20905.35504324328 * Math.cos(Lfull);
   s += -569.9251213522875 * Math.cos(2*Lfull);
   s += -129.6201386785059 * Math.cos(Lpfull - Lfull);
   s += 104.7552251859368 * Math.cos(Lpfull + Lfull);
   s += 108.7427016883919 * Math.cos(Dfull);
   s += -152.1377114862193 * Math.cos(2*Dfull - Lpfull - Lfull);
   s += -204.5859838051395 * Math.cos(2*Dfull - Lpfull);
   s += 246.1584775524063 * Math.cos(2*Dfull - 2*Lfull);
   s += -3699.110919209897 * Math.cos(2*Dfull - Lfull);
   s += -2955.967563710265 * Math.cos(2*Dfull);
   s += -170.7330784603796 * Math.cos(2*Dfull + Lfull);
   return s;
}

// Compute the approximate position of the Moon.
// Accuracy: +/- 250 arcsec for |T| < 50, 
// rms error approx. 58 arcsec
// The formula is obtained by truncating the ELP/MPP02 
// series: terms with amplitudes less than 30 arcsec for 
// longitude and latitude and 100km in distance are removed, 
// and only the largest term in the time derivative of longitute in 
// the series is kept. As a result, only 42 of the original 
// 35,901 terms are kept.
// This is the ELP/Mpp02L series described in the 
// pdf documentation
function MediumMoon(T) {
    var twoPi = 6.283185307179586; // 2 pi
    var f1opi = 0.3183098861837907; // 1/pi
    // function that convert an angle to the range [-pi, pi)
    var mod2pi = function(x) {
           return x - twoPi*Math.floor(0.5*(x*f1opi + 1));
    }
    var T2 = T*T;
    var T3 = T2*T;
    var T4 = T2*T2;
    var T5 = T2*T3;
    var ra0 = 0.9999999498265204;
    
    var W1 = 3.8103440908308803 + mod2pi(8399.6847300719292*T) + 
        mod2pi(-3.3189520425500942e-5*T2) + 
        mod2pi(3.1102494491060616e-8*T3) + 
        mod2pi(-2.0328237648922845e-10*T4);
    var W2 = 1.4547895404440776 + mod2pi(70.993305448479248*T) + 
        mod2pi(-1.8548192818782712e-4*T2) + 
        mod2pi(-2.1961637966359412e-7*T3) + 
        mod2pi(1.0327016221314225e-9*T4);
    var W3 = 2.1824388474237688 + mod2pi(-33.781427419672326*T) + 
        mod2pi(3.0816644950982666e-5*T2) + 
        mod2pi(3.6447710769397583e-8*T3) + 
        mod2pi(-1.738541860458796e-10*T4);
    var Ea = 1.7534699452640696 + mod2pi(628.30758508103156*T) + 
        mod2pi(-9.7932363584126268e-8*T2) + 
        mod2pi(4.3633231299858238e-11*T3) + 
        mod2pi(7.2722052166430391e-13*T4);
    var pomp = 1.7965956331206001 + mod2pi(5.6298669711442699e-3*T) + 
        mod2pi(2.5659491293243853e-6*T2) + 
        mod2pi(-5.7275888286280579e-10*T3) + 
        mod2pi(5.5166948773454099e-11*T4);
    
    // Arguments of Delaunay
    var D = mod2pi(W1-Ea+Math.PI);
    var F = mod2pi(W1-W3);
    var L = mod2pi(W1-W2);
    var Lp = mod2pi(Ea-pomp);
    
    var long = W1;
    long += -0.001995472498018293 * Math.sin(2*F);
    long += 0.0001916628565478175 * Math.sin(-2*F + L);
    long += 0.1097598086261916 * Math.sin(L);
    long += -0.0002186490808966586 * Math.sin(2*F + L);
    long += 0.00372834182278019 * Math.sin(2*L);
    long += 0.00017513318791757 * Math.sin(3*L);
    long += -0.0007142342143774959 * Math.sin(-L + Lp);
    long += -0.003230883385671323 * Math.sin(Lp);
    long += -0.0005302909592585855 * Math.sin(L + Lp);
    long += -0.0006059594976151819 * Math.sin(D);
    long += 0.0009959815905878214 * Math.sin(2*D - L - Lp);
    long += 0.0007986268729360748 * Math.sin(2*D - Lp);
    long += 0.001026135054568928 * Math.sin(2*D - 2*L);
    long += 0.02223568023224499 * Math.sin(2*D - L);
    long += 0.0002675059342607472 * Math.sin(2*D - 2*F);
    long += 0.01148966695626307 * Math.sin(2*D);
    long += 0.0009306298945895796 * Math.sin(2*D + L);
    long += 0.0001491896510579414 * Math.sin(4*D - 2*L);
    long += 0.0001863130931752139 * Math.sin(4*D - L);
    long += T*(8.1293558048447e-06 * Math.sin(Lp));

    var lat = 0.08950261906476278 * Math.sin(F);
    lat += 0.004846651648159632 * Math.sin(-F + L);
    lat += 0.004897428574922555 * Math.sin(F + L);
    lat += 0.0001539752292512595 * Math.sin(-F + 2*L);
    lat += 0.0003001576051004671 * Math.sin(F + 2*L);
    lat += 0.0008075741060449063 * Math.sin(2*D - F - L);
    lat += 0.0009671245654627556 * Math.sin(2*D + F - L);
    lat += 0.003023552571339078 * Math.sin(2*D - F);
    lat += 0.0005684958997727675 * Math.sin(2*D + F);
    lat += 0.0001617202836489691 * Math.sin(2*D - F + L);

    var r = 385000.529032284;
    r += -20905.35493520509 * Math.cos(L);
    r += -569.9251153350947 * Math.cos(2*L);
    r += -129.6202221720506 * Math.cos(-L + Lp);
    r += 104.7552926742703 * Math.cos(L + Lp);
    r += 108.742701272463 * Math.cos(D);
    r += -152.1378094258907 * Math.cos(2*D - L - Lp);
    r += -204.5861164608731 * Math.cos(2*D - Lp);
    r += 246.1584748535579 * Math.cos(2*D - 2*L);
    r += -3699.110896398076 * Math.cos(2*D - L);
    r += -2955.967557972414 * Math.cos(2*D);
    r += -170.7330771247706 * Math.cos(2*D + L);
    r *= ra0;
    
    var x = r*Math.cos(long)*Math.cos(lat);
    var y = r*Math.sin(long)*Math.cos(lat);
    var z = r*Math.sin(lat);
    // precessed to J2000 mean ecliptic and equinox
    var p1 = 0.10180391e-4*T + 0.47020439e-6*T2 - 0.5417367e-9*T3 - 0.2507948e-11*T4 + 0.463486e-14*T5;
    var q1 = -0.113469002e-3*T + 0.12372674e-6*T2 + 0.12654170e-8*T3 - 0.1371808e-11*T4 - 0.320334e-14*T5;
    var sq = Math.sqrt(1-p1*p1-q1*q1);
    var p11 = 1-2*p1*p1;
    var p12 = 2*p1*q1;
    var p13 = 2*p1*sq;
    var p21 = p12;
    var p22 = 1-2*q1*q1;
    var p23 = -2*q1*sq;
    var p31 = -2*p1*sq;
    var p32 = 2*q1*sq;
    var p33 = 1 - 2*p1*p1 - 2*q1*q1;
    var x2000 = p11*x + p12*y + p13*z;
    var y2000 = p21*x + p22*y + p23*z;
    var z2000 = p31*x + p32*y + p33*z;
    
    // ecliptic longitude and latitude wrt J2000.0 ecliptic
    var lam2000 = Math.atan2(y2000, x2000);
    var bet2000 = Math.asin(z2000/r);
    
    // equatorial coordinates
    var cosEps = 0.9174821430652418;
    var sinEps = 0.397776969112606;
    var Yeq = cosEps*y2000 - sinEps*z2000;
    var Zeq = sinEps*y2000 + cosEps*z2000;
    
    // Ra and Dec wrt J2000 mean equator and equinox
    var ra2000 = Math.atan2(Yeq, x2000);
    var dec2000 = Math.asin(Zeq/r);
    
    // precessed to equinox and equator of date
    var p = precession_matrix(0,T);
    var xp = p.p11*x2000 + p.p12*Yeq + p.p13*Zeq;
    var yp = p.p21*x2000 + p.p22*Yeq + p.p23*Zeq;
    var zp = p.p31*x2000 + p.p32*Yeq + p.p33*Zeq;
    var ra = Math.atan2(yp,xp);
    var dec = Math.asin(zp/r);
    
    return {Xgeo:x2000, Ygeo:y2000, Zgeo:z2000, 
           rGeo:r, lam2000:lam2000, bet2000:bet2000, 
           ra2000:ra2000, dec2000:dec2000, ra:ra, dec:dec};
}

// Planet positions at T
// The planet data are stored in an array in this order: 
// Mercury, Venus, Sun, Mars, 
// Jupiter, Saturn, Uranus and Neptune
// The second argument, calculate, is a logical 
//  vector of length 8, true if the planet position 
//  is to be calculated. For example, to calculate 
//  the position of Mars only, set calculate to 
//  [false,false,false,true,false,false,false,false]
//
// output: Ra's amd Dec's in radians
// For planets whose positions are not calculated, as indicated
// in the variable 'calculate', ra and dec are not defined.
function planetPos(T, calculate) {
    var pi2 = 2*Math.PI;
    // 1/light speed in century/AU
    var f1oc = 1.58125073358306e-07; 
    //var eps = 0.409092610296857; // obliquity @ J2000 in rad
    var cosEps = 0.917482139208287;
    var sinEps = 0.397776978008764;
        
    // Angles have been converted to radians
    var a0,adot, e0,edot, I0,Idot, L0,Ldot, pom0,pomdot, Omg0,Omgdot;
    var b,c,s,f;
    if (T > -2 && T < 0.5) {
        // use the parameters for 1800 AD - 2050 AD
        a0 = [0.38709927, 0.72333566, 1.00000261, 1.52371034, 
            5.202887, 9.53667594, 19.18916464, 30.06992276];
        adot = [0.00000037, 0.0000039, 0.00000562, 0.00001847, 
               -0.00011607, -0.0012506, -0.00196176, 0.00026291];
        e0 = [0.20563593, 0.00677672, 0.01671123, 0.09339410, 
            0.04838624, 0.05386179, 0.04725744, 0.00859048];
        edot = [0.00001906, -0.00004107, -0.00004392, 0.00007882, 
               -0.00013253, -0.00050991, -0.00004397, 0.00005105];
        I0 = [0.122259947932126, 0.0592482741110957, 
            -2.67209908480332e-07, 0.0322832054248893, 
            0.0227660215304719, 0.0433887433093108, 
            0.0134850740589642, 0.0308930864549255];
        Idot = [-0.000103803282729438, -1.37689024689833e-05,
               -0.000225962193202099, -0.00014191813200034, 
               -3.20641418200886e-05, 3.3791145114937e-05, 
               -4.2400854315025e-05, 6.17357863015434e-06];
        L0 = [4.40259868429583, 3.17613445608937, 
            1.75343755707279, -0.0794723815383351, 
            0.600331137865858, 0.87186603715888, 
            5.4670362664056, -0.962026001887529];
        Ldot = [2608.79030501053, 1021.32854958241, 
               628.307577900922, 334.061301681387, 
               52.966311891386, 21.3365387887055, 
               7.47842217160454, 3.81283674131913];
        pom0 = [1.35189357642502, 2.29689635603878, 
              1.79660147404917, -0.41789517122344, 
              0.257060466847075, 1.61615531016306, 
              2.98371499179911, 0.784783148988019];
        pomdot = [0.00280085010386076, 4.68322452858386e-05, 
                 0.00564218940290684, 0.00775643308768542, 
                 0.00370929031433238, -0.00731244366619248, 
                 0.00712186505651484, -0.00562719702463221];
        Omg0 = [0.843530995489199, 1.33831572240834, 
              0, 0.864977129749742, 
              1.75360052596996, 1.9837835429754, 
              1.2918390439753, 2.30006864135446];
        Omgdot = [-0.00218760982161663, -0.00484667775462579, 
                 0, -0.00510636965735315, 
                 0.00357253294639726, -0.00503838053087464, 
                 0.000740122402738538, -8.87786158636444e-05];
    } else {
        // use the parameters for 3000 BC - 3000 AD
        a0 = [0.38709843, 0.72332102, 1.00000018, 
            1.52371243, 5.20248019, 9.54149883, 
            19.18797948, 30.06952752];
        adot = [0, -0.00000026, -0.00000003, 
               0.00000097, -0.00002864, -0.00003065, 
               -0.00020455, 0.00006447];
        e0 = [0.20563661, 0.00676399, 0.01673163, 
            0.09336511, 0.0485359, 0.05550825, 
            0.0468574, 0.00895439];
        edot = [0.00002123, -0.00005107, -0.00003661, 
               0.00009149, 0.00018026, -0.00032044, 
               -0.0000155, 0.00000818];
        I0 = [0.122270686943013, 0.059302368845932, 
            -9.48516635288838e-06, 0.0323203332904682, 
            0.0226650928050204, 0.0435327181373017, 
            0.0134910682177473, 0.0308932911820467];
        Idot = [-0.000103002002069847, 7.59113504862414e-06, 
               -0.000233381587852327, -0.000126493959268765, 
               -5.63216004289318e-05, 7.88834716694625e-05, 
               -3.14429791393038e-05, 3.9095375244673e-06];
        L0 = [4.40262213698312, 3.17614508514451, 
            1.75347846863765, -0.0797289377825283, 
            0.599255160009829, 0.873986072195182, 
            5.48387278993662, 5.30969114052348];
        Ldot = [2608.79031817869, 1021.32855334028, 
               628.307588608167, 334.061243342709, 
               52.9690623526126, 21.3299296671748, 
               7.47865077657529, 3.81293622316663];
        pom0 = [1.35189222676191, 2.29977771922823, 
              1.79646842620403, -0.417438213482006, 
              0.249144920643598, 1.62073649087534, 
              3.00954181748462, 0.814747397394972];
        pomdot = [0.00278205709660699, 0.000991285579543109, 
                 0.00554931973527652, 0.00789301155937221, 
                 0.00317635891415782, 0.00945610278111832,
                 0.00161739399982927, 0.000176267433410065];
        Omg0 = [0.843685496572442, 1.33818957716586, 
              -0.08923177123077, 0.867659193442843, 
              1.75044003925455, 1.98339193542262, 
              1.29088918553089, 2.30010586556221];
        Omgdot = [-0.00213177691337826, -0.00476024137061832, 
                 -0.00421040715476989, -0.00468663333114593, 
                 0.00227322485367811, -0.00436594147292966, 
                 0.00100176645623426, -0.000105819661614267];
        b = [0,0,0,0, 
             -2.17328398458334e-06, 4.52022822974011e-06, 
            1.01806800598081e-05, -7.21658739114615e-06];
        c = [0,0,0,0,
            0.00105837813038487, -0.0023447571730711, 
            -0.0170574253165864, 0.0119286828071507];
        s = [0,0,0,0,
            -0.00621955723490303, 0.0152402406847545, 
            0.00308735567441944, -0.00177369905538672];
        f = [0,0,0,0,
            0.669355584755475, 0.669355584755475, 
            0.133871116951095, 0.133871116951095];
    }
    
    var i,xp,yp,zp;
    var x=[0,0,0,0,0,0,0,0]; 
    var y=[0,0,0,0,0,0,0,0];
    var z=[0,0,0,0,0,0,0,0];
    var rHelio = [0,0,0,0,0,0,0,0];
    var rGeo = [0,0,0,0,0,0,0,0]; 
    var vx=[0,0,0,0,0,0,0,0];
    var vy=[0,0,0,0,0,0,0,0];
    var vz=[0,0,0,0,0,0,0,0];
    for (i=0; i<8; i++) {
        if (!calculate[i] && i != 2) { continue;}
        var a = a0[i] + adot[i]*T;
        var e = e0[i] + edot[i]*T;
        var I = I0[i] + Idot[i]*T;
        var L = L0[i] + Modulus(Ldot[i]*T, pi2);
        var pom = pom0[i] + pomdot[i]*T;
        var Omg = Omg0[i] + Omgdot[i]*T;
        var omg = pom - Omg;
        var M = L - pom;
        if (T <= -2 || T >=0.5) {
            if (i >3) {
                M = M + b[i]*T*T + c[i]*Math.cos(f[i]*T) + 
                    s[i]*Math.sin(f[i]*T);
            }
        }
        var E = kepler(M,e);
        var sinE = Math.sin(E);
        var cosE = Math.cos(E);
        var bb = a*Math.sqrt(1-e*e);
        var Edot = Ldot[i]/(1-e*cosE);
        xp = a*(cosE-e);
        yp = bb*sinE;
        var vxp = -a*sinE*Edot;
        var vyp = bb*cosE*Edot;
        var cos_omg = Math.cos(omg);
        var sin_omg = Math.sin(omg);
        var cosOmg = Math.cos(Omg);
        var sinOmg = Math.sin(Omg);
        var sinI = Math.sin(I);
        var cosI = Math.cos(I);
        var m11 = cos_omg*cosOmg - sin_omg*sinOmg*cosI;
        var m12 = -sin_omg*cosOmg - cos_omg*sinOmg*cosI;
        x[i] = m11*xp + m12*yp;
        vx[i] = m11*vxp + m12*vyp;
        var m21 = cos_omg*sinOmg + sin_omg*cosOmg*cosI;
        var m22 = cos_omg*cosOmg*cosI - sin_omg*sinOmg;
        y[i] = m21*xp + m22*yp;
        vy[i] = m21*vxp + m22*vyp;
        var m31 = sin_omg*sinI;
        var m32 = cos_omg*sinI;
        z[i] = m31*xp + m32*yp;
        vz[i] = m31*vxp + m32*vyp;
        // heliocentric distance
        rHelio[i] = Math.sqrt(x[i]*x[i]+y[i]*y[i]+z[i]*z[i]);
    }
    
    // heliocentric position -> geocentric position
    // index 2 becomes Sun's geocentric position
    x[2] = -x[2]; y[2] = -y[2]; z[2] = -z[2];
    rGeo[2] = rHelio[2]; rHelio[2]=0;
    vx[2] = -vx[2]; vy[2] = -vy[2]; vz[2] = -vz[2];
    //var dT;
    for (i=0; i<8; i++) {
        if (i != 2 && calculate[i]) {
            x[i] = x[i] + x[2];
            y[i] = y[i] + y[2];
            z[i] = z[i] + z[2];
            rGeo[i] = Math.sqrt(x[i]*x[i]+y[i]*y[i]+z[i]*z[i]);
            // correct for light time
            var dT = rGeo[i]*f1oc;
            x[i] -= vx[i]*dT;
            y[i] -= vy[i]*dT;
            z[i] -= vz[i]*dT;
        }
    }
    
    // RA and Dec with respect to J2000 
    var p = precession_matrix(0,T);
    var output = [];
    for (i=0; i<8; i++) {
        if (!calculate[i]) { continue;}
        // ecliptic long. and lat. wrt J2000
        var lam2000 = Math.atan2(y[i],x[i]);
        var bet2000 = Math.asin(z[i]/rGeo[i]);
        // equatorial coordinates
        var xeq = x[i];
        var yeq = cosEps*y[i] - sinEps*z[i];
        var zeq = sinEps*y[i] + cosEps*z[i];
        // velocity/c wrt J2000.0 mean equator and equinox
        var bx = vx[i]*f1oc;
        var by = (cosEps*vy[i] - sinEps*vz[i])*f1oc;
        var bz = (sinEps*vy[i] + cosEps*vz[i])*f1oc;
        // precessed to the mean equator and equinox of the date
        xp = p.p11*xeq + p.p12*yeq + p.p13*zeq;
        yp = p.p21*xeq + p.p22*yeq + p.p23*zeq;
        zp = p.p31*xeq + p.p32*yeq + p.p33*zeq;
        var betax = p.p11*bx + p.p12*by + p.p13*bz;
        var betay = p.p21*bx + p.p22*by + p.p23*bz;
        var betaz = p.p31*bx + p.p32*by + p.p33*bz;
        var r = Math.sqrt(xp*xp+yp*yp+zp*zp);
        output[i] = {ra:Math.atan2(yp,xp), 
                     dec:Math.asin(zp/r), 
                     ra2000:Math.atan2(yeq,xeq),
                     dec2000: Math.asin(zeq/r),
                     lam2000: lam2000,
                     bet2000: bet2000,
                     rHelio:rHelio[i], 
                     rGeo:rGeo[i], 
                     betax:betax, 
                     betay:betay, 
                     betaz:betaz};
    }
    
    return(output);
}

// Calculate the apparent magnitude of a planet
// The input parameter is an object with the properties:
//   object: planet's name, i: phase angle in degrees, 
//   rHelio: heliocentric distace, rGeo: geometric distance
// For Saturn, the following properties are also needed:
//   T: centuries from J2000, 
//   planet: the object outputed by planetPos() above for the planet
//   sun: the object outputed by planetPos() above for the Sun
// This formulae are taken from 
// Explanatory Supplement 2013, Table 10.6 and formula (10.4)
// and errata on 
// http://aa.usno.navy.mil/publications/docs/exp_supp_errata.pdf
function planetMag(para) {
    var i = para.i;
    var mag = 5*Math.LOG10E*Math.log(para.rHelio*para.rGeo);
    switch (para.object) {
        case "Mercury":
            mag += -0.6 + (((3.02e-6*i - 0.000488)*i + 0.0498)*i);
            break;
        case "Venus":
            if (i < 163.6){
               mag += -4.47 + ((0.13e-6*i + 0.000057)*i + 0.0103)*i;
            } else {
               mag += 0.98 -0.0102*i;
            }
            break;
        case "Mars":
            mag += -1.52 + 0.016*i;
            break;
        case "Jupiter":
            mag += -9.40 + 0.005*i;
            break;
        case "Uranus":
            mag += -7.19 + 0.002*i;
            break;
        case "Neptune":
            mag -= 6.87;
            break;
        case "Saturn":
            // this is from Astronomy on Personal Computer
            mag += -8.88 + 0.044*i;
            var deg_to_rad = Math.PI/180;
            var alp0 = (40.589 - 0.036*para.T)*deg_to_rad;
            var del0 = (83.537 - 0.004*para.T)*deg_to_rad;
            var cosAlp0 = Math.cos(alp0), sinAlp0 = Math.sin(alp0);
            var cosDel0 = Math.cos(del0), sinDel0 = Math.sin(del0);
//            var tmp1 = 30838057.5*para.T;
//            tmp1 -= 360*Math.floor(tmp1/360);
//            var W = (227.2037 + tmp1)*deg_to_rad;
//            var cosW = Math.cos(W), sinW = Math.sin(W);
//            var e1x = -cosW*sinAlp0 - sinW*sinDel0*cosAlp0;
//            var e1y = cosW*cosAlp0 - sinW*sinDel0*sinAlp0;
//            var e1z = sinW*cosDel0;
//            var e2x = sinW*sinAlp0 - cosW*sinDel0*cosAlp0;
//            var e2y = -sinW*cosAlp0 - cosW*sinDel0*sinAlp0;
//            var e2z = cosW*cosDel0;
            var e3x = cosDel0*cosAlp0;
            var e3y = cosDel0*sinAlp0;
            var e3z = sinDel0;
            var lam = para.planet.lam2000, bet = para.planet.bet2000;
            var Xgeo = para.planet.rGeo*Math.cos(bet)*Math.cos(lam);
            var Ygeo_ec = para.planet.rGeo*Math.cos(bet)*Math.sin(lam);
            var Zgeo_ec = para.planet.rGeo*Math.sin(bet);
            lam = para.sun.lam2000; bet = para.sun.bet2000;
            var X = Xgeo - para.sun.rGeo*Math.cos(bet)*Math.cos(lam);
            var Y_ec = Ygeo_ec - para.sun.rGeo*Math.cos(bet)*Math.sin(lam);
            var Z_ec = Zgeo_ec - para.sun.rGeo*Math.sin(bet);
            // convert to equatorial coordinates
            var cosEps = 0.917482139208287;
            var sinEps = 0.397776978008764;
            var Ygeo = cosEps*Ygeo_ec - sinEps*Zgeo_ec;
            var Zgeo = sinEps*Ygeo_ec + cosEps*Zgeo_ec;
            var Y = cosEps*Y_ec - sinEps*Z_ec;
            var Z = sinEps*Y_ec + cosEps*Z_ec;
            //var sx = Xgeo*e1x + Ygeo*e1y + Zgeo*e1z;
            //var sy = Xgeo*e2x + Ygeo*e2y + Zgeo*e2z;
            var sz = Xgeo*e3x + Ygeo*e3y + Zgeo*e3z;
            //var longI = Math.atan2(sy,sx);
            var absSinLatc = Math.abs(sz)/para.planet.rGeo;
            //sx = X*e1x + Y*e1y + Z*e1z;
            //sy = X*e2x + Y*e2y + Z*e2z;
            //var long_sun = Math.atan2(sy,sx);
            //var dlong = (long_sun - longI)/deg_to_rad;
            //var dlong_100 = 0.01*Math.abs(dlong-360*Math.floor((dlong+180)/360));
            mag += absSinLatc*(-2.6 + 1.25*absSinLatc);
    }
    return mag;
}

// Calculate the apparent magnitude of a planet
// The input parameter is an object with the properties:
//   object: planet's name, i: phase angle in degrees, 
//   rHelio: heliocentric distace, rGeo: geometric distance
// For Saturn, the following properties are also needed:
//   T: centuries from J2000, 
//   planet: the object outputed by planetPos() above for the planet
//   sun: the object outputed by planetPos() above for the Sun
// This formulae are taken from Astronomy on Personal Computer
function planetMag_astroOnPersonalComputer(para) {
    var io100 = 0.01*para.i;
    var mag = 5*Math.LOG10E*Math.log(para.rHelio*para.rGeo);
    switch (para.object) {
        case "Mercury":
            mag += -0.42 + io100*(3.8 - 2.73*io100 + 2*io100*io100);
            break;
        case "Venus":
            mag += -4.4 + io100*(0.09 + 2.39*io100 - 0.65*io100*io100);
            break;
        case "Mars":
            mag += -1.52 + 1.6*io100;
            break;
        case "Jupiter":
            mag += -9.4 + 0.5*io100;
            break;
        case "Uranus":
            mag -= 7.19;
            break;
        case "Neptune":
            mag -= 6.87;
            break;
        case "Saturn":
            mag -= 8.88;
            var deg_to_rad = Math.PI/180;
            var alp0 = (40.589 - 0.036*para.T)*deg_to_rad;
            var del0 = (83.537 - 0.004*para.T)*deg_to_rad;
            var cosAlp0 = Math.cos(alp0), sinAlp0 = Math.sin(alp0);
            var cosDel0 = Math.cos(del0), sinDel0 = Math.sin(del0);
            var tmp1 = 844*36525*para.T;
            tmp1 -= 360*Math.floor(tmp1/360);
            var tmp2 = 0.3*36525*para.T;
            tmp2 -= 360*Math.floor(tmp2/360);
            var W = (227.2037 + tmp1 + tmp2)*deg_to_rad;
            var cosW = Math.cos(W), sinW = Math.sin(W);
            var e1x = -cosW*sinAlp0 - sinW*sinDel0*cosAlp0;
            var e1y = cosW*cosAlp0 - sinW*sinDel0*sinAlp0;
            var e1z = sinW*cosDel0;
            var e2x = sinW*sinAlp0 - cosW*sinDel0*cosAlp0;
            var e2y = -sinW*cosAlp0 - cosW*sinDel0*sinAlp0;
            var e2z = cosW*cosDel0;
            var e3x = cosDel0*cosAlp0;
            var e3y = cosDel0*sinAlp0;
            var e3z = sinDel0;
            var lam = para.planet.lam2000, bet = para.planet.bet2000;
            var Xgeo = para.planet.rGeo*Math.cos(bet)*Math.cos(lam);
            var Ygeo_ec = para.planet.rGeo*Math.cos(bet)*Math.sin(lam);
            var Zgeo_ec = para.planet.rGeo*Math.sin(bet);
            lam = para.sun.lam2000; bet = para.sun.bet2000;
            var X = Xgeo - para.sun.rGeo*Math.cos(bet)*Math.cos(lam);
            var Y_ec = Ygeo_ec - para.sun.rGeo*Math.cos(bet)*Math.sin(lam);
            var Z_ec = Zgeo_ec - para.sun.rGeo*Math.sin(bet);
            // convert to equatorial coordinates
            var cosEps = 0.917482139208287;
            var sinEps = 0.397776978008764;
            var Ygeo = cosEps*Ygeo_ec - sinEps*Zgeo_ec;
            var Zgeo = sinEps*Ygeo_ec + cosEps*Zgeo_ec;
            var Y = cosEps*Y_ec - sinEps*Z_ec;
            var Z = sinEps*Y_ec + cosEps*Z_ec;
            var sx = Xgeo*e1x + Ygeo*e1y + Zgeo*e1z;
            var sy = Xgeo*e2x + Ygeo*e2y + Zgeo*e2z;
            var sz = Xgeo*e3x + Ygeo*e3y + Zgeo*e3z;
            var longI = Math.atan2(sy,sx);
            var absSinLatc = Math.abs(sz)/Math.sqrt(sx*sx+sy*sy+sz*sz);
            sx = X*e1x + Y*e1y + Z*e1z;
            sy = X*e2x + Y*e2y + Z*e2z;
            var long_sun = Math.atan2(sy,sx);
            var dlong = (long_sun - longI)/deg_to_rad;
            var dlong_100 = 0.01*Math.abs(dlong-360*Math.floor((dlong+180)/360));
            mag += absSinLatc*(-2.6 + 1.25*absSinLatc) + 4.4*dlong_100;
    }
    return mag;
}

// Solve the Kepler's equation M =  - e sin E
function kepler(M, e) {
    // mean anomaly -> [-pi, pi)
  var n2pi = Math.floor(M/(2.0*Math.PI) + 0.5) * (2.0*Math.PI);
  var Mp = M - n2pi;

  // Solve Kepler's equation E - e sin E = M using Newton's iteration method
  var E = Mp; // initial guess
  if (e > 0.8) {E = Math.PI;} // need another initial guess for very eccentric orbit
  var E0 = E*1.01;
  var tol = 1.e-15;
  var iter = 0, maxit = 100;
  while (Math.abs(E-E0) > tol && iter < maxit) {
    E0 = E;
    E = E0 - (E0 - e*Math.sin(E0) - Mp)/(1.0 - e*Math.cos(E0));
    iter++;
  }
  if (iter==maxit) {
    // Newton's iteration doesn't converge after 100 iterations, use bisection instead.
    iter = 0; maxit = 60;
    if (Mp > 0.0) {
      E0 = 0.0; E = Math.PI;
    } else {
      E = 0.0; E0 = -Math.PI;
    }
    while (E-E0 > tol && iter < maxit) {
      var E1 = 0.5*(E+E0);
      var z = E1 - e*Math.sin(E1) - Mp;
      if (z > 0.0) {
        E = E1;
      } else {
        E0 = E1;
      }
      iter++;
    }
  }

  return(E);
}

// Aberration of light to order v/c.
// Given a position (ra, dec) w.r.t. true equator and equinox of date,
// return (ra, dec) corrected for the aberration of light. 
// para is an object that should contain the following properties: 
// T: TT Julian centuries from J2000.0, 
// m: nutation matrix that transforms from mean to true positions at T
// LAST (optional): local apparent sidereal time. If present, 
//                  the diurnal aberration of light will also be added. 
// cosLat, sinLat (optional): cos(latitute) and sin(latitute). Used to 
//                  calculate the diurnal aberration of light.
function aberration(ra, dec, para) {
    // Calculate Earth's heliocentric v/c
    var calculate = [false,false,true,false,false,false,false,false];
    var sun = planetPos(para.T, calculate)[2];
    // transform to components wrt true equator and equinox of date
    // - sign comes from beta_earth = -beta_sun
    var betax = -(para.m.p11*sun.betax + para.m.p12*sun.betay + para.m.p13*sun.betaz);
    var betay = -(para.m.p21*sun.betax + para.m.p22*sun.betay + para.m.p23*sun.betaz);
    var betaz = -(para.m.p31*sun.betax + para.m.p32*sun.betay + para.m.p33*sun.betaz);
    
    // Add diurnal aberration of light
    if ("LAST" in para) {
        var omega = 7.292115855264215e-5; // Earth's spin ang. velocity
        // Earth's equatorial spin speed / c
        var a = omega*6378.1366/299792.458; 
        // (1-f)^2, where f = 1/298.25642 
        var f1_f2 = 0.9933056020041341;
        var aC_cosLat = para.cosLat * a/Math.sqrt(para.cosLat*para.cosLat + f1_f2*para.sinLat*para.sinLat);
        betax -= aC_cosLat*Math.sin(para.LAST);
        betay += aC_cosLat*Math.cos(para.LAST);
    }
    
    // Correct for aberration of light
    var x = Math.cos(ra)*Math.cos(dec) + betax;
    var y = Math.sin(ra)*Math.cos(dec) + betay;
    var z = Math.sin(dec) + betaz;
    var norm = Math.sqrt(x*x + y*y + z*z);
    
    return {ra:Math.atan2(y,x), dec:Math.asin(z/norm)};
}

// Calculate fraction of Moon illuminated, apparent magnitude, 
// and Moon's phase.
// Input parameters: 
// sunRa, sunDec: Ra and Dec of the Sun (in radians)
// moonRa, moonDec: Ra and Dec of the Moon (in radians)
// sunLam, moonLam: ecliptic longitude of the Sun and Moon.
// Dmoon: distance of the moon (in km)
// Dsun: Earth-Sun distance (in AU)
// Note: sunRa, sunDec, moonRa, moonDec must be in the same ref. frame,
//       sunLam, moonLam must also be in the same ref. frame. 
//       But the ref. frames of sunRa and sunLam may differ.
function moonIlluminated(sunRa,sunDec,moonRa,moonDec, sunLam,moonLam, 
                           Dmoon, Dsun) {
    // Earth-Moon dist/Earth-Sun dist.
    var sigma = Dmoon/(149597870.7*Dsun); 
    // cos(angle between Sun and Moon)
    var cosE = Math.sin(sunDec)*Math.sin(moonDec) +  
        Math.cos(sunDec)*Math.cos(moonDec)*Math.cos(sunRa-moonRa);
    // Moon-Sun distance/Earth-Sun distance
    var dMS = Math.sqrt(1 - 2*sigma*cosE + sigma*sigma);
    // Moon's cos(phase angle)
    var cosi = (sigma - cosE)/dMS;
    var illum = 0.5*(1+cosi);
    
    // apparent magnitude
    var i = Math.acos(cosi)*180.0/Math.PI;
    var mag = -12.73 + 0.026*i + 4.e-9*i*i*i*i + 5.0*Math.LOG10E*Math.log(Dmoon*dMS*Dsun/384400.0);
    
    // phase 
    // waxing or waning?
    var waxWan = "waning";
    var dL = moonLam-sunLam;
    dL -= 2*Math.PI*Math.floor(0.5*(dL/Math.PI + 1));
    if (dL > 0) {
        waxWan = "waxing";
    }
    // full if illum >=0.99, 
    // nearly full if illum in (0.95,0.99),
    // gibbous if illum in (0.55, 0.95), 
    // quarter if illum in (0.45, 0.55),
    // crescent if illum in (0.05, 0.45)
    // thin crescent if illum in (0.01,0.05),
    // new if illum <= 0.05
    var phase = "";
    if (illum >= 0.95) {
        phase = "full moon";
        if (illum < 0.99) {phase = "nearly full";}
    } else if (illum > 0.55) {
        phase = waxWan+" gibbous";
    } else if (illum > 0.45) {
        if (waxWan=="waxing") {
            phase = "first quarter";
        } else {
            phase = "third quarter";
        }
    } else if (illum > 0.05) {
        phase = waxWan+" crescent";
    } else if (illum > 0.01) {
        phase = waxWan+" (thin) crescent";
    } else {
        phase = "new moon";
    }
    
    // Solar elongation
    var elong = Math.acos(cosE);
    var elongTxt = (elong*180/Math.PI).toFixed(1)+"&deg;";
    if (dL > 0) {
        elongTxt += " E";
    } else {
        elongTxt += " W";
    }
    
    return {illuminated:illum, phase:phase, elong:elong, elongTxt:elongTxt, mag:mag};
}

// Elongation, phase angle and fraction illuminated for planets
// planet: object returned by planetPos()[j], where j is the index 
//         of the corresponding planet
// sun: object returned by planetPos()[2]
// The returned angles are in degrees. 
// elongation and phase are strings, phaseAng and elongFloat 
// are floats. elongFloat is positive if it the planet is to 
// the east of the Sun, negative if it's to the west of the Sun.
function elongationPhase(planet,sun) {
    var rad_to_deg = 180/Math.PI;
    // Elongation
    var Elong = 0.5*(planet.rGeo*planet.rGeo + sun.rGeo*sun.rGeo 
                 -planet.rHelio*planet.rHelio) / (sun.rGeo*planet.rGeo);
    Elong = Math.acos(Elong)*180/Math.PI;
    var dL = planet.lam2000 - sun.lam2000;
    dL -= 2*Math.PI*Math.floor(0.5*(dL/Math.PI + 1));
    var ElongString;
    if (dL > 0) {
        ElongString = Elong.toFixed(1)+"&deg; E";
    } else {
        ElongString = Elong.toFixed(1)+"&deg; W";
        Elong = -Elong;
    }
    // compute the fraction of the planet illuminated 
    var cosi = 0.5*(planet.rGeo*planet.rGeo + planet.rHelio*planet.rHelio 
                     - sun.rGeo*sun.rGeo)/(planet.rHelio*planet.rGeo);
    var illum = 0.5*(1+cosi);
    var phaseAng = Math.acos(cosi)*rad_to_deg;
    
    return {elongation:ElongString, illuminated:illum.toFixed(2), 
            phaseAng:phaseAng, elongFloat:Elong};
}