"use strict";

// Compute the precession matrix used for tranforming 
// the ra and dec from time T0 to T0+T
function precession_matrix(T0,T) {
    if (T0==0) {
        return precessionMatrixVondrak(T);
    } else {
        var p0 = precessionMatrixVondrak(T0);
        var p1 = precessionMatrixVondrak(T0+T);
        var p = {};
        // Inverse of p0 is the transpose of p0
        p.p11 = p1.p11*p0.p11 + p1.p12*p0.p12 + p1.p13*p0.p13;
        p.p12 = p1.p11*p0.p21 + p1.p12*p0.p22 + p1.p13*p0.p23;
        p.p13 = p1.p11*p0.p31 + p1.p12*p0.p32 + p1.p13*p0.p33;
        p.p21 = p1.p21*p0.p11 + p1.p22*p0.p12 + p1.p23*p0.p13;
        p.p22 = p1.p21*p0.p21 + p1.p22*p0.p22 + p1.p23*p0.p23;
        p.p23 = p1.p21*p0.p31 + p1.p22*p0.p32 + p1.p23*p0.p33;
        p.p31 = p1.p31*p0.p11 + p1.p32*p0.p12 + p1.p33*p0.p13;
        p.p32 = p1.p31*p0.p21 + p1.p32*p0.p22 + p1.p33*p0.p23;
        p.p33 = p1.p31*p0.p31 + p1.p32*p0.p32 + p1.p33*p0.p33;
        return p;
    }
}

// Compute the precession matrix used for tranforming 
// the ra and dec from time T0 to T0+T
// Equations given by Astronomy on Personal Computer, pp. 22-23
function precessionMatrixAstronomyOnPersonalComputer(T0,T) {
    var T0sq = T0*T0;
    var Tsq = T*T;
    var Tcube = Tsq*T;
    var sec_to_rad = Math.PI/180/3600;
    var zeta = (2306.2181+1.39656*T0-0.000139*T0sq)*T + 
        (0.30188-0.000345*T0)*Tsq + 0.017998*Tcube;
    zeta *= sec_to_rad;
    zeta -= 2*Math.PI*Math.floor(zeta*0.5/Math.PI);
    var cosZeta = Math.cos(zeta);
    var sinZeta = Math.sin(zeta);
    var theta = (2004.3109-0.8533*T0-0.000217*T0sq)*T + 
        (-0.42665-0.000217*T0)*Tsq - 0.041833*Tcube;
    theta *= sec_to_rad;
    theta -= 2*Math.PI*Math.floor(theta*0.5/Math.PI);
    var cosTheta = Math.cos(theta);
    var sinTheta = Math.sin(theta);
    var z = (0.7928+0.000411*T0)*Tsq + 0.000205*Tcube;
    z *= sec_to_rad;
    z -= 2*Math.PI*Math.floor(z*0.5/Math.PI);
    z += zeta;
    var cosZ = Math.cos(z);
    var sinZ = Math.sin(z);
    
    var p = {};
    p.p11 = -sinZ*sinZeta + cosZ*cosTheta*cosZeta;
    p.p12 = -sinZ*cosZeta - cosZ*cosTheta*sinZeta;
    p.p13 = -cosZ*sinTheta;
    p.p21 = cosZ*sinZeta + sinZ*cosTheta*cosZeta;
    p.p22 = cosZ*cosZeta - sinZ*cosTheta*sinZeta;
    p.p23 = -sinZ*sinTheta;
    p.p31 = sinTheta*cosZeta;
    p.p32 = -sinTheta*sinZeta;
    p.p33 = cosTheta;
    
    return p;
}

// Compute the precessed ra and dec at time T0+T from 
// the ra and dec at time T0 and the transformation 
// matrix p computed in precession_matri() above
// All angles are in radians
function precessed_ra_dec(ra0,dec0,p) {
    var x0 = Math.cos(dec0)*Math.cos(ra0);
    var y0 = Math.cos(dec0)*Math.sin(ra0);
    var z0 = Math.sin(dec0);
    var x = p.p11*x0 + p.p12*y0 + p.p13*z0;
    var y = p.p21*x0 + p.p22*y0 + p.p23*z0;
    var z = p.p31*x0 + p.p32*y0 + p.p33*z0;
    var dec = Math.asin(z);
    var ra = Math.atan2(y,x);
    return({ra:ra, dec:dec});
}

