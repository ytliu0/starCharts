# Star Charts

This package contains two HTML pages [local star charts](https://ytliu0.github.io/starCharts/) and [equatorial star charts](https://ytliu0.github.io/starCharts/chartGCRS.html). 

The [local star charts](https://ytliu0.github.io/starCharts/) webpage uses the computer's clock to obtain the current local time and then uses it to calculate the local sidereal times and plot star charts on two locations. 

The [equatorial star charts](https://ytliu0.github.io/starCharts/chartGCRS.html) webpage uses the computer's clock to obtain the current time and plot star charts showing the positions of the Sun, Moon, planets and stars on three star charts based on the equatorial coordinate system associated with J2000.0 mean equator and equinox. 

All calculations are done using JavaScript. The physics and mathematics involved in creating the star charts is explained briefly in this [pdf document](https://ytliu0.github.io/starCharts/docs/star_charts.pdf).

## Files:

- index.html: HTML page for the local star charts. 
- chartGCRS.html: HTML page for the equatorial star charts.
- Constellations.html: HTML page showing a table of the names and abbreviations of the 88 constellations.
- src: folder that contains the javascript functions used by the webpages. See the README file in that folder for more detailed information.
- sidereal.css: style file for both sidereal.html and chartGCRS.html
- core_min.js: combine dateAndTime.js, brightStars.js, milkyWay.js, precession.js and SunMoonPlanets.js in the src folder
- sseph_min.js: combine MoonElpMpp02DE.js, Mercury.js, Venus.js, Earth.js, Mars.js, Jupiter.js, Saturn.js, Uranus.js, Neptune.js and planetPosVSOP87.js in the src folder
- sidereal_min.js: combine sidereal.js, animation.js and riseSetTimes.js in the src folder
- docs/star_charts.pdf: pdf document describes the physics and mathematics involved in the calculations on the two webpages.
- docs/star_charts.tex: LaTeX file for docs/star_charts.pdf.
- docs/*.jpg: jpg files of the figures in docs/star_charts.pdf.
