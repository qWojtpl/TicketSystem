class Debug {
    static headElement = document.querySelector('head');
    static windowInterval;

    static Setup()
    {
        Debug.headElement.innerHTML = Debug.headElement.innerHTML + "<style>#ts_debug { z-index:128;position:fixed;top:0%;left:0%;width:fit-content;height:fit-content;color:white;background-color:rgba(0,0,0,0.5);font-size:28px}</style>";
        document.querySelector('body').innerHTML = document.querySelector('body').innerHTML + '<div id="ts_debug"><div id="ts_debug_window"></div><div id="ts_debug_agent"></div></div>';
        return true;
    }

    static RegisterDebug(typeOfDebug)
    {
        switch(typeOfDebug)
        {
            case "windowSize":
                Debug.windowInterval = setInterval(function() {
                    document.getElementById('ts_debug_window').innerHTML = window.innerWidth + "/" + window.innerHeight;
                }, 1);
                break;
            case "agent":
                document.getElementById('ts_debug_agent').innerHTML = window.navigator.userAgent;
                break;
        }
    }

    static RemoveDebug(typeOfDebug)
    {
        switch(typeOfDebug)
        {
            case "windowSize":
                clearInterval(Debug.windowInterval);
                document.getElementById('ts_debug_window').innerHTML = "";
                break;
            case "agent":
                document.getElementById('ts_debug_agent').innerHTML = "";
                break;
        }
    }
}

Debug.Setup();