// Precession matrix given by J. Vondrak, N. Capitaine, P. Wallace, 
// A&A 534, A22 (2011), DOI: 10.1051/0004-6361/201117274
// with correction from A&A 541, C1 (2012), DOI: 10.1051/0004-6361/201117274e
// The matrix precesses from T0=0 (J2000) to T (century from J2000).
// It is valid for |T| < 2000.
// The periodic coefficients are taken from Tables 4 and 6 of the paper.
// The matrix is computed using Eq. (20) in the paper.
function precessionMatrixVondrak(T) {
    var omega = [0.01559490024120026, 0.0244719973015758, 0.02151775790129995, 0.01169573974755144, 0.02602271819084525, 0.01674533688817117, 0.0397997422384214, 0.02291460724719032, 0.03095165175950535, 0.01427996660722633, 0.03680403764749055, 0.008807750966790847, 0.02007407446383254, 0.0489420883874403, 0.03110487775831478, 0.01994662002279234, 0.04609144151393476, 0.01282282715750936];
    var cPsiA = [-0.1076593062579846, 0.05932495062847037, -0.007703729840835942, 0.01203357586861691, 0.000728786082003343, -6.609012098588148e-05, 0.001888045891520004, 0.009848668946298234, 0.001763501537747769, -0.004347554865592219, -0.004494201976897112, 0.000179723665294558, -0.002897646374457124, 0.0003213481408001133, 0, 0, 0, 0];
    var sPsiA = [-0.01572365411244583, -0.01924576393436911, 0.03441793111567203, -0.009229382101760265, 0.0007099369818066644, 0.00630563269451746, 0.008375146833970948, 0.001453733482001713, -0.005900793277074788, -0.002285254065278213, -0.002141335465978059, -0.0004177599299066708, -0.001494779621447613, -0.002049868015261339, 0, 0, 0, 0];
    var cOmgA = [0.00614611792998422, 0.008253100851149026, -0.01440165141619654, 0.003363590350788535, -7.138615291626988e-05, -0.002504786979418468, -0.00172978832643207, -0.0006280861013429611, 0.001241749955604002, 0.0009224361511874661, 0.0004610771596491818, -0.001613979006196489, 0.0006367428132294327, 0.0004010956619564596, 0, 0, 0, 0];
    var sOmgA = [-0.04155568953790275, 0.0257426196723017, -0.002959273392809311, 0.004475809265755418, 1.822441292043207e-05, -0.0001972760876678778, 0.000389971927172294, 0.003913904086152674, 0.0004058488092230152, -0.001787289168266385, -0.0009302656497305446, -2.067134029104406e-05, -0.0013107116813526, 5.625225752812272e-05, 0, 0, 0, 0];
    var cChiA = [-0.06673908312554792, 0.06550733801292973, -0.007055149797375992, 0.005111848628877972, 0, -0.0005444464620177098, 0.0009830562551572195, 0.009386235733694169, 0, -0.003177877146985308, -0.004324046613805478, 0, 0, -0.001615990759958801, 0.001587849478343136, -0.002398762740975183, 0.002838548328494804, 0.0005357813386138708];
    var sChiA = [-0.01069967856443793, -0.02029794993715239, 0.03266650186037179, -0.0041544791939612, 0, 0.004640389727239152, 0.008287602553739408, 0.0007486759753624905, 0, -0.00118062300801947, -0.001970956729830991, 0, 0, -0.002165451504436122, -0.005086043543188153, -0.001461733557390353, 0.0002004643484864111, 0.000690981600754813];
    
    var psiA = 0.04107992866630529 + T*(0.02444817476355586 
                                        + T*(-3.592047589119096e-08 + 1.401111538406559e-12*T));
    var omgA = 0.4086163677095374 + T*(-2.150908863572772e-06 
                                       + T*(7.078279744199225e-12 + 7.320686584753994e-13*T));
    var chiA = -9.530113429264049e-05 + T*(3.830798934518299e-07 
                                           + T*(7.13645738593237e-11 - 2.957363454768169e-13*T));
    for (var i=0; i<18; i++) {
        var ang = omega[i]*T;
        var cosAng = Math.cos(ang), sinAng = Math.sin(ang);
        psiA += cPsiA[i]*cosAng + sPsiA[i]*sinAng;
        omgA += cOmgA[i]*cosAng + sOmgA[i]*sinAng;
        chiA += cChiA[i]*cosAng + sChiA[i]*sinAng;
    }
    var cEps = 0.9174821430652418, sEps = 0.397776969112606;
    var sPsi = Math.sin(psiA), cPsi = Math.cos(psiA);
    var sOmg = Math.sin(omgA), cOmg = Math.cos(omgA);
    var sChi = Math.sin(chiA), cChi = Math.cos(chiA);
    
    var p = {};
    p.p11 = cChi*cPsi + sChi*cOmg*sPsi;
    p.p12 = (-cChi*sPsi + sChi*cOmg*cPsi)*cEps + sChi*sOmg*sEps;
    p.p13 = (-cChi*sPsi + sChi*cOmg*cPsi)*sEps - sChi*sOmg*cEps;
    p.p21 = -sChi*cPsi + cChi*cOmg*sPsi;
    p.p22 = (sChi*sPsi + cChi*cOmg*cPsi)*cEps + cChi*sOmg*sEps;
    p.p23 = (sChi*sPsi + cChi*cOmg*cPsi)*sEps - cChi*sOmg*cEps;
    p.p31 = sOmg*sPsi;
    p.p32 = sOmg*cPsi*cEps - cOmg*sEps;
    p.p33 = sOmg*cPsi*sEps + cOmg*cEps;
    
    return p;
}

