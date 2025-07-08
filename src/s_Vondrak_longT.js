"use strict";
/*
This file contains the function double s_Vondrak_longT(jd0, jd1)
that calculates the CIO locate s compatible with
Vondrak et al precession model at TT Julian date jd = jd0 + jd1 using a fitting formula
valid for long period from J2000. s is returned in radians.

JD must be in the range so that |T| = |(jd-2451545)/36525| <= 2000.

Following SOFA, Julian date is specified by two parts jd0 and jd1 in any way
users may find convenient. For example, JD(TT)=2450123.7 could be expressed
in any of these ways, among others.

            jd0             jd1
         2450123.7           0.0       (JD method)
         2451545.0       -1421.3       (J2000 method)
         2400000.5       50123.2       (MJD method)
         2450123.5           0.2       (date & time method)

The fitting formulas include IAU 2000A nutation for |T| <= 59.8, but ignore
nutation for |T| >= 60. For 59.8 < |T| < 60, a weighted average of the two
sets of fitting formulas is calculated to ensure continuity.

Accuracy of the fitting formula:
For |T| < 59.8, the accuracy is the same as s_Vondrak_IAU2000A_spline():
time period      estimated max error    rms error
--------------------------------------------------
-59.8 < T < -40          12.5 mas           3.14 mas
-40 < T < -20          7.22 mas           1.64 mas
-20 < T < -5          3.18 mas           0.586 mas
-5 < T < 5            0.622 mas          0.119 mas
5 < T < 20            2.96 mas           0.594 mas
20 < T < 40           7.07 mas           1.66 mas
40 < T < 59.8           11.9 mas           3.05 mas

For T > 59.8, the estimated maximum error is 51" and the rms error is 18".
For T < -59.8, the estimated maximum error is 69" and the rms error is 22".

The fitting formulas and code were developed by Yuk Tung Liu in June 2025.
*/

function s_Vondrak_longT(jd0, jd1) {
    let T = ((jd0 - 2451545) + jd1)/36525;
    if (Math.abs(T) <= 59.8) {
        return s_Vondrak_IAU2000A_spline(jd0, jd1);
    } else if (Math.abs(T) >= 60) {
        return calc_sA_Vondrak_fit(T);
    }

    // T is near a boundary. Calculate s by taking a weighted average of two
    // fitting formulas.
    let r = 0.2, Tb = 59.9;
    let x = (T < 0 ? (T + Tb)/r:(T-Tb)/r);
    let w = Math.sin(0.5*Math.PI*(x + 0.5));
    w *= w;
    let s1, s2;
    if (T < 0) {
        s1 = s_Vondrak_IAU2000A_spline(jd0, jd1);
        s2 = calc_sA_Vondrak_fit(T);
    } else {
        s1 = calc_sA_Vondrak_fit(T);
        s2 = s_Vondrak_IAU2000A_spline(jd0, jd1);
    }
    return w*s1 + (1-w)*s2;
}

// Calculate s according to the large T fitting formula
function calc_sA_Vondrak_fit(T) {
    let cof = set_sA_coefficients(T);
    let s = cof.cpoly[0] + T*(cof.cpoly[1] + T*(cof.cpoly[2] + T*(cof.cpoly[3])));
    let w0 = [0.0244719973015758, 0.01559915913299631, 0.008872675714438448,
                0.02174714560147994, 0.02291460724719032, 0.01169573974755144,
                0.02602271819084525, 0.008609343948671007, 0.01300866523225587,
                0.01433797021400115, 0.0489420883874403, 0.004048444141223960,
                0.02726603587562744];
    let w1 = [0.0244719973015758, 0.02174714560147994, 0.0489420883874403,
                0.02726603587562744];
    let nw0 = 13, nw1 = 4;
    for (let i=0; i<nw0; i++) {
        s += cof.csin0[i]*Math.sin(w0[i]*T + cof.ph0[i]);
    }
    for (let i=0; i<nw1; i++) {
        s += T*cof.csin1[i]*Math.sin(w1[i]*T + cof.ph1[i]);
    }
    return s;
}

// Set the coefficients of the fitting formula for s
function set_sA_coefficients(T) {
    let cpoly, csin0, ph0, csin1, ph1;
    if (T < 0) {
        cpoly = [-10921.15341946724, -78.97914633444395, -0.0974231628298029,
                -3.072466336094696e-05];
        csin0 = [10913.61027185324, 5348.072635380423, 65785.58490479669,
                15529.11728359016, 19678.97119466826, 20294.41269163136,
                2200.57045686006, 61488.53426828337, 25160.73788861325,
                16447.31231675615, 0.001915241630489977, 9307.225305128086,
                537.4834457638518];
        ph0 = [2.972459435872397, 0.8017028261531852, -0.042951330979442, 1.770801089378011, -0.8362177650328477, -0.1955555980621227, -0.6515956220138474, 2.819973786062417, -1.945930689599316, 2.605120060893733, 0.3697352250789654, 1.137764274996736, -2.854314382181356];
        csin1 = [8.570243217160346, 9.506801869574725, 2.841065044983877e-07, 0.1927605467607191];
        ph1 = [2.399636864044629, 2.629958510531899, 1.049878940842754, 2.253452439339636];
    } else {
        cpoly = [1085.582855435547, -13.50156959789262, 0.01899107275501789, -6.466577216660052e-06];
        csin0 = [3472.261882945576, 1399.212893399309, 14924.01115751921, 4772.389337255103, 6370.625516904594, 4850.866383252298, 788.1234072684214, 13890.08631905833, 6186.097748655683, 4170.547132149874, 0.001637609453881160, 1990.582415469754, 196.1012033100859];
        ph0 = [-1.115893383825218, 0.3923287964311375, 0.7293970037417233, -0.0637675610858912, 2.584298596229646, 1.096159051268726, 2.642956309154746, -2.15362031170061, 2.94547062589904, -1.505706226484374, 0.2935000536518595, -0.8225422528651628, -1.361216013337077];
        csin1 = [2.917782881908774, 2.965977906101449, 2.635981229428513e-07, 0.07184731232231986];
        ph1 = [2.611160048004844, 2.169904554278817, -1.139655110865688, 2.978250866669941];
    }
    return {cpoly:cpoly, csin0:csin0, ph0:ph0, csin1:csin1, ph1:ph1};
}
