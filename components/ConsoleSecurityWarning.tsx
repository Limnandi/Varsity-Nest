"use client"

import { useEffect } from "react"

export default function ConsoleSecurityWarning() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Store original console methods
    const originalLog = console.log
    const originalWarn = console.warn
    const originalError = console.error
    const originalInfo = console.info
    const originalDebug = console.debug
    
    // Function to display security warning
    const displaySecurityWarning = () => {
      console.clear()
      
      const stopStyle = "font-size: 32px; font-weight: bold; color: #ff0000; line-height: 1.5; padding: 10px 0;"
      
      originalLog(
        "%cStop!",
        stopStyle
      )
      originalLog(
        "This is a browser feature intended for developers. If someone told you to copy and paste something here to enable a Varsity Nest feature or \"hack\" someone's account, it is a scam and will give them access to your Varsity Nest account.\n\nContact us at scamalert@varsitynest.space to report what happened exactly."
      )
    }
    
    // Override console methods to suppress all other messages
    console.log = function(..._args: any[]) {
      displaySecurityWarning()
    }
    
    console.warn = function(..._args: any[]) {
      displaySecurityWarning()
    }
    
    console.error = function(..._args: any[]) {
      displaySecurityWarning()
    }
    
    console.info = function(..._args: any[]) {
      displaySecurityWarning()
    }
    
    console.debug = function(..._args: any[]) {
      displaySecurityWarning()
    }
    
    // Make console execution annoying by adding debugger statements
    // This will pause execution if dev tools are open
    const annoyConsole = () => {
      try {
        // This will pause if dev tools are open
        // eslint-disable-next-line no-debugger
        debugger
      } catch (e) {
        // Ignore errors
      }
    }
    
    // Override common functions that might be used maliciously
    const originalEval = window.eval
    window.eval = function(...args: any[]) {
      displaySecurityWarning()
      annoyConsole()
      return originalEval.apply(this, args as [string])
    }
    
    // Override Function constructor (another way to execute code)
    const originalFunction = window.Function
    window.Function = function(this: any, ...args: any[]) {
      displaySecurityWarning()
      annoyConsole()
      return originalFunction.apply(this, args as string[])
    } as any
    
    // Detect dev tools opening (not 100% reliable but helps)
    let devToolsOpen = false
    const detectDevTools = () => {
      const threshold = 160
      if (
        window.outerHeight - window.innerHeight > threshold ||
        window.outerWidth - window.innerWidth > threshold
      ) {
        if (!devToolsOpen) {
          devToolsOpen = true
          displaySecurityWarning()
          annoyConsole()
        }
      } else {
        devToolsOpen = false
      }
    }
    
    // Display security warning immediately
    displaySecurityWarning()
    
    // Check for dev tools periodically
    let checkConsole: NodeJS.Timeout | null = null
    let checkDevTools: NodeJS.Timeout | null = null
    
    if (typeof window !== 'undefined') {
      checkConsole = setInterval(() => {
        displaySecurityWarning()
      }, 1000)
      
      checkDevTools = setInterval(() => {
        detectDevTools()
      }, 500)
    }
    
    // Make it harder to access window object properties
    // Override common property access patterns
    const protectWindow = () => {
      try {
        // Make it harder to access localStorage/sessionStorage via console
        const originalLocalStorage = window.localStorage
        Object.defineProperty(window, 'localStorage', {
          get: function() {
            displaySecurityWarning()
            return originalLocalStorage
          },
          configurable: false
        })
        
        const originalSessionStorage = window.sessionStorage
        Object.defineProperty(window, 'sessionStorage', {
          get: function() {
            displaySecurityWarning()
            return originalSessionStorage
          },
          configurable: false
        })
      } catch (e) {
        // Some browsers may not allow this
      }
    }
    
    protectWindow()
    
    // Return cleanup function
    return () => {
      if (checkConsole) {
        clearInterval(checkConsole)
      }
      if (checkDevTools) {
        clearInterval(checkDevTools)
      }
      // Restore original methods
      console.log = originalLog
      console.warn = originalWarn
      console.error = originalError
      console.info = originalInfo
      console.debug = originalDebug
      window.eval = originalEval
      window.Function = originalFunction
    }
  }, [])

  // This component doesn't render anything in the UI
  return null
}

