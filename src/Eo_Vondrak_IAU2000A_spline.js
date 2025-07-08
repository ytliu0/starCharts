"use strict";
/*
This file contains the function Eo_Vondrak_IAU2000A_spline(jd0, jd1, Dpsi='122')
that calculates the equation of origin Eo compatible
with Vondrak et al/IAU2000A precession-nutation model at TT Julian date
jd = jd0 + jd1 using a spline fitting formula.

Eo is returned in radians.

JD must be in the range so that |T| = |(jd-2451545)/36525| <= 60.

The interval [-60,60] are divided into sub-intervals [-60, -40],
[-40, -20], [-20, -5], [-5, 5], [5, 20], [20, 40] and [40, 60].
Each sub-interval has a fitting formula. The inner boundary points
-40, -20, -5, 5, 20 and 40 are the knots in the regression spline.
The function Eo(T) and its first derivative Eo'(T) are continuous, but
the second and higher derivatives of Eo are discontinuous at the knots.

Following SOFA, Julian date is specified by two parts jd0 and jd1 in any way
users may find convenient. For example, JD(TT)=2450123.7 could be expressed
in any of these ways, among others.

            jd0             jd1
         2450123.7           0.0       (JD method)
         2451545.0       -1421.3       (J2000 method)
         2400000.5       50123.2       (MJD method)
         2450123.5           0.2       (date & time method)

Accuracy of the spline formula (using a truncated Delta psi expression with 122 terms):
time period      estimated max error    rms error
--------------------------------------------------
-60 < T < -40         2.97 mas           0.596 mas
-40 < T < -20         2.32 mas           0.467 mas
-20 < T < -5          2.04 mas           0.408 mas
-5 < T < 5            2.07 mas           0.396 mas
5 < T < 20            2.37 mas           0.408 mas
20 < T < 40           2.74 mas           0.491 mas
40 < T < 60           3.63 mas           0.824 mas

If a truncated Delta psi expression with 8 terms are used, the estimated maximum error is 0.15"
and the rms error is 0.04".

The fitting formula and code were developed by Yuk Tung Liu in June 2025.
*/

function Eo_Vondrak_IAU2000A_spline(jd0, jd1, Dpsi='122') {
    let jd_int = Math.floor(jd0 + jd1);
    let fday = (jd0 - Math.floor(jd0)) + (jd1 - Math.floor(jd1));
    fday -= Math.floor(fday);
    let T = ((jd_int - 2451545) + fday)/36525;

    let Eo;
    if (Dpsi=='122') {
        // Calculate Delta psi using truncated expression with 122 terms
        let F = f_angles_full(jd_int, fday);
        Eo = Eop_Vondrak_IAU2000A_spline(T, F[4]) - Dpsi_cos_epsilonA(T, F);
    } else {
        // Calculate Delta psi using truncated expression with 8 terms
        let F = f_angles(jd_int, fday)
        Eo = Eop_Vondrak_IAU2000A_spline(T, F[4]) - Dpsi_cos_epsilonA_t8(T, F);
    }
    return Eo;
}

// Set the coefficients of the spline formula for Eo + Dpsi cos(epsilon_A)
function set_Eop_coefficients(T) {
    let csin = [1.278687035263072e-08, 2.991955490317251e-10];
    let ph = [-3.141431849335106, -3.129942218845127];
    let T0, cpoly;
    if (Math.abs(T) <= 5) {
        T0 = 0;
        cpoly = [-7.029051838429728e-08, -0.02236036588274203, -6.744772398120004e-06,
                    3.326168239200108e-11, 1.260687080703534e-10];
    } else if (T >= -20 && T < -5) {
        T0 = -12.5;
        cpoly = [0.2784536399120333, -0.02219271446784961, -6.627806792518711e-06,
                    -6.300029177548349e-09, 1.280006947605919e-10];
    } else if (T >= -40 && T < -20) {
        T0 = -30;
        cpoly = [0.6648424195980085, -0.02196935373260266, -6.052550663498622e-06,
                    -1.580284734141516e-08, 1.422757542796084e-10];
    } else if (T < -40) {
        T0 = -50;
        cpoly = [1.101957675015858, -0.02175077321573791, -4.76323677159108e-06,
                    -2.7019621176594e-08, 1.327902426205912e-10];
    } else if (T > 5 && T < 20) {
        T0 = 12.5;
        cpoly = [-0.28055535693713, -0.02252797753551305, -6.623865056562917e-06,
                    6.487274305837375e-09, 1.322936992702824e-10];
    } else if (T >=20 && T < 40) {
        T0 = 30;
        cpoly = [-0.6767759851418548, -0.02275091013887167, -6.027979162032721e-06,
                    1.644498248728261e-08, 1.50119330008187e-10];
    } else {
        T0 = 50;
        cpoly = [-1.134049896561772, -0.02296751467215479, -4.684438743393382e-06,
                    2.807675328930574e-08, 1.332196864951549e-10];
    }
    return {csin:csin, ph:ph, T0:T0, cpoly:cpoly};
}

// Calculate Eo + Dpsi cos(epsilonA) using the spline fitting formula
function Eop_Vondrak_IAU2000A_spline(T, Omg) {
    let cof = set_Eop_coefficients(T);
    let Tp = T - cof.T0;
    let Eop = cof.cpoly[0] + Tp*(cof.cpoly[1] + Tp*(cof.cpoly[2] + Tp*(cof.cpoly[3] + Tp*cof.cpoly[4]))) + cof.csin[0]*Math.sin(Omg + cof.ph[0]) + cof.csin[1]*Math.sin(2*Omg + cof.ph[1]);
    return Eop;
}
