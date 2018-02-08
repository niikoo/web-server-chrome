@echo off
REM yarn global add vulcanize crisper
echo Running vulcanize
call vulcanize --inline-scripts --inline-css --strip-comments elements/elements.html --out-html tmp
echo Running crisper
call crisper --source tmp --html build.html --js build.js
DEL tmp