// Compute the Ra and Dec of the ecliptic north pole 
// at time T (Julian century from J2000)
// with respect to the J2000.0 mean equator 
// and equinox. They are calculated by 
// ra = gamma - pi/2 and dec = pi/2 - phi, 
// where gamma and phi are given by equation 
// (14) and Table 7 in the paper 
// New precession expressions, valid for long time intervals,
// by Vondrak, Capitaine and Wallace, A&A 534, A22 (2011).
// The relation between ra and dec (of the ecliptic north pole)
// and gamma, phi follows from the definition of the angles 
// gamma and phi.
function getEclipticNorthPole(T) {
    // periodic coefficients from Table 7
    // 2*pi/periods :
    var omega = [0.008872675714438448, 0.002721171635850839, 0.01276551261109221, 0.005311230183583759, 0.01010158409514403, 0.01774911103723047, 0.006457538856299678, 0.01169573974755144, 0.01402496720352586, 0.01559490024120026];
    var coefCosPhi = [-0.004042409513143679, 0.01369057902014126, -0.00272231303641459, 6.066147796929918e-05, -0.002643611413508775, 0.0003705237378617317, 0.0001300171245300725, 0.001793366356240462, 0.0006949647136035256, -0.0002841056070893575];
    var coefSinPhi = [-0.02679541800930862, -0.005879989388723328, 0.002379320151262638, -0.001124940920469153, -0.0002535950507103844, -0.0002334436585479198, -4.630035619629337e-05, 0.0001949605448048464, -0.0001582323402321061, 6.429759997016795e-05];
    var coefCosGamma = [-0.07027648004398257, -0.01050635377614501, 0.009206833364122355, -0.004338070256775063, 0.00159873402544959, -0.001266401388354526, 0.002365565589582342, -0.001406551395163585, -0.002497496966995317, 0.001041115112690355];
    var coefSinGamma = [0.01094614582138286, -0.03731722874613446, 0.004834754426333641, 0.001314243946566702, 0.005865328196370537, -0.001594566164651417, -0.001397371249338167, -0.003275851922070258, -0.0005344059415931104, 0.0001760885226173251];
    
    var T2 = T*T;
    var T3 = T*T2;
    var phi = 0.4020449277403929 + 8.343285174584774e-06*T 
            + 1.073862303657622e-09*T2 -3.456721546310992e-12*T3;
    var gamma = 0.07607910574041958 + 8.044557043881831e-06*T 
            - 8.706623454941823e-09*T2 - 3.616710061077139e-12*T3;
    
    for (var i=0; i<10; i++) {
        var cosOmegaT = Math.cos(omega[i]*T);
        var sinOmegaT = Math.sin(omega[i]*T);
        phi += coefCosPhi[i]*cosOmegaT + coefSinPhi[i]*sinOmegaT;
        gamma += (coefCosGamma[i]*cosOmegaT 
                 + coefSinGamma[i]*sinOmegaT);
    }
    return {ra:gamma-0.5*Math.PI, dec:0.5*Math.PI-phi};
}

// Compute the mean obliquity of the ecliptic at time T 
// (Julian century from J2000). They are calculated using 
// equation (10) and Table 3 in the paper 
// New precession expressions, valid for long time intervals,
// by Vondrak, Capitaine and Wallace, A&A 534, A22 (2011).
function epsA(T) {
    var omega = [0.01532858089089921, 0.015860621752315, 0.01169573974755144, 0.01559490024120026, 0.01506217261699529, 0.02174714560147994, 0.001554089860791389, 0.02053328531758035, 0.02268297944830176, 0.03095165175950535];
    var cEps = [0.003654878375600794, -0.001201396532490081, 0.001839729670341384, -0.0002612203166421586, -0.0004368615016759239, -0.001714302097549313, -0.0003059918662245779, -0.0001369510752414054, 8.582844219576704e-05, 0.0001886473398345326];
    var sEps = [-0.008264717248747798, -0.004180588892934996, 0.00217115166735481, -0.004312766318139272, 0.000923099046629921, -0.0002742348150863777, -0.001436127797997386, -0.0003677794257791271, 0.0003271207736678532, 1.461255099616602e-05];
    var eps = 0.4073802401575857 + T*(1.757180522429052e-06 
                                       - T*(1.958162458001416e-10 
                                            + 5.332950492204896e-13*T));
    for (var i=0; i<10; i++) {
        var ang = omega[i]*T;
        var cosAng = Math.cos(ang), sinAng = Math.sin(ang);
        eps += cEps[i]*cosAng + sEps[i]*sinAng;
    }
    return eps;
}

