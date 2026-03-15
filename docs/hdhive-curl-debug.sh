#!/bin/bash

# HDHive Checkin API Debug CURL
# 你可以直接复制下方命令到 Postman (Import -> Raw text) 或直接在 Terminal 运行。

curl --location --request POST 'https://hdhive.com/manager/account' \
--header 'Content-Type: text/plain;charset=UTF-8' \
--header 'Next-Action: 406e0e83ed93f56902b65d137f5f98bfb98187e837' \
--header 'X-CSRF-TOKEN: 026f9772-ee97-443d-a7d4-fdaea593068a' \
--header 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' \
--header 'Referer: https://hdhive.com/manager/account' \
--header 'Origin: https://hdhive.com' \
--header 'Accept: */*' \
--header 'Cookie: csrf_access_token=026f9772-ee97-443d-a7d4-fdaea593068a; token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxNjkzOSwidXNlcm5hbWUiOiIiLCJpc3MiOiJIREhpdmUiLCJleHAiOjE3NzQxNTY3MTAsIm5iZiI6MTc3MzI5MjcxMCwiaWF0IjoxNzczMjkyNzEwfQ.r5qQnK_FS69Tu3PlGwU_ofU6HkQJjfJmV67rPHFTvAw' \
--data-raw '0:[]'
