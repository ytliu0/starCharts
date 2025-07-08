"use strict";
/*
This file contains the function double Eo_Vondrak_longT(jd0, jd1)
that calculates the equation of origin Eo compatible
with Vondrak et al precession model at TT Julian date jd = jd0 + jd1 using a fitting
formula valid for long period from J2000. Eo is returned in radians.

JD must be in the range so that |T| = |(jd-2451545)/36525| <= 2000

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
For |T| <=59.8, the accuracy is the same as Eo_Vondrak_IAU2000A_spline().
For T > 59.8, the estimated maximum error is 51" and the rms error is 18".
For T < -59.8, the estimated maximum error is 69" and the rms error is 22".

The fitting formulas and code were developed by Yuk Tung Liu in June 2025.
*/

function Eo_Vondrak_longT(jd0, jd1, Dpsi='123') {
    let T = ((jd0 - 2451545) + jd1)/36525;
    if (Math.abs(T) <= 59.8) {
        return Eo_Vondrak_IAU2000A_spline(jd0, jd1, Dpsi);
    } else if (Math.abs(T) >= 60) {
        return Eo_Vondrak_from_s(T);
    }

    // T is near a boundary. Calculate s by taking a weighted average of two
    // fitting formulas.
    let r = 0.2, Tb = 59.9;
    let x = (T < 0 ? (T + Tb)/r:(T-Tb)/r);
    let w = Math.sin(0.5*Math.PI*(x + 0.5));
    w *= w;
    let Eo1, Eo2;
    if (T < 0) {
        Eo1 = Eo_Vondrak_IAU2000A_spline(jd0, jd1);
        Eo2 = Eo_Vondrak_from_s(T);
    } else {
        Eo1 = Eo_Vondrak_from_s(T);
        Eo2 = Eo_Vondrak_IAU2000A_spline(jd0, jd1);
    }
    return w*Eo1 + (1-w)*Eo2;
}

// Calculate precession contribution to Eo at TT jd = jd0+jd1
// Vondrak et al's precession model is used
function Eo_Vondrak_from_s(T) {
    let s = calc_sA_Vondrak_fit(T);
    let pb = PB_Vondrak(T);
    let X = pb[2][0], Y = pb[2][1], a = 1.0/(1.0 + pb[2][2]);
    let RST = [1 - a*X*X, -a*X*Y, -X];
    let p = pb[0][0]*RST[0] + pb[0][1]*RST[1] + pb[0][2]*RST[2];
    let q = pb[1][0]*RST[0] + pb[1][1]*RST[1] + pb[1][2]*RST[2];
    return mod2pi(s - Math.atan2(q, p));
}

// Calculate the PB matrix at TT Julian century T
// P is computed by Vondrak et al's precession model
function PB_Vondrak(T) {
    let pp = precessionMatrixVondrak(T);
    let p = [[pp.p11, pp.p12, pp.p13], [pp.p21, pp.p22, pp.p23], [pp.p31, pp.p32, pp.p33]];
    // frame bias matrix
    let b = [[0.9999999999999942, -7.078279744199226e-8, 8.05614893899716e-8],
            [7.078279477859602e-8, 0.999999999999997, 3.306041454222148e-8],
            [-8.056149173008023e-8, -3.30604088398539e-8, 0.9999999999999962]];
    return [[p[0][0]*b[0][0] + p[0][1]*b[1][0] + p[0][2]*b[2][0],
             p[0][0]*b[0][1] + p[0][1]*b[1][1] + p[0][2]*b[2][1],
             p[0][0]*b[0][2] + p[0][1]*b[1][2] + p[0][2]*b[2][2]],
             [p[1][0]*b[0][0] + p[1][1]*b[1][0] + p[1][2]*b[2][0],
              p[1][0]*b[0][1] + p[1][1]*b[1][1] + p[1][2]*b[2][1],
              p[1][0]*b[0][2] + p[1][1]*b[1][2] + p[1][2]*b[2][2]],
             [p[2][0]*b[0][0] + p[2][1]*b[1][0] + p[2][2]*b[2][0],
              p[2][0]*b[0][1] + p[2][1]*b[1][1] + p[2][2]*b[2][1],
              p[2][0]*b[0][2] + p[2][1]*b[1][2] + p[2][2]*b[2][2]]];
}
