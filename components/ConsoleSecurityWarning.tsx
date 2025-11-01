"use client"

import { useEffect } from "react"

export default function ConsoleSecurityWarning() {
  useEffect(() => {
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
      // Suppress all other log messages
    }
    
    console.warn = function(..._args: any[]) {
      displaySecurityWarning()
      // Suppress all other warn messages
    }
    
    console.error = function(..._args: any[]) {
      displaySecurityWarning()
      // Suppress all other error messages
    }
    
    console.info = function(..._args: any[]) {
      displaySecurityWarning()
      // Suppress all other info messages
    }
    
    console.debug = function(..._args: any[]) {
      displaySecurityWarning()
      // Suppress all other debug messages
    }
    
    // Display security warning immediately
    displaySecurityWarning()
    
    // Also display when console is opened (for browsers that support it)
    let checkConsole: NodeJS.Timeout | null = null
    if (typeof window !== 'undefined') {
      checkConsole = setInterval(() => {
        // This helps ensure the warning shows when dev tools are opened
        displaySecurityWarning()
      }, 1000)
    }
    
    // Return cleanup function
    return () => {
      if (checkConsole) {
        clearInterval(checkConsole)
      }
      // Restore original console methods
      console.log = originalLog
      console.warn = originalWarn
      console.error = originalError
      console.info = originalInfo
      console.debug = originalDebug
    }
  }, [])

  // This component doesn't render anything in the UI
  return null
}

