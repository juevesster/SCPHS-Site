@echo off
title SCPHS Security Command Center
taskkill /F /IM vlc.exe >nul 2>&1
echo Starting cameras...

:: CAMERA 1: Automotive (.71)
start "" "C:\Program Files (x86)\VideoLAN\VLC\vlc.exe" rtsp://Room102:scphs123@192.168.100.71:554/stream1 --rtsp-tcp --no-one-instance
timeout /t 5 >nul

:: CAMERA 2: Agriculture (.69)
start "" "C:\Program Files (x86)\VideoLAN\VLC\vlc.exe" rtsp://Room101:scphs123@192.168.100.69:554/stream1 --rtsp-tcp --no-one-instance
timeout /t 5 >nul

:: CAMERA 3: Computer Lab (.151)
start "" "C:\Program Files (x86)\VideoLAN\VLC\vlc.exe" rtsp://AdminICT:scphs123@192.168.100.151:554/stream1 --rtsp-tcp --no-one-instance
timeout /t 5 >nul

:: CAMERA 4: Room 302-303 (.72)
start "" "C:\Program Files (x86)\VideoLAN\VLC\vlc.exe" rtsp://Room302:scphs123@192.168.100.72:554/stream1 --rtsp-tcp --no-one-instance

exit