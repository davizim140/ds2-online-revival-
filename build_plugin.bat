@echo off
setlocal EnableExtensions

set "OUTNAME=DS2OnlineRevival"
set "SOURCEFILE=plugin\ds2_plugin.cpp"
set "OBJECTFILE=build\ds2_plugin.obj"
set "BUILD_DIR=build"

if not defined XEDK (
    echo ERROR: XEDK is not defined.
    exit /b 1
)

set "BINARYPATH=%XEDK%\bin\win32"
set "INCLUDE=%XEDK%\include\xbox"
set "LIB=%XEDK%\lib\xbox"

if not exist "%BINARYPATH%\cl.exe" exit /b 1
if not exist "%BINARYPATH%\link.exe" exit /b 1
if not exist "%BINARYPATH%\imagexex.exe" exit /b 1
if not exist "%SOURCEFILE%" (
    echo ERROR: Source file missing: %SOURCEFILE%
    exit /b 1
)

if not exist "%BUILD_DIR%" mkdir "%BUILD_DIR%"

echo [1/3] Compiling PowerPC object...
"%BINARYPATH%\cl.exe" /c /Zi /nologo /W3 /WX- /Ox /Os /D NDEBUG /D _XBOX /GF /Gm- /MT /GS- /Gy /fp:fast /fp:except- /Zc:wchar_t /Zc:forScope /GR- /openmp- /Fo"%BUILD_DIR%\\" /Fd"%BUILD_DIR%\\" /FI"%XEDK%\include\xbox\xbox_intellisense_platform.h" /TP "%SOURCEFILE%"
if errorlevel 1 exit /b 1
if not exist "%OBJECTFILE%" (
    echo ERROR: Expected object missing: %OBJECTFILE%
    exit /b 1
)

echo [2/3] Linking Xbox 360 DLL...
"%BINARYPATH%\link.exe" /ERRORREPORT:PROMPT /OUT:"%BUILD_DIR%\%OUTNAME%.exe" /INCREMENTAL:NO /NOLOGO xapilib.lib xboxkrnl.lib /MANIFESTUAC:"level='asInvoker' uiAccess='false'" /DEBUG /PDB:"%BUILD_DIR%\%OUTNAME%.pdb" /STACK:"262144","262144" /OPT:REF /OPT:ICF /TLBID:1 /RELEASE /IMPLIB:"%BUILD_DIR%\%OUTNAME%.lib" "%OBJECTFILE%" /ignore:4089 /dll /entry:"_DllMainCRTStartup" /ALIGN:128,4096 /XEX:NO
if errorlevel 1 exit /b 1
if not exist "%BUILD_DIR%\%OUTNAME%.exe" exit /b 1

echo [3/3] Packaging DashLaunch XEXDLL...
"%BINARYPATH%\imagexex.exe" /nologo /config:"xex.xml" /out:"%OUTNAME%.xex" "%BUILD_DIR%\%OUTNAME%.exe"
if errorlevel 1 exit /b 1
if not exist "%OUTNAME%.xex" exit /b 1

echo BUILD SUCCESS: %OUTNAME%.xex
exit /b 0