// Compute the nutation matrix and the equation of equinoxes. 
// Using equations from Kaplan (2005): The IAU Resolutions on 
// Astronomical Reference Systems, Time Scales, 
// and Earth Rotation Models. Circular 179, U.S. Naval Observatory, 
// Washington, D.C.
// http://aa.usno.navy.mil/publications/docs/Circular_179.pdf
// All angles are converted to radians
function nutation(T) {
    var T2 = T*T;
    var T3 = T*T2;
    var T4 = T2*T2;
    var T5 = T2*T3;
    var tpi = 2*Math.PI;
    var mod2pi = function(x) { 
        return x - tpi*Math.floor((x+Math.PI)/tpi);
    }
    // Compute the mean obliquity of ecliptic from Eq. (5.12) 
    // in Kaplan (2005)
    var epsA = 0.4090926006005829 - 0.00022707106390167*T 
        - 8.876938501115605e-10*T2 + 
        9.712757287348442e-09*T3 - 2.792526803190927e-12*T4 
        - 2.104091376015386e-13*T5;
    
    // Compute the angles L, Lp, F, D, Omega using Eq. (5.19)
    // in Kaplan (2005)
    var L = mod2pi(2.355555743493879 + mod2pi(8328.691425719086*T) 
                   + 0.0001545547230282712*T2 + 
                   2.503335442409089e-07*T3 
                   - 1.186339077675034e-09*T4 );
    var Lp = mod2pi( -0.04312518025660639 + 
                     mod2pi(628.3019551713968*T) 
                     - 2.681989283897953e-06*T2 + 
                     6.593466063089689e-10*T3 
                     - 5.570509195948569e-11*T4);
    var F = mod2pi( 1.627905081537519 + mod2pi(8433.466156916373*T) 
                   - 6.181956210563916e-05*T2 
                   - 5.027517873105888e-09*T3 
                   + 2.021673050226765e-11*T4);
    var D = mod2pi( -1.084718718529083 + mod2pi(7771.377145593714*T) 
                   - 3.08855403687641e-05*T2 + 
                     3.196376599555171e-08*T3 
                   - 1.53637455543612e-10*T4); 
    var Omg = mod2pi( 2.182439196615671 + mod2pi(-33.75704595363087*T) 
                     + 3.622624787986675e-05*T2 + 
                     3.734034971905646e-08*T3 
                     - 2.879308452109534e-10*T4);
    var Dpsi = -(8.341905928143386e-05 + 
                 8.46804664246782e-08*T)*Math.sin(Omg) 
               - 6.385435421407674e-06*Math.sin(2*(F-D+Omg)) 
               - 1.103636166255602e-06*Math.sin(2*(F+Omg)) + 
                 1.005772161400512e-06*Math.sin(2*Omg) + 
                 7.155253612348986e-07*Math.sin(Lp) 
               - 2.505618914847115e-07*Math.sin(Lp + 2*(F-D+Omg)) + 
                 3.447796126441765e-07*Math.sin(L);
    var Deps = 4.462822944682345e-05*Math.cos(Omg) + 
               2.778145290154494e-06*Math.cos(2*(F-D+Omg)) + 
               4.743703096047555e-07*Math.cos(2*(F+Omg)) 
               - 4.351164002863597e-07*Math.cos(2*Omg);
    var eps = epsA + Deps;
    var cosDpsi = Math.cos(Dpsi), sinDpsi = Math.sin(Dpsi);
    var cosEpsA = Math.cos(epsA), sinEpsA = Math.sin(epsA);
    var cosEps = Math.cos(eps), sinEps = Math.sin(eps);
    // Ee: dominant term of the equation of equinoxes
    var out = {Ee:Dpsi*cosEpsA};
    // Nutation matrix from Eq. (6.41) in Explanatory Supplement 
    // to the Astronomical Almanac
    out.p11 = cosDpsi; 
    out.p12 = -sinDpsi*cosEpsA; 
    out.p13 = -sinDpsi*sinEpsA;
    out.p21 = sinDpsi*cosEps;
    out.p22 = cosDpsi*cosEps*cosEpsA + sinEps*sinEpsA;
    out.p23 = cosDpsi*cosEps*sinEpsA - sinEps*cosEpsA;
    out.p31 = sinDpsi*sinEps;
    out.p32 = cosDpsi*sinEps*cosEpsA - cosEps*sinEpsA;
    out.p33 = cosDpsi*sinEps*sinEpsA + cosEps*cosEpsA;
    return out;
}