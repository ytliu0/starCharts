"use strict";

/*
Calculate the fundamental arguments in the nutation series at
TT Julian date jd = jd_int + fday.
Note that jd_int must be an integer; otherwise the result will be wrong!
For optimal performance, fday should be restricted to the range (0, 1).

F[0] = l = mean anomaly of the Moon
F[1] = l' = mean anomaly of the Sun
F[2] = L - Omega = mean longitude of the Moon - mean longitude of Moon's ascending node
F[3] = D = mean elongation of the Moon from the Sun
F[4] = Omega = mean longitude of Moon's ascending node\
F[5] = L_Me = mean longitide of Mercury
F[6] = L_Ve = mean longitide of Venus
F[7] = L_Ea = mean longitide of Earth
F[8] = L_Ma = mean longitide of Mars
F[9] = L_Ju = mean longitide of Jupiter
F[10] = L_Sa = mean longitide of Saturn
F[11] = L_Ua = mean longitide of Uranus
F[12] = L_Ne = mean longitide of Neptune
F[13] = p_A = general precession in longitude
*/

// Reduced set of arguments: F[0] - F[4]
function f_angles(jd_int, fday) {
    let D0 = jd_int - 2451545;
    let T = (D0+fday)/36525;
    let T2 = T*T, T3 = T*T2, T4 = T2*T2;
    let F = [0, 0, 0, 0, 0];
    F[0] = mod2pi(2.355555743493879
        + mod2pi_omgDf(8328.691425719086/36525, D0, fday)
        + 0.0001545547230282712*T2 +
                 2.503335442409089e-07*T3
                 - 1.186339077675034e-09*T4 );
    F[1] = mod2pi( -0.04312518026630256 +
                    mod2pi_omgDf(628.3019551713968/36525, D0, fday)
                    - 2.681989283897953e-06*T2 +
                    6.593466063089689e-10*T3
                    - 5.570509195948569e-11*T4);
    F[2] = mod2pi(1.627905081537519
                    + mod2pi_omgDf(8433.466156916373/36525, D0, fday)
                    - 6.181956210563916e-05*T2
                    - 5.027517873105888e-09*T3
                    + 2.021673050226765e-11*T4);
    F[3] = mod2pi( -1.084718718519387
                    + mod2pi_omgDf(7771.377145593714/36525, D0, fday)
                    - 3.08855403687641e-05*T2 +
                    3.196376599555171e-08*T3
                    - 1.53637455543612e-10*T4);
    F[4] = mod2pi( 2.182439196615671
                    - mod2pi_omgDf(33.75704595363087/36525, D0, fday)
                    + 3.622624787986675e-05*T2 +
                    3.734034971905646e-08*T3
                    - 2.879308452109534e-10*T4);
    return F;
}

// Full set of arguments: F[0] - F[13]
function f_angles_full(jd_int, fday) {
    let D0 = jd_int - 2451545;
    let T = (D0+fday)/36525;
    let T2 = T*T, T3 = T*T2, T4 = T2*T2;
    F = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    F[0] = mod2pi(2.355555743493879
        + mod2pi_omgDf(8328.691425719086/36525, D0, fday)
        + 0.0001545547230282712*T2 +
                 2.503335442409089e-07*T3
                 - 1.186339077675034e-09*T4 );
    F[1] = mod2pi( -0.04312518026630256 +
                    mod2pi_omgDf(628.3019551713968/36525, D0, fday)
                    - 2.681989283897953e-06*T2 +
                    6.593466063089689e-10*T3
                    - 5.570509195948569e-11*T4);
    F[2] = mod2pi(1.627905081537519
                    + mod2pi_omgDf(8433.466156916373/36525, D0, fday)
                    - 6.181956210563916e-05*T2
                    - 5.027517873105888e-09*T3
                    + 2.021673050226765e-11*T4);
    F[3] = mod2pi( -1.084718718519387
                    + mod2pi_omgDf(7771.377145593714/36525, D0, fday)
                    - 3.08855403687641e-05*T2 +
                    3.196376599555171e-08*T3
                    - 1.53637455543612e-10*T4);
    F[4] = mod2pi( 2.182439196615671
                    - mod2pi_omgDf(33.75704595363087/36525, D0, fday)
                    + 3.622624787986675e-05*T2 +
                    3.734034971905646e-08*T3
                    - 2.879308452109534e-10*T4);
    F[5] = -1.880576465179586 + mod2pi_omgDf(2608.7903141574/36525, D0, fday);
    F[6] = -3.107038610179586 + mod2pi_omgDf(1021.3285546211/36525, D0, fday);
    F[7] = 1.753470314 + mod2pi_omgDf(628.3075849991/36525, D0, fday);
    F[8] = -0.0797043941795863 + mod2pi_omgDf(334.06124267/36525, D0, fday);
    F[9] = 0.599546497 + mod2pi_omgDf(52.9690962641/36525, D0, fday);
    F[10] = 0.874016757 + mod2pi_omgDf(21.329910496/36525, D0, fday);
    F[11] = -0.8018914351795861 + mod2pi_omgDf(7.4781598567/36525, D0, fday);
    F[12] = -0.9712990201795861 + mod2pi_omgDf(3.8133035638/36525, D0, fday);
    F[13] = mod2pi(0.02438175*T + 5.38691e-6*T2);
    return F;
}